export function normalizeDisplayText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/"™/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â…œ/g, "⅜")
    .replace(/Ã©/g, "é")
    .replace(/\s{2,}/g, " ")
    .trim();
}

