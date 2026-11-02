/**
 * NoticeLens Bengali Phonetic Transliteration Engine
 * 
 * Converts Bengali Unicode text into Romanized phonetic transliteration (Banglish phonemes)
 * specifically tuned for speech synthesizers on devices lacking native Bengali voice engines.
 * 
 * Allows English and system-default TTS voices to pronounce Bengali university circulars
 * with high phonetic intelligibility instead of remaining silent or making garbled noises.
 */

// Common high-frequency university circular dictionary for natural pronunciation
const VOCABULARY_MAP: Record<string, string> = {
  'ঢাকা': 'Dhaka',
  'বিশ্ববিদ্যালয়': 'Bishwobiddaloy',
  'বিশ্ববিদ্যালয়ের': 'Bishwobiddaloyer',
  'বিজ্ঞপ্তি': 'Biggopti',
  'পরীক্ষা': 'Porikkha',
  'পরীক্ষার': 'Porikkhar',
  'সময়সূচী': 'Shomoysuchi',
  'নির্দেশিকা': 'Nirdeshika',
  'শিক্ষার্থী': 'Shikkharthi',
  'শিক্ষার্থীদের': 'Shikkharthider',
  'বিভাগ': 'Bibhag',
  'বিভাগীয়': 'Bibhagiya',
  'সেমিস্টার': 'Semester',
  'ভর্তি': 'Bhorti',
  'তারিখ': 'Tarikh',
  'তারিখে': 'Tarikhe',
  'তারিখের': 'Tarikher',
  'ফি': 'Fee',
  'টাকা': 'Taka',
  'টাকার': 'Takar',
  'কক্ষ': 'Kokkho',
  'ভবন': 'Bhaban',
  'অফিস': 'Office',
  'প্রবেশপত্র': 'Probeshpotro',
  'রেজিস্ট্রেশন': 'Registration',
  'অনুরোধ': 'Onurodh',
  'নিষিদ্ধ': 'Nishiddho',
  'যোগাযোগ': 'Jogajog',
  'আদেশক্রমে': 'Adeshkrome',
  'নিয়ন্ত্রক': 'Niyontrok',
  'কমিটি': 'Committee',
  'বিষয়': 'Bishoy',
  'সংশ্লিষ্ট': 'Songshlishto',
  'অবগতির': 'Obogotir',
  'জন্য': 'Jonno',
  'জানানো': 'Janano',
  'যাচ্ছে': 'Jachhe',
  'যে': 'Je',
  'শুরু': 'Shuru',
  'হবে': 'Hobe',
  'সকাল': 'Sokal',
  'দুপুর': 'Dupur',
  'বিকাল': 'Bikal',
  'পর্যন্ত': 'Porjonto',
  'অবশ্যই': 'Oboshshoy',
  'সাথে': 'Sathe',
  'আনতে': 'Ante',
  'জমা': 'Joma',
  'দিতে': 'Dite',
  'মোবাইল': 'Mobile',
  'ফোন': 'Phone',
  'সহায়তা': 'Shohayota',
  'হেল্পলাইন': 'Helpline',
  'প্রথম': 'Prothom',
  'দ্বিতীয়': 'Ditiyo',
  'তৃতীয়': 'Tritiyo',
  'চতুর্থ': 'Choturtho',
  'বর্ষ': 'Borsho',
  'সেশন': 'Session',
  'ফলাফল': 'Pholaphol',
  'আবেদন': 'Abedon',
  'অনলাইন': 'Online',
  'কার্যক্রম': 'Karjokrom',
};

// Bengali vowel mapping
const VOWELS: Record<string, string> = {
  'অ': 'o',
  'আ': 'a',
  'ই': 'i',
  'ঈ': 'ee',
  'উ': 'u',
  'ঊ': 'oo',
  'ঋ': 'ri',
  'এ': 'e',
  'ঐ': 'oi',
  'ও': 'o',
  'ঔ': 'ou',
};

// Vowel signs (matras)
const MATRAS: Record<string, string> = {
  'া': 'a',
  'ি': 'i',
  'ী': 'ee',
  'ু': 'u',
  'ূ': 'oo',
  'ৃ': 'ri',
  'ে': 'e',
  'ৈ': 'oi',
  'ো': 'o',
  'ৌ': 'ou',
};

// Bengali consonants
const CONSONANTS: Record<string, string> = {
  'ক': 'k',
  'খ': 'kh',
  'গ': 'g',
  'ঘ': 'gh',
  'ঙ': 'ng',
  'চ': 'ch',
  'ছ': 'chh',
  'জ': 'j',
  'ঝ': 'jh',
  'ঞ': 'n',
  'ট': 't',
  'ঠ': 'th',
  'ড': 'd',
  'ঢ': 'dh',
  'ণ': 'n',
  'ত': 't',
  'থ': 'th',
  'দ': 'd',
  'ধ': 'dh',
  'ন': 'n',
  'প': 'p',
  'ফ': 'ph',
  'ব': 'b',
  'ভ': 'bh',
  'ম': 'm',
  'য': 'j',
  'র': 'r',
  'ল': 'l',
  'শ': 'sh',
  'ষ': 'sh',
  'স': 's',
  'হ': 'h',
  'ড়': 'r',
  'ঢ়': 'rh',
  'য়': 'y',
  'ৎ': 't',
};

// Conjuncts and special modifiers
const MODIFIERS: Record<string, string> = {
  'ং': 'ng',
  'ঃ': 'h',
  'ঁ': 'n',
};

// Bengali digits to phonetic names
const DIGITS: Record<string, string> = {
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

/**
 * Transliterates a single Bengali word phonetically
 */
function transliterateWord(word: string): string {
  // Check direct vocabulary dictionary first
  const cleanWord = word.replace(/[.,:;!?()]/g, '');
  const punctuation = word.slice(cleanWord.length);
  if (VOCABULARY_MAP[cleanWord]) {
    return VOCABULARY_MAP[cleanWord] + punctuation;
  }

  let result = '';
  const len = cleanWord.length;

  for (let i = 0; i < len; i++) {
    const char = cleanWord[i];
    const nextChar = i + 1 < len ? cleanWord[i + 1] : '';

    // Handle digits
    if (DIGITS[char]) {
      result += DIGITS[char];
      continue;
    }

    // Handle independent vowels
    if (VOWELS[char]) {
      result += VOWELS[char];
      continue;
    }

    // Handle vowel signs (matras)
    if (MATRAS[char]) {
      result += MATRAS[char];
      continue;
    }

    // Handle special modifiers
    if (MODIFIERS[char]) {
      result += MODIFIERS[char];
      continue;
    }

    // Handle virama (hasant)
    if (char === '্') {
      continue;
    }

    // Handle consonants
    if (CONSONANTS[char]) {
      result += CONSONANTS[char];

      // Check if followed by virama, matra, or another consonant
      const isNextVirama = nextChar === '্';
      const isNextMatra = !!MATRAS[nextChar];
      const isEndOfWord = i + 1 >= len;

      // In Bengali, consonants carry an inherent 'o' or 'a' vowel unless followed by a matra or hasant
      if (!isNextVirama && !isNextMatra && !isEndOfWord && CONSONANTS[nextChar]) {
        result += 'o';
      }
      continue;
    }

    // Fallback to original character (e.g. English letters, symbols)
    result += char;
  }

  return (result || word) + punctuation;
}

/**
 * Converts a Bengali or mixed text passage into Romanized phonetic speech input.
 */
export function transliterateBengaliToPhonetic(text: string): string {
  if (!text) return '';

  // Split text by whitespace while preserving punctuation and line breaks
  const tokens = text.split(/(\s+)/);

  return tokens
    .map((token) => {
      // If contains whitespace, return as is
      if (/^\s+$/.test(token)) return token;

      // If contains Bengali characters, transliterate
      if (/[\u0980-\u09FF]/.test(token)) {
        return transliterateWord(token);
      }

      // Return unchanged if already English/Latin
      return token;
    })
    .join('');
}
