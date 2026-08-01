export function normalizeDisplayText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(/\s{2,}/g, " ").trim();
}
