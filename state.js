// Global Application State
export const state = {
  // Core Three.js components
  scene: null,
  camera: null,
  renderer: null,
  globe: null,
  controls: null,
  threeContainer: null,
  
  // Animation and rendering
  animationFrameId: null,
  lastFrameTime: 0,
  isInitialized: false,
  
  // Data management
  isFetching: false,
  isProcessingBatch: false,
  flightArcs: [],
  pendingArcs: [],
  isGlobeReady: false,
  currentPage: 1,
  hasMoreData: true,
  
  // UI components
  arcGroup: null,
  cloudMesh: null,
  dayTexture: null,
  nightTexture: null,
  isDayMode: true,
  batchScheduleId: null,
  
  // Statistics and monitoring
  lastStatsUpdate: 0,
  statsUpdateInterval: 500,
  avgLatency: 0,
  fps: 0,
  circleTexture: null,
  lastSpoken: 0,
  previousAlerts: '',
  
  // Country visualization
  countryGroup: null,
  countryLines: {},
  countryLabels: {},
  showCountries: true,
  
  // Filters and view modes
  filters: {
    source_country: '',
    source_region: '',
    operator: '',
    network_type: '',
    dest_country: '',
    dest_region: ''
  },
  complianceMode: false,
  viewMode: 'latency',
  
  // Textures and assets
  earthTextures: {},
  
  // News and ticker
  tickerBreakingEvents: [],
  lastTickerUpdate: 0,
  lastTestId: null,
  logoSprite: null,
  activeFilterKey: '',
  
  // Advanced features state
  comprehensiveStats: null,
  allDataForStats: [],
  worstPerformers: [],
  topWorstCountries: [],
  topBreachesOperators: [],
  topBreachesCountries: [],
  regionsMatrix: {},
  breachRate: 0,
  complianceRate: 0,
  seriousBreaches: 0,
  lastAlertTime: 0,
  lastNewsUpdate: 0
};

// Audio detection state
export let audioContext = null;
export let analyser = null;
export let microphone = null;
export let audioDetectionEnabled = false;
export let isOtherAudioPlaying = false;
export let audioCheckInterval = null;
export let grokDetectionEnabled = false;
export let lastGrokDetection = 0;
export const GROK_COOLDOWN = 10000;

// TTS state
export const ttsQueue = [];
export let ttsSpeaking = false;
export let lastTTSFinishTime = 0;

// Ticker state
export let tickerQueue = [];
export let tickerAnimId = null;

// Data processing state
export let lastProcessedTimestamp = null;
export let lastHudStats = '';
export let lastTickerStatsString = ''; 