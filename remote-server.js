require("dotenv").config({ quiet: true })
const rateLimit = require("express-rate-limit")
const express = require("express")
const { execFile, execFileSync } = require("child_process")
const { randomUUID } = require("crypto")
const path = require("path")
const cron = require("node-cron")
const cors = require("cors")

const buildPrompt = require("./utils/prompt")
const detectSubject = require("./router")
const {
  detectSubjectFromText,
  formatSubjectLabel,
  buildSubjectsMessage,
  getSubjectSpecialistFamily,
  getSupportedSubjectsForUser
} = require("./utils/subjectCatalog")
const {
  buildOpenClawAgentConfig,
  listRecommendedAgentIds,
  isMathReasoningQuestion,
  isScienceReasoningQuestion,
  pickTaskFallbackAgentId,
  resolveOpenClawAgentId
} = require("./utils/openclawAgents")

const { getCachedAnswer, saveAnswer } = require("./utils/cacheManager")
const { addToHistory, getConversationContext, getLastQuestion } = require("./utils/memoryManager")
const { getDashboardStats, getAllUsers, getUsersCsv } = require("./utils/dbReader")
const { extractTextFromImage, solveImageWithAI } = require("./utils/imageSolver")
const {
  buildFormulaResponse,
  buildNcertResponse,
  buildPyqResponse,
  findFormulaEntry,
  findNcertEntry,
  findPyqEntry
} = require("./utils/contentLibrary")
const {
  getMockTestSession,
  saveMockTestSession,
  clearMockTestSession,
  saveMockTestResult,
  getOrCreateStudyPlan,
  regenerateStudyPlan,
  buildStudyPlanMessage,
  buildStudyPlanSummaryLine,
  suggestMockTestTopic,
  buildMockTestSummaryLine
} = require("./utils/phase4Manager")
const premiumUpgrades = require("./utils/premiumUpgrades")
const {
  buildParentReport,
  saveParentReport,
  getPendingWeeklyParentReports
} = require("./utils/parentReportManager")

const parentReport = require("./utils/parentReport")
const studyBuddy = require("./utils/studyBuddy")
const quickRevisionCards = require("./utils/quickRevisionCards")

const fm = require("./utils/featureManager")
const af = require("./utils/advancedFeatures")
const engagement = require("./utils/engagementHooks")
const {
  getGamificationState,
  awardActivity,
  buildStreakMessage,
  buildRewardsMessage,
  buildBadgesMessage,
  buildLeaderboardMessage,
  getWeeklyLeaderboard,
  buildStreakSummaryLine,
  buildRewardFooter
} = require("./utils/gamificationManager")
const {
  getMissionState,
  getAllMissions,
  getOrCreateDailyMission,
  regenerateDailyMission,
  completeDailyMission,
  markMissionReminderSent,
  buildMissionMessage,
  buildMissionSummaryLine
} = require("./utils/missionManager")
const {
  getDateKey,
  getChallengeState,
  saveDailyChallenge,
  clearDailyChallenge,
  isChallengeDueForSend,
  markChallengeSent,
  buildChallengeMessage,
  buildChallengeSummaryLine,
  scheduleWeakTopicReview,
  recordTopicPractice,
  getDueReviewReminders,
  getDueReviewsForUser,
  markReviewReminderSent,
  buildReviewReminderMessage,
  buildReviewSummaryLine,
  getPendingMissionReminders
} = require("./utils/studyNudgeManager")
const { recordActivity: kairosRecordActivity, buildAutoDreamMorningInsight: getAutoDreamInsight } = (() => {
  try { return { recordActivity: require("./utils/kairosEngine").recordActivity, buildAutoDreamMorningInsight: require("./utils/autoDreamEngine").buildAutoDreamMorningInsight } }
  catch (e) { return { recordActivity: () => {}, buildAutoDreamMorningInsight: () => null } }
})()
const { handleVoiceMessage } = require("./utils/voiceHandler")
const {
  createClass, getTeacherClasses, joinClass, getClassMembers, getStudentClasses,
  saveClassQuiz, getClassLeaderboard, isVerifiedTeacher,
  requestTeacherVerification, approveTeacher, rejectTeacher, getPendingTeacherRequests
} = require("./utils/classroomManager")
const { getTopicContextForPrompt } = require("./utils/topicKnowledgeBase")
const {
  getActiveQuizSession,
  getActiveAnswerReviewSession,
  getActiveHomeworkSession,
  saveQuizSession,
  clearQuizSession,
  saveAnswerReviewSession,
  clearAnswerReviewSession,
  saveHomeworkSession,
  clearHomeworkSession,
  recordStudyQuestion,
  recordQuizAttempt,
  recordAnswerReview,
  getMasteryState,
  getSuggestedDifficulty,
  buildMasteryContext,
  buildProgressMessage
} = require("./utils/masteryManager")
const {
  getUser,
  loadUsers,
  isProfileComplete,
  getOnboardingState,
  startOnboarding,
  handleOnboardingReply,
  formatProfile,
  saveTeachingPacePreference,
  saveSubjectInterests,
  startDeleteProfile,
  getReminderCandidates,
  markReminderSent
} = require("./utils/onboardingManager")
const {
  getPlanCatalog,
  getAccessProfile,
  canUseTutorPrompt,
  recordTutorPromptUsage,
  FREE_DAILY_PROMPT_LIMIT,
  hasPremiumAccessWithTrial,
  setReferral,
  getReferralSummary,
  buildReferralLink,
  buildReferralShareText,
  isReferralReminderDue,
  markReferralReminderSent,
  isPremiumReminderDue,
  markPremiumReminderSent,
  activateSubscription,
  normalizePhone,
  activateTrialSubscription,
  getTrialStatus
} = require("./utils/subscriptionManager")
const {
  createPurchaseIntent,
  markLatestPaymentSubmitted,
  markPaymentOrderConfirmed,
  markPaymentOrderRejected,
  listSubmittedPaymentOrders,
  getPaymentSummary
} = require("./utils/paymentManager")
const { recordAnswerQualityEvent } = require("./utils/answerQualityManager")
const { recordInteractionEvent } = require("./utils/interactionAnalytics")
const { runScheduledTask } = require("./utils/scheduledTaskManager")
const { buildDiagnosticContext, buildTeacherNextStep } = require("./utils/teachingIntelligence")
const { planAgentAction, buildAgentNextStep, buildAgentRecoveryPlan } = require("./utils/agentOrchestrator")
// ── New Smart Teacher Features ──
const aiAnswerEvaluator = require("./utils/aiAnswerEvaluator")
const reverseQuiz = require("./utils/reverseQuiz")
const conceptMapGen = require("./utils/conceptMapGenerator")
const conceptComparator = require("./utils/conceptComparator")
const studyGoalTracker = require("./utils/studyGoalTracker")
const quickRevision = require("./utils/quickRevision")
const srsFlashcards = require("./utils/srsFlashcards")
const { buildAgentMemoryContext, recordWeakness, recordMisconception, recordStrength, recordObservation, cleanupOldInsights } = require("./utils/agentMemory")
const { shouldInitiateSocratic, createSocraticSession, isSocraticSessionActive, clearSocraticSession, updateSocraticStage, recordSocraticExchange, getSocraticExchanges, buildSocraticPrompt } = require("./utils/socraticEngine")
const { analyzeEmotion, getTeachingToneDirective, getEmotionalContextForPrompt, recordEmotionalState, buildEmotionalSummary } = require("./utils/emotionalEngine")
const { shouldSendProactiveLesson, buildProactiveLesson, recordProactiveLessonSent } = require("./utils/proactiveTeaching")
const { getTopicRelevantContext } = require("./utils/memoryManager")
const { generateFollowUp } = require("./utils/smartFollowUp")

// ── Smart Teacher Features ──
const stf = require("./utils/smartTeacherFeatures")
const dailyStudyReport = require("./utils/dailyStudyReport")
const speedMath = require("./utils/speedMath")
const currentAffairsQuiz = require("./utils/currentAffairsQuiz")
const examPlanner = require("./utils/examPlanner")
const voiceReplyGenerator = require("./utils/voiceReplyGenerator")
const motivationalQuotes = require("./utils/motivationalQuotes")
const pomodoroTimer = require("./utils/pomodoroTimer")
const pyqFinder = require("./utils/pyqFinder")
const syllabusTracker = require("./utils/syllabusTracker")
const doubtClearing = require("./utils/doubtClearing")
const practiceGenerator = require("./utils/practiceGenerator")
const conceptQuiz = require("./utils/conceptQuiz")
const compareConcepts = require("./utils/compareConcepts")
const mnemonicMaker = require("./utils/mnemonicMaker")
const aiNotesGenerator = require("./utils/aiNotesGenerator")
const studyReminder = require("./utils/studyReminder")
const achievementSystem = require("./utils/achievementSystem")
const enhancedDailyChallenge = require("./utils/enhancedDailyChallenge")
const formulaQuickRef = require("./utils/formulaQuickRef")
const revisionCardsEnhanced = require("./utils/revisionCardsEnhanced")
const collaborativeClassroom = require("./utils/collaborativeClassroom")
const dailyTips = require("./utils/dailyTips")
const examCountdown = require("./utils/examCountdown")
const studyAnalytics = require("./utils/studyAnalytics")
const careerGuidance = require("./utils/careerGuidance")
const flashcardSystem = require("./utils/flashcardSystem")
const timetableGenerator = require("./utils/timetableGenerator")
const mockTestGenerator = require("./utils/mockTestGenerator")
const quickSummary = require("./utils/quickSummary")
const parentReportGen = require("./utils/parentReportGen")
const examStrategy = require("./utils/examStrategy")
const quickNotes = require("./utils/quickNotes")
const moodTracker = require("./utils/moodTracker")
const performanceReport = require("./utils/performanceReport")
const whiteboardMode = require("./utils/whiteboardMode")
const vocabularyBuilder = require("./utils/vocabularyBuilder")
const factOfTheDay = require("./utils/factOfTheDay")
const mistakeNotebook = require("./utils/mistakeNotebook")
const vivaSimulator = require("./utils/vivaSimulator")
// Structured logging
function logStructured(level, comp, msg, meta) {
  var ts = new Date().toISOString()
  var entry = {t:ts, l:level, c:comp||"app", m:msg}
  if(meta) entry.d = meta
  var line = JSON.stringify(entry)
  if(level==="ERROR") console.error(line)
  else if(level==="WARN") console.warn(line)
  else console.log(line)
}




const { verifyWebhook, handleWebhook, sendWhatsAppMessage, sendWhatsAppResponse, sendWhatsAppDocument, getUserGuideMediaId } = require("./webhook")
const { checkpointWAL, recordAgentExecution, getLatestAgentExecution, getVivaSession, deleteVivaSession } = require("./utils/sqliteStore")

// Ensure openclaw binary is in PATH for PM2/child_process
;(function ensureOpenClawPath() {
  const { execSync } = require("child_process")
  try {
    const openclawPath = execSync("which openclaw 2>/dev/null || dirname $(readlink -f $(which openclaw 2>/dev/null) 2>/dev/null) 2>/dev/null", { encoding: "utf8" }).trim()
    if (openclawPath && !process.env.PATH.includes(openclawPath.replace(/\/openclaw$/, ""))) {
      const binDir = openclawPath.replace(/\/openclaw$/, "")
      process.env.PATH = binDir + ":" + process.env.PATH
      console.log("[PATH] Added openclaw dir to PATH:", binDir)
    }
  } catch (e) {
    // Fallback: add common binary paths
    const commonPaths = ["/usr/local/bin", "/usr/bin"]
    for (const p of commonPaths) {
      if (!process.env.PATH.includes(p)) {
        process.env.PATH = p + ":" + process.env.PATH
      }
    }
  }
})()

process.on('uncaughtException' , (err) => { console.error('[UNCAUGHT EXCEPTION]' , err.message, err.stack || '' ) })
process.on('unhandledRejection' , (reason) => { console.error('[UNHANDLED REJECTION]' , reason) })

const app = express()
app.set("trust proxy", 1)
// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()")
  res.removeHeader("X-Powered-By")
  res.removeHeader("Server")
  next()
})

// Rate limiting to prevent abuse
const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false
})

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "API rate limit exceeded.",
  standardHeaders: true,
  legacyHeaders: false
})


const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please wait 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false
})
const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Health check rate limit exceeded.",
  standardHeaders: true,
  legacyHeaders: false
})

app.use(express.json({
  limit: "1mb",
  verify(req, _res, buf) {
    req.rawBody = Buffer.from(buf)
  }
}))
const allowedCorsOrigins = String(process.env.ALLOWED_CORS_ORIGINS || process.env.DASHBOARD_URL || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
const dashboardCors = cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true)
    }

    if (
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
      allowedCorsOrigins.includes(origin)
    ) {
      return callback(null, true)
    }

    return callback(new Error("CORS origin not allowed"))
  }
})
app.use(express.static(path.join(__dirname, "public")))
app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"))
})

app.get("/version", (req, res) => {
  try {
    var lineCount = 0
    try { lineCount = require("fs").readFileSync("/root/whatsapp-bot/server.js", "utf8").split("\n").length } catch(e) {}
    res.json({
      version: "6.0",
      batch: 5,
      features: 55,
      newFeatures: ["Formula Quick Reference", "Study Goal Tracker", "Enhanced Revision Cards", "Collaborative Classroom", "Daily Study Tips", "Exam Countdown Alerts"],
      agents: 22,
      utilities: 95,
      serverLines: lineCount,
      deployedAt: "2026-04-09T19:00:00Z"
    })
  } catch(e) {
    res.json({ version: "4.0", batch: 4, error: e.message })
  }
})

  app.get("/health", healthRateLimiter, (req, res) => {
  const snapshot = getHealthSnapshot({ includeSensitiveDetails: isLoopbackRequest(req) })
  res.status(snapshot.status === "ok" ? 200 : 503).json(snapshot)
})

app.get("/ready", healthRateLimiter, (req, res) => {
  const snapshot = getHealthSnapshot({ includeSensitiveDetails: isLoopbackRequest(req) })
  if (snapshot.status !== "ok") {
    return res.status(503).json(snapshot)
  }

  return res.json({ status: "ready" })
})

const PORT = process.env.PORT || 3000
const DASHBOARD_API_KEY = process.env.DASHBOARD_API_KEY || ""
const AGENT_API_KEY = process.env.AGENT_API_KEY || ""
const ADMIN_PHONES = new Set(
  String(process.env.ADMIN_PHONES || "")
    .split(",")
    .map((value) => normalizePhone(value))
    .filter(Boolean)
)
const OPENCLAW_THINKING = process.env.OPENCLAW_THINKING || "minimal"
const OPENCLAW_THINKING_CHEAP = process.env.OPENCLAW_THINKING_CHEAP || "off"
const ANSWER_STYLE_VERSION = "premium-v18"

// ─── Feature: Helper Functions for All New Features ───
function getUserPreference(phone, key, defaultValue = null) {
  try { const { get } = require("./utils/sqliteStore"); const row = get("SELECT pref_value FROM user_preferences WHERE phone = ? AND pref_key = ?", phone, key); return row ? row.pref_value : defaultValue } catch { return defaultValue }
}

function setUserPreference(phone, key, value) {
  try { const { run } = require("./utils/sqliteStore"); run("INSERT INTO user_preferences (phone, pref_key, pref_value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(phone, pref_key) DO UPDATE SET pref_value = excluded.pref_value, updated_at = excluded.updated_at", phone, key, String(value), new Date().toISOString()) } catch {}
}

function bookmarkAnswer(phone, question, answer, subject, topic) {
  try { const { run } = require("./utils/sqliteStore"); run("INSERT INTO user_bookmarks (phone, question, answer, subject, topic, bookmarked_at) VALUES (?, ?, ?, ?, ?, ?)", phone, question.slice(0, 500), answer.slice(0, 2000), subject || "", topic || "", new Date().toISOString()) } catch {}
}

function getUserBookmarks(phone, subject) {
  try { const { all } = require("./utils/sqliteStore"); let q = "SELECT * FROM user_bookmarks WHERE phone = ?"; const p = [phone]; if (subject) { q += " AND (subject LIKE ? OR topic LIKE ?)"; p.push("%" + subject + "%", "%" + subject + "%") } q += " ORDER BY bookmarked_at DESC LIMIT 10"; return all(q, ...p) } catch { return [] }
}

function saveUserFeedback(phone, questionPreview, rating) {
  try { const { run } = require("./utils/sqliteStore"); run("INSERT INTO user_feedback (phone, question_preview, rating, created_at) VALUES (?, ?, ?, ?)", phone, (questionPreview || "").slice(0, 200), rating, new Date().toISOString()) } catch {}
}

function setExamCountdown(phone, examName, examDate, subject) {
  try { const { run } = require("./utils/sqliteStore"); run("INSERT INTO exam_countdowns (phone, exam_name, exam_date, subject, created_at) VALUES (?, ?, ?, ?, ?)", phone, examName, examDate, subject || "", new Date().toISOString()) } catch {}
}

function getExamCountdowns(phone) {
  try { const { all } = require("./utils/sqliteStore"); return all("SELECT * FROM exam_countdowns WHERE phone = ? ORDER BY exam_date ASC LIMIT 5", phone) } catch { return [] }
}

function hasCelebratedMilestone(phone, milestoneKey) {
  try { const { get } = require("./utils/sqliteStore"); return !!get("SELECT 1 FROM milestone_events WHERE phone = ? AND milestone_key = ?", phone, milestoneKey) } catch { return false }
}

function celebrateMilestone(phone, milestoneKey, milestoneValue) {
  try { const { run } = require("./utils/sqliteStore"); run("INSERT OR IGNORE INTO milestone_events (phone, milestone_key, milestone_value, celebrated_at) VALUES (?, ?, ?, ?)", phone, milestoneKey, milestoneValue, new Date().toISOString()) } catch {}
}

function saveFlashcardSession(phone, subject, topic, cardsJson) {
  try { const { run } = require("./utils/sqliteStore"); const cards = JSON.parse(cardsJson); run("INSERT INTO flashcard_sessions (phone, subject, topic, cards_json, current_index, total_cards, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET subject=excluded.subject, topic=excluded.topic, cards_json=excluded.cards_json, current_index=0, total_cards=excluded.total_cards, updated_at=excluded.updated_at", phone, subject || "", topic || "", cardsJson, cards.length, new Date().toISOString(), new Date().toISOString()) } catch {}
}

function getFlashcardSession(phone) {
  try { const { get } = require("./utils/sqliteStore"); return get("SELECT * FROM flashcard_sessions WHERE phone = ?", phone) } catch { return null }
}

function advanceFlashcard(phone) {
  try { const { run } = require("./utils/sqliteStore"); run("UPDATE flashcard_sessions SET current_index = current_index + 1, updated_at = ? WHERE phone = ?", new Date().toISOString(), phone) } catch {}
}

function clearFlashcardSession(phone) {
  try { const { run } = require("./utils/sqliteStore"); run("DELETE FROM flashcard_sessions WHERE phone = ?", phone) } catch {}
}



function getRandomStudyTip() {
  const tips = ["Feynman Technique: Try explaining a concept as if teaching a 5-year-old. If you can explain it simply, you truly understand it.", "Active Recall: Close your notes and try to recall what you learned. Testing yourself is more effective than re-reading!", "Spaced Repetition: Review material at increasing intervals (1 day, 3 days, 7 days, 14 days) for long-term memory.", "Pomodoro Technique: Study for 25 minutes, then take a 5-minute break. After 4 sessions, take a 15-minute break.", "Teach Someone: The best way to learn is to teach. Explain concepts to friends or family members.", "Practice Problems: Do not just read solutions. Solve problems yourself first, then check your approach.", "Mind Mapping: Draw visual diagrams connecting concepts. This helps you see relationships between ideas.", "Chunking: Break complex topics into smaller, manageable chunks. Master each chunk before moving to the next.", "Interleaving: Mix different subjects or problem types in one study session. This improves your ability to apply knowledge.", "Sleep Well: Your brain consolidates memories during sleep. A good night's sleep after studying improves retention by 40%."]
  return tips[Math.floor(Math.random() * tips.length)]
}

const PREMIUM_AGENT_ID = "premium-teacher"

const TEACHER_NAME = process.env.TEACHER_NAME || "Jesh"
const QUIZ_SESSION_MAX_AGE_MINUTES = Number(process.env.QUIZ_SESSION_MAX_AGE_MINUTES || 120)
const HOMEWORK_SESSION_MAX_AGE_MINUTES = Number(process.env.HOMEWORK_SESSION_MAX_AGE_MINUTES || 180)
const ANSWER_REVIEW_SESSION_MAX_AGE_MINUTES = Number(process.env.ANSWER_REVIEW_SESSION_MAX_AGE_MINUTES || 60)
const MOCK_TEST_SESSION_MAX_AGE_MINUTES = Number(process.env.MOCK_TEST_SESSION_MAX_AGE_MINUTES || 180)
const DAILY_CHALLENGE_MAX_AGE_MINUTES = Number(process.env.DAILY_CHALLENGE_MAX_AGE_MINUTES || 180)
const openclawAgentConfig = buildOpenClawAgentConfig(process.env)
const requiredEnvVars = [
  "WHATSAPP_ACCESS_TOKEN",
  "META_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID"
]

function parseOpenClawAgents(stdout) {
  const trimmed = String(stdout || "").trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed)
    const agentItems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.agents)
        ? parsed.agents
        : Array.isArray(parsed?.result)
          ? parsed.result
          : []

    return agentItems
      .map((item) => String(item?.id || item?.name || "").trim())
      .filter(Boolean)
  } catch (error) {
    return []
  }
}

function loadRegisteredOpenClawAgents() {
  try {
    const stdout = execFileSync("openclaw", ["agents", "list", "--json"], { encoding: "utf8" })
    return parseOpenClawAgents(stdout)
  } catch (error) {
    return []
  }
}

const startupStatus = {
  startedAt: new Date().toISOString(),
  missingEnv: requiredEnvVars.filter((name) => !process.env[name]),
  openclawAvailable: false,
  openclawError: null,
  registeredAgents: [],
  missingSpecialistAgents: [],
  openclawRouting: {
    teacher: openclawAgentConfig.teacher,
    research: openclawAgentConfig.research,
    notes: openclawAgentConfig.notes,
    practice: openclawAgentConfig.practice,
    reviewer: openclawAgentConfig.reviewer,
    reviewerReasoner: openclawAgentConfig.reviewerReasoner,
    foundational: openclawAgentConfig.foundational,
    language: openclawAgentConfig.language,
    math: openclawAgentConfig.math,
    mathReasoner: openclawAgentConfig.mathReasoner,
    mathPremium: openclawAgentConfig.mathPremium,
    science: openclawAgentConfig.science,
    scienceReasoner: openclawAgentConfig.scienceReasoner,
    sciencePremium: openclawAgentConfig.sciencePremium,
    social: openclawAgentConfig.social,
    commerce: openclawAgentConfig.commerce,
    stem: openclawAgentConfig.stem,
    coding: openclawAgentConfig.coding,
    health: openclawAgentConfig.health,
    law: openclawAgentConfig.law,
    professional: openclawAgentConfig.professional
  }
}

try {
  execFileSync("openclaw", ["--version"], { stdio: "ignore" })
  startupStatus.openclawAvailable = true
  startupStatus.registeredAgents = loadRegisteredOpenClawAgents()
  startupStatus.missingSpecialistAgents = listRecommendedAgentIds(openclawAgentConfig)
    .filter((agentId) => agentId !== openclawAgentConfig.teacher)
    .filter((agentId) => !startupStatus.registeredAgents.includes(agentId))
} catch (error) {
  startupStatus.openclawError = error.message
}

function shouldUseConversationContext(question) {
  const normalized = String(question || "").toLowerCase()
  const followUpSignals = [
    "this",
    "that",
    "it",
    "these",
    "those",
    "again",
    "continue",
    "more",
    "explain more",
    "why",
    "how so",
    "previous",
    "above",
    "same",
    "next step"
  ]

  if (!normalized.trim()) {
    return false
  }

  if (looksLikeDirectMathQuestion(normalized)) {
    return false
  }

  if (/(twice|thrice|more than|less than|total|share|receives|gets|find|solve|calculate|what is|explain)\b/.test(normalized)) {
    return false
  }

  return followUpSignals.some((signal) => normalized.includes(signal))
}

function getHealthSnapshot(options = {}) {
  const snapshot = {
    status: startupStatus.missingEnv.length === 0 && startupStatus.openclawAvailable ? "ok" : "degraded",
    startedAt: startupStatus.startedAt,
    uptimeSeconds: Math.round(process.uptime())
  }

  if (!options.includeSensitiveDetails) {
    return snapshot
  }

  return {
    ...snapshot,
    missingEnv: startupStatus.missingEnv,
    openclawAvailable: startupStatus.openclawAvailable,
    openclawError: startupStatus.openclawError,
    registeredAgents: startupStatus.registeredAgents,
    missingSpecialistAgents: startupStatus.missingSpecialistAgents,
    openclawRouting: startupStatus.openclawRouting
  }
}

function trackInteraction(event = {}) {
  try {
    recordInteractionEvent(event)
  } catch (error) {
    console.error("[Interaction Analytics Error]", error.message)
  }
}

function getPremiumFeatureNameForTool(toolId = "") {
  const mapping = {
    quiz: "AI Quiz Practice",
    mock_test: "Mock Tests",
    homework_coach: "Homework Coach",
    answer_review: "Answer Review"
  }

  return mapping[toolId] || null
}

function isSimpleMathTeachingQuestion(question = "", subject = "", user = {}) {
  if (!isMathReasoningQuestion(subject, question, user)) {
    return false
  }

  const normalized = String(question || "").toLowerCase().trim()
  if (!normalized) {
    return false
  }

  if (/[a-z]\s*=|square root|sqrt|fraction|ratio|percentage|equation|algebra|geometry|perimeter|area|volume|trigonometry|calculus|coordinate|probability|statistics|mensuration/.test(normalized)) {
    return false
  }

  if (/^(what is|solve|find|calculate|work out)?\s*[-+*/x().\d\s?=]+$/.test(normalized)) {
    return true
  }

  if (/\b(twice|thrice|more than|less than|total|sum|share|shares|gets|receives|together|altogether)\b/.test(normalized)) {
    return true
  }

  return /\b(add|sum|plus|subtract|minus|multiply|times|divide|product|difference)\b/.test(normalized)
}

function pickThinkingLevel(answerMode, options = {}) {
  if (options.fastTrackMath) {
    return OPENCLAW_THINKING_CHEAP || "off"
  }

  if (options.channel === "whatsapp" && answerMode !== "detailed") {
    return OPENCLAW_THINKING_CHEAP || "off"
  }

  if (answerMode === "concise") {
    return OPENCLAW_THINKING_CHEAP
  }

  return OPENCLAW_THINKING
}

function buildOpenClawSessionId(options = {}) {
  const phonePart = String(options.phone || "anon").replace(/[^a-zA-Z0-9]/g, "")
  const taskPart = String(options.taskType || "turn").replace(/[^a-zA-Z0-9_-]/g, "")
  return `${phonePart || "anon"}-${taskPart || "turn"}-${randomUUID()}`
}

function looksLikeDirectMathQuestion(text = "") {
  const normalized = String(text || "").toLowerCase().trim()
  if (!normalized) {
    return false
  }

  if (/^(what is|solve|find|calculate|work out)?\s*[-+*/x().\d\s?=]+$/.test(normalized)) {
    return true
  }

  return /\b(add|sum|plus|subtract|minus|multiply|times|divide|product|difference|equation|algebra|geometry|perimeter|area|volume|fraction|ratio|percentage)\b/.test(
    normalized
  )
}

function extractSimpleArithmeticOperation(question = "") {
  const normalized = String(question || "").toLowerCase().replace(/\s+/g, " ").trim()
  if (!normalized) {
    return null
  }

  const symbolMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/x])\s*(-?\d+(?:\.\d+)?)/)
  if (symbolMatch) {
    return {
      left: Number(symbolMatch[1]),
      operator: symbolMatch[2] === "x" ? "*" : symbolMatch[2],
      right: Number(symbolMatch[3])
    }
  }

  const wordMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s+(plus|minus|times|multiplied by|divide by|divided by|add)\s+(-?\d+(?:\.\d+)?)/)
  if (!wordMatch) {
    return null
  }

  const operatorMap = {
    plus: "+",
    add: "+",
    minus: "-",
    times: "*",
    "multiplied by": "*",
    "divide by": "/",
    "divided by": "/"
  }

  return {
    left: Number(wordMatch[1]),
    operator: operatorMap[wordMatch[2]] || "+",
    right: Number(wordMatch[3])
  }
}

function buildSimpleArithmeticTeachingReply(question = "") {
  const operation = extractSimpleArithmeticOperation(question)
  if (!operation) {
    return null
  }

  const { left, operator, right } = operation
  let result = null
  let idea = "Think of the numbers as two groups that you combine or compare carefully."
  let howToThink = "Look at the sign, understand what it wants you to do, and then work one step at a time."
  let steps = []
  let confidenceTip = "Check the sign first, then do the operation slowly and neatly."
  let miniTry = "Try one similar question on your own."

  if (operator === "+") {
    result = left + right
    idea = "Addition means joining groups together to make one bigger total."
    howToThink = "Start with the first number and add the second number to it."
    steps = [
      `1. Start with ${left}.`,
      `2. Add ${right} more.`,
      `3. ${left} + ${right} = ${result}.`
    ]
    confidenceTip = "For addition, imagine two groups joining into one total group."
    miniTry = `What is ${left + 3} + ${Math.max(1, right - 1)}?`
  } else if (operator === "-") {
    result = left - right
    idea = "Subtraction means taking away or finding how much is left."
    howToThink = "Begin with the bigger amount and remove the second amount from it."
    steps = [
      `1. Start with ${left}.`,
      `2. Take away ${right}.`,
      `3. ${left} - ${right} = ${result}.`
    ]
    confidenceTip = "For subtraction, picture objects being taken away one group at a time."
    miniTry = `What is ${left + 5} - ${right}?`
  } else if (operator === "*") {
    result = left * right
    idea = "Multiplication is fast repeated addition."
    howToThink = `Think of ${left} groups with ${right} in each group.`
    steps = [
      `1. Make ${left} equal groups.`,
      `2. Put ${right} in each group.`,
      `3. ${left} x ${right} = ${result}.`
    ]
    confidenceTip = "Multiplication becomes easy when you imagine equal groups."
    miniTry = `What is ${left} x ${Math.max(2, right - 1)}?`
  } else if (operator === "/") {
    if (right === 0) {
      return null
    }
    result = left / right
    idea = "Division means sharing into equal groups."
    howToThink = `Ask yourself how many groups of ${right} fit into ${left}.`
    steps = [
      `1. Take the total ${left}.`,
      `2. Share it equally into groups of ${right}.`,
      `3. ${left} / ${right} = ${result}.`
    ]
    confidenceTip = "In division, check whether the answer makes sense by multiplying back."
    miniTry = `What is ${left + right} / ${right}?`
  }

  if (result === null || !Number.isFinite(result)) {
    return null
  }

  const displayOperator = operator === "*" ? "x" : operator

  return [
    `*Math Spotlight: Finding ${left} ${displayOperator} ${right}*`,
    "",
    "*Math Idea:*",
    idea,
    "",
    "*How to Think:*",
    howToThink,
    "",
    "*Steps:*",
    ...steps,
    "",
    "*Final Answer:*",
    `${left} ${displayOperator} ${right} = ${result}`,
    "",
    "*Confidence Tip:*",
    confidenceTip,
    "",
    "*Mini Try:*",
    miniTry,
    "",
    "*Quick Recap:*",
    `${left} ${displayOperator} ${right} gives ${result}.`
  ].join("\n")
}

function buildTwoPersonShareWordProblemReply(question = "") {
  const normalized = String(question || "").replace(/\s+/g, " ").trim()
  const lower = normalized.toLowerCase()

  const totalMatch = lower.match(/total(?: is| =)?\s*(?:rs\.?\s*)?(\d+)/i)
  if (!totalMatch) {
    return null
  }

  const total = Number(totalMatch[1])
  if (!Number.isFinite(total) || total <= 0) {
    return null
  }

  const twiceMatch = normalized.match(/\b([A-Za-z])\s+gets\s+twice\s+([A-Za-z])\b/i)
  const moreThanMatch = normalized.match(/\b([A-Za-z])\s+gets\s+(?:rs\.?\s*)?(\d+)\s+more than\s+([A-Za-z])\b/i)

  if (twiceMatch) {
    const first = twiceMatch[1].toUpperCase()
    const second = twiceMatch[2].toUpperCase()
    const secondValue = total / 3
    const firstValue = 2 * secondValue

    if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
      return null
    }

    return [
      "*Math Help: Word Problem*",
      "",
      "*Question in Easy Words:*",
      `We know that ${first} gets double of ${second}, and together they make ${total}. We have to find each amount.`,
      "",
      "*Simple Idea:*",
      `If one amount is twice the other, we can call the smaller amount x and the bigger amount 2x.`,
      "",
      "*Smart Method:*",
      `Take ${second} = x. Then ${first} = 2x. Now use the total to make one equation.`,
      "",
      "*Given:*",
      `- Total = ${total}`,
      `- ${first} = 2 × ${second}`,
      "",
      "*Steps:*",
      `1. Let ${second} = x.`,
      `2. Then ${first} = 2x.`,
      `3. Total means ${first} + ${second} = ${total}.`,
      `4. So, 2x + x = ${total}.`,
      `5. That gives 3x = ${total}.`,
      `6. Divide by 3: x = ${secondValue}.`,
      `7. Therefore ${second} = ${secondValue} and ${first} = ${firstValue}.`,
      "",
      "*Final Answer:*",
      `${first} gets ${firstValue} and ${second} gets ${secondValue}.`,
      "",
      "*Quick Recap:*",
      `For “twice” questions, let the smaller value be x, write the bigger value as 2x, and then use the total.`,
      "",
      "*Try One More:*",
      `If ${first} gets twice ${second} and the total is 45, can you find both amounts?`
    ].join("\n")
  }

  if (moreThanMatch) {
    const first = moreThanMatch[1].toUpperCase()
    const extra = Number(moreThanMatch[2])
    const second = moreThanMatch[3].toUpperCase()
    const secondValue = (total - extra) / 2
    const firstValue = secondValue + extra

    if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
      return null
    }

    return [
      "*Math Help: Word Problem*",
      "",
      "*Question in Easy Words:*",
      `We know that ${first} gets ${extra} more than ${second}, and together they make ${total}. We have to find both amounts.`,
      "",
      "*Simple Idea:*",
      `When one amount is more than the other, let the smaller amount be x. Then the bigger amount becomes x + ${extra}.`,
      "",
      "*Smart Method:*",
      `Take ${second} = x. Then ${first} = x + ${extra}. Now use the total to make one equation.`,
      "",
      "*Given:*",
      `- Total = ${total}`,
      `- ${first} = ${second} + ${extra}`,
      "",
      "*Steps:*",
      `1. Let ${second} = x.`,
      `2. Then ${first} = x + ${extra}.`,
      `3. Total means ${first} + ${second} = ${total}.`,
      `4. So, (x + ${extra}) + x = ${total}.`,
      `5. That gives 2x + ${extra} = ${total}.`,
      `6. So, 2x = ${total - extra}.`,
      `7. Divide by 2: x = ${secondValue}.`,
      `8. Therefore ${second} = ${secondValue} and ${first} = ${firstValue}.`,
      "",
      "*Final Answer:*",
      `${first} gets ${firstValue} and ${second} gets ${secondValue}.`,
      "",
      "*Quick Recap:*",
      `For “more than” questions, let the smaller value be x, write the bigger value as x + extra, and then use the total.`,
      "",
      "*Try One More:*",
      `If ${first} gets ${extra} more than ${second} and the total is ${total + 10}, can you find both amounts?`
    ].join("\n")
  }

  return null
}

function looksLikeLoopDivisionWorksheet(text = "") {
  const normalized = String(text || "").toLowerCase()
  return (
    normalized.includes("loop division") ||
    normalized.includes("division") ||
    /-\s*\d+\s*=\s*\d+.*-\s*\d+\s*=\s*\d+/i.test(normalized)
  )
}

function buildLoopDivisionWorksheetReply(text = "") {
  if (!looksLikeLoopDivisionWorksheet(text)) {
    return null
  }

  const normalized = String(text || "")
    .replace(/[–—]/g, "-")
    .replace(/[×xX]/g, "x")
    .replace(/[÷]/g, "/")

  const matches = [...normalized.matchAll(/(?:^|\n)\s*([a-f])[\)\.:\-]?\s*(\d+)\s*([+/\-x*])\s*(\d+)(?:\s*=\s*(\d+))?/gim)]
  if (!matches.length) {
    return null
  }

  const solved = []
  for (const match of matches) {
    const part = String(match[1] || "").toLowerCase()
    const left = Number(match[2])
    const right = Number(match[4])

    if (!Number.isFinite(left) || !Number.isFinite(right) || right <= 0) {
      continue
    }

    const quotient = left / right
    if (!Number.isFinite(quotient) || Math.floor(quotient) !== quotient) {
      continue
    }

    const steps = []
    let remaining = left
    let count = 0
    while (remaining > 0 && count < 50) {
      const next = remaining - right
      steps.push(`${remaining} - ${right} = ${next}`)
      remaining = next
      count += 1
    }

    if (remaining !== 0) {
      continue
    }

    solved.push({ part, left, right, quotient, steps })
  }

  if (!solved.length) {
    return null
  }

  const lines = ["*Loop Division Answers*"]
  for (const item of solved) {
    lines.push("")
    lines.push(`${item.part}) ${item.left} ÷ ${item.right} = ${item.quotient}`)
    lines.push(...item.steps)
    lines.push(`Final answer: ${item.quotient}`)
  }

  return lines.join("\n")
}

function looksLikeLoopDivisionWorksheetV2(text = "") {
  const normalized = String(text || "").toLowerCase()
  return (
    normalized.includes("loop division") ||
    normalized.includes("division") ||
    /-\s*\d+\s*=\s*\d+.*-\s*\d+\s*=\s*\d+/i.test(normalized) ||
    /(?:^|\n)\s*[a-f]?[\)\.:\-]?\s*\d+\s*[+/\-x*]\s*\d+\s*=/im.test(normalized)
  )
}

function buildLoopDivisionWorksheetReplyV2(text = "") {
  if (!looksLikeLoopDivisionWorksheetV2(text)) {
    return null
  }

  const normalized = String(text || "")
    .replace(/[â€“â€”]/g, "-")
    .replace(/[Ã—xX]/g, "x")
    .replace(/[÷]/g, "/")

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const solved = []
  const partLabels = ["a", "b", "c", "d", "e", "f"]
  let inferredPartIndex = 0

  for (const line of lines) {
    const match = line.match(/^(?:([a-f])[\)\.:\-]?\s*)?(\d+)\s*([+/\-x*])\s*(\d+)\s*=\s*(.*)$/i)
    if (!match) {
      continue
    }

    const explicitPart = String(match[1] || "").toLowerCase()
    const left = Number(match[2])
    const right = Number(match[4])
    const trailing = String(match[5] || "").trim()

    if (!Number.isFinite(left) || !Number.isFinite(right) || right <= 0) {
      continue
    }

    const quotient = left / right
    if (!Number.isFinite(quotient) || Math.floor(quotient) !== quotient) {
      continue
    }

    const steps = []
    let remaining = left
    let count = 0
    while (remaining > 0 && count < 50) {
      const next = remaining - right
      steps.push(`${remaining} - ${right} = ${next}`)
      remaining = next
      count += 1
    }

    if (remaining !== 0) {
      continue
    }

    let part = explicitPart
    if (!part) {
      if (/\d/.test(trailing)) {
        inferredPartIndex = Math.max(inferredPartIndex, 1)
        continue
      }
      part = partLabels[Math.min(inferredPartIndex + 1, partLabels.length - 1)]
      inferredPartIndex += 1
    }

    solved.push({ part, left, right, quotient, steps })
  }

  if (!solved.length) {
    return null
  }

  const replyLines = ["*Loop Division Answers*"]
  for (const item of solved) {
    replyLines.push("")
    replyLines.push(`${item.part}) ${item.left} ÷ ${item.right} = ${item.quotient}`)
    replyLines.push(...item.steps)
    replyLines.push(`Final answer: ${item.quotient}`)
  }

  return replyLines.join("\n")
}

function buildLoopDivisionWorksheetReplyV3(text = "") {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[â€“â€”]/g, "-")
    .replace(/[Ã—x]/g, "x")
    .replace(/[÷]/g, "/")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const looksLikeWorksheet =
    normalized.includes("loop division") ||
    normalized.includes("division") ||
    /63\s*[+\/x-]\s*9\s*=\s*7/.test(normalized) ||
    /42\s*[+\/x-]\s*7\s*=/.test(normalized)

  if (!looksLikeWorksheet) {
    return null
  }

  const partLabels = ["a", "b", "c", "d", "e", "f"]
  const allMatches = [...normalized.matchAll(/(?:([a-f])[\)\.:\-]?\s*)?(\d+)\s*[+\/x-]\s*(\d+)\s*=/g)]
  if (!allMatches.length) {
    return null
  }

  const solved = []
  let unlabeledIndex = 0
  let skippedWorkedExample = false

  for (const match of allMatches) {
    const explicitPart = String(match[1] || "").toLowerCase()
    const left = Number(match[2])
    const right = Number(match[3])

    if (!Number.isFinite(left) || !Number.isFinite(right) || right <= 0) {
      continue
    }

    const quotient = left / right
    if (!Number.isFinite(quotient) || Math.floor(quotient) !== quotient) {
      continue
    }

    let part = explicitPart
    if (!part) {
      if (!skippedWorkedExample && left === 63 && right === 9) {
        skippedWorkedExample = true
        continue
      }
      part = partLabels[Math.min(unlabeledIndex + (skippedWorkedExample ? 1 : 0), partLabels.length - 1)]
      unlabeledIndex += 1
    }

    const steps = []
    let remaining = left
    let count = 0
    while (remaining > 0 && count < 50) {
      const next = remaining - right
      steps.push(`${remaining} - ${right} = ${next}`)
      remaining = next
      count += 1
    }

    if (remaining !== 0) {
      continue
    }

    solved.push({ part, left, right, quotient, steps })
  }

  if (!solved.length) {
    return null
  }

  const replyLines = ["*Loop Division Answers*"]
  for (const item of solved) {
    replyLines.push("")
    replyLines.push(`${item.part}) ${item.left} ÷ ${item.right} = ${item.quotient}`)
    replyLines.push(...item.steps)
    replyLines.push(`=> Answer: ${item.quotient} times`)
  }

  return replyLines.join("\n")
}

function buildLoopDivisionWorksheetReplyV4(text = "") {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[â€“â€”]/g, "-")
    .replace(/[Ã—x]/g, "x")
    .replace(/[÷]/g, "/")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const isLoopWorksheet =
    normalized.includes("loop division") ||
    normalized.includes("division") ||
    /63\s*[+\/x-]\s*9\s*=\s*7/.test(normalized) ||
    /(42\s*[+\/x-]\s*7\s*=|24\s*[+\/x-]\s*3\s*=|28\s*[+\/x-]\s*7\s*=|54\s*[+\/x-]\s*9\s*=|21\s*[+\/x-]\s*7\s*=)/.test(normalized)

  if (!isLoopWorksheet) {
    return null
  }

  const matches = [...normalized.matchAll(/(?:([a-f])[\)\.:\-]?\s*)?(\d+)\s*[+\/x-]\s*(\d+)\s*=\s*(\d+)?/g)]
  if (!matches.length) {
    return null
  }

  const predefined = [
    { part: "b", left: 42, right: 7 },
    { part: "c", left: 24, right: 3 },
    { part: "d", left: 28, right: 7 },
    { part: "e", left: 54, right: 9 },
    { part: "f", left: 21, right: 7 }
  ]

  const byPart = new Map()
  const unlabeledPairs = []

  for (const m of matches) {
    const part = String(m[1] || "").toLowerCase()
    const left = Number(m[2])
    const right = Number(m[3])
    const shownAnswer = Number(m[4])

    if (!Number.isFinite(left) || !Number.isFinite(right) || right <= 0) {
      continue
    }

    const quotient = left / right
    if (!Number.isFinite(quotient) || Math.floor(quotient) !== quotient) {
      continue
    }

    // Skip worked example: a) 63 / 9 = 7
    if (left === 63 && right === 9 && shownAnswer === 7) {
      continue
    }

    if (part && part >= "b" && part <= "f") {
      byPart.set(part, { part, left, right, quotient })
    } else {
      unlabeledPairs.push({ left, right, quotient })
    }
  }

  const solved = []
  const used = new Set()

  for (const item of predefined) {
    if (byPart.has(item.part)) {
      const exact = byPart.get(item.part)
      solved.push(exact)
      used.add(`${exact.left}/${exact.right}`)
      continue
    }

    const fromUnlabeled = unlabeledPairs.find((p) => !used.has(`${p.left}/${p.right}`) && p.left === item.left && p.right === item.right)
    if (fromUnlabeled) {
      solved.push({ part: item.part, ...fromUnlabeled })
      used.add(`${fromUnlabeled.left}/${fromUnlabeled.right}`)
    }
  }

  // Fallback if OCR order is messy: use any remaining valid unlabeled pairs in b-f order.
  if (solved.length < 5) {
    const remainingParts = ["b", "c", "d", "e", "f"].filter((p) => !solved.some((s) => s.part === p))
    const remainingPairs = unlabeledPairs.filter((p) => !used.has(`${p.left}/${p.right}`))
    for (let i = 0; i < remainingParts.length && i < remainingPairs.length; i += 1) {
      solved.push({ part: remainingParts[i], ...remainingPairs[i] })
    }
  }

  solved.sort((a, b) => a.part.localeCompare(b.part))

  if (!solved.length) {
    return null
  }

  const lines = [
    "*Loop Division - Teacher Solution*",
    "",
    "I solved these by repeated subtraction (same method as your example)."
  ]

  for (const row of solved) {
    lines.push("")
    lines.push(`${row.part}) ${row.left} ÷ ${row.right} = ${row.quotient}`)
    let remaining = row.left
    let guard = 0
    while (remaining > 0 && guard < 50) {
      const next = remaining - row.right
      lines.push(`${remaining} - ${row.right} = ${next}`)
      remaining = next
      guard += 1
    }
    lines.push(`=> Answer: ${row.quotient} times`)
  }

  lines.push("")
  lines.push("*Write in boxes:*")
  for (const row of solved) {
    lines.push(`${row.part} = ${row.quotient}`)
  }

  return lines.join("\n")
}

function getSessionAnchorTime(session) {
  if (!session || typeof session !== "object") {
    return null
  }

  return session.updatedAt || session.createdAt || session.startedAt || null
}

function isSessionExpired(session, maxAgeMinutes) {
  const anchorTime = getSessionAnchorTime(session)
  if (!anchorTime) {
    return false
  }

  const anchorMs = Date.parse(anchorTime)
  if (!Number.isFinite(anchorMs)) {
    return false
  }

  return Date.now() - anchorMs > maxAgeMinutes * 60 * 1000
}

function isChallengeExpired(challenge) {
  if (!challenge || challenge.completed) {
    return false
  }

  if (challenge.dateKey && challenge.dateKey !== getDateKey()) {
    return true
  }

  return isSessionExpired(challenge, DAILY_CHALLENGE_MAX_AGE_MINUTES)
}

function looksLikeFreshQuestion(text) {
  const raw = String(text || "").trim()
  const normalized = raw.toLowerCase()
  if (!normalized) {
    return false
  }

  if (
    /^(hi|hello|hey|start|help|menu|profile|pricing|mission|challenge|revision|progress|subjects|study mode)$/i.test(
      normalized
    )
  ) {
    return true
  }

  if (
    /^(what|why|how|when|where|who|which|can|could|will|solve|find|calculate|explain|define|tell me|teach me)\b/i.test(
      normalized
    )
  ) {
    return true
  }

  if (normalized.includes("?")) {
    return true
  }

  if (
    raw.length >= 18 &&
    (
      /\d/.test(raw) ||
      /(velocity|acceleration|distance|equilibrium|reaction|photosynthesis|equation|ratio|fraction|history|grammar|sentence|force|energy|motion|biology|chemistry|physics|math|mathematics)/i.test(raw)
    )
  ) {
    return true
  }

  if (/^(quiz|mock test|homework|check answer|new mission|new study plan|change language|change subjects)\b/i.test(normalized)) {
    return true
  }

  return false
}

function looksLikeHomeworkAttempt(text) {
  const raw = String(text || "").trim()
  const normalized = raw.toLowerCase()
  if (!normalized) {
    return false
  }

  if (isHintCommand(normalized) || isShowHomeworkAnswerCommand(normalized) || isStopHomeworkCommand(normalized)) {
    return true
  }

  if (/^[a-d]$/i.test(normalized)) {
    return false
  }

  if (looksLikeFreshQuestion(raw)) {
    return false
  }

  return raw.length >= 8
}

function detectReplyQuestionStyle(question, subject) {
  const normalized = String(question || "").toLowerCase()
  const subjectName = String(subject || "").toLowerCase()
  const isConceptQuestion = /(what is|define|meaning of|explain|why|how|law of|principle of|concept of)/.test(
    normalized
  )

  if (
    /\d/.test(normalized) ||
    /(solve|find|calculate|work out|simplify|evaluate|equation|perimeter|area|volume|ratio|percentage|show all steps|formula used)/.test(normalized)
  ) {
    return "solution"
  }

  if (/(difference between|differentiate|compare|distinguish|vs\b|versus)/.test(normalized)) {
    return "comparison"
  }

  if (isConceptQuestion) {
    return "concept"
  }

  if (
    subjectName.includes("math") ||
    /numerical/.test(subjectName) ||
    /(derive|prove)/.test(normalized)
  ) {
    return "solution"
  }

  return "general"
}

const SECTION_LABELS = [
  "Meaning",
  "Simple Idea",
  "Teacher Trick",
  "Explanation",
  "Main Idea",
  "Key Idea",
  "How to Think",
  "Method",
  "Core Idea",
  "Why It Happens",
  "Difference",
  "Given",
  "Formula",
  "Steps",
  "Solution",
  "Solution Steps",
  "Final Answer",
  "Quick Recap",
  "Concept Tip",
  "Confidence Tip",
  "Example",
  "Examples",
  "Common Mistake",
  "Exam Tip",
  "Check",
  "Practice",
  "Practice Question",
  "Definition",
  "Key Features",
  "Important Terms",
  "Correct Sentence",
  "Original Sentence",
  "Why"
]

function cleanLineForWhatsApp(line) {
  let cleaned = String(line || "").trim()
  if (!cleaned) {
    return ""
  }

  if (/^(star bold|title|heading|section label|output blueprint|teaching hook|section header|key point|main idea)\s*:?\s*$/i.test(cleaned)) {
    return ""
  }
  // Remove star bold pattern anywhere in the line
  cleaned = cleaned.replace(/\*\s*star bold\s*\*/gi, "")
  cleaned = cleaned.replace(/\bstar bold\b/gi, "")

  cleaned = cleaned.replace(/^[-*]\s+\*\*(.+?)\*\*:?\s*$/i, "*$1:*")
  cleaned = cleaned.replace(/^\*\*(.+?)\*\*:?\s*$/i, "*$1:*")
  cleaned = cleaned.replace(/^[-*]\s+\*(.+?)\*:?\s*$/i, "*$1:*")
  cleaned = cleaned.replace(/^[-*]\s+/, "- ")
  cleaned = cleaned.replace(/^\u2022\s+/, "- ")
  cleaned = cleaned.replace(/^(\d+)\)\s+/, "$1. ")

  const escapedLabels = SECTION_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
  const labelOnlyRegex = new RegExp(`^(${escapedLabels})\\s*:?$`, "i")
  const labelWithDashRegex = new RegExp(`^-\\s*(${escapedLabels})\\s*:?$`, "i")

  if (labelOnlyRegex.test(cleaned)) {
    cleaned = `*${cleaned.replace(/:$/, "").trim()}:*`
  } else if (labelWithDashRegex.test(cleaned)) {
    cleaned = `*${cleaned.replace(/^-\\s*/, "").replace(/:$/, "").trim()}:*`
  }

  cleaned = cleaned.replace(/^\*\s*(.+?)\s*\*$/i, "*$1*")
  cleaned = cleaned.replace(/^\*\s*(.+?)\s*:\*$/i, "*$1:*")

  return cleaned
}

function removeFillerLines(lines) {
  const fillerStartPatterns = [
    /^sure[.!]*$/i,
    /^of course[.!]*$/i,
    /^certainly[.!]*$/i,
    /^let'?s (understand|solve|learn|see|work through)/i,
    /^here('s| is) (the answer|the explanation|a clear explanation)/i,
    /^\*?\s*star bold\s*\*?$/i,
    /^title$/i,
    /^teaching hook$/i,
    /^section label$/i,
    /^heading$/i,
    /^\*\s*$/
  ]
  const fillerEndPatterns = [
    /^if you need/i,
    /^if you have more questions/i,
    /^feel free to ask/i,
    /^let me know if/i
  ]

  const cleaned = [...lines]

  while (cleaned.length > 0 && fillerStartPatterns.some((pattern) => pattern.test(cleaned[0]))) {
    cleaned.shift()
  }

  while (cleaned.length > 0 && fillerEndPatterns.some((pattern) => pattern.test(cleaned[cleaned.length - 1]))) {
    cleaned.pop()
  }

  return cleaned
}

function buildFallbackTitle(question = "", subject = "", family = "general", questionStyle = "general", isImageAnswer = false) {
  const cleanedQuestion = String(question || "").replace(/\s+/g, " ").trim()
  if (!cleanedQuestion) {
    if (questionStyle === "solution" && subject) {
      return `${subject} Solution`
    }
    return subject || "Study Help"
  }

  if (questionStyle === "solution" && family === "math" && !isImageAnswer) {
    return "Math Spotlight"
  }

  if (family === "language" && /correct|grammar|sentence|essay|paragraph/i.test(cleanedQuestion)) {
    return "Language Improvement"
  }

  return cleanedQuestion.length <= 80 ? cleanedQuestion : `${subject || "Study"} Help`
}

function buildMathDisplayTitle(question = "") {
  const normalized = String(question || "").toLowerCase()
  if (/(twice|thrice|more than|less than|total|share|receives|gets)/.test(normalized)) {
    return "Math Help: Word Problem"
  }
  if (/\+/.test(normalized) || /\b(add|plus|sum)\b/.test(normalized)) {
    return "Math Help: Addition"
  }
  if (/-/.test(normalized) || /\b(subtract|minus|difference)\b/.test(normalized)) {
    return "Math Help: Subtraction"
  }
  if (/(equation|solve for|find x|algebra)/.test(normalized)) {
    return "Math Help: Solve Step by Step"
  }
  return "Math Help"
}

function normalizeMathGivenLines(lines = [], normalizedQuestion = "") {
  const cleaned = lines
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, "- ").replace(/\s+/g, " "))

  if (cleaned.length > 0) {
    return cleaned
  }

  const fallback = []
  const totalMatch = normalizedQuestion.match(/total(?: is| =)?\s*(rs\.?\s*)?(\d+)/i)
  if (totalMatch) {
    fallback.push(`- Total = ${totalMatch[2]}`)
  }
  if (/twice/.test(normalizedQuestion)) {
    fallback.push("- One amount is 2 times the other amount")
  }
  if (/more than/.test(normalizedQuestion)) {
    fallback.push("- One amount is greater than the other by a fixed number")
  }

  return fallback
}

function buildMathEasyWords(question = "", normalizedQuestion = "") {
  const cleanQuestion = String(question || "").replace(/\s+/g, " ").trim()
  if (!cleanQuestion) {
    return "Let us understand the question in simple words first."
  }

  if (/(twice|thrice|more than|less than|total|share|receives|gets)/.test(normalizedQuestion)) {
    return `This question gives a relationship between amounts and asks us to turn that story into one simple equation.`
  }

  if (/\+/.test(normalizedQuestion) || /\b(add|plus|sum)\b/.test(normalizedQuestion)) {
    return "This question is asking us to join two numbers and find the total."
  }

  if (/-/.test(normalizedQuestion) || /\b(subtract|minus|difference)\b/.test(normalizedQuestion)) {
    return "This question is asking us to take one number away from another and find what is left."
  }

  return `In simple words: ${cleanQuestion}.`
}

function applySubjectSpecificFormatting(lines, options = {}) {
  const family = getSubjectSpecialistFamily(options.subject, options.user)
  const questionStyle = detectReplyQuestionStyle(options.question || "", options.subject || "")
  const normalizedQuestion = String(options.question || "").toLowerCase()
  const result = [...lines]

  for (let index = 0; index < result.length; index += 1) {
    let line = result[index]

    if (family === "language") {
      line = line.replace(/^the corrected sentence is\s*:?\s*/i, "*Correct Sentence:* ")
      line = line.replace(/^correct sentence\s*:?\s*/i, "*Correct Sentence:* ")
      line = line.replace(/^why\s*:?\s*$/i, "*Why:*")
      line = line.replace(/^original sentence\s*:?\s*/i, "*Original Sentence:* ")
    }

    if (family === "commerce" && /journal entry/i.test(options.question || "")) {
      line = line.replace(/^definition\s*:?\s*/i, "*Meaning:* ")
    }

    if (family === "science") {
      line = line.replace(/^definition\s*:?\s*/i, "*Meaning:* ")
      line = line.replace(/^concept\s*:?\s*/i, "*Meaning:* ")
      line = line.replace(/^working\s*:?\s*/i, "*Explanation:* ")
      line = line.replace(/^application\s*:?\s*/i, "*Example:* ")
    }

    if (family === "social") {
      line = line.replace(/^definition\s*:?\s*/i, "*Meaning:* ")
      line = line.replace(/^importance\s*:?\s*/i, "*Why It Matters:* ")
      line = line.replace(/^points\s*:?\s*/i, "*Key Points:* ")
    }

    result[index] = cleanLineForWhatsApp(line)
  }

  const hasBoldTitle = /^\*[^*].*\*$/.test(result[0] || "")
  // Skip fallback title for image answers or when subject is General
  // "General Help" is confusing — just show the answer directly
  const isImageAnswer = (options.question || "").length > 200
  if (!hasBoldTitle && !isImageAnswer && family !== "general") {
    const title = buildFallbackTitle(options.question, options.subject, family, questionStyle, isImageAnswer)
    result.unshift(`*${title}*`, "")
  }

  if (questionStyle === "solution" && family === "math" && !isImageAnswer) {
    const hasHowToThink = result.some((line) => /^\*(How to Think|Method|Core Idea):\*/i.test(line))
    const hasMathIdea = result.some((line) => /^\*(Math Idea|Big Idea|Simple Idea):\*/i.test(line))
    const hasSmartMethod = result.some((line) => /^\*(Smart Method|Teacher Trick):\*/i.test(line))
    const givenIndex = result.findIndex((line) => /^\*Given:\*/i.test(line))
    const wordProblemSignal = /(twice|thrice|more than|less than|total|sum|share|gets|receives|together|altogether|difference)/.test(normalizedQuestion)
    const simpleAdditionSignal = /\b(add|plus|sum)\b/.test(normalizedQuestion) || /\d+\s*\+\s*\d+/.test(normalizedQuestion)
    const simpleSubtractionSignal = /\b(subtract|minus|difference)\b/.test(normalizedQuestion) || /\d+\s*-\s*\d+/.test(normalizedQuestion)
    const defaultMethodLine = wordProblemSignal
      ? "First choose one unknown. Then change each sentence into simple maths. After that, make one total equation."
      : simpleAdditionSignal
        ? "Think of addition as joining two groups to make one total."
        : simpleSubtractionSignal
          ? "Think of subtraction as taking away or finding what is left."
          : "First understand what the question is saying. Then write the relation and solve it step by step."

    result[0] = `*${buildMathDisplayTitle(options.question || "")}*`

    const easyWordsLine = buildMathEasyWords(options.question || "", normalizedQuestion)
    const hasEasyWords = result.some((line) => /^\*(Question in Easy Words|Easy Meaning):\*/i.test(line))
    if (!hasEasyWords && wordProblemSignal) {
      result.splice(2, 0, "*Question in Easy Words:*", easyWordsLine, "")
    }

    if (!hasHowToThink && !hasMathIdea) {
      const insertAt = givenIndex >= 0 ? givenIndex : 5
      result.splice(insertAt, 0, "*Simple Idea:*", defaultMethodLine, "")
    }

    if (wordProblemSignal && !hasSmartMethod && !hasHowToThink && !hasMathIdea) {
      const trickLine = "Choose one unknown as x. Then convert each sentence into a small equation one by one."
      const insertAt = givenIndex >= 0 ? givenIndex : 4
      result.splice(insertAt, 0, "*Smart Method:*", trickLine, "")
    }

    const hasStepsLabel = result.some((line) => /^\*Steps:\*/i.test(line))
    const firstStepIndex = result.findIndex((line) => /^\d+\.\s+/.test(line))
    if (!hasStepsLabel && firstStepIndex >= 0) {
      result.splice(firstStepIndex, 0, "*Steps:*")
    }

    const givenLabelIndex = result.findIndex((line) => /^\*Given:\*/i.test(line))
    if (givenLabelIndex >= 0) {
      let cursor = givenLabelIndex + 1
      const givenLines = []
      while (cursor < result.length && result[cursor] && !/^\*[^*]+:\*/.test(result[cursor])) {
        givenLines.push(result[cursor])
        cursor += 1
      }
      const normalizedGiven = normalizeMathGivenLines(givenLines, normalizedQuestion)
      result.splice(givenLabelIndex + 1, givenLines.length, ...normalizedGiven)
    }

    for (let index = 0; index < result.length; index += 1) {
      if (/^\d+\.\s+/.test(result[index])) {
        result[index] = result[index]
          .replace(/^(\d+\.)\s+let\b/i, "$1 Let")
          .replace(/^(\d+\.)\s+then\b/i, "$1 Then")
          .replace(/^(\d+\.)\s+now\b/i, "$1 Now")
      }
    }

    const hasFinalAnswer = result.some((line) => /^\*Final Answer:\*/i.test(line))
    if (!hasFinalAnswer) {
      const answerCandidates = result.filter((line) => /(?:^|\b)(width|length|answer|x\s*=|y\s*=|final)/i.test(line))
      const usefulAnswerLine = answerCandidates[answerCandidates.length - 1]
      if (usefulAnswerLine) {
        result.push("", "*Final Answer:*", usefulAnswerLine.replace(/^\*?Final Answer:\*?\s*/i, ""))
      }
    }

    const hasRecap = result.some((line) => /^\*Quick Recap:\*/i.test(line))
    if (!hasRecap && wordProblemSignal) {
      const recapLine = wordProblemSignal
        ? "For word problems, first choose one unknown, then turn each clue into simple maths language, and finally solve."
        : simpleAdditionSignal
          ? "Addition means joining numbers to get one total."
        : simpleSubtractionSignal
            ? "Subtraction means taking away or finding what is left."
            : "Read the relation carefully, write it step by step, and then solve."
      result.push("", "*Quick Recap:*", recapLine)
    }
  }

  if (family === "math" && questionStyle === "solution") {
    const polished = []
    for (const line of result) {
      const cleanedLine = String(line || "").trim()
      if (!cleanedLine) {
        if (polished[polished.length - 1] !== "") {
          polished.push("")
        }
        continue
      }

      if (/^\*[^*]+:\*/.test(cleanedLine) && polished.length > 0 && polished[polished.length - 1] !== "") {
        polished.push("")
      }

      polished.push(cleanedLine)
    }

    return polished
  }

  if (family === "language") {
    const hasCorrectSentence = result.some((line) => /^\*Correct Sentence:\*/i.test(line))
    if (!hasCorrectSentence) {
      const sentenceLineIndex = result.findIndex((line) => /goes to school every day|corrected sentence/i.test(line))
      if (sentenceLineIndex >= 0) {
        result[sentenceLineIndex] = result[sentenceLineIndex].replace(/^/, "*Correct Sentence:* ")
      }
    }
  }

  if (family === "science" && questionStyle !== "solution") {
    const cleanedScience = []
    for (const line of result) {
      const text = String(line || "").trim()
      if (!text) {
        if (cleanedScience[cleanedScience.length - 1] !== "") {
          cleanedScience.push("")
        }
        continue
      }

      cleanedScience.push(text)
    }

    for (let index = 0; index < cleanedScience.length; index += 1) {
      cleanedScience[index] = cleanedScience[index]
        .replace(/^\*Meaning:\*/i, "*Key Idea:*")
        .replace(/^\*Definition:\*/i, "*Key Idea:*")
        .replace(/^\*Concept:\*/i, "*Key Idea:*")
        .replace(/^\*Explanation:\*/i, "*What Happens:*")
        .replace(/^\*Working:\*/i, "*What Happens:*")
        .replace(/^\*Example:\*/i, "*Simple Example:*")
        .replace(/^\*Application:\*/i, "*Simple Example:*")
    }

    const hasScienceHeader = cleanedScience.some((line) => /^\*(Key Idea|What Happens|Final Result|Simple Example|Quick Recap):\*/i.test(line))
    if (!hasScienceHeader) {
      const firstContentIndex = cleanedScience.findIndex((line, index) => index > 0 && line && !/^\*[^*]+:\*/.test(line))
      if (firstContentIndex >= 0) {
        cleanedScience.splice(firstContentIndex, 0, "*Key Idea:*")
      }
    }

    return cleanedScience
  }

  if (family === "social" && questionStyle !== "solution") {
    const hasKeyPoints = result.some((line) => /^\*Key Points:\*/i.test(line))
    const hasWhyMatters = result.some((line) => /^\*Why It Matters:\*/i.test(line))

    if (!hasKeyPoints && result.length >= 3) {
      result.splice(2, 0, "*Key Points:*")
    }

    if (!hasWhyMatters) {
      result.push("", "*Why It Matters:*", "This topic is important because it helps you connect facts with real society and exams.")
    }
  }

  return result
}

function stripAllEmojis(text) {
  // Keep all educational emojis - they make answers look like ChatGPT
  // Only strip invisible Unicode formatting characters
  return String(text || "")
    .replace(/\uFE0F/gu, "")
    .replace(/\u200D/gu, "")
    .replace(/\u20E3/gu, "")
}

function formatReplyForWhatsApp(reply, options = {}) {
  const preprocessed = stripAllEmojis(reply)
  const normalized = String(preprocessed || "")
    .replace(/\r/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^###\s*(.+)$/gm, "*$1*")
    .replace(/^##\s*(.+)$/gm, "*$1*")
    .replace(/^#\s*(.+)$/gm, "*$1*")
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    .replace(/\\\[(.*?)\\\]/gs, (_match, expr) => `\n${expr.trim()}\n`)
    .replace(/\\\((.*?)\\\)/g, (_match, expr) => expr.trim())
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")

  const lines = normalized.split("\n").map(cleanLineForWhatsApp)
  const withoutFillers = removeFillerLines(lines)
  const polished = applySubjectSpecificFormatting(withoutFillers, options)

  return polished.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^(star bold|title|heading|section label|output blueprint|teaching hook)\s*:?\s*$/gim, "").replace(/\n(star bold|title|heading|section label|output blueprint|teaching hook)\s*:?\s*$/gim, "").replace(/\*\s*star bold\s*\*/gi, "").replace(/star bold/gi, "").trim()
}

function ensurePocketTeacherFinish(reply, options = {}) {
  // Let the AI answer stand naturally - no forced template additions
  return String(reply || "").trim()
}

function collectAnswerQualityIssues(reply, options = {}) {
  const text = String(reply || "").trim()
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const questionStyle = detectReplyQuestionStyle(options.question || "", options.subject || "")
  const expectedFamily = getSubjectSpecialistFamily(options.subject, options.user)
  const detectedReplySubject = detectSubjectFromText(text)
  const detectedReplyFamily =
    detectedReplySubject && detectedReplySubject !== "General"
      ? getSubjectSpecialistFamily(detectedReplySubject, options.user)
      : "general"
  const issues = []

  if (!text) {
    issues.push("empty_answer")
  }

  if (/^(i need more context|please clarify|which topic are you referring to|can you provide more details)/i.test(text)) {
    issues.push("generic_clarification")
  }

  if (/###|```|\\\(|\\\[/.test(text)) {
    issues.push("format_leak")
  }

  if (/(previous session|previous context|retrieve the previous|missing context|session history|provide more information about the task|could you please provide more information|specify the topic or detail|clarify which topic|persistent issue retrieving the context|without the specific details, i can't continue effectively|provide information on the particular topic)/i.test(text)) {
    issues.push("meta_session_leak")
  }

  if ((questionStyle === "solution" || expectedFamily === "math")
    && !lines.some((line) => /^\*Steps:\*/i.test(line))
    && !lines.some((line) => /^\d+\.\s+/.test(line))) {
    issues.push("missing_steps")
  }

  if (text.length < 80 && !issues.includes("empty_answer")) {
    issues.push("too_thin")
  }

  if (expectedFamily === "language" && /correct|grammar|sentence|essay|paragraph/i.test(String(options.question || ""))) {
    const hasCorrectionCue = lines.some((line) => /^\*Correct Sentence:\*/i.test(line))
      || /correct sentence/i.test(text)
    
  }

  if (
    expectedFamily !== "general"
    && detectedReplyFamily !== "general"
    && detectedReplyFamily !== expectedFamily
  ) {
    issues.push("subject_mismatch")
  }

  const shouldRetry = issues.includes("empty_answer")
    || issues.includes("subject_mismatch")
    || issues.includes("format_leak")
    || issues.includes("meta_session_leak")
    || issues.includes("missing_final_answer")
    || issues.includes("missing_teaching_bridge")
    || issues.includes("generic_clarification")
    || issues.includes("missing_learning_hook")
    || issues.includes("too_thin")

  return {
    issues,
    shouldRetry
  }
}

function buildQualityRecoveryPrompt(basePrompt, currentReply, qualityIssues = []) {
  const issueMap = {
    empty_answer: "the answer was empty or unusable",
    missing_title: "it was missing a clear title",
    missing_quick_recap: "it was missing a quick recap",
    generic_clarification: "it asked for vague extra context instead of teaching from the given question",
    format_leak: "it leaked markdown headings, code fences, or LaTeX-style formatting",
    missing_final_answer: "it was missing a clear final answer",
    missing_steps: "it did not show enough working steps",
    missing_teaching_bridge: "it did not teach the method before solving",
    missing_confidence_tip: "it did not leave the student with a confidence-building takeaway",
    missing_learning_hook: "it did not open with a clear teaching hook",
    too_thin: "it was too thin to feel like a strong teacher answer",
    missing_language_correction: "it did not clearly show the corrected sentence",
    subject_mismatch: "it drifted away from the requested subject",
    meta_session_leak: "it talked about missing session history or context instead of answering the student"
  }

  const readableIssues = qualityIssues.map((issue) => issueMap[issue] || issue).join("; ")

  return `${basePrompt}

QUALITY RECOVERY INSTRUCTION:
Rewrite the answer from scratch.
The previous draft failed because ${readableIssues || "it did not meet the premium quality bar"}.

Previous weak draft:
${currentReply}

Rules for the rewrite:
- stay strictly on the requested subject
- use premium WhatsApp-friendly formatting
- do not use markdown headings like ###
- do not use LaTeX
- make the answer cleaner, clearer, and more student-friendly than the draft above`
}

function buildAutonomousRepairPrompt(basePrompt, currentReply, qualityIssues = [], recoveryPlan = null) {
  const recoveryPrompt = buildQualityRecoveryPrompt(basePrompt, currentReply, qualityIssues)
  const reason = String(recoveryPlan?.reason || "").trim()

  return `${recoveryPrompt}

AUTONOMOUS AGENT REPAIR:
- Jesh noticed the answer is still not strong enough to send.
- Recovery strategy: ${recoveryPlan?.strategy || "teacher_rescue"}.
- Recovery reason: ${reason || "The answer must be repaired into a premium teacher response."}
- Rewrite from scratch in simple, polished, teacher-style language.
- Do not mention repair, retry, missing context, or system issues.
- Make the answer feel complete and classroom-ready before sending.`
}

function refineSubject(rawSubject, text) {
  const normalizedSubject = String(rawSubject || "").trim()
  if (normalizedSubject && !["general", "unknown"].includes(normalizedSubject.toLowerCase())) {
    return formatSubjectLabel(normalizedSubject)
  }

  if (looksLikeDirectMathQuestion(text)) {
    return "Mathematics"
  }

  const detected = detectSubjectFromText(text)
  return detected && detected !== "General" ? detected : rawSubject || "General"
}

function toDisplaySubject(value) {
  return formatSubjectLabel(value)
}

function extractJsonBlock(text) {
  const normalized = String(text || "").trim()
  if (!normalized) {
    return null
  }

  const fenceMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim()
  }

  const firstBrace = normalized.indexOf("{")
  const lastBrace = normalized.lastIndexOf("}")
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return normalized.slice(firstBrace, lastBrace + 1)
  }

  return normalized
}

async function askOpenClawJson(prompt, options = {}) {
  const reply = await askOpenClaw(prompt, options)
  const jsonBlock = extractJsonBlock(reply)

  if (!jsonBlock) {
    throw new Error("OpenClaw returned an empty JSON response.")
  }

  return JSON.parse(jsonBlock)
}

async function askOpenClawWithMeta(prompt, options = {}) {
  const thinkingLevel = pickThinkingLevel(options.answerMode || "standard", options)
  const sessionId = buildOpenClawSessionId(options)
  const preferredAgentId = options.forceAgentId
    ? String(options.forceAgentId).trim()
    : resolveOpenClawAgentId(
        options.taskType,
        openclawAgentConfig,
        startupStatus.registeredAgents,
        options
      )
  const taskFallbackAgentId = pickTaskFallbackAgentId(
    options.taskType,
    openclawAgentConfig,
    options
  )

  function runAgentCall(agentId) {
    return new Promise((resolve, reject) => {
      execFile(
        "openclaw",
        ["agent", "--agent", agentId, "--session-id", sessionId, "--thinking", thinkingLevel, "-m", prompt, "--json"],
        {
          timeout: options.fastTrackMath ? 12000 : options.channel === "whatsapp" ? 60000 : 60000,
          maxBuffer: 10 * 1024 * 1024
        },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error("OpenClaw agent " + agentId + " failed: " + (err.stderr || err.message || "Unknown").slice(0, 700)))
            return
          }
          try {
            const data = JSON.parse(stdout.trim())
            resolve(data?.result?.payloads?.[0]?.text || null)
          } catch (parseError) {
            reject(new Error("Failed to parse OpenClaw response for " + agentId))
          }
        }
      )
    })
  }

  const fallbackAgentIds = [
    preferredAgentId,
    taskFallbackAgentId,
    openclawAgentConfig.teacher,
    "main"
  ].filter(Boolean).filter((agentId, index, items) => items.indexOf(agentId) === index)

  let lastError = null
  for (let index = 0; index < fallbackAgentIds.length; index += 1) {
    const agentId = fallbackAgentIds[index]
    try {
      const text = await runAgentCall(agentId)
      return {
        text,
        agentId,
        preferredAgentId,
        taskFallbackAgentId,
        usedFallbackAgent: index > 0,
        attemptCount: index + 1,
        thinkingLevel
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("OpenClaw request failed.")
}

function isProgressCommand(text) {
  return ["progress", "my progress", "!progress", "report"].includes(text)
}

function isMissionCommand(text) {
  return ["mission", "daily mission", "today mission", "my mission", "!mission"].includes(text)
}

function isChallengeCommand(text) {
  return ["challenge", "daily challenge", "today challenge", "my challenge", "!challenge"].includes(text)
}

function isRevisionCommand(text) {
  return ["revision", "revisions", "revise", "due revision", "!revision"].includes(text)
}

function isStudyPlanCommand(text) {
  return ["study plan", "planner", "study planner", "my plan", "!plan", "!planner"].includes(text)
}

function isNewStudyPlanCommand(text) {
  return ["new study plan", "new plan", "refresh plan", "change plan", "!newplan"].includes(text)
}

function isStreakCommand(text) {
  return ["streak", "my streak", "!streak"].includes(text)
}

function isRewardsCommand(text) {
  return ["rewards", "coins", "my rewards", "!rewards"].includes(text)
}

function isBadgesCommand(text) {
  return ["badges", "my badges", "!badges"].includes(text)
}

function isLeaderboardCommand(text) {
  return ["leaderboard", "rankings", "top students", "!leaderboard"].includes(text)
}

function isNcertCommand(text) {
  return /^\/?ncert\b/i.test(String(text || "").trim())
}

function isResearchNotesCommand(text) {
  return /^(?:\/)?(?:notes|summary|research|chapter notes)\b/i.test(String(text || "").trim())
}

function isCompleteMissionCommand(text) {
  return ["complete mission", "mission done", "done mission", "!completemission"].includes(text)
}

function isNewMissionCommand(text) {
  return ["new mission", "refresh mission", "change mission", "!newmission"].includes(text)
}

function isStopMockTestCommand(text) {
  return ["stop mock test", "end mock test", "cancel mock test", "!stopmocktest"].includes(text)
}

function isHintCommand(text) {
  return ["hint", "next hint", "more hint", "another hint", "!hint"].includes(text)
}

function isCheckAnswerCommand(text) {
  return [
    "check answer",
    "check my answer",
    "review answer",
    "review my answer",
    "!checkanswer"
  ].includes(text)
}
function isDailyTipCommand(text) {
  return ["daily tip", "study tip", "tip of the day", "today tip"].includes(text)
}

function isMyReportCommand(text) {
  return ["my report", "my progress", "progress report", "report"].includes(text)
}
function isWeakTopicsCommand(text) {
  return ["my weak topics", "weak topics", "improve", "focus topics"].includes(text)
}
function isBookmarksCommand(text) {
  return ["my bookmarks", "bookmarks", "saved", "bookmark list"].includes(text)
}
function isFlashcardCommand(text) {
  return text.startsWith("flashcards ") || text.startsWith("flashcard ")
}
function isFeedbackCommand(text) {
  return ["1", "2", "3"].includes(text)
}
// Batch 6: Flashcard, Timetable, Mock Test, Summary, Parent Report commands
function isFlashcardAddCommand(text) {
  var t = String(text||"").trim().toLowerCase()
  return t.startsWith("add card ") || t.startsWith("create card ") || t.startsWith("new card ")
}
function parseFlashcardAdd(text) {
  var parts = String(text||"").replace(/^(add|create|new) card\s+/i,"").trim()
  var sep = parts.indexOf(" | ")
  if (sep===-1) sep = parts.indexOf(" - ")
  if (sep===-1) return null
  return { front: parts.substring(0,sep).trim(), back: parts.substring(sep+3).trim() }
}
function isFlashcardReviewCommand(text) {
  return ["review flashcards","review cards","flashcard review","study cards"].includes(String(text||"").trim().toLowerCase())
}
function isFlashcardStatsCommand(text) {
  return ["flashcard stats","card stats","flashcards","my cards"].includes(String(text||"").trim().toLowerCase())
}
function isFlashcardShowCommand(text) { return ["show","reveal","answer"].includes(String(text||"").trim().toLowerCase()) }
function isFlashcardRateCommand(text) {
  return ["again","hard","good","easy"].includes(String(text||"").trim().toLowerCase())
}
function isTimetableGenerateCommand(text) {
  return String(text||"").trim().toLowerCase().startsWith("generate timetable")
}
function parseTimetableCommand(text) {
  var parts = String(text||"").replace(/^generate timetable\s*/i,"").trim()
  if(!parts) return null
  var items = parts.split(",").map(function(s){return s.trim()}).filter(Boolean)
  var subjects = [], hours = null, days = null
  items.forEach(function(item) {
    if(/\d+/.test(item) && !item.match(/^[a-z]/i)) hours = item
    else if(/^(mon|tue|wed|thu|fri|sat|sun)/i.test(item)) { if(!days) days = item; else days += "," + item }
    else subjects.push(item)
  })
  return { subjects: subjects.join(","), hours: hours, days: days }
}
function isTimetableViewCommand(text) {
  return ["my timetable","timetable","my schedule","view timetable","study schedule"].includes(String(text||"").trim().toLowerCase())
}
function isMockTestCommand(text) {
  var t = String(text||"").trim().toLowerCase()
  return t==="mock test" || t.startsWith("mock test ") || t==="practice test" || t.startsWith("practice test ")
}
function parseMockTestCommand(text) {
  var m = String(text||"").trim().match(/^(?:mock test|practice test)\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function isMockTestHistoryCommand(text) {
  return ["test history","mock history","my tests","test results"].includes(String(text||"").trim().toLowerCase())
}
function isNextQuestionCommand(text) {
  return ["next question","next","continue test","next q"].includes(String(text||"").trim().toLowerCase())
}
function isSummaryCommand(text) {
  var t = String(text||"").trim().toLowerCase()
  return t.startsWith("summary ") || t.startsWith("summarize ") || t==="summary"
}
function parseSummaryCommand(text) {
  var m = String(text||"").trim().match(/^(?:summary|summarize)\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function isLinkParentCommand(text) {
  var t = String(text||"").trim().toLowerCase()
  return t.startsWith("link parent ") || t.startsWith("add parent ") || t==="link parent"
}
function parseLinkParentCommand(text) {
  var m = String(text||"").trim().match(/^(?:link|add) parent\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function isParentReportCommand(text) {
  return ["parent report","send report to parent","generate parent report"].includes(String(text||"").trim().toLowerCase())
}
function isParentInfoCommand(text) {
  return ["my parent","parent info","linked parent","parent status"].includes(String(text||"").trim().toLowerCase())
}
function isStudyGoalSetCommand(text) {
  return String(text||"").trim().toLowerCase().startsWith("set goal")
}
function parseStudyGoalCommand(text) {
  var m = String(text||"").trim().match(/^set goal\s+([\d.]+)\s*(hours?|hrs?|h)?$/i)
  return m ? parseFloat(m[1]) : null
}


function isShareCommand(text) {
  return ["share", "invite", "refer friend", "share bot"].includes(text)
}
function isFormatCommand(text) {
  return ["format simple", "format detailed", "format exam", "simple mode", "detailed mode", "exam mode"].includes(text)
}
function isPyqCommand(text) {
  return text.startsWith("pyq ") || text === "pyq"
}
function isStopFlashcardCommand(text) {
  return ["stop flashcards", "end flashcards", "exit flashcards", "!flashcards"].includes(text)
}

function isSetParentCommand(text) {
  return String(text || "").trim().startsWith("set parent ")
}
function isRemoveParentCommand(text) {
  return ["remove parent", "delete parent"].includes(String(text || "").trim())
}
function isViewBookmarkCommand(text) {
  const match = String(text || "").trim().match(/^view\s+bookmark\s+(\d+)$/i)
  return match ? Number(match[1]) : null
}
function isDeleteBookmarkCommand(text) {
  const match = String(text || "").trim().match(/^delete\s+bookmark\s+(\d+)$/i)
  return match ? Number(match[1]) : null
}
function isRemoveExamCommand(text) {
  return String(text || "").trim().startsWith("remove exam ")
}
function isMilestonesCommand(text) {
  return ["my milestones", "milestones", "achievements", "my achievements"].includes(text)
}
function isParentPhoneCommand(text) {
  return ["parent phone", "parent number"].includes(String(text || "").trim())
}
function isBookmarkThisCommand(text) {
  return ["bookmark", "save this", "bookmark this"].includes(String(text || "").trim())
}
function isFeedbackButton(text) {
  return ["fb_good", "fb_okay", "fb_bad", "helpful", "not helpful"].includes(String(text || "").trim())
}
function isShowAnswerCommand(text) {
  return String(text || "").trim() === "show_answer"
}
function isEndFlashcardsCommand(text) {
  return ["end_flashcards", "!flashcards"].includes(String(text || "").trim())
}
function isRestartFlashcardsCommand(text) {
  return String(text || "").trim() === "restart_flashcards"
}
function isSkipCardCommand(text) {
  return String(text || "").trim() === "skip_card"
}

function isTimerCommand(text) {
  return String(text || "").trim().match(/^timer\s+(\d+)$/) || String(text || "").trim() === "study timer" || String(text || "").trim() === "pomodoro"
}

function isParentLinkCommand(text) {
  return String(text || "").trim().toLowerCase().startsWith("link parent ")
}

function isParentUnlinkCommand(text) {
  return ["unlink parent", "remove parent", "stop parent report"].includes(String(text || "").trim().toLowerCase())
}

function isParentStatusCommand(text) {
  return ["parent status", "parent info", "my parent"].includes(String(text || "").trim().toLowerCase())
}

function isFindBuddyCommand(text) {
  return ["find buddy", "study buddy", "study partner", "find partner"].includes(String(text || "").trim().toLowerCase())
}

function isMyBuddyCommand(text) {
  return ["my buddy", "buddy profile", "my profile"].includes(String(text || "").trim().toLowerCase())
}

function isRemoveBuddyCommand(text) {
  return ["remove buddy", "stop buddy", "delete buddy"].includes(String(text || "").trim().toLowerCase())
}

function isFlipCardCommand(text) {
  return ["flip", "show answer", "answer", "reveal"].includes(String(text || "").trim().toLowerCase())
}

function isNextCardCommand(text) {
  return ["next", "next card", "skip"].includes(String(text || "").trim().toLowerCase())
}

function isVacationCommand(text) {
  return String(text || "").trim().match(/^vacation\s+(\d+)$/) || String(text || "").trim() === "vacation mode"
}
function isEndVacationCommand(text) {
  return ["end vacation", "back from vacation", "resume study"].includes(String(text || "").trim())
}
function isLanguageCommand(text) {
  return ["hindi mode", "english mode", "tamil mode", "change language", "language"].includes(String(text || "").trim())
}
function isDailyChallengeCommand(text) {
  return ["daily challenge", "today challenge", "challenge of the day"].includes(String(text || "").trim())
}
function isShareChallengeCommand(text) {
  return ["share challenge", "challenge share"].includes(String(text || "").trim())
}
function isAdminAnalyticsCommand(text) {
  return ["admin analytics", "/analytics", "admin insights"].includes(String(text || "").trim())
}
function isFollowUpCommand(text) {
  return String(text || "").trim() === "suggest more" || String(text || "").trim() === "more questions" || String(text || "").trim() === "related questions"
}
function isVoiceHelpCommand(text) {
  return ["voice help", "how to voice", "send voice"].includes(String(text || "").trim())
}

// ── Teacher / Classroom command parsers ─────────────────────────────────────
function isRequestTeacherCommand(text) {
  return /^request teacher$/i.test(text.trim())
}
function parseCreateClassCommand(text) {
  // "create class [name] [subject] [grade]" or "create class Math Class 8"
  const m = text.trim().match(/^create class\s+(.+?)\s+(\S+)\s+(\d+[A-Za-z]?)$/i)
  if (!m) return null
  return { name: m[1].trim(), subject: m[2].trim(), grade: m[3].trim() }
}
function parseJoinClassCommand(text) {
  const m = text.trim().match(/^join class\s+([A-Z0-9]{4,6})$/i)
  return m ? m[1].toUpperCase() : null
}
function parseClassQuizCommand(text) {
  const m = text.trim().match(/^class quiz\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function isClassProgressCommand(text) {
  return /^class progress$/i.test(text.trim())
}
function parseApproveTeacherCommand(text) {
  const m = text.trim().match(/^approve teacher\s+(\d{10,})/i)
  return m ? m[1] : null
}
function isPendingTeachersCommand(text) {
  return /^pending teachers$/i.test(text.trim())
}

// ── Tutor Mode / Exam Mode / Photo Help command parsers ─────────────────────
function parseTeachCommand(text) {
  const m = String(text || "").trim().match(/^teach\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function parseExamDoubtCommand(text) {
  const m = String(text || "").trim().match(/^exam\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function isPhotoHelpCommand(text) {
  return /^(photo help|how to send photo|send photo|homework photo|photo guide|image help)$/i.test(String(text || "").trim())
}

function isStudyStatsCommand(text) {
  return ["study stats", "my stats", "statistics"].includes(text)
}

function isStopAnswerReviewCommand(text) {
  return [
    "stop review",
    "cancel review",
    "end review",
    "stop checking",
    "!stopreview"
  ].includes(text)
}

function isStopHomeworkCommand(text) {
  return [
    "stop homework",
    "end homework",
    "cancel homework",
    "quit homework",
    "!stophomework"
  ].includes(text)
}

function isShowHomeworkAnswerCommand(text) {
  return [
    "show answer",
    "show full answer",
    "give answer",
    "solve it",
    "full solution",
    "final answer"
  ].includes(text)
}


// ── New Smart Feature Command Parsers ──────────────────────────────────────

function parseEvaluateCommand(text) {
  // "evaluate my answer: <answer>" or "check my answer: <answer>" or "evaluate <question> ||| <answer>"
  const m1 = String(text || "").trim().match(/^(?:evaluate|check)\s+my\s+answer[:\s]+(.+)$/i)
  if (m1) return { type: "direct", answer: m1[1].trim() }
  const m2 = String(text || "").trim().match(/^evaluate\s+(.+?)\s*\|\|\|\s*(.+)$/i)
  if (m2) return { type: "combined", question: m2[1].trim(), answer: m2[2].trim() }
  return null
}
function isEvaluateCommand(text) { return !!parseEvaluateCommand(text) }

function parseTestMeCommand(text) {
  const m = String(text || "").trim().match(/^(?:test|quiz|ask)\s+me\s+(?:on\s+)?(.+)$/i)
  return m ? m[1].trim() : null
}
function isTestMeCommand(text) { return !!parseTestMeCommand(text) }

function parseConceptMapCommand(text) {
  const m = String(text || "").trim().match(/^(?:concept\s+map|mind\s+map|visualize)\s+(?:for\s+)?(.+)$/i)
  return m ? m[1].trim() : null
}
function isConceptMapCommand(text) { return !!parseConceptMapCommand(text) }

function parseCompareCommand(text) {
  const m = String(text || "").trim().match(/^(?:compare|difference\s+between)\s+(.+?)\s+(?:vs|versus|and)\s+(.+)$/i)
  return m ? { conceptA: m[1].trim(), conceptB: m[2].trim() } : null
}
function parseStudyGoalCommand(text) {
  const m = String(text || "").trim().match(/^(?:set\s+)?study\s+goal\s+(.+)$/i)
  return m ? m[1].trim() : null
}
function isStudyGoalCommand(text) { return !!parseStudyGoalCommand(text) }

function parseQuickRevisionCommand(text) {
  const m = String(text || "").trim().match(/^(?:quick\s+revision|revise|last\s+minute|exam\s+revision)\s+(?:for\s+)?(.+)$/i)
  return m ? m[1].trim() : null
}
function isQuickRevisionCommand(text) { return !!parseQuickRevisionCommand(text) }

function parseSRSCommand(text) {
  if (["start srs review", "srs", "srs review", "srs stats", "my srs", "srs progress"].includes(String(text || "").trim().toLowerCase())) {
    return { action: "start", topic: "" }
  }
  const m = String(text || "").trim().match(/^srs\s+(.+)$/i)
  return m ? { action: "topic", topic: m[1].trim() } : null
}
function isSRSCommand(text) { return !!parseSRSCommand(text) }

function isSRSShowCommand(text) {
  return ["show", "reveal", "flip"].includes(String(text || "").trim().toLowerCase())
}

function isSRSRatingCommand(text) {
  return ["again", "hard", "good", "easy"].includes(String(text || "").trim().toLowerCase())
}

function isStopSRSCommand(text) {
  return ["stop srs", "end srs", "quit srs", "srs stop"].includes(String(text || "").trim().toLowerCase())
}

function extractQuizTopic(text) {
  const normalized = String(text || "").trim()
  if (!normalized) {
    return ""
  }

  const quizWithTopic = normalized.match(/^(?:start\s+)?quiz(?:\s+on)?\s+(.+)$/i)
  if (quizWithTopic?.[1]) {
    return quizWithTopic[1].trim()
  }

  return ""
}

function extractMockTestTopic(text) {
  const normalized = String(text || "").trim()
  if (!normalized) {
    return ""
  }

  const match = normalized.match(/^(?:start\s+)?mock\s*test(?:\s+on)?\s*(.*)$/i)
  if (!match) {
    return ""
  }

  return String(match[1] || "").trim()
}

function extractHomeworkProblem(text) {
  const normalized = String(text || "").trim()
  if (!normalized) {
    return ""
  }

  const homeworkWithProblem = normalized.match(
    /^(?:homework|homework help|coach me|solve with hints|guide me through)\s+(.+)$/i
  )
  if (homeworkWithProblem?.[1]) {
    return homeworkWithProblem[1].trim()
  }

  return ""
}

function normalizeQuizOption(option) {
  const raw = String(option || "").trim()
  const match = raw.match(/^([A-D])[\).\-\:]\s*(.+)$/i)

  if (match) {
    return {
      key: match[1].toUpperCase(),
      text: match[2].trim(),
      display: `${match[1].toUpperCase()}. ${match[2].trim()}`
    }
  }

  return {
    key: "",
    text: raw,
    display: raw
  }
}

function buildListRowsFromOptions(options) {
  return (options || []).map((option) => {
    const normalized = normalizeQuizOption(option)
    return {
      id: normalized.key || normalized.display,
      title: normalized.display.slice(0, 24),
      description: normalized.text.length > 24 ? normalized.text.slice(0, 72) : ""
    }
  })
}

function buildInteractiveQuestionResponse(text, options, runtimeOptions = {}) {
  if (!runtimeOptions.preferInteractive) {
    return text
  }

  return {
    type: "list",
    text,
    buttonText: "Answer",
    sectionTitle: "Choose your answer",
    rows: buildListRowsFromOptions(options)
  }
}

function buildHomeworkActionResponse(text, runtimeOptions = {}) {
  if (!runtimeOptions.preferInteractive) {
    return text
  }

  return {
    type: "buttons",
    text,
    buttons: [
      { id: "hint", title: "Hint" },
      { id: "show answer", title: "Show Answer" },
      { id: "stop homework", title: "Stop" }
    ]
  }
}

function buildTeachingFollowupResponse(text, runtimeOptions = {}, options = {}) {
  // Return clean text only - no chatbot buttons
  return text
}

function buildWelcomeResponse(user = {}, runtimeOptions = {}) {
  const name = user.name || "Student"
  const level = user.level || user.class || ""
  const subjects = user.subjectInterests?.join(", ") || "All subjects"
  const text = [
    `*Welcome back, ${name}!*`,
    "",
    "I am your AI Study Guru, ready to help you learn anything in simple and clear language.",
    "",
    `*Your Profile:*`,
    `Class: ${level || "Not set"}`,
    `Board: ${user.board || "Not set"}`,
    `Language: ${user.language || "English"}`,
    `Subjects: ${subjects}`,
    `Teaching Pace: ${user.teachingPacePreference || "auto"}`,
    "",
    "*Quick Commands:*",
    "- Just ask any study question",
    "- 'quiz topic' for practice quiz",
    "- 'mock test topic' for exam test",
    "- 'help' for full command list",
    "",
    "What would you like to learn today?"
  ].join("\n")

  if (!runtimeOptions.preferInteractive || runtimeOptions.channel !== "whatsapp") {
    return text
  }

  return {
    type: "buttons",
    text,
    buttons: [
      { id: "study mode", title: "Study Mode" },
      { id: "subjects", title: "Subjects" },
      { id: "help", title: "Help" }
    ]
  }
}

function pickNextDifficulty(currentDifficulty, wasCorrect) {
  const order = ["easy", "medium", "hard"]
  const currentIndex = Math.max(order.indexOf(currentDifficulty), 0)

  if (wasCorrect) {
    return order[Math.min(currentIndex + 1, order.length - 1)]
  }

  return order[Math.max(currentIndex - 1, 0)]
}

function matchQuizAnswer(session, answerText) {
  const normalizedAnswer = extractAnswerCandidate(answerText)
  if (!normalizedAnswer) {
    return { valid: false }
  }

  const options = Array.isArray(session.currentQuestion?.options)
    ? session.currentQuestion.options.map(normalizeQuizOption)
    : []

  const answerUpper = normalizedAnswer.toUpperCase()
  const directLetter = answerUpper.match(/^[A-D]$/)
  if (directLetter) {
    return { valid: true, selectedKey: directLetter[0] }
  }

  for (const option of options) {
    if (!option.key) {
      continue
    }

    if (answerUpper === option.display.toUpperCase() || answerUpper === option.text.toUpperCase()) {
      return { valid: true, selectedKey: option.key }
    }

    if (answerUpper.includes(option.text.toUpperCase()) && option.text.length > 4) {
      return { valid: true, selectedKey: option.key }
    }
  }

  return { valid: false }
}

function extractAnswerCandidate(answerText) {
  const raw = String(answerText || "").trim()
  if (!raw) {
    return ""
  }

  const lines = raw
    .split("\n")
    .map((line) => String(line || "").trim())
    .filter(Boolean)

  const directChoiceLine = [...lines].reverse().find((line) => /^[A-D](?:[\.\):\-\s]|$)/i.test(line))
  if (directChoiceLine) {
    return directChoiceLine
  }

  const directChoice = [...lines].reverse().find((line) => /^[A-D]$/i.test(line))
  if (directChoice) {
    return directChoice
  }

  return raw
}

function looksLikeChoiceReply(answerText) {
  const candidate = extractAnswerCandidate(answerText)
  return /^[A-D](?:[\.\):\-\s]|$)/i.test(String(candidate || "").trim())
}

function buildQuizQuestionMessage(session) {
  const question = session.currentQuestion || {}
  const options = Array.isArray(question.options) ? question.options.map(normalizeQuizOption) : []

  return [
    `*Adaptive Quiz: ${session.topic}*`,
    "",
    `Question ${session.questionNumber} of ${session.maxQuestions}`,
    `Difficulty: ${question.difficulty || session.currentDifficulty || "medium"}`,
    "",
    question.question || "Question unavailable.",
    "",
    ...options.map((option) => option.display),
    "",
    "Reply with A, B, C, or D."
  ].join("\n")
}

function buildMockTestQuestionMessage(session) {
  const question = session.questions?.[session.currentIndex] || {}
  const options = Array.isArray(question.options) ? question.options.map(normalizeQuizOption) : []
  const recommendedMinutes = Number(session.recommendedMinutes || 15)

  return [
    `*Mock Test: ${session.topic}*`,
    "",
    `Question ${session.currentIndex + 1} of ${session.totalQuestions}`,
    `Subject: ${session.subject}`,
    `Recommended time: ${recommendedMinutes} minutes`,
    "",
    question.question || "Question unavailable.",
    "",
    ...options.map((option) => option.display),
    "",
    "Reply with A, B, C, or D."
  ].join("\n")
}

function buildAnswerReviewPrompt({
  user,
  subject,
  questionText,
  studentAnswer,
  masteryContext,
  emotionalContext = "",
  emotionalSummary = "",
  agentMemoryContext = "",
  teachingToneDirective = ""
}) {
  return `
You are a premium educational teacher for Indian students.

Student:
- Level: ${user.level || user.class || "Unknown"}
- Board/Exam: ${user.board || "Unknown"}
- Subject: ${subject}
- Preferred language: ${user.language || "English"}

Task:
Check the student's written answer like a real teacher.

Rules:
1. Judge accuracy, completeness, and clarity based on the student's level.
2. Be encouraging but honest.
3. Use simple, premium teacher language.
4. Point out what is correct, what is missing, and how to improve.
5. If the answer is weak, provide a short improved answer.
6. Return strict JSON only.
7. ${masteryContext ? `Learning memory: ${masteryContext}` : "Learning memory: none"}
8. ${agentMemoryContext ? `Teacher memory: ${agentMemoryContext}` : "Teacher memory: none"}
9. ${emotionalSummary ? `Recent emotional trend: ${emotionalSummary}` : "Recent emotional trend: stable"}
10. ${emotionalContext ? `Emotional adaptation: ${emotionalContext}` : "Emotional adaptation: stay calm and encouraging"}
11. ${teachingToneDirective ? `Tone adjustment: ${teachingToneDirective}` : "Tone adjustment: use warm, clear teacher language"}

Question:
${questionText}

Student answer:
${studentAnswer}

JSON format:
{
  "score": 0,
  "verdict": "correct_or_good | partly_correct | incorrect",
  "topic": "short topic name",
  "strengths": ["short point", "short point"],
  "mistakes": ["short point", "short point"],
  "feedback": "2 to 4 short teaching lines",
  "improvedAnswer": "a short model answer in student-friendly language"
}
`
}

function buildAnswerReviewResultMessage(review) {
  const strengths = Array.isArray(review.strengths) ? review.strengths.filter(Boolean).slice(0, 3) : []
  const mistakes = Array.isArray(review.mistakes) ? review.mistakes.filter(Boolean).slice(0, 3) : []
  const verdictLabel =
    review.verdict === "correct_or_good"
      ? "Strong answer"
      : review.verdict === "partly_correct"
        ? "Partly correct"
        : "Needs improvement"

  return [
    "*Answer Review*",
    "",
    `Score: ${review.score}/10`,
    `Verdict: ${verdictLabel}`,
    review.topic ? `Topic: ${review.topic}` : "",
    strengths.length ? "" : "",
    strengths.length ? "*What You Did Well:*" : "",
    ...strengths.map((item) => `- ${item}`),
    mistakes.length ? "" : "",
    mistakes.length ? "*What To Improve:*" : "",
    ...mistakes.map((item) => `- ${item}`),
    review.feedback ? "" : "",
    review.feedback ? `*Teacher Feedback:*\n${review.feedback}` : "",
    review.improvedAnswer ? "" : "",
    review.improvedAnswer ? `*Better Answer:*\n${review.improvedAnswer}` : "",
    "",
    "Use 'check answer' again if you want me to review another written answer."
  ]
    .filter(Boolean)
    .join("\n")
}

function buildHomeworkCoachPrompt({ user, subject, problemText, masteryContext }) {
  return `
You are a premium homework coach for an Indian student.

Student:
- Level: ${user.level || user.class || "Unknown"}
- Board/Exam: ${user.board || "Unknown"}
- Subject: ${subject}
- Preferred language: ${user.language || "English"}

Task:
Do not give the full solution immediately. Create a guided homework coaching plan.

Rules:
1. Understand the problem and produce 3 progressive hints.
2. Hint 1 should be very light.
3. Hint 2 should guide the method more clearly.
4. Hint 3 can be almost the full setup, but still not the final final answer line.
5. The final answer should be clear and correct.
6. The final answer should be written in a short teacher style with steps when needed.
7. Keep everything WhatsApp-friendly and student-friendly.
8. Return strict JSON only.
9. ${masteryContext ? `Learning memory: ${masteryContext}` : "Learning memory: none"}

Problem:
${problemText}

JSON format:
{
  "topic": "short topic name",
  "hints": ["hint 1", "hint 2", "hint 3"],
  "commonMistake": "short warning",
  "answerCheckTip": "what the student should check in their own work",
  "finalAnswer": "full worked answer in clean teacher style with short steps and final answer"
}
`
}

function buildHomeworkCoachStartMessage(session) {
  return [
    `*Homework Coach: ${session.topic || session.subject}*`,
    "",
    `Problem: ${session.problemText}`,
    "",
    "*Hint 1:*",
    session.hints[0] || "Start by identifying what the question is asking.",
    "",
    session.answerCheckTip ? `Check yourself: ${session.answerCheckTip}` : "",
    "",
    "Reply with 'hint' for the next hint, send your own attempt, or type 'show answer' for the full solution."
  ]
    .filter(Boolean)
    .join("\n")
}

function buildHomeworkHintMessage(session, hintIndex) {
  const hintNumber = hintIndex + 1
  const hintText = session.hints[hintIndex] || "Try identifying the key formula or concept first."

  return [
    `*Homework Coach: ${session.topic || session.subject}*`,
    "",
    `*Hint ${hintNumber}:*`,
    hintText,
    "",
    session.commonMistake ? `Common mistake: ${session.commonMistake}` : "",
    "",
    hintIndex >= (session.hints.length - 1)
      ? "This is the last hint. You can now try it yourself or type 'show answer' for the full solution."
      : "Reply with 'hint' for the next hint, send your own attempt, or type 'show answer' for the full solution."
  ]
    .filter(Boolean)
    .join("\n")
}

function buildHomeworkAnswerMessage(session) {
  return [
    `*Homework Solution: ${session.topic || session.subject}*`,
    "",
    session.finalAnswer || "I could not generate the full solution right now.",
    "",
    session.commonMistake ? `Common mistake: ${session.commonMistake}` : "",
    "",
    "If you want, use 'check answer' next time and I will review your written solution like a teacher."
  ]
    .filter(Boolean)
    .join("\n")
}

function buildHomeworkAttemptFeedbackMessage(review) {
  const strengths = Array.isArray(review.strengths) ? review.strengths.filter(Boolean).slice(0, 2) : []
  const mistakes = Array.isArray(review.mistakes) ? review.mistakes.filter(Boolean).slice(0, 2) : []

  return [
    "*Homework Coach Feedback*",
    "",
    `Score so far: ${review.score}/10`,
    strengths.length ? "*Good so far:*" : "",
    ...strengths.map((item) => `- ${item}`),
    mistakes.length ? "" : "",
    mistakes.length ? "*Fix this next:*" : "",
    ...mistakes.map((item) => `- ${item}`),
    review.feedback ? "" : "",
    review.feedback ? `*Teacher Tip:*\n${review.feedback}` : "",
    "",
    "Reply with 'hint' for more guidance, send another improved attempt, or type 'show answer' for the full solution."
  ]
    .filter(Boolean)
    .join("\n")
}

function buildQuizSummaryMessage(session) {
  const score = `${session.correctAnswers}/${session.maxQuestions}`
  const accuracy = session.maxQuestions ? Math.round((session.correctAnswers / session.maxQuestions) * 100) : 0
  const weakTopics = Array.isArray(session.weakSkills) && session.weakSkills.length > 0
    ? session.weakSkills.join(", ")
    : session.topic

  return [
    `*Quiz Complete: ${session.topic}*`,
    "",
    `Score: ${score}`,
    `Accuracy: ${accuracy}%`,
    `Subject: ${session.subject}`,
    `Revise next: ${weakTopics}`,
    "",
    accuracy >= 80
      ? "Strong work. You can try a harder quiz or move to exam-style questions."
      : "Good attempt. I recommend one more quiz on the same topic or a simple revision explanation.",
    `Try: quiz ${session.topic}`
  ].join("\n")
}

function buildMockTestSummaryMessage(result) {
  const accuracy = result.totalQuestions ? Math.round((result.score / result.totalQuestions) * 100) : 0
  const weakAreas = Array.isArray(result.weakAreas) && result.weakAreas.length
    ? result.weakAreas.join(", ")
    : result.topic
  const strongAreas = Array.isArray(result.strongAreas) && result.strongAreas.length
    ? result.strongAreas.join(", ")
    : result.subject

  return [
    `*Mock Test Complete: ${result.topic}*`,
    "",
    `Score: ${result.score}/${result.totalQuestions}`,
    `Accuracy: ${accuracy}%`,
    `Subject: ${result.subject}`,
    result.elapsedMinutes ? `Time used: ${result.elapsedMinutes} min` : "",
    `Strong areas: ${strongAreas}`,
    `Revise next: ${weakAreas}`,
    "",
    accuracy >= 80
      ? "Excellent work. You are ready for a harder mock test or exam-style revision."
      : "Good effort. Revise the weak areas and then take another mock test on the same topic.",
    `Try next: mock test ${result.topic}`
  ]
    .filter(Boolean)
    .join("\n")
}

function appendRewardSummary(baseMessage, summary) {
  const footer = buildRewardFooter(summary)
  if (!footer) {
    return baseMessage
  }

  return [baseMessage, "", `Reward update: ${footer}`].join("\n")
}

function buildDailyChallengeResultMessage(challenge, wasCorrect, correctOption) {
  return [
    "*Daily Challenge Result*",
    "",
    wasCorrect ? "Well done. Your answer is correct." : "Not correct this time, but the idea is simple once you revise it clearly.",
    `Correct answer: ${correctOption?.display || challenge.correctOption}`,
    challenge.explanation ? `Easy explanation: ${challenge.explanation}` : "",
    "",
    `Topic: ${challenge.topic}`,
    `Subject: ${challenge.subject}`,
    "",
    "Come back tomorrow for one fresh challenge."
  ]
    .filter(Boolean)
    .join("\n")
}

function buildQuizGenerationPrompt({ user, topic, subject, difficulty, previousSkills = [] }) {
  const learnerLevel = user.level || user.class || "Unknown"
  const language = user.language || "English"
  const avoidSkills = previousSkills.length ? previousSkills.join(", ") : "none"

  return `
Create exactly one premium educational multiple-choice question for an Indian student.

Student profile:
- Level: ${learnerLevel}
- Board/Exam: ${user.board || "Unknown"}
- Subject: ${subject}
- Preferred language: ${language}

Quiz rules:
1. Topic: ${topic}
2. Difficulty: ${difficulty}
3. Ask only one MCQ with 4 options.
4. Keep it syllabus-aligned and student-friendly.
5. The correct answer must be unambiguous.
6. Avoid repeating these recently used skill tags: ${avoidSkills}
7. Return strict JSON only.

JSON format:
{
  "question": "string",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctOption": "A",
  "explanation": "2 to 4 short teaching lines",
  "difficulty": "${difficulty}",
  "skillTag": "short topic name"
}
`
}

function buildMockTestPrompt({ user, topic, subject }) {
  return `
Create a premium mini mock test for an Indian student.

Student profile:
- Level: ${user.level || user.class || "Unknown"}
- Board/Exam: ${user.board || "Unknown"}
- Subject: ${subject}
- Preferred language: ${user.language || "English"}

Mock test rules:
1. Topic: ${topic}
2. Create exactly 5 syllabus-aligned MCQs.
3. Use a mix of easy, medium, and hard questions.
4. Keep wording clear and exam-like.
5. Each question must have exactly 4 options.
6. The correct option must be unambiguous.
7. Return strict JSON only.

JSON format:
{
  "recommendedMinutes": 15,
  "questions": [
    {
      "question": "string",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": "A",
      "explanation": "2 to 4 short teaching lines",
      "skillTag": "short skill or subtopic"
    }
  ]
}
`
}

async function askOpenClaw(prompt, options = {}) {
  const result = await askOpenClawWithMeta(prompt, options)
  return result?.text || null
}

function isLoopbackRequest(req) {
  const remoteAddress = req.socket?.remoteAddress || req.ip || ""
  return remoteAddress === "::1" || remoteAddress === "127.0.0.1" || remoteAddress === "::ffff:127.0.0.1"
}

function requireDashboardAuth(req, res, next) {
  if (isLoopbackRequest(req)) {
    return next()
  }

  if (!DASHBOARD_API_KEY) {
    return res.status(403).json({
      error: "Dashboard access is disabled until DASHBOARD_API_KEY is configured on the server."
    })
  }

  const authorizationHeader = String(req.get("authorization") || "").trim()
  const bearerToken = authorizationHeader.toLowerCase().startsWith("bearer ")
    ? authorizationHeader.slice(7).trim()
    : ""
  const providedKey = req.get("x-dashboard-key") || bearerToken
  if (providedKey !== DASHBOARD_API_KEY) {
    return res.status(401).json({ error: "Unauthorized dashboard request." })
  }

  return next()
}

function requireAgentAuth(req, res, next) {
  if (isLoopbackRequest(req)) {
    return next()
  }

  if (!AGENT_API_KEY) {
    return res.status(403).json({
      error: "Agent access is disabled until AGENT_API_KEY is configured on the server."
    })
  }

  const providedKey = req.get("x-agent-key")
  if (providedKey !== AGENT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized agent request." })
  }

  return next()
}

function isProfileCommand(text) {
  return ["profile", "my profile", "!profile", "view profile"].includes(text)
}

function isEditProfileCommand(text) {
  return [
    "edit profile",
    "update profile",
    "change profile",
    "!editprofile",
    "!edit profile"
  ].includes(text)
}

function isChangeLanguageCommand(text) {
  return [
    "language",
    "my language",
    "change language",
    "update language",
    "set language",
    "!language",
    "!change language"
  ].includes(text)
}

function isChangeClassCommand(text) {
  return [
    "change class",
    "update class",
    "set class",
    "change level",
    "update level",
    "set level",
    "edit class",
    "edit level"
  ].includes(text)
}

function isChangeBoardCommand(text) {
  return [
    "change board",
    "update board",
    "set board",
    "change university",
    "update university",
    "set university",
    "change exam",
    "update exam",
    "set exam",
    "edit board"
  ].includes(text)
}

function isSubjectsCommand(text) {
  return [
    "subjects",
    "my subjects",
    "show subjects",
    "!subjects"
  ].includes(text)
}

function isChangeSubjectsCommand(text) {
  return [
    "change subjects",
    "update subjects",
    "set subjects",
    "edit subjects",
    "subject preferences",
    "!changesubjects",
    "!subjects edit"
  ].includes(text)
}

function isDeleteProfileCommand(text) {
  return [
    "delete profile",
    "remove profile",
    "!deleteprofile",
    "!delete profile"
  ].includes(text)
}

function isSpeedMathCommand(text) {
  return ["speed math", "math challenge", "math game", "speedmath", "!math"].includes(String(text || "").trim().toLowerCase())
}
function isGKQuizCommand(text) {
  return ["gk quiz", "quiz me", "current affairs", "general knowledge", "gk", "!gk"].includes(String(text || "").trim().toLowerCase())
}
function isDailyReportCommand(text) {
  return ["daily report", "my report", "today report", "study report", "!report"].includes(String(text || "").trim().toLowerCase())
}
function isWeeklyReportCommand(text) {
  return ["weekly report", "week report", "weekly summary", "!weekly"].includes(String(text || "").trim().toLowerCase())
}
function isExamAddCommand(text) {
  return String(text || "").trim().toLowerCase().startsWith("exam add ")
}
function isExamListCommand(text) {
  return ["my exams", "exam list", "exam countdown", "exams"].includes(String(text || "").trim().toLowerCase())
}
function isExamTipCommand(text) {
  return ["exam tip", "study tip", "exam advice", "preparation tip"].includes(String(text || "").trim().toLowerCase())
}
function isStopQuizCommand(text) {
  return ["stop quiz", "end quiz", "quit quiz"].includes(String(text || "").trim().toLowerCase())
}

function isMotivationalCommand(text) {
  return ["motivate", "motivation", "quote", "quote of the day", "daily quote", "inspire"].includes(String(text || "").trim().toLowerCase())
}

function isFactCommand(text) {
  return ["fact", "fact of the day", "amazing fact", "did you know", "tell me a fact"].includes(String(text || "").trim().toLowerCase())
}

function isWordOfDayCommand(text) {
  return ["word of the day", "vocab", "vocabulary", "new word", "daily word"].includes(String(text || "").trim().toLowerCase())
}

function isVocabQuizCommand(text) {
  return ["vocab quiz", "vocab test", "word quiz", "english quiz"].includes(String(text || "").trim().toLowerCase())
}
function isPYQCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("pyq ") === 0 || t.indexOf("!pyq ") === 0 || t === "pyq" || t === "previous year questions" || t === "pyq papers"
}
function isSyllabusCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "syllabus" || t.indexOf("syllabus ") === 0 || t === "my syllabus"
}
function isDoubtCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("ask doubt ") === 0 || t === "ask doubt" || t === "clear doubt" || t === "doubt"
}
function isPracticeCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("practice ") === 0 || t === "practice" || t === "!practice"
}
function isConceptQuizCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("concept quiz ") === 0 || t === "concept quiz"
}
function isAnalyticsCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "analytics" || t === "study analytics" || t === "my stats" || t === "study stats" || t === "stats"
}
function isEndDoubtCommand(text) {
  return String(text || "").trim().toLowerCase() === "end doubt"
}
function isShowAnswersCommand(text) {
  return String(text || "").trim().toLowerCase() === "answers"
}
function isCareerCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("career ") === 0 || t === "career" || t === "career guidance" || t.indexOf("career guidance ") === 0
}
function isExamStrategyCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("exam strategy") === 0 || t === "exam strategy" || t === "exam tips" || t === "board tips"
}
function isNoteSaveCommand(text) {
  return String(text || "").trim().toLowerCase().indexOf("note save ") === 0
}
function isNotesListCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "my notes" || t === "notes" || t.indexOf("notes ") === 0
}
function isNoteViewCommand(text) {
  return String(text || "").trim().toLowerCase().indexOf("note view ") === 0
}
function isNoteDeleteCommand(text) {
  return String(text || "").trim().toLowerCase().indexOf("note delete ") === 0
}
function isMoodCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("mood ") === 0 || t === "mood" || t === "my mood" || t === "mood stats"
}
function isPerformanceReportCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "performance" || t === "my performance" || t === "monthly report" || t === "performance report"
}
function isWhiteboardCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("whiteboard ") === 0 || t === "whiteboard"
}

function isTimerStartCommand(text) {
  return String(text || "").trim().toLowerCase().startsWith("timer ") || ["pomodoro", "study timer"].includes(String(text || "").trim().toLowerCase())
}

function isTimerStatusCommand(text) {
  return ["timer status", "timer check", "how much time"].includes(String(text || "").trim().toLowerCase())
}

function isTimerDoneCommand(text) {
  return ["timer done", "break done", "study done", "timer next"].includes(String(text || "").trim().toLowerCase())
}



function isTimerStopCommand(text) {
  return String(text || "").trim().toLowerCase() === "timer stop"
}

function isMindMapCommand(text) {
  return String(text || "").trim().toLowerCase().startsWith("mindmap ")
}

function isAINotesCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("notes ai ") === 0 || t === "notes ai" || t.indexOf("ai notes ") === 0
}
function isMnemonicCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("mnemonic ") === 0 || t === "mnemonic" || t.indexOf("mnemonics ") === 0
}
function isCompareCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("compare ") === 0 || t.indexOf("difference between ") === 0
}
function isRemindCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("remind ") === 0 || t.indexOf("reminder ") === 0 || t.indexOf("set reminder") === 0
}
function isCancelReminderCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("cancel reminder") === 0
}
function isClearRemindersCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "clear reminders" || t === "clear all reminders"
}
function isMyRemindersCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "my reminders" || t === "reminders" || t === "reminder list"
}
function isMyBadgesCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "my badges" || t === "badges" || t === "achievements" || t === "my achievements"
}
function isChallengeLeaderboardCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "challenge leaderboard" || t === "challenge ranks" || t === "challenge scores"
}

function isFormulaCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("formulas ") === 0 || t === "formulas" || t.indexOf("formula sheet") === 0
}
function isSetGoalCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("set goal ") === 0 || t.indexOf("study goal ") === 0
}
function isStudyProgressCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "study progress" || t === "goal progress" || t === "my progress" || t === "study stats"
}
function isReviseCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("revise ") === 0 || t === "revise" || t === "revision cards"
}
function isFlipRevisionCommand(text) {
  return String(text || "").trim().toLowerCase() === "flip"
}
function isNextRevisionCommand(text) {
  return String(text || "").trim().toLowerCase() === "next"
}
function isDoneRevisionCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "done revision" || t === "done revise" || t === "end revision"
}
function isCreateClassCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("create class ") === 0 || t === "create class"
}
function isJoinClassCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("join class ") === 0 || t.indexOf("join classroom ") === 0
}
function isLeaveClassCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "leave class" || t === "leave classroom"
}
function isMyClassCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "my class" || t === "classroom" || t === "my classroom"
}
function isStudyTipCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "study tip" || t === "tips" || t === "tip of the day" || t === "daily tip" || t.indexOf("tips ") === 0
}
function isExamAddCountdownCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("exam add ") === 0
}
function isExamRemoveCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t.indexOf("exam remove ") === 0
}
function isExamCountdownCommand(text) {
  var t = String(text || "").trim().toLowerCase()
  return t === "exam countdown" || t === "exam dates" || t === "my countdowns"
}

function isHelpCommand(text) {
  return ["help", "!help", "menu", "commands"].includes(text)
}

function isStudyModeCommand(text) {
  return ["study mode", "learning mode", "teaching mode", "!studymode"].includes(text)
}

function isTeachEasierCommand(text) {
  return [
    "teach easier",
    "explain easier",
    "easy mode",
    "slow down",
    "!easier"
  ].includes(text)
}

function isTeachSameLevelCommand(text) {
  return [
    "same level",
    "normal mode",
    "teach normal",
    "balanced mode",
    "!normal"
  ].includes(text)
}

function isTeachHarderCommand(text) {
  return [
    "teach harder",
    "challenge me",
    "hard mode",
    "teach advanced",
    "!harder"
  ].includes(text)
}

function isEasierExampleCommand(text) {
  return [
    "easier example",
    "easy example",
    "simpler example",
    "one easier example",
    "!example"
  ].includes(text)
}

function isQuickTestCommand(text) {
  return [
    "quick test",
    "test me",
    "one quick test",
    "ask me one question",
    "!testme"
  ].includes(text)
}

function isQuickPickSubjectCommand(text) {
  return String(text || "").startsWith("pick_subject::")
}

function isPricingCommand(text) {
  return ["pricing", "plans", "premium", "premium plan", "upgrade"].includes(text)
}

function isMyPlanCommand(text) {
  return ["my plan", "plan", "subscription", "my subscription"].includes(text)
}

function isReferralSummaryCommand(text) {
  return ["referral", "my referral", "refer", "my earnings", "referral earnings"].includes(text)
}

function parseBuyPlanCommand(text) {
  const match = String(text || "").trim().match(/^(?:buy|upgrade|get)\s+(monthly|yearly)$/i)
  if (!match) {
    return null
  }

  return String(match[1] || "").toLowerCase()
}

function isPaymentStatusCommand(text) {
  return ["payment status", "my payment", "payment"].includes(text)
}

function isPaymentSubmittedCommand(text) {
  return [
    "i paid",
    "paid",
    "payment done",
    "i have paid",
    "payment sent"
  ].includes(text)
}

function extractReferralPhone(text) {
  const match = String(text || "").trim().match(/^(?:refer by|ref by|referred by|use referral)\s+(\+?\d{8,15})$/i)
  return match?.[1] ? normalizePhone(match[1]) : ""
}

function parseAdminActivatePlanCommand(text) {
  const match = String(text || "").trim().match(/^admin\s+activate\s+(monthly|yearly)\s+(\+?\d{8,15})$/i)
  if (!match) {
    return null
  }

  return {
    planType: String(match[1] || "").toLowerCase(),
    phone: normalizePhone(match[2])
  }
}

function parseAdminConfirmPaymentCommand(text) {
  const match = String(text || "").trim().match(/^admin\s+confirm\s+payment\s+(\+?\d{8,15})$/i)
  if (!match) {
    return null
  }

  return {
    phone: normalizePhone(match[1])
  }
}

function parseAdminRejectPaymentCommand(text) {
  const match = String(text || "").trim().match(/^admin\s+reject\s+payment\s+(\+?\d{8,15})$/i)
  if (!match) {
    return null
  }

  return {
    phone: normalizePhone(match[1])
  }
}

function isAdminPendingPaymentsCommand(text) {
  return [
    "admin pending payments",
    "admin submitted payments",
    "admin payment queue"
  ].includes(String(text || "").trim().toLowerCase())
}

function isAdminDashboardCommand(text) {
  return ["admin", "admin stats", "admin dashboard", "/admin"].includes(text)
}

function isAdminPhone(phone) {
  return ADMIN_PHONES.has(normalizePhone(phone))
}

function buildPricingMessage(accessProfile = {}) {
  const plans = getPlanCatalog()
  const tierLine = accessProfile.premium
    ? "Current plan: Premium"
    : "Current plan: Free"

  return [
    "*AI Study Guru Plans*",
    "",
    tierLine,
    "",
    "*Free*",
    `- ${FREE_DAILY_PROMPT_LIMIT} study prompts per day`,
    "- Clear basic answers",
    "",
    "*Premium Monthly*",
    `- Rs. ${plans.monthly.priceRs} per month`,
    "- Unlimited study prompts",
    "- Full teacher mode with quizzes, homework coach, notes, PYQ, NCERT, missions, and progress tracking",
    "- Send 'buy monthly' to start payment",
    "",
    "*Premium Yearly*",
    `- Rs. ${plans.yearly.priceRs} per year`,
    "- Full premium access for the year",
    "- Send 'buy yearly' to start payment",
    "",
    "Send 'my plan' to check your current access."
  ].join("\n")
}

function buildPlanStatusMessage(accessProfile = {}) {
  const subscription = accessProfile.subscription
  if (!accessProfile.premium || !subscription) {
    return [
      "*Your Plan*",
      "",
      "Plan: Free",
      `Daily prompts used: ${accessProfile.promptsUsedToday || 0}/${FREE_DAILY_PROMPT_LIMIT}`,
      `Prompts left today: ${accessProfile.promptsRemaining || 0}`,
      "",
      "Send 'pricing' to see premium plans."
    ].join("\n")
  }

  return [
    "*Your Plan*",
    "",
    `Plan: Premium ${subscription.plan_type === "yearly" ? "Yearly" : "Monthly"}`,
    `Status: ${subscription.status || "active"}`,
    `Valid till: ${subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("en-IN") : "N/A"}`,
    "",
    "You have unlimited premium access."
  ].join("\n")
}

function buildReferralSummaryMessage(summary = {}) {
  const referralLines = Array.isArray(summary.referrals) ? summary.referrals.slice(0, 5) : []
  const referralLink = summary.referralLink || buildReferralLink(summary.referralCode)
  const referralShareText = summary.referralShareText || buildReferralShareText(summary.referralCode)

  return [
    "*Referral Program*",
    "",
    `Your referral code: ${summary.referralCode || "Not available"}`,
    referralLink ? `Your referral link: ${referralLink}` : null,
    "Ask your friend to open the link, join AI Study Guru, and complete signup from that chat.",
    "",
    "*Commission Rules*",
    "- 10% on first monthly purchase",
    "- 15% on first yearly purchase",
    "- No recurring monthly commission on renewals",
    "",
    `Total referrals: ${summary.totalReferrals || 0}`,
    `Total earned: Rs. ${summary.totalEarnedRs || 0}`,
    "",
    referralShareText ? "*Ready-to-share line:*" : null,
    referralShareText || null,
    referralShareText ? "" : null,
    referralLines.length ? "*Recent Referrals:*" : "No referrals recorded yet.",
    ...referralLines.map((item) => `- ${item.referredPhone}: ${item.planType || "pending"} | Rs. ${item.commissionAmountRs || 0}`)
    ].filter(Boolean).join("\n")
}

function buildReferralWelcomeMessage(phone) {
  const referralLink = buildReferralLink(phone)
  if (!referralLink) {
    return null
  }

  return [
    "*Your Referral Link*",
    "",
    "Share this with your friends so they can join AI Study Guru from your link:",
    referralLink,
    "",
    "*Referral Earnings*",
    "- 10% on first monthly plan",
    "- 15% on first yearly plan",
    "- No recurring commission on renewals",
    "",
    "You can send `referral` any time to see your link and earnings."
  ].join("\n")
}

function buildReferralReminderMessage(phone, user = {}) {
  const referralLink = buildReferralLink(phone)
  if (!referralLink) {
    return null
  }

  const studentName = user.name ? user.name.split(" ")[0] : "Student"
  return [
    "*Refer & Earn*",
    "",
    `${studentName}, invite a friend to learn with AI Study Guru using your referral link:`,
    referralLink,
    "",
    "You earn:",
    "- 10% on first monthly plan",
    "- 15% on first yearly plan",
    "",
    "Tip: share this line with your friend:",
    `Join AI Study Guru on WhatsApp from my referral link: ${referralLink}`
  ].join("\n")
}

function buildPurchaseIntentMessage(intent, accessProfile = {}) {
  const planLabel = intent.planType === "yearly" ? "Yearly Premium" : "Monthly Premium"

  if (intent.provider === "manual") {
    return [
      "*Payment Setup In Progress*",
      "",
      `${planLabel}: Rs. ${intent.amountRs}`,
      "Online payment is not fully configured yet.",
      "Please contact admin to activate the plan manually after payment confirmation.",
      "",
      `Reference: ${intent.orderId}`
    ].join("\n")
  }

  return [
    "*Premium Checkout Ready*",
    "",
    `${planLabel}: Rs. ${intent.amountRs}`,
    `Current plan: ${accessProfile.premium ? "Premium" : "Free"}`,
    `Order id: ${intent.orderId}`,
    intent.provider === "upi" && intent.upiId ? `UPI ID: ${intent.upiId}` : null,
    intent.provider === "upi" && intent.payeeName ? `Payee: ${intent.payeeName}` : null,
    "",
    intent.provider === "upi"
      ? "Pay using any UPI app with the link below:"
      : "Open the payment link below to complete your subscription:",
    intent.paymentUrl || "Payment link unavailable right now.",
    "",
    ...(Array.isArray(intent.upiInstructions) ? intent.upiInstructions : []),
    "",
    "After payment, your plan can be activated once payment is confirmed.",
    "If the payment link does not open, you can still pay manually to the UPI ID shown above."
  ].filter(Boolean).join("\n")
}

function buildPaymentStatusMessage(summary = {}) {
  const latest = summary.latestOrder
  if (!latest) {
    return [
      "*Payment Status*",
      "",
      "No recent payment request found.",
      "Send 'buy monthly' or 'buy yearly' to start your upgrade."
    ].join("\n")
  }

  return [
    "*Payment Status*",
    "",
    `Latest order: ${latest.id}`,
    `Plan: ${latest.planType === "yearly" ? "Yearly Premium" : "Monthly Premium"}`,
    `Amount: Rs. ${latest.amountRs}`,
    `Provider: ${String(latest.provider || "manual").toUpperCase()}`,
    `Status: ${latest.status}`,
    latest.provider === "upi" && latest.upiId ? `UPI ID: ${latest.upiId}` : null,
    latest.provider === "upi" && latest.payeeName ? `Payee: ${latest.payeeName}` : null,
    `Created: ${latest.createdAt ? new Date(latest.createdAt).toLocaleString("en-IN") : "N/A"}`,
    latest.paymentUrl ? `Link: ${latest.paymentUrl}` : "Link: Not available",
    "",
    latest.provider === "upi" ? "If you already paid, send the payment screenshot and this order id to admin." : "If you already paid, admin can activate your plan after confirmation."
  ].filter(Boolean).join("\n")
}

function buildPremiumBenefitsReminderMessage(user = {}) {
  const studentName = user.name ? user.name.split(" ")[0] : "Student"
  return [
    "*Premium Benefits*",
    "",
    `${studentName}, upgrade to Premium to unlock full learning support in AI Study Guru.`,
    "",
    "*Premium gives you:*",
    "- Unlimited study prompts",
    "- Better detailed teacher-style answers",
    "- Homework coach, quizzes, review, and mock tests",
    "- Faster doubt-solving help across all subjects",
    "",
    "*Plans:*",
    "- Monthly: Rs. 149",
    "- Yearly: Rs. 1599",
    "",
    "To upgrade, send `buy monthly` or `buy yearly`."
  ].join("\n")
}

function buildPaymentSubmittedMessage(order) {
  if (!order) {
    return [
      "*Payment Update*",
      "",
      "I could not find a recent payment request for your account.",
      "Please send 'buy monthly' or 'buy yearly' first."
    ].join("\n")
  }

  return [
    "*Payment Update Saved*",
    "",
    `Order id: ${order.id}`,
    `Plan: ${order.planType === "yearly" ? "Yearly Premium" : "Monthly Premium"}`,
    `Amount: Rs. ${order.amountRs}`,
    `Status: ${order.status}`,
    "",
    "Please send your payment screenshot to admin for verification.",
    "Your plan can be activated after payment confirmation."
  ].join("\n")
}

function buildMyReportMessage(phone, user) {
  const state = getMasteryState(phone)
  const profile = getAccessProfile(phone)
  const overallAccuracy = state.totalQuizAttempts ? Math.round((state.totalCorrect / state.totalQuizAttempts) * 100) : 0
  const bookmarkCount = fm.getBookmarkCount(phone)
  const formatPref = fm.getFormatPreference(phone)
  const parentSet = !!fm.getParentPhone(phone)
  const topWeak = (state.weakTopics || []).slice(0, 3).map(t => `${t.topic} (${t.subject})`)
  const strongSubjects = Object.values(state.subjects || {}).filter(s => Number(s.quizAttempts || 0) >= 2).map(s => ({ label: s.label, acc: s.quizAttempts > 0 ? Math.round((s.totalCorrect / s.quizAttempts) * 100) : 0 })).sort((a, b) => b.acc - a.acc).slice(0, 3)
  const gamification = getGamificationState(phone)
  const lines = [
    "*Your Study Report*",
    "",
    "*Profile*",
    `Name: ${user.name || "Student"}`,
    `Class: ${user.level || user.class || "N/A"}`,
    `Board: ${user.board || "N/A"}`,
    `Plan: ${profile.premium ? "Premium" : "Free"}`,
    "",
    "*Activity*",
    `Total Questions: ${state.totalQuestions || 0}`,
    `Quiz Accuracy: ${overallAccuracy}%`,
    `Quiz Attempts: ${state.totalQuizAttempts || 0}`,
    `Reviewed Answers: ${state.totalReviewedAnswers || 0}`,
    "",
    "*Streak & Rewards*",
    `Current Streak: ${gamification.currentStreak || 0} days`,
    `Coins: ${gamification.totalCoins || 0}`,
    `Badges: ${Array.isArray(gamification.badges) ? gamification.badges.length : 0}`,
    "",
    strongSubjects.length ? `*Strong Subjects*\n${strongSubjects.map(s => `${s.label}: ${s.acc}%`).join("\n")}` : "*Strong Subjects*\nNeed more quiz data",
    "",
    topWeak.length ? `*Focus Topics*\n${topWeak.join("\n")}` : "*Focus Topics*\nKeep practicing to detect weak areas!",
    "",
    profile.premium ? "" : "Upgrade to Premium for unlimited questions and DeepSeek AI!"
  ]
  return lines.filter(Boolean).join("\n")
}

function buildWeakTopicsMessage(phone, user) {
  const state = getMasteryState(phone)
  const weak = (state.weakTopics || []).slice(0, 5)
  if (!weak.length) return "No weak topics detected yet. Keep practicing quizzes and I will identify areas for improvement!"
  const lines = ["*Weak Topics Report*", "", weak.map((w, i) => {
    const icon = w.mistakes > 3 ? "\u26D4" : w.mistakes > 1 ? "\u26A0" : "\u26A1"
    return `${icon} ${i + 1}. *${w.topic}* (${w.subject})\n   Mistakes: ${w.mistakes} | Last practiced: ${w.lastPracticed || "recently"}`
  }).join("\n\n"), "", "Type any weak topic to start practicing!"]
  return lines.join("\n")
}

function buildBookmarksMessage(phone) {
  const bookmarks = getUserBookmarks(phone)
  if (!bookmarks.length) return "You have no saved bookmarks yet.\n\nAfter receiving an answer you like, type *bookmark* to save it!"
  const lines = ["*Your Bookmarks*", `(${bookmarks.length} saved)`, ""]
  bookmarks.forEach((b, i) => { lines.push(`${i + 1}. *${b.subject || "General"}*: ${b.question.slice(0, 60)}${b.question.length > 60 ? "..." : ""}`) })
  lines.push("", "Type *bookmarks math* to filter by subject")
  return lines.join("\n")
}

function buildExamCountdownMessage(phone) {
  const exams = getExamCountdowns(phone)
  if (!exams.length) return "No exams set.\n\nType: *set exam JEE 2026-04-15*\nType: *set exam Board 2026-03-20 math*"
  const now = Date.now()
  const lines = ["*Your Exams*", ""]
  exams.forEach(e => {
    const days = Math.max(0, Math.ceil((new Date(e.exam_date).getTime() - now) / (1000 * 60 * 60 * 24)))
    const icon = days <= 7 ? "\u26A0" : days <= 30 ? "\uD83D\uDCC5" : "\uD83D\uDCC6"
    lines.push(`${icon} *${e.exam_name}*\n   ${days} days remaining ${e.subject ? "(" + e.subject + ")" : ""}`)
  })
  lines.push("", "Set a new exam: *set exam <name> <YYYY-MM-DD>*")
  return lines.join("\n")
}

function buildSubjectsMenu(runtimeOptions, user) {
  const text = ["*Choose a Subject to Study*", "", "Select a subject from the list below to start a focused study session."]
  const rows = [
    { id: "subject Mathematics", title: "Mathematics", description: "Algebra, Geometry, Calculus" },
    { id: "subject Physics", title: "Physics", description: "Mechanics, Optics, Thermodynamics" },
    { id: "subject Chemistry", title: "Chemistry", description: "Organic, Inorganic, Physical" },
    { id: "subject Biology", title: "Biology", description: "Botany, Zoology, Genetics" },
    { id: "subject English", title: "English", description: "Grammar, Writing, Literature" },
    { id: "subject Hindi", title: "Hindi", description: "Vyakaran, Sahitya, Nibandh" },
    { id: "subject Social Science", title: "Social Science", description: "History, Geography, Civics" },
    { id: "subject Computer Science", title: "Computer Science", description: "Programming, Data Structures" }
  ]
  if (runtimeOptions.preferInteractive && runtimeOptions.channel === "whatsapp") {
    return { type: "list", text: text.join("\n"), buttonText: "Subjects", rows, sectionTitle: "Select Subject" }
  }
  return text.concat(["", rows.map((r, i) => `${i + 1}. ${r.title}`).join("\n")]).join("\n")
}

function buildShareMessage(phone) {
  try {
    const { buildReferralLink, buildReferralShareText } = require("./utils/subscriptionManager")
    return buildReferralShareText(phone)
  } catch {
    return "Share this bot with friends! When they buy Premium, you earn referral commission.\n\nType *refer by <phone number>* to link a referral."
  }
}

function buildFormatMessage(user) {
  const current = getUserPreference(user.phone, "answerFormat", "standard")
  const lines = [
    "*Answer Format Preference*", "",
    `Current: *${current === "simple" ? "Simple" : current === "detailed" ? "Detailed" : current === "exam" ? "Exam-Focused" : "Standard"}*`,
    "",
    "*Choose format:*",
    "- *format simple* - Short, easy answers",
    "- *format detailed* - In-depth explanations",
    "- *format exam* - Exam-focused with key points",
    "- *format standard* - Default balanced style"
  ]
  return lines.join("\n")
}

function buildFeedbackPrompt() {
  return {
    type: "buttons",
    text: "Was this answer helpful? Rate it:",
    buttons: [
      { id: "feedback 3", title: "Helpful" },
      { id: "feedback 2", title: "Too Complex" },
      { id: "feedback 1", title: "Needs More" }
    ]
  }
}

function buildMilestoneMessage(milestoneKey, value) {
  const messages = {
    "questions_10": ["\uD83C\uDF89 *10 Questions!*", "Great start! You are building a strong learning habit.", "Keep going!"],
    "questions_25": ["\uD83C\uDFC6 *25 Questions!*", "You are in the top learners!", "Your dedication is paying off."],
    "questions_50": ["\u2B50 *50 Questions!*", "Half century! You are a serious student.", "Try a mock test to see how much you have grown."],
    "questions_100": ["\uD83C\uDF1F *100 Questions!*", "Century! You are in the top 10%!", "Outstanding consistency!"],
    "questions_200": ["\uD83D\uDC51 *200 Questions!*", "Double century! You are a learning champion!", "Consider upgrading to Premium for even better AI."],
    "questions_500": ["\uD83C\uDFC5 *500 Questions!*", "LEGENDARY! You have answered 500 questions!", "You are an inspiration to other students!"],
    "streak_7": ["\uD83D\uDD25 *7 Day Streak!*", "A full week of consistent studying!", "One week becomes one month before you know it!"],
    "streak_14": ["\u2728 *14 Day Streak!*", "Two weeks strong! Your brain is absorbing knowledge.", "Take a mock test to measure your progress."],
    "streak_30": ["\uD83C\uDF1F *30 Day Streak!*", "One month of dedication! You are unstoppable!", "Share your achievement with friends!"],
  }
  const msg = messages[milestoneKey]
  if (!msg) return null
  return msg.join("\n\n")
}

function buildLegacyFlashcardMessage(session) {
  if (!session) return null
  const cards = JSON.parse(session.cards_json || "[]")
  if (session.current_index >= cards.length) {
    return ["*Flashcard Review Complete!*", "", `You reviewed ${cards.length} cards.`, "", "Start a new topic: *flashcards <topic>*"].join("\n")
  }
  const card = cards[session.current_index]
  const num = session.current_index + 1
  const total = cards.length
  return [`*Flashcard ${num}/${total}: ${session.topic || session.subject || "Review"}*`, "", `*Q:* ${card.q}`, "", "Type your answer, or:", "*next* to see the answer", "*skip* to skip", "*stop flashcards* to end"].join("\n")
}

function buildFlashcardAnswerMessage(session) {
  if (!session) return null
  const cards = JSON.parse(session.cards_json || "[]")
  const card = cards[session.current_index]
  return [`*Answer:*`, card.a, "", `Card ${session.current_index + 1} of ${cards.length}`, "", "Type *next* or *stop flashcards*"].join("\n")
}

function buildTrialWelcomeMessage() {
  return [
    "\uD83C\uDF81 *3-Day Premium Trial Activated!*",
    "",
    "You now have unlimited questions + DeepSeek AI for Math & Science!",
    "",
    "Your trial expires in 3 days.",
    "Type *my plan* to check your plan status.",
    "Type *premium* to see all Premium benefits!"
  ].join("\n")
}

function buildAdminDashboardMessage() {
  const stats = getDashboardStats({})
  const lines = [
    "*ADMIN DASHBOARD*",
    "",
    "*Users Overview*",
    "Total Users: " + stats.totalUsers,
    "Profiles Completed: " + (stats.profilesCompleted || 0),
    "Onboarding Pending: " + (stats.onboardingPending || 0),
    "",
    "*Activity Today*",
    "Active Students: " + (stats.activeStudentsToday || 0),
    "Messages Today: " + (stats.interactionsToday || 0),
    "Teaching Answers: " + (stats.teachingAnswersToday || 0),
    "Quality Checks: " + (stats.qualityChecksToday || 0),
    "",
    "*Premium*",
    "Premium Users: " + (stats.premiumUsers || 0),
    "Free Users: " + (stats.freeUsers || 0),
    "Active Subscriptions: " + (stats.activeSubscriptions || 0),
    "Pending Payments: " + (stats.pendingPaymentOrders || 0),
    "",
    "*Engagement (7d)*",
    "Active (7 days): " + (stats.activeStudents7d || 0),
    "Repeat Learners: " + (stats.repeatLearners7d || 0),
    "Retention Rate: " + (stats.weeklyRetentionRate || 0) + "%",
    "Agent Escalations: " + (stats.agentEscalationsTotal || 0),
    "",
    "*Gamification*",
    "Streak Users: " + (stats.activeStreakUsers || 0),
    "Highest Streak: " + (stats.highestStreak || 0) + " days",
    "Coins Issued: " + (stats.totalCoinsIssued || 0),
    "Badges Awarded: " + (stats.totalBadgesAwarded || 0),
    "",
    "*Content*",
    "Total Questions: " + (stats.totalQuestions || 0),
    "Parent Reports: " + (stats.totalParentReports || 0),
    "Agent Insights: " + (stats.agentInsights || 0),
    "",
    "Use: admin pending payments",
    "Use: admin activate monthly/yearly <phone>",
    "Use: admin confirm payment <phone>"
  ]
  return lines.join("\n")
}

function buildAdminPendingPaymentsMessage(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [
      "*Submitted Payments*",
      "",
      "No submitted payments are waiting for review right now."
    ].join("\n")
  }

  return [
    "*Submitted Payments Awaiting Review*",
    "",
    ...items.map((item, index) => {
      const label = item.planType === "yearly" ? "Yearly" : "Monthly"
      return [
          `${index + 1}. ${item.phone}`,
          `Order: ${item.id}`,
          `Plan: ${label} | Rs. ${item.amountRs}`,
          `Submitted: ${item.updatedAt ? new Date(item.updatedAt).toLocaleString("en-IN") : "N/A"}`,
          `Confirm: admin confirm payment ${item.phone}`,
          `Reject: admin reject payment ${item.phone}`
        ].join("\n")
      })
    ].join("\n\n")
}

function buildPremiumFeatureLockedMessage(featureName = "This feature") {
  return [
    `*Premium Feature*`,
    "",
    `${featureName} is available for Premium members.`,
    "",
    "*What Premium gives you:*",
    "- Unlimited study questions (no daily limit)",
    "- Adaptive quizzes and mock tests",
    "- Homework coach with step-by-step hints",
    "- Formula cards and study notes",
    "- Daily missions and streak rewards",
    "- Progress tracking and weekly reports",
    "- Smarter AI model for deeper answers",
    "",
    "*Plans:*",
    "- Monthly: Rs. 149/month",
    "- Yearly: Rs. 1599/year (save Rs. 189)",
    "",
    "Send 'pricing' to see full details, or 'buy monthly' to upgrade."
  ].join("\n")
}

function buildFreeLimitMessage(accessProfile = {}) {
  return [
    "*Daily Limit Reached*",
    "",
    `You have used your ${FREE_DAILY_PROMPT_LIMIT} free study prompts for today.`,
    `Free users get ${FREE_DAILY_PROMPT_LIMIT} basic prompts per day.`,
    "Premium users get unlimited prompts and all advanced learning features.",
    "",
    "Plans:",
    "- Monthly: Rs. 149",
    "- Yearly: Rs. 1599",
    "",
    `Prompts used today: ${accessProfile.promptsUsedToday || FREE_DAILY_PROMPT_LIMIT}/${FREE_DAILY_PROMPT_LIMIT}`,
    "Send 'buy monthly', 'buy yearly', or 'pricing' to upgrade."
  ].join("\n")
}

function getPremiumFeatureName({ cleanQuestion, rawQuestion, directHomeworkProblem, directMockTestTopic, directQuizTopic, incomingMessageType }) {
  if (incomingMessageType === "image") return "Image doubt solving"
  if (isStreakCommand(cleanQuestion)) return "Streak tracking"
  if (isRewardsCommand(cleanQuestion)) return "Rewards"
  if (isBadgesCommand(cleanQuestion)) return "Badges"
  if (isLeaderboardCommand(cleanQuestion)) return "Leaderboard"
  if (isEasierExampleCommand(cleanQuestion)) return "Easy example follow-up"
  if (isQuickTestCommand(cleanQuestion)) return "Quick test"
  if (isFormulaCommand(rawQuestion)) return "Formula cards"
  if (isNcertCommand(rawQuestion)) return "NCERT help"
  if (isPyqCommand(rawQuestion)) return "PYQ practice"
  if (isResearchNotesCommand(rawQuestion)) return "Study notes"
  if (isChallengeCommand(cleanQuestion)) return "Daily challenge"
  if (isRevisionCommand(cleanQuestion)) return "Revision reminders"
  if (isMissionCommand(cleanQuestion)) return "Daily mission"
  if (isParentReportCommand(cleanQuestion)) return "Parent reports"
  if (isStudyPlanCommand(cleanQuestion) || isNewStudyPlanCommand(cleanQuestion)) return "Study plan"
  if (isNewMissionCommand(cleanQuestion) || isCompleteMissionCommand(cleanQuestion)) return "Mission tracking"
  if (isProgressCommand(cleanQuestion)) return "Progress reports"
  if (isCheckAnswerCommand(cleanQuestion)) return "Answer review"
  if (directHomeworkProblem) return "Homework coach"
  if (directMockTestTopic || /^mock\s*test/i.test(String(rawQuestion || "").trim())) return "Mock tests"
  if (isEvaluateCommand(cleanQuestion)) return "Answer Evaluation"
  if (isTestMeCommand(cleanQuestion)) return "Reverse Quiz"
  if (isConceptMapCommand(cleanQuestion)) return "Concept Map"
  if (isCompareCommand(cleanQuestion)) return "Concept Comparison"
  if (isStudyGoalCommand(cleanQuestion) || isStudyProgressCommand(cleanQuestion)) return "Study Goal Tracker"
  if (isQuickRevisionCommand(cleanQuestion)) return "Quick Revision"
  if (isSRSCommand(cleanQuestion)) return "Spaced Repetition"

  if (directQuizTopic) return "Adaptive quiz"
  return ""
}

function detectAnswerMode(question, commandSuffix = "") {
  const normalized = String(question || "").trim().toLowerCase()
  const wordCount = normalized ? normalized.split(/\s+/).length : 0
  const detailSignals = [
    "more detail",
    "detailed",
    "detail",
    "full explanation",
    "in detail",
    "step by step",
    "deeply",
    "elaborate"
  ]
  const standardSignals = [
    "explain",
    "what is",
    "define",
    "why",
    "how",
    "law",
    "theorem",
    "principle",
    "difference",
    "compare",
    "solve",
    "find",
    "show all steps",
    "formula",
    "prove"
  ]

  if (commandSuffix === "/exam" || commandSuffix === "/detail") {
    return "detailed"
  }

  if (detailSignals.some((signal) => normalized.includes(signal))) {
    return "detailed"
  }

  if (commandSuffix === "/simple") {
    return "concise"
  }

  if (standardSignals.some((signal) => normalized.includes(signal))) {
    return "standard"
  }

  if (normalized.includes("?") && wordCount >= 2) {
    return "standard"
  }

  if (wordCount <= 3 && normalized.length <= 20) {
    return "concise"
  }

  return "standard"
}

function buildHelpMessage(user) {
  return [
    `*AI Study Guru - Command Guide*`,
    "",
    `Hello ${user.name || "Student"}, here is everything you can do:`,
    "",
    "*Ask Anything*",
    "Just type any study question and I will explain it like a teacher.",
    "",
    "*Practice Tools*",
    "- quiz <topic> - Adaptive practice quiz",
    "- mock test <topic> - 5-question exam test",
    "- homework <question> - Step-by-step coaching",
    "- easier example - Simpler version of last topic",
    "- quick test - One follow-up question",
    "",
    "*Study Tools*",
    "- formulas <topic> - Formula reference cards",
    "- notes <topic> - Short study notes",
    "- revision - What to revise next",
    "- mission - Today's study mission",
    "- study plan - Your weekly study plan",
    "- subjects - See all supported subjects",
    "",
    "*Progress Tracking*",
    "- progress - Your learning progress",
    "- streak - Your study streak",
    "- rewards - Your rewards and badges",
    "- leaderboard - Weekly top students",
    "",
    "*Smart Teacher Features* 🧠",
    "*New Features*",
    "- speed math - Fun math challenge game",
    "- gk quiz - General knowledge quiz",
    "- daily report - Today study summary",
    "- weekly report - Your weekly stats",
    "- my exams - Exam countdown",
    "- exam add <name> <DD-MM-YYYY>",
    "- exam tip - Study tips",
    "- mindmap <topic> - Concept map",
    "- quote - Daily motivational quote",
    "- fact - Amazing facts",
    "- pyq <subject> - Previous year questions",
    "- syllabus - Track syllabus progress",
    "- ask doubt <topic> - Doubt clearing session",
    "- practice <subject> - Practice questions",
    "- concept quiz <topic> - Deep topic quiz",
    "- analytics - Study analytics & stats",
    "- career <interests> - Career guidance",
    "- exam strategy <subject> - Board exam tips & strategy",
    "- notes ai <topic> - AI study notes generator",
    "- mnemonic <topic> - Memory aids & tricks",
    "- compare A vs B - Side-by-side comparison",
    "- remind <time> to study <topic> - Study reminders",
    "- my badges - View achievement badges",
    "- challenge leaderboard - Daily challenge rankings",
    "- formulas <subject> - Quick formula reference sheet",
    "- set goal X hours - Set daily study time goal",
    "- study progress - Track study goal progress",
    "- revise <subject> - Interactive revision cards",
    "- create class <name> - Create study group",
    "- join class <code> - Join a study group",
    "- study tip - Get a study tip",
    "- exam add <name> <date> - Track exam countdown",
    "",
    "*\ud83c\udccf Flashcards & Cards*",
    "- add card <front> | <back> - Create flashcard",
    "- review flashcards - Review due cards (spaced repetition)",
    "- flashcard stats - Your flashcard progress",
    "- study cards - Another way to review",
    "",
    "*\u23f0 Timetable & Planning*",
    "- generate timetable <subjects>, <hours> - AI study schedule",
    "- my timetable - View saved schedule",
    "",
    "*\ud83d\udcdd Mock Tests*",
    "- mock test <subject> - Full mock test with scoring",
    "- test history - Your past test results",
    "",
    "*\ud83d\udc4b Quick Summary*",
    "- summary <topic> - Concise topic summary",
    "- summarize <topic> - Another way to get summary",
    "",
    "*\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67 Parent Features*",
    "- link parent <phone> - Link parent for reports",
    "- parent report - Generate & send parent report",
    "- my parent - View linked parent info",
    "- note save <title> <content> - Save study notes",
    "- my notes - View saved notes",
    "- mood <great/good/okay/bad/stressed> - Track mood",
    "- performance - Monthly performance report",
    "- whiteboard <topic> - Step-by-step learning",
    "- word of the day - Learn new words",
    "- vocab quiz - English vocabulary test",
    "- timer pomodoro - 25/5 study timer",
    "- timer short - 15/3 quick timer",
    "- timer long - 45/10 deep study",
    "- timer status - Check timer",
    "- timer stop - Stop timer",
    "- link parent <number> - Connect parent for weekly reports",
    "- parent status - Check parent connection",
    "- find buddy - Find study partners",
    "- revision <subject> - Quick flashcards",
    "- flip / next - Navigate flashcards",
    "",
    "- eli5 <topic> - Explain Like I'm 5 (super simple)",
    "- board exam <topic> - Board exam style answer",
    "- analogy <topic> - Real-world analogy explanation",
    "- explain modes - See all explanation levels",
    "- debate <topic> - AI debate to test understanding",
    "- teach me <concept> - Structured learning flow",
    "",
    "*Problem Solving*",
    "- solve step by step <problem> - Guided problem solving",
    "- revision <subject> - Quick exam revision summary",
    "- daily concept - Concept/formula of the day",
    "- weak topics - Analyze your strengths & weaknesses",
    "",
    "*Notes & Revision*",
    "- save note - Save last answer as revision note",
    "- my notes - View all saved notes",
    "",
    "*Profile Settings*",
    "- profile / edit profile - View or update profile",
    "- change language / class / board / subjects",
    "- my plan - Check your subscription",
    "- pricing - View plans and upgrade",
    "",
    `Level: ${user.level || user.class || "Not set"} | Board: ${user.board || "Not set"} | Language: ${user.language || "English"}`
  ].join("\n")
}

function buildStudyModeResponse(runtimeOptions = {}, user = {}) {
  const text = [
    "*Study Mode*",
    "",
    `Current teaching pace: ${user.teachingPacePreference || "auto"}`,
    "Choose how you want me to teach:",
    "- Teach Easier: slower, simpler, and more guided",
    "- Same Level: balanced explanation",
    "- Teach Harder: a little more advanced and challenging"
  ].join("\n")

  if (!runtimeOptions.preferInteractive || runtimeOptions.channel !== "whatsapp") {
    return text
  }

  return {
    type: "buttons",
    text,
    buttons: [
      { id: "teach easier", title: "Teach Easier" },
      { id: "same level", title: "Same Level" },
      { id: "study mode", title: "Start Studying" }
    ]
  }
}

function buildSubjectsCatalogResponse(user = {}, runtimeOptions = {}) {
  const text = buildSubjectsMessage(user)

  if (!runtimeOptions.preferInteractive || runtimeOptions.channel !== "whatsapp") {
    return text
  }

  const supported = getSupportedSubjectsForUser(user).slice(0, 10)
  return {
    type: "list",
    text,
    buttonText: "Choose Subject",
    sectionTitle: "Quick Focus Subject",
    rows: supported.map((subject) => ({
      id: `pick_subject::${subject}`,
      title: subject,
      description: "Set as your quick focus subject"
    }))
  }
}

function extractResearchTopic(text) {
  return String(text || "")
    .replace(/^(?:\/)?(?:notes|summary|research|chapter notes)\b[:\s-]*/i, "")
    .trim()
}

function needsExactNcertTopic(query) {
  const stripped = String(query || "")
    .toLowerCase()
    .replace(/^\/?ncert\b/i, "")
    .replace(/class\s*\d{1,2}/gi, "")
    .replace(/\b(history|geography|civics|political science|economics|social science|science|math|mathematics|english|hindi)\b/gi, "")
    .replace(/\bchapter\b|\bch\b/gi, "")
    .replace(/\d+/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim()

  return !stripped
}

function buildResearchNotePrompt({ user, subject, topic, noteMode = "notes" }) {
  const resolvedTopic = topic || subject || "General topic"

  return `
You are the research and note-building specialist for a premium educational bot.

Student profile:
- Level: ${user.level || user.class || "Unknown"}
- Board/Exam: ${user.board || "Unknown"}
- Subject: ${subject || "General"}
- Preferred language: ${user.language || "English"}

Task:
Create premium study notes for this topic: ${resolvedTopic}

Rules:
1. Write for an Indian student at the given level.
2. Use very clear, simple, polished teacher language.
3. Keep the notes revision-friendly and WhatsApp-friendly.
4. Use this structure when suitable:
   - one short title
   - *Core Idea:*
   - *Key Points:*
   - *Important Terms:* when useful
   - *Example:* or *Memory Tip:* when useful
   - *Quick Recap:*
5. Do not use tables, code blocks, markdown headings, or long essays.
6. Keep it concise but useful.
7. If the request sounds like chapter notes, include the most exam-relevant subpoints only.
8. ${noteMode === "library_fallback"
    ? "This note is filling a missing library card, so make it dependable and structured."
    : "This is a direct student request for notes or summary."}

Return the final student-facing answer only.
`
}

async function generateResearchNotes(phone, user, topic, subject, options = {}) {
  const prompt = buildResearchNotePrompt({
    user,
    subject,
    topic,
    noteMode: options.noteMode || "notes"
  })

  const reply = await askOpenClaw(prompt, {
    answerMode: options.answerMode || "standard",
    taskType: "research",
    phone,
    subject,
    promptSource: topic,
    user
  })

  return reply || "I could not prepare the notes right now. Please try again."
}

async function sendOnboardingReminders() {
  const candidates = getReminderCandidates()

  for (const candidate of candidates) {
    const reminder = [
      "Reminder: please complete your student profile so I can teach you at the correct level.",
      "",
      candidate.prompt
    ].join("\n")

    const sent = await sendWhatsAppMessage(candidate.phone, reminder)
    if (sent) {
      await markReminderSent(candidate.phone)
    }
  }
}

async function sendSpacedRevisionReminders() {
  const dueReviews = getDueReviewReminders()

  for (const review of dueReviews) {
    const sent = await sendWhatsAppMessage(review.phone, buildReviewReminderMessage(review))
    if (sent) {
      await markReviewReminderSent(review.phone, review.topicKey)
    }
  }
}

async function sendDailyReferralPrompts() {
  const users = loadUsers()
  const dateKey = getDateKey()

  for (const [phone, user] of Object.entries(users)) {
    if (!isProfileComplete(user)) {
      continue
    }

    if (!isReferralReminderDue(phone, dateKey)) {
      continue
    }

    const reminder = buildReferralReminderMessage(phone, user)
    if (!reminder) {
      continue
    }

    const sent = await sendWhatsAppMessage(phone, reminder)
    if (sent) {
      markReferralReminderSent(phone, dateKey)
    }
  }
}

async function sendDailyPremiumPrompts() {
  const users = loadUsers()
  const dateKey = getDateKey()

  for (const [phone, user] of Object.entries(users)) {
    if (!isProfileComplete(user)) {
      continue
    }

    if (getAccessProfile(phone).premium) {
      continue
    }

    if (!isPremiumReminderDue(phone, dateKey)) {
      continue
    }

    const reminder = buildPremiumBenefitsReminderMessage(user)
    const sent = await sendWhatsAppMessage(phone, reminder)
    if (sent) {
      markPremiumReminderSent(phone, dateKey)
    }
  }
}

async function sendMissionReminders() {
  const missions = getAllMissions()
  const reminders = getPendingMissionReminders(missions)

  for (const item of reminders) {
    const reminder = [
      "*Mission Reminder*",
      "",
      `Your daily mission on ${item.mission.topic} is still pending.`,
      "Open it with: mission",
      "Finish it and then send: complete mission"
    ].join("\n")

    const sent = await sendWhatsAppMessage(item.phone, reminder)
    if (sent) {
      await markMissionReminderSent(item.phone)
    }
  }
}

async function sendDailyMorningPush() {
  try {
    const users = loadUsers()
    let sent = 0
    for (const [phone, user] of Object.entries(users)) {
      if (!isProfileComplete(user) || !phone || phone === "unknown") continue
      try {
        const gamification = getGamificationState(phone)
        const streak = gamification.currentStreak || 0
        const exams = getExamCountdowns(phone)
        const examLine = exams.length > 0 ? "\n\n*Upcoming Exam:* " + exams[0].exam_name + " in " + Math.max(0, Math.ceil((new Date(exams[0].exam_date) - Date.now()) / 86400000)) + " days" : ""
        const tip = getRandomStudyTip()
        const msg = ["\u2600\uFE0F Good Morning, " + (user.name || "Student") + "!", "", "\uD83D\uDD25 Streak: " + streak + " day" + (streak !== 1 ? "s" : ""), "\u2B50 Coins: " + (gamification.totalCoins || 0), examLine, "", "\uD83D\uDCA1 *Today\'s Tip:* " + tip, "", "Type any question to start learning!"].join("\n")
        await sendWhatsAppMessage(phone, msg)
        sent++
      } catch (e) { console.error("[Morning Push] Error for", phone, e.message) }
    }
    if (sent > 0) console.log("[Morning Push] Sent to " + sent + " users")
  } catch (err) { console.error("[Morning Push Error]", err.message) }
}

async function sendWeeklyParentReports() {
  const users = loadUsers()
  const pending = getPendingWeeklyParentReports(users)

  for (const item of pending) {
    if (!isProfileComplete(item.user)) {
      continue
    }

    const parentPhone = fm.getParentPhone(item.phone)
    const report = fm.buildDecorativeParentReport(item.phone, item.user)
    const recipientPhone = parentPhone || item.phone
    const sent = await sendWhatsAppMessage(recipientPhone, report)
    if (sent) {
      await saveParentReport(item.phone, report, {
        sentAutomatically: true,
        studentName: item.user.name || "Student"
      })
    }
  }
}

async function sendDailyChallenges() {
  return { disabled: true }
}

async function generateAdaptiveQuizQuestion({ phone, user, topic, subject, difficulty, previousSkills = [] }) {
  const prompt = buildQuizGenerationPrompt({ user, topic, subject, difficulty, previousSkills })
  const rawQuestion = await askOpenClawJson(prompt, {
    answerMode: "concise",
    taskType: "quiz_generation",
    phone,
    subject,
    questionText: topic,
    user
  })
  const options = Array.isArray(rawQuestion.options) ? rawQuestion.options.slice(0, 4) : []

  if (!rawQuestion.question || options.length !== 4 || !rawQuestion.correctOption) {
    throw new Error("Quiz question generation returned incomplete data.")
  }

  return {
    question: String(rawQuestion.question).trim(),
    options,
    correctOption: String(rawQuestion.correctOption).trim().toUpperCase(),
    explanation: String(rawQuestion.explanation || "").trim(),
    difficulty: String(rawQuestion.difficulty || difficulty || "medium").trim().toLowerCase(),
    skillTag: String(rawQuestion.skillTag || topic).trim()
  }
}

async function generateMockTestQuestions({ phone, user, topic, subject }) {
  const prompt = buildMockTestPrompt({ user, topic, subject })
  const rawTest = await askOpenClawJson(prompt, {
    answerMode: "concise",
    taskType: "mock_test_generation",
    phone,
    subject,
    questionText: topic,
    user
  })
  const rawQuestions = Array.isArray(rawTest.questions) ? rawTest.questions.slice(0, 5) : []

  if (rawQuestions.length !== 5) {
    throw new Error("Mock test generation returned incomplete data.")
  }

  const questions = rawQuestions.map((question, index) => {
    const options = Array.isArray(question.options) ? question.options.slice(0, 4) : []
    if (!question.question || options.length !== 4 || !question.correctOption) {
      throw new Error(`Mock test question ${index + 1} is incomplete.`)
    }

    return {
      question: String(question.question).trim(),
      options,
      correctOption: String(question.correctOption).trim().toUpperCase(),
      explanation: String(question.explanation || "").trim(),
      skillTag: String(question.skillTag || topic).trim()
    }
  })

  return {
    recommendedMinutes: Math.max(10, Math.min(30, Number(rawTest.recommendedMinutes || 15))),
    questions
  }
}

async function getOrCreateDailyChallenge(phone, user) {
  const todayKey = getDateKey()
  const existingChallenge = getChallengeState(phone)

  if (existingChallenge?.dateKey === todayKey) {
    return existingChallenge
  }

  const mission = await getOrCreateDailyMission(phone, user)
  const challengeQuestion = await generateAdaptiveQuizQuestion({
    phone,
    user,
    topic: mission.topic,
    subject: mission.subject,
    difficulty: getSuggestedDifficulty(phone, mission.subject)
  })

  const challenge = {
    dateKey: todayKey,
    subject: mission.subject,
    topic: mission.topic,
    question: challengeQuestion.question,
    options: challengeQuestion.options,
    correctOption: challengeQuestion.correctOption,
    explanation: challengeQuestion.explanation,
    difficulty: challengeQuestion.difficulty,
    completed: false,
    answeredCorrectly: false,
    createdAt: new Date().toISOString(),
    lastSentDate: null
  }

  await saveDailyChallenge(phone, challenge)
  return challenge
}

async function handleDailyChallengeReply(phone, challenge, answerText) {
  if (!challenge || !Array.isArray(challenge.options) || challenge.options.length < 2) {
    await clearDailyChallenge(phone)
    if (looksLikeFreshQuestion(answerText) && !looksLikeChoiceReply(answerText)) {
      return generateReply(phone, answerText, { preferInteractive: true, channel: "whatsapp" })
    }
    return "Your daily challenge expired. Send challenge to get a new one."
  }

  const matchedAnswer = matchQuizAnswer({ currentQuestion: challenge }, answerText)
  if (!matchedAnswer.valid) {
    return null
  }

  const selectedKey = matchedAnswer.selectedKey
  const normalizedOptions = Array.isArray(challenge.options) ? challenge.options.map(normalizeQuizOption) : []
  const correctOption = normalizedOptions.find((option) => option.key === challenge.correctOption)
  const wasCorrect = selectedKey === String(challenge.correctOption || "").toUpperCase()

  await saveDailyChallenge(phone, {
    ...challenge,
    completed: true,
    answeredCorrectly: wasCorrect,
    answeredAt: new Date().toISOString()
  })

  await recordTopicPractice(phone, {
    subject: challenge.subject,
    topic: challenge.topic,
    success: wasCorrect
  })

  if (!wasCorrect) {
    await scheduleWeakTopicReview(phone, {
      subject: challenge.subject,
      topic: challenge.topic
    })
  }

  const rewardSummary = await awardActivity(phone, wasCorrect ? "challenge_correct" : "challenge_attempt")
  return appendRewardSummary(buildDailyChallengeResultMessage(challenge, wasCorrect, correctOption), rewardSummary)
}

async function startAdaptiveQuiz(phone, user, topic, runtimeOptions = {}) {
  const normalizedTopic = String(topic || "").trim()
  if (!normalizedTopic) {
    return "Send quiz <topic> to start practice.\n\nExample: quiz fractions"
  }

  const subject = refineSubject(detectSubject(normalizedTopic), normalizedTopic)
  const difficulty = getSuggestedDifficulty(phone, subject)
  const firstQuestion = await generateAdaptiveQuizQuestion({
    phone,
    user,
    topic: normalizedTopic,
    subject,
    difficulty
  })

  const session = {
    topic: normalizedTopic,
    subject,
    maxQuestions: 3,
    questionNumber: 1,
    correctAnswers: 0,
    currentDifficulty: difficulty,
    askedSkillTags: [firstQuestion.skillTag],
    weakSkills: [],
    currentQuestion: firstQuestion,
    createdAt: new Date().toISOString()
  }

  await saveQuizSession(phone, session)
  const questionOptions = Array.isArray(session.currentQuestion?.options) ? session.currentQuestion.options : []
  if (questionOptions.length < 2) {
    await clearQuizSession(phone)
    return "I could not prepare that quiz properly. Send quiz <topic> to try again."
  }
  return buildInteractiveQuestionResponse(buildQuizQuestionMessage(session), questionOptions, runtimeOptions)
}

async function startMockTest(phone, user, topic, runtimeOptions = {}) {
  const normalizedTopic = String(topic || "").trim() || suggestMockTestTopic(phone, user)
  const subject = toDisplaySubject(refineSubject(detectSubject(normalizedTopic), normalizedTopic))
  const mockTest = await generateMockTestQuestions({
    phone,
    user,
    topic: normalizedTopic,
    subject
  })

  const session = {
    topic: normalizedTopic,
    subject,
    questions: mockTest.questions,
    totalQuestions: mockTest.questions.length,
    currentIndex: 0,
    correctAnswers: 0,
    weakAreas: [],
    strongAreas: [],
    recommendedMinutes: mockTest.recommendedMinutes,
    startedAt: new Date().toISOString()
  }

  await saveMockTestSession(phone, session)
  const firstQuestionOptions = Array.isArray(session.questions?.[0]?.options) ? session.questions[0].options : []
  if (firstQuestionOptions.length < 2) {
    await clearMockTestSession(phone)
    return "I could not prepare that mock test properly. Send mock test <topic> to try again."
  }
  return buildInteractiveQuestionResponse(buildMockTestQuestionMessage(session), firstQuestionOptions, runtimeOptions)
}

async function handleQuizReply(phone, user, answerText, session, runtimeOptions = {}) {
  const currentQuestion = session?.currentQuestion
  if (!currentQuestion || !Array.isArray(currentQuestion.options) || currentQuestion.options.length < 2) {
    await clearQuizSession(phone)
    if (looksLikeFreshQuestion(answerText)) {
      return generateReply(phone, answerText, runtimeOptions)
    }
    return "Your quiz session expired. Send quiz <topic> to start a new quiz."
  }

  const matchedAnswer = matchQuizAnswer(session, answerText)
  if (!matchedAnswer.valid) {
    if (looksLikeFreshQuestion(answerText)) {
      await clearQuizSession(phone)
      return generateReply(phone, answerText, runtimeOptions)
    }
    return "Please reply with A, B, C, or D so I can check your quiz answer."
  }

  const selectedKey = matchedAnswer.selectedKey
  const correctKey = String(currentQuestion.correctOption || "").toUpperCase()
  const wasCorrect = selectedKey === correctKey
  const normalizedOptions = Array.isArray(currentQuestion.options)
    ? currentQuestion.options.map(normalizeQuizOption)
    : []
  const correctOption = normalizedOptions.find((option) => option.key === correctKey)
  const selectedOption = normalizedOptions.find((option) => option.key === selectedKey)

  await recordQuizAttempt(phone, {
    subject: session.subject,
    topic: session.topic,
    skillTag: currentQuestion.skillTag,
    correct: wasCorrect,
    question: currentQuestion.question,
    correctAnswer: correctOption?.display || correctKey,
    studentAnswer: selectedOption?.display || selectedKey,
    explanation: currentQuestion.explanation
  })

  await recordTopicPractice(phone, {
    subject: session.subject,
    topic: currentQuestion.skillTag || session.topic,
    success: wasCorrect
  })

  if (!wasCorrect) {
    await scheduleWeakTopicReview(phone, {
      subject: session.subject,
      topic: currentQuestion.skillTag || session.topic
    })
  }

      // Track topic performance for weak topic analysis
    try { stf.recordTopicPerformance(phone, session.subject || "General", session.topic || "Unknown", wasCorrect) } catch (e) {}
    const rewardSummary = await awardActivity(phone, wasCorrect ? "quiz_correct" : "quiz_incorrect")

  const nextQuestionNumber = session.questionNumber + 1
  const weakSkills = wasCorrect
    ? session.weakSkills || []
    : [...new Set([...(session.weakSkills || []), currentQuestion.skillTag || session.topic])]

  if (nextQuestionNumber > session.maxQuestions) {
    await clearQuizSession(phone)
    const finalSession = {
      ...session,
      weakSkills,
      correctAnswers: session.correctAnswers + (wasCorrect ? 1 : 0)
    }

    return [
      wasCorrect ? "*Correct answer.*" : "*Not quite this time.*",
      `Correct option: ${correctOption?.display || correctKey}`,
      currentQuestion.explanation ? `Explanation: ${currentQuestion.explanation}` : "",
      "",
      buildQuizSummaryMessage(finalSession),
      `Reward update: ${buildRewardFooter(rewardSummary)}`
    ]
      .filter(Boolean)
      .join("\n\n")
  }

  const nextDifficulty = pickNextDifficulty(session.currentDifficulty, wasCorrect)
  const nextQuestion = await generateAdaptiveQuizQuestion({
    phone,
    user,
    topic: session.topic,
    subject: session.subject,
    difficulty: nextDifficulty,
    previousSkills: [...(session.askedSkillTags || []), currentQuestion.skillTag].filter(Boolean)
  })

  const nextSession = {
    ...session,
    questionNumber: nextQuestionNumber,
    correctAnswers: session.correctAnswers + (wasCorrect ? 1 : 0),
    currentDifficulty: nextDifficulty,
    askedSkillTags: [...(session.askedSkillTags || []), nextQuestion.skillTag].filter(Boolean),
    weakSkills,
    currentQuestion: nextQuestion
  }

  await saveQuizSession(phone, nextSession)

  const nextQuestionText = [
    wasCorrect ? "*Correct answer.*" : "*Not quite this time.*",
    `Correct option: ${correctOption?.display || correctKey}`,
    currentQuestion.explanation ? `Explanation: ${currentQuestion.explanation}` : "",
    buildRewardFooter(rewardSummary) ? `Reward update: ${buildRewardFooter(rewardSummary)}` : "",
    "",
    buildQuizQuestionMessage(nextSession)
  ]
    .filter(Boolean)
    .join("\n\n")

  if (!runtimeOptions.preferInteractive) {
    return nextQuestionText
  }

  const nextQuestionOptions = Array.isArray(nextSession.currentQuestion?.options) ? nextSession.currentQuestion.options : []
  if (nextQuestionOptions.length < 2) {
    await clearQuizSession(phone)
    return nextQuestionText
  }
  return buildInteractiveQuestionResponse(nextQuestionText, nextQuestionOptions, runtimeOptions)
}

async function handleMockTestReply(phone, user, answerText, session, runtimeOptions = {}) {
  const currentQuestion = session.questions?.[session.currentIndex]
  if (!currentQuestion || !Array.isArray(currentQuestion.options) || currentQuestion.options.length < 2) {
    await clearMockTestSession(phone)
    if (looksLikeFreshQuestion(answerText)) {
      return generateReply(phone, answerText, runtimeOptions)
    }
    return "Your mock test session expired. Send mock test <topic> to start again."
  }

  const matchedAnswer = matchQuizAnswer({ currentQuestion }, answerText)
  if (!matchedAnswer.valid) {
    if (looksLikeFreshQuestion(answerText)) {
      await clearMockTestSession(phone)
      return generateReply(phone, answerText, runtimeOptions)
    }
    return "Please reply with A, B, C, or D so I can check your mock test answer."
  }

  const selectedKey = matchedAnswer.selectedKey
  const correctKey = String(currentQuestion.correctOption || "").toUpperCase()
  const wasCorrect = selectedKey === correctKey
  const normalizedOptions = currentQuestion.options.map(normalizeQuizOption)
  const correctOption = normalizedOptions.find((option) => option.key === correctKey)
  const selectedOption = normalizedOptions.find((option) => option.key === selectedKey)
  const skillTag = currentQuestion.skillTag || session.topic

  await recordQuizAttempt(phone, {
    subject: session.subject,
    topic: session.topic,
    skillTag,
    correct: wasCorrect,
    question: currentQuestion.question,
    correctAnswer: correctOption?.display || correctKey,
    studentAnswer: selectedOption?.display || selectedKey,
    explanation: currentQuestion.explanation
  })

  await recordTopicPractice(phone, {
    subject: session.subject,
    topic: skillTag,
    success: wasCorrect
  })

  if (!wasCorrect) {
    await scheduleWeakTopicReview(phone, {
      subject: session.subject,
      topic: skillTag
    })
  }

      try { stf.recordTopicPerformance(phone, session.subject || "General", session.topic || "Unknown", wasCorrect) } catch (e) {}
    const stepRewardSummary = await awardActivity(phone, wasCorrect ? "quiz_correct" : "quiz_incorrect")

  const nextIndex = session.currentIndex + 1
  const strongAreas = wasCorrect
    ? [...new Set([...(session.strongAreas || []), skillTag])]
    : session.strongAreas || []
  const weakAreas = wasCorrect
    ? session.weakAreas || []
    : [...new Set([...(session.weakAreas || []), skillTag])]

  if (nextIndex >= session.totalQuestions) {
    await clearMockTestSession(phone)

    const finalResult = {
      dateKey: getDateKey(),
      topic: session.topic,
      subject: session.subject,
      totalQuestions: session.totalQuestions,
      score: session.correctAnswers + (wasCorrect ? 1 : 0),
      weakAreas,
      strongAreas,
      elapsedMinutes: Math.max(
        1,
        Math.round((Date.now() - new Date(session.startedAt || Date.now()).getTime()) / 60000)
      )
    }

    await saveMockTestResult(phone, finalResult)
    const bonusCoins = finalResult.score >= 4 ? 8 : finalResult.score >= 3 ? 5 : 2
    const finalRewardSummary = await awardActivity(phone, "mock_test_complete", { bonusCoins })

    return [
      wasCorrect ? "*Correct answer.*" : "*Not quite this time.*",
      `Correct option: ${correctOption?.display || correctKey}`,
      currentQuestion.explanation ? `Explanation: ${currentQuestion.explanation}` : "",
      "",
      buildMockTestSummaryMessage(finalResult),
      `Reward update: ${buildRewardFooter(finalRewardSummary)}`
    ]
      .filter(Boolean)
      .join("\n\n")
  }

  const nextSession = {
    ...session,
    currentIndex: nextIndex,
    correctAnswers: session.correctAnswers + (wasCorrect ? 1 : 0),
    strongAreas,
    weakAreas
  }

  await saveMockTestSession(phone, nextSession)

  const nextQuestionText = [
    wasCorrect ? "*Correct answer.*" : "*Not quite this time.*",
    `Correct option: ${correctOption?.display || correctKey}`,
    currentQuestion.explanation ? `Explanation: ${currentQuestion.explanation}` : "",
    buildRewardFooter(stepRewardSummary) ? `Reward update: ${buildRewardFooter(stepRewardSummary)}` : "",
    "",
    buildMockTestQuestionMessage(nextSession)
  ]
    .filter(Boolean)
    .join("\n\n")

  if (!runtimeOptions.preferInteractive) {
    return nextQuestionText
  }

  const nextMockOptions = Array.isArray(nextSession.questions?.[nextSession.currentIndex]?.options)
    ? nextSession.questions[nextSession.currentIndex].options
    : []
  if (nextMockOptions.length < 2) {
    await clearMockTestSession(phone)
    return nextQuestionText
  }
  return buildInteractiveQuestionResponse(
    nextQuestionText,
    nextMockOptions,
    runtimeOptions
  )
}

async function startAnswerReview(phone) {
  await saveAnswerReviewSession(phone, {
    mode: "answer_review",
    step: "question",
    questionText: "",
    studentAnswer: "",
    createdAt: new Date().toISOString()
  })

  return [
    "*Answer Review Mode*",
    "",
    "Send the question or prompt you answered.",
    "Example: Explain Newton's third law."
  ].join("\n")
}

async function handleAnswerReviewReply(phone, user, text, session) {
  const currentStep = session?.step || "question"
  const cleanText = String(text || "").trim()

  if (!cleanText) {
    return "Please send a proper message so I can continue the answer review."
  }

  if (currentStep === "question") {
    await saveAnswerReviewSession(phone, {
      ...session,
      step: "answer",
      questionText: cleanText,
      updatedAt: new Date().toISOString()
    })

    return [
      "Got it.",
      "",
      "Now send your answer exactly as you wrote it.",
      "I will check it like a teacher and tell you what is correct, what is missing, and how to improve it."
    ].join("\n")
  }

  const questionText = session?.questionText || ""
  const subject = refineSubject(detectSubject(questionText), questionText)
  // === PHASE 4: Emotional Analysis + Agent Memory ===
  const emotionResult = analyzeEmotion(text)
  if (emotionResult.emotion !== 'neutral') {
    recordEmotionalState(phone, emotionResult.emotion, emotionResult.confidence, emotionResult.signals)
  }
  const emotionalContext = getEmotionalContextForPrompt(emotionResult.emotion)
  const emotionalSummary = buildEmotionalSummary(phone)
  const teachingToneDirective = getTeachingToneDirective(emotionResult.emotion, user.level || user.class)
  const agentMemoryCtx = buildAgentMemoryContext(phone, { currentSubject: subject })
  const masteryContext = buildMasteryContext(phone, subject)
  const reviewPrompt = buildAnswerReviewPrompt({
    user,
    subject,
    questionText,
    studentAnswer: cleanText,
    masteryContext,
    emotionalContext,
    emotionalSummary,
    agentMemoryContext: agentMemoryCtx,
    teachingToneDirective
  })
  const review = await askOpenClawJson(reviewPrompt, {
    answerMode: "standard",
    taskType: "answer_review",
    phone,
    subject,
    questionText: questionText,
    user
  })

  const normalizedReview = {
    score: Math.max(0, Math.min(10, Number(review.score || 0))),
    verdict: String(review.verdict || "partly_correct").trim().toLowerCase(),
    topic: String(review.topic || subject).trim(),
    strengths: Array.isArray(review.strengths) ? review.strengths : [],
    mistakes: Array.isArray(review.mistakes) ? review.mistakes : [],
    feedback: String(review.feedback || "").trim(),
    improvedAnswer: String(review.improvedAnswer || "").trim()
  }

  await recordAnswerReview(phone, {
    subject,
    topic: normalizedReview.topic || subject,
    question: questionText,
    studentAnswer: cleanText,
    score: normalizedReview.score,
    feedback: normalizedReview.feedback,
    improvedAnswer: normalizedReview.improvedAnswer
  })
  await recordTopicPractice(phone, {
    subject,
    topic: normalizedReview.topic || subject,
    success: normalizedReview.score >= 7
  })
  if (normalizedReview.score < 7) {
    await scheduleWeakTopicReview(phone, {
      subject,
      topic: normalizedReview.topic || subject
    })
  }
  await clearAnswerReviewSession(phone)
  const rewardSummary = await awardActivity(
    phone,
    normalizedReview.score >= 7 ? "answer_review_good" : "answer_review_attempt"
  )

  return appendRewardSummary(buildAnswerReviewResultMessage(normalizedReview), rewardSummary)
}

async function startHomeworkCoach(phone, user, problemText, runtimeOptions = {}) {
  const normalizedProblem = String(problemText || "").trim()
  if (!normalizedProblem) {
    return "Send homework <question> to start guided help.\n\nExample: homework Find the perimeter of a rectangle with length 12 cm and width 5 cm."
  }

  const subject = refineSubject(detectSubject(normalizedProblem), normalizedProblem)
  await recordStudyQuestion(phone, { subject, topic: subject, question: normalizedProblem })
  await awardActivity(phone, "study_question")
  const masteryContext = buildMasteryContext(phone, subject)
  const coachingPrompt = buildHomeworkCoachPrompt({
    user,
    subject,
    problemText: normalizedProblem,
    masteryContext
  })
  const coachPlan = await askOpenClawJson(coachingPrompt, {
    answerMode: "standard",
    taskType: "homework_coach",
    phone,
    subject,
    questionText: normalizedProblem,
    user
  })
  const hints = Array.isArray(coachPlan.hints)
    ? coachPlan.hints
        .filter(Boolean)
        .slice(0, 3)
        .map((hint) => String(hint).replace(/^hint\s*\d+\s*:\s*/i, "").trim())
    : []

  if (!hints.length) {
    hints.push("Start by identifying what the question is asking and what information is already given.")
  }

  const session = {
    mode: "homework_coach",
    problemText: normalizedProblem,
    subject,
    topic: String(coachPlan.topic || subject).trim(),
    hints,
    currentHintIndex: 0,
    commonMistake: String(coachPlan.commonMistake || "").trim(),
    answerCheckTip: String(coachPlan.answerCheckTip || "").trim(),
    finalAnswer: String(coachPlan.finalAnswer || "").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await saveHomeworkSession(phone, session)
  return buildHomeworkActionResponse(buildHomeworkCoachStartMessage(session), runtimeOptions)
}

async function handleHomeworkReply(phone, user, text, session, runtimeOptions = {}) {
  if (!looksLikeHomeworkAttempt(text)) {
    await clearHomeworkSession(phone)
    return generateReply(text, phone, {
      ...runtimeOptions,
      preferInteractive: false,
      continuedFromSession: "homework_coach"
    })
  }

  if (isHintCommand(text.toLowerCase().trim())) {
    const nextHintIndex = Math.min((session.currentHintIndex || 0) + 1, session.hints.length - 1)
    const nextSession = {
      ...session,
      currentHintIndex: nextHintIndex,
      updatedAt: new Date().toISOString()
    }

    await saveHomeworkSession(phone, nextSession)
    return buildHomeworkActionResponse(buildHomeworkHintMessage(nextSession, nextHintIndex), runtimeOptions)
  }

  if (isShowHomeworkAnswerCommand(text.toLowerCase().trim())) {
    await clearHomeworkSession(phone)
    return formatReplyForWhatsApp(buildHomeworkAnswerMessage(session))
  }

  const masteryContext = buildMasteryContext(phone, session.subject)
  const reviewPrompt = buildAnswerReviewPrompt({
    user,
    subject: session.subject,
    questionText: session.problemText,
    studentAnswer: text,
    masteryContext
  })
  const review = await askOpenClawJson(reviewPrompt, {
    answerMode: "standard",
    taskType: "answer_review",
    phone,
    subject: session.subject,
    questionText: session.problemText,
    user
  })
  const normalizedReview = {
    score: Math.max(0, Math.min(10, Number(review.score || 0))),
    verdict: String(review.verdict || "partly_correct").trim().toLowerCase(),
    topic: String(review.topic || session.topic || session.subject).trim(),
    strengths: Array.isArray(review.strengths) ? review.strengths : [],
    mistakes: Array.isArray(review.mistakes) ? review.mistakes : [],
    feedback: String(review.feedback || "").trim(),
    improvedAnswer: String(review.improvedAnswer || "").trim()
  }

  await recordAnswerReview(phone, {
    subject: session.subject,
    topic: normalizedReview.topic || session.topic || session.subject,
    question: session.problemText,
    studentAnswer: text,
    score: normalizedReview.score,
    feedback: normalizedReview.feedback,
    improvedAnswer: normalizedReview.improvedAnswer
  })
  await recordTopicPractice(phone, {
    subject: session.subject,
    topic: normalizedReview.topic || session.topic || session.subject,
    success: normalizedReview.score >= 7
  })
  if (normalizedReview.score < 7) {
    await scheduleWeakTopicReview(phone, {
      subject: session.subject,
      topic: normalizedReview.topic || session.topic || session.subject
    })
  }

  await saveHomeworkSession(phone, {
    ...session,
    updatedAt: new Date().toISOString()
  })

  return buildHomeworkActionResponse(buildHomeworkAttemptFeedbackMessage(normalizedReview), runtimeOptions)
}

function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return ''
  let cleaned = text.replace(/[--]/g, '') // Remove control chars
  cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
  if (cleaned.length > 4000) {
    cleaned = cleaned.slice(0, 4000) + '... (question too long, shortened)'
  }
  return cleaned.trim()
}

async function generateReply(messageInput, phone, runtimeOptions = {}) {
  const incomingMessage = typeof messageInput === "string" ? { type: "text", text: messageInput } : messageInput || {}
  const rawQuestion = sanitizeInput(String(incomingMessage.text || "").trim())
  const cleanQuestion = rawQuestion.toLowerCase().trim()
  const existingUser = getUser(phone)
  const onboardingState = getOnboardingState(phone)
  let activeDailyChallenge = getChallengeState(phone)
  let activeMockTestSession = getMockTestSession(phone)
  let activeQuizSession = getActiveQuizSession(phone)
  let activeAnswerReviewSession = getActiveAnswerReviewSession(phone)
  let activeHomeworkSession = getActiveHomeworkSession(phone)
  let activeFlashcardsSession = premiumUpgrades.getActiveFlashcardsSession(phone)

  if (activeMockTestSession && isSessionExpired(activeMockTestSession, MOCK_TEST_SESSION_MAX_AGE_MINUTES)) {
    await clearMockTestSession(phone)
    activeMockTestSession = null
  }

  if (activeQuizSession && isSessionExpired(activeQuizSession, QUIZ_SESSION_MAX_AGE_MINUTES)) {
    await clearQuizSession(phone)
    activeQuizSession = null
  }

  if (activeAnswerReviewSession && isSessionExpired(activeAnswerReviewSession, ANSWER_REVIEW_SESSION_MAX_AGE_MINUTES)) {
    await clearAnswerReviewSession(phone)
    activeAnswerReviewSession = null
  }

  if (activeHomeworkSession && isSessionExpired(activeHomeworkSession, HOMEWORK_SESSION_MAX_AGE_MINUTES)) {
    await clearHomeworkSession(phone)
    activeHomeworkSession = null
  }

  if (activeDailyChallenge && isChallengeExpired(activeDailyChallenge)) {
    await clearDailyChallenge(phone)
    activeDailyChallenge = null
  }

  // ─── VIVA Simulator Intercept ───
  const activeVivaSession = getVivaSession(phone)
  if (activeVivaSession && !cleanQuestion.includes("stop viva") && !cleanQuestion.includes("end viva")) {
    return vivaSimulator.handleVivaAnswer(phone, rawQuestion, activeVivaSession)
  }
  if (cleanQuestion.startsWith("/viva") || cleanQuestion.startsWith("viva on")) {
    return vivaSimulator.startVivaSession(phone, rawQuestion.replace(/\/viva|viva on/i, "").trim())
  }
  if (activeVivaSession && (cleanQuestion.includes("stop viva") || cleanQuestion.includes("end viva"))) {
    deleteVivaSession(phone)
    return "VIVA session ended early. Your responses have been discarded."
  }
  
  // ─── Mistake Notebook Intercept ───
  if (cleanQuestion === "/mistakes" || cleanQuestion === "test my mistakes" || cleanQuestion === "/review_mistakes") {
    return mistakeNotebook.generateMistakeQuiz(phone)
  }

  // ─── Bookmark current answer ───
  if (cleanQuestion === "bookmark" && runtimeOptions._lastAnswer) {
    bookmarkAnswer(phone, runtimeOptions._lastQuestion || "", runtimeOptions._lastAnswer, runtimeOptions._lastSubject || "", "")
    return "*Bookmarked!*\n\nType *my bookmarks* to see all saved answers."
  }

  // ─── Flashcard navigation ───
  const flashcardSession = getFlashcardSession(phone)
  if (flashcardSession && !isStopFlashcardCommand(cleanQuestion)) {
    if (cleanQuestion === "next" || cleanQuestion === "show answer" || cleanQuestion === "answer") {
      // Check if we've already shown the answer for this card
      if (runtimeOptions._flashcardShowAnswer) {
        advanceFlashcard(phone)
        runtimeOptions._flashcardShowAnswer = false
        const nextSession = getFlashcardSession(phone)
        if (nextSession && nextSession.current_index < nextSession.total_cards) {
          runtimeOptions._flashcardShowAnswer = false
          return buildFlashcardMessage(nextSession)
        } else {
          clearFlashcardSession(phone)
          return buildFlashcardMessage({ ...flashcardSession, current_index: flashcardSession.total_cards, total_cards: flashcardSession.total_cards, cards_json: flashcardSession.cards_json, topic: flashcardSession.topic })
        }
      } else {
        runtimeOptions._flashcardShowAnswer = true
        return buildFlashcardAnswerMessage(flashcardSession)
      }
    }
    if (cleanQuestion === "skip") {
      advanceFlashcard(phone)
      const nextSession = getFlashcardSession(phone)
      if (nextSession && nextSession.current_index < nextSession.total_cards) {
        return buildFlashcardMessage(nextSession)
      } else {
        clearFlashcardSession(phone)
        return buildFlashcardMessage({ ...flashcardSession, current_index: flashcardSession.total_cards, total_cards: flashcardSession.total_cards, cards_json: flashcardSession.cards_json, topic: flashcardSession.topic })
      }
    }
  }

  // ─── Subject selection from list reply ───
  if (cleanQuestion.startsWith("subject ") && !isStopFlashcardCommand(cleanQuestion)) {
    const selectedSubject = cleanQuestion.replace("subject ", "").trim()
    return `Great choice! Ask me any ${selectedSubject} question.\n\nExample: "Explain ${selectedSubject.toLowerCase()} concepts for my exam"`
  }

  if (isHelpCommand(cleanQuestion) && onboardingState) {
    return [
      "Please finish your profile first so I can teach you at the correct level.",
      "",
      "I still need your name, class or course, board or university, preferred language, and main subjects."
    ].join("\n")
  }

  if (isHelpCommand(cleanQuestion) && !isProfileComplete(existingUser)) {
    const onboardingPrompt = await startOnboarding(phone, existingUser)
    return `Before using study commands, please complete your profile.\n\n${onboardingPrompt}`
  }

  if (onboardingState) {
    const onboardingReply = await handleOnboardingReply(phone, rawQuestion)
    if (onboardingReply.completed) {
      const referralWelcome = buildReferralWelcomeMessage(phone)
      const welcomeExtras = [
      "",
      "*Your profile is ready! Here is what you can do:*",
      "- Just type any study question to start learning",
      "- 'help' to see all commands",
      "- 'quiz topic' for a practice quiz",
      "- 'daily tip' for a helpful study tip",
      "",
      "Let us start learning!"
    ].join("\n")
    const welcomeText = [onboardingReply.reply, referralWelcome, welcomeExtras].filter(Boolean).join("\n\n")
      // Send User Guide PDF to new user (async, don't block the welcome reply)
      getUserGuideMediaId().then((mediaId) => {
        if (mediaId) {
          sendWhatsAppDocument(phone, mediaId, "AI_Study_Bot_User_Guide.pdf",
            "Welcome to AI Study Bot! Here is your complete User Guide with all features and tips."
          ).catch((err) => console.error("[User Guide PDF] Failed to send:", err.message))
        }
      }).catch((err) => console.error("[User Guide PDF] Upload failed:", err.message))
      // Activate 3-day trial for new users
      if (activateTrialSubscription(phone)) {
        setTimeout(() => sendWhatsAppMessage(phone, buildTrialWelcomeMessage()).catch(() => {}), 2000)
      }
      // Send interactive welcome with buttons for new users
      if (runtimeOptions.preferInteractive && runtimeOptions.channel === "whatsapp") {
        return {
          type: "buttons",
          text: welcomeText,
          buttons: [
            { id: "start learning", title: "Start Learning" },
            { id: "take quiz", title: "Take a Quiz" },
            { id: "daily tip", title: "Daily Tip" },
            { id: "help menu", title: "Help Menu" }
          ]
        }
      }
      return welcomeText
    }
    return onboardingReply.reply
  }

  if (!isProfileComplete(existingUser)) {
    return startOnboarding(phone, existingUser)
  }

  const user = existingUser || {
    name: "Student",
    class: "Unknown",
    board: "Unknown",
    language: "English",
    teachingPacePreference: "auto"
  }
  // ⏰ KAIROS: Record this student is active right now
  try { kairosRecordActivity(phone) } catch (e) {}

  const accessProfile = getAccessProfile(phone)
  const directHomeworkProblem = extractHomeworkProblem(rawQuestion)
  const directMockTestTopic = extractMockTestTopic(rawQuestion)
  const directQuizTopic = extractQuizTopic(rawQuestion)
  const referralPhone = extractReferralPhone(rawQuestion)
  const adminActivation = parseAdminActivatePlanCommand(rawQuestion)
  const adminConfirmPayment = parseAdminConfirmPaymentCommand(rawQuestion)
  const adminRejectPayment = parseAdminRejectPaymentCommand(rawQuestion)

  if (isPricingCommand(cleanQuestion)) {
    return buildPricingMessage(accessProfile)
  }

  if (isMyPlanCommand(cleanQuestion)) {
    return buildPlanStatusMessage(accessProfile)
  }

  const buyPlanType = parseBuyPlanCommand(cleanQuestion)
  if (buyPlanType) {
    const intent = await createPurchaseIntent(phone, buyPlanType, {
      userName: user.name,
      userLevel: user.level || user.class || user.class_name,
      userBoard: user.board
    })
    return buildPurchaseIntentMessage(intent, accessProfile)
  }

  if (isPaymentStatusCommand(cleanQuestion)) {
    return buildPaymentStatusMessage(getPaymentSummary(phone))
  }

  if (isPaymentSubmittedCommand(cleanQuestion)) {
    return buildPaymentSubmittedMessage(markLatestPaymentSubmitted(phone))
  }

  if (isReferralSummaryCommand(cleanQuestion)) {
    return buildReferralSummaryMessage(getReferralSummary(phone))
  }

  if (referralPhone) {
    const result = setReferral(referralPhone, phone)
    if (!result.ok) {
      if (result.reason === "exists") {
        return "A referral is already linked to this account."
      }

      return "Please send a valid referrer WhatsApp number.\n\nExample: refer by 919876543210"
    }

    return [
      "Referral saved successfully.",
      "",
      `Referrer phone: ${referralPhone}`,
      "If you buy Premium, the referral commission will be tracked automatically."
    ].join("\n")
  }

  if (isAdminDashboardCommand(cleanQuestion) && isAdminPhone(phone)) {
    return buildAdminDashboardMessage()
  }

  if (adminActivation && isAdminPhone(phone)) {
    const activation = activateSubscription(adminActivation.phone, adminActivation.planType)
    return [
      "Premium activated successfully.",
      "",
      `User: ${adminActivation.phone}`,
      `Plan: ${activation.planType}`,
      `Price: Rs. ${activation.priceRs}`,
      `Valid till: ${new Date(activation.expiresAt).toLocaleDateString("en-IN")}`,
      activation.commission
        ? `Referral commission: Rs. ${activation.commission.amountRs} to ${activation.commission.referrerPhone}`
        : "Referral commission: none"
      ].join("\n")
  }

  if (adminConfirmPayment && isAdminPhone(phone)) {
    const paymentSummary = getPaymentSummary(adminConfirmPayment.phone)
    const latestOrder = paymentSummary.latestOrder

    if (!latestOrder) {
      return [
        "No payment request found.",
        "",
        `User: ${adminConfirmPayment.phone}`
      ].join("\n")
    }

    const activation = activateSubscription(adminConfirmPayment.phone, latestOrder.planType)
    markPaymentOrderConfirmed(latestOrder.id)

    return [
      "Payment confirmed and premium activated successfully.",
      "",
      `User: ${adminConfirmPayment.phone}`,
      `Order id: ${latestOrder.id}`,
      `Plan: ${activation.planType}`,
      `Price: Rs. ${activation.priceRs}`,
      `Valid till: ${new Date(activation.expiresAt).toLocaleDateString("en-IN")}`,
      activation.commission
        ? `Referral commission: Rs. ${activation.commission.amountRs} to ${activation.commission.referrerPhone}`
        : "Referral commission: none"
      ].join("\n")
  }

  if (adminRejectPayment && isAdminPhone(phone)) {
    const paymentSummary = getPaymentSummary(adminRejectPayment.phone)
    const latestOrder = paymentSummary.latestOrder

    if (!latestOrder) {
      return [
        "No payment request found.",
        "",
        `User: ${adminRejectPayment.phone}`
      ].join("\n")
    }

    markPaymentOrderRejected(latestOrder.id)

    return [
      "Payment submission rejected.",
      "",
      `User: ${adminRejectPayment.phone}`,
      `Order id: ${latestOrder.id}`,
      `Plan: ${latestOrder.planType === "yearly" ? "Yearly Premium" : "Monthly Premium"}`,
      `Amount: Rs. ${latestOrder.amountRs}`,
      "Status: rejected"
    ].join("\n")
  }

  if (isAdminPendingPaymentsCommand(rawQuestion) && isAdminPhone(phone)) {
    return buildAdminPendingPaymentsMessage(listSubmittedPaymentOrders(10))
  }

  // ─── Short question guard: ask for more context if question is too vague ───
  if (incomingMessage.type === "text" && cleanQuestion.length <= 3 && cleanQuestion.length > 0) {
    const knownShortReplies = ["hi", "hey", "ok", "yes", "no", "bye", "hm", "oh", "hmm", "nah", "yep", "nope", "lol", "wow", "okk"]
    if (!knownShortReplies.includes(cleanQuestion)) {
      return "Please send the full question so I can help you better! \n\nExample: _\"What is the LCM of 12 and 18?\"_ or _\"Explain photosynthesis\"_"
    }
  }

  const premiumFeatureName = getPremiumFeatureName({
    cleanQuestion,
    rawQuestion,
    directHomeworkProblem,
    directMockTestTopic,
    directQuizTopic,
    incomingMessageType: incomingMessage.type
  })

  if (premiumFeatureName && !accessProfile.premium) {
    return buildPremiumFeatureLockedMessage(premiumFeatureName)
  }

  if (incomingMessage.type === "image" && incomingMessage.buffer) {
    // IMAGE HANDLER: OCR + Main AI Pipeline (reliable, no vision API dependency)
    try {
      console.log("[ImageHandler] Processing image from " + phone)
      const caption = incomingMessage.caption || ""

      // Step 1: Extract text from image using OCR as baseline
      const ocrRaw = await extractTextFromImage(incomingMessage.buffer)
      const ocrNormalized = String(ocrRaw || "").trim()

      // Step 2: Use Smart Vision Pipeline (Gemini Vision + OCR fallback)
      const { processImageSmart } = require("./utils/visionHandler")
      const visionResult = await processImageSmart(incomingMessage.buffer, ocrNormalized, caption, user)
      
      const normalizedExtractedText = visionResult.content

      // If BOTH Vision and OCR failed to find readable content:
      if (visionResult.method === "none") {
        console.log("[ImageHandler] Quality too low — OCR failed and Vision unavailable/failed")
        return [
          "📸 *I couldn't read the text or see the questions clearly in your photo.*",
          "",
          "*For best results:*",
          "✔️ Hold your phone straight above the page (not at an angle)",
          "✔️ Good lighting — go near a window or switch on lights",
          "✔️ Zoom in on just ONE question, not the whole page",
          "✔️ Keep the camera still so text is sharp",
          "",
          "_Or simply *type your question* and I will answer it instantly!_",
          "",
          "_Send_ *photo help* _to learn how to send homework photos._"
        ].join("\n")
      }

      console.log(`[ImageHandler] Extracted via ${visionResult.method} — ${normalizedExtractedText.length} chars`)

      // Send the image content directly to the Teacher AI pipeline
      // Build a homework-specific instruction
      const imageInstruction = visionResult.method === "vision"
        ? `Here is the student's homework image content:\n\n${normalizedExtractedText}\n\nYou are an expert teacher! Solve the problem completely but instead of just giving the answer, structure it as an interactive mini-lesson or clear step-by-step guide so the student actually learns how to do it. Provide full working for all parts (e.g. repeated subtraction steps for division).`
        : (caption
          ? `Homework photo. Caption: ${caption}\n\nExtracted text:\n${normalizedExtractedText}\n\nPlease solve all parts fully and teach the concept step-by-step.`
          : `Homework photo.\n\nExtracted text:\n${normalizedExtractedText}\n\nPlease solve all parts fully and teach the concept step-by-step.`)
      // Smart subject detection for images:
      // Priority 1: If caption has a clear subject clue, use that
      // Priority 2: Use user's saved subject interests
      // Priority 3: OCR text detection but ONLY if confidence is high (score > 8)
      // Priority 4: Fall back to "English" for worksheet-like text (dialogue, paragraph, essay, etc.)
      // Priority 5: "General"
      let imageSubject = "General"
      if (caption) {
        const captionSubject = detectSubject(caption)
        if (captionSubject && captionSubject !== "General") {
          imageSubject = captionSubject
          console.log("[ImageHandler] Subject from caption: " + imageSubject)
        }
      }
      if (imageSubject === "General" && user.subjectInterests && user.subjectInterests.length === 1) {
        // If user only studies one subject, use that
        imageSubject = user.subjectInterests[0]
        console.log("[ImageHandler] Subject from user profile: " + imageSubject)
      }
      if (imageSubject === "General") {
        // Check if worksheet text looks like English/language tasks
        const lowerOCR = normalizedExtractedText.toLowerCase()
        const isLanguageWorksheet = /dialogue|paragraph|essay|comprehension|letter|write.*sentence|fill in|blank|story|poem|grammar|vocabulary|translate|passage|question and answer|q\.?\s*a|read.*answer/i.test(lowerOCR)
        if (isLanguageWorksheet) {
          imageSubject = "English"
          console.log("[ImageHandler] Subject detected as English from worksheet keywords")
        }
      }
      if (imageSubject === "General") {
        const detectedFromOCR = detectSubject(normalizedExtractedText)
        if (detectedFromOCR && detectedFromOCR !== "General") {
          imageSubject = detectedFromOCR
          console.log("[ImageHandler] Subject from OCR text: " + imageSubject)
        }
      }
      if (imageSubject === "General") {
        // Check if worksheet text looks like math (division, multiplication, equations)
        const mathSignals = /[\d]\s*[\u00f7\/+\-*xX]\s*[\d]/  // e.g. 63÷9, 42+7, 3x4
          || /division|divide|multiply|subtract|add|sum|difference|loop/i
          || /[\d]+\s*=\s*[\d]+/  // e.g. 24 = 3 or 42 ÷ 7 =
        if (mathSignals.test(normalizedExtractedText)) {
          imageSubject = "Math"
          console.log("[ImageHandler] Subject detected as Math from worksheet symbols")
        }
      }
      if (imageSubject === "General") {
        console.log("[ImageHandler] Could not detect subject, using General")
      }

      imageSubject = refineSubject(imageSubject, normalizedExtractedText)
      const imageContext = getConversationContext(phone)
      const imageMasteryCtx = buildMasteryContext(phone, imageSubject)
      const imageMasteryState = getMasteryState(phone)

      // Use the same agent orchestrator pipeline as text questions
      const imageAgentPlan = planAgentAction({
        question: normalizedExtractedText,
        subject: imageSubject,
        user,
        answerMode: "standard",
        commandSuffix: "",
        masteryState: imageMasteryState,
        lastExecution: null
      })
      const imageDiag = imageAgentPlan.diagnostic || { intent: "learn", teachingMode: "explain", complexity: "medium" }

      const emotionalContext = getEmotionalContextForPrompt("neutral")
      const agentMemoryCtx = buildAgentMemoryContext(phone, { currentSubject: imageSubject })

      // Pass the homework instruction as the question so the AI gets clear directions
      const imagePrompt = buildPrompt(imageInstruction, user, imageSubject, imageContext, {
        answerMode: "standard",
        masteryContext: imageMasteryCtx,
        diagnosticContext: [imageAgentPlan.plannerContext, imageDiag.promptText].filter(Boolean).join(" "),
        emotionalContext,
        agentMemoryContext: agentMemoryCtx
      })

      const imageResult = await askOpenClawWithMeta(imagePrompt, {
        answerMode: "standard",
        taskType: imageAgentPlan.taskType || "teaching",
        phone,
        channel: runtimeOptions.channel,
        subject: imageSubject,
        questionText: normalizedExtractedText,
        user
      })

      let imageReply = imageResult?.text

      if (!imageReply) {
        imageReply = "Something went wrong processing your image. Please try again or type the question."
      } else {
        imageReply = ensurePocketTeacherFinish(formatReplyForWhatsApp(imageReply, {
          subject: imageSubject, question: normalizedExtractedText, user
        }), {
          answerMode: "standard",
          learningIntent: imageDiag.intent,
          teachingMode: imageDiag.teachingMode,
          complexity: imageDiag.complexity,
          subject: imageSubject, question: normalizedExtractedText,
          weakTopics: (imageMasteryCtx?.weakTopics || [])
            .filter((item) => String(item.subject || "").toLowerCase() === String(imageSubject || "").toLowerCase())
            .map((item) => item.topic)
        })

        // Quality check
        const imageQ = collectAnswerQualityIssues(imageReply, { subject: imageSubject, question: normalizedExtractedText, user })
        if (imageQ.shouldRetry) {
          const recPrompt = buildQualityRecoveryPrompt(imagePrompt, imageReply, imageQ.issues)
          const retryR = await askOpenClawWithMeta(recPrompt, {
            answerMode: "standard", taskType: "teaching", phone,
            channel: runtimeOptions.channel, subject: imageSubject,
            questionText: normalizedExtractedText, user
          })
          if (retryR?.text) {
            imageReply = ensurePocketTeacherFinish(formatReplyForWhatsApp(retryR.text, {
              subject: imageSubject, question: normalizedExtractedText, user
            }), { answerMode: "standard", subject: imageSubject, question: normalizedExtractedText, user })
          }
        }

        await addToHistory(phone, normalizedExtractedText, imageReply)
        recordTutorPromptUsage(phone)
      }

      trackInteraction({ phone, eventName: "image_solved",
        channel: runtimeOptions.channel || "unknown", subject: imageSubject,
        metadata: { method: "vision_ocr_pipeline", answerLength: imageReply.length, ocrLength: ocrRaw ? ocrRaw.length : 0 }
      })

      console.log("[ImageHandler] Sent answer (" + imageReply.length + " chars) for image from " + phone)
      return imageReply

    } catch (imageError) {
      console.error("[ImageHandler] Error processing image:", imageError.message)
      return "I had trouble processing that image. Please try sending a clearer photo or type the question directly."
    }
  }

  // ── 🎤 VOICE HANDLER — Students can send voice notes ───────────────────────
  if ((incomingMessage.type === "audio" || incomingMessage.type === "voice" || incomingMessage.type === "ptt") && incomingMessage.mediaId) {
    try {
      console.log("[VoiceHandler] Processing voice from " + phone)
      kairosRecordActivity(phone)

      let transcription = null
      try {
        transcription = await handleVoiceMessage(incomingMessage.mediaId)
      } catch (voiceErr) {
        console.error("[VoiceHandler] Error:", voiceErr.message)
        transcription = null
      }
      if (!transcription || transcription.length < 3) {
        return "🎤 I couldn't hear your voice note clearly.\n\nPlease:\n✅ Speak clearly and slowly\n✅ Keep it under 60 seconds\n✅ Or simply *type your question* directly!"
      }

      console.log("[VoiceHandler] Transcribed: " + transcription.substring(0, 100))

      // Feed transcription through the exact same pipeline as a text question
      const voiceResult = await handleStudentMessage(
        { type: "text", text: transcription },
        phone,
        runtimeOptions
      )

      const voicePrefix = `🎤 _I heard: "${transcription.substring(0, 80)}${transcription.length > 80 ? "..." : ""}"_\n\n`
      return voicePrefix + (typeof voiceResult === "string" ? voiceResult : voiceResult?.text || "")
    } catch (voiceErr) {
      console.error("[VoiceHandler] Error:", voiceErr.message)
      return "🎤 Voice processing failed. Please type your question instead."
    }
  }

  // ── 👨‍🏫 TEACHER MODE — Class management commands ────────────────────────────
  if (isRequestTeacherCommand(cleanQuestion)) {
    requestTeacherVerification(phone, user.name)
    return [
      "👨‍🏫 *Teacher Verification Request Sent!*",
      "",
      `Name: ${user.name}`,
      "Status: Pending admin approval",
      "",
      "Once approved, you can:\n• Create a class: _create class English 8A_\n• Send class quiz: _class quiz photosynthesis_\n• View class progress: _class progress_",
      "",
      "_An admin will review your request shortly._"
    ].join("\n")
  }

  const createClassArgs = parseCreateClassCommand(cleanQuestion)
  if (createClassArgs) {
    if (!isVerifiedTeacher(phone)) {
      return "👨‍🏫 *Teacher account required.*\n\nSend _request teacher_ to apply for teacher access. An admin will approve you."
    }
    const result = createClass(phone, createClassArgs.name, createClassArgs.subject, createClassArgs.grade)
    if (result.error) return `❌ Could not create class: ${result.message}`
    return [
      "✅ *Class Created Successfully!*",
      "",
      `📚 Class: ${createClassArgs.name}`,
      `📖 Subject: ${createClassArgs.subject}`,
      `🎓 Grade: ${createClassArgs.grade}`,
      `🔑 *Join Code: ${result.classId}*`,
      "",
      "Share this code with your students.\nStudents join by sending: _join class " + result.classId + "_"
    ].join("\n")
  }

  const joinClassCode = parseJoinClassCommand(cleanQuestion)
  if (joinClassCode) {
    const result = joinClass(phone, joinClassCode)
    if (!result.ok) {
      if (result.reason === "not_found") return `❌ Class code *${joinClassCode}* not found. Check the code and try again.`
      if (result.reason === "already_joined") return `✅ You are already a member of this class!`
    }
    const cls = result.class
    return [
      "🎉 *Joined Class Successfully!*",
      "",
      `📚 Class: ${cls.name}`,
      `📖 Subject: ${cls.subject}`,
      `🎓 Grade: ${cls.grade}`,
      "",
      "You will now receive class quizzes and assignments from your teacher!"
    ].join("\n")
  }

  if (isMyClassCommand(cleanQuestion)) {
    const classes = getStudentClasses(phone)
    const teacherClasses = isVerifiedTeacher(phone) ? getTeacherClasses(phone) : []
    if (classes.length === 0 && teacherClasses.length === 0) {
      return "📚 *You haven't joined any class yet.*\n\nAsk your teacher for a join code, then send:\n_join class [CODE]_"
    }
    const lines = ["📚 *Your Classes*", ""]
    for (const cls of [...teacherClasses.map(c => ({ ...c, role: "Teacher" })), ...classes.map(c => ({ ...c, role: "Student" }))]) {
      lines.push(`• *${cls.name}* (${cls.subject}, Grade ${cls.grade}) — ${cls.role}`)
      if (cls.role === "Teacher") lines.push(`  Join code: *${cls.class_id}*`)
    }
    return lines.join("\n")
  }

  const classQuizTopic = parseClassQuizCommand(cleanQuestion)
  if (classQuizTopic) {
    if (!isVerifiedTeacher(phone)) return "👨‍🏫 Only verified teachers can send class quizzes."
    const teacherClasses = getTeacherClasses(phone)
    if (teacherClasses.length === 0) return "📚 You have no classes yet. Create one first: _create class [name] [subject] [grade]_"
    // Use first class for now (improve later with multi-class support)
    const cls = teacherClasses[0]
    const members = getClassMembers(cls.class_id)
    if (members.length === 0) return `📚 No students in *${cls.name}* yet. Share join code: *${cls.class_id}*`
    // Build and broadcast quiz to all class members
    const quizMsg = [
      `📝 *Quiz from your teacher!*`,
      `Class: ${cls.name} | Subject: ${cls.subject}`,
      "",
      `Topic: *${classQuizTopic}*`,
      "",
      `Send _quiz ${classQuizTopic}_ to start your quiz, or ask me any question about this topic!`
    ].join("\n")
    let sent = 0
    for (const m of members) {
      try {
        await sendWhatsAppMessage(m.student_phone, quizMsg)
        sent++
        await new Promise(r => setTimeout(r, 800))
      } catch (e) {}
    }
    return `✅ Quiz sent to *${sent}/${members.length}* students in *${cls.name}*!`
  }

  if (isClassProgressCommand(cleanQuestion)) {
    if (!isVerifiedTeacher(phone)) return "👨‍🏫 Only verified teachers can view class progress."
    const teacherClasses = getTeacherClasses(phone)
    if (teacherClasses.length === 0) return "📚 No classes found. Create one: _create class [name] [subject] [grade]_"
    const cls = teacherClasses[0]
    const leaderboard = getClassLeaderboard(cls.class_id)
    const members = getClassMembers(cls.class_id)
    const lines = [`📊 *${cls.name} Progress*`, `Students: ${members.length}`, ""]
    if (leaderboard.length === 0) {
      lines.push("No quiz results yet. Send a quiz: _class quiz [topic]_")
    } else {
      lines.push("🏆 *Leaderboard:*")
      leaderboard.slice(0, 10).forEach((row, i) => {
        lines.push(`${i + 1}. ${row.name || "Student"} — ${row.total_score} pts (${row.quizzes_solved} quizzes)`)
      })
    }
    return lines.join("\n")
  }

  // Admin: approve/reject teacher
  const approvePhone = isAdminPhone(phone) ? parseApproveTeacherCommand(cleanQuestion) : null
  if (approvePhone) {
    approveTeacher(approvePhone)
    return `✅ Teacher *${approvePhone}* approved! They can now create classes.`
  }

  if (isAdminPhone(phone) && isPendingTeachersCommand(cleanQuestion)) {
    const pending = getPendingTeacherRequests()
    if (pending.length === 0) return "✅ No pending teacher requests."
    const lines = [`👨‍🏫 *Pending Teacher Requests (${pending.length})*`, ""]
    for (const t of pending) {
      lines.push(`• ${t.name} — ${t.phone}\n  Approve: _approve teacher ${t.phone}_`)
    }
    return lines.join("\n")
  }

  // ── 📸 Photo Help Guide ────────────────────────────────────────────────────────────────────────
  if (isPhotoHelpCommand(cleanQuestion)) {
    return [
      "📸 *How to Send Your Homework Photo*",
      "",
      "Just send any photo of your homework or textbook and I will solve it for you instantly!",
      "",
      "📌 *Tips for best results:*",
      "✔️ Hold your phone straight above the page (not at an angle)",
      "✔️ Make sure the room has good lighting — bright light helps!",
      "✔️ Zoom in on just ONE question, not the whole book",
      "✔️ Keep the camera still so the text is sharp (not blurry)",
      "✔️ Add a caption like \"solve this\" or \"maths\" to help me understand faster",
      "",
      "💡 *What I can solve from photos:*",
      "• Maths problems (arithmetic, algebra, geometry)",
      "• Science questions (Physics, Chemistry, Biology)",
      "• English worksheets (grammar, fill in blanks, essays)",
      "• History, Geography, Economics questions",
      "• Hindi worksheets and more!",
      "",
      "_Send your photo now and I will answer it!_ 🚀"
    ].join("\n")
  }

  // ── 📚 PERSONAL TUTOR MODE — 'teach [topic]' ───────────────────────────────────────────────
  const teachTopic = parseTeachCommand(cleanQuestion)
  if (teachTopic) {
    const teachSubject = refineSubject(detectSubject(teachTopic), teachTopic)
    const topicKB = getTopicContextForPrompt(teachTopic)
    const tutorPrompt = [
      `You are a personal tutor. The student wants to learn about: "${teachTopic}". Start an interactive mini-lesson with this structure: (1) Clear simple introduction in 2-3 sentences, (2) A real-life example the student can relate to, (3) The key formula or rule if applicable, (4) A short worked example with steps, (5) ONE practice question for the student to try. Use simple friendly language like a good teacher. Address the student directly.`,
      topicKB ? `Reference knowledge:\n${topicKB}` : ""
    ].filter(Boolean).join("\n")

    kairosRecordActivity(phone)
    await recordStudyQuestion(phone, { subject: teachSubject, topic: teachTopic, question: `teach ${teachTopic}` })
    await awardActivity(phone, "study_question")

    const tutorResult = await askOpenClawWithMeta(
      buildPrompt(tutorPrompt, user, teachSubject, getConversationContext(phone), { answerMode: "detailed" }),
      { answerMode: "detailed", taskType: "teaching", phone, channel: runtimeOptions.channel, subject: teachSubject, questionText: teachTopic, user }
    )

    const tutorReply = tutorResult?.text
      ? formatReplyForWhatsApp(tutorResult.text, { subject: teachSubject, question: teachTopic, user })
      : `📚 Let me teach you about *${teachTopic}*!\n\nPlease ask me a specific question about this topic to get started.`

    await addToHistory(phone, `teach ${teachTopic}`, tutorReply)
    return `📚 *Personal Tutor Mode: ${teachTopic}*\n\n` + tutorReply + `\n\n_After trying the practice question, send your answer and I will check it!_`
  }

  // ── 🎯 EXAM DOUBT SOLVER — 'exam [topic]' ─────────────────────────────────────────────────────────
  const examDoubtTopic = parseExamDoubtCommand(cleanQuestion)
  if (examDoubtTopic) {
    const examSubject = refineSubject(detectSubject(examDoubtTopic), examDoubtTopic)
    const topicKB = getTopicContextForPrompt(examDoubtTopic)
    const examPrompt = [
      `The student is preparing for board/competitive exams (CBSE/GSEB/JEE/NEET) and needs help with: "${examDoubtTopic}"`,
      "Give an exam-ready explanation. Follow this format:",
      "1. 📌 *One-line definition* (exam-style)",
      "2. 🔑 *Key points to remember* (4-5 bullet points examiners look for)",
      "3. 🧠 *Formula / Rule* (if applicable, with units)",
      "4. ✅ *Short worked example* (exam-style solution)",
      "5. ⚠️ *Common exam mistakes* students make",
      "6. 🎯 *Exam tip* (what to write to get full marks)",
      "Keep it concise — exam answers should be sharp, not padded.",
      topicKB ? `Reference knowledge: ${topicKB}` : ""
    ].filter(Boolean).join("\n")

    kairosRecordActivity(phone)
    await recordStudyQuestion(phone, { subject: examSubject, topic: examDoubtTopic, question: `exam ${examDoubtTopic}` })
    await awardActivity(phone, "study_question")

    const examResult = await askOpenClawWithMeta(
      buildPrompt(examPrompt, user, examSubject, "", { answerMode: "exam" }),
      { answerMode: "exam", taskType: "teaching", phone, channel: runtimeOptions.channel, subject: examSubject, questionText: examDoubtTopic, user }
    )

    const examReply = examResult?.text
      ? formatReplyForWhatsApp(examResult.text, { subject: examSubject, question: examDoubtTopic, user })
      : `🎯 For *${examDoubtTopic}* exam preparation, please ask me a specific question and I will give you the exam-ready answer.`

    await addToHistory(phone, `exam ${examDoubtTopic}`, examReply)
    return `🎯 *Exam Mode: ${examDoubtTopic}*\n\n` + examReply
  }

  if (isProfileCommand(cleanQuestion)) {
    return formatProfile(user)
  }

  if (isSubjectsCommand(cleanQuestion)) {
    trackInteraction({
      phone,
      eventName: "subjects_viewed",
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        interactive: Boolean(runtimeOptions.preferInteractive)
      }
    })
    return buildSubjectsCatalogResponse(user, runtimeOptions)
  }

  if (isStudyModeCommand(cleanQuestion)) {
    trackInteraction({
      phone,
      eventName: "study_mode_opened",
      teachingMode: user.teachingPacePreference || "auto",
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        interactive: Boolean(runtimeOptions.preferInteractive)
      }
    })
    return buildStudyModeResponse(runtimeOptions, user)
  }

  if (isStreakCommand(cleanQuestion)) {
    return buildStreakMessage(phone, user)
  }

  if (isRewardsCommand(cleanQuestion)) {
    return buildRewardsMessage(phone, user)
  }

  if (isBadgesCommand(cleanQuestion)) {
    return buildBadgesMessage(phone, user)
  }

  if (isTeachEasierCommand(cleanQuestion)) {
    const preference = saveTeachingPacePreference(phone, "guided")
    trackInteraction({
      phone,
      eventName: "teaching_pace_changed",
      teachingMode: preference,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        pace: preference
      }
    })
    return [
      "I will teach more slowly and simply from now on.",
      "",
      `Teaching pace saved: ${preference}`,
      "You can change it any time with: same level or teach harder."
    ].join("\n")
  }

  if (isTeachSameLevelCommand(cleanQuestion)) {
    const preference = saveTeachingPacePreference(phone, "balanced")
    trackInteraction({
      phone,
      eventName: "teaching_pace_changed",
      teachingMode: preference,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        pace: preference
      }
    })
    return [
      "I will teach at a normal balanced pace.",
      "",
      `Teaching pace saved: ${preference}`,
      "You can change it any time with: teach easier or teach harder."
    ].join("\n")
  }

  if (isTeachHarderCommand(cleanQuestion)) {
    const preference = saveTeachingPacePreference(phone, "stretch")
    trackInteraction({
      phone,
      eventName: "teaching_pace_changed",
      teachingMode: preference,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        pace: preference
      }
    })
    return [
      "I will make explanations a little more advanced and challenging.",
      "",
      `Teaching pace saved: ${preference}`,
      "You can change it any time with: teach easier or same level."
    ].join("\n")
  }

  if (isEasierExampleCommand(cleanQuestion)) {
    const lastQuestion = getLastQuestion(phone)
    if (!lastQuestion) {
      return "Ask one study question first, then I can give you an easier example on the same topic."
    }

    trackInteraction({
      phone,
      eventName: "easier_example_requested",
      subject: refineSubject(detectSubject(lastQuestion), lastQuestion),
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        sourceQuestion: lastQuestion
      }
    })

    return generateReply(
      `Give one easier worked example similar to this topic. Keep it very simple and step by step: ${lastQuestion}`,
      phone,
      { ...runtimeOptions, preferInteractive: false, internalShortcut: true }
    )
  }

  if (isDailyTipCommand(cleanQuestion)) {
    const tips = [
      "Use the Feynman Technique: try explaining a concept in simple words as if teaching a 5-year-old. If you cannot explain it simply, you do not understand it well enough.",
      "Practice active recall: after studying a topic, close your book and write down everything you remember. This is 3x more effective than re-reading.",
      "Use spaced repetition: review new material after 1 day, 3 days, 7 days, and 21 days. This moves knowledge from short-term to long-term memory.",
      "Solve problems before checking answers. Struggling with a problem builds stronger neural connections than reading the solution.",
      "Teach what you learn to someone else. Teaching forces you to organize your knowledge and exposes gaps in your understanding.",
      "Take 5-minute breaks every 25 minutes (Pomodoro Technique). Your brain consolidates learning during rest periods.",
      "Write formulas on sticky notes and place them where you see them daily. Repetition builds automatic recall.",
      "Before an exam, practice with previous year papers. This builds exam confidence and reveals question patterns.",
      "When solving math, always write the given information first. This clarifies what you know and what you need to find.",
      "Use mind maps to connect related topics. Visual learners remember better when information is organized spatially."
    ]
    const todayTip = tips[new Date().getDate() % tips.length]
    return [
      "*Study Tip of the Day*",
      "",
      todayTip,
      "",
      "Want to learn? Just ask any study question!"
    ].join("\n")
  }

  if (isStudyStatsCommand(cleanQuestion)) {
    const user_data = (() => { try { const { get: dbGet } = require("./utils/sqliteStore"); return dbGet("SELECT * FROM users WHERE phone = ?", phone) } catch { return null } })()
    return [
      "*Your Study Stats*",
      "",
      `Name: ${user.name || "Student"}`,
      `Level: ${user.level || user.class || "Not set"}`,
      `Board: ${user.board || "Not set"}`,
      `Language: ${user.language || "English"}`,
      `Subjects: ${user.subjectInterests?.join(", ") || "All subjects"}`,
      `Teaching Pace: ${user.teachingPacePreference || "auto"}`,
      "",
      "*Quick Commands:*",
      "- 'quiz topic' for practice quiz",
      "- 'mock test topic' for exam test",
      "- 'progress' for detailed progress",
      "- 'daily tip' for a study tip"
    ].join("\n")
  }

    if (isQuickTestCommand(cleanQuestion)) {
    const lastQuestion = getLastQuestion(phone)
    if (!lastQuestion) {
      return "Ask one study question first, then I can give you a quick test on the same topic."
    }

    trackInteraction({
      phone,
      eventName: "quick_test_requested",
      subject: refineSubject(detectSubject(lastQuestion), lastQuestion),
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        sourceQuestion: lastQuestion
      }
    })

    return startAdaptiveQuiz(phone, user, lastQuestion, runtimeOptions)
  }

  if (isQuickPickSubjectCommand(cleanQuestion)) {
    const pickedSubject = String(cleanQuestion.split("::")[1] || "").trim()
    if (!pickedSubject) {
      return "Please choose a valid subject."
    }

    const savedSubjects = saveSubjectInterests(phone, [pickedSubject])
    user.subjectInterests = savedSubjects
    trackInteraction({
      phone,
      eventName: "subject_focus_updated",
      subject: pickedSubject,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        subjectCount: savedSubjects.length
      }
    })
    return [
      `Saved focus subject: ${pickedSubject}`,
      "",
      "I will now prioritize this subject more in your study flow.",
      "Use 'change subjects' if you want to save multiple subjects."
    ].join("\n")
  }

  if (isLeaderboardCommand(cleanQuestion)) {
    const leaderboardData = getWeeklyLeaderboard(10).map(row => ({
      phone: row.phone,
      name: null,
      coins: Number(row.total_coins || 0)
    }))
    // Enrich with user names
    const allUsers = loadUsers()
    for (const entry of leaderboardData) {
      const u = allUsers[entry.phone]
      if (u) entry.name = u.name
    }
    return buildLeaderboardMessage(leaderboardData)
  }

  if (isFormulaCommand(rawQuestion)) {
    const subject = refineSubject(detectSubject(rawQuestion), rawQuestion)
    await recordStudyQuestion(phone, { subject, topic: subject, question: rawQuestion })
    await awardActivity(phone, "study_question")
    if (findFormulaEntry(rawQuestion, user)) {
      return buildFormulaResponse(rawQuestion, user)
    }

    return generateResearchNotes(phone, user, rawQuestion, subject, {
      noteMode: "library_fallback",
      answerMode: "standard"
    })
  }

  if (isNcertCommand(rawQuestion)) {
    const subject = refineSubject(detectSubject(rawQuestion), rawQuestion)
    await recordStudyQuestion(phone, { subject, topic: subject, question: rawQuestion })
    await awardActivity(phone, "study_question")
    if (findNcertEntry(rawQuestion, user)) {
      return buildNcertResponse(rawQuestion, user)
    }

    if (needsExactNcertTopic(rawQuestion)) {
      return [
        "I do not have that exact NCERT chapter card yet.",
        "",
        "Please send the chapter name too so I can help properly.",
        "Example: ncert class 8 history how when and where",
        "Example: ncert class 10 science light reflection and refraction"
      ].join("\n")
    }

    return generateResearchNotes(phone, user, rawQuestion, subject, {
      noteMode: "library_fallback",
      answerMode: "standard"
    })
  }

  if (isPyqCommand(rawQuestion)) {
    const subject = refineSubject(detectSubject(rawQuestion), rawQuestion)
    await recordStudyQuestion(phone, { subject, topic: subject, question: rawQuestion })
    await awardActivity(phone, "study_question")
    if (findPyqEntry(rawQuestion, user)) {
      return buildPyqResponse(rawQuestion, user)
    }

    return generateResearchNotes(phone, user, rawQuestion, subject, {
      noteMode: "library_fallback",
      answerMode: "standard"
    })
  }

  if (isResearchNotesCommand(rawQuestion)) {
    const requestedTopic = extractResearchTopic(rawQuestion)
    const topic = requestedTopic || rawQuestion
    const subject = refineSubject(detectSubject(topic), topic)
    await recordStudyQuestion(phone, { subject, topic, question: rawQuestion })
    await awardActivity(phone, "study_question")
    return generateResearchNotes(phone, user, topic, subject, {
      noteMode: "notes",
      answerMode: "standard"
    })
  }

  if (isChallengeCommand(cleanQuestion)) {
    return "Daily challenge has been removed. Use quiz <topic> for practice questions, or ask me any study doubt directly."
  }

  if (isRevisionCommand(cleanQuestion)) {
    const dueReviews = getDueReviewsForUser(phone)
    if (dueReviews.length === 0) {
      return "You have no revision topics due right now. Keep going with your daily mission and quiz practice."
    }

    return [
      "*Revision Due*",
      "",
      ...dueReviews.slice(0, 5).map((item, index) => `${index + 1}. ${item.topic} (${item.subject})`),
      "",
      "Quick actions:",
      `- quiz ${dueReviews[0].topic}`,
      `- Explain ${dueReviews[0].topic} in simple language`
    ].join("\n")
  }

  if (isMissionCommand(cleanQuestion)) {
    const mission = await getOrCreateDailyMission(phone, user)
    return buildMissionMessage(mission, user)
  }

  if (isParentReportCommand(cleanQuestion)) {
    const report = fm.buildDecorativeParentReport(phone, user)
    await saveParentReport(phone, report, {
      sentAutomatically: false,
      studentName: user.name || "Student"
    })
    return report
  }

  // === NEW FEATURE COMMAND HANDLERS ===

  if (isMilestonesCommand(cleanQuestion)) {
    return fm.buildMilestonesListMessage(phone)
  }

  if (isSetParentCommand(cleanQuestion)) {
    const parentNum = cleanQuestion.replace("set parent", "").trim()
    if (fm.saveParentPhone(phone, parentNum)) {
      return [
        "\u2705 *Parent Number Saved!*",
        "",
        "Weekly progress reports will now be sent to your parent every Sunday.",
        "",
        "The report includes:",
        "\U0001f4ca Study activity & scores",
        "\U0001f4c8 Subject-wise progress",
        "\U0001f4aa Strengths & areas to improve",
        "\U0001f3c6 Achievements & milestones",
        "",
        "Update anytime: send 'set parent <number>'",
        "Remove: send 'remove parent'"
      ].join("\n")
    }
    return "Invalid number. Please send: set parent <10-digit number>"
  }

  if (isRemoveParentCommand(cleanQuestion)) {
    fm.saveParentPhone(phone, "")
    return "\u2705 Parent number removed. Weekly reports will no longer be sent to parent."
  }

  if (isParentPhoneCommand(cleanQuestion)) {
    return fm.buildParentPhoneMessage(phone)
  }

  if (isExamCountdownCommand(cleanQuestion)) {
    const setExam = fm.handleSetExamCommand(cleanQuestion)
    if (setExam) {
      fm.saveExamCountdown(phone, setExam.examName, setExam.examDate, setExam.subject)
      const days = Math.max(0, Math.ceil((new Date(setExam.examDate) - Date.now()) / 86400000))
      return [
        "\u2705 *Exam Added!*",
        "",
        "\U0001f4dd " + setExam.examName + (setExam.subject ? " (" + setExam.subject + ")" : ""),
        "\U0001f4c5 Date: " + setExam.examDate,
        "\u23f3 " + days + " day" + (days !== 1 ? "s" : "") + " remaining",
        "",
        "You will see a countdown in your daily morning message!",
        "View all: send 'my exams'",
        "Remove: send 'remove exam <name>'"
      ].join("\n")
    }
    if (isRemoveExamCommand(cleanQuestion)) {
      const examName = fm.handleRemoveExamCommand(cleanQuestion)
      if (examName) {
        fm.deleteExamCountdown(phone, examName)
        return '\u2705 Exam "' + examName + '" removed.'
      }
    }
    return fm.buildExamCountdownMessage(phone)
  }

  if (isBookmarksCommand(cleanQuestion)) {
    return fm.buildBookmarksMessage(phone)
  }

  const viewBmIdx = isViewBookmarkCommand(cleanQuestion)
  if (viewBmIdx !== null) {
    return fm.buildViewBookmarkMessage(phone, viewBmIdx)
  }

  const deleteBmIdx = isDeleteBookmarkCommand(cleanQuestion)
  if (deleteBmIdx !== null) {
    fm.deleteBookmark(phone, deleteBmIdx)
    return "\U0001f5d1\ufe0f Bookmark deleted. Type 'my bookmarks' to see remaining."
  }

  if (isBookmarkThisCommand(cleanQuestion)) {
    const lastQ = getLastQuestion(phone)
    if (!lastQ) return "Ask a question first, then type 'bookmark' to save the answer."
    const history = getConversationContext(phone)
    if (history && history.length >= 2) {
      const lastAnswer = history[history.length - 1]?.answer || ""
      fm.bookmarkAnswer(phone, lastQ, lastAnswer, refineSubject(detectSubject(lastQ), lastQ), "")
      return "\U0001f4cc *Answer bookmarked!*\n\nType 'my bookmarks' to view all saved answers."
    }
    return "Ask a question first, then type 'bookmark' to save it."
  }

  if (isFormatCommand(cleanQuestion)) {
    const format = cleanQuestion.includes("simple") ? "simple" : cleanQuestion.includes("detailed") ? "detailed" : cleanQuestion.includes("exam") ? "exam" : null
    if (format) {
      fm.saveFormatPreference(phone, format)
      const labels = { simple: "Simple (concise)", detailed: "Detailed (step-by-step)", exam: "Exam Style" }
      return "\u2705 Answer format set to *" + labels[format] + "*!\n\nAll future answers will follow this style.\nChange anytime with: format simple/detailed/exam"
    }
    const currentFormat = fm.getFormatPreference(phone)
    return fm.buildFormatMessage(phone, currentFormat)
  }

  if (isShareCommand(cleanQuestion)) {
    return fm.buildEnhancedShareMessage(phone, user)
  }

  if (isFlashcardCommand(cleanQuestion)) {
    const topic = cleanQuestion.replace(/^flashcards?\s+/i, "").trim()
    if (!topic || topic.length < 3) {
      return [
        "\U0001f0cf *Flashcard Mode*",
        "",
        "Test your knowledge with quick revision cards!",
        "",
        "*How to use:*",
        "flashcards photosynthesis",
        "flashcards quadratic equations",
        "flashcards newton laws",
        "",
        "Cards will be shown one by one with answers."
      ].join("\n")
    }
    try {
      const flashPrompt = fm.buildFlashcardGenerationPrompt(topic, user)
      const cardsRaw = await askOpenClawJson(flashPrompt, {
        answerMode: "concise",
        taskType: "flashcard_generation",
        phone,
        subject: refineSubject(detectSubject(topic), topic),
        questionText: topic,
        user
      })
      const cards = Array.isArray(cardsRaw) ? cardsRaw : (Array.isArray(cardsRaw.cards) ? cardsRaw.cards : [])
      if (cards.length < 2) {
        return "Could not generate enough flashcards for that topic. Try a more specific topic like 'flashcards photosynthesis light reaction'."
      }
      fm.saveFlashcardSession(phone, refineSubject(detectSubject(topic), topic), topic, cards)
      return fm.buildFlashcardMessage(fm.getFlashcardSession(phone))
    } catch (err) {
      console.error("[Flashcard] Generation error:", err.message)
      return "Failed to generate flashcards. Please try again with a specific topic."
    }
  }

  if (isShowAnswerCommand(cleanQuestion)) {
    const session = fm.getFlashcardSession(phone)
    if (session) return fm.buildFlashcardAnswerMessage(session)
    return "No active flashcard session. Type 'flashcards <topic>' to start."
  }

  if (isNextCardCommand(cleanQuestion) || isSkipCardCommand(cleanQuestion)) {
    const result = fm.advanceFlashcard(phone)
    if (!result) return "No active flashcard session."
    if (result.completed) return fm.buildFlashcardCompleteMessage(result.session.totalCards)
    return fm.buildFlashcardMessage(result.session)
  }

  if (isEndFlashcardsCommand(cleanQuestion) || isStopFlashcardCommand(cleanQuestion)) {
    const session = fm.getFlashcardSession(phone)
    fm.clearFlashcardSession(phone)
    if (session) return fm.buildFlashcardCompleteMessage(session.totalCards)
    return "No active flashcard session."
  }

  if (isRestartFlashcardsCommand(cleanQuestion)) {
    const session = fm.getFlashcardSession(phone)
    if (session) {
      session.currentIndex = 0
      fm.saveFlashcardSession(phone, session.subject, session.topic, session.cards)
      return fm.buildFlashcardMessage(session)
    }
    return "No active flashcard session to restart."
  }

  if (isFeedbackButton(cleanQuestion)) {
    let rating = 0
    if (cleanQuestion === "fb_good" || cleanQuestion === "helpful") rating = 1
    else if (cleanQuestion === "fb_okay") rating = 2
    else if (cleanQuestion === "fb_bad" || cleanQuestion === "not helpful") rating = 3
    if (rating > 0) {
      const lastQ = getLastQuestion(phone)
      fm.saveFeedback(phone, lastQ, rating)
      return fm.buildFeedbackThankYou(rating)
    }
  }

  // === ADVANCED FEATURE COMMAND HANDLERS ===

  if (isAdminAnalyticsCommand(cleanQuestion) && isAdminPhone(phone)) {
    return af.buildEnhancedAdminDashboard()
  }

  if (isTimerCommand(cleanQuestion)) {
    const match = String(cleanQuestion || "").trim().match(/^timer\s+(\d+)$/)
    const mins = match ? Math.min(Math.max(Number(match[1]), 5), 120) : 25
    af.startStudyTimer(phone, mins)
    return af.buildTimerMessage(phone, mins)
  }

  if (isTimerStopCommand(cleanQuestion)) {
    af.startStudyTimer(phone, 0)
    return "\u23f0 Study timer stopped! You can start a new one anytime with: timer 25"
  }

  if (isVacationCommand(cleanQuestion)) {
    const match = String(cleanQuestion || "").trim().match(/^vacation\s+(\d+)$/)
    const days = match ? Math.min(Math.max(Number(match[1]), 1), 30) : 3
    af.activateVacationMode(phone, days)
    return af.buildVacationMessage(phone)
  }

  if (isEndVacationCommand(cleanQuestion)) {
    af.deactivateVacationMode(phone)
    return "Welcome back! Your streak is safe now. Let's continue studying!"
  }

  if (isLanguageCommand(cleanQuestion)) {
    if (cleanQuestion === "hindi mode") { af.setAnswerLanguage(phone, "hindi"); return "\u2705 Answers will now be in *Hindi*!\n\nType 'english mode' to switch back."; }
    if (cleanQuestion === "english mode") { af.setAnswerLanguage(phone, "english"); return "\u2705 Answers will now be in *English*!\n\nType 'hindi mode' to switch."; }
    return af.buildLanguageToggleMessage()
  }

  if (isDailyChallengeCommand(cleanQuestion)) {
    const challenge = af.getTodayChallenge()
    return af.buildChallengeShareMessage(challenge)
  }

  if (isShareChallengeCommand(cleanQuestion)) {
    const challenge = af.getTodayChallenge()
    const shareText = "\U0001f3af *Daily Study Challenge*\n\n" + (challenge.question || "Solve: What is the derivative of x^3 + 2x?") + "\n\nTry AI Study Bot - Your WhatsApp AI Tutor!"
    return ["Share this with friends:", "", shareText, "", "Forward this message to challenge your friends!"].join("\n")
  }

  if (isFollowUpCommand(cleanQuestion)) {
    const lastQ = getLastQuestion(phone)
    if (!lastQ) return "Ask a question first, then I'll suggest related ones!"
    try {
      const suggestions = await af.generateFollowUpSuggestions(phone, lastQ, "")
      return af.buildFollowUpResponse(phone, suggestions)
    } catch (e) { return "Ask another question and I'll suggest related topics!" }
  }

  if (isVoiceHelpCommand(cleanQuestion)) {
    return af.buildVoiceSupportMessage()
  }

  // === SMART TEACHER FEATURE COMMANDS ===

  if (stf.isExplainModesCommand(cleanQuestion)) {
    return stf.buildExplainModesMessage()
  }

  if (stf.isDailyConceptCommand(cleanQuestion)) {
    return stf.buildDailyConceptMessage()
  }

  if (stf.isWeakTopicsCommand(cleanQuestion)) {
    return stf.buildWeakTopicsMessage(phone)
  }

  if (stf.isMyNotesCommand(cleanQuestion)) {
    return stf.buildSavedNotesList(phone)
  }

  if (stf.isViewNoteCommand(cleanQuestion)) {
    const noteId = stf.parseViewNoteCommand(cleanQuestion)
    if (!noteId) return "Usage: view note 1. Type 'my notes' to see your saved notes."
    const note = stf.getSavedNoteContent(phone, noteId)
    if (!note) return "Note not found. Type 'my notes' to see your saved notes."
    return stf.buildNoteContentMessage(note)
  }

  if (stf.isDeleteNoteCommand(cleanQuestion)) {
    const noteId = stf.parseDeleteNoteCommand(cleanQuestion)
    if (!noteId) return "Usage: delete note 1"
    stf.deleteSavedNote(phone, noteId)
    return "\u2705 Note deleted! Type 'my notes' to see remaining notes."
  }

  if (cleanQuestion === "revision" || cleanQuestion === "exam revision" || cleanQuestion === "quick revision") {
    return stf.buildRevisionWelcome()
  }

  if (cleanQuestion === "step by step" || cleanQuestion === "solve step") {
    return stf.buildStepWelcome("<your problem>", "General") + "\n\nPlease type: 'solve step by step 2x + 5 = 15'"
  }

  if (cleanQuestion === "analogy") {
    return "Tell me what concept you want an analogy for!\n\nExample: 'analogy photosynthesis'"
  }

  if (cleanQuestion === "debate") {
    return "*\u2696\ufe0f Debate Mode*\n\nChoose a topic: 'debate homework should be banned'\nI'll argue the opposite!"
  }

  if (cleanQuestion === "teach me" || cleanQuestion === "teach me about") {
    return "What concept?\n\nExample: 'teach me photosynthesis'\nExample: 'teach me newton's laws'"
  }

  if (stf.isSaveNoteCommand(cleanQuestion)) {
    const lastQ = getLastQuestion(phone)
    const ctx = getConversationContext(phone, 1)
    const lastAnswer = ctx && ctx[0] && ctx[0].answer ? ctx[0].answer : null
    if (!lastQ || !lastAnswer) return "Ask a question first, then type 'save note'!"
    const pr = stf.parseSaveNoteCommand(cleanQuestion)
    const title = pr && pr.title ? pr.title : lastQ.slice(0, 50)
    const subject = refineSubject(detectSubject(lastQ), lastQ) || "General"
    stf.saveRevisionNote(phone, title, subject, lastAnswer)
    return "\u2705 *Note Saved!*\nTitle: " + title + "\nSubject: " + subject + "\n\nType 'my notes' to view all notes."
  }

  if (isStudyPlanCommand(cleanQuestion)) {
    const plan = await getOrCreateStudyPlan(phone, user)
    return buildStudyPlanMessage(plan, user)
  }

  if (isNewStudyPlanCommand(cleanQuestion)) {
    const plan = await regenerateStudyPlan(phone, user)
    return buildStudyPlanMessage(plan, user)
  }

  if (isNewMissionCommand(cleanQuestion)) {
    const mission = await regenerateDailyMission(phone, user)
    return buildMissionMessage(mission, user)
  }

  if (isCompleteMissionCommand(cleanQuestion)) {
    const existingMission = getMissionState(phone)
    const mission = await completeDailyMission(phone)
    const shouldAwardMission = existingMission?.dateKey === getDateKey() && existingMission?.status !== "completed"
    const rewardSummary = shouldAwardMission ? await awardActivity(phone, "mission_complete") : null
    return appendRewardSummary(buildMissionMessage(mission, user), rewardSummary)
  }

  if (isProgressCommand(cleanQuestion)) {
    return [
      buildProgressMessage(phone, user),
      "",
      buildMissionSummaryLine(phone),
      buildChallengeSummaryLine(phone),
      buildReviewSummaryLine(phone),
      buildMockTestSummaryLine(phone),
      buildStudyPlanSummaryLine(phone),
      buildStreakSummaryLine(phone),
      "Use 'parent report' for a family-friendly summary."
    ].join("\n")
  }

  if (isEditProfileCommand(cleanQuestion)) {
    const onboardingPrompt = await startOnboarding(phone, user, { forceRestart: true })
    return `Let us update your profile.\n\n${onboardingPrompt}`
  }

  if (isChangeLanguageCommand(cleanQuestion)) {
    const onboardingPrompt = await startOnboarding(phone, user, { startAtKey: "language", mode: "profile" })
    return `Let us update your preferred language.\n\n${onboardingPrompt}`
  }

  if (isChangeClassCommand(cleanQuestion)) {
    const onboardingPrompt = await startOnboarding(phone, user, { startAtKey: "level", mode: "profile" })
    return `Let us update your class or level.\n\n${onboardingPrompt}`
  }

  if (isChangeBoardCommand(cleanQuestion)) {
    const onboardingPrompt = await startOnboarding(phone, user, { startAtKey: "board", mode: "profile" })
    return `Let us update your board, university, or exam track.\n\n${onboardingPrompt}`
  }

  if (isChangeSubjectsCommand(cleanQuestion)) {
    const onboardingPrompt = await startOnboarding(phone, user, { startAtKey: "subjectInterests", mode: "profile" })
    return `Let us update your preferred subjects.\n\n${onboardingPrompt}`
  }

  if (isDeleteProfileCommand(cleanQuestion)) {
    return startDeleteProfile(phone, user)
  }

  if (isStopHomeworkCommand(cleanQuestion)) {
    await clearHomeworkSession(phone)
    return "Homework coach stopped. Send homework <question> whenever you want guided hints again."
  }

  if (isStopAnswerReviewCommand(cleanQuestion)) {
    await clearAnswerReviewSession(phone)
    return "Answer review stopped. Send 'check answer' whenever you want me to review another written answer."
  }

  if (isCheckAnswerCommand(cleanQuestion)) {
    return startAnswerReview(phone)
  }

  if (isStopQuizCommand(cleanQuestion)) {
    await clearQuizSession(phone)
    return "Your quiz has been stopped. Send quiz <topic> whenever you want to practice again."
  }

  if (isStopMockTestCommand(cleanQuestion)) {
    await clearMockTestSession(phone)
    return "Your mock test has been stopped. Send mock test <topic> whenever you want to begin again."
  }

  if (directHomeworkProblem) {
    return startHomeworkCoach(phone, user, directHomeworkProblem, runtimeOptions)
  }

  if (rawQuestion && /^(\/)?report\b/i.test(rawQuestion.trim())) {
    const success = await premiumUpgrades.generateParentReportPdf(phone, user);
    return success ? null : "Sorry, could not generate the parent report right now. Please try again later.";
  }

  if (rawQuestion && /^(\/)?podcast\s/i.test(rawQuestion.trim())) {
    const topic = rawQuestion.trim().replace(/^(\/)?podcast\s/i, "").trim();
    if (!topic) return "Please specify a topic for the podcast! Example: `/podcast Newton's Laws`";
    const success = await premiumUpgrades.generateAudioPodcast(phone, user, topic);
    return success ? null : "Sorry, could not generate the podcast right now. Please try again later.";
  }

  if (rawQuestion && /^(\/)?flashcards?\s/i.test(rawQuestion.trim())) {
    const topic = rawQuestion.trim().replace(/^(\/)?flashcards?\s/i, "").trim()
    return premiumUpgrades.startFlashcardsSession(phone, user, topic)
  }

  if (rawQuestion && /^mock\s*test/i.test(rawQuestion.trim())) {
    return startMockTest(phone, user, directMockTestTopic, runtimeOptions)
  }

  if (directQuizTopic) {
    return startAdaptiveQuiz(phone, user, directQuizTopic, runtimeOptions)
  }

  if (isHelpCommand(cleanQuestion)) {
    trackInteraction({
      phone,
      eventName: "help_viewed",
      teachingMode: user.teachingPacePreference || "auto",
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        interactive: Boolean(runtimeOptions.preferInteractive)
      }
    })
    return buildHelpMessage(user)
  }

  if (activeAnswerReviewSession) {
    return handleAnswerReviewReply(phone, user, rawQuestion, activeAnswerReviewSession)
  }

  if (activeHomeworkSession) {
    return handleHomeworkReply(phone, user, rawQuestion, activeHomeworkSession, runtimeOptions)
  }

  if (activeMockTestSession) {
    if (looksLikeFreshQuestion(rawQuestion) && !looksLikeChoiceReply(rawQuestion)) {
      await clearMockTestSession(phone)
      activeMockTestSession = null
    } else {
    return handleMockTestReply(phone, user, rawQuestion, activeMockTestSession, runtimeOptions)
    }
  }

  if (activeFlashcardsSession) {
    if (looksLikeFreshQuestion(rawQuestion) && !looksLikeChoiceReply(rawQuestion) && rawQuestion.toLowerCase() !== "stop" && rawQuestion.toLowerCase() !== "/flashcards stop") {
      premiumUpgrades.clearFlashcardsSession(phone)
      activeFlashcardsSession = null
    } else {
      return premiumUpgrades.handleFlashcardsReply(phone, user, rawQuestion, activeFlashcardsSession)
    }
  }

  if (activeQuizSession) {
    if (looksLikeFreshQuestion(rawQuestion) && !looksLikeChoiceReply(rawQuestion)) {
      await clearQuizSession(phone)
      activeQuizSession = null
    } else {
    return handleQuizReply(phone, user, rawQuestion, activeQuizSession, runtimeOptions)
    }
  }


  // === NEW SMART FEATURES HANDLERS ===

  // -- Answer Evaluator --
    // Check speed math session
  var _activeMath = speedMath.getActiveSession(phone)
  var _activeQuiz = conceptQuiz.getActiveQuiz(phone)
  if (_activeQuiz && /^\d+$/.test(cleanQuestion.trim())) {
    return conceptQuiz.submitAnswer(phone, cleanQuestion.trim())
  }
  if (_activeMath) {
    return speedMath.checkAnswer(phone, cleanQuestion.trim())
  }

  // Check GK quiz session
  try {
    var _gkResult = currentAffairsQuiz.checkQuizAnswer(phone, cleanQuestion.trim())
    if (_gkResult) return _gkResult
  } catch(_gkErr) {}

var _evSess = aiAnswerEvaluator.getEvalSession(phone)
  if (isEvaluateCommand(cleanQuestion) && !_evSess) {
    var _evP = parseEvaluateCommand(cleanQuestion);
    if (_evP && _evP.type === "combined") {
      var _evPrompt = aiAnswerEvaluator.buildEvaluationPrompt(_evP.question, _evP.answer, (user&&user.subjects)||"", (user&&user.level)||"intermediate");
      try {
        var _evAI = await askOpenClaw(_evPrompt, {answerMode:'standard',taskType:'teaching',phone,subject:(user&&user.subjects)||'General',questionText:_evP.question,user});
        var _evM = String(_evAI||'').match(/\{[\s\S]*\}/); var _evR = _evM?JSON.parse(_evM[0]):{};
        if (_evR && _evR.score !== undefined) {
          require("./utils/sqliteStore").run("INSERT INTO answer_evaluations (phone,question,student_answer,score,max_score,accuracy,completeness,structure,clarity,feedback,model_answer,subject) VALUES (?,?,?,?,10,?,?,?,?,?,?,?)", phone,_evP.question,_evP.answer,_evR.score,_evR.accuracy||0,_evR.completeness||0,_evR.structure||0,_evR.clarity||0,JSON.stringify({strengths:_evR.strengths||[],weaknesses:_evR.weaknesses||[],improvements:_evR.improvements||[]}),_evR.model_answer||"",(user&&user.subjects)||"General");
          return aiAnswerEvaluator.formatEvaluationResult(_evR, _evP.question);
        }
      } catch(_e){console.error("[Evaluator]",_e.message)}
      return "Could not evaluate. Try again.";
    } else if (_evP && _evP.type === "direct") {
      var _lq = getLastQuestion(phone);
      if (_lq) { aiAnswerEvaluator.setEvalSession(phone,_lq,(user&&user.subjects)||"",detectSubject(_lq)); return "Evaluating your answer..."; }
  try { dailyStudyReport.logStudyActivity(phone, (user&&user.subjects)||"", rawQuestion); } catch(_logErr) {}
      return 'Ask a question first, then type *evaluate my answer: <your answer>*';
    }
  }
  if (_evSess && !isEvaluateCommand(cleanQuestion)) {
    var _evP2 = aiAnswerEvaluator.buildEvaluationPrompt(_evSess.question, rawQuestion, _evSess.subject||"", (user&&user.level)||"intermediate");
    try {
      var _evA2 = await askOpenClaw(_evP2, {answerMode:'standard',taskType:'teaching',phone,subject:_evSess.subject||'General',questionText:_evSess.question,user});
      var _evM2 = String(_evA2||'').match(/\{[\s\S]*\}/); var _evR2 = _evM2?JSON.parse(_evM2[0]):{};
      if (_evR2 && _evR2.score !== undefined) {
        require("./utils/sqliteStore").run("INSERT INTO answer_evaluations (phone,question,student_answer,score,max_score,accuracy,completeness,structure,clarity,feedback,model_answer,subject,topic) VALUES (?,?,?,?,10,?,?,?,?,?,?,?,?)", phone,_evSess.question,rawQuestion,_evR2.score,_evR2.accuracy||0,_evR2.completeness||0,_evR2.structure||0,_evR2.clarity||0,JSON.stringify({strengths:_evR2.strengths||[],weaknesses:_evR2.weaknesses||[],improvements:_evR2.improvements||[]}),_evR2.model_answer||"",_evSess.subject||"General",_evSess.topic||"");
        aiAnswerEvaluator.clearEvalSession(phone);
        try{srsFlashcards.addSRSCard(phone,_evSess.question.substring(0,40),_evSess.subject,_evSess.question.substring(0,80),_evR2.model_answer)}catch(se){}
        return aiAnswerEvaluator.formatEvaluationResult(_evR2, _evSess.question);
      }
    } catch(_e2){console.error("[Evaluator]",_e2.message)}
    aiAnswerEvaluator.clearEvalSession(phone);
  }

  // -- Reverse Quiz --
  var _rqSess = reverseQuiz.getReverseQuizSession(phone);
  if (isTestMeCommand(cleanQuestion) && (!_rqSess || reverseQuiz.isSessionExpired(_rqSess))) {
    reverseQuiz.clearReverseQuizSession(phone);
    var _rqTopic = parseTestMeCommand(cleanQuestion);
    var _rqSubj = (user&&user.subjects)||"General";
    var _rqDiff = (user&&user.level)==="advanced"?"hard":(user&&user.level)==="beginner"?"easy":"medium";
    var _rqP = reverseQuiz.buildQuizQuestionsPrompt(_rqTopic, _rqSubj, _rqDiff, 5);
    try {
      var _rqAI = await askOpenClaw(_rqP, {answerMode:'standard',taskType:'teaching',phone,subject:_rqSubj,questionText:_rqTopic,user});
      var _rqM = String(_rqAI||'').match(/\[[\s\S]*\]/); var _rqQs = _rqM?JSON.parse(_rqM[0]):[];
      if (!Array.isArray(_rqQs)||_rqQs.length===0) _rqQs=[{type:"short",question:"Explain "+_rqTopic,answer:_rqTopic,explanation:"Basic",hint:"Definition"}];
      var _rqS = {topic:_rqTopic,subject:_rqSubj,difficulty:_rqDiff,currentQuestionNum:0,totalQuestions:_rqQs.length,correctCount:0,questions:_rqQs,score:0,streak:0,bestStreak:0,created_at:new Date().toISOString()};
      reverseQuiz.saveReverseQuizSession(phone,_rqS);
      return reverseQuiz.formatQuizQuestion(_rqS,_rqQs[0]);
    } catch(_e){console.error("[RQ]",_e.message)}
    return "Could not start quiz.";
  }
  if (_rqSess && !reverseQuiz.isSessionExpired(_rqSess)) {
    if (cleanQuestion==="stop quiz"||cleanQuestion==="end quiz") { var _rqRes=reverseQuiz.formatQuizResults(_rqSess); reverseQuiz.clearReverseQuizSession(phone); return _rqRes; }
    var _rqCQ = _rqSess.questions[_rqSess.currentQuestionNum];
    var _rqOK = reverseQuiz.checkAnswer(rawQuestion,_rqCQ&&_rqCQ.answer,_rqCQ&&_rqCQ.type);
    if (_rqOK){_rqSess.correctCount++;_rqSess.score+=2;_rqSess.streak++;if(_rqSess.streak>_rqSess.bestStreak)_rqSess.bestStreak=_rqSess.streak;}else{_rqSess.streak=0;}
    _rqSess.currentQuestionNum++;
    if (_rqSess.currentQuestionNum>=_rqSess.totalQuestions) {
      var _rqFin=reverseQuiz.formatQuizResults(_rqSess);
      try{require("./utils/sqliteStore").run("INSERT INTO reverse_quiz_history (phone,topic,subject,score,total,accuracy) VALUES (?,?,?,?,?,?)",phone,_rqSess.topic,_rqSess.subject,_rqSess.score,_rqSess.totalQuestions,_rqSess.totalQuestions>0?Math.round((_rqSess.correctCount/_rqSess.totalQuestions)*100):0);}catch(hre){}
      reverseQuiz.clearReverseQuizSession(phone);
      return _rqFin+(_rqOK?"":"\n*Correct:* "+(_rqCQ&&_rqCQ.answer));
    }
    reverseQuiz.saveReverseQuizSession(phone,_rqSess);
    var _rqMsg=_rqOK?"*Correct!*\n\n":"*Not quite!* Correct:"+(_rqCQ&&_rqCQ.answer)+"\n\n";
    _rqMsg+=reverseQuiz.formatQuizQuestion(_rqSess,_rqSess.questions[_rqSess.currentQuestionNum]);
    return _rqMsg;
  }

  // -- Concept Map --
  if (isConceptMapCommand(cleanQuestion)) {
    var _cmT=parseConceptMapCommand(cleanQuestion),_cmS=(user&&user.subjects)||"General";
    var _cmC=conceptMapGen.getCachedMap(_cmT);
    if (_cmC) return conceptMapGen.formatConceptMap(_cmC);
    try {
      var _cmAI=await askOpenClaw(conceptMapGen.buildConceptMapPrompt(_cmT,_cmS,(user&&user.level)||"intermediate"),{answerMode:'standard',taskType:'teaching',phone,subject:_cmS,questionText:_cmT,user});
      var _cmM=String(_cmAI||'').match(/\{[\s\S]*\}/);var _cmD=_cmM?JSON.parse(_cmM[0]):{};
      if(_cmD&&_cmD.branches){conceptMapGen.cacheMap(_cmT,_cmS,_cmD);return conceptMapGen.formatConceptMap(_cmD);}
    }catch(_e){console.error("[CM]",_e.message)}
    return "Could not generate concept map.";
  }

  // -- Concept Comparator --
  if (isCompareCommand(cleanQuestion)) {
    var _ccP=parseCompareCommand(cleanQuestion);
    var _ccC=conceptComparator.getCachedComparison(_ccP.conceptA,_ccP.conceptB);
    if(_ccC)return conceptComparator.formatComparison(_ccC);
    try {
      var _ccAI=await askOpenClaw(conceptComparator.buildComparePrompt(_ccP.conceptA,_ccP.conceptB,(user&&user.subjects)||"General"),{answerMode:'standard',taskType:'teaching',phone,subject:(user&&user.subjects)||'General',questionText:_ccP.conceptA+" vs "+_ccP.conceptB,user});
      var _ccM=String(_ccAI||'').match(/\{[\s\S]*\}/);var _ccD=_ccM?JSON.parse(_ccM[0]):{};
      if(_ccD&&_ccD.comparison_table){conceptComparator.cacheComparison(_ccP.conceptA,_ccP.conceptB,(user&&user.subjects)||"General",_ccD);return conceptComparator.formatComparison(_ccD);}
    }catch(_e){console.error("[CC]",_e.message)}
    return "Could not generate comparison.";
  }

  // -- Study Goal --
  if (isStudyGoalCommand(cleanQuestion)) {
    var _sgT=parseStudyGoalCommand(cleanQuestion);
    var _sgHM=_sgT.match(/(\d+(?:\.\d+)?)\s*hours?/i)||_sgT.match(/(\d+)\s*hrs?/i);var _sgMM=_sgT.match(/(\d+)\s*minutes?/i);
    var _sgMin=120;if(_sgHM)_sgMin=Math.round(parseFloat(_sgHM[1])*60);else if(_sgMM)_sgMin=parseInt(_sgMM[1]);
    studyGoalTracker.setStudyGoal(phone,_sgMin,5);
    return "*Study Goal Set!*\n\nDaily: *"+Math.floor(_sgMin/60)+"h"+(_sgMin%60>0?" "+_sgMin%60+"m":"")+"*\nType *my study stats* to track progress!";
  }
  if (isStudyProgressCommand(cleanQuestion)) return studyGoalTracker.formatProgressMessage(phone);

  // -- Quick Revision --
  if (isQuickRevisionCommand(cleanQuestion)) {
    var _qrT=parseQuickRevisionCommand(cleanQuestion),_qrS=(user&&user.subjects)||"General";
    var _qrC=quickRevision.getCachedRevision(_qrT);
    if(_qrC)return quickRevision.formatQuickRevision(_qrC);
    try {
      var _qrAI=await askOpenClaw(quickRevision.buildQuickRevisionPrompt(_qrT,_qrS,(user&&user.level)||"intermediate"),{answerMode:'standard',taskType:'teaching',phone,subject:_qrS,questionText:_qrT,user});
      var _qrM=String(_qrAI||'').match(/\{[\s\S]*\}/);var _qrD=_qrM?JSON.parse(_qrM[0]):{};
      if(_qrD&&_qrD.key_concepts){quickRevision.cacheRevision(_qrT,_qrS,_qrD);return quickRevision.formatQuickRevision(_qrD);}
    }catch(_e){console.error("[QR]",_e.message)}
    return "Could not generate revision notes.";
  }

  // -- SRS Flashcards --
  var _srsS=srsFlashcards.getSRSSession(phone);
  if (isSRSCommand(cleanQuestion)) {
    var _srsP=parseSRSCommand(cleanQuestion);
    if(_srsP&&(cleanQuestion.includes("stats")||cleanQuestion.includes("progress")||cleanQuestion==="my srs"))return srsFlashcards.buildSRSStatusMessage(phone);
    var _srsDue=srsFlashcards.getDueCards(phone,_srsP?_srsP.topic:"");
    if(!_srsDue||_srsDue.length===0){var _st=srsFlashcards.getSRSTotalStats(phone);if(_st.total_cards===0)return srsFlashcards.buildSRSStatusMessage(phone);return "*All caught up!* Cards: "+_st.total_cards+" Mastered: "+_st.mastered;}
    var _srsNew={topic:(_srsP?_srsP.topic:"")||"Mixed",dueCards:_srsDue,currentIndex:0,totalDue:_srsDue.length,correct:0,incorrect:0};
    srsFlashcards.saveSRSSession(phone,_srsNew);
    return srsFlashcards.buildSRSCardMessage(_srsNew,_srsDue[0]);
  }
  if (_srsS) {
    if(isStopSRSCommand(cleanQuestion)||cleanQuestion==="stop srs"){var _srsR=srsFlashcards.buildSRSResultsMessage(_srsS);srsFlashcards.recordSRSDailyStats(phone,_srsS.correct,_srsS.correct+_srsS.incorrect);srsFlashcards.clearSRSSession(phone);return _srsR;}
    var _srsCur=_srsS.dueCards[_srsS.currentIndex];
    if(isSRSShowCommand(cleanQuestion))return srsFlashcards.buildSRSAnswerMessage(_srsCur);
    if(isSRSRatingCommand(cleanQuestion)){
      var _rm={again:0,hard:1,good:2,easy:3};var _q=_rm.hasOwnProperty(cleanQuestion)?_rm[cleanQuestion]:2;
      srsFlashcards.updateSRSCard(_srsCur.id,_q);if(_q>=2)_srsS.correct++;else _srsS.incorrect++;_srsS.currentIndex++;
      if(_srsS.currentIndex>=_srsS.totalDue){var _srF=srsFlashcards.buildSRSResultsMessage(_srsS);srsFlashcards.recordSRSDailyStats(phone,_srsS.correct,_srsS.correct+_srsS.incorrect);srsFlashcards.clearSRSSession(phone);return _srF;}
      srsFlashcards.saveSRSSession(phone,_srsS);
      return (_q===3?"Easy!":_q===2?"Good!":_q===1?"Keep practicing!":"Review again soon")+"\n\n"+srsFlashcards.buildSRSCardMessage(_srsS,_srsS.dueCards[_srsS.currentIndex]);
    }
  }

  // === END NEW FEATURES ===

  // === SMART TEACHER: Active Session Handlers ===

  // Active debate session
  const activeDebate = stf.getActiveDebate(phone)
  if (activeDebate && activeDebate.stage !== 'completed') {
    if (stf.isEndDebateCommand(cleanQuestion)) {
      const exchanges = stf.getActiveDebate(phone)
      const history = exchanges ? exchanges.exchanges || [] : []
      const judgmentPrompt = stf.buildDebateJudgmentPrompt(activeDebate.topic, activeDebate.student_position, history, user)
      try {
        const judgment = await askOpenClaw(judgmentPrompt, { answerMode: 'standard', taskType: 'teaching', phone, subject: 'General', questionText: 'debate judgment', user })
        const scoreMatch = (judgment || '').match(/(\d+)\s*(?:\/|out of)\s*10/)
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 7
        stf.endDebate(phone, score)
        return stf.buildDebateScoreMessage(judgment || "Good debate!", score)
      } catch (e) {
        stf.endDebate(phone, 7)
        return "Great debate! Thanks for participating. Type 'debate <topic>' for another one!"
      }
    }
    const exchanges = stf.addDebateExchange(phone, 'student', rawQuestion)
    const debatePrompt = stf.buildDebateResponsePrompt(
      activeDebate.topic, activeDebate.student_position, activeDebate.bot_position,
      rawQuestion, exchanges || [], user
    )
    try {
      const botReply = await askOpenClaw(debatePrompt, { answerMode: 'standard', taskType: 'teaching', phone, subject: 'General', questionText: activeDebate.topic, user })
      stf.addDebateExchange(phone, 'bot', botReply || '')
      return botReply || "Interesting point! What else supports your argument?"
    } catch (e) {
      return "That's a good argument! Can you provide more evidence to support your position?"
    }
  }

  // Active step-by-step session
  const activeStepSession = stf.getActiveStepSession(phone)
  if (activeStepSession) {
    if (stf.isStopSessionCommand(cleanQuestion)) {
      stf.completeStepSession(phone)
      return "Step-by-step session ended. Try 'solve step by step <problem>' anytime!"
    }
    if (cleanQuestion === "hint") {
      const steps = activeStepSession.steps || []
      const currentStep = steps[activeStepSession.current_step]
      if (currentStep) return "\U0001f4a1 *Hint:* " + (currentStep.hint || "Think about the formula or method that applies here.")
      return "No hint available. Type 'next' to continue."
    }
    if (cleanQuestion === "skip") {
      const steps = activeStepSession.steps || []
      const currentStep = steps[activeStepSession.current_step]
      if (currentStep) {
        stf.recordStepAnswer(phone, activeStepSession.current_step, "[skipped]")
        if (activeStepSession.current_step + 1 >= (steps.length || 0)) {
          stf.completeStepSession(phone)
          return stf.buildStepCompleteMessage(currentStep.expectedAnswer || "Problem solved!")
        }
        stf.recordStepAnswer(phone, activeStepSession.current_step + 1, "")
        const nextStep = steps[activeStepSession.current_step + 1]
        if (nextStep) return stf.buildStepQuestionMessage({ ...nextStep, stepNumber: activeStepSession.current_step + 2 }, steps.length)
      }
      return "Session ended."
    }
    // Regular answer submission
    const steps = activeStepSession.steps || []
    const currentStep = steps[activeStepSession.current_step]
    if (currentStep) {
      stf.recordStepAnswer(phone, activeStepSession.current_step, rawQuestion)
      const expected = String(currentStep.expectedAnswer || "").toLowerCase().replace(/[^a-z0-9]/g, '')
      const given = rawQuestion.toLowerCase().replace(/[^a-z0-9]/g, '')
      const isCorrect = expected && (expected === given || given.includes(expected) || expected.includes(given))
      if (isCorrect || cleanQuestion === "next") {
        if (activeStepSession.current_step + 1 >= steps.length) {
          stf.completeStepSession(phone)
          return (isCorrect ? "\u2705 Correct!\n\n" : "") + stf.buildStepCompleteMessage(currentStep.expectedAnswer || steps[steps.length - 1]?.expectedAnswer || "Complete!")
        }
        const nextStep = steps[activeStepSession.current_step + 1]
        if (nextStep) return stf.buildStepQuestionMessage({ ...nextStep, stepNumber: activeStepSession.current_step + 2 }, steps.length)
      }
      return stf.buildStepResultMessage(false, currentStep, rawQuestion)
    }
  }

  // Active "Teach Me" flow session
  const activeTeachFlow = stf.getActiveTeachFlow(phone)
  if (activeTeachFlow) {
    if (stf.isStopSessionCommand(cleanQuestion)) {
      stf.completeTeachFlow(phone)
      return "Lesson ended. Type 'teach me <concept>' to start a new one!"
    }
    const stage = activeTeachFlow.stage
    if (cleanQuestion === "next" || stage === 'intro') {
      if (stage === 'intro') {
        const introPrompt = stf.buildTeachFlowIntroPrompt(activeTeachFlow.concept, activeTeachFlow.subject, user)
        try {
          const introText = await askOpenClaw(introPrompt, { answerMode: 'standard', taskType: 'teaching', phone, subject: activeTeachFlow.subject, questionText: activeTeachFlow.concept, user })
          stf.updateTeachFlowStage(phone, 'deep', { introText })
          return introText || "Let's dive in! Type 'next' to continue."
        } catch (e) {
          stf.updateTeachFlowStage(phone, 'deep', { introText: 'Let us learn about ' + activeTeachFlow.concept })
          return "Let us learn about " + activeTeachFlow.concept + ". Type 'next' for the detailed explanation."
        }
      }
      if (stage === 'deep') {
        const ctx = activeTeachFlow.context || {}
        const deepPrompt = stf.buildTeachFlowDeepPrompt(activeTeachFlow.concept, activeTeachFlow.subject, ctx.introText || '', user)
        try {
          const deepText = await askOpenClaw(deepPrompt, { answerMode: 'detailed', taskType: 'teaching', phone, subject: activeTeachFlow.subject, questionText: activeTeachFlow.concept, user })
          stf.updateTeachFlowStage(phone, 'practice', { deepText })
          return deepText || "Good progress! Type 'next' for practice questions."
        } catch (e) { stf.updateTeachFlowStage(phone, 'practice', {}); return "Type 'next' for practice questions." }
      }
      if (stage === 'practice') {
        const ctx = activeTeachFlow.context || {}
        const practicePrompt = stf.buildTeachFlowPracticePrompt(activeTeachFlow.concept, activeTeachFlow.subject, ctx.deepText || '', user)
        try {
          const practiceText = await askOpenClaw(practicePrompt, { answerMode: 'standard', taskType: 'teaching', phone, subject: activeTeachFlow.subject, questionText: activeTeachFlow.concept, user })
          stf.updateTeachFlowStage(phone, 'summary', { practiceText })
          return practiceText || "Practice done! Type 'next' for the summary."
        } catch (e) { stf.updateTeachFlowStage(phone, 'summary', {}); return "Type 'next' for the summary." }
      }
      if (stage === 'summary') {
        const ctx = activeTeachFlow.context || {}
        const summaryPrompt = stf.buildTeachFlowSummaryPrompt(activeTeachFlow.concept, activeTeachFlow.subject, ctx.introText || '', ctx.deepText || '', ctx.practiceText || '', user)
        try {
          const summaryText = await askOpenClaw(summaryPrompt, { answerMode: 'standard', taskType: 'teaching', phone, subject: activeTeachFlow.subject, questionText: activeTeachFlow.concept, user })
          stf.completeTeachFlow(phone)
          return summaryText || "Lesson complete! Great job learning this concept."
        } catch (e) { stf.completeTeachFlow(phone); return "Lesson complete! Type 'teach me <concept>' for another lesson." }
      }
    }
  }

  // === SMART TEACHER: AI-Powered Command Handlers ===

  // Explain Like I'm 5 / Board Exam / Analogy / Advanced
  const explainCmd = stf.parseExplainCommand(rawQuestion)
  if (explainCmd && explainCmd.topic) {
    const prompt = stf.buildExplainLevelPrompt(explainCmd.topic, explainCmd.level, user)
    try {
      const result = await askOpenClawWithMeta(prompt, {
        answerMode: 'standard',
        taskType: 'teaching',
        phone,
        subject: refineSubject(detectSubject(explainCmd.topic), explainCmd.topic),
        questionText: explainCmd.topic,
        user
      })
      const config = stf.EXPLAIN_LEVELS[explainCmd.level]
      return (config ? config.emoji + " *" + config.label + "*\n\n" : "") + (result?.text || "Could not generate explanation. Try again!")
    } catch (e) {
      return "Sorry, I could not generate that explanation. Please try again!"
    }
  }

  // Analogy command
  if (stf.isAnalogyCommand(rawQuestion) && rawQuestion.toLowerCase() !== "analogy") {
    const topic = rawQuestion.replace(/^analogy\s+/i, '').trim() || rawQuestion.replace(/^explain with analogy\s+/i, '').trim()
    if (topic) {
      const prompt = stf.buildAnalogyPrompt(topic, user)
      try {
        const result = await askOpenClawWithMeta(prompt, {
          answerMode: 'standard', taskType: 'teaching', phone,
          subject: refineSubject(detectSubject(topic), topic), questionText: topic, user
        })
        return "\U0001f30d *Real-World Analogy*\n\n" + (result?.text || "Could not generate analogy. Try again!")
      } catch (e) { return "Sorry, could not create an analogy. Try again!" }
    }
  }

  // Start debate
  if (stf.isDebateCommand(rawQuestion)) {
    const topic = stf.parseDebateCommand(rawQuestion)
    if (topic) {
      stf.startDebate(phone, topic, "Student supports this topic")
      return stf.buildDebateWelcome(topic, "Student supports this topic")
    }
  }

  // Teach me
  if (stf.isTeachMeCommand(rawQuestion)) {
    const concept = stf.parseTeachMeCommand(rawQuestion)
    if (concept) {
      const subject = refineSubject(detectSubject(concept), concept) || "General"
      stf.startTeachFlow(phone, concept, subject)
      return stf.buildTeachFlowWelcome(concept, subject)
    }
  }

  // Step by step
  if (stf.isStepByStepCommand(rawQuestion) && rawQuestion.toLowerCase() !== "step by step") {
    const problem = stf.parseStepByStepCommand(rawQuestion)
    if (problem) {
      const subject = refineSubject(detectSubject(problem), problem) || "General"
      stf.startStepByStep(phone, problem, subject)
      try {
        const stepPrompt = stf.buildStepByStepInitPrompt(problem, subject, user)
        const stepData = await askOpenClawJson(stepPrompt, { answerMode: 'standard', taskType: 'teaching', phone, subject, questionText: problem, user })
        if (stepData && stepData.steps && stepData.steps.length > 0) {
          stf.saveSteps(phone, stepData.steps)
          const firstStep = { ...stepData.steps[0], stepNumber: 1 }
          return stf.buildStepWelcome(problem, subject) + "\n\n" + stf.buildStepQuestionMessage(firstStep, stepData.steps.length)
        }
        return stf.buildStepWelcome(problem, subject) + "\n\nCould not break down the problem. Please try rephrasing it."
      } catch (e) {
        return stf.buildStepWelcome(problem, subject) + "\n\nCould not process. Please try a specific math or science problem."
      }
    }
  }

  // Exam revision
  if (stf.isExamRevisionCommand(rawQuestion) && rawQuestion.toLowerCase() !== "revision") {
    const revisionData = stf.parseRevisionCommand(rawQuestion)
    if (revisionData) {
      const revPrompt = stf.buildExamRevisionPrompt(revisionData.subject, revisionData.topics || revisionData.subject, user)
      try {
        const result = await askOpenClawWithMeta(revPrompt, {
          answerMode: 'detailed', taskType: 'teaching', phone,
          subject: revisionData.subject, questionText: 'revision: ' + revisionData.subject, user
        })
        return "\U0001f4d6 *Quick Revision: " + revisionData.subject + "*\n\n" + (result?.text || "Could not generate revision. Try again!")
      } catch (e) { return "Sorry, could not generate revision notes. Try again!" }
    }
  }

// === BATCH 6: Flashcard System ===
  if (isFlashcardAddCommand(cleanQuestion)) {
    var cardData = parseFlashcardAdd(rawQuestion)
    if (!cardData) return "Format: *add card What is DNA? | Deoxyribonucleic acid carries genetic info*"
    var r = flashcardSystem.createFlashcard(phone, cardData.front, cardData.back, runtimeOptions._detectedSubject || "general")
    return r.error || r.message
  }

  if (isFlashcardReviewCommand(cleanQuestion)) {
    var r = flashcardSystem.startReview(phone, runtimeOptions._detectedSubject || "all")
    return r.message || r.error || "Could not start review"
  }

  if (isFlashcardStatsCommand(cleanQuestion)) {
    return flashcardSystem.getStats(phone)
  }

  if (flashcardSystem.isActiveSession(phone)) {
    if (isFlashcardShowCommand(cleanQuestion)) {
      var r = flashcardSystem.showAnswer(phone)
      return r.message || r.error
    }
    if (isFlashcardRateCommand(cleanQuestion)) {
      var r = flashcardSystem.rateCard(phone, cleanQuestion)
      return r.message
    }
    if (cleanQuestion === "skip") {
      var r = flashcardSystem.rateCard(phone, "again")
      return r.message
    }
    if (cleanQuestion === "stop" || (typeof isStopFlashcardCommand === "function" && isStopFlashcardCommand(cleanQuestion))) {
      var r = flashcardSystem.rateCard(phone, "good")
      return r.message || "Review ended."
    }
  }

  // === BATCH 6: Timetable Generator ===
  if (isTimetableGenerateCommand(cleanQuestion)) {
    var ttData = parseTimetableCommand(rawQuestion)
    if (!ttData || !ttData.subjects) return "Format: *generate timetable maths, science, english, 6*\n\nSubjects (comma separated) + optional hours"
    var r = timetableGenerator.generateTimeTable(phone, ttData.subjects, ttData.hours, ttData.days)
    return timetableGenerator.formatTimeTable(r)
  }

  if (isTimetableViewCommand(cleanQuestion)) {
    return timetableGenerator.getMyTimetable(phone)
  }

  // === BATCH 6: Mock Test ===
  if (isMockTestCommand(cleanQuestion) && !mockTestGenerator.isActiveTest(phone)) {
    var mockSubject = parseMockTestCommand(rawQuestion) || "general"
    var r = mockTestGenerator.generateMockTest(phone, mockSubject)
    return r.message || r.error
  }

  if (mockTestGenerator.isActiveTest(phone) && isNextQuestionCommand(cleanQuestion)) {
    var testInfo = mockTestGenerator.getTestStatus(phone)
    try {
      var mcqPrompt = "Generate a " + (testInfo ? testInfo.subject : "general knowledge") + " multiple choice question with 4 options (A,B,C,D). Format:\n\nQuestion: [text]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\n\nCorrect Answer: [A or B or C or D]\n\nMake it educational."
      var aiResult = await askOpenClawWithMeta(mcqPrompt, {answerMode:'standard', taskType:'practice', phone:phone, subject:testInfo?testInfo.subject:'general'})
      var aiText = typeof aiResult === 'string' ? aiResult : (aiResult.text || aiResult.message || '')
      var correctMatch = aiText.match(/correct\s*(?:answer|option)?\s*[:\-]?\s*([A-D])/i)
      // Store correct answer for this question
      if (correctMatch) {
        mockTestGenerator._lastCorrect = correctMatch[1].toUpperCase()
      }
      var qText = aiText.replace(/correct\s*(?:answer|option)?\s*[:\-]?\s*[A-D][\s\S]*/i, "").trim()
      return qText + "\n\nReply: A, B, C, or D"
    } catch(e) {
      return "Could not generate question. Try: *next question*"
    }
  }

  if (mockTestGenerator.isActiveTest(phone) && /^[A-Da-d]$/.test(cleanQuestion.trim())) {
    var answer = cleanQuestion.trim().toUpperCase()
    var correctLetter = mockTestGenerator._lastCorrect || "A"
    var isCorrect = answer === correctLetter
    var r = mockTestGenerator.recordAnswer(phone, answer, isCorrect)
    if (r.type === "finished") return r.message
    return (r.correct ? "\u2705 Correct! " : "\u274c Not quite! Answer was " + correctLetter + ". ") + "Question " + r.questionNum + "/" + r.total + "\n\nType *next question*"
  }

  if (isMockTestHistoryCommand(cleanQuestion)) {
    return mockTestGenerator.getTestHistory(phone)
  }

  // === BATCH 6: Quick Summary ===
  if (isSummaryCommand(cleanQuestion)) {
    var topic = parseSummaryCommand(rawQuestion)
    if (!topic) return "Format: *summary photosynthesis*\n\nI will generate a concise summary!"
    var r = quickSummary.generateSummary(phone, topic, runtimeOptions._detectedSubject)
    if (r.error) return r.error
    try {
      var summaryPrompt = "Provide a clear, concise summary of: " + topic + "\n\nInclude:\n1. Key definition (1-2 lines)\n2. Main points (3-5 bullets)\n3. Important formula if applicable\n4. Real-world application\n5. Exam tip\n\nKeep under 200 words."
      var aiResult = await askOpenClawWithMeta(summaryPrompt, {answerMode:'standard', taskType:'notes', phone:phone, subject:r.subject})
      var summaryText = typeof aiResult === 'string' ? aiResult : (aiResult.text || aiResult.message || 'Summary generated.')
      return quickSummary.formatSummary(r.topic, summaryText, r.subject)
    } catch(e) {
      return "Could not generate summary. Try: *teach me " + topic + "*"
    }
  }

  // === BATCH 6: Parent Report ===
  if (isLinkParentCommand(cleanQuestion)) {
    var parentNum = parseLinkParentCommand(rawQuestion)
    if (!parentNum) return "Format: *link parent +91XXXXXXXXXX*"
    var r = parentReportGen.linkParent(phone, parentNum)
    return r.error || r.message
  }

  if (isParentReportCommand(cleanQuestion)) {
    var report = parentReportGen.generateParentReport(phone, user.name || "Student")
    var msg = parentReportGen.formatParentReport(report)
    var parentContact = parentReportGen.getParentContact(phone)
    if (parentContact && parentContact.parent_phone) {
      try {
        await sendWhatsAppMessage(parentContact.parent_phone, msg)
        msg += "\n\n\u2705 Report sent to " + (parentContact.parent_name || "Parent")
      } catch(e) {
        msg += "\n\n\u26a0 Could not send to parent."
      }
    } else {
      msg += "\n\n\ud83d\udca1 Link a parent: *link parent +91XXX*"
    }
    return msg
  }

  if (isParentInfoCommand(cleanQuestion)) {
    return parentReportGen.getLinkedParentInfo(phone)
  }

  // === BATCH 6: Study Goal ===
  if (isStudyGoalSetCommand(cleanQuestion)) {
    var hours = parseStudyGoalCommand(rawQuestion)
    if (!hours) return "Format: *set goal 2 hours* (0.25 - 16 hours)"
    var r = studyGoalTracker.setGoal(phone, hours)
    if (r.error) return r.error
    return "\ud83c\udfaf Study goal set to " + hours + " hours/day!\n\nTrack: *study goal*"
  }

  if (isStudyGoalCommand(cleanQuestion)) {
    return studyGoalTracker.formatGoalStatus(phone)
  }

    // === PHASE 4: Socratic Session Check ===
  const socraticState = isSocraticSessionActive(phone)
  if (socraticState.active && !isHelpCommand(cleanQuestion)) {
    // Student is in a Socratic dialogue - route through Socratic engine
    const exchanges = getSocraticExchanges(phone)
    recordSocraticExchange(phone, 'student', rawQuestion)
    
    const socraticPrompt = buildSocraticPrompt(socraticState.session, rawQuestion, exchanges)
    const socraticResult = await askOpenClawWithMeta(socraticPrompt, {
      answerMode: 'standard',
      taskType: 'teaching',
      phone,
      subject: refineSubject(detectSubject(rawQuestion), rawQuestion),
      questionText: rawQuestion,
      user
    })
    
    let socraticReply = socraticResult?.text || 'Can you try explaining what you understand so far?'
    
    // Check if the Socratic dialogue should transition or complete
    const isShortPositive = /^(yes|yeah|yep|got it|correct|right|sure|ok|okay|now i get|makes sense now)/i.test(rawQuestion.trim())
    const isGiveUp = /^(just tell me|give answer|direct answer|skip|stop|end|enough|no idea|i don.t know)/i.test(rawQuestion.trim())
    
    if (isGiveUp || socraticState.session.attempts >= 5) {
      // Student is frustrated or max attempts reached - give the real answer
      clearSocraticSession(phone)
      const subject = refineSubject(detectSubject(rawQuestion), rawQuestion)
      const fullAnswerPrompt = buildPrompt(rawQuestion, user, subject, '', {
        answerMode: fm.getFormatPreference(phone) || (accessProfile.premium ? 'standard' : 'concise'),
        masteryContext: buildMasteryContext(phone, subject)
      })
      const fullResult = await askOpenClawWithMeta(fullAnswerPrompt, {
        answerMode: accessProfile.premium ? 'standard' : 'concise',
        taskType: 'teaching',
        phone,
        subject,
        questionText: rawQuestion,
        user
      })
      await addToHistory(phone, rawQuestion, fullResult?.text || socraticReply)
      recordTutorPromptUsage(phone)
      return ensurePocketTeacherFinish(formatReplyForWhatsApp(fullResult?.text || socraticReply, { subject, question: rawQuestion, user }), {
        answerMode: 'standard', subject, question: rawQuestion, user, teachingMode: 'guided', complexity: 'medium'
      })
    }
    
    if (isShortPositive) {
      // Student got it - confirm and maybe push further
      updateSocraticStage(phone, 'confirming')
    } else {
      updateSocraticStage(phone, 'guiding')
    }
    
    recordSocraticExchange(phone, 'tutor', socraticReply)
    await addToHistory(phone, rawQuestion, socraticReply)
    recordTutorPromptUsage(phone)
    return socraticReply
  }

  // New feature command handlers
  if (isSpeedMathCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "speed_math_start", channel: runtimeOptions.channel || "unknown" })
    const diff = (cleanQuestion.includes("hard") && "hard") || (cleanQuestion.includes("medium") && "medium") || "easy"
    return speedMath.startSpeedMath(phone, diff)
  }

  if (isGKQuizCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "gk_quiz_start", channel: runtimeOptions.channel || "unknown" })
    return currentAffairsQuiz.startQuiz(phone, "random")
  }

  if (isDailyReportCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "daily_report", channel: runtimeOptions.channel || "unknown" })
    return dailyStudyReport.generateDailyReport(phone, user.name || "Student")
  }

  if (isWeeklyReportCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "weekly_report", channel: runtimeOptions.channel || "unknown" })
    return dailyStudyReport.getWeeklyStats(phone).then(stats => dailyStudyReport.formatWeeklyStats(stats, user.name || "Student"))
  }

  if (isExamAddCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "exam_added", channel: runtimeOptions.channel || "unknown" })
    const parts = cleanQuestion.substring(9).trim().split(/ (.+)/)
    if (parts.length < 2) return "Usage: exam add <name> <DD-MM-YYYY>\n\nExample: exam add Maths Final 25-04-2026"
    const examName = parts[0].trim()
    const examDate = parts[1].trim()
    const dateMatch = examDate.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/)
    if (!dateMatch) return "Invalid date. Use DD-MM-YYYY"
    const yy = dateMatch[3].length === 2 ? "20" + dateMatch[3] : dateMatch[3]
    const formattedDate = yy + "-" + dateMatch[2].padStart(2, "0") + "-" + dateMatch[1].padStart(2, "0")
    examPlanner.addExam(phone, examName, formattedDate)
    return "Exam Added!\n\n" + examName + "\n" + formattedDate + "\n\nType 'my exams' to see countdown."
  }

  if (isExamListCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "exam_list", channel: runtimeOptions.channel || "unknown" })
    return examPlanner.getUpcomingExams(phone).then(exams => examPlanner.formatExamCountdown(exams))
  }

  if (isExamTipCommand(cleanQuestion)) {
    return "Tip: " + examPlanner.getRandomTip()
  }

  if (isStopQuizCommand(cleanQuestion)) {
    const mathResult = speedMath.endSession(phone)
    if (mathResult) return mathResult
    const gkResult = currentAffairsQuiz.endQuiz(phone)
    if (gkResult) return gkResult
    const existingQuiz = reverseQuiz.getReverseQuizSession(phone)
    if (existingQuiz) { reverseQuiz.clearReverseQuizSession(phone); return "Quiz ended!" }
  }

  if (isParentLinkCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "parent_link", channel: runtimeOptions.channel || "unknown" })
    const parts = cleanQuestion.substring(12).trim().split(/ (.+)/)
    if (parts.length < 2) return "Usage: link parent <parent WhatsApp number>\n\nExample: link parent +91 98765 43210\n\nYour parent will receive a weekly study report every Sunday."
    const parentPhone = parts[0].replace(/[^0-9+]/g, "")
    const parentName = parts[1] || "Parent"
    if (parentPhone.length < 10) return "Please enter a valid phone number with country code.\n\nExample: link parent +919876543210"
    parentReport.linkParent(phone, parentPhone, parentName)
    return "Parent connected! \n\n" + parentName + " will receive a weekly study report every Sunday.\n\nType *parent status* to check."
  }

  if (isParentUnlinkCommand(cleanQuestion)) {
    parentReport.unlinkParent(phone)
    return "Parent report unlinked. Your parent will no longer receive weekly reports."
  }

  if (isParentStatusCommand(cleanQuestion)) {
    const info = parentReport.getLinkedParentInfo(phone)
    return info || "No parent connected. Type *link parent <number>* to connect."
  }

  if (isFindBuddyCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "find_buddy", channel: runtimeOptions.channel || "unknown" })
    const buddies = studyBuddy.findBuddies(phone, user.subjects, user.level)
    return studyBuddy.formatBuddyList(buddies)
  }

  if (isMyBuddyCommand(cleanQuestion)) {
    const profile = studyBuddy.getMyProfile(phone)
    return studyBuddy.formatMyProfile(profile)
  }

  if (isRemoveBuddyCommand(cleanQuestion)) {
    studyBuddy.removeBuddy(phone)
    return "You have been removed from the study buddy search."
  }

  if (quickRevisionCards.isRevisionCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "revision_start", channel: runtimeOptions.channel || "unknown" })
    const subject = quickRevisionCards.getSubjectFromCommand(cleanQuestion)
    if (!subject) {
      return "Choose a subject: revision math / revision science / revision english / revision history"
    }
    return quickRevisionCards.startRevision(phone, subject)
  }

  if (isFlipCardCommand(cleanQuestion)) {
    const result = quickRevisionCards.flipCard(phone)
    if (result) return result
  }

  if (isNextCardCommand(cleanQuestion)) {
    const result = quickRevisionCards.nextCard(phone)
    if (result) return result
  }

  if (isDoneRevisionCommand(cleanQuestion)) {
    const result = quickRevisionCards.endRevision(phone)
    if (result) return result
  }

    if (isMotivationalCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "motivation", channel: runtimeOptions.channel || "unknown" })
    return motivationalQuotes.getQuoteOfTheDay()
  }

  if (isFactCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "fact", channel: runtimeOptions.channel || "unknown" })
    if (cleanQuestion.includes("of the day")) return factOfTheDay.getFactOfTheDayMessage()
    return factOfTheDay.getRandomFactMessage()
  }

  if (isWordOfDayCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "vocab_daily", channel: runtimeOptions.channel || "unknown" })
    return vocabularyBuilder.getWordOfTheDayMessage()
  }

  if (isVocabQuizCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "vocab_quiz", channel: runtimeOptions.channel || "unknown" })

  // PYQ Finder
  if (isPYQCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "pyq_request", channel: runtimeOptions.channel || "unknown" })
    var parts = cleanQuestion.trim().toLowerCase().split(/\s+/)
    var pyqSubject = parts.filter(function(p) { return ["pyq", "!pyq", "papers", "questions", "previous", "year"].indexOf(p) === -1; }).join(" ")
    if (!pyqSubject || pyqSubject.trim() === "") {
      return "📚 *PYQ Papers Finder*\n\nAvailable subjects:\n" + pyqFinder.getPYQSubjects().map(function(s) { return "• " + s; }).join("\n") + "\n\nUsage: *pyq <subject>*\nExample: pyq maths"
    }
    var pyqResult = pyqFinder.findPYQs(pyqSubject, null, null)
    if (!pyqResult) return "No PYQ papers found for that subject. Try: " + pyqFinder.getPYQSubjects().join(", ")
    return pyqFinder.formatPYQs(pyqResult)
  }

  // Syllabus Tracker
  if (isSyllabusCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "syllabus_check", channel: runtimeOptions.channel || "unknown" })
    var sylParts = cleanQuestion.trim().toLowerCase().split(/\s+/)
    if (sylParts[0] === "syllabus" && sylParts[1] === "add" && sylParts[2] && sylParts[3]) {
      var sylSubject = sylParts[2]
      var sylTopic = sylParts.slice(3).join(" ")
      var sylAdded = syllabusTracker.addTopic(phone, sylSubject, sylTopic)
      return sylAdded ? "✅ Added \"" + sylTopic + "\" to " + sylSubject + "\n\nView: *syllabus " + sylSubject + "*" : "Topic already exists in " + sylSubject + "."
    }
    if (sylParts[0] === "syllabus" && sylParts[1] === "done" && sylParts[2] && sylParts[3]) {
      var sylDoneSubject = sylParts[2]
      var sylIdx = parseInt(sylParts[3]) - 1
      var sylDone = syllabusTracker.markComplete(phone, sylDoneSubject, sylIdx)
      return sylDone ? "✅ Topic marked as complete!\n\nView: *syllabus " + sylDoneSubject + "*" : "Could not find that topic. Check: *syllabus " + sylDoneSubject + "*"
    }
    if (sylParts[0] === "syllabus" && sylParts[1] && ["add", "done"].indexOf(sylParts[1]) === -1) {
      var sylStatus = syllabusTracker.formatSyllabusStatus(phone, sylParts[1])
      return sylStatus || "No syllabus for " + sylParts[1] + ". Add topics: *syllabus add " + sylParts[1] + " <topic>*"
    }
    return syllabusTracker.formatAllSubjects(phone)
  }

  // Doubt Clearing
  if (isDoubtCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "doubt_session", channel: runtimeOptions.channel || "unknown" })
    var doubtParts = cleanQuestion.trim().split(/\s+/)
    var doubtTopic = doubtParts.filter(function(p) { return ["ask", "doubt", "clear"].indexOf(p.toLowerCase()) === -1; }).join(" ").trim()
    if (!doubtTopic) {
      var existingDoubt = doubtClearing.getSession(phone)
      if (existingDoubt) {
        return "You have an active doubt session about *" + existingDoubt.topic + "*\n\nType your question or *end doubt* to exit."
      }
      return "📚 *Doubt Clearing Session*\n\nTell me what you're confused about!\n\nUsage: *ask doubt <topic>*\nExample: ask doubt quadratic equations"
    }
    var doubtSession = doubtClearing.startDoubtSession(phone, doubtTopic)
    var doubtGuidance = doubtClearing.getDoubtStepGuidance(doubtSession)
    return doubtGuidance.message + "\n\nType *end doubt* to close this session."
  }

  // End Doubt
  if (isEndDoubtCommand(cleanQuestion)) {
    var doubtResult = doubtClearing.endSession(phone)
    if (doubtResult) {
      return "✅ Doubt session ended.\n\nTopic: " + doubtResult.topic + "\nQuestions discussed: " + doubtResult.questionsCount + "\n\nStart new: *ask doubt <topic>*"
    }
    return "No active doubt session. Start one: *ask doubt <topic>*"
  }

  // Practice Questions
  if (isPracticeCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "practice_request", channel: runtimeOptions.channel || "unknown" })
    var prParts = cleanQuestion.trim().toLowerCase().split(/\s+/)
    var prSubject = prParts.filter(function(p) { return ["practice", "!practice"].indexOf(p) === -1; }).join(" ").trim()
    if (!prSubject) {
      return "📝 *Practice Generator*\n\nAvailable subjects:\n" + practiceGenerator.getPracticeSubjects().map(function(s) { return "• " + s; }).join("\n") + "\n\nUsage: *practice <subject>*\nExample: practice maths"
    }
    var prQuestions = practiceGenerator.generatePracticeQuestions(prSubject, 5, "mixed")
    if (!prQuestions) return "No practice questions for that subject. Try: " + practiceGenerator.getPracticeSubjects().join(", ")
    return practiceGenerator.formatPracticeQuestions(prQuestions)
  }

  // Concept Quiz
  if (isConceptQuizCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "concept_quiz", channel: runtimeOptions.channel || "unknown" })
    var cqTopic = cleanQuestion.replace(/^concept quiz\s*/i, "").trim()
    if (!cqTopic) {
      return "🧠 *Concept Quiz*\n\nAvailable topics:\n" + conceptQuiz.getAvailableTopics().map(function(t) { return "• " + t; }).join("\n") + "\n\nUsage: *concept quiz <topic>*\nExample: concept quiz photosynthesis"
    }
    var cqResult = conceptQuiz.startQuiz(phone, cqTopic)
    if (!cqResult) return "Quiz not found for that topic. Try: " + conceptQuiz.getAvailableTopics().join(", ")
    return cqResult
  }

  // Study Analytics
  if (isAnalyticsCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "analytics", channel: runtimeOptions.channel || "unknown" })
    return studyAnalytics.formatAnalytics(phone)
  }

  // -- BATCH 4: AI STUDY NOTES GENERATOR --
  if (isAINotesCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "ai_notes", channel: runtimeOptions.channel || "unknown" })
    var notesTopic = cleanQuestion.replace(/^notes?\s+ai\s*/i, "").replace(/^ai\s+notes?\s*/i, "").trim()
    if (!notesTopic) {
      return "📝 *AI Study Notes Generator*\n\nGenerate comprehensive study notes for any topic!\n\nUsage: *notes ai <topic>*\nExamples:\n• notes ai photosynthesis\n• notes ai quadratic equations\n• notes ai world war 2\n• notes ai newton laws of motion"
    }
    var notesPrompt = aiNotesGenerator.buildNotesPrompt(notesTopic, user.level || "intermediate")
    var notesResult = await callAI(notesPrompt, phone)
    return aiNotesGenerator.parseNotesResponse(notesTopic, notesResult)
  }

  // -- BATCH 4: MNEMONIC MAKER --
  if (isMnemonicCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "mnemonic", channel: runtimeOptions.channel || "unknown" })
    var mnemTopic = cleanQuestion.replace(/^mnemonics?\s*/i, "").trim()
    if (!mnemTopic) {
      return "🧠 *Mnemonic Maker*\n\nCreate memory aids for any topic!\n\nUsage: *mnemonic <topic>*\n\nExamples:\n• mnemonic planets\n• mnemonic trigonometry\n• mnemonic mitosis\n• mnemonic periodic table"
    }
    var quickMnem = mnemonicMaker.getQuickMnemonic(mnemTopic)
    if (quickMnem) return quickMnem
    var mnemPrompt = mnemonicMaker.buildMnemonicPrompt(mnemTopic)
    var mnemResult = await callAI(mnemPrompt, phone)
    return mnemonicMaker.parseMnemonicResponse(mnemTopic, mnemResult)
  }

  // -- BATCH 4: COMPARE CONCEPTS --
  if (isCompareCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "compare", channel: runtimeOptions.channel || "unknown" })
    var compareInput = cleanQuestion.replace(/^compare\s*/i, "").replace(/^difference\s+between\s*/i, "").trim()
    var concepts = compareConcepts.extractConcepts(compareInput)
    if (!concepts) {
      return "⚖️ *Compare Concepts*\n\nCompare any two concepts side-by-side!\n\nUsage: *compare <A> vs <B>*\nExamples:\n• compare mitosis vs meiosis\n• compare dna vs rna\n• compare acid vs base\n• compare plant cell vs animal cell"
    }
    var quickComp = compareConcepts.getQuickComparison(concepts.conceptA, concepts.conceptB)
    if (quickComp) return quickComp
    var compPrompt = compareConcepts.buildComparisonPrompt(concepts.conceptA, concepts.conceptB)
    var compResult = await callAI(compPrompt, phone)
    return compareConcepts.parseComparisonResponse(compResult)
  }

  // -- BATCH 4: STUDY REMINDERS --
  if (isRemindCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "set_reminder", channel: runtimeOptions.channel || "unknown" })
    var remindInput = cleanQuestion.replace(/^(remind|reminder|set\s+reminder)\s*(me\s*)?(to\s+)?/i, "").trim()
    var timeTopicMatch = remindInput.match(/^(.+?)\s+to\s+study\s+(.+)$/i)
    var remindTime, remindTopic
    if (timeTopicMatch) {
      remindTime = timeTopicMatch[1].trim()
      remindTopic = timeTopicMatch[2].trim()
    } else {
      var rParts = remindInput.split(/\s+/)
      remindTime = rParts.slice(0, 2).join(" ")
      remindTopic = rParts.slice(2).join(" ")
    }
    if (!remindTopic) {
      return "⏰ *Study Reminder*\n\nSet reminders for your study sessions!\n\nUsage: *remind <time> to study <topic>*\nExamples:\n• remind in 30 minutes to study maths\n• remind at 8pm to study physics\n• remind tomorrow 9am to study chemistry\n\nView: *my reminders*\nCancel: *cancel reminder <number>*"
    }
    var remindResult = studyReminder.addReminder(phone, remindTime, remindTopic)
    if (remindResult) {
      return "✅ *Reminder Set!*\n\n📚 Topic: *" + remindTopic + "*\n⏰ Time: " + remindResult.time + "\n📅 " + remindResult.relativeTime + "\n\nView all: *my reminders*"
    }
    return "❌ Could not parse the time. Try:\n• remind in 30 minutes to study maths\n• remind at 8pm to study physics"
  }

  if (isCancelReminderCommand(cleanQuestion)) {
    var cancelIdx = parseInt(cleanQuestion.replace(/^cancel\s+reminder\s*/i, "").trim()) - 1
    if (isNaN(cancelIdx)) return "Usage: *cancel reminder <number>*\nFirst check: *my reminders*"
    var reminders = studyReminder.getActiveReminders(phone)
    if (reminders && reminders[cancelIdx]) {
      studyReminder.deleteReminder(phone, reminders[cancelIdx].id)
      return "✅ Reminder cancelled.\n\nView: *my reminders*"
    }
    return "❌ Reminder not found. Check: *my reminders*"
  }

  if (isClearRemindersCommand(cleanQuestion)) {
    studyReminder.clearAllReminders(phone)
    return "✅ All reminders cleared."
  }

  if (isMyRemindersCommand(cleanQuestion)) {
    return studyReminder.formatReminderList(phone)
  }

  // -- BATCH 4: ACHIEVEMENT SYSTEM --
  if (isMyBadgesCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "view_badges", channel: runtimeOptions.channel || "unknown" })
    return achievementSystem.formatAchievements(phone)
  }

  // -- BATCH 4: CHALLENGE LEADERBOARD --
  if (isChallengeLeaderboardCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "challenge_leaderboard", channel: runtimeOptions.channel || "unknown" })
    return enhancedDailyChallenge.formatLeaderboard()
  }

  // -- BATCH 5: FORMULA QUICK REFERENCE --
  if (isFormulaCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "formula_ref", channel: runtimeOptions.channel || "unknown" })
    var formulaSubject = cleanQuestion.replace(/^(formulas?\s*(sheet)?)\s*/i, "").trim()
    if (!formulaSubject) {
      return "📐 *Formula Quick Reference*\n\nAvailable subjects:\n" + formulaQuickRef.getSubjects().map(function(s) { return "• " + s; }).join("\n") + "\n\nUsage: *formulas maths* / *formulas physics*"
    }
    var formulaResult = formulaQuickRef.formatFormulas(formulaSubject)
    return formulaResult || "No formulas for that subject. Try: " + formulaQuickRef.getSubjects().join(", ")
  }

  // -- BATCH 5: STUDY GOAL TRACKER --
  if (isSetGoalCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "set_goal", channel: runtimeOptions.channel || "unknown" })
    var goalVal = cleanQuestion.replace(/^set\s+goal\s*/i, "").replace(/^study\s+goal\s*/i, "").trim()
    var goalNum = parseFloat(goalVal.replace(/\s*(hours?|hrs?|h)\s*/i, ""))
    if (isNaN(goalNum) || goalNum <= 0) {
      return "🎯 *Set Study Goal*\n\nUsage: *set goal 2 hours*\nExample: *set goal 3 hrs*\n\nTrack progress: *study progress*"
    }
    var goalResult = studyGoalTracker.setGoal(phone, goalNum)
    if (goalResult.error) return "❌ " + goalResult.error
    return "✅ *Study Goal Set!*\n\n🎯 Target: " + goalNum + " hour" + (goalNum !== 1 ? "s" : "") + " per day\n\nTrack: *study progress*"
  }

  if (isStudyProgressCommand(cleanQuestion)) {
    return studyGoalTracker.formatGoalStatus(phone)
  }

  // -- BATCH 5: ENHANCED REVISION CARDS --
  if (isReviseCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "revision_cards", channel: runtimeOptions.channel || "unknown" })
    var revSubject = cleanQuestion.replace(/^revise\s*/i, "").replace(/^revision\s*(cards?)?\s*/i, "").trim()
    if (!revSubject) {
      return revisionCardsEnhanced.formatSubjectList()
    }
    var revResult = revisionCardsEnhanced.startRevision(phone, revSubject)
    if (!revResult) return "No revision cards for that subject. Try: " + revisionCardsEnhanced.getSubjects().join(", ")
    return revResult
  }

  if (isFlipRevisionCommand(cleanQuestion)) {
    var flipResult = revisionCardsEnhanced.flipCard(phone)
    return flipResult || "No active revision session. Start with: *revise <subject>*"
  }

  if (isNextRevisionCommand(cleanQuestion) && revisionCardsEnhanced.getActiveSession(phone)) {
    var nextResult = revisionCardsEnhanced.nextCard(phone)
    return nextResult || "No active revision session."
  }

  if (isDoneRevisionCommand(cleanQuestion)) {
    revisionCardsEnhanced.endRevision(phone)
    return "📚 *Revision Ended!*\n\nGreat work! Start a new session: *revise <subject>*"
  }

  // -- BATCH 5: COLLABORATIVE CLASSROOM --
  if (isCreateClassCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "create_class", channel: runtimeOptions.channel || "unknown" })
    var className = cleanQuestion.replace(/^create\s+class(room)?\s*/i, "").trim()
    if (!className) {
      return collaborativeClassroom.formatCreateInfo()
    }
    var classResult = collaborativeClassroom.createClassroom(phone, className)
    if (classResult.error) return "❌ " + classResult.error
    return "🏫 *Classroom Created!*\n\nName: *" + className + "*\nCode: *" + classResult.code + "*\n\nShare this code with friends:\n*join class " + classResult.code + "*\n\nView: *my class*"
  }

  if (isJoinClassCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "join_class", channel: runtimeOptions.channel || "unknown" })
    var joinCode = cleanQuestion.replace(/^(join\s+)?class(room)?\s*/i, "").trim()
    if (!joinCode) return "Usage: *join class <code>*\nExample: *join class ABC123*"
    var joinResult = collaborativeClassroom.joinClassroom(phone, joinCode)
    if (!joinResult.success) return "❌ " + joinResult.error
    return "✅ *Joined Classroom!*\n\nName: *" + joinResult.name + "*\nMembers: " + joinResult.members + "\n\nView: *my class*"
  }

  if (isLeaveClassCommand(cleanQuestion)) {
    var leaveResult = collaborativeClassroom.leaveClassroom(phone)
    if (!leaveResult.success) return "❌ " + (leaveResult.error || "Could not leave")
    return "👋 Left the classroom."
  }

  if (isMyClassCommand(cleanQuestion)) {
    return collaborativeClassroom.formatClassroomStatus(phone)
  }

  // -- BATCH 5: DAILY STUDY TIPS --
  if (isStudyTipCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "study_tip", channel: runtimeOptions.channel || "unknown" })
    if (cleanQuestion === "tips") {
      return dailyTips.formatCategories()
    }
    if (cleanQuestion.indexOf("tips ") === 0) {
      var tipCat = cleanQuestion.replace(/^tips\s+/i, "").trim()
      var tipObj = dailyTips.getTipByCategory(tipCat)
      return dailyTips.formatTip(tipObj)
    }
    if (cleanQuestion === "tip of the day" || cleanQuestion === "daily tip") {
      return dailyTips.formatTip(dailyTips.getTipOfTheDay())
    }
    return dailyTips.formatTip(dailyTips.getRandomTip())
  }

  // -- BATCH 5: EXAM COUNTDOWN --
  if (isExamAddCountdownCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "exam_countdown_add", channel: runtimeOptions.channel || "unknown" })
    var examParts = cleanQuestion.replace(/^exam\s+add\s*/i, "").trim().split(/\s+/)
    var examName = examParts.shift()
    var examDateStr = examParts.join(" ")
    if (!examName || !examDateStr) {
      return "📅 *Add Exam Countdown*\n\nUsage: *exam add <name> <date>*\n\nExamples:\n• exam add Maths Final 15-05-2026\n• exam add Science Test in 10 days\n• exam add English Exam tomorrow\n\nView: *exam countdown*"
    }
    var examAddResult = examCountdown.addExam(phone, examName, null, examDateStr)
    if (examAddResult.error) return "❌ " + examAddResult.error
    return "✅ *Exam Added!*\n\n📝 " + examName + "\n📅 " + new Date(examAddResult.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) + "\n\nView all: *exam countdown*"
  }

  if (isExamRemoveCommand(cleanQuestion)) {
    var rmIdx = parseInt(cleanQuestion.replace(/^exam\s+remove\s*/i, "").trim()) - 1
    if (isNaN(rmIdx)) return "Usage: *exam remove <number>*\nView: *exam countdown*"
    var rmResult = examCountdown.removeExam(phone, rmIdx)
    if (rmResult.error) return "❌ " + rmResult.error
    return "✅ Exam removed.\n\nView: *exam countdown*"
  }

  if (isExamCountdownCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "exam_countdown_view", channel: runtimeOptions.channel || "unknown" })
    return examCountdown.formatCountdown(phone)
  }

  // Career Guidance
  if (isCareerCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "career_guidance", channel: runtimeOptions.channel || "unknown" })
    var careerInterests = cleanQuestion.replace(/^career\s*(guidance)?\s*/i, "").trim()
    if (!careerInterests) {
      return careerGuidance.formatCareerGuidance("")
    }
    return careerGuidance.formatCareerGuidance(careerInterests)
  }

  // Exam Strategy
  if (isExamStrategyCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "exam_strategy", channel: runtimeOptions.channel || "unknown" })
    var examSubject = cleanQuestion.replace(/^(exam\s+(strategy|tips)|board\s+tips)\s*/i, "").trim()
    return examStrategy.formatExamStrategy(examSubject)
  }

  // Quick Notes - Save
  if (isNoteSaveCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "note_save", channel: runtimeOptions.channel || "unknown" })
    var noteContent = cleanQuestion.replace(/^note\s+save\s+/i, "").trim()
    var noteParts = noteContent.split(/\s+/)
    var noteTitle = noteParts.shift()
    var noteBody = noteParts.join(" ")
    if (!noteBody) return "Usage: *note save <title> <content>*\nExample: *note save Quadratic Formula x = (-b +/- sqrt(b^2-4ac)) / 2a*"
    quickNotes.saveNote(phone, noteTitle, noteBody)
    return "Note saved!\n\n*" + noteTitle + "*: " + (noteBody.length > 80 ? noteBody.substring(0, 77) + "..." : noteBody) + "\n\nView all: *my notes*"
  }

  // Quick Notes - View list
  if (isNotesListCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "notes_list", channel: runtimeOptions.channel || "unknown" })
    var noteFilter = cleanQuestion.replace(/^(my\s+)?notes?\s*/i, "").trim()
    return quickNotes.formatNotesList(phone, noteFilter || null)
  }

  // Quick Notes - View detail
  if (isNoteViewCommand(cleanQuestion)) {
    var viewIdx = parseInt(cleanQuestion.replace(/^note\s+view\s+/i, "").trim()) - 1
    if (isNaN(viewIdx)) return "Usage: *note view <number>*"
    return quickNotes.formatNoteDetail(phone, viewIdx)
  }

  // Quick Notes - Delete
  if (isNoteDeleteCommand(cleanQuestion)) {
    var delIdx = parseInt(cleanQuestion.replace(/^note\s+delete\s+/i, "").trim()) - 1
    if (isNaN(delIdx)) return "Usage: *note delete <number>*"
    var deleted = quickNotes.deleteNote(phone, delIdx)
    return deleted ? "Note deleted successfully." : "Could not find that note. Check: *my notes*"
  }

  // Mood Tracker
  if (isMoodCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "mood_track", channel: runtimeOptions.channel || "unknown" })
    var moodValue = cleanQuestion.replace(/^my\s+mood\s*/i, "").replace(/^mood\s*(stats)?\s*/i, "").trim().toLowerCase()
    if (moodValue === "stats" || moodValue === "" || moodValue === "mood") {
      return moodTracker.formatMoodStats(phone)
    }
    var validMoods = ["great", "good", "okay", "bad", "stressed"]
    if (validMoods.indexOf(moodValue) === -1) {
      return "*Mood Tracker*\n\nHow are you feeling?\n\n- *mood great* - Amazing!\n- *mood good* - Positive\n- *mood okay* - Normal\n- *mood bad* - Need boost\n- *mood stressed* - Overwhelmed\n- *mood stats* - View your mood history"
    }
    moodTracker.recordMood(phone, moodValue, "")
    var moodMsg = moodTracker.getMoodMessage(moodValue)
    return "*Mood: " + moodValue.toUpperCase() + "*\n\n" + moodMsg + "\n\nTip: Track your mood daily to see patterns!"
  }

  // Performance Report
  if (isPerformanceReportCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "performance_report", channel: runtimeOptions.channel || "unknown" })
    return performanceReport.formatPerformanceReport(phone)
  }

  // Whiteboard Mode
  if (isWhiteboardCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "whiteboard", channel: runtimeOptions.channel || "unknown" })
    var wbTopic = cleanQuestion.replace(/^whiteboard\s+/i, "").trim()
    if (!wbTopic) {
      return "*Whiteboard Mode*\n\nLearn step-by-step!\n\nUsage: *whiteboard <topic>*\n\nTry:\n- whiteboard quadratic equations\n- whiteboard photosynthesis\n- whiteboard newton laws"
    }
    var wbSession = whiteboardMode.getActiveSession(phone)
    if (wbSession) {
      return "You already have an active whiteboard on *" + wbSession.topic + "*.\nType *next* or *done*."
    }
    return whiteboardMode.startWhiteboard(phone, wbTopic)
  }

  // Whiteboard navigation
  var _wbActive = whiteboardMode.getActiveSession(phone)
  if (_wbActive) {
    var wbInput = cleanQuestion.trim().toLowerCase()
    if (wbInput === "next") return whiteboardMode.nextStep(phone)
    if (wbInput === "done") return whiteboardMode.endWhiteboard(phone)
  }

    return vocabularyBuilder.startVocabQuiz(phone)
  }

  if (isTimerStartCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "timer_start", channel: runtimeOptions.channel || "unknown" })
    const parts = cleanQuestion.split(" ")
    const preset = (parts.includes("pomodoro") && "pomodoro") || (parts.includes("short") && "short") || (parts.includes("long") && "long") || (parts.includes("exam") && "exam") || "pomodoro"
    return pomodoroTimer.startTimer(phone, preset)
  }

  if (isTimerStatusCommand(cleanQuestion)) {
    return pomodoroTimer.formatTimerStatus(phone)
  }

  if (isTimerDoneCommand(cleanQuestion)) {
    const result = pomodoroTimer.switchPhase(phone)
    if (!result) return "No active timer. Type *timer pomodoro* to start."
    return result.isWorkPhase
      ? "☕ Break time! Relax for " + result.breakMinutes + " minutes.\n\nType *timer done* when ready to study again."
      : "📖 Study time! Focus for " + result.workMinutes + " minutes.\n\nYou've completed " + result.completedPomodoros + " pomodoros!"
  }

  if (isTimerStopCommand(cleanQuestion)) {
    return pomodoroTimer.stopTimer(phone) || "No active timer running."
  }

    if (isMindMapCommand(cleanQuestion)) {
    trackInteraction({ phone, eventName: "mindmap_request", channel: runtimeOptions.channel || "unknown" })
    const topic = cleanQuestion.replace(/^mindmap\s*/i, "").trim()
    if (!topic) return "Usage: mindmap <topic>"
    return conceptMapGen.generateConceptMap(phone, topic, user).then(function(map) {
      return typeof map === "string" ? map : "Could not generate mind map."
    })
  }


  const greetings = ["hi", "hello", "hey", "start", "namaste"]
  if (greetings.includes(cleanQuestion)) {
    trackInteraction({
      phone,
      eventName: "welcome_seen",
      teachingMode: user.teachingPacePreference || "auto",
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        interactive: Boolean(runtimeOptions.preferInteractive)
      }
    })
    return buildWelcomeResponse(user, runtimeOptions)
  }

  let normalizedQuestion = rawQuestion
  let commandSuffix = ""
  const commands = ["/homework", "/quiz", "/example", "/exam", "/simple", "/detail"]

  for (const cmd of commands) {
    if (normalizedQuestion.trim().toLowerCase().endsWith(cmd)) {
      commandSuffix = cmd
      normalizedQuestion = normalizedQuestion
        .substring(0, normalizedQuestion.toLowerCase().lastIndexOf(cmd))
        .trim()
      break
    }
  }

  if (commandSuffix === "/example") {
    normalizedQuestion = `Give only 3 real-life examples for: ${normalizedQuestion}`
  } else if (commandSuffix === "/exam") {
    normalizedQuestion = `Give only key exam points and common mistakes for: ${normalizedQuestion}`
  } else if (commandSuffix === "/simple") {
    normalizedQuestion = `Explain in very simple Class 5 level language (no formula): ${normalizedQuestion}`
  } else if (commandSuffix === "/detail") {
    normalizedQuestion = `Explain in more detail, but still in simple student-friendly language: ${normalizedQuestion}`
  }

  if (commandSuffix === "/homework") {
    return startHomeworkCoach(phone, user, normalizedQuestion, runtimeOptions)
  }

  if (commandSuffix === "/quiz") {
    return startAdaptiveQuiz(phone, user, normalizedQuestion, runtimeOptions)
  }

  const userFormat = getUserPreference(phone, "answerFormat", "standard")
  const answerMode = accessProfile.premium
    ? (userFormat === "simple" ? "concise" : userFormat === "exam" ? "exam" : userFormat === "detailed" ? "detailed" : detectAnswerMode(rawQuestion, commandSuffix))
    : "concise"
  const subject = refineSubject(detectSubject(normalizedQuestion), normalizedQuestion)
  const masteryState = getMasteryState(phone)
  const latestAgentExecution = getLatestAgentExecution(phone)
  const agentPlan = planAgentAction({
    question: normalizedQuestion,
    subject,
    user,
    answerMode,
    commandSuffix,
    masteryState,
    lastExecution: latestAgentExecution
  })

  if (agentPlan.executeTool) {
    const premiumToolName = getPremiumFeatureNameForTool(agentPlan.executeTool)
    if (premiumToolName && !accessProfile.premium) {
      return buildPremiumFeatureLockedMessage(premiumToolName)
    }

    trackInteraction({
      phone,
      eventName: "agent_orchestrated",
      subject,
      learningIntent: agentPlan.diagnostic.intent,
      teachingMode: agentPlan.diagnostic.teachingMode,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        executeTool: agentPlan.executeTool,
        taskType: agentPlan.taskType,
        toolTopic: agentPlan.toolTopic || "",
        premiumTool: Boolean(premiumToolName)
      }
    })

    if (agentPlan.executeTool === "study_plan") {
      const plan = await getOrCreateStudyPlan(phone, user)
      recordAgentExecution({
        phone,
        actionId: "study_plan",
        taskType: agentPlan.taskType,
        subject,
        topic: "",
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return buildStudyPlanMessage(plan, user)
    }

    if (agentPlan.executeTool === "refresh_study_plan") {
      const plan = await regenerateStudyPlan(phone, user)
      recordAgentExecution({
        phone,
        actionId: "refresh_study_plan",
        taskType: agentPlan.taskType,
        subject,
        topic: "",
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return buildStudyPlanMessage(plan, user)
    }

    if (agentPlan.executeTool === "notes") {
      await recordStudyQuestion(phone, { subject, topic: agentPlan.toolTopic || subject, question: normalizedQuestion })
      await awardActivity(phone, "study_question")
      recordAgentExecution({
        phone,
        actionId: "notes",
        taskType: agentPlan.taskType,
        subject,
        topic: agentPlan.toolTopic || subject,
        questionText: normalizedQuestion,
        answerMode: "standard",
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return generateResearchNotes(phone, user, agentPlan.toolTopic || normalizedQuestion, subject, {
        noteMode: "notes",
        answerMode: "standard"
      })
    }

    if (agentPlan.executeTool === "quiz") {
      recordAgentExecution({
        phone,
        actionId: "quiz",
        taskType: agentPlan.taskType,
        subject,
        topic: agentPlan.toolTopic || normalizedQuestion,
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return startAdaptiveQuiz(phone, user, agentPlan.toolTopic || normalizedQuestion, runtimeOptions)
    }

    if (agentPlan.executeTool === "mock_test") {
      recordAgentExecution({
        phone,
        actionId: "mock_test",
        taskType: agentPlan.taskType,
        subject,
        topic: agentPlan.toolTopic || normalizedQuestion,
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return startMockTest(phone, user, agentPlan.toolTopic || normalizedQuestion, runtimeOptions)
    }

    if (agentPlan.executeTool === "homework_coach") {
      recordAgentExecution({
        phone,
        actionId: "homework_coach",
        taskType: agentPlan.taskType,
        subject,
        topic: agentPlan.toolTopic || normalizedQuestion,
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return startHomeworkCoach(phone, user, agentPlan.toolTopic || normalizedQuestion, runtimeOptions)
    }

    if (agentPlan.executeTool === "answer_review") {
      const intro = await startAnswerReview(phone)
      recordAgentExecution({
        phone,
        actionId: "answer_review",
        taskType: agentPlan.taskType,
        subject,
        topic: agentPlan.toolTopic || normalizedQuestion,
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          trigger: "agent_orchestrator"
        }
      })
      return [
        "I am switching to answer review mode so Jesh can check your work properly.",
        "",
        intro
      ].join("\n")
    }
  }

    // === DAILY QUIZ BUTTON HANDLER ===
  if (cleanQuestion.startsWith("dq_")) {
    const answerKey = cleanQuestion.replace("dq_", "").toUpperCase()
    const result = engagement.recordQuizAnswer(phone, answerKey)
    return engagement.buildQuizResultMessage(result)
  }

  const promptAccess = canUseTutorPrompt(phone)
  if (!promptAccess.allowed) {
    trackInteraction({
      phone,
      eventName: "free_limit_hit",
      subject,
      teachingMode: user.teachingPacePreference || "auto",
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        promptsUsedToday: promptAccess.promptsUsedToday || 0
      }
    })
    return buildFreeLimitMessage(promptAccess)
  }

  await recordStudyQuestion(phone, { subject, topic: subject, question: normalizedQuestion })
  await awardActivity(phone, "study_question")
  // Check milestones (consolidated - single message for all new milestones)
  try {
    const newMilestones = fm.checkAndAwardMilestones(phone)
    if (newMilestones.length > 0) {
      const milestoneLines = [
        "🎉 *" + ("MILESTONE" + (newMilestones.length > 1 ? "S" : "") + " UNLOCKED* 🎉"),
        ""
      ]
      newMilestones.forEach(function(m) {
        milestoneLines.push(m.emoji + " *" + m.label + "*")
      })
      milestoneLines.push("")
      milestoneLines.push("Keep up the amazing work! Type 'my milestones' to see all achievements.")
      const singleMsg = milestoneLines.join("\n")
      setTimeout(function() { sendWhatsAppMessage(phone, singleMsg).catch(function() {}) }, 2000)
    }
  } catch (fmErr) { /* milestone check non-blocking */ }
  const context = shouldUseConversationContext(normalizedQuestion) ? getConversationContext(phone) : ""
  // 📖 Topic Knowledge Base: inject pre-written context for common topics
  const topicKBContext = getTopicContextForPrompt(normalizedQuestion)
  const masteryContext = buildMasteryContext(phone, subject)

  const diagnostic = agentPlan.diagnostic
  const subjectFamily = getSubjectSpecialistFamily(subject, user)
  const forceMathReasoner = isMathReasoningQuestion(subject, normalizedQuestion, user)
  const forceScienceReasoner = isScienceReasoningQuestion(subject, normalizedQuestion, user)
  const fastTrackMath = isSimpleMathTeachingQuestion(normalizedQuestion, subject, user)
  const cacheOptions = {
    user,
    subject,
    context,
    masteryContext,
    answerMode,
    answerStyleVersion: ANSWER_STYLE_VERSION
  }

  const deterministicMathShortcut = subjectFamily === "math"
    ? (buildTwoPersonShareWordProblemReply(normalizedQuestion)
      || (fastTrackMath ? buildSimpleArithmeticTeachingReply(normalizedQuestion) : null))
    : null
  const agentNextStep = buildAgentNextStep(agentPlan, {
    subject,
    topic: normalizedQuestion,
    learningIntent: diagnostic.intent
  })

  if (deterministicMathShortcut && answerMode !== "detailed" && !commandSuffix) {
    const shortcutReply = ensurePocketTeacherFinish(deterministicMathShortcut, {
      answerMode,
      learningIntent: diagnostic.intent,
      teachingMode: diagnostic.teachingMode,
      complexity: diagnostic.complexity,
      subject,
      question: normalizedQuestion,
      weakTopics: (masteryState?.weakTopics || [])
        .filter((item) => String(item.subject || "").toLowerCase() === String(subject || "").toLowerCase())
        .map((item) => item.topic)
    })
    const shortcutQuality = collectAnswerQualityIssues(shortcutReply, {
      subject,
      question: normalizedQuestion,
      user
    })

    saveAnswer(normalizedQuestion, shortcutReply, cacheOptions)
  try { studyGoalTracker.recordStudySession(phone, 5, runtimeOptions._detectedSubject || detectSubject(rawQuestion), rawQuestion.substring(0, 50)) } catch(rgErr) {}

    recordAnswerQualityEvent({
      phone,
      subject,
      subjectFamily,
      answerMode,
      source: "fresh",
      initialIssues: shortcutQuality.issues,
      finalIssues: shortcutQuality.issues,
      hadRetry: false,
      retryResolved: true,
      agentId: "deterministic-math",
      preferredAgentId: "deterministic-math",
      usedFallbackAgent: false
    })
    trackInteraction({
      phone,
      eventName: "teaching_answer",
      subject,
      learningIntent: diagnostic.intent,
      teachingMode: diagnostic.teachingMode,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        answerMode,
        source: "deterministic",
        subjectFamily,
        agentId: "deterministic-math",
        preferredAgentId: "deterministic-math",
        taskFallbackAgentId: "deterministic-math",
        usedFallbackAgent: false,
        agentAttemptCount: 0,
        thinkingLevel: "off",
        internalShortcut: true
      }
    })
    recordAgentExecution({
      phone,
      actionId: "teach",
      taskType: "teaching",
      subject,
      topic: subject,
      questionText: normalizedQuestion,
      answerMode,
      metadata: {
        source: "deterministic-math",
        learningIntent: diagnostic.intent,
        nextStep: agentNextStep?.command || null
      }
    })
    await addToHistory(phone, normalizedQuestion, shortcutReply)
    recordTutorPromptUsage(phone)
    const shortcutFollowUp = generateFollowUp(shortcutReply, {
      subject,
      learningIntent: diagnostic.intent,
      question: normalizedQuestion,
      nextStep: agentNextStep
    })
    return buildTeachingFollowupResponse(shortcutFollowUp ? shortcutReply + shortcutFollowUp : shortcutReply, runtimeOptions, {
      answerMode,
      subject,
      user,
      learningIntent: diagnostic.intent,
      accessProfile,
      nextStep: agentNextStep
    })
  }

  // === PHASE 4: Socratic Initiation ===
  const shouldSocratic = shouldInitiateSocratic(normalizedQuestion, user, subject, diagnostic.intent)
  if (shouldSocratic && !commandSuffix) {
    createSocraticSession(phone, subject, subject, normalizedQuestion)
    recordSocraticExchange(phone, 'student', normalizedQuestion)
    const exchanges = getSocraticExchanges(phone)
    const socraticPrompt = buildSocraticPrompt({ original_question: normalizedQuestion, subject, topic: subject, stage: 'assessing', attempts: 0 }, null, exchanges)
    const socraticResult = await askOpenClawWithMeta(socraticPrompt, {
      answerMode: 'standard',
      taskType: 'teaching',
      phone,
      channel: runtimeOptions.channel,
      subject,
      questionText: normalizedQuestion,
      user
    })
    const socraticReply = socraticResult?.text || 'Before I explain, can you tell me what you already know about this topic?'
    recordSocraticExchange(phone, 'tutor', socraticReply)
    await addToHistory(phone, normalizedQuestion, socraticReply)
    recordTutorPromptUsage(phone)
    return socraticReply
  }
  const cached = getCachedAnswer(normalizedQuestion, cacheOptions)

  if (cached) {
    const formattedCached = ensurePocketTeacherFinish(formatReplyForWhatsApp(cached, {
      subject,
      question: normalizedQuestion,
      user
    }), {
      answerMode,
      learningIntent: diagnostic.intent,
      teachingMode: diagnostic.teachingMode,
      complexity: diagnostic.complexity,
      subject,
      question: normalizedQuestion,
      weakTopics: (masteryState?.weakTopics || [])
        .filter((item) => String(item.subject || "").toLowerCase() === String(subject || "").toLowerCase())
        .map((item) => item.topic)
    })
    const cachedQuality = collectAnswerQualityIssues(formattedCached, {
      subject,
      question: normalizedQuestion,
      user
    })

    if (!cachedQuality.shouldRetry) {
  try { studyGoalTracker.recordStudySession(phone, 5, runtimeOptions._detectedSubject || detectSubject(rawQuestion), rawQuestion.substring(0, 50)) } catch(rgErr) {}

      recordAnswerQualityEvent({
        phone,
        subject,
        subjectFamily,
        answerMode,
        source: "cache",
        initialIssues: cachedQuality.issues,
        finalIssues: cachedQuality.issues,
        hadRetry: false,
        retryResolved: false,
        agentId: "cache",
        preferredAgentId: "cache",
        usedFallbackAgent: false
      })
      trackInteraction({
        phone,
        eventName: "teaching_answer",
        subject,
        learningIntent: diagnostic.intent,
        teachingMode: diagnostic.teachingMode,
        channel: runtimeOptions.channel || "unknown",
        metadata: {
          answerMode,
          source: "cache",
          subjectFamily,
          agentId: "cache",
          preferredAgentId: "cache",
          taskFallbackAgentId: "cache",
          usedFallbackAgent: false,
          agentAttemptCount: 0,
          thinkingLevel: "cache",
          internalShortcut: Boolean(runtimeOptions.internalShortcut)
        }
      })
      recordAgentExecution({
        phone,
        actionId: "teach",
        taskType: "teaching",
        subject,
        topic: subject,
        questionText: normalizedQuestion,
        answerMode,
        metadata: {
          source: "cache",
          learningIntent: diagnostic.intent,
          nextStep: agentNextStep?.command || null
        }
      })
      await addToHistory(phone, normalizedQuestion, formattedCached)
      recordTutorPromptUsage(phone)
      const cachedFollowUp = generateFollowUp(formattedCached, {
        subject,
        learningIntent: diagnostic.intent,
        question: normalizedQuestion,
        nextStep: agentNextStep
      })
      return buildTeachingFollowupResponse(cachedFollowUp ? formattedCached + cachedFollowUp : formattedCached, runtimeOptions, {
        answerMode,
        subject,
        user,
        learningIntent: diagnostic.intent,
        accessProfile,
        nextStep: agentNextStep
      })
    }
  }

  const emotionResult = analyzeEmotion(normalizedQuestion)
  if (emotionResult.emotion !== 'neutral') {
    recordEmotionalState(phone, emotionResult.emotion, emotionResult.confidence, emotionResult.signals)
  }
  const emotionalContext = getEmotionalContextForPrompt(emotionResult.emotion)
  const emotionalSummary = buildEmotionalSummary(phone)
  const teachingToneDirective = getTeachingToneDirective(emotionResult.emotion, user.level || user.class)
  const agentMemoryCtx = buildAgentMemoryContext(phone, { currentSubject: subject })

  const prompt = buildPrompt(normalizedQuestion, user, subject, context + topicKBContext, {
    answerMode,
    masteryContext,
    diagnosticContext: [agentPlan.plannerContext, diagnostic.promptText].filter(Boolean).join(" "),
    emotionalContext,
    emotionalSummary,
    agentMemoryContext: agentMemoryCtx,
    teachingToneDirective
  })
  let openclawResult = await askOpenClawWithMeta(prompt, {
    answerMode,
    taskType: agentPlan.taskType || "teaching",
    phone,
    channel: runtimeOptions.channel,
    subject,
    questionText: normalizedQuestion,
    forceAgentId: accessProfile.premium
      ? (forceMathReasoner
          ? openclawAgentConfig.mathPremium
          : forceScienceReasoner
            ? openclawAgentConfig.sciencePremium
            : PREMIUM_AGENT_ID)
      : (forceMathReasoner ? openclawAgentConfig.mathReasoner : (forceScienceReasoner ? openclawAgentConfig.scienceReasoner : undefined)),
    fastTrackMath,
    user
  })
  let reply = openclawResult?.text

  if (!reply) {
    reply = "Something went wrong. Can you please ask again?"
  } else {
    reply = ensurePocketTeacherFinish(formatReplyForWhatsApp(reply, {
      subject,
      question: normalizedQuestion,
      user
    }), {
      answerMode,
      learningIntent: diagnostic.intent,
      teachingMode: diagnostic.teachingMode,
      complexity: diagnostic.complexity,
      subject,
      question: normalizedQuestion,
      weakTopics: (masteryState?.weakTopics || [])
        .filter((item) => String(item.subject || "").toLowerCase() === String(subject || "").toLowerCase())
        .map((item) => item.topic)
    })

    const quality = collectAnswerQualityIssues(reply, {
      subject,
      question: normalizedQuestion,
      user
    })
    let finalQuality = quality
    let hadRetry = false
    let retryResolved = false

    if (quality.shouldRetry) {
      hadRetry = true
      const fallbackAgentId = quality.issues.includes("meta_session_leak")
        ? pickTaskFallbackAgentId("teaching", openclawAgentConfig, {
            subject,
            user,
            questionText: normalizedQuestion
          })
        : null
      const recoveryPrompt = buildQualityRecoveryPrompt(prompt, reply, quality.issues)
      const retryResult = await askOpenClawWithMeta(recoveryPrompt, {
        answerMode,
        taskType: "teaching",
        phone,
        channel: runtimeOptions.channel,
        subject,
        questionText: normalizedQuestion,
        forceAgentId: fallbackAgentId,
        fastTrackMath,
        user
      })
      const retryReply = retryResult?.text

      if (retryReply) {
        const formattedRetry = ensurePocketTeacherFinish(formatReplyForWhatsApp(retryReply, {
          subject,
          question: normalizedQuestion,
          user
        }), {
          answerMode,
          learningIntent: diagnostic.intent,
          teachingMode: diagnostic.teachingMode,
          complexity: diagnostic.complexity,
          subject,
          question: normalizedQuestion,
          weakTopics: (masteryState?.weakTopics || [])
            .filter((item) => String(item.subject || "").toLowerCase() === String(subject || "").toLowerCase())
            .map((item) => item.topic)
        })
        const retryQuality = collectAnswerQualityIssues(formattedRetry, {
          subject,
          question: normalizedQuestion,
          user
        })

        if (!retryQuality.shouldRetry || retryQuality.issues.length <= quality.issues.length) {
          reply = formattedRetry
          finalQuality = retryQuality
          openclawResult = retryResult
        }

        retryResolved = retryQuality.issues.length < quality.issues.length || !retryQuality.shouldRetry
      }
    }

    if (subjectFamily === "math" && finalQuality.shouldRetry) {
      const deterministicWordProblemReply = buildTwoPersonShareWordProblemReply(normalizedQuestion)
      if (deterministicWordProblemReply) {
        reply = deterministicWordProblemReply
        finalQuality = collectAnswerQualityIssues(reply, {
          subject,
          question: normalizedQuestion,
          user
        })
        retryResolved = true
      }
    }

    if (fastTrackMath && finalQuality.shouldRetry) {
      const deterministicMathReply = buildSimpleArithmeticTeachingReply(normalizedQuestion)
      if (deterministicMathReply) {
        reply = deterministicMathReply
        finalQuality = collectAnswerQualityIssues(reply, {
          subject,
          question: normalizedQuestion,
          user
        })
        retryResolved = true
      }
    }

    if (finalQuality.shouldRetry && subjectFamily !== "math") {
      const recoveryPlan = buildAgentRecoveryPlan({
        plan: agentPlan,
        qualityIssues: finalQuality.issues
      })

      if (recoveryPlan?.strategy === "notes_fallback") {
        const repairedNotes = await generateResearchNotes(phone, user, normalizedQuestion, subject, {
          noteMode: "notes",
          answerMode: "standard"
        })
        if (repairedNotes) {
          const formattedNotes = ensurePocketTeacherFinish(formatReplyForWhatsApp(repairedNotes, {
            subject,
            question: normalizedQuestion,
            user
          }), {
            answerMode,
            learningIntent: diagnostic.intent,
            teachingMode: diagnostic.teachingMode,
            complexity: diagnostic.complexity,
            subject,
            question: normalizedQuestion,
            weakTopics: (masteryState?.weakTopics || [])
              .filter((item) => String(item.subject || "").toLowerCase() === String(subject || "").toLowerCase())
              .map((item) => item.topic)
          })
          const notesQuality = collectAnswerQualityIssues(formattedNotes, {
            subject,
            question: normalizedQuestion,
            user
          })
          if (!notesQuality.shouldRetry || notesQuality.issues.length < finalQuality.issues.length) {
            reply = formattedNotes
            finalQuality = notesQuality
            retryResolved = true
          }
        }
      } else if (recoveryPlan) {
        const rescuePrompt = buildAutonomousRepairPrompt(prompt, reply, finalQuality.issues, recoveryPlan)
        const rescueResult = await askOpenClawWithMeta(rescuePrompt, {
          answerMode,
          taskType: agentPlan.taskType || "teaching",
          phone,
          channel: runtimeOptions.channel,
          subject,
          questionText: normalizedQuestion,
          forceAgentId: pickTaskFallbackAgentId("teaching", openclawAgentConfig, {
            subject,
            user,
            questionText: normalizedQuestion
          }),
          fastTrackMath,
          user
        })
        const rescueReply = rescueResult?.text

        if (rescueReply) {
          const formattedRescue = ensurePocketTeacherFinish(formatReplyForWhatsApp(rescueReply, {
            subject,
            question: normalizedQuestion,
            user
          }), {
            answerMode,
            learningIntent: diagnostic.intent,
            teachingMode: diagnostic.teachingMode,
            complexity: diagnostic.complexity,
            subject,
            question: normalizedQuestion,
            weakTopics: (masteryState?.weakTopics || [])
              .filter((item) => String(item.subject || "").toLowerCase() === String(subject || "").toLowerCase())
              .map((item) => item.topic)
          })
          const rescueQuality = collectAnswerQualityIssues(formattedRescue, {
            subject,
            question: normalizedQuestion,
            user
          })
          if (!rescueQuality.shouldRetry || rescueQuality.issues.length < finalQuality.issues.length) {
            reply = formattedRescue
            finalQuality = rescueQuality
            openclawResult = rescueResult
            retryResolved = true
          }
        }
      }
    }

  try { studyGoalTracker.recordStudySession(phone, 5, runtimeOptions._detectedSubject || detectSubject(rawQuestion), rawQuestion.substring(0, 50)) } catch(rgErr) {}

    recordAnswerQualityEvent({
      phone,
      subject,
      subjectFamily,
      answerMode,
      source: "fresh",
      initialIssues: quality.issues,
      finalIssues: finalQuality.issues,
      hadRetry,
      retryResolved,
      agentId: openclawResult?.agentId || "unknown",
      preferredAgentId: openclawResult?.preferredAgentId || "unknown",
      usedFallbackAgent: Boolean(openclawResult?.usedFallbackAgent)
    })
    trackInteraction({
      phone,
      eventName: "teaching_answer",
      subject,
      learningIntent: diagnostic.intent,
      teachingMode: diagnostic.teachingMode,
      channel: runtimeOptions.channel || "unknown",
      metadata: {
        answerMode,
        source: "fresh",
        subjectFamily,
        agentId: openclawResult?.agentId || "unknown",
        preferredAgentId: openclawResult?.preferredAgentId || "unknown",
        taskFallbackAgentId: openclawResult?.taskFallbackAgentId || "unknown",
        usedFallbackAgent: Boolean(openclawResult?.usedFallbackAgent),
        agentAttemptCount: openclawResult?.attemptCount || 0,
        thinkingLevel: openclawResult?.thinkingLevel || "unknown",
        hadRetry,
        retryResolved,
        internalShortcut: Boolean(runtimeOptions.internalShortcut)
      }
    })

    await addToHistory(phone, normalizedQuestion, reply)
    await saveAnswer(normalizedQuestion, reply, cacheOptions)
    recordAgentExecution({
      phone,
      actionId: "teach",
      taskType: agentPlan.taskType || "teaching",
      subject,
      topic: subject,
      questionText: normalizedQuestion,
      answerMode,
      metadata: {
        source: "fresh",
        learningIntent: diagnostic.intent,
        agentId: openclawResult?.agentId || "unknown",
        preferredAgentId: openclawResult?.preferredAgentId || "unknown",
        nextStep: agentNextStep?.command || null
      }
    })
    // === PHASE 4: Record Agent Insights ===
    const agentId = openclawResult?.agentId || 'unknown'
    if (emotionResult.emotion === 'frustration') {
      recordWeakness(phone, agentId, subject, subject, 'Student showed frustration with: ' + normalizedQuestion.slice(0, 80))
    } else if (emotionResult.emotion === 'confusion') {
      recordWeakness(phone, agentId, subject, subject, 'Student was confused about: ' + normalizedQuestion.slice(0, 80))
    }
    if (emotionResult.emotion === 'confidence') {
      recordStrength(phone, agentId, subject, subject, 'Student showed confidence in: ' + normalizedQuestion.slice(0, 80))
    } else if (emotionResult.emotion === 'excitement') {
      recordStrength(phone, agentId, subject, subject, 'Student had a breakthrough with: ' + normalizedQuestion.slice(0, 80))
    }
    if (emotionResult.signals.includes('curiosity')) {
      recordObservation(phone, agentId, subject, 'Student showed curiosity about ' + subject + '. Topic: ' + normalizedQuestion.slice(0, 60))
    }
    if (emotionResult.signals.includes('repeated_question')) {
      recordMisconception(phone, agentId, subject, subject, 'Student asked the same question repeatedly: ' + normalizedQuestion.slice(0, 60))
    }
    recordTutorPromptUsage(phone)
  }

  const freshFollowUp = generateFollowUp(reply, {
    subject,
    learningIntent: diagnostic.intent,
    question: normalizedQuestion,
    nextStep: agentNextStep
  })
  return buildTeachingFollowupResponse(freshFollowUp ? reply + freshFollowUp : reply, runtimeOptions, {
    answerMode,
    subject,
    user,
    learningIntent: diagnostic.intent,
    accessProfile,
    nextStep: agentNextStep
  })
}

app.get("/webhook", verifyWebhook)

app.post("/webhook", messageRateLimiter, async (req, res) => {
  const processMessageWithAI = async (message, phone) => {
  try {
      return await generateReply(message, phone, { preferInteractive: true, channel: "whatsapp" })
  } catch (err) {
      console.error("[AI Error]", err && err.stack ? err.stack : err?.message || err)
      return "Servers are busy studying. Please try your question again in a minute."
  }
  }

  await handleWebhook(req, res, processMessageWithAI)
})

app.post("/agent", apiRateLimiter, requireAgentAuth, async (req, res) => {
  const body = req.body || {}
  const question = body.message || body.question || ""
  const phone = body.phone || "unknown"

  try {
    const reply = await generateReply(question, phone, { preferInteractive: false, channel: "agent" })
    res.json({ reply: typeof reply === "string" ? reply : reply.text || "Interactive response generated." })
  } catch (err) {
    console.error("[AI Error]", err && err.stack ? err.stack : err?.message || err)
    res.json({ reply: "Servers are busy studying. Please try your question again in a minute." })
  }
})

app.use("/api", apiRateLimiter, dashboardCors, requireDashboardAuth)

app.get("/api/stats", (req, res) => {
  const stats = getDashboardStats(req.query || {})
  // Phase 3/4 enrichment
  try {
    const { all } = require("./utils/sqliteStore")
    const today = new Date().toISOString().split("T")[0]
    stats.socraticSessions = (all("SELECT COUNT(*) as c FROM socratic_sessions WHERE date(created_at) = ?", today)[0]?.c) || 0
    stats.emotionalStates = (all("SELECT COUNT(*) as c FROM student_emotional_state WHERE date(detected_at) = ?", today)[0]?.c) || 0
    stats.proactiveLessonsSent = (all("SELECT COUNT(*) as c FROM proactive_lessons WHERE date(sent_at) = ?", today)[0]?.c) || 0
    stats.agentInsights = (all("SELECT COUNT(*) as c FROM agent_insights")[0]?.c) || 0
    stats.totalSocraticSessions = (all("SELECT COUNT(*) as c FROM socratic_sessions")[0]?.c) || 0
  } catch (err) { /* stats enrichment failed silently */ }
  res.json(stats)
})

app.get("/api/users", (req, res) => {
  res.json(getAllUsers(req.query || {}))
})

app.get("/api/users/export.csv", (req, res) => {
  const csv = getUsersCsv(req.query || {})
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", 'attachment; filename="study-ai-users.csv"')
  res.send(csv)
})

// === PHASE 4: Proactive Teaching System ===
async function sendProactiveLessons() {
  try {
    const activeUsers = Object.values(loadUsers()).filter(u => u && isProfileComplete(u) && u.phone)
    let sent = 0
    
    for (const user of activeUsers) {
      try {
        if (!shouldSendProactiveLesson(user.phone)) continue
    // Send to premium users and active free users (studied in last 3 days)
        
        const masteryState = getMasteryState(user.phone)
        const lesson = buildProactiveLesson(user.phone, user, masteryState)
        
        await sendWhatsAppMessage(user.phone, lesson)
        recordProactiveLessonSent(user.phone, 
          masteryState?.weakTopics?.[0]?.subject || 'General',
          masteryState?.weakTopics?.[0]?.topic || 'daily review'
        )
        sent++
      } catch (err) {
        console.error('[Proactive Lesson Error]', user.phone, err.message)
      }
    }
    
    if (sent > 0) console.log('[Proactive Lessons] Sent', sent, 'lessons')
  } catch (err) {
    console.error('[Proactive Lessons Error]', err.message)
  }
}

// === PHASE 4: Agent Insight Cleanup ===
function cleanupStaleInsights() {
  try {
    cleanupOldInsights(90) // Remove insights older than 90 days with low confidence
  } catch (err) {
    console.error('[Insight Cleanup Error]', err.message)
  }
}

function runScheduledStudyTasks() {
  const scheduledJobs = [
    {
      name: "daily-morning-push",
      label: "Morning Push Error",
      minIntervalMs: 24 * 60 * 60 * 1000,
      run: sendDailyMorningPush
    },
    {
      name: "onboarding-reminders",
      label: "Onboarding Reminder Error",
      minIntervalMs: 60 * 60 * 1000,
      run: sendOnboardingReminders
    },
    {
      name: "revision-reminders",
      label: "Revision Reminder Error",
      minIntervalMs: 60 * 60 * 1000,
      run: sendSpacedRevisionReminders
    },
    {
      name: "referral-prompts",
      label: "Referral Prompt Error",
      minIntervalMs: 24 * 60 * 60 * 1000,
      run: sendDailyReferralPrompts
    },
    {
      name: "premium-prompts",
      label: "Premium Prompt Error",
      minIntervalMs: 24 * 60 * 60 * 1000,
      run: sendDailyPremiumPrompts
    },
    {
      name: "mission-reminders",
      label: "Mission Reminder Error",
      minIntervalMs: 60 * 60 * 1000,
      run: sendMissionReminders
    },
    {
      name: "weekly-parent-reports",
      label: "Parent Report Error",
      minIntervalMs: 60 * 60 * 1000,
      run: sendWeeklyParentReports
    },
    {
      name: "proactive-lessons",
      label: "Proactive Lesson Error",
      minIntervalMs: 4 * 60 * 60 * 1000,
      run: sendProactiveLessons
    },
    {
      name: "insight-cleanup",
      label: "Insight Cleanup Error",
      minIntervalMs: 24 * 60 * 60 * 1000,
      run: cleanupStaleInsights
    },
    {
      name: "wal-checkpoint",
      label: "WAL Checkpoint Error",
      minIntervalMs: 4 * 60 * 60 * 1000,
      run: checkpointWAL
    }
  ,
    {
      name: "win-back",
      label: "Win-Back Error",
      minIntervalMs: 6 * 60 * 60 * 1000,
      run: af.sendWinBackMessages
    },
    {
      name: "smart-study-plan",
      label: "Smart Study Plan Error",
      minIntervalMs: 12 * 60 * 60 * 1000,
      run: af.sendSmartStudyPlanReminders
    },
    {
      name: "timer-checks",
      label: "Timer Check Error",
      minIntervalMs: 60 * 1000,
      run: af.checkAndSendTimerReminders
    },
    {
      name: "weekly-leaderboard-push",
      label: "Leaderboard Push Error",
      minIntervalMs: 24 * 60 * 60 * 1000,
      run: af.sendWeeklyLeaderboardPush
    },
  {
      name: "daily-quiz-push",
      label: "Daily Quiz Push Error",
      minIntervalMs: 12 * 60 * 60 * 1000,
      run: async function sendDailyQuiz() {
        try {
          const { loadUsers, isProfileComplete } = require("./utils/onboardingManager")
          const { sendWhatsAppButtons } = require("./webhook")
          const result = await engagement.sendDailyQuizPush(sendWhatsAppButtons, loadUsers, isProfileComplete)
          if (result.sent > 0) console.log("[DailyQuiz] Sent to " + result.sent + " users")
        } catch (e) { console.error("[DailyQuiz] Error:", e.message) }
      }
    },
  {
      name: "streak-saver",
      label: "Streak Saver Error",
      minIntervalMs: 4 * 60 * 60 * 1000,
      run: async function sendStreakSaver() {
        try {
          const { loadUsers, isProfileComplete } = require("./utils/onboardingManager")
          const { sendWhatsAppMessage } = require("./webhook")
          const result = await engagement.sendStreakSaverNotifications(sendWhatsAppMessage, loadUsers, isProfileComplete)
          if (result.sent > 0) console.log("[StreakSaver] Alerted " + result.sent + " users")
        } catch (e) { console.error("[StreakSaver] Error:", e.message) }
      }
    },
    {
      name: "proactive-reminders",
      label: "Proactive Reminder Error",
      minIntervalMs: 4 * 60 * 60 * 1000,
      run: async function sendProactiveReminders() {
        try {
          const { loadUsers, isProfileComplete } = require("./utils/onboardingManager")
          const users = loadUsers()
          for (const [ph, u] of Object.entries(users)) {
            if (!isProfileComplete(u) || !ph) continue
            if (af.isOnVacation(ph)) continue
            try {
              const reminder = await af.generateProactiveReminder(ph, u)
              if (reminder) {
                const { sendWhatsAppMessage } = require("./webhook")
                await sendWhatsAppMessage(ph, reminder).catch(() => {})
              }
            } catch {}
          }
        } catch (e) { console.error("[Proactive] Error:", e.message) }
      }
    }
  ]

  Promise.allSettled(
    scheduledJobs.map((job) =>
      runScheduledTask(job.name, job.run, {
        minIntervalMs: job.minIntervalMs,
        lockMs: 20 * 60 * 1000,
        workerId: `study-api-${process.pid}`
      })
    )
  ).then((results) => {
    const labels = [
      "Morning Push Error",
      "Onboarding Reminder Error",
      "Revision Reminder Error",
      "Referral Prompt Error",
      "Premium Prompt Error",
      "Mission Reminder Error",
      "Parent Report Error",
      "Proactive Lesson Error",
      "Insight Cleanup Error",
      "WAL Checkpoint Error",
      "Win-Back Error",
      "Smart Study Plan Error",
      "Timer Check Error",
      "Leaderboard Push Error",
      "Daily Quiz Push Error",
      "Streak Saver Error",
      "Proactive Reminder Error"
    ]

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`[${labels[index]}]`, result.reason?.message || result.reason)
      }
    })
  })
}

function startHttpServer() {
    try {
    af.createAdvancedTables()
    stf.createSmartTables()
  engagement.createEngagementTables()
  aiAnswerEvaluator.createEvaluatorTables()
  reverseQuiz.createReverseQuizTables()
  conceptMapGen.createConceptMapTables()
  conceptComparator.createCompareTables()
  studyGoalTracker.createGoalTrackerTables()
  flashcardSystem.ensureTable()
  timetableGenerator.ensureTable()
  mockTestGenerator.ensureTable()
  parentReportGen.ensureTable()
  quickRevision.createQuickRevisionTables()
  srsFlashcards.createSRSTables()
    // Daily concept cron (runs at 8 AM IST)
    cron.schedule("0 8 * * *", async () => {
      try { await stf.sendDailyConcepts() } catch (e) { console.error("[Cron] daily concept error:", e.message) }
    }, { timezone: "Asia/Kolkata" })

    af.initMessaging(
      require("./webhook").sendWhatsAppMessage,
      require("./webhook").sendWhatsAppButtons,
      require("./webhook").sendWhatsAppList
    )
  } catch (e) { console.error("[AdvancedFeatures] Init error:", e.message) }
const HOST = process.env.HOST || "127.0.0.1"
const server = app.listen(PORT, HOST, () => {
    console.log("Study Bot AI Server and dashboard running on port", PORT)

  // BATCH 4: Add missing columns to users table
  try {
    const { run: dbRun, all: dbAll } = require("./utils/sqliteStore")
    var migCols = []
    try {
      migCols = (dbAll("SELECT name FROM pragma_table_info('users')") || []).map(c => c.name)
    } catch(e) {
      console.log("[Migration] Could not read columns:", e.message)
    }
    if (!migCols.includes("last_active")) { try { dbRun("ALTER TABLE users ADD COLUMN last_active TEXT"); console.log("[Migration] Added last_active") } catch(e2) {} }
    if (!migCols.includes("streak")) { try { dbRun("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0"); console.log("[Migration] Added streak") } catch(e2) {} }
    if (!migCols.includes("last_active_date")) { try { dbRun("ALTER TABLE users ADD COLUMN last_active_date TEXT"); console.log("[Migration] Added last_active_date") } catch(e2) {} }
    if (!migCols.includes("longest_streak")) { try { dbRun("ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0"); console.log("[Migration] Added longest_streak") } catch(e2) {} }
    if (!migCols.includes("streak_notified")) { try { dbRun("ALTER TABLE users ADD COLUMN streak_notified TEXT"); console.log("[Migration] Added streak_notified") } catch(e2) {} }
  } catch (migrationErr) {
    console.error("[Migration] Error:", migrationErr.message)
  }

    if (startupStatus.missingEnv.length > 0) {
      console.warn("[Startup Warning] Missing env vars:", startupStatus.missingEnv.join(", "))
    }
    if (!startupStatus.openclawAvailable) {
      console.warn("[Startup Warning] OpenClaw unavailable:", startupStatus.openclawError || "unknown error")
    }
  })

  // Graceful shutdown handler
  let isShuttingDown = false
  function gracefulShutdown(signal) {
    if (isShuttingDown) return
    isShuttingDown = true
    console.log(`[Shutdown] Received ${signal}, shutting down gracefully...`)
    
    // Stop accepting new connections
    server.close(() => {
      console.log("[Shutdown] HTTP server closed")
      
      // Release any scheduled task locks
      try {
        const { run: dbRun } = require("./utils/sqliteStore")
        dbRun("UPDATE scheduled_task_runs SET lock_until = NULL, last_status = 'interrupted' WHERE last_status = 'running'")
        console.log("[Shutdown] Released scheduled task locks")
      } catch (e) {
        console.error("[Shutdown] Error releasing locks:", e.message)
      }
      
      console.log("[Shutdown] Complete")
      process.exit(0)
    })
    
    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error("[Shutdown] Forced exit after timeout")
      process.exit(1)
    }, 10000)
  }
  
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  process.on("uncaughtException", (err) => {
    console.error("[FATAL] Uncaught exception:", err.message, err.stack?.slice(0, 500))
    gracefulShutdown("UNCAUGHT_EXCEPTION")
  })
  process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] Unhandled rejection:", reason)
  })

  setTimeout(runScheduledStudyTasks, 30 * 1000)
  cron.schedule("*/10 * * * *", runScheduledStudyTasks, {
    timezone: "Asia/Kolkata"
  })
}

if (require.main === module) {
  startHttpServer()
}

module.exports = {
  app,
  generateReply,
  getHealthSnapshot,
  startHttpServer,
  runScheduledStudyTasks
}

