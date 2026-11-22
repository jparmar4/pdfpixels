'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  FilePlus2,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import type { PiiCategory } from '@/lib/pii-patterns';
import { getWorkflowRecipe } from '@/lib/workflow-recipes';
import {
  executeWorkflowRecipe,
  generateSampleFilesForRecipe,
  type IntermediateCheckpoint,
  type PipelineExecutionResult,
  type WorkflowRuntimeConfig,
} from '@/lib/workflow-runner-engine';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function WorkflowPipelineRunner({ slug }: { slug: string }) {
  const recipe = useMemo(() => getWorkflowRecipe(slug), [slug]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [checkpoints, setCheckpoints] = useState<IntermediateCheckpoint[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineExecutionResult | null>(null);

  // Contextual per-recipe runtime config
  const [batesPrefix, setBatesPrefix] = useState('FED-');
  const [batesStart, setBatesStart] = useState(1);
  const [contractParty, setContractParty] = useState('Acme Client LLC');
  const [signerName, setSignerName] = useState('Alex Morgan');
  const [signerEmail, setSignerEmail] = useState('');
  const [protectPassword, setProtectPassword] = useState('');
  const [bankPdfPassword, setBankPdfPassword] = useState('');
  const [carrierPreset, setCarrierPreset] = useState('usps');
  const [piiCats, setPiiCats] = useState<PiiCategory[]>(['ssn', 'ein', 'card', 'phone', 'email', 'iban']);

  const revokeResultUrls = useCallback((res: PipelineExecutionResult | null) => {
    if (!res) return;
    if (res.primaryUrl.startsWith('blob:')) URL.revokeObjectURL(res.primaryUrl);
    for (const c of res.companionFiles) {
      if (c.url.startsWith('blob:')) URL.revokeObjectURL(c.url);
    }
  }, []);

  useEffect(() => {
    return () => revokeResultUrls(result);
  }, [result, revokeResultUrls]);

  if (!recipe) return null;

  const totalInputBytes = files.reduce((s, f) => s + f.size, 0);

  const handleAddFiles = (incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return;
    const picked = Array.from(incoming);
    setErrorMsg(null);
    setResult((prev) => {
      revokeResultUrls(prev);
      return null;
    });
    setCheckpoints([]);
    setActiveStepIndex(null);

    if (!recipe.multiple) {
      setFiles([picked[0]]);
    } else {
      setFiles((prev) => [...prev, ...picked].slice(0, recipe.maxFiles));
    }
  };

  const handleLoadSample = async () => {
    try {
      const sample = await generateSampleFilesForRecipe(recipe.slug);
      setErrorMsg(null);
      setResult((prev) => {
        revokeResultUrls(prev);
        return null;
      });
      setCheckpoints([]);
      setActiveStepIndex(null);
      setFiles(sample);
      toast.success(`Loaded sample input for ${recipe.shortTitle}`);
    } catch {
      toast.error('Could not generate sample input file.');
    }
  };

  const handleRunPipeline = async () => {
    if (files.length === 0 || isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);
    setCheckpoints([]);
    setActiveStepIndex(0);
    setResult((prev) => {
      revokeResultUrls(prev);
      return null;
    });

    const runtimeConfig: WorkflowRuntimeConfig = {
      batesPrefix,
      batesStart,
      contractParty,
      signerName,
      signerEmail,
      protectPassword,
      bankPdfPassword,
      carrierPreset,
      piiCategories: piiCats,
    };

    try {
      const output = await executeWorkflowRecipe(recipe.slug, files, runtimeConfig, {
        onStepStart: (idx) => setActiveStepIndex(idx),
        onStepComplete: (_idx, cp) => setCheckpoints((prev) => [...prev, cp]),
      });
      setActiveStepIndex(recipe.steps.length);
      setResult(output);
      toast.success(`${recipe.shortTitle} completed (${recipe.steps.length}/${recipe.steps.length} steps)!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pipeline execution failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadPrimary = () => {
    if (!result) return;
    const savedPct =
      totalInputBytes > 0
        ? Math.max(0, Math.round(((totalInputBytes - result.primaryFile.size) / totalInputBytes) * 100))
        : 0;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = result.primaryUrl;
        a.download = result.primaryFile.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Downloaded ${result.primaryFile.name}`);
      },
      {
        toolId: recipe.slug,
        toolName: recipe.shortTitle,
        originalSize: totalInputBytes,
        processedSize: result.primaryFile.size,
        savedPercent: savedPct,
        formatLabel: result.formatLabel,
        url: result.primaryUrl,
        fileName: result.primaryFile.name,
        file: result.primaryFile,
      },
    );
  };

  const handleReset = () => {
    setFiles([]);
    setCheckpoints([]);
    setActiveStepIndex(null);
    setErrorMsg(null);
    setResult((prev) => {
      revokeResultUrls(prev);
      return null;
    });
  };

  const togglePii = (cat: PiiCategory) => {
    setPiiCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const progressPct =
    result
      ? 100
      : isRunning && activeStepIndex !== null
        ? Math.max(12, Math.round(((checkpoints.length + 0.5) / recipe.steps.length) * 100))
        : Math.round((checkpoints.length / recipe.steps.length) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Step Progress Bar Card ── */}
      <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-5 sm:p-6 shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {recipe.steps.length}-Step Sequential Pipeline
            </Badge>
            <Badge variant="outline" className="text-xs">
              {recipe.badge}
            </Badge>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {checkpoints.length} / {recipe.steps.length} stages complete
          </span>
        </div>

        {/* Visual Progress Track */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-primary via-violet-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recipe.steps.map((step, idx) => {
            const done = checkpoints[idx];
            const isActive = isRunning && activeStepIndex === idx;
            return (
              <li
                key={step.id}
                className={`rounded-2xl border p-3.5 transition-all ${
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : isActive
                      ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
                      : 'border-border/50 bg-background/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border/60 text-xs font-bold">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {step.execution}
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground leading-snug">{step.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{step.subtitle}</p>
                {done && (
                  <p className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    ✓ {done.summaryBadge} ({done.elapsedMs}ms)
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Single Upload + Config Workspace ── */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Dropzone & Staged Queue */}
        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground">1. Upload Once to Execute All Steps</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{recipe.fileHint}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleLoadSample} disabled={isRunning} className="text-xs h-8">
              <FilePlus2 className="w-3.5 h-3.5 mr-1.5" />
              Try Sample File
            </Button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleAddFiles(e.dataTransfer.files);
            }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border/70 bg-background/50 hover:border-primary/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={recipe.accept}
              multiple={recipe.multiple}
              aria-label={`Upload files for ${recipe.shortTitle} workflow`}
              className="hidden"
              onChange={(e) => {
                handleAddFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Drag &amp; drop {recipe.multiple ? 'your files' : 'your file'} here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Runs {recipe.steps.length} chained operations without re-uploading between steps
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isRunning}
              onClick={() => fileInputRef.current?.click()}
              className="mt-4"
            >
              Choose {recipe.multiple ? 'Files' : 'File'}
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{files.length} file(s) staged ({formatBytes(totalInputBytes)})</span>
                <button type="button" onClick={handleReset} disabled={isRunning} className="hover:text-destructive">
                  Clear queue
                </button>
              </div>
              <ul className="max-h-40 overflow-y-auto space-y-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs">
                    <span className="truncate font-medium text-foreground">{f.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground font-mono">{formatBytes(f.size)}</span>
                      <button
                        type="button"
                        disabled={isRunning}
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Pipeline Settings & Run Action */}
        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">2. Configure Pipeline Options</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Optional parameters passed automatically across steps.</p>
            </div>

            {recipe.slug === 'federal-court-pacer-pdf-prep' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="bates-prefix" className="text-xs">Bates Prefix</Label>
                  <Input id="bates-prefix" value={batesPrefix} onChange={(e) => setBatesPrefix(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bates-start" className="text-xs">Start Number</Label>
                  <Input
                    id="bates-start"
                    type="number"
                    min={1}
                    value={batesStart}
                    onChange={(e) => setBatesStart(Math.max(1, Number.parseInt(e.target.value || '1', 10)))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            {recipe.slug === 'freelance-contract-sign-and-lock' && (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="contract-party" className="text-xs">Client / Party Name</Label>
                  <Input id="contract-party" value={contractParty} onChange={(e) => setContractParty(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="signer-name" className="text-xs">Legal Signer Name</Label>
                    <Input id="signer-name" value={signerName} onChange={(e) => setSignerName(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signer-email" className="text-xs">Signer Email (Audit)</Label>
                    <Input id="signer-email" placeholder="optional" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lock-pwd" className="text-xs">Optional Lock Password (4+ chars)</Label>
                  <Input id="lock-pwd" type="password" placeholder="Leave empty for read-only flatten" value={protectPassword} onChange={(e) => setProtectPassword(e.target.value)} className="h-9 text-xs" />
                </div>
              </div>
            )}

            {recipe.slug === 'bookkeeper-bank-statement-cleanse' && (
              <div className="space-y-1">
                <Label htmlFor="bank-pwd" className="text-xs">Statement Password (only if encrypted)</Label>
                <Input id="bank-pwd" type="password" placeholder="Optional PDF password" value={bankPdfPassword} onChange={(e) => setBankPdfPassword(e.target.value)} className="h-9 text-xs" />
              </div>
            )}

            {recipe.slug === 'thermal-shipping-label-batch-prep' && (
              <div className="space-y-1.5">
                <Label htmlFor="carrier-preset" className="text-xs">Carrier Label Layout</Label>
                <select
                  id="carrier-preset"
                  value={carrierPreset}
                  onChange={(e) => setCarrierPreset(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                >
                  <option value="usps">USPS Click-N-Ship / eBay (4×6 Thermal)</option>
                  <option value="ups">UPS / Shopify Letter-to-Thermal</option>
                  <option value="fedex">FedEx Ship Manager</option>
                  <option value="etsy">Etsy / Poshmark / Mercari</option>
                  <option value="amazon-fba">Amazon FBA Box / Label</option>
                  <option value="royal-mail">Royal Mail (UK)</option>
                  <option value="dhl">DHL Express (DE / EU)</option>
                </select>
              </div>
            )}

            {recipe.slug === 'gdpr-hipaa-document-sanitization' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">Sensitive PII Categories to Scrub:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['ssn', 'ein', 'card', 'phone', 'email', 'iban'] as PiiCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => togglePii(cat)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase ${
                        piiCats.includes(cat) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!['federal-court-pacer-pdf-prep', 'freelance-contract-sign-and-lock', 'bookkeeper-bank-statement-cleanse', 'thermal-shipping-label-batch-prep', 'gdpr-hipaa-document-sanitization'].includes(recipe.slug) && (
              <ul className="space-y-2 text-xs text-muted-foreground">
                {recipe.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              size="lg"
              disabled={files.length === 0 || isRunning}
              onClick={handleRunPipeline}
              className="w-full btn-premium rounded-2xl gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing Step {(activeStepIndex ?? 0) + 1} of {recipe.steps.length}...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run {recipe.steps.length}-Step Pipeline
                </>
              )}
            </Button>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Zero-Retention Ephemeral Processing</span>
              <Link href={`/tools/${recipe.steps[0].toolSlug}`} className="text-primary hover:underline">
                Single tools →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Intermediate Step Previews & Checkpoints ── */}
      {checkpoints.length > 0 && (
        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Intermediate Stage Previews</h3>
            <span className="text-xs text-muted-foreground">{checkpoints.length} stage artifact(s) verified</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checkpoints.map((cp, idx) => (
              <div key={`${cp.stepId}-${idx}`} className="rounded-2xl border border-border/50 bg-background/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Step {idx + 1}: {cp.stepTitle}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {cp.summaryBadge}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{cp.note}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-primary">{cp.engineLabel}</p>

                {cp.previewImageUrl && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center max-h-40">
                    <img src={cp.previewImageUrl} alt={`${cp.stepTitle} preview`} className="max-h-40 w-auto object-contain" />
                  </div>
                )}

                {cp.previewCsvRows && cp.previewCsvRows.length > 0 && (
                  <div className="mt-2 overflow-x-auto rounded-lg border border-border/40 text-[10px]">
                    <table className="w-full text-left">
                      <tbody>
                        {cp.previewCsvRows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-muted/60 font-bold' : 'border-t border-border/30'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-2 py-1 truncate max-w-[120px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Final Single Deliverable + Monetization Verification Summary ── */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-emerald-500/35 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-foreground">Pipeline Complete — Final Deliverable Ready</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.primaryFile.name} · {formatBytes(result.primaryFile.size)} · {result.pageCountOrDims} · SHA-256: <code className="font-mono">{result.sha256.slice(0, 20)}...</code>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="lg" onClick={handleDownloadPrimary} className="btn-premium rounded-2xl gap-2">
                  <Download className="w-4 h-4" />
                  {recipe.outputLabel}
                </Button>
                {result.companionFiles.map((comp) => (
                  <Button
                    key={comp.label}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = comp.url;
                      a.download = comp.file.name;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                    className="rounded-xl gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {comp.label}
                  </Button>
                ))}
                <SmartlinkButton className="min-h-10 rounded-xl text-xs" />
                <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <ResultScreenAd
            refreshKey={result.primaryUrl}
            originalSize={totalInputBytes}
            processedSize={result.primaryFile.size}
            savedPercent={
              totalInputBytes > 0
                ? Math.max(0, Math.round(((totalInputBytes - result.primaryFile.size) / totalInputBytes) * 100))
                : 0
            }
            formatLabel={result.formatLabel}
            fileName={result.primaryFile.name}
          />
        </div>
      )}
    </div>
  );
}
