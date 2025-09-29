// Global Configuration
const CONFIG = {
  radius: 5,
  batchSize: 300,
  batchInterval: 500,
  fetchBatchSize: 1250,
  maxActiveArcs: 850,
  arcDuration: 6000,
  arcFadeTime: 1000,
  traceTime: 6000,
  debug: true,
  statsDataLimit: 50000,
  animationBatchSize: 300,
  animationBatchInterval: 500,
  latencyThresholds: {
    excellent: 100,
    good: 100,
    average: 200,
    poor: 300,
    bad: 400,
    terrible: Infinity
  },
  colors: {
    excellent: 0x005a00,
    good: 0x038103,
    average: 0xbe8c00,
    poor: 0xec6f09,
    bad: 0xa51f1f,
    terrible: 0xc04545
  },
  highlightThreshold: 400,
  arcHeightFactor: 0.08,
  particleSpeed: 0.9,
  glowIntensity: 2.5,
  pointSize: 3.0,
  dotSize: 8.0,
  starfieldRadius: 1000,
  arcSegments: 100
};

const OPENAI_API_KEY = window.OPENAI_API_KEY || '';

const continentCodeToName = {
  'AF': 'Africa',
  'AN': 'Antarctica',
  'AS': 'Asia',
  'EU': 'Europe',
  'NA': 'North America',
  'OC': 'Oceania',
  'SA': 'South America'
};

// Country code to name mapping
const countryCodeToName = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'JP': 'Japan',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'CA': 'Canada',
  'IT': 'Italy',
  'BR': 'Brazil',
  'IN': 'India',
  'CN': 'China',
  'RU': 'Russia',
  'KR': 'South Korea',
  'MX': 'Mexico',
  'NL': 'Netherlands',
  'ES': 'Spain',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'TH': 'Thailand',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'IN': 'India',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
  'MM': 'Myanmar',
  'KH': 'Cambodia',
  'LA': 'Laos',
  'BN': 'Brunei',
  'TL': 'Timor-Leste',
  'PG': 'Papua New Guinea',
  'FJ': 'Fiji',
  'VU': 'Vanuatu',
  'NC': 'New Caledonia',
  'PF': 'French Polynesia',
  'WS': 'Samoa',
  'TO': 'Tonga',
  'TV': 'Tuvalu',
  'KI': 'Kiribati',
  'FM': 'Micronesia',
  'MH': 'Marshall Islands',
  'PW': 'Palau',
  'NR': 'Nauru'
};

const customRegionMap = {
  'AE': true, 'SA': true, 'QA': true, 'OM': true, 'KW': true, 'BH': true,
  'IR': true, 'IQ': true, 'JO': true, 'LB': true, 'SY': true, 'YE': true,
  'IL': true, 'PS': true, 'TR': true, 'EG': true
};

const oceaniaCountryMap = {
  'AU': true, 'NZ': true, 'FJ': true, 'PG': true, 'SB': true, 'VU': true, 'NC': true, 'PF': true, 'WS': true, 'TO': true, 'TV': true, 'KI': true, 'FM': true, 'MH': true, 'PW': true, 'NR': true
};

const TTS_PRIORITY = {
  CRITICAL: 1,
  BAD_PERFORMANCE: 2,
  NEW_TEST: 3,
  INFO: 4
};

const MIN_TTS_INTERVAL = 3000;
const POST_TTS_COOLDOWN = 15000;
const AUDIO_DETECTION_THRESHOLD = 0.1;

// Make all constants globally available
window.CONFIG = CONFIG;
window.OPENAI_API_KEY = OPENAI_API_KEY;
window.continentCodeToName = continentCodeToName;
window.countryCodeToName = countryCodeToName;
window.customRegionMap = customRegionMap;
window.oceaniaCountryMap = oceaniaCountryMap;
window.TTS_PRIORITY = TTS_PRIORITY;
window.MIN_TTS_INTERVAL = MIN_TTS_INTERVAL;
window.POST_TTS_COOLDOWN = POST_TTS_COOLDOWN;
window.AUDIO_DETECTION_THRESHOLD = AUDIO_DETECTION_THRESHOLD; 