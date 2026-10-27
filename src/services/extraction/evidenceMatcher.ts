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
 * Finds the exact or best-effort character range of an evidence snippet in the raw OCR text
 * with accurate character offsets mapped back to the original transcript.
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

  // 1. Direct exact search in original text
  let startIndex = fullText.indexOf(trimmedTarget);
  if (startIndex !== -1) {
    return {
      text: trimmedTarget,
      startIndex,
      endIndex: startIndex + trimmedTarget.length,
      confidence,
      matchedKeyword,
    };
  }

  // 2. Case-insensitive exact search in original text
  startIndex = fullText.toLowerCase().indexOf(trimmedTarget.toLowerCase());
  if (startIndex !== -1) {
    return {
      text: fullText.substring(startIndex, startIndex + trimmedTarget.length),
      startIndex,
      endIndex: startIndex + trimmedTarget.length,
      confidence,
      matchedKeyword,
    };
  }

  // 3. Index-mapped whitespace-tolerant search
  const { normalized: normFull, indexMap } = buildNormalizedIndexMap(fullText);
  const { normalized: normTarget } = buildNormalizedIndexMap(trimmedTarget);

  if (!normTarget || !normFull) return null;

  // Search case-insensitively in normalized text
  const normIdx = normFull.toLowerCase().indexOf(normTarget.toLowerCase());
  if (normIdx !== -1) {
    const startOrig = indexMap[normIdx];
    const endOrig = indexMap[normIdx + normTarget.length - 1] + 1;

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

  // 4. Word-token proximity matching if multiline or OCR noise
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
