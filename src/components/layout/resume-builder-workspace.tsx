'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Plus, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { toast } from 'sonner';

interface ExperienceEntry {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string; // one per line
}

interface EducationEntry {
  degree: string;
  school: string;
  year: string;
}

const PAGE_SIZES: Record<'letter' | 'a4', [number, number]> = {
  letter: [612, 792],
  a4: [595.28, 841.89],
};

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
      <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
        <h3 className="font-bold tracking-tight text-foreground text-sm">{title}</h3>
        {action}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

export function ResumeBuilderWorkspace() {
  const { activeTool, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [links, setLinks] = useState('');
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    { role: '', company: '', startDate: '', endDate: '', bullets: '' },
  ]);
  const [education, setEducation] = useState<EducationEntry[]>([
    { degree: '', school: '', year: '' },
  ]);
  const [skills, setSkills] = useState('');
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>('letter');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const generateTimer = useRef<number | null>(null);

  const hasContent = useMemo(
    () => Boolean(fullName.trim() || experiences.some((e) => e.role.trim() || e.company.trim())),
    [fullName, experiences],
  );

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeBlob, [revokeBlob]);

  // ── PDF rendering ──
  const renderResumePdf = useCallback(async (): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
    const [PW, PH] = PAGE_SIZES[pageSize];
    const M = 54;
    const contentW = PW - M * 2;
    const ink = rgb(0.12, 0.13, 0.18);
    const muted = rgb(0.42, 0.45, 0.52);
    const accent = rgb(0.31, 0.27, 0.9);
    const rule = rgb(0.87, 0.88, 0.92);

    const sanitize = (value: string) => value
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');

    const wrap = (text: string, maxWidth: number, f = font, fs = 9.5): string[] => {
      const words = sanitize(text).split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (f.widthOfTextAtSize(candidate, fs) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    let page = doc.addPage([PW, PH]);
    let y = PH - M;

    const ensureSpace = (needed: number) => {
      if (y - needed < M) {
        page = doc.addPage([PW, PH]);
        y = PH - M;
      }
    };

    const drawSectionHeading = (title: string) => {
      ensureSpace(34);
      page.drawText(title.toUpperCase(), { x: M, y, size: 10.5, font: bold, color: accent });
      y -= 6;
      page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, thickness: 0.8, color: rule });
      y -= 14;
    };

    // Header
    const nameSize = 24;
    page.drawText(sanitize(fullName || 'Your Name'), { x: M, y: y - nameSize + 4, size: nameSize, font: bold, color: ink });
    y -= nameSize + 8;
    if (jobTitle.trim()) {
      page.drawText(sanitize(jobTitle), { x: M, y, size: 11.5, font: italic, color: muted });
      y -= 15;
    }
    const contactParts = [phone, email, location, ...links.split('\n')].map(sanitize).filter((p) => p.trim());
    if (contactParts.length) {
      const contactLine = wrap(contactParts.join('  ·  '), contentW, font, 9);
      for (const line of contactLine) {
        page.drawText(line, { x: M, y, size: 9, font, color: muted });
        y -= 12;
      }
    }
    y -= 8;

    if (summary.trim()) {
      drawSectionHeading('Professional Summary');
      for (const line of wrap(summary, contentW, font, 10)) {
        ensureSpace(13);
        page.drawText(line, { x: M, y, size: 10, font, color: ink });
        y -= 13;
      }
      y -= 8;
    }

    const expEntries = experiences.filter((e) => e.role.trim() || e.company.trim());
    if (expEntries.length) {
      drawSectionHeading('Experience');
      for (const exp of expEntries) {
        ensureSpace(52);
        const dateRange = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
        const dateWidth = dateRange ? bold.widthOfTextAtSize(dateRange, 9) : 0;
        page.drawText(sanitize(exp.role || 'Role'), { x: M, y, size: 11.5, font: bold, color: ink });
        if (dateRange) {
          page.drawText(dateRange, { x: PW - M - dateWidth, y: y + 1, size: 9, font: bold, color: muted });
        }
        y -= 14;
        if (exp.company.trim()) {
          page.drawText(sanitize(exp.company), { x: M, y, size: 10, font: italic, color: muted });
          y -= 13;
        }
        const bullets = exp.bullets.split('\n').map((b) => sanitize(b.trim())).filter(Boolean);
        for (const bullet of bullets) {
          const wrapped = wrap(bullet, contentW - 14, font, 9.5);
          wrapped.forEach((line, i) => {
            ensureSpace(12);
            if (i === 0) {
              page.drawText('•', { x: M + 2, y, size: 9.5, font, color: ink });
            }
            page.drawText(line, { x: M + 14, y, size: 9.5, font, color: ink });
            y -= 12.5;
          });
        }
        y -= 10;
      }
      y -= 2;
    }

    const eduEntries = education.filter((e) => e.degree.trim() || e.school.trim());
    if (eduEntries.length) {
      drawSectionHeading('Education');
      for (const edu of eduEntries) {
        ensureSpace(26);
        const yearWidth = edu.year ? font.widthOfTextAtSize(edu.year, 9) : 0;
        page.drawText(sanitize(edu.degree || 'Degree'), { x: M, y, size: 10.5, font: bold, color: ink });
        if (edu.year) {
          page.drawText(edu.year, { x: PW - M - yearWidth, y: y + 1, size: 9, font, color: muted });
        }
        y -= 13;
        if (edu.school.trim()) {
          page.drawText(sanitize(edu.school), { x: M, y, size: 9.5, font, color: muted });
          y -= 12;
        }
        y -= 4;
      }
      y -= 2;
    }

    if (skills.trim()) {
      drawSectionHeading('Skills');
      const skillLines = wrap(skills, contentW, font, 10);
      for (const line of skillLines) {
        ensureSpace(13);
        page.drawText(line, { x: M, y, size: 10, font, color: ink });
        y -= 13;
      }
    }

    const bytes = await doc.save();
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: 'application/pdf' });
  }, [fullName, jobTitle, phone, email, location, links, summary, experiences, education, skills, pageSize]);

  // Debounced live preview
  useEffect(() => {
    if (generateTimer.current) window.clearTimeout(generateTimer.current);
    generateTimer.current = window.setTimeout(async () => {
      try {
        const blob = await renderResumePdf();
        revokeBlob();
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setResultUrl(url);
      } catch {
        // Preview failures are non-fatal
      }
    }, 700);
    return () => {
      if (generateTimer.current) window.clearTimeout(generateTimer.current);
    };
  }, [renderResumePdf, revokeBlob]);

  const handleGenerate = useCallback(async () => {
    if (!hasContent) {
      toast.error('Add at least your name and one role or company');
      return;
    }
    setIsProcessing(true);
    setProgress(40);
    try {
      const blob = await renderResumePdf();
      revokeBlob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setResultUrl(url);
      setProgress(100);
      toast.success('Resume PDF ready — download it below');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Resume generation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [hasContent, renderResumePdf, revokeBlob, setIsProcessing, setProgress]);

  const loadSample = useCallback(() => {
    setFullName('Jordan Taylor');
    setJobTitle('Senior Operations Analyst');
    setPhone('(555) 210-4477');
    setEmail('jordan.taylor@email.example');
    setLocation('Chicago, IL');
    setLinks('linkedin.com/in/jordan-taylor');
    setSummary('Operations analyst with 6 years of experience turning messy processes into measurable systems. Specialized in vendor management, workflow automation, and reporting that leadership actually reads.');
    setExperiences([
      {
        role: 'Senior Operations Analyst',
        company: 'Meridian Logistics — Chicago, IL',
        startDate: '2022',
        endDate: 'Present',
        bullets: 'Cut order-processing time 34% by redesigning the intake workflow across 3 teams.\nBuilt automated weekly reporting used by 40+ stakeholders.\nManaged 12 vendor relationships with a combined $2.1M annual spend.',
      },
      {
        role: 'Operations Coordinator',
        company: 'Brightline Retail Group — Chicago, IL',
        startDate: '2019',
        endDate: '2022',
        bullets: 'Coordinated daily fulfillment for 2 regional warehouses (8,000+ orders/month).\nIntroduced SOP documentation that reduced onboarding time from 6 weeks to 3.',
      },
    ]);
    setEducation([
      { degree: 'B.S. Business Administration', school: 'University of Illinois', year: '2019' },
    ]);
    setSkills('Process mapping, SQL reporting, Vendor management, Salesforce, Tableau, Lean operations');
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setFullName('');
    setJobTitle('');
    setPhone('');
    setEmail('');
    setLocation('');
    setLinks('');
    setSummary('');
    setExperiences([{ role: '', company: '', startDate: '', endDate: '', bullets: '' }]);
    setEducation([{ degree: '', school: '', year: '' }]);
    setSkills('');
    revokeBlob();
    setResultUrl(null);
  }, [reset, revokeBlob]);

  const download = () => {
    if (!resultUrl) return;
    const safeName = (fullName || 'resume').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    triggerDownloadWithSmartlink(() => {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `${safeName}-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    });
  };

  if (!activeTool) return null;

  const updateExperience = (index: number, patch: Partial<ExperienceEntry>) => {
    setExperiences((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const inputClass = 'bg-background';

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'ATS-friendly single-column layout that parses reliably in job portals',
          'Renders 100% in your browser — personal data never uploads',
          'No watermark, no account, unlimited resumes · US Letter & A4',
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        {/* ── Form column ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Resume details</h2>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={loadSample}>
              <Wand2 className="w-3.5 h-3.5" /> Load sample
            </Button>
          </div>

          <SectionCard title="Contact header">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rb-name">Full name</Label>
                <Input id="rb-name" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jordan Taylor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rb-title">Professional title</Label>
                <Input id="rb-title" className={inputClass} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Operations Analyst" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rb-phone">Phone</Label>
                <Input id="rb-phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 210-4477" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rb-email">Email</Label>
                <Input id="rb-email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.example" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rb-location">Location</Label>
                <Input id="rb-location" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Chicago, IL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rb-links">LinkedIn / portfolio</Label>
                <Input id="rb-links" className={inputClass} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="linkedin.com/in/you" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Professional summary">
            <textarea
              aria-label="Professional summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none resize-y focus:border-primary/40 text-foreground/90"
              placeholder="2–3 sentences: who you are, your strongest skills, and the value you bring."
            />
          </SectionCard>

          <SectionCard
            title="Experience"
            action={
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-8" onClick={() => setExperiences((p) => [...p, { role: '', company: '', startDate: '', endDate: '', bullets: '' }])}>
                <Plus className="w-3.5 h-3.5" /> Add role
              </Button>
            }
          >
            {experiences.map((exp, index) => (
              <div key={index} className="rounded-xl border border-border/60 p-3 space-y-3 relative">
                {experiences.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove role ${index + 1}`}
                    onClick={() => setExperiences((p) => p.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input className={inputClass} value={exp.role} onChange={(e) => updateExperience(index, { role: e.target.value })} placeholder="Job title" aria-label={`Role ${index + 1} title`} />
                  <Input className={inputClass} value={exp.company} onChange={(e) => updateExperience(index, { company: e.target.value })} placeholder="Company — City" aria-label={`Role ${index + 1} company`} />
                  <Input className={inputClass} value={exp.startDate} onChange={(e) => updateExperience(index, { startDate: e.target.value })} placeholder="Start (2022)" aria-label={`Role ${index + 1} start date`} />
                  <Input className={inputClass} value={exp.endDate} onChange={(e) => updateExperience(index, { endDate: e.target.value })} placeholder="End (Present)" aria-label={`Role ${index + 1} end date`} />
                </div>
                <textarea
                  value={exp.bullets}
                  onChange={(e) => updateExperience(index, { bullets: e.target.value })}
                  rows={3}
                  aria-label={`Role ${index + 1} achievements`}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none resize-y focus:border-primary/40 text-foreground/90"
                  placeholder={'One achievement per line — start with an action verb.\nCut order-processing time 34% by redesigning the intake workflow.'}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Education"
            action={
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-8" onClick={() => setEducation((p) => [...p, { degree: '', school: '', year: '' }])}>
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            }
          >
            {education.map((edu, index) => (
              <div key={index} className="grid sm:grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
                <Input className={inputClass} value={edu.degree} onChange={(e) => setEducation((p) => p.map((x, i) => (i === index ? { ...x, degree: e.target.value } : x)))} placeholder="Degree / certification" aria-label={`Education ${index + 1} degree`} />
                <Input className={inputClass} value={edu.school} onChange={(e) => setEducation((p) => p.map((x, i) => (i === index ? { ...x, school: e.target.value } : x)))} placeholder="School" aria-label={`Education ${index + 1} school`} />
                <Input className={inputClass} value={edu.year} onChange={(e) => setEducation((p) => p.map((x, i) => (i === index ? { ...x, year: e.target.value } : x)))} placeholder="2019" aria-label={`Education ${index + 1} year`} />
                {education.length > 1 ? (
                  <button type="button" aria-label={`Remove education ${index + 1}`} onClick={() => setEducation((p) => p.filter((_, i) => i !== index))} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : <span />}
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Skills">
            <textarea
              aria-label="Skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none resize-y focus:border-primary/40 text-foreground/90"
              placeholder="Comma-separated: Process mapping, SQL reporting, Vendor management…"
            />
          </SectionCard>
        </div>

        {/* ── Preview column ── */}
        <div className="space-y-5 lg:sticky lg:top-24 self-start">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Live preview</h2>
            <span className="text-xs text-muted-foreground">updates as you type</span>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden shadow-premium">
            {resultUrl ? (
              <iframe
                title="Resume PDF preview"
                src={resultUrl}
                className="w-full h-[640px] bg-white"
              />
            ) : (
              <div className="h-[640px] flex flex-col items-center justify-center text-muted-foreground gap-3 p-8 text-center">
                <FileText className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">Your resume preview appears here.</p>
                <p className="text-xs">Start typing on the left, or click “Load sample”.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 space-y-3 shadow-premium">
            <div className="space-y-2">
              <Label htmlFor="rb-page-size">Page size</Label>
              <Select value={pageSize} onValueChange={(v) => setPageSize(v as 'letter' | 'a4')}>
                <SelectTrigger id="rb-page-size" aria-label="Page size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">US Letter</SelectItem>
                  <SelectItem value="a4">A4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20"
              onClick={handleGenerate}
              disabled={isProcessing || !hasContent}
              size="lg"
            >
              {isProcessing ? 'Generating…' : 'Generate Resume PDF'}
            </Button>
            {resultUrl && (
              <Button onClick={download} variant="outline" className="w-full gap-2 rounded-xl font-semibold">
                <Download className="w-4 h-4" /> Download resume PDF
              </Button>
            )}
          </div>

          {resultUrl && (
            <div className="flex flex-col items-center gap-3">
              <SmartlinkButton />
              <ResultScreenAd refreshKey={resultUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
