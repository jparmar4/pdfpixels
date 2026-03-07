const DISPLAY_TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["â€”", "-"],
  ["â€“", "-"],
  ["â€¢", " • "],
  ["â†“", "↓"],
  ["âœ“", "✓"],
  ["â‚¹", "0"],
  ["Ã—", "×"],
  ["Â°", "°"],
  ["Â©", "©"],
  ["Â", ""],
];

export function normalizeDisplayText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return DISPLAY_TEXT_REPLACEMENTS.reduce(
    (current, [search, replacement]) => current.split(search).join(replacement),
    value,
  ).replace(/\s{2,}/g, " ").trim();
}
