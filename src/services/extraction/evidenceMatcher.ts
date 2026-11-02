import { EvidenceSnippet } from '../../types/notice';

/**
 * Normalizes text while preserving an exact 1-to-1 index map back to original character offsets.
 */
export function buildNormalizedIndexMap(text: string): { normalized: string; indexMap: number[] } {
  let normalized = '';
  const indexMap: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (!inWhitespace && normalized.length > 0) {
        normalized += ' ';
        indexMap.push(i);
        inWhitespace = true;
      }
    } else {
      normalized += ch;
      indexMap.push(i);
      inWhitespace = false;
    }
  }

  return { normalized, indexMap };
}

/**
 * Helper to find all character start indices of a substring in text (case-insensitive)
 */
function findAllOccurrences(haystack: string, needle: string): number[] {
  const indices: number[] = [];
  if (!haystack || !needle) return indices;
  const lowerHaystack = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let pos = 0;
  while ((pos = lowerHaystack.indexOf(lowerNeedle, pos)) !== -1) {
    indices.push(pos);
    pos += Math.max(1, lowerNeedle.length);
  }
  return indices;
}

/**
 * Checks whether text between two positions crosses a paragraph or major structural boundary.
 */
function crossesParagraphBoundary(text: string, start: number, end: number): boolean {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const slice = text.substring(from, to);
  return /\n\s*\n|\r\n\s*\r\n/.test(slice);
}

/**
 * Finds the exact or best-effort character range of an evidence snippet in the raw OCR text
 * with accurate character offsets mapped back to the original transcript.
 * Disambiguates repeated dates, tokens, or words by prioritizing proximity to matchedKeyword context.
 * If ambiguous or multiple occurrences exist without a conclusive contextual match, returns null
 * to prevent highlighting an arbitrary or misleading text range.
 */
export function matchEvidence(
  fullText: string,
  targetSnippet: string,
  matchedKeyword?: string,
  confidence: 'high' | 'medium' | 'low' = 'high'
): EvidenceSnippet | null {
  if (!fullText || !targetSnippet) return null;

  const trimmedTarget = targetSnippet.trim();
  if (!trimmedTarget) return null;

  // 1. Find all candidate occurrences in original text
  const exactCandidates = findAllOccurrences(fullText, trimmedTarget);

  if (exactCandidates.length === 1) {
    const startIndex = exactCandidates[0];
    const endIndex = startIndex + trimmedTarget.length;
    return {
      text: fullText.substring(startIndex, endIndex),
      startIndex,
      endIndex,
      confidence,
      matchedKeyword,
    };
  }

  if (exactCandidates.length > 1) {
    // Multiple occurrences found: disambiguate using matchedKeyword proximity and paragraph boundaries
    if (matchedKeyword && matchedKeyword.trim()) {
      const keywordOccurrences = findAllOccurrences(fullText, matchedKeyword.trim());
      if (keywordOccurrences.length > 0) {
        let bestIndex = -1;
        let minDistance = Infinity;
        let isAmbiguous = false;

        for (const candIdx of exactCandidates) {
          for (const kwIdx of keywordOccurrences) {
            const dist = Math.abs(candIdx - kwIdx);
            // Require candidate and keyword to be within 180 chars and not separated by a blank line / paragraph break
            if (dist > 180 || crossesParagraphBoundary(fullText, candIdx, kwIdx)) {
              continue;
            }

            if (dist < minDistance) {
              minDistance = dist;
              bestIndex = candIdx;
              isAmbiguous = false;
            } else if (dist === minDistance && candIdx !== bestIndex) {
              isAmbiguous = true;
            }
          }
        }

        if (bestIndex !== -1 && !isAmbiguous) {
          const endIndex = bestIndex + trimmedTarget.length;
          return {
            text: fullText.substring(bestIndex, endIndex),
            startIndex: bestIndex,
            endIndex,
            confidence: minDistance <= 80 ? 'high' : 'medium',
            matchedKeyword,
          };
        }
      }
    }

    // No keyword provided or keyword cannot unambiguously resolve: return null to avoid arbitrary highlight
    return null;
  }

  // 2. Index-mapped whitespace-tolerant search (handles tabs, multiple spaces, line wraps)
  const { normalized: normFull, indexMap } = buildNormalizedIndexMap(fullText);
  const { normalized: normTarget } = buildNormalizedIndexMap(trimmedTarget);

  if (!normTarget || !normFull) return null;

  const normCandidates = findAllOccurrences(normFull, normTarget);

  if (normCandidates.length === 1) {
    const chosenNormIdx = normCandidates[0];
    const startOrig = indexMap[chosenNormIdx];
    const endOrig = indexMap[chosenNormIdx + normTarget.length - 1] + 1;

    if (
      typeof startOrig === 'number' &&
      typeof endOrig === 'number' &&
      startOrig >= 0 &&
      endOrig <= fullText.length &&
      startOrig < endOrig
    ) {
      return {
        text: fullText.substring(startOrig, endOrig),
        startIndex: startOrig,
        endIndex: endOrig,
        confidence: 'medium',
        matchedKeyword,
      };
    }
  } else if (normCandidates.length > 1) {
    if (matchedKeyword && matchedKeyword.trim()) {
      const { normalized: normKw } = buildNormalizedIndexMap(matchedKeyword.trim());
      const kwNormCandidates = findAllOccurrences(normFull, normKw);
      if (kwNormCandidates.length > 0) {
        let bestNormIdx = -1;
        let minDistance = Infinity;
        let isAmbiguous = false;

        for (const cand of normCandidates) {
          for (const kw of kwNormCandidates) {
            const dist = Math.abs(cand - kw);
            const startOrig = indexMap[cand];
            const kwOrig = indexMap[kw];
            if (
              dist > 180 ||
              (typeof startOrig === 'number' && typeof kwOrig === 'number' && crossesParagraphBoundary(fullText, startOrig, kwOrig))
            ) {
              continue;
            }

            if (dist < minDistance) {
              minDistance = dist;
              bestNormIdx = cand;
              isAmbiguous = false;
            } else if (dist === minDistance && cand !== bestNormIdx) {
              isAmbiguous = true;
            }
          }
        }

        if (bestNormIdx !== -1 && !isAmbiguous) {
          const startOrig = indexMap[bestNormIdx];
          const endOrig = indexMap[bestNormIdx + normTarget.length - 1] + 1;
          if (
            typeof startOrig === 'number' &&
            typeof endOrig === 'number' &&
            startOrig >= 0 &&
            endOrig <= fullText.length &&
            startOrig < endOrig
          ) {
            return {
              text: fullText.substring(startOrig, endOrig),
              startIndex: startOrig,
              endIndex: endOrig,
              confidence: 'medium',
              matchedKeyword,
            };
          }
        }
      }
    }
    // Ambiguous normalized occurrences
    return null;
  }

  // 3. Word-token ordered proximity matching if minor OCR noise
  const targetWords = normTarget.split(' ').filter((w) => w.length > 1);
  if (targetWords.length >= 2) {
    const firstWord = targetWords[0].toLowerCase();

    // Find occurrences of first word
    const firstWordIndices = findAllOccurrences(fullText, firstWord);
    const validMatches: Array<{ start: number; end: number }> = [];

    for (const startIdx of firstWordIndices) {
      const maxWindowLength = Math.min(fullText.length - startIdx, trimmedTarget.length * 2 + 30);
      const windowSearch = fullText.substring(startIdx, startIdx + maxWindowLength);
      const lowerWindow = windowSearch.toLowerCase();

      // Verify all targetWords appear in order
      let currentPos = 0;
      let allFound = true;
      for (const word of targetWords) {
        const found = lowerWindow.indexOf(word.toLowerCase(), currentPos);
        if (found === -1) {
          allFound = false;
          break;
        }
        currentPos = found + word.length;
      }

      if (allFound && currentPos > 0) {
        validMatches.push({
          start: startIdx,
          end: startIdx + currentPos,
        });
      }
    }

    if (validMatches.length === 1) {
      const match = validMatches[0];
      return {
        text: fullText.substring(match.start, match.end),
        startIndex: match.start,
        endIndex: match.end,
        confidence: 'low',
        matchedKeyword,
      };
    } else if (validMatches.length > 1 && matchedKeyword && matchedKeyword.trim()) {
      const keywordOccurrences = findAllOccurrences(fullText, matchedKeyword.trim());
      if (keywordOccurrences.length > 0) {
        let bestMatch: { start: number; end: number } | null = null;
        let minDistance = Infinity;
        for (const match of validMatches) {
          for (const kwIdx of keywordOccurrences) {
            const dist = Math.abs(match.start - kwIdx);
            if (dist < minDistance && dist <= 180 && !crossesParagraphBoundary(fullText, match.start, kwIdx)) {
              minDistance = dist;
              bestMatch = match;
            }
          }
        }
        if (bestMatch) {
          return {
            text: fullText.substring(bestMatch.start, bestMatch.end),
            startIndex: bestMatch.start,
            endIndex: bestMatch.end,
            confidence: 'low',
            matchedKeyword,
          };
        }
      }
    }
  }

  // Target snippet could not be safely matched
  return null;
}
