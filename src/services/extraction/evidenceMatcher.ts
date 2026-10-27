import { EvidenceSnippet } from '../../types/notice';

/**
 * Finds the exact or best-effort character range of an evidence snippet in the raw OCR text
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

  // 1. Direct exact search
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

  // 2. Case-insensitive exact search
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

  // 3. Normalized whitespace search
  const cleanSnippet = trimmedTarget.replace(/\s+/g, ' ');
  const normalizedFull = fullText.replace(/\s+/g, ' ');
  const normIdx = normalizedFull.indexOf(cleanSnippet);
  if (normIdx !== -1) {
    // Estimate original position
    const words = cleanSnippet.split(' ');
    const firstWord = words[0];
    const candidateIdx = fullText.indexOf(firstWord);
    if (candidateIdx !== -1) {
      return {
        text: cleanSnippet,
        startIndex: candidateIdx,
        endIndex: Math.min(fullText.length, candidateIdx + cleanSnippet.length + 10),
        confidence: 'medium',
        matchedKeyword,
      };
    }
  }

  // Fallback: return snippet without range
  return {
    text: trimmedTarget,
    startIndex: 0,
    endIndex: trimmedTarget.length,
    confidence: 'low',
    matchedKeyword,
  };
}
