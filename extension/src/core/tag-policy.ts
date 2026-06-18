export interface SourceTagParts {
  firstAuthor: string;
  year?: number;
  month?: number;
  day?: number;
}

export function normalizeTagToken(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function datePart(value: number | undefined, width: number): string | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1) return undefined;
  return String(value).padStart(width, "0");
}

export function sourceTagFromParts(parts: SourceTagParts): string | undefined {
  const author = normalizeTagToken(parts.firstAuthor);
  const year = datePart(parts.year, 4);
  if (!author || year === undefined) return undefined;

  const month = datePart(parts.month, 2);
  const day = datePart(parts.day, 2);
  const segments = [author, year];
  if (month !== undefined) segments.push(month);
  if (month !== undefined && day !== undefined) segments.push(day);
  return segments.join("_");
}

function rawTagParts(tagsInput: string): string[] {
  return tagsInput.trimStart().split(/\s+/);
}

export function currentTagToken(tagsInput: string): string {
  const parts = rawTagParts(tagsInput);
  return parts.at(-1) ?? "";
}

function completedTagTokens(tagsInput: string): string[] {
  const parts = rawTagParts(tagsInput);
  const hasOpenToken = tagsInput.length > 0 && !/\s$/.test(tagsInput);
  const completed = hasOpenToken ? parts.slice(0, -1) : parts;
  return completed.map(normalizeTagToken).filter((tag) => tag.length > 0);
}

export function tagAutocompleteCandidates(
  tagsInput: string,
  existingTags: readonly string[],
  sourceTagSuggestion?: string,
): string[] {
  const token = normalizeTagToken(currentTagToken(tagsInput));
  const selected = new Set(completedTagTokens(tagsInput));
  const seen = new Set<string>();
  const candidates: string[] = [];

  const addCandidate = (tag: string | undefined): void => {
    if (!tag) return;
    const normalized = normalizeTagToken(tag);
    if (!normalized) return;
    if (selected.has(normalized)) return;
    if (token && !normalized.startsWith(token)) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  addCandidate(sourceTagSuggestion);
  for (const tag of existingTags) addCandidate(tag);
  return candidates;
}

export function applyTagAutocompleteCandidate(tagsInput: string, candidate: string): string {
  const normalizedCandidate = normalizeTagToken(candidate);
  if (!normalizedCandidate) return tagsInput;

  const parts = rawTagParts(tagsInput);
  const hasOpenToken = tagsInput.length > 0 && !/\s$/.test(tagsInput);
  const completed = hasOpenToken ? parts.slice(0, -1) : parts;
  const tokens = completed.map(normalizeTagToken).filter((tag) => tag.length > 0 && tag !== normalizedCandidate);
  tokens.push(normalizedCandidate);
  return `${tokens.join(" ")} `;
}
