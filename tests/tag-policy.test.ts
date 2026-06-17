import { describe, expect, test } from "bun:test";
import { normalizeTagToken, sourceTagFromParts, tagAutocompleteCandidates } from "../extension/src/core/tag-policy";

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
});
