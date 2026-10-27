/**
 * Bengali <-> English numeral conversion and normalization utility
 */

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const BN_TO_EN_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const EN_TO_BN_MAP: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

/**
 * Converts any Bengali numerals in a string to standard ASCII/English numerals (0-9)
 */
export function bengaliToEnglishNumerals(input: string): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (char) => BN_TO_EN_MAP[char] || char);
}

/**
 * Converts English numerals (0-9) to Bengali numerals (০-৯)
 */
export function englishToBengaliNumerals(input: string): string {
  if (!input) return '';
  return input.replace(/[0-9]/g, (char) => EN_TO_BN_MAP[char] || char);
}

/**
 * Checks if a string contains Bengali numerals
 */
export function containsBengaliNumerals(input: string): boolean {
  return /[০-৯]/.test(input);
}

/**
 * Extracts all numeric sequences from a string, normalized to English integers
 */
export function extractNumbers(input: string): number[] {
  const normalized = bengaliToEnglishNumerals(input);
  const matches = normalized.match(/\d+/g);
  if (!matches) return [];
  return matches.map((m) => parseInt(m, 10));
}
