'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import {
  MessageProcessor,
  STRICT_VALIDATION,
  type ActionMessage,
  type ActionPayload,
  type AgentToRendererMessage,
  type RendererErrorMessage,
  type SurfaceModel,
} from '@a2ui/web_core/v1_0';
import { basicCatalog, injectBasicCatalogStyles } from '@a2ui/web_core/catalogs/basic/v1';
import {
  A2uiSurface,
  MarkdownComponentContext,
  type MarkdownComponentProps,
  type ReactCatalogComponent,
} from '@a2ui/react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

function A2uiSafeMarkdown({ markdown }: MarkdownComponentProps) {
  const lines = markdown.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold tracking-tight text-foreground">
              {renderInlineMarkdown(line.slice(4))}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-extrabold tracking-tight text-foreground">
              {renderInlineMarkdown(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-extrabold tracking-tight text-foreground">
              {renderInlineMarkdown(line.slice(2))}
            </h2>
          );
        }
        return (
          <p key={idx} className="text-sm leading-relaxed text-foreground/90">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

export interface A2uiSurfaceRendererProps {
  messages: AgentToRendererMessage[];
  onActionEnvelope?: (envelope: ActionMessage, rawAction: ActionPayload) => void | Promise<void>;
}

export function A2uiSurfaceRenderer({
  messages,
  onActionEnvelope,
}: A2uiSurfaceRendererProps) {
  const actionCallbackRef = useRef(onActionEnvelope);

  const [validationErrors, setValidationErrors] = useState<RendererErrorMessage[]>([]);
  const [surfaces, setSurfaces] = useState<SurfaceModel<ReactCatalogComponent>[]>([]);

  useEffect(() => {
    actionCallbackRef.current = onActionEnvelope;
  }, [onActionEnvelope]);

  useEffect(() => {
    injectBasicCatalogStyles();
  }, []);

  const [processorBundle] = useState(() => {
    const proc = new MessageProcessor<ReactCatalogComponent>(
      [basicCatalog],
      (action: ActionPayload) => {
        const envelope: ActionMessage = {
          version: '1.0',
          action: {
            name: action.name,
            surfaceId: action.surfaceId,
            sourceComponentId: action.sourceComponentId,
            timestamp: action.timestamp,
            context: action.context,
            ...(action.userMessage ? { userMessage: action.userMessage } : {}),
          },
        };
        void actionCallbackRef.current?.(envelope, action);
      },
      {
        version: '1.0',
        validationConfig: STRICT_VALIDATION,
      },
    );
    const caps = proc.getRendererCapabilities({ versions: ['1.0'] });
    return { processor: proc, capabilityVersions: Object.keys(caps) };
  });

  const { processor, capabilityVersions } = processorBundle;

  useEffect(() => {
    return () => {
      processor.dispose();
    };
  }, [processor]);

  useEffect(() => {
    const existingIds = Array.from(processor.getSurfaces().keys());
    if (existingIds.length > 0) {
      processor.processMessages(
        existingIds.map((surfaceId) => ({
          version: '1.0' as const,
          deleteSurface: { surfaceId },
        })),
      );
    }

    if (messages.length === 0) {
      setValidationErrors([]);
      setSurfaces([]);
      return;
    }

    const errors = processor.processMessagesWithErrors(messages);
    setValidationErrors(errors);
    setSurfaces(Array.from(processor.getSurfaces().values()));
  }, [messages, processor]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {validationErrors.length === 0 ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              A2UI v1.0 · STRICT_VALIDATION Passed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-destructive/40 bg-destructive/10 text-destructive"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {validationErrors.length} Validation Issue(s)
            </Badge>
          )}
          <span className="font-mono text-[11px] text-muted-foreground">
            Catalog: basic/v1 ({capabilityVersions.join(', ')})
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Rendered via @a2ui/react + @a2ui/web_core
        </span>
      </div>

      {validationErrors.length > 0 && (
        <pre className="overflow-auto rounded-xl border border-destructive/30 bg-destructive/5 p-3 font-mono text-xs text-destructive">
          {JSON.stringify(validationErrors, null, 2)}
        </pre>
      )}

      <div
        className="pdfpixels-a2ui-host rounded-2xl border border-border/60 bg-background/70 p-4 md:p-5"
        style={
          {
            '--a2ui-color-background': 'var(--background)',
            '--a2ui-color-on-background': 'var(--foreground)',
            '--a2ui-color-surface': 'var(--card)',
            '--a2ui-color-on-surface': 'var(--card-foreground)',
            '--a2ui-color-primary': 'var(--primary)',
            '--a2ui-color-on-primary': 'var(--primary-foreground)',
            '--a2ui-color-secondary': 'var(--secondary)',
            '--a2ui-color-on-secondary': 'var(--secondary-foreground)',
            '--a2ui-color-border': 'var(--border)',
            '--a2ui-text-caption-color': 'var(--muted-foreground)',
            '--a2ui-border-radius': '0.75rem',
            '--a2ui-card-border-radius': '1rem',
            '--a2ui-card-padding': '1rem',
            '--a2ui-card-margin': '0px',
            '--a2ui-card-box-shadow': '0 1px 2px rgba(13, 21, 38, 0.06)',
            '--a2ui-button-border-radius': '0.625rem',
            '--a2ui-button-padding': '0.45rem 0.9rem',
            '--a2ui-button-margin': '0px',
            '--a2ui-button-font-weight': '600',
            '--a2ui-list-padding': '0px',
            '--a2ui-list-gap': '0.75rem',
            '--a2ui-column-gap': '0.75rem',
            '--a2ui-row-gap': '0.625rem',
            '--a2ui-font-size': '0.875rem',
          } as React.CSSProperties
        }
      >
        <MarkdownComponentContext.Provider value={A2uiSafeMarkdown}>
          {surfaces.map((surface) => (
            <A2uiSurface key={surface.id} surface={surface} />
          ))}
        </MarkdownComponentContext.Provider>
      </div>
    </div>
  );
}
