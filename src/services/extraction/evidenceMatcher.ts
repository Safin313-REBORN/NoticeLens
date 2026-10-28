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
 * Finds the exact or best-effort character range of an evidence snippet in the raw OCR text
 * with accurate character offsets mapped back to the original transcript.
 * Disambiguates repeated dates, tokens, or words by prioritizing proximity to matchedKeyword context.
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
    // Multiple occurrences found: disambiguate using matchedKeyword proximity
    if (matchedKeyword && matchedKeyword.trim()) {
      const keywordOccurrences = findAllOccurrences(fullText, matchedKeyword.trim());
      if (keywordOccurrences.length > 0) {
        let bestIndex = exactCandidates[0];
        let minDistance = Infinity;

        for (const candIdx of exactCandidates) {
          for (const kwIdx of keywordOccurrences) {
            const dist = Math.abs(candIdx - kwIdx);
            if (dist < minDistance) {
              minDistance = dist;
              bestIndex = candIdx;
            }
          }
        }

        const endIndex = bestIndex + trimmedTarget.length;
        return {
          text: fullText.substring(bestIndex, endIndex),
          startIndex: bestIndex,
          endIndex,
          confidence: minDistance <= 250 ? 'high' : 'medium',
          matchedKeyword,
        };
      }
    }

    // No keyword provided or couldn't disambiguate: use first with medium confidence
    const startIndex = exactCandidates[0];
    const endIndex = startIndex + trimmedTarget.length;
    return {
      text: fullText.substring(startIndex, endIndex),
      startIndex,
      endIndex,
      confidence: 'medium',
      matchedKeyword,
    };
  }

  // 2. Index-mapped whitespace-tolerant search (handles tabs, multiple spaces, line wraps)
  const { normalized: normFull, indexMap } = buildNormalizedIndexMap(fullText);
  const { normalized: normTarget } = buildNormalizedIndexMap(trimmedTarget);

  if (!normTarget || !normFull) return null;

  const normCandidates = findAllOccurrences(normFull, normTarget);

  if (normCandidates.length > 0) {
    let chosenNormIdx = normCandidates[0];

    if (normCandidates.length > 1 && matchedKeyword && matchedKeyword.trim()) {
      const { normalized: normKw } = buildNormalizedIndexMap(matchedKeyword.trim());
      const kwNormCandidates = findAllOccurrences(normFull, normKw);
      if (kwNormCandidates.length > 0) {
        let minDistance = Infinity;
        for (const cand of normCandidates) {
          for (const kw of kwNormCandidates) {
            const dist = Math.abs(cand - kw);
            if (dist < minDistance) {
              minDistance = dist;
              chosenNormIdx = cand;
            }
          }
        }
      }
    }

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
  }

  // 3. Word-token proximity matching if multiline or OCR noise
  const targetWords = normTarget.split(' ').filter((w) => w.length > 1);
  if (targetWords.length >= 2) {
    const firstWord = targetWords[0];
    const lastWord = targetWords[targetWords.length - 1];

    const firstIdx = fullText.toLowerCase().indexOf(firstWord.toLowerCase());
    if (firstIdx !== -1) {
      const windowSearch = fullText.toLowerCase().substring(firstIdx, firstIdx + trimmedTarget.length + 50);
      const lastWordRelative = windowSearch.indexOf(lastWord.toLowerCase());
      if (lastWordRelative !== -1) {
        const endOrig = firstIdx + lastWordRelative + lastWord.length;
        if (endOrig <= fullText.length && firstIdx < endOrig) {
          return {
            text: fullText.substring(firstIdx, endOrig),
            startIndex: firstIdx,
            endIndex: endOrig,
            confidence: 'low',
            matchedKeyword,
          };
        }
      }
    }
  }

  // Target snippet could not be matched anywhere in the full text
  return null;
}
