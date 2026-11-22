import type { AgentToRendererMessage } from '@a2ui/web_core/v1_0';
import { allTools, getToolBySlug, toolCategories, type Tool } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { WORKFLOW_RECIPES, type WorkflowRecipe } from '@/lib/workflow-recipes';
import { LIMITS_LAST_REVIEWED, platformLimits } from '@/lib/limits';
import { absoluteUrl, getHomepageFeaturedTools } from '@/lib/seo';

export const A2UI_PROTOCOL_VERSION = '1.0' as const;
export const A2UI_BASIC_CATALOG_ID =
  'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json' as const;
export const A2UI_A2A_EXTENSION_URI =
  'https://a2ui.org/a2a-extension/a2ui/v1.0' as const;
export const A2UI_MIME_TYPE = 'application/a2ui+json' as const;

export type A2uiSurfaceIntent =
  | 'search_tools'
  | 'recommend_workflow'
  | 'get_tool_details'
  | 'get_platform_limits';

export interface ToolMatchRecord {
  name: string;
  slug: string;
  url: string;
  markdownUrl: string;
  description: string;
  category: string;
  processing: Tool['processing'];
  processingLabel: string;
}

export interface A2uiSurfaceBundle {
  protocolVersion: typeof A2UI_PROTOCOL_VERSION;
  catalogId: typeof A2UI_BASIC_CATALOG_ID;
  extensionUri: typeof A2UI_A2A_EXTENSION_URI;
  mimeType: typeof A2UI_MIME_TYPE;
  surfaceId: string;
  intent: A2uiSurfaceIntent;
  summary: string;
  messages: AgentToRendererMessage[];
}

function formatProcessingLabel(processing: Tool['processing']): string {
  if (processing === 'client') return '100% Browser WebAssembly · Files never leave device';
  if (processing === 'ai') return 'AI Ephemeral Processing · Auto-purged immediately';
  return 'Ephemeral Memory Cloud · Purged immediately after download';
}

function makeSurfaceId(prefix: string, customId?: string): string {
  if (customId && customId.trim()) {
    return customId.trim().slice(0, 80);
  }
  const stamp = Date.now().toString(36);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `pdfpixels-${prefix}-${stamp}-${suffix}`;
}

export function searchPdfPixelsTools(
  query: string,
  category?: string,
  limit = 6,
): ToolMatchRecord[] {
  const q = query.toLowerCase().trim();
  const categoryFilter = (category || '').toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = allTools
    .filter((t) => !categoryFilter || t.category.toLowerCase().includes(categoryFilter))
    .map((t) => {
      const hay = `${t.name} ${t.slug} ${t.description} ${(t.keywords || []).join(' ')}`.toLowerCase();
      let score = 0;
      if (q && hay.includes(q)) score += 10;
      for (const tok of tokens) {
        if (t.name.toLowerCase().includes(tok)) score += 5;
        else if (t.slug.toLowerCase().includes(tok)) score += 4;
        else if (hay.includes(tok)) score += 2;
      }
      if (t.popular) score += 1;
      return { tool: t, score };
    })
    .filter((m) => m.score > 0 || tokens.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const selected =
    scored.length > 0 ? scored.map((m) => m.tool) : getHomepageFeaturedTools().slice(0, limit);

  return selected.map((tool) => ({
    name: tool.name,
    slug: tool.slug,
    url: absoluteUrl(`/tools/${tool.slug}`),
    markdownUrl: absoluteUrl(`/tools/${tool.slug}/markdown`),
    description: tool.description,
    category: toolCategories.find((c) => c.id === tool.category)?.name || tool.category,
    processing: tool.processing,
    processingLabel: formatProcessingLabel(tool.processing),
  }));
}

export function findMatchingWorkflowRecipes(task: string, limit = 2): WorkflowRecipe[] {
  const q = task.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter((tok) => tok.length > 2);

  if (!q) {
    return WORKFLOW_RECIPES.slice(0, limit);
  }

  return WORKFLOW_RECIPES.map((recipe) => {
    const hay = [
      recipe.title,
      recipe.shortTitle,
      recipe.category,
      recipe.badge,
      recipe.description,
      recipe.heroSummary,
      ...recipe.steps.map((s) => `${s.title} ${s.subtitle} ${s.toolSlug}`),
    ]
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    for (const tok of tokens) {
      if (recipe.title.toLowerCase().includes(tok)) score += 5;
      else if (hay.includes(tok)) score += 2;
    }
    return { recipe, score };
  })
    .filter((entry) => entry.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

/**
 * Builds an A2UI v1.0 surface displaying interactive PdfPixels tool search results
 * using the v1.0 Basic Catalog (single-message createSurface with inline components & dataModel).
 */
export function buildToolSearchA2uiSurface(options: {
  query?: string;
  category?: string;
  limit?: number;
  surfaceId?: string;
}): A2uiSurfaceBundle {
  const rawQuery = (options.query || '').trim();
  const displayQuery = rawQuery || 'popular PDF & image tools';
  const matches = searchPdfPixelsTools(rawQuery, options.category, options.limit ?? 6);
  const surfaceId = makeSurfaceId('search', options.surfaceId);

  const messages: AgentToRendererMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId,
        catalogId: A2UI_BASIC_CATALOG_ID,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['headerCard', 'resultsList', 'footerActions'],
          },
          {
            id: 'headerCard',
            component: 'Card',
            child: 'headerCol',
          },
          {
            id: 'headerCol',
            component: 'Column',
            children: ['headerTitle', 'headerSubtitle'],
          },
          {
            id: 'headerTitle',
            component: 'Text',
            text: {
              '@call': 'formatString',
              args: {
                value: '### PdfPixels Matches for "${/query}"',
              },
            },
            variant: 'body',
          },
          {
            id: 'headerSubtitle',
            component: 'Text',
            text: {
              '@call': 'formatString',
              args: {
                value:
                  'Showing ${/count} of ${/totalTools}+ free online tools — $0, no signup, no watermarks.',
              },
            },
            variant: 'caption',
          },
          {
            id: 'resultsList',
            component: 'List',
            direction: 'vertical',
            children: {
              path: '/tools',
              componentId: 'toolCard',
            },
          },
          {
            id: 'toolCard',
            component: 'Card',
            child: 'toolCardCol',
          },
          {
            id: 'toolCardCol',
            component: 'Column',
            children: ['toolHeaderRow', 'toolDescription', 'toolButtonsRow'],
          },
          {
            id: 'toolHeaderRow',
            component: 'Row',
            justify: 'spaceBetween',
            align: 'center',
            children: ['toolName', 'toolCategory'],
          },
          {
            id: 'toolName',
            component: 'Text',
            text: {
              '@call': 'formatString',
              args: { value: '**${name}**' },
            },
            variant: 'body',
          },
          {
            id: 'toolCategory',
            component: 'Text',
            text: { '@path': 'processingLabel' },
            variant: 'caption',
          },
          {
            id: 'toolDescription',
            component: 'Text',
            text: { '@path': 'description' },
            variant: 'body',
          },
          {
            id: 'toolButtonsRow',
            component: 'Row',
            justify: 'start',
            align: 'center',
            children: ['openToolBtn', 'inspectToolBtn'],
          },
          {
            id: 'openToolBtn',
            component: 'Button',
            variant: 'primary',
            child: 'openToolBtnText',
            accessibility: {
              label: {
                '@call': 'formatString',
                args: { value: 'Open ${name} on PdfPixels' },
              },
            },
            action: {
              functionCall: {
                '@call': 'openUrl',
                args: {
                  url: { '@path': 'url' },
                },
              },
            },
          },
          {
            id: 'openToolBtnText',
            component: 'Text',
            text: 'Launch Tool',
          },
          {
            id: 'inspectToolBtn',
            component: 'Button',
            variant: 'default',
            child: 'inspectToolBtnText',
            accessibility: {
              label: {
                '@call': 'formatString',
                args: { value: 'Inspect details for ${name}' },
              },
            },
            action: {
              event: {
                name: 'get_tool_details',
                userMessage: {
                  '@call': 'formatString',
                  args: { value: 'Show full steps, limits, and FAQs for ${name}' },
                },
                context: {
                  slug: { '@path': 'slug' },
                  name: { '@path': 'name' },
                },
              },
            },
          },
          {
            id: 'inspectToolBtnText',
            component: 'Text',
            text: 'Inspect Details',
          },
          {
            id: 'footerActions',
            component: 'Row',
            justify: 'start',
            align: 'center',
            children: ['limitsBtn', 'directoryBtn'],
          },
          {
            id: 'limitsBtn',
            component: 'Button',
            variant: 'default',
            child: 'limitsBtnText',
            action: {
              event: {
                name: 'get_platform_limits',
                userMessage: 'Show PdfPixels upload limits and privacy guarantees',
                context: { source: 'tool_search' },
              },
            },
          },
          {
            id: 'limitsBtnText',
            component: 'Text',
            text: 'View Limits & Privacy',
          },
          {
            id: 'directoryBtn',
            component: 'Button',
            variant: 'borderless',
            child: 'directoryBtnText',
            action: {
              functionCall: {
                '@call': 'openUrl',
                args: {
                  url: { '@path': '/directoryUrl' },
                },
              },
            },
          },
          {
            id: 'directoryBtnText',
            component: 'Text',
            text: 'Browse All Tools ->',
          },
        ],
        dataModel: {
          query: displayQuery,
          count: matches.length,
          totalTools: allTools.length,
          directoryUrl: absoluteUrl('/tools'),
          tools: matches,
        },
      },
    },
  ];

  return {
    protocolVersion: A2UI_PROTOCOL_VERSION,
    catalogId: A2UI_BASIC_CATALOG_ID,
    extensionUri: A2UI_A2A_EXTENSION_URI,
    mimeType: A2UI_MIME_TYPE,
    surfaceId,
    intent: 'search_tools',
    summary: `Found ${matches.length} PdfPixels tool matches for "${displayQuery}".`,
    messages,
  };
}

/**
 * Builds an A2UI v1.0 surface with full specifications, steps, FAQs, and launch CTAs for one tool.
 */
export function buildToolDetailsA2uiSurface(options: {
  slug: string;
  surfaceId?: string;
}): A2uiSurfaceBundle {
  const normalizedSlug = options.slug.trim().toLowerCase();
  const tool = getToolBySlug(normalizedSlug) || getHomepageFeaturedTools()[0];
  const category = toolCategories.find((c) => c.id === tool.category);
  const tc = toolContentMap[tool.slug];
  const surfaceId = makeSurfaceId(`tool-${tool.slug}`, options.surfaceId);

  const steps = (
    tc?.steps?.length
      ? tc.steps
      : [
          {
            title: 'Upload Your File',
            description: `Open ${tool.name} and select your PDF or image directly in your browser.`,
          },
          {
            title: 'Configure Settings',
            description: 'Adjust compression, target size, or conversion options as needed.',
          },
          {
            title: 'Process & Download',
            description: 'Download your processed file immediately with zero watermarks.',
          },
        ]
  ).map((step, idx) => ({
    heading: `**${idx + 1}. ${step.title}**`,
    detail: step.description,
  }));

  const faqs = (tc?.faqs || []).slice(0, 3).map((faq) => ({
    question: `**Q: ${faq.question}**`,
    answer: faq.answer,
  }));

  const rootChildren = ['heroCard', 'stepsCard', ...(faqs.length > 0 ? ['faqsCard'] : []), 'navRow'];

  const components: Record<string, unknown>[] = [
    {
      id: 'root',
      component: 'Column',
      children: rootChildren,
    },
    {
      id: 'heroCard',
      component: 'Card',
      child: 'heroCol',
    },
    {
      id: 'heroCol',
      component: 'Column',
      children: ['toolTitle', 'toolMeta', 'toolDesc', 'primaryRow'],
    },
    {
      id: 'toolTitle',
      component: 'Text',
      text: {
        '@call': 'formatString',
        args: { value: '## ${/name}' },
      },
      variant: 'body',
    },
    {
      id: 'toolMeta',
      component: 'Text',
      text: {
        '@call': 'formatString',
        args: { value: '${/category} · ${/processingLabel} · Max PDF ${/maxPdfMb} MB / Image ${/maxImageMb} MB' },
      },
      variant: 'caption',
    },
    {
      id: 'toolDesc',
      component: 'Text',
      text: { '@path': '/description' },
      variant: 'body',
    },
    {
      id: 'primaryRow',
      component: 'Row',
      justify: 'start',
      align: 'center',
      children: ['launchBtn', 'markdownBtn'],
    },
    {
      id: 'launchBtn',
      component: 'Button',
      variant: 'primary',
      child: 'launchBtnText',
      action: {
        functionCall: {
          '@call': 'openUrl',
          args: { url: { '@path': '/url' } },
        },
      },
    },
    {
      id: 'launchBtnText',
      component: 'Text',
      text: 'Open Tool Workspace',
    },
    {
      id: 'markdownBtn',
      component: 'Button',
      variant: 'default',
      child: 'markdownBtnText',
      action: {
        functionCall: {
          '@call': 'openUrl',
          args: { url: { '@path': '/markdownUrl' } },
        },
      },
    },
    {
      id: 'markdownBtnText',
      component: 'Text',
      text: 'Read Markdown Spec',
    },
    {
      id: 'stepsCard',
      component: 'Card',
      child: 'stepsCol',
    },
    {
      id: 'stepsCol',
      component: 'Column',
      children: ['stepsHeading', 'stepsList'],
    },
    {
      id: 'stepsHeading',
      component: 'Text',
      text: '### Step-by-Step Usage',
      variant: 'body',
    },
    {
      id: 'stepsList',
      component: 'List',
      direction: 'vertical',
      children: {
        path: '/steps',
        componentId: 'stepItem',
      },
    },
    {
      id: 'stepItem',
      component: 'Column',
      children: ['stepTitle', 'stepDetail'],
    },
    {
      id: 'stepTitle',
      component: 'Text',
      text: { '@path': 'heading' },
      variant: 'body',
    },
    {
      id: 'stepDetail',
      component: 'Text',
      text: { '@path': 'detail' },
      variant: 'caption',
    },
  ];

  if (faqs.length > 0) {
    components.push(
      {
        id: 'faqsCard',
        component: 'Card',
        child: 'faqsCol',
      },
      {
        id: 'faqsCol',
        component: 'Column',
        children: ['faqsHeading', 'faqsList'],
      },
      {
        id: 'faqsHeading',
        component: 'Text',
        text: '### Frequently Asked Questions',
        variant: 'body',
      },
      {
        id: 'faqsList',
        component: 'List',
        direction: 'vertical',
        children: {
          path: '/faqs',
          componentId: 'faqItem',
        },
      },
      {
        id: 'faqItem',
        component: 'Column',
        children: ['faqQuestion', 'faqAnswer'],
      },
      {
        id: 'faqQuestion',
        component: 'Text',
        text: { '@path': 'question' },
        variant: 'body',
      },
      {
        id: 'faqAnswer',
        component: 'Text',
        text: { '@path': 'answer' },
        variant: 'caption',
      },
    );
  }

  components.push(
    {
      id: 'navRow',
      component: 'Row',
      justify: 'start',
      align: 'center',
      children: ['backSearchBtn', 'viewLimitsBtn'],
    },
    {
      id: 'backSearchBtn',
      component: 'Button',
      variant: 'default',
      child: 'backSearchBtnText',
      action: {
        event: {
          name: 'search_tools',
          userMessage: 'Return to PdfPixels tool search results',
          context: { query: tool.name },
        },
      },
    },
    {
      id: 'backSearchBtnText',
      component: 'Text',
      text: 'Find Similar Tools',
    },
    {
      id: 'viewLimitsBtn',
      component: 'Button',
      variant: 'borderless',
      child: 'viewLimitsBtnText',
      action: {
        event: {
          name: 'get_platform_limits',
          userMessage: 'Check PdfPixels upload limits and retention guarantees',
          context: { slug: tool.slug },
        },
      },
    },
    {
      id: 'viewLimitsBtnText',
      component: 'Text',
      text: 'Check Upload Limits',
    },
  );

  const messages: AgentToRendererMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId,
        catalogId: A2UI_BASIC_CATALOG_ID,
        components,
        dataModel: {
          name: tool.name,
          slug: tool.slug,
          category: category?.name || tool.category,
          description: tool.description,
          processingLabel: formatProcessingLabel(tool.processing),
          maxPdfMb: platformLimits.pdf.maxFileMb,
          maxImageMb: platformLimits.image.maxFileMb,
          url: absoluteUrl(`/tools/${tool.slug}`),
          markdownUrl: absoluteUrl(`/tools/${tool.slug}/markdown`),
          steps,
          faqs,
        },
      },
    },
  ];

  return {
    protocolVersion: A2UI_PROTOCOL_VERSION,
    catalogId: A2UI_BASIC_CATALOG_ID,
    extensionUri: A2UI_A2A_EXTENSION_URI,
    mimeType: A2UI_MIME_TYPE,
    surfaceId,
    intent: 'get_tool_details',
    summary: `Detailed A2UI v1.0 specification card for ${tool.name} (${tool.slug}).`,
    messages,
  };
}

/**
 * Builds an A2UI v1.0 workflow recommendation surface combining multi-step pipeline recipes
 * with top matching single-step PdfPixels tools.
 */
export function buildWorkflowRecommendationA2uiSurface(options: {
  task?: string;
  surfaceId?: string;
}): A2uiSurfaceBundle {
  const rawTask = (options.task || '').trim();
  const displayTask = rawTask || 'compress and organize PDF documents';
  const recipes = findMatchingWorkflowRecipes(rawTask, 2);
  const tools = searchPdfPixelsTools(rawTask, undefined, 4);
  const surfaceId = makeSurfaceId('workflow', options.surfaceId);

  const recipeData = recipes.map((recipe) => ({
    title: `**${recipe.title}**`,
    meta: `${recipe.category} · ${recipe.badge} · ${recipe.steps.length} automated steps`,
    summary: recipe.description,
    stepsLine: recipe.steps.map((s, idx) => `${idx + 1}. ${s.title}`).join('  ->  '),
    url: absoluteUrl(`/workflows/${recipe.slug}`),
  }));

  const hasRecipes = recipeData.length > 0;
  const rootChildren = [
    'goalCard',
    ...(hasRecipes ? ['recipesHeading', 'recipesList', 'sectionDivider'] : []),
    'toolsHeading',
    'toolsList',
  ];

  const components: Record<string, unknown>[] = [
    {
      id: 'root',
      component: 'Column',
      children: rootChildren,
    },
    {
      id: 'goalCard',
      component: 'Card',
      child: 'goalCol',
    },
    {
      id: 'goalCol',
      component: 'Column',
      children: ['goalTitle', 'goalCaption'],
    },
    {
      id: 'goalTitle',
      component: 'Text',
      text: {
        '@call': 'formatString',
        args: { value: '### Recommended Workflow for "${/task}"' },
      },
      variant: 'body',
    },
    {
      id: 'goalCaption',
      component: 'Text',
      text: {
        '@call': 'formatString',
        args: {
          value:
            'Matched ${/recipeCount} chained pipeline(s) and ${/toolCount} direct browser-first tools.',
        },
      },
      variant: 'caption',
    },
  ];

  if (hasRecipes) {
    components.push(
      {
        id: 'recipesHeading',
        component: 'Text',
        text: '**Multi-Step Automated Pipelines**',
        variant: 'body',
      },
      {
        id: 'recipesList',
        component: 'List',
        direction: 'vertical',
        children: {
          path: '/recipes',
          componentId: 'recipeCard',
        },
      },
      {
        id: 'recipeCard',
        component: 'Card',
        child: 'recipeCol',
      },
      {
        id: 'recipeCol',
        component: 'Column',
        children: ['recipeTitle', 'recipeMeta', 'recipeSummary', 'recipeSteps', 'recipeBtn'],
      },
      {
        id: 'recipeTitle',
        component: 'Text',
        text: { '@path': 'title' },
        variant: 'body',
      },
      {
        id: 'recipeMeta',
        component: 'Text',
        text: { '@path': 'meta' },
        variant: 'caption',
      },
      {
        id: 'recipeSummary',
        component: 'Text',
        text: { '@path': 'summary' },
        variant: 'body',
      },
      {
        id: 'recipeSteps',
        component: 'Text',
        text: { '@path': 'stepsLine' },
        variant: 'caption',
      },
      {
        id: 'recipeBtn',
        component: 'Button',
        variant: 'primary',
        child: 'recipeBtnText',
        action: {
          functionCall: {
            '@call': 'openUrl',
            args: { url: { '@path': 'url' } },
          },
        },
      },
      {
        id: 'recipeBtnText',
        component: 'Text',
        text: 'Open Automated Pipeline',
      },
      {
        id: 'sectionDivider',
        component: 'Divider',
        axis: 'horizontal',
      },
    );
  }

  components.push(
    {
      id: 'toolsHeading',
      component: 'Text',
      text: '**Direct Single-Step Tools**',
      variant: 'body',
    },
    {
      id: 'toolsList',
      component: 'List',
      direction: 'vertical',
      children: {
        path: '/tools',
        componentId: 'wfToolCard',
      },
    },
    {
      id: 'wfToolCard',
      component: 'Card',
      child: 'wfToolCol',
    },
    {
      id: 'wfToolCol',
      component: 'Column',
      children: ['wfToolName', 'wfToolMode', 'wfToolDesc', 'wfToolActions'],
    },
    {
      id: 'wfToolName',
      component: 'Text',
      text: {
        '@call': 'formatString',
        args: { value: '**${name}**' },
      },
      variant: 'body',
    },
    {
      id: 'wfToolMode',
      component: 'Text',
      text: { '@path': 'processingLabel' },
      variant: 'caption',
    },
    {
      id: 'wfToolDesc',
      component: 'Text',
      text: { '@path': 'description' },
      variant: 'body',
    },
    {
      id: 'wfToolActions',
      component: 'Row',
      justify: 'start',
      align: 'center',
      children: ['wfOpenBtn', 'wfInspectBtn'],
    },
    {
      id: 'wfOpenBtn',
      component: 'Button',
      variant: 'primary',
      child: 'wfOpenBtnText',
      action: {
        functionCall: {
          '@call': 'openUrl',
          args: { url: { '@path': 'url' } },
        },
      },
    },
    {
      id: 'wfOpenBtnText',
      component: 'Text',
      text: 'Open Tool',
    },
    {
      id: 'wfInspectBtn',
      component: 'Button',
      variant: 'default',
      child: 'wfInspectBtnText',
      action: {
        event: {
          name: 'get_tool_details',
          userMessage: {
            '@call': 'formatString',
            args: { value: 'Inspect ${name} workflow details' },
          },
          context: {
            slug: { '@path': 'slug' },
            name: { '@path': 'name' },
          },
        },
      },
    },
    {
      id: 'wfInspectBtnText',
      component: 'Text',
      text: 'Inspect Details',
    },
  );

  const messages: AgentToRendererMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId,
        catalogId: A2UI_BASIC_CATALOG_ID,
        components,
        dataModel: {
          task: displayTask,
          recipeCount: recipeData.length,
          toolCount: tools.length,
          recipes: recipeData,
          tools,
        },
      },
    },
  ];

  return {
    protocolVersion: A2UI_PROTOCOL_VERSION,
    catalogId: A2UI_BASIC_CATALOG_ID,
    extensionUri: A2UI_A2A_EXTENSION_URI,
    mimeType: A2UI_MIME_TYPE,
    surfaceId,
    intent: 'recommend_workflow',
    summary: `Recommended ${recipeData.length} workflow pipeline(s) and ${tools.length} tool(s) for "${displayTask}".`,
    messages,
  };
}

/**
 * Builds a tabbed A2UI v1.0 surface summarizing PdfPixels' verified processing limits
 * and zero-retention privacy architecture from `src/lib/limits.ts`.
 */
export function buildPlatformLimitsA2uiSurface(options?: {
  surfaceId?: string;
}): A2uiSurfaceBundle {
  const l = platformLimits;
  const surfaceId = makeSurfaceId('limits', options?.surfaceId);

  const messages: AgentToRendererMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId,
        catalogId: A2UI_BASIC_CATALOG_ID,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['limitsHeaderCard', 'limitsTabs', 'limitsFooterRow'],
          },
          {
            id: 'limitsHeaderCard',
            component: 'Card',
            child: 'limitsHeaderCol',
          },
          {
            id: 'limitsHeaderCol',
            component: 'Column',
            children: ['limitsTitle', 'limitsSubtitle'],
          },
          {
            id: 'limitsTitle',
            component: 'Text',
            text: '### PdfPixels Verified Limits & Privacy Architecture',
            variant: 'body',
          },
          {
            id: 'limitsSubtitle',
            component: 'Text',
            text: {
              '@call': 'formatString',
              args: {
                value:
                  'Single source of truth verified ${/reviewedAt} · ${/totalTools}+ tools · $0 forever.',
              },
            },
            variant: 'caption',
          },
          {
            id: 'limitsTabs',
            component: 'Tabs',
            tabs: [
              { title: 'PDF Limits', child: 'pdfTabCard' },
              { title: 'Image & AI', child: 'imageTabCard' },
              { title: 'Privacy & Rate Limits', child: 'privacyTabCard' },
            ],
          },
          {
            id: 'pdfTabCard',
            component: 'Card',
            child: 'pdfTabCol',
          },
          {
            id: 'pdfTabCol',
            component: 'Column',
            children: ['pdfMaxText', 'pdfMergeText', 'pdfSplitText', 'pdfOcrText'],
          },
          {
            id: 'pdfMaxText',
            component: 'Text',
            text: { '@path': '/pdf/standard' },
            variant: 'body',
          },
          {
            id: 'pdfMergeText',
            component: 'Text',
            text: { '@path': '/pdf/merge' },
            variant: 'body',
          },
          {
            id: 'pdfSplitText',
            component: 'Text',
            text: { '@path': '/pdf/split' },
            variant: 'body',
          },
          {
            id: 'pdfOcrText',
            component: 'Text',
            text: { '@path': '/pdf/ocr' },
            variant: 'body',
          },
          {
            id: 'imageTabCard',
            component: 'Card',
            child: 'imageTabCol',
          },
          {
            id: 'imageTabCol',
            component: 'Column',
            children: ['imageMaxText', 'imageOcrText', 'aiMaxText'],
          },
          {
            id: 'imageMaxText',
            component: 'Text',
            text: { '@path': '/image/standard' },
            variant: 'body',
          },
          {
            id: 'imageOcrText',
            component: 'Text',
            text: { '@path': '/image/ocr' },
            variant: 'body',
          },
          {
            id: 'aiMaxText',
            component: 'Text',
            text: { '@path': '/image/ai' },
            variant: 'body',
          },
          {
            id: 'privacyTabCard',
            component: 'Card',
            child: 'privacyTabCol',
          },
          {
            id: 'privacyTabCol',
            component: 'Column',
            children: ['privacyLocalText', 'privacyRetentionText', 'rateLimitText'],
          },
          {
            id: 'privacyLocalText',
            component: 'Text',
            text: { '@path': '/privacy/localFirst' },
            variant: 'body',
          },
          {
            id: 'privacyRetentionText',
            component: 'Text',
            text: { '@path': '/privacy/retention' },
            variant: 'body',
          },
          {
            id: 'rateLimitText',
            component: 'Text',
            text: { '@path': '/privacy/rateLimits' },
            variant: 'body',
          },
          {
            id: 'limitsFooterRow',
            component: 'Row',
            justify: 'start',
            align: 'center',
            children: ['openPrivacyBtn', 'openSearchBtn'],
          },
          {
            id: 'openPrivacyBtn',
            component: 'Button',
            variant: 'primary',
            child: 'openPrivacyBtnText',
            action: {
              functionCall: {
                '@call': 'openUrl',
                args: { url: { '@path': '/privacyUrl' } },
              },
            },
          },
          {
            id: 'openPrivacyBtnText',
            component: 'Text',
            text: 'Read Privacy Architecture',
          },
          {
            id: 'openSearchBtn',
            component: 'Button',
            variant: 'default',
            child: 'openSearchBtnText',
            action: {
              event: {
                name: 'search_tools',
                userMessage: 'Browse popular PdfPixels tools',
                context: { query: 'compress pdf' },
              },
            },
          },
          {
            id: 'openSearchBtnText',
            component: 'Text',
            text: 'Search Tools',
          },
        ],
        dataModel: {
          reviewedAt: LIMITS_LAST_REVIEWED,
          totalTools: allTools.length,
          privacyUrl: absoluteUrl('/privacy'),
          pdf: {
            standard: `**Standard PDF Upload:** Up to **${l.pdf.maxFileMb} MB** per file across core PDF tools.`,
            merge: `**Merge PDF:** Up to **${l.pdf.merge.maxFiles} files**, **${l.pdf.merge.maxTotalMb} MB** combined, **${l.pdf.merge.maxTotalPages.toLocaleString('en-US')} pages** max.`,
            split: `**Split PDF:** All-pages ZIP up to **${l.pdf.split.splitAllTruncatedAtPages} pages**; range extract up to **${l.pdf.split.extractMaxPages} pages**; split-by-size up to **${l.pdf.split.bySizeMaxMb} MB** / ${l.pdf.split.bySizeMaxParts} parts.`,
            ocr: `**OCR PDF:** Up to **${l.pdf.ocr.maxPagesPerRun} pages/run** (hard cap ${l.pdf.ocr.hardCapPages} pages, ${l.pdf.ocr.budgetSeconds}s budget); text-layer PDFs extract instantaneously.`,
          },
          image: {
            standard: `**Image Processing:** Up to **${l.image.maxFileMb} MB**, **${l.image.maxMegapixels} MP**, **${l.image.maxDimensionPx.toLocaleString('en-US')} px** per edge; exact-KB compression up to ${l.image.targetSizeCapMb} MB target.`,
            ocr: `**Image OCR & HEIC:** Image OCR up to **${l.image.ocr.maxFileMb} MB**; HEIC/HEIF conversion up to **${l.image.heic.maxFileMb} MB**.`,
            ai: `**AI Image Tools:** Up to **${l.ai.maxFileMb} MB** and **${l.ai.maxEdgePx.toLocaleString('en-US')} px** longest edge.`,
          },
          privacy: {
            localFirst:
              '**Browser-First Execution:** Up to 80% of tools execute 100% locally via WebAssembly (`pdf-lib`, `pdfjs-dist`, `tesseract.js`, Canvas) so files never leave your device.',
            retention: `**Zero-Retention Ephemeral Cloud:** ${l.retention.serverTempFilesNote}`,
            rateLimits: `**Fair-Use Rate Limits:** ${l.rateLimits.processingPerRoutePerMinute} requests/min per heavy processing route per IP, ${l.rateLimits.globalPerMinute} requests/min global.`,
          },
        },
      },
    },
  ];

  return {
    protocolVersion: A2UI_PROTOCOL_VERSION,
    catalogId: A2UI_BASIC_CATALOG_ID,
    extensionUri: A2UI_A2A_EXTENSION_URI,
    mimeType: A2UI_MIME_TYPE,
    surfaceId,
    intent: 'get_platform_limits',
    summary: `PdfPixels verified processing limits (PDF ${l.pdf.maxFileMb} MB, Image ${l.image.maxFileMb} MB) and zero-retention architecture.`,
    messages,
  };
}

/**
 * Checks renderer-advertised `a2uiRendererCapabilities` (v1.0 format) to verify compatibility
 * with PdfPixels' v1.0 Basic Catalog surfaces.
 */
export function supportsA2uiV10BasicCatalog(
  capabilities: unknown,
): { supported: boolean; reason?: string } {
  if (!capabilities || typeof capabilities !== 'object') {
    return { supported: true };
  }

  const record = capabilities as Record<string, unknown>;

  // Standard v1.0 MessageProcessor.getRendererCapabilities({ versions: ['1.0'] }) shape:
  // { "1.0": { supportedCatalogIds: [...] } }
  const v10Block = record['1.0'] as Record<string, unknown> | undefined;
  const catalogIds = Array.isArray(v10Block?.supportedCatalogIds)
    ? v10Block.supportedCatalogIds
    : Array.isArray(record.supportedCatalogIds)
      ? record.supportedCatalogIds
      : null;

  if (!catalogIds) {
    // Renderer advertised versions map without "1.0"
    const keys = Object.keys(record);
    if (keys.length > 0 && !('1.0' in record)) {
      return {
        supported: false,
        reason: `Renderer capabilities (${keys.join(', ')}) do not include A2UI protocol version "1.0".`,
      };
    }
    return { supported: true };
  }

  if (catalogIds.includes(A2UI_BASIC_CATALOG_ID)) {
    return { supported: true };
  }

  return {
    supported: false,
    reason: `Renderer supportedCatalogIds do not include required v1.0 basic catalog (${A2UI_BASIC_CATALOG_ID}).`,
  };
}

export function buildA2uiServiceDescriptor() {
  return {
    name: 'pdfpixels-a2ui-agent',
    title: 'PdfPixels Google A2UI v1.0 Interactive Surface Endpoint',
    protocolVersion: A2UI_PROTOCOL_VERSION,
    extensionUri: A2UI_A2A_EXTENSION_URI,
    mimeType: A2UI_MIME_TYPE,
    endpoint: absoluteUrl('/api/a2ui'),
    mcpEndpoint: absoluteUrl('/api/mcp'),
    agentCardUrl: absoluteUrl('/.well-known/agent.json'),
    supportedCatalogIds: [A2UI_BASIC_CATALOG_ID],
    actions: [
      {
        name: 'search_tools',
        description: 'Generate an interactive A2UI v1.0 tool search surface.',
        params: ['query', 'category', 'limit'],
      },
      {
        name: 'recommend_workflow',
        description: 'Generate an A2UI v1.0 multi-step workflow & tool recommendation surface.',
        params: ['task'],
      },
      {
        name: 'get_tool_details',
        description: 'Generate an A2UI v1.0 detail card with steps, FAQs, and launch actions for one tool.',
        params: ['slug'],
      },
      {
        name: 'get_platform_limits',
        description: 'Generate a tabbed A2UI v1.0 platform limits & zero-retention privacy surface.',
        params: [],
      },
    ],
  };
}

/**
 * Resolves either a standard A2UI v1.0 Client-to-Server ActionMessage envelope OR a direct
 * intent payload into a validated A2UI v1.0 surface bundle.
 */
export function resolveA2uiRequest(body: Record<string, unknown>): A2uiSurfaceBundle {
  // 1. Standard A2UI v1.0 ActionMessage envelope:
  //    { version: "1.0", action: { name, surfaceId, sourceComponentId, timestamp, context } }
  const actionObj =
    body.action && typeof body.action === 'object'
      ? (body.action as Record<string, unknown>)
      : null;

  const rawIntent = String(
    actionObj?.name ?? (typeof body.action === 'string' ? body.action : undefined) ?? body.intent ?? 'search_tools',
  )
    .trim()
    .toLowerCase();

  const ctx = (
    actionObj?.context && typeof actionObj.context === 'object'
      ? actionObj.context
      : body
  ) as Record<string, unknown>;

  const surfaceId =
    typeof body.surfaceId === 'string' && body.surfaceId.trim()
      ? body.surfaceId.trim()
      : undefined;

  if (
    rawIntent === 'get_tool_details' ||
    rawIntent === 'get_pdfpixels_tool_details' ||
    rawIntent === 'tool_details'
  ) {
    const slug = String(ctx.slug || body.slug || 'compress-pdf');
    return buildToolDetailsA2uiSurface({ slug, surfaceId });
  }

  if (
    rawIntent === 'recommend_workflow' ||
    rawIntent === 'recommend_pdfpixels_workflow' ||
    rawIntent === 'workflow'
  ) {
    const task = String(ctx.task || ctx.query || body.task || body.query || '');
    return buildWorkflowRecommendationA2uiSurface({ task, surfaceId });
  }

  if (
    rawIntent === 'get_platform_limits' ||
    rawIntent === 'get_pdfpixels_limits' ||
    rawIntent === 'limits'
  ) {
    return buildPlatformLimitsA2uiSurface({ surfaceId });
  }

  const query = String(ctx.query || ctx.task || body.query || body.task || '');
  const category = typeof ctx.category === 'string' ? ctx.category : typeof body.category === 'string' ? body.category : undefined;
  const rawLimit = Number(ctx.limit ?? body.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 12) : 6;

  return buildToolSearchA2uiSurface({ query, category, limit, surfaceId });
}
