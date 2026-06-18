import { describe, expect, test } from "bun:test";
import {
  applyTagAutocompleteCandidate,
  normalizeTagToken,
  sourceTagFromParts,
  tagAutocompleteCandidates,
} from "../extension/src/core/tag-policy";

describe("tag policy", () => {
  test("normalizes tags to lowercase underscore tokens", () => {
    expect(normalizeTagToken(" Daniel Kahneman ")).toBe("daniel_kahneman");
    expect(normalizeTagToken("Kahneman (2011)!")).toBe("kahneman_2011");
  });

  test("builds source tags only from explicit date precision", () => {
    expect(sourceTagFromParts({ firstAuthor: "Kahneman", year: 2011 })).toBe("kahneman_2011");
    expect(sourceTagFromParts({ firstAuthor: "Karpathy", year: 2024, month: 3 })).toBe("karpathy_2024_03");
    expect(sourceTagFromParts({ firstAuthor: "Karpathy", year: 2024, month: 3, day: 5 })).toBe("karpathy_2024_03_05");
    expect(sourceTagFromParts({ firstAuthor: "Karpathy", month: 3, day: 5 })).toBeUndefined();
  });

  test("ranks hidden source tag suggestion before existing Anki tags", () => {
    expect(tagAutocompleteCandidates("ka", ["kahneman_2011", "kant_1781"], "karpathy_2024_03")).toEqual([
      "karpathy_2024_03",
      "kahneman_2011",
      "kant_1781",
    ]);
  });

  test("does not suggest completed tags again", () => {
    expect(tagAutocompleteCandidates("kahneman_2011 ka", ["kahneman_2011", "kant_1781"], "karpathy_2024_03")).toEqual([
      "karpathy_2024_03",
      "kant_1781",
    ]);
  });

  test("accepts a tag autocomplete candidate by replacing the current token", () => {
    expect(applyTagAutocompleteCandidate("paper ka", "Kahneman 2011")).toBe("paper kahneman_2011 ");
    expect(applyTagAutocompleteCandidate("", "Karpathy 2024/03")).toBe("karpathy_2024_03 ");
  });
});
