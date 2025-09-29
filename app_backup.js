import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from './node_modules/three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from './node_modules/three/examples/jsm/geometries/TextGeometry.js';

if (typeof THREE === 'undefined') {
  throw new Error('Three.js is not loaded. Please check the imports.');
}

const {
  Vector3, Scene, Color, PerspectiveCamera, MeshBasicMaterial,
  MeshStandardMaterial, SphereGeometry, Mesh, AmbientLight, DirectionalLight,
  BufferGeometry, TubeGeometry, LineBasicMaterial, Line, HemisphereLight, Group,
  TextureLoader, MeshLambertMaterial, Quaternion, BufferAttribute, Points,
  PointsMaterial, AdditiveBlending, ShaderMaterial, WebGLRenderer, BoxGeometry,
  CanvasTexture, NormalBlending, CatmullRomCurve3
} = THREE;

console.log('Three.js version:', THREE.REVISION);

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

const countryCodeToName = {
  "AD": "Andorra",
  "AE": "United Arab Emirates",
  "AF": "Afghanistan",
  "AG": "Antigua and Barbuda",
  "AI": "Anguilla",
  "AL": "Albania",
  "AM": "Armenia",
  "AO": "Angola",
  "AQ": "Antarctica",
  "AR": "Argentina",
  "AS": "American Samoa",
  "AT": "Austria",
  "AU": "Australia",
  "AW": "Aruba",
  "AX": "Åland Islands",
  "AZ": "Azerbaijan",
  "BA": "Bosnia and Herzegovina",
  "BB": "Barbados",
  "BD": "Bangladesh",
  "BE": "Belgium",
  "BF": "Burkina Faso",
  "BG": "Bulgaria",
  "BH": "Bahrain",
  "BI": "Burundi",
  "BJ": "Benin",
  "BL": "Saint Barthélemy",
  "BM": "Bermuda",
  "BN": "Brunei Darussalam",
  "BO": "Bolivia, Plurinational State of",
  "BQ": "Bonaire, Sint Eustatius and Saba",
  "BR": "Brazil",
  "BS": "Bahamas",
  "BT": "Bhutan",
  "BV": "Bouvet Island",
  "BW": "Botswana",
  "BY": "Belarus",
  "BZ": "Belize",
  "CA": "Canada",
  "CC": "Cocos (Keeling) Islands",
  "CD": "Congo, Democratic Republic of the",
  "CF": "Central African Republic",
  "CG": "Congo",
  "CH": "Switzerland",
  "CI": "Côte d'Ivoire",
  "CK": "Cook Islands",
  "CL": "Chile",
  "CM": "Cameroon",
  "CN": "China",
  "CO": "Colombia",
  "CR": "Costa Rica",
  "CU": "Cuba",
  "CV": "Cabo Verde",
  "CW": "Curaçao",
  "CX": "Christmas Island",
  "CY": "Cyprus",
  "CZ": "Czechia",
  "DE": "Germany",
  "DJ": "Djibouti",
  "DK": "Denmark",
  "DM": "Dominica",
  "DO": "Dominican Republic",
  "DZ": "Algeria",
  "EC": "Ecuador",
  "EE": "Estonia",
  "EG": "Egypt",
  "EH": "Western Sahara",
  "ER": "Eritrea",
  "ES": "Spain",
  "ET": "Ethiopia",
  "FI": "Finland",
  "FJ": "Fiji",
  "FK": "Falkland Islands (Malvinas)",
  "FM": "Micronesia, Federated States of",
  "FO": "Faroe Islands",
  "FR": "France",
  "GA": "Gabon",
  "GB": "United Kingdom of Great Britain and Northern Ireland",
  "GD": "Grenada",
  "GE": "Georgia",
  "GF": "French Guiana",
  "GG": "Guernsey",
  "GH": "Ghana",
  "GI": "Gibraltar",
  "GL": "Greenland",
  "GM": "Gambia",
  "GN": "Guinea",
  "GP": "Guadeloupe",
  "GQ": "Equatorial Guinea",
  "GR": "Greece",
  "GS": "South Georgia and the South Sandwich Islands",
  "GT": "Guatemala",
  "GU": "Guam",
  "GW": "Guinea-Bissau",
  "GY": "Guyana",
  "HK": "Hong Kong",
  "HM": "Heard Island and McDonald Islands",
  "HN": "Honduras",
  "HR": "Croatia",
  "HT": "Haiti",
  "HU": "Hungary",
  "ID": "Indonesia",
  "IE": "Ireland",
  "IL": "Israel",
  "IM": "Isle of Man",
  "IN": "India",
  "IO": "British Indian Ocean Territory",
  "IQ": "Iraq",
  "IR": "Iran, Islamic Republic of",
  "IS": "Iceland",
  "IT": "Italy",
  "JE": "Jersey",
  "JM": "Jamaica",
  "JO": "Jordan",
  "JP": "Japan",
  "KE": "Kenya",
  "KG": "Kyrgyzstan",
  "KH": "Cambodia",
  "KI": "Kiribati",
  "KM": "Comoros",
  "KN": "Saint Kitts and Nevis",
  "KP": "Korea, Democratic People's Republic of",
  "KR": "Korea, Republic of",
  "KW": "Kuwait",
  "KY": "Cayman Islands",
  "KZ": "Kazakhstan",
  "LA": "Lao People's Democratic Republic",
  "LB": "Lebanon",
  "LC": "Saint Lucia",
  "LI": "Liechtenstein",
  "LK": "Sri Lanka",
  "LR": "Liberia",
  "LS": "Lesotho",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "LV": "Latvia",
  "LY": "Libya",
  "MA": "Morocco",
  "MC": "Monaco",
  "MD": "Moldova, Republic of",
  "ME": "Montenegro",
  "MF": "Saint Martin (French part)",
  "MG": "Madagascar",
  "MH": "Marshall Islands",
  "MK": "North Macedonia",
  "ML": "Mali",
  "MM": "Myanmar",
  "MN": "Mongolia",
  "MO": "Macao",
  "MP": "Northern Mariana Islands",
  "MQ": "Martinique",
  "MR": "Mauritania",
  "MS": "Montserrat",
  "MT": "Malta",
  "MU": "Mauritius",
  "MV": "Maldives",
  "MW": "Malawi",
  "MX": "Mexico",
  "MY": "Malaysia",
  "MZ": "Mozambique",
  "NA": "Namibia",
  "NC": "New Caledonia",
  "NE": "Niger",
  "NF": "Norfolk Island",
  "NG": "Nigeria",
  "NI": "Nicaragua",
  "NL": "Netherlands, Kingdom of the",
  "NO": "Norway",
  "NP": "Nepal",
  "NR": "Nauru",
  "NU": "Niue",
  "NZ": "New Zealand",
  "OM": "Oman",
  "PA": "Panama",
  "PE": "Peru",
  "PF": "French Polynesia",
  "PG": "Papua New Guinea",
  "PH": "Philippines",
  "PK": "Pakistan",
  "PL": "Poland",
  "PM": "Saint Pierre and Miquelon",
  "PN": "Pitcairn",
  "PR": "Puerto Rico",
  "PS": "Palestine, State of",
  "PT": "Portugal",
  "PW": "Palau",
  "PY": "Paraguay",
  "QA": "Qatar",
  "RE": "Réunion",
  "RO": "Romania",
  "RS": "Serbia",
  "RU": "Russian Federation",
  "RW": "Rwanda",
  "SA": "Saudi Arabia",
  "SB": "Solomon Islands",
  "SC": "Seychelles",
  "SD": "Sudan",
  "SE": "Sweden",
  "SG": "Singapore",
  "SH": "Saint Helena, Ascension and Tristan da Cunha",
  "SI": "Slovenia",
  "SJ": "Svalbard and Jan Mayen",
  "SK": "Slovakia",
  "SL": "Sierra Leone",
  "SM": "San Marino",
  "SN": "Senegal",
  "SO": "Somalia",
  "SR": "Suriname",
  "SS": "South Sudan",
  "ST": "Sao Tome and Principe",
  "SV": "El Salvador",
  "SX": "Sint Maarten (Dutch part)",
  "SY": "Syrian Arab Republic",
  "SZ": "Eswatini",
  "TC": "Turks and Caicos Islands",
  "TD": "Chad",
  "TF": "French Southern Territories",
  "TG": "Togo",
  "TH": "Thailand",
  "TJ": "Tajikistan",
  "TK": "Tokelau",
  "TL": "Timor-Leste",
  "TM": "Turkmenistan",
  "TN": "Tunisia",
  "TO": "Tonga",
  "TR": "Türkiye",
  "TT": "Trinidad and Tobago",
  "TV": "Tuvalu",
  "TW": "Taiwan, Province of China",
  "TZ": "Tanzania, United Republic of",
  "UA": "Ukraine",
  "UG": "Uganda",
  "UM": "United States Minor Outlying Islands",
  "US": "United States of America",
  "UY": "Uruguay",
  "UZ": "Uzbekistan",
  "VA": "Holy See",
  "VC": "Saint Vincent and the Grenadines",
  "VE": "Venezuela, Bolivarian Republic of",
  "VG": "Virgin Islands (British)",
  "VI": "Virgin Islands (U.S.)",
  "VN": "Viet Nam",
  "VU": "Vanuatu",
  "WF": "Wallis and Futuna",
  "WS": "Samoa",
  "YE": "Yemen",
  "YT": "Mayotte",
  "ZA": "South Africa",
  "ZM": "Zambia",
  "ZW": "Zimbabwe"
};

const countryCentroids = {"AF":{"lat":33,"lng":65},"AX":{"lat":60.116667,"lng":19.9},"AL":{"lat":41,"lng":20},"DZ":{"lat":28,"lng":3},"AS":{"lat":-14.3333,"lng":-170},"AD":{"lat":42.5,"lng":1.6},"AO":{"lat":-12.5,"lng":18.5},"AI":{"lat":18.25,"lng":-63.1667},"AQ":{"lat":-90,"lng":0},"AG":{"lat":17.05,"lng":-61.8},"AR":{"lat":-34,"lng":-64},"AM":{"lat":40,"lng":45},"AW":{"lat":12.5,"lng":-69.9667},"AU":{"lat":-27,"lng":133},"AT":{"lat":47.3333,"lng":13.3333},"AZ":{"lat":40.5,"lng":47.5},"BS":{"lat":24.25,"lng":-76},"BH":{"lat":26,"lng":50.55},"BD":{"lat":24,"lng":90},"BB":{"lat":13.1667,"lng":-59.5333},"BY":{"lat":53,"lng":28},"BE":{"lat":50.8333,"lng":4},"BZ":{"lat":17.25,"lng":-88.75},"BJ":{"lat":9.5,"lng":2.25},"BM":{"lat":32.3333,"lng":-64.75},"BT":{"lat":27.5,"lng":90.5},"BO":{"lat":-17,"lng":-65},"BQ":{"lat":12.183333,"lng":-68.233333},"BA":{"lat":44,"lng":18},"BW":{"lat":-22,"lng":24},"BV":{"lat":-54.4333,"lng":3.4},"BR":{"lat":-10,"lng":-55},"IO":{"lat":-6,"lng":71.5},"BN":{"lat":4.5,"lng":114.6667},"BG":{"lat":43,"lng":25},"BF":{"lat":13,"lng":-2},"MM":{"lat":22,"lng":98},"BI":{"lat":-3.5,"lng":30},"KH":{"lat":13,"lng":105},"CM":{"lat":6,"lng":12},"CA":{"lat":60,"lng":-95},"CV":{"lat":16,"lng":-24},"KY":{"lat":19.5,"lng":-80.5},"CF":{"lat":7,"lng":21},"TD":{"lat":15,"lng":19},"CL":{"lat":-30,"lng":-71},"CN":{"lat":35,"lng":105},"CX":{"lat":-10.5,"lng":105.6667},"CC":{"lat":-12.5,"lng":96.8333},"CO":{"lat":4,"lng":-72},"KM":{"lat":-12.1667,"lng":44.25},"CD":{"lat":0,"lng":25},"CG":{"lat":-1,"lng":15},"CK":{"lat":-21.2333,"lng":-159.7667},"CR":{"lat":10,"lng":-84},"CI":{"lat":8,"lng":-5},"HR":{"lat":45.1667,"lng":15.5},"CU":{"lat":21.5,"lng":-80},"CW":{"lat":12.166667,"lng":-68.966667},"CY":{"lat":35,"lng":33},"CZ":{"lat":49.75,"lng":15.5},"DK":{"lat":56,"lng":10},"DJ":{"lat":11.5,"lng":43},"DM":{"lat":15.4167,"lng":-61.3333},"DO":{"lat":19,"lng":-70.6667},"EC":{"lat":-2,"lng":-77.5},"EG":{"lat":27,"lng":30},"SV":{"lat":13.8333,"lng":-88.9167},"GQ":{"lat":2,"lng":10},"ER":{"lat":15,"lng":39},"EE":{"lat":59,"lng":26},"ET":{"lat":8,"lng":38},"FK":{"lat":-51.75,"lng":-59},"FO":{"lat":62,"lng":-7},"FJ":{"lat":-18,"lng":175},"FI":{"lat":64,"lng":26},"FR":{"lat":46,"lng":2},"GF":{"lat":4,"lng":-53},"PF":{"lat":-15,"lng":-140},"TF":{"lat":-43,"lng":67},"GA":{"lat":-1,"lng":11.75},"GM":{"lat":13.4667,"lng":-16.5667},"GE":{"lat":42,"lng":43.5},"DE":{"lat":51,"lng":9},"GH":{"lat":8,"lng":-2},"GI":{"lat":36.1833,"lng":-5.3667},"GR":{"lat":39,"lng":22},"GL":{"lat":72,"lng":-40},"GD":{"lat":12.1167,"lng":-61.6667},"GP":{"lat":16.25,"lng":-61.5833},"GU":{"lat":13.4667,"lng":144.7833},"GT":{"lat":15.5,"lng":-90.25},"GG":{"lat":49.5,"lng":-2.56},"GN":{"lat":11,"lng":-10},"GW":{"lat":12,"lng":-15},"GY":{"lat":5,"lng":-59},"HT":{"lat":19,"lng":-72.4167},"HM":{"lat":-53.1,"lng":72.5167},"VA":{"lat":41.9,"lng":12.45},"HN":{"lat":15,"lng":-86.5},"HK":{"lat":22.25,"lng":114.1667},"HU":{"lat":47,"lng":20},"IS":{"lat":65,"lng":-18},"IN":{"lat":20,"lng":77},"ID":{"lat":-5,"lng":120},"IR":{"lat":32,"lng":53},"IQ":{"lat":33,"lng":44},"IE":{"lat":53,"lng":-8},"IM":{"lat":54.23,"lng":-4.55},"IL":{"lat":31.5,"lng":34.75},"IT":{"lat":42.8333,"lng":12.8333},"JM":{"lat":18.25,"lng":-77.5},"JP":{"lat":36,"lng":138},"JE":{"lat":49.21,"lng":-2.13},"JO":{"lat":31,"lng":36},"KZ":{"lat":48,"lng":68},"KE":{"lat":1,"lng":38},"KI":{"lat":1.4167,"lng":173},"KP":{"lat":40,"lng":127},"KR":{"lat":37,"lng":127.5},"KW":{"lat":29.3375,"lng":47.6581},"KG":{"lat":41,"lng":75},"LA":{"lat":18,"lng":105},"LV":{"lat":57,"lng":25},"LB":{"lat":33.8333,"lng":35.8333},"LS":{"lat":-29.5,"lng":28.5},"LR":{"lat":6.5,"lng":-9.5},"LY":{"lat":25,"lng":17},"LI":{"lat":47.1667,"lng":9.5333},"LT":{"lat":55,"lng":24},"LU":{"lat":49.75,"lng":6},"MO":{"lat":22.1667,"lng":113.55},"MK":{"lat":41.8333,"lng":22},"MG":{"lat":-20,"lng":47},"MW":{"lat":-13.5,"lng":34},"MY":{"lat":2.5,"lng":112.5},"MV":{"lat":3.25,"lng":73},"ML":{"lat":17,"lng":-4},"MT":{"lat":35.8333,"lng":14.5833},"MH":{"lat":9,"lng":168},"MQ":{"lat":14.6667,"lng":-61},"MR":{"lat":20,"lng":-12},"MU":{"lat":-20.2833,"lng":57.55},"YT":{"lat":-12.8333,"lng":45.1667},"MX":{"lat":23,"lng":-102},"FM":{"lat":6.9167,"lng":158.25},"MD":{"lat":47,"lng":29},"MC":{"lat":43.7333,"lng":7.4},"MN":{"lat":46,"lng":105},"ME":{"lat":42,"lng":19},"MS":{"lat":16.75,"lng":-62.2},"MA":{"lat":32,"lng":-5},"MZ":{"lat":-18.25,"lng":35},"NA":{"lat":-22,"lng":17},"NR":{"lat":-0.5333,"lng":166.9167},"NP":{"lat":28,"lng":84},"NL":{"lat":52.5,"lng":5.75},"NC":{"lat":-21.5,"lng":165.5},"NZ":{"lat":-41,"lng":174},"NI":{"lat":13,"lng":-85},"NE":{"lat":16,"lng":8},"NG":{"lat":10,"lng":8},"NU":{"lat":-19.0333,"lng":-169.8667},"NF":{"lat":-29.0333,"lng":167.95},"MP":{"lat":15.2,"lng":145.75},"NO":{"lat":62,"lng":10},"OM":{"lat":21,"lng":57},"PK":{"lat":30,"lng":70},"PW":{"lat":7.5,"lng":134.5},"PS":{"lat":32,"lng":35.25},"PA":{"lat":9,"lng":-80},"PG":{"lat":-6,"lng":147},"PY":{"lat":-23,"lng":-58},"PE":{"lat":-10,"lng":-76},"PH":{"lat":13,"lng":122},"PN":{"lat":-25.0667,"lng":-130.1},"PL":{"lat":52,"lng":20},"PT":{"lat":39.5,"lng":-8},"PR":{"lat":18.25,"lng":-66.5},"QA":{"lat":25.5,"lng":51.25},"RE":{"lat":-21.1,"lng":55.6},"RO":{"lat":46,"lng":25},"RU":{"lat":60,"lng":100},"RW":{"lat":-2,"lng":30},"BL":{"lat":17.9,"lng":-62.8333},"SH":{"lat":-15.9333,"lng":-5.7},"KN":{"lat":17.3333,"lng":-62.75},"LC":{"lat":13.8833,"lng":-61.1333},"MF":{"lat":18.0833,"lng":-63.95},"PM":{"lat":46.8333,"lng":-56.3333},"VC":{"lat":13.25,"lng":-61.2},"WS":{"lat":-13.5833,"lng":-172.3333},"SM":{"lat":43.7667,"lng":12.4167},"ST":{"lat":1,"lng":7},"SA":{"lat":25,"lng":45},"SN":{"lat":14,"lng":-14},"RS":{"lat":44,"lng":21},"SC":{"lat":-4.5833,"lng":55.6667},"SL":{"lat":8.5,"lng":-11.5},"SG":{"lat":1.3667,"lng":103.8},"SX":{"lat":18.033333,"lng":-63.05},"SK":{"lat":48.6667,"lng":19.5},"SI":{"lat":46,"lng":15},"SB":{"lat":-8,"lng":159},"SO":{"lat":10,"lng":49},"ZA":{"lat":-29,"lng":24},"GS":{"lat":-54.5,"lng":-37},"ES":{"lat":40,"lng":-4},"LK":{"lat":7,"lng":81},"SD":{"lat":15,"lng":30},"SR":{"lat":4,"lng":-56},"SJ":{"lat":78,"lng":20},"SZ":{"lat":-26.5,"lng":31.5},"SE":{"lat":62,"lng":15},"CH":{"lat":47,"lng":8},"SY":{"lat":35,"lng":38},"TW":{"lat":23.5,"lng":121},"TJ":{"lat":39,"lng":71},"TZ":{"lat":-6,"lng":35},"TH":{"lat":15,"lng":100},"TL":{"lat":-8.55,"lng":125.5167},"TG":{"lat":8,"lng":1.1667},"TK":{"lat":-9,"lng":-172},"TO":{"lat":-20,"lng":-175},"TT":{"lat":11,"lng":-61},"TN":{"lat":34,"lng":9},"TR":{"lat":39,"lng":35},"TM":{"lat":40,"lng":60},"TC":{"lat":21.75,"lng":-71.5833},"TV":{"lat":-8,"lng":178},"UG":{"lat":1,"lng":32},"UA":{"lat":49,"lng":32},"AE":{"lat":24,"lng":54},"GB":{"lat":54,"lng":-2},"US":{"lat":38,"lng":-97},"UM":{"lat":19.2833,"lng":166.6},"UY":{"lat":-33,"lng":-56},"UZ":{"lat":41,"lng":64},"VU":{"lat":-16,"lng":167},"VE":{"lat":8,"lng":-66},"VN":{"lat":16,"lng":106},"VG":{"lat":18.5,"lng":-64.5},"VI":{"lat":18.3333,"lng":-64.8333},"WF":{"lat":-13.3,"lng":-176.2},"EH":{"lat":24.5,"lng":-13},"YE":{"lat":15,"lng":48},"ZM":{"lat":-15,"lng":30},"ZW":{"lat":-20,"lng":30}};

const customRegionMap = {
  'AE': true, 'SA': true, 'QA': true, 'OM': true, 'KW': true, 'BH': true,
  'IR': true, 'IQ': true, 'JO': true, 'LB': true, 'SY': true, 'YE': true,
  'IL': true, 'PS': true, 'TR': true, 'EG': true
};

const oceaniaCountryMap = {
  'AU': true, 'NZ': true, 'FJ': true, 'PG': true, 'SB': true, 'VU': true, 'NC': true, 'PF': true, 'WS': true, 'TO': true, 'TV': true, 'KI': true, 'FM': true, 'MH': true, 'PW': true, 'NR': true
};

const state = {
  scene: null,
  camera: null,
  renderer: null,
  globe: null,
  controls: null,
  threeContainer: null,
  animationFrameId: null,
  isFetching: false,
  isProcessingBatch: false,
  flightArcs: [],
  pendingArcs: [],
  isGlobeReady: false,
  lastFrameTime: 0,
  isInitialized: false,
  currentPage: 1,
  hasMoreData: true,
  arcGroup: null,
  cloudMesh: null,
  dayTexture: null,
  nightTexture: null,
  isDayMode: true,
  batchScheduleId: null,
  lastStatsUpdate: 0,
  statsUpdateInterval: 500,
  avgLatency: 0,
  fps: 0,
  circleTexture: null,
  lastSpoken: 0,
  previousAlerts: '',
  countryGroup: null,
  countryLines: {},
  countryLabels: {},
  showCountries: true,
  filters: {
    source_country: '',
    source_region: '',
    operator: '',
    network_type: '',
    dest_country: '',
    dest_region: ''
  },
  complianceMode: false,
  viewMode: 'latency', // Initialize view mode (latency or compliance)
  earthTextures: {},
  tickerBreakingEvents: [],
  lastTickerUpdate: 0,
  lastTestId: null,
  logoSprite: null,
  activeFilterKey: ''
};

let tickerQueue = [];
let tickerAnimId = null;

let lastProcessedTimestamp = null;

const ttsQueue = [];
let ttsSpeaking = false;
let lastTTSFinishTime = 0;

let lastHudStats = '';
let lastTickerStatsString = '';

const onWindowResize = () => {
  if (!state.camera || !state.renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(width, height);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  console.log('Window resized:', { width, height });
};

const showError = (message) => {
  console.error('ERROR:', message);
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = `Error: ${message}`;
    errorContainer.style.display = 'block';
    setTimeout(() => (errorContainer.style.display = 'none'), 10000);
  }
};

const updateLoading = (message, show = true) => {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.textContent = message;
    loadingIndicator.style.display = show ? 'block' : 'none';
  }
};

const checkWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
    return true;
  } catch (error) {
    showError(`WebGL is not supported: ${error.message}`);
    return false;
  }
};

const getLatencyColor = (ms) => {
  const thresholds = CONFIG.latencyThresholds;
  const colors = CONFIG.colors;
  if (ms < thresholds.excellent) return colors.excellent;
  if (ms < thresholds.good) return colors.good;
  if (ms < thresholds.average) return colors.average;
  if (ms < thresholds.poor) return colors.poor;
  if (ms < thresholds.bad) return colors.bad;
  return colors.terrible;
};

const createCircleTexture = (size = 32) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const initThreeJS = (container) => {
  try {
    if (!WebGLRenderer) {
      throw new Error('WebGLRenderer is not available in Three.js module');
    }
    console.log('Initializing Three.js renderer...');

    state.threeContainer = container || document.getElementById('canvas-container');
    if (!state.threeContainer) throw new Error('Container element not found');
    console.log('Container found:', state.threeContainer);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    state.scene = new Scene();
    console.log('Scene created:', state.scene);
    state.scene.background = null;

    const aspect = state.threeContainer.clientWidth / state.threeContainer.clientHeight;
    state.camera = new PerspectiveCamera(45, aspect, 0.1, 2000);
    state.camera.position.set(0, 0, 20);
    state.camera.lookAt(0, 0, 0);
    console.log('Camera initialized:', state.camera);

    state.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    console.log('Renderer initialized:', state.renderer);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.setSize(state.threeContainer.clientWidth, state.threeContainer.clientHeight);
    state.renderer.shadowMap.enabled = false;
    state.renderer.sortObjects = false;

    const canvas = state.renderer.domElement;
    if (!canvas) throw new Error('Canvas creation failed');
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = '1';
    state.threeContainer.innerHTML = '';
    state.threeContainer.appendChild(canvas);
    console.log('Canvas appended to container:', { canvas, style: canvas.style });

    state.circleTexture = createCircleTexture();
    console.log('Circle texture created for particles');

    const ambientLight = new AmbientLight(0x404040, 1.5);
    state.scene.add(ambientLight);
    console.log('Ambient light added');

    const sunLight = new DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 10, 10);
    state.scene.add(sunLight);
    console.log('Sun light added');

    const backLight = new DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-10, -10, -10);
    state.scene.add(backLight);
    console.log('Back light added');

    const hemiLight = new HemisphereLight(0xffffff, 0x444444, 0.1);
    hemiLight.position.set(0, 20, 0);
    state.scene.add(hemiLight);
    console.log('Hemisphere light added');

    state.controls = new OrbitControls(state.camera, canvas);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.05;
    state.controls.minDistance = 6;
    state.controls.maxDistance = 100;
    console.log('OrbitControls initialized');

    document.addEventListener('keydown', toggleDayNight);
    console.log('Keydown event listener added for toggle');

    const testGeometry = new BoxGeometry(1, 1, 1);
    const testMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const testCube = new Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 0, 0);
    state.scene.add(testCube);
    console.log('Test cube added to scene');

    state.renderer.render(state.scene, state.camera);
    console.log('Initial render forced');

    return true;
  } catch (error) {
    showError(`Failed to initialize 3D engine: ${error.message}`);
    console.error('InitThreeJS error stack:', error.stack);
    return false;
  }
};

const toggleDayNight = () => {
  state.isDayMode = !state.isDayMode;
  if (state.globe) {
    state.globe.material.map = state.isDayMode ? state.dayTexture : state.nightTexture;
    state.globe.material.needsUpdate = true;
    console.log('Toggled day/night mode:', state.isDayMode);
  }
};

const createProceduralStarfield = () => {
  const starCount = 10000;
  const geometry = new BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = CONFIG.starfieldRadius * Math.sin(phi) * Math.cos(theta);
    const y = CONFIG.starfieldRadius * Math.sin(phi) * Math.sin(theta);
    const z = CONFIG.starfieldRadius * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    blending: AdditiveBlending
  });
  const stars = new Points(geometry, material);
  state.scene.add(stars);
  console.log('Procedural starfield created with', starCount, 'stars');
  return false;
};

const createGlobe = () => {
  console.log('Creating globe...');
  const geometry = new SphereGeometry(CONFIG.radius, 128, 128);
  const material = new MeshStandardMaterial({
    roughness: 1,
    metalness: 0
  });

  state.globe = new Mesh(geometry, material);
  if (!state.globe) throw new Error('Globe mesh creation failed');
  state.globe.rotation.y = Math.PI;
  state.scene.add(state.globe);
  console.log('Globe added to scene:', state.globe);

  state.arcGroup = new Group();
  state.arcGroup.renderOrder = 10;
  state.globe.add(state.arcGroup);
  console.log('Arc group created:', state.arcGroup);

  state.countryGroup = new Group();
  state.globe.add(state.countryGroup);
  console.log('Country group created:', state.countryGroup);

  const loader = new TextureLoader();
  console.log('Loading day texture from:', './8k_earth_daymap.jpg');
  state.dayTexture = loader.load(
    './8k_earth_daymap.jpg',
    (tex) => {
      console.log('✔ Day texture loaded successfully');
      if (state.isDayMode) {
        material.map = tex;
        material.needsUpdate = true;
      }
    },
    (xhr) => console.log(`Day texture loading: ${(xhr.loaded / xhr.total * 100)}%`),
    (err) => {
      console.warn('Day texture failed to load from ./8k_earth_daymap.jpg:', err);
      if (state.globe) state.globe.material.color.set(0x0000ff);
    }
  );
  console.log('Loading night texture from:', './8k_earth_nightmap.jpg');
  state.nightTexture = loader.load(
    './8k_earth_nightmap.jpg',
    (tex) => {
      console.log('✔ Night texture loaded successfully');
      if (!state.isDayMode) {
        material.map = tex;
        material.needsUpdate = true;
      }
    },
    (xhr) => console.log(`Night texture loading: ${(xhr.loaded / xhr.total * 100)}%`),
    (err) => console.warn('Night texture failed to load from ./8k_earth_nightmap.jpg', err)
  );

  state.earthTextures = {};
  state.earthTextures.day = loader.load('./8081_earthmap10k.jpg');
  state.earthTextures.night = loader.load('./8081_earthlights10k.jpg');
  state.earthTextures.bump = loader.load('./8081_earthbump10k.jpg', (tex) => {
    if (state.globe) {
      state.globe.material.map = tex;
      state.globe.material.needsUpdate = true;
      console.log('✔ Relief (bump) texture set as default');
    }
  });

  function addEarthTextureButtons() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    if (document.getElementById('earth-texture-buttons')) return;
    const container = document.createElement('div');
    container.id = 'earth-texture-buttons';
    container.style.display = 'inline-block';
    container.style.marginLeft = '10px';
    [
      { id: 'btn-earth-day', label: 'Day', key: 'day' },
      { id: 'btn-earth-night', label: 'Night', key: 'night' },
      { id: 'btn-earth-bump', label: 'Relief', key: 'bump' }
    ].forEach(({id, label, key}) => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = label;
      btn.style.background = 'rgba(255,255,255,0.2)';
      btn.style.color = 'white';
      btn.style.border = '1px solid rgba(255,255,255,0.5)';
      btn.style.padding = '5px 10px';
      btn.style.cursor = 'pointer';
      btn.style.fontFamily = 'Orbitron, sans-serif';
      btn.style.borderRadius = '3px';
      btn.style.marginLeft = '2px';
      btn.addEventListener('click', () => {
        if (state.globe && state.earthTextures[key]) {
          state.globe.material.map = state.earthTextures[key];
          state.globe.material.needsUpdate = true;
        }
      });
      container.appendChild(btn);
    });
    menu.appendChild(container);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    addEarthTextureButtons();
  } else {
    window.addEventListener('DOMContentLoaded', addEarthTextureButtons);
  }

  // createProceduralStarfield(); // Removed to eliminate background haze

  fetch('./submarine_cables.geojson')
    .then(res => res.json())
    .then(data => {
      data.features.forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          const points = feature.geometry.coordinates.map(coord => latLongToVector3(coord[1], coord[0], CONFIG.radius * 1.01));
          const lineGeom = new BufferGeometry().setFromPoints(points);
          const lineMat = new LineBasicMaterial({ color: 0x888888, opacity: 0.3, transparent: true });
          const line = new Line(lineGeom, lineMat);
          state.globe.add(line);
        } else if (feature.geometry.type === 'MultiLineString') {
          feature.geometry.coordinates.forEach(lineCoords => {
            const points = lineCoords.map(coord => latLongToVector3(coord[1], coord[0], CONFIG.radius * 1.01));
            const lineGeom = new BufferGeometry().setFromPoints(points);
            const lineMat = new LineBasicMaterial({ color: 0x888888, opacity: 0.3, transparent: true });
            const line = new Line(lineGeom, lineMat);
            state.globe.add(line);
          });
        }
      });
      console.log('Local submarine cables loaded');
    })
    .catch(err => console.warn('Failed to load submarine_cables.geojson:', err));

  fetch('./worldCountries.geojson')
    .then(res => res.json())
    .then(data => {
      let processedCount = 0;
      data.features.forEach(feature => {
        const countryCode = feature.properties.ISO || feature.properties.iso_a2 || feature.properties.ISO_A2 || feature.properties.ISO_A3;
        if (!countryCode) {
          console.warn('Skipping feature without valid country code:', feature.properties);
          return;
        }
        if (!state.countryLines[countryCode]) state.countryLines[countryCode] = [];
        const geometryType = feature.geometry.type;
        let polygons = [];
        if (geometryType === 'Polygon') {
          polygons = [feature.geometry.coordinates];
        } else if (geometryType === 'MultiPolygon') {
          polygons = feature.geometry.coordinates;
        }
        polygons.forEach(polygon => {
          polygon.forEach(ring => {
            const points = ring.map(coord => latLongToVector3(coord[1], coord[0], CONFIG.radius * 1.001));
            const lineGeom = new BufferGeometry().setFromPoints(points);
            const lineMat = new LineBasicMaterial({ color: 0xadd8e6, opacity: 0.5, transparent: true });
            const line = new Line(lineGeom, lineMat);
            state.countryGroup.add(line);
            state.countryLines[countryCode].push(line);
            processedCount++;
          });
        });
      });
      console.log('Local world countries loaded - Processed lines:', processedCount);
    })
    .catch(err => console.warn('Failed to load worldCountries.geojson:', err));
  state.isGlobeReady = true;
  console.log('Globe creation completed, isGlobeReady:', state.isGlobeReady);
};

const latLongToVector3 = (lat, lon, radius = CONFIG.radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const createAnimatedArc = (arcData, batchStartTime) => {
  if (!state.isGlobeReady) {
    console.log('Globe not ready, queuing arc:', arcData);
    return;
  }

  if (state.flightArcs.length >= CONFIG.maxActiveArcs) {
    console.warn('Max arcs reached, skipping new arc');
    return;
  }

  const start = latLongToVector3(arcData.source_latitude || arcData.source.lat, arcData.source_longitude || arcData.source.lng);
  const end = latLongToVector3(arcData.dest_latitude || arcData.destination.lat, arcData.dest_longitude || arcData.destination.lng);
  const latency = parseFloat(arcData.avgTime) || 0;
  const colorHex = getLatencyColor(latency);
  let color;
  if (state.complianceMode) {
    const srcReg = customRegionMap[arcData.source_country] ? 'Middle East' : (continentCodeToName[arcData.source_region] || arcData.source_region || 'Unknown');
    const destReg = continentCodeToName[arcData.dest_region] || arcData.dest_region || 'Unknown';
    const compliant = (srcReg === destReg)
      ? latency <= 100
      : latency <= 300;
    color = new Color(compliant ? 0x00ff00 : 0xff0000);
  } else {
    color = new Color(colorHex);
  }
  const isHighlight = latency >= CONFIG.highlightThreshold;

  const randomDelay = Math.random() * 2000;
  const randomArcDuration = CONFIG.arcDuration + (Math.random() - 0.5) * 2000;
  const randomTraceTime = CONFIG.traceTime + (Math.random() - 0.5) * 2000;
  const randomHeightFactor = CONFIG.arcHeightFactor * (0.8 + Math.random() * 0.6);

  const sN = start.clone().normalize();
  const eN = end.clone().normalize();
  const angle = sN.angleTo(eN);
  if (angle < 0.001) {
    console.log('Skipping arc with negligible angle');
    return;
  }

  const axis = sN.clone().cross(eN).normalize();
  const points = [];
  const segments = CONFIG.arcSegments;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const quat = new Quaternion().setFromAxisAngle(axis, angle * t);
    const p = sN.clone().applyQuaternion(quat);
    const elev = randomHeightFactor * Math.sin(Math.PI * t);
    p.multiplyScalar(CONFIG.radius * (1 + elev));
    points.push(p);
  }

  const curve = new CatmullRomCurve3(points);
  const geometry = new TubeGeometry(curve, segments, 0.009, 8, false);

  const material = new MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
    blending: NormalBlending,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const tube = new Mesh(geometry, material);
  tube.renderOrder = 10;
  state.arcGroup.add(tube);

  console.log('Arc tube added');

  const particleGeo = new BufferGeometry();
  const particlePos = new Float32Array([start.x, start.y, start.z]);
  particleGeo.setAttribute('position', new BufferAttribute(particlePos, 3));
  const particleMat = new PointsMaterial({
    color: color,
    size: isHighlight ? CONFIG.pointSize * 1.5 : CONFIG.pointSize,
    map: state.circleTexture,
    transparent: true,
    blending: AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: false
  });
  const particle = new Points(particleGeo, particleMat);
  particle.renderOrder = 11;
  state.arcGroup.add(particle);

  const sourceGeo = new BufferGeometry();
  const sourcePos = new Float32Array([start.x, start.y, start.z]);
  sourceGeo.setAttribute('position', new BufferAttribute(sourcePos, 3));
  const sourceMat = new PointsMaterial({
    color: color,
    size: CONFIG.dotSize,
    map: state.circleTexture,
    transparent: true,
    blending: AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: false
  });
  const sourceDot = new Points(sourceGeo, sourceMat);
  sourceDot.renderOrder = 12;
  state.arcGroup.add(sourceDot);

  const destGeo = new BufferGeometry();
  const destPos = new Float32Array([end.x, end.y, end.z]);
  destGeo.setAttribute('position', new BufferAttribute(destPos, 3));
  const destMat = new PointsMaterial({
    color: color,
    size: CONFIG.dotSize,
    map: state.circleTexture,
    transparent: true,
    blending: AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: false
  });
  const destDot = new Points(destGeo, destMat);
  destDot.renderOrder = 12;
  state.arcGroup.add(destDot);

  const arc = {
    tube,
    particle,
    sourceDot,
    destDot,
    points,
    latency,
    progress: 0,
    startTime: batchStartTime + randomDelay,
    arcDuration: randomArcDuration,
    traceTime: randomTraceTime,
    particleSpeed: CONFIG.particleSpeed + Math.random() * 0.05 - 0.025,
    isTrace: false,
    isHighlight,
    source_country: arcData.source_country || 'Unknown',
    dest_country: arcData.dest_country || 'Unknown',
    operator: arcData.operator || 'Unknown',
    source_region: arcData.source_region || 'Unknown',
    dest_region: arcData.dest_region || 'Unknown',
    network_type: arcData.network_type || 'unknown',
    created_at: arcData.created_at,
    baseColor: color.clone(),
    source: { lat: arcData.source.lat, lng: arcData.source.lng },
    destination: { lat: arcData.destination.lat, lng: arcData.destination.lng }
  };

  if (latency > 400) {
    const warningGeom = new SphereGeometry(0.1, 8, 8);
    const warningMat = new MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 1, blending: AdditiveBlending });
    const warning = new Mesh(warningGeom, warningMat);
    warning.position.copy(start);
    state.scene.add(warning);
    const normal = start.clone().normalize();
    arc.warning = { mesh: warning, velocity: normal.clone().multiplyScalar(0.01), startTime: batchStartTime };
  }

  state.flightArcs.push(arc);

  if (CONFIG.debug) {
    console.log('Arc created with dots:', {
      start: arc.source,
      end: arc.destination,
      latency,
      color: color.getHexString(),
      vertices: points.length,
      arcSegments: segments,
      sourceCountry: arc.source_country,
      destCountry: arc.dest_country
    });
  }

  return arc;
};

const processPendingArcs = () => {
  if (state.isProcessingBatch || state.pendingArcs.length === 0) {
    console.log('Processing skipped:', { isProcessing: state.isProcessingBatch, pendingArcs: state.pendingArcs.length });
    return;
  }
  state.isProcessingBatch = true;
  const batchStartTime = performance.now();
  const arcsToCreate = Math.min(CONFIG.animationBatchSize, CONFIG.maxActiveArcs - state.flightArcs.length, state.pendingArcs.length);
  const batch = state.pendingArcs.splice(0, arcsToCreate);
  console.log(`🎬 Processing animation batch: ${arcsToCreate} arcs (${state.pendingArcs.length} remaining, ${state.flightArcs.length} active)`);
  
  let validArcs = 0;
  batch.forEach(arcData => {
    if (!arcData.source_latitude || !arcData.source_longitude || !arcData.dest_latitude || !arcData.dest_longitude) {
      console.warn('Invalid arc data (missing coordinates):', arcData);
      return;
    }
    const source = { lat: parseFloat(arcData.source_latitude), lng: parseFloat(arcData.source_longitude) };
    const destination = { lat: parseFloat(arcData.dest_latitude), lng: parseFloat(arcData.dest_longitude) };
    const processedArcData = {
      source,
      destination,
      avgTime: parseFloat(arcData.avgTime) || 0,
      source_country: arcData.source_country || 'Unknown',
      dest_country: arcData.dest_country || 'Unknown',
      operator: getOperator(arcData),
      source_region: arcData.source_region,
      dest_region: arcData.dest_region,
      network_type: arcData.network_type,
      created_at: arcData.created_at
    };
    if (isNaN(source.lat) || isNaN(source.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
      console.warn('Invalid coordinates in arc data:', processedArcData);
      return;
    }
    createAnimatedArc(processedArcData, batchStartTime);
    validArcs++;
  });
  
  console.log(`✅ Batch processed: ${validArcs} valid arcs created`);
  state.isProcessingBatch = false;
};

const fetchUniqueValues = async (endpoint) => {
  try {
    const response = await fetch(`http://localhost:8000/api/unique/${endpoint}`);
    if (!response.ok) throw new Error('Failed to fetch unique values');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
};

const populateDropdown = (id, values, options = {}) => {
  const select = document.getElementById(id);
  if (select) {
    select.innerHTML = '<option value="">All</option>';
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value; // Keep original value for backend filtering
      
      // Convert display text if needed
      let displayText = value;
      if (options.convertCountryCodes && countryCodeToName[value]) {
        displayText = countryCodeToName[value];
      }
      
      option.textContent = displayText;
      select.appendChild(option);
    });
    select.style.background = '#fff';
    select.style.color = '#222';
    select.style.border = '1px solid #ccc';
    select.style.fontFamily = 'inherit';
    select.style.fontSize = '1em';
    select.style.padding = '4px 8px';
    select.style.borderRadius = '4px';
    select.style.minWidth = '120px';
  }
};

if (!document.getElementById('dropdown-style')) {
  const style = document.createElement('style');
  style.id = 'dropdown-style';
  style.innerHTML = `
    select, select option {
      background: #fff !important;
      color: #222 !important;
    }
  `;
  document.head.appendChild(style);
}

const fetchCompleteDataset = async (filters = {}) => {
  let allData = [];
  let cursor = null;
  let pageCount = 0;
  let hasMore = true;

  while (hasMore && allData.length < CONFIG.statsDataLimit) {
    const url = new URL('http://localhost:8000/api/latency-data');
    url.searchParams.set('limit', CONFIG.fetchBatchSize.toString());
    if (cursor) url.searchParams.set('cursor', cursor);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const { data, pagination } = result;

    if (data.length > 0) {
      const filteredData = data.filter(item => parseFloat(item.avgTime) > 0);
      allData.push(...filteredData);
      cursor = pagination.nextCursor;
      hasMore = pagination.hasMore;
      pageCount++;
      console.log(`📥 Stats page ${pageCount}: ${data.length} arcs (Filtered to ${filteredData.length}, Total collected: ${allData.length})`);
    } else {
      hasMore = false;
      console.log('✅ No more data pages.');
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return allData;
};

// Helper to get operator (prefer ipInfo.organization)
function getOperator(item, opts = {}) {
  // opts: { forDisplay: true } to get a label for tables
  const netType = (item.network_type || '').toLowerCase();
  const org = item.ipinfo_organization || (item.ipInfo && item.ipInfo.organization) || '';
  const op = item.operator || '';
  if (opts.forDisplay) {
    if (netType === 'mobile' && op && org) return `${op} (${org})`;
    if (netType === 'mobile' && op) return op;
    if ((netType === 'wifi' || netType === 'wired') && org) return org;
    if (op) return op;
    if (org) return org;
    return 'Unknown';
  }
  // For filtering, return both fields for dropdowns
  if (netType === 'mobile' && op) return op;
  if ((netType === 'wifi' || netType === 'wired') && org) return org;
  return op || org || 'Unknown';
}

// Patch processDataForStatistics
const processDataForStatistics = (allData) => {
  console.log('📊 Processing complete dataset for statistics...');
  const stats = {
    totalTests: allData.length,
    avgLatency: 0,
    maxLatency: 0,
    minLatency: Infinity,
    complianceRate: 0,
    breaches: 0,
    operators: {},
    countries: {},
    regions: {}
  };
  let totalLatency = 0;
  let compliantTests = 0;
  allData.forEach(item => {
    const latency = parseFloat(item.avgTime);
    if (latency > 0) {
      totalLatency += latency;
      stats.maxLatency = Math.max(stats.maxLatency, latency);
      stats.minLatency = Math.min(stats.minLatency, latency);
      if (latency <= 100) {
        compliantTests++;
      } else {
        stats.breaches++;
      }
      const operator = getOperator(item);
      if (!stats.operators[operator]) {
        stats.operators[operator] = { count: 0, totalLatency: 0, breaches: 0, op: operator, country: item.source_country };
      }
      stats.operators[operator].count++;
      stats.operators[operator].totalLatency += latency;
      if (latency > 100) stats.operators[operator].breaches++;
      const country = item.source_country || 'Unknown';
      if (!stats.countries[country]) {
        stats.countries[country] = { count: 0, totalLatency: 0, breaches: 0 };
      }
      stats.countries[country].count++;
      stats.countries[country].totalLatency += latency;
      if (latency > 100) stats.countries[country].breaches++;
      const region = item.source_region || 'Unknown';
      if (!stats.regions[region]) {
        stats.regions[region] = { count: 0, totalLatency: 0, breaches: 0 };
      }
      stats.regions[region].count++;
      stats.regions[region].totalLatency += latency;
      if (latency > 100) stats.regions[region].breaches++;
    }
  });
  stats.avgLatency = totalLatency / stats.totalTests;
  stats.complianceRate = (compliantTests / stats.totalTests) * 100;
  state.comprehensiveStats = stats;
  console.log(`📊 Statistics calculated: ${stats.totalTests} tests, ${stats.complianceRate.toFixed(1)}% compliance, ${stats.avgLatency.toFixed(1)}ms avg`);
};

function getFilterKey(filters) {
  return JSON.stringify(filters || {});
}

const fetchAllData = async (filters = {}) => {
  const filterKey = getFilterKey(filters);
  state.activeFilterKey = filterKey;
  console.log('🌍 Fetching all latency data for last hour with filters:', filters);
  console.log('📊 CONFIG.fetchBatchSize:', CONFIG.fetchBatchSize, 'CONFIG.statsDataLimit:', CONFIG.statsDataLimit);
  state.isFetching = true;
  state.pendingArcs = [];
  state.allDataForStats = [];
  state.hasMoreData = true;

  try {
    let allData = [];
    let cursor = null;
    let pageCount = 0;
    let hasMore = true;

    while (hasMore && allData.length < CONFIG.statsDataLimit) {
      // If filter changed, abort
      if (state.activeFilterKey !== filterKey) {
        console.log('Filter changed, aborting fetchAllData');
        return;
      }
      const url = new URL('http://localhost:8000/api/latency-data');
      url.searchParams.set('limit', CONFIG.fetchBatchSize.toString());
      if (cursor) url.searchParams.set('cursor', cursor);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });

      console.log(`📥 Fetching page ${pageCount + 1}:`, url.toString());
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const { data, pagination } = result;

      console.log(`📥 API Response for page ${pageCount + 1}:`, {
        dataLength: data.length,
        total: pagination.total,
        hasMore: pagination.hasMore,
        limit: pagination.limit,
        nextCursor: pagination.nextCursor
      });

      if (data.length > 0) {
        const filteredData = data.filter(item => parseFloat(item.avgTime) > 0);
        
        // Debug: Check for wired nodes before patching
        const wiredNodesBeforePatch = filteredData.filter(item => 
          item.network_type === 'wired' && item.userId
        );
        if (wiredNodesBeforePatch.length > 0) {
          console.log('🔍 Found wired nodes before patching:', wiredNodesBeforePatch.map(item => ({
            userId: item.userId,
            source_latitude: item.source_latitude,
            source_longitude: item.source_longitude,
            source_country: item.source_country
          })));
        }
        
        // Patch location data for wired nodes
        const patchedData = filteredData.map(item => patchWiredNodeLocation(item));
        
        // Debug: Check for wired nodes after patching
        const wiredNodesAfterPatch = patchedData.filter(item => 
          item.network_type === 'wired' && item.userId && item.location_patched
        );
        if (wiredNodesAfterPatch.length > 0) {
          console.log('✅ Successfully patched wired nodes:', wiredNodesAfterPatch.map(item => ({
            userId: item.userId,
            source_latitude: item.source_latitude,
            source_longitude: item.source_longitude,
            source_country: item.source_country,
            location_patched: item.location_patched
          })));
        }
        
        allData.push(...patchedData);
        // Start animating arcs as soon as we get a page
        state.pendingArcs.push(...patchedData);
        cursor = pagination.nextCursor;
        hasMore = pagination.hasMore;
        pageCount++;
        console.log(`📥 Stats page ${pageCount}: ${data.length} arcs (Filtered to ${filteredData.length}, Total collected: ${allData.length})`);
        
        // Trigger news update after first page to show loading progress
        if (pageCount === 1) {
          console.log('🎤 Triggering initial news update with first batch of data');
          setTimeout(() => triggerNewsUpdate(), 1000);
        }
      } else {
        hasMore = false;
        console.log('⚠️ No data returned from API - database may be empty or API endpoint issue');
        console.log('📊 API Response details:', result);
        
        // If this is the first page and no data, provide a helpful message
        if (pageCount === 0) {
          console.log('🚨 No data available in database - this could indicate:');
          console.log('   1. Database is empty (no tests have been run)');
          console.log('   2. API endpoint is not working correctly');
          console.log('   3. Database connection issues');
          console.log('   4. Time range filters are too restrictive');
          
          // Trigger a helpful news update about the empty state
          setTimeout(() => {
            speakQueued('No test data available. System ready for real-time monitoring.');
          }, 1000);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // If filter changed, abort
    if (state.activeFilterKey !== filterKey) {
      console.log('Filter changed, aborting fetchAllData (after fetch)');
      return;
    }

    state.allDataForStats = allData;
    console.log(`📊 Total data fetched for stats: ${allData.length} rows`);
    processDataForStatistics(allData);
    console.log(`🎬 Queued ${state.pendingArcs.length} arcs for animation`);
    console.log('✅ Data fetching complete - stats updated, animation queued');
    // Call ticker update after stats are ready
    updateTickerWithSummaries();
    
    // Trigger news update after data is fully loaded
    console.log('🎤 Triggering news update after data load complete');
    setTimeout(() => {
      triggerNewsUpdate();
      // Add bad actor stories to the news feed
      setTimeout(() => addBadActorStories(), 3000);
    }, 2000);
  } catch (error) {
    console.error('❌ Fetch error:', error);
    showError(`Data fetching failed: ${error.message}`);
  } finally {
    state.isFetching = false;
  }
};

const clearArcs = () => {
  state.flightArcs.forEach(arc => {
    state.arcGroup.remove(arc.tube);
    state.arcGroup.remove(arc.particle);
    state.arcGroup.remove(arc.sourceDot);
    state.arcGroup.remove(arc.destDot);
    arc.tube.geometry.dispose();
    arc.tube.material.dispose();
    arc.particle.geometry.dispose();
    arc.particle.material.dispose();
    arc.sourceDot.geometry.dispose();
    arc.sourceDot.material.dispose();
    arc.destDot.geometry.dispose();
    arc.destDot.material.dispose();
    if (arc.warning) {
      state.scene.remove(arc.warning.mesh);
      arc.warning.mesh.geometry.dispose();
      arc.warning.mesh.material.dispose();
    }
  });
  state.flightArcs = [];
  state.pendingArcs = [];
};

const applyFilters = () => {
  const filters = {
    source_country: document.getElementById('source-country').value,
    source_region: document.getElementById('source-region').value,
    operator: document.getElementById('source-operator').value,
    network_type: document.getElementById('network-type').value,
    dest_country: document.getElementById('dest-country').value,
    dest_region: document.getElementById('dest-region').value
  };
  state.filters = filters;
  clearArcs();
  fetchAllData(filters);
};

async function processAndFeedTickerFromApi() {
  const filterKey = state.activeFilterKey;
  try {
    let url = 'http://localhost:8000/api/latency-data?limit=100';
    if (lastProcessedTimestamp) {
      url += `&since=${lastProcessedTimestamp}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch operator data');
    const result = await res.json();
    const data = result.data || [];
    if (data.length > 0) {
      const latestTimestamp = Math.max(...data.map(item => new Date(item.created_at).getTime()));
      if (!lastProcessedTimestamp || latestTimestamp > lastProcessedTimestamp) {
        lastProcessedTimestamp = latestTimestamp;
      }
    }
    if (data.length === 0) {
      console.log('No new data to process');
      return;
    }
    // Only add new tests if no filter is active (i.e., show only for global view)
    if (state.activeFilterKey !== getFilterKey({})) {
      console.log('Filter is active, skipping new test ticker update');
      return;
    }
    console.log(`Processing ${data.length} new test results`);
    data.forEach(item => {
      const msg = `New test: ${getOperator(item)} in ${getCountryName(item.source_country)} - ${item.avgTime}ms`;
      addToTickerQueue(msg, 'new');
    });
    // Refresh ticker with summaries after new tests
    updateTickerWithSummaries();
  } catch (err) {
    console.error('Ticker API error:', err);
  }
}

const scheduleBatchProcessing = () => {
  if (state.batchScheduleId) clearInterval(state.batchScheduleId);
  state.batchScheduleId = setInterval(() => {
    if (state.pendingArcs.length > 0 && state.flightArcs.length < CONFIG.maxActiveArcs) {
      processPendingArcs();
    } else if (state.pendingArcs.length === 0 && !state.hasMoreData) {
      console.log('🎬 All animation arcs processed (will loop infinitely as they fade)');
    }
  }, CONFIG.animationBatchInterval);
};

// Audio detection for system audio monitoring
let audioContext = null;
let analyser = null;
let microphone = null;
let audioDetectionEnabled = false;
let isOtherAudioPlaying = false;
let audioCheckInterval = null;
let grokDetectionEnabled = false;
let lastGrokDetection = 0;
const GROK_COOLDOWN = 10000; // 10 seconds cooldown after detecting "grok"

// Initialize audio detection
const initAudioDetection = async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Request microphone access to monitor system audio
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    });
    
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    audioDetectionEnabled = true;
    grokDetectionEnabled = true;
    startAudioMonitoring();
    
    console.log('🎤 Audio detection initialized successfully');
  } catch (error) {
    console.warn('⚠️ Audio detection failed (will use fallback timing):', error);
    // Fallback to timing-based delays
  }
};

// Monitor system audio levels and detect Grok
const startAudioMonitoring = () => {
  if (!audioDetectionEnabled || !analyser) return;
  
  audioCheckInterval = setInterval(() => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average audio level with better sensitivity
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const threshold = 8; // Lower threshold for better detection
    const grokThreshold = threshold * 1.5; // Separate threshold for Grok detection
    
    const wasPlaying = isOtherAudioPlaying;
    isOtherAudioPlaying = average > threshold;
    
    if (isOtherAudioPlaying && !wasPlaying) {
      console.log('🔊 Detected other audio playing, pausing TTS');
      // Clear non-critical messages from queue when other audio is detected
      if (ttsQueue.length > 0) {
        const criticalMessages = ttsQueue.filter(item => item.priority === TTS_PRIORITY.CRITICAL);
        ttsQueue.length = 0;
        ttsQueue.push(...criticalMessages);
        console.log('🧹 Cleared non-critical TTS messages, kept critical ones');
      }
    } else if (!isOtherAudioPlaying && wasPlaying) {
      console.log('🔇 Other audio stopped, resuming TTS in 2 seconds');
      setTimeout(() => {
        if (ttsQueue.length > 0 && !ttsSpeaking) {
          processTTSQueue();
        }
      }, 2000); // Wait 2 seconds after audio stops before resuming
    }
    
    // Enhanced Grok detection - if audio level is very high, assume Grok is speaking
    if (grokDetectionEnabled && average > grokThreshold) {
      const now = Date.now();
      if (now - lastGrokDetection > GROK_COOLDOWN) {
        console.log('🤖 Grok activity detected, pausing TTS for 8 seconds');
        lastGrokDetection = now;
        // Pause TTS for longer period when Grok is detected
        if (ttsSpeaking) {
          ttsSpeaking = false;
          setTimeout(() => {
            if (ttsQueue.length > 0) {
              processTTSQueue();
            }
          }, 8000); // Wait 8 seconds before resuming after Grok detection
        }
      }
    }
  }, 100); // Check every 100ms
};

// Stop audio monitoring
const stopAudioMonitoring = () => {
  if (audioCheckInterval) {
    clearInterval(audioCheckInterval);
    audioCheckInterval = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  audioDetectionEnabled = false;
  grokDetectionEnabled = false;
};

// TTS Constants
const TTS_PRIORITY = {
  CRITICAL: 1,
  BAD_PERFORMANCE: 2,
  NEW_TEST: 3,
  INFO: 4
};

const MIN_TTS_INTERVAL = 3000; // 3 seconds minimum between TTS messages
const POST_TTS_COOLDOWN = 15000; // 15 seconds cooldown after TTS finishes
const AUDIO_DETECTION_THRESHOLD = 0.1; // Lower threshold for better detection

async function speakQueued(text, priority = TTS_PRIORITY.INFO) {
  ttsQueue.push({ text, priority });
  if (!ttsSpeaking) processTTSQueue();
}

async function processTTSQueue() {
  if (ttsQueue.length === 0) {
    ttsSpeaking = false;
    return;
  }
  
  // Sort queue by priority (critical first)
  ttsQueue.sort((a, b) => a.priority - b.priority);
  
  // Check if other audio is playing and wait if needed
  if (audioDetectionEnabled && isOtherAudioPlaying) {
    console.log('⏸️ Other audio detected, waiting for silence before TTS...');
    let waitTime = 0;
    const maxWaitTime = 30000; // 30 seconds wait for silence
    
    while (isOtherAudioPlaying && waitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
      waitTime += 1000;
    }
    
    if (waitTime >= maxWaitTime) {
      console.log('⏰ Max wait time reached, proceeding with TTS');
    } else {
      console.log('✅ Silence detected, proceeding with TTS');
    }
  }
  
  // Additional check for minimum interval
  const now = Date.now();
  if (lastTTSFinishTime && (now - lastTTSFinishTime) < MIN_TTS_INTERVAL) {
    console.log('⏳ Waiting for minimum TTS interval...');
    await new Promise(resolve => setTimeout(resolve, MIN_TTS_INTERVAL - (now - lastTTSFinishTime)));
  }
  
  ttsSpeaking = true;
  const { text, priority } = ttsQueue.shift();
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy'
      })
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play();
    });
    
    // Extended cooldown after audio finishes
    console.log('🎤 Audio finished, waiting 15 seconds before next TTS...');
    lastTTSFinishTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, POST_TTS_COOLDOWN));
    
  } catch (error) {
    console.error('TTS error:', error);
  }
  processTTSQueue();
}



const animateArcs = (now, delta) => {
  let lastDebugLog = 0;
  const debugInterval = 1000;

  state.flightArcs = state.flightArcs.filter(arc => {
    if (!arc.points || arc.points.length < 2) {
      console.warn('Removing invalid arc without points');
      return false;
    }
    const age = now - arc.startTime;

    if (age > arc.arcDuration + arc.traceTime) {
      state.arcGroup.remove(arc.tube);
      state.arcGroup.remove(arc.particle);
      state.arcGroup.remove(arc.sourceDot);
      state.arcGroup.remove(arc.destDot);
      arc.tube.geometry.dispose();
      arc.tube.material.dispose();
      arc.particle.geometry.dispose();
      arc.particle.material.dispose();
      arc.sourceDot.geometry.dispose();
      arc.sourceDot.material.dispose();
      arc.destDot.geometry.dispose();
      arc.destDot.material.dispose();
      if (arc.warning) {
        state.scene.remove(arc.warning.mesh);
        arc.warning.mesh.geometry.dispose();
        arc.warning.mesh.material.dispose();
      }
      if (CONFIG.debug) console.log('Arc removed and pushed to pending:', arc.source_country, 'to', arc.dest_country);
      
      state.pendingArcs.push({
        source_latitude: arc.source.lat,
        source_longitude: arc.source.lng,
        dest_latitude: arc.destination.lat,
        dest_longitude: arc.destination.lng,
        avgTime: arc.latency,
        source_country: arc.source_country,
        dest_country: arc.dest_country,
        operator: arc.operator,
        source_region: arc.source_region,
        dest_region: arc.dest_region,
        network_type: arc.network_type,
        created_at: arc.created_at
      });
      
      return false;
    }

    const drawTime = arc.arcDuration - CONFIG.arcFadeTime;

    let fadeOpacity = 1;
    if (age > drawTime) {
      const fadeAge = age - drawTime;
      fadeOpacity = Math.max(0.1, (CONFIG.arcFadeTime - fadeAge) / CONFIG.arcFadeTime ** 1.5);
    }

    arc.tube.material.opacity = fadeOpacity;
    arc.sourceDot.material.opacity = fadeOpacity;
    arc.destDot.material.opacity = fadeOpacity;

    let particleOpacity = fadeOpacity * CONFIG.glowIntensity;
    if (age > arc.arcDuration) particleOpacity = 0;
    arc.particle.material.opacity = particleOpacity;

    if (age > arc.arcDuration && !arc.isTrace) {
      arc.isTrace = true;
      const newGeometry = new TubeGeometry(arc.tube.geometry.parameters.path, arc.tube.geometry.parameters.tubularSegments, 0.009, 8, false);
      arc.tube.geometry.dispose();
      arc.tube.geometry = newGeometry;
      arc.tube.material.blending = AdditiveBlending;
    }

    let drawProgress = 0;
    if (age < drawTime) {
      drawProgress = age / drawTime;
    } else {
      drawProgress = 1;
    }

    arc.progress += arc.particleSpeed * delta;
    if (arc.progress > drawProgress) arc.progress = drawProgress;

    const pointIndex = Math.floor(arc.progress * (arc.points.length - 1));
    const point = arc.points[pointIndex];
    if (point && typeof point.x === 'number' && typeof point.y === 'number' && typeof point.z === 'number') {
      arc.particle.geometry.attributes.position.setXYZ(0, point.x, point.y, point.z);
      arc.particle.geometry.attributes.position.needsUpdate = true;
    }

    if (drawProgress < 1) {
      const newPoints = arc.points.slice(0, pointIndex + 1);
      if (newPoints.length < 2) return true;
      const newCurve = new CatmullRomCurve3(newPoints);
      const newGeometry = new TubeGeometry(newCurve, newPoints.length - 1, 0.007, 8, false);
      arc.tube.geometry.dispose();
      arc.tube.geometry = newGeometry;
    }

    if (arc.warning) {
      arc.warning.mesh.position.add(arc.warning.velocity.clone().multiplyScalar(delta));
      arc.warning.mesh.material.opacity -= 0.001 * delta;
      if (arc.warning.mesh.material.opacity < 0) arc.warning.mesh.material.opacity = 0;
    }

    if (CONFIG.debug && now - lastDebugLog > debugInterval) {
      console.log('[DEBUG] Arc Tube:', {
        Opacity: arc.tube.material.opacity,
        Color: arc.tube.material.color.getHexString(),
        Visible: arc.tube.visible,
        Segments: arc.tube.geometry.parameters.tubularSegments,
        Progress: arc.progress,
        Source: arc.source_country,
        Destination: arc.dest_country
      });
      lastDebugLog = now;
    }

    return true;
  });
};

const regionCodeFromName = (name) => {
  for (const [code, full] of Object.entries(continentCodeToName)) {
    if (full === name) return code;
  }
  if (name === 'Middle East') return 'ME';
  if (name === 'Oceania') return 'OC';
  return name.slice(0, 2).toUpperCase();
};

const updateHUD = (now) => {
  if (now - state.lastStatsUpdate < state.statsUpdateInterval) return;

  let allLatencies = [];
  let allOperators = {};
  let allCountries = {};
  let allRegions = {};
  let connectionTypes = {};
  let breachesByOperator = {};
  let breachesByCountry = {};
  let breaches = 0;
  let seriousBreaches = 0;
  let regionsMatrix = {};

  // Initialize variables with default values to prevent undefined errors
  let avgLatency = 0;
  let breachRate = 0;
  let complianceRate = 0;
  let worstPerformers = [];
  let topWorstCountries = [];
  let topBreachesOperators = [];
  let topBreachesCountries = [];

  const processData = (data, isActive = false) => {
    const l = data.latency || parseFloat(data.avgTime) || 0;
    if (l <= 0) return;
    const srcReg = customRegionMap[data.source_country]
      ? 'Middle East'
      : oceaniaCountryMap[data.source_country]
        ? 'Oceania'
        : (continentCodeToName[data.source_region] || data.source_region || 'Unknown');
    const destReg = continentCodeToName[data.dest_region] || data.dest_region || 'Unknown';
    const minLatency = (srcReg === destReg && srcReg !== 'Unknown') ? 20 : 100;
    if (l < minLatency) return;
    allLatencies.push(l);
    const op = getOperator(data);
    const country = data.source_country || 'Unknown';
    const opKey = `${op}_${country}`;
    if (op !== 'Unknown' && country !== 'Unknown') {
      if (!allOperators[opKey]) allOperators[opKey] = {sum: 0, count: 0, op, country, poorCount: 0};
      allOperators[opKey].sum += l;
      allOperators[opKey].count++;
      if (l > 400) allOperators[opKey].poorCount++;
    }

    if (country !== 'Unknown') {
      if (!allCountries[country]) allCountries[country] = {sum: 0, count: 0, poorCount: 0, operators: new Set()};
      allCountries[country].sum += l;
      allCountries[country].count++;
      allCountries[country].operators.add(op);
      if (l > 400) allCountries[country].poorCount++;
    }

    const srcRegCode = data.source_region || 'Unknown';
    const destRegCode = data.dest_region || 'Unknown';
   
    if (srcReg !== 'Unknown' && srcReg !== null && srcReg !== 'null') {
      if (!allRegions[srcReg]) allRegions[srcReg] = {sum: 0, count: 0};
      allRegions[srcReg].sum += l;
      allRegions[srcReg].count++;
    }

    const type = data.network_type || 'unknown';
    if (!connectionTypes[type]) connectionTypes[type] = {sum: 0, count: 0};
    connectionTypes[type].sum += l;
    connectionTypes[type].count++;

    const sourceContinent = srcReg;
    const destContinent = destReg;
    const threshold = (sourceContinent === destContinent && sourceContinent !== 'Unknown') ? 100 : 300;

    if (srcReg !== 'Unknown' && destReg !== 'Unknown' && srcReg !== null && destReg !== null && srcReg !== 'null' && destReg !== 'null') {
      if (!regionsMatrix[srcReg]) regionsMatrix[srcReg] = {};
      if (!regionsMatrix[srcReg][destReg]) regionsMatrix[srcReg][destReg] = {sum: 0, count: 0, below: 0};
      regionsMatrix[srcReg][destReg].sum += l;
      regionsMatrix[srcReg][destReg].count++;
      if (l <= threshold) regionsMatrix[srcReg][destReg].below++;
    }

    if (l > threshold) {
      breaches++;
      if (country !== 'Unknown') allCountries[country].poorCount++;

      if (op !== 'Unknown' && country !== 'Unknown') {
        if (!breachesByOperator[opKey]) breachesByOperator[opKey] = {breaches: 0, total: 0, op, country};
        breachesByOperator[opKey].breaches++;
        breachesByOperator[opKey].total = allOperators[opKey].count;
      }

      if (country !== 'Unknown') {
        if (!breachesByCountry[country]) breachesByCountry[country] = {breaches: 0, total: 0};
        breachesByCountry[country].breaches++;
        breachesByCountry[country].total = allCountries[country].count;
      }

      if (l > 400) seriousBreaches++;
    } else {
      if (op !== 'Unknown' && country !== 'Unknown') {
        if (!breachesByOperator[opKey]) breachesByOperator[opKey] = {breaches: 0, total: 0, op, country};
        breachesByOperator[opKey].total = allOperators[opKey].count;
      }

      if (country !== 'Unknown') {
        if (!breachesByCountry[country]) breachesByCountry[country] = {breaches: 0, total: 0};
        breachesByCountry[country].total = allCountries[country].count;
      }
    }
  };

  state.flightArcs.forEach(arc => processData(arc));
  state.pendingArcs.forEach(data => processData(data));

  const totalArcs = allLatencies.length;
  avgLatency = totalArcs > 0 ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / totalArcs) : 0;
  console.log(`📊 Average latency calculation: ${allLatencies.length} latencies, total: ${allLatencies.reduce((a, b) => a + b, 0)}, avg: ${avgLatency}ms`);
  breachRate = totalArcs > 0 ? (breaches / totalArcs * 100).toFixed(0) : 0;
  complianceRate = (100 - breachRate).toFixed(0);
  worstPerformers = Object.values(allOperators).map(value => ({op: value.op, country: value.country, avg: Math.round(value.sum / value.count), poorCount: value.poorCount})).sort((a,b) => b.avg - a.avg).slice(0,5);
  topWorstCountries = Object.values(allCountries).map(value => ({country: value.country, avg: Math.round(value.sum / value.count), operatorsCount: value.operators.size})).sort((a,b) => b.avg - a.avg).slice(0,5);
  topBreachesOperators = Object.values(breachesByOperator).map(value => ({op: value.op, country: value.country, breaches: value.breaches, total: value.total, ratio: value.total > 0 ? value.breaches / value.total : 0})).sort((a,b) => b.ratio - a.ratio).slice(0,5);
  topBreachesCountries = Object.entries(breachesByCountry).map(([country, {breaches, total}]) => ({country, breaches, total, ratio: total > 0 ? breaches / total : 0})).sort((a,b) => b.ratio - a.ratio).slice(0,5).filter(c => c.country !== 'Unknown');

  const countryStats = Object.entries(allCountries).map(([country, {sum, count, poorCount, operators}]) => ({
    country,
    avg: Math.round(sum / count),
    operatorsCount: operators.size,
    poorRatio: count > 0 ? poorCount / count : 0
  })).filter(c => c.country !== 'Unknown');
  const topBestCountries = countryStats.sort((a,b) => a.avg - b.avg).slice(0,5);
  topWorstCountries = countryStats.sort((a,b) => b.avg - a.avg).slice(0,5);

  const regionSummaries = Object.entries(allRegions).map(([region, {sum, count}]) => ({region, avg: Math.round(sum / count)})).filter(r => r.region && r.region !== 'null' && r.region !== 'Unknown').sort((a,b) => a.region.localeCompare(b.region));

  const connectionSummaries = Object.entries(connectionTypes).map(([type, {sum, count}]) => ({type, avg: Math.round(sum / count), count})).sort((a,b) => a.type.localeCompare(b.type));

  let alertsHTML = '';
  let alertsText = '';
  worstPerformers.forEach(p => {
    if (p.avg > 400) {
      alertsHTML += `<div class="alert">High latency alert for ${p.op} in ${getCountryName(p.country)}: ${p.avg} ms</div>`;
      alertsText += `High latency alert for ${p.op} in ${getCountryName(p.country)}: ${p.avg} ms. `;
    }
  });

  const sourceRegionsWithData = Object.entries(regionsMatrix)
    .filter(([_, dests]) => Object.values(dests || {}).some(val => val?.count > 0))
    .map(([src]) => src);

  const destRegionsWithData = Object.values(regionsMatrix)
    .flatMap(destMap =>
      Object.entries(destMap || {})
        .filter(([_, val]) => val?.count > 0)
        .map(([dest]) => dest)
    );

  const activeRegions = [...new Set([...sourceRegionsWithData, ...destRegionsWithData])]
    .filter(r => typeof r === 'string' && r.trim() !== '' && r !== 'null' && r !== 'Unknown')
    .sort();

  let matrixHTML = `
    <h3>Latency Matrix (ms)</h3>
    <div style="overflow-x:auto; width:100%; margin:0 auto;">
    <table style="
      border-collapse: collapse;
      font-size: 11px;
      margin: 0 auto;
      white-space: nowrap;
      text-align: left;
      table-layout: fixed;
      width: 100%;
      min-width: 320px;
      max-width: 100%;
    ">
      <thead>
        <tr>
          <th style="
            padding: 2px 3px;
            background-color: #222;
            color: white;
            position: sticky;
            top: 0;
            left: 0;
            z-index: 3;
            text-align: center;
            width: 36px;
          ">Src/Dst</th>
          ${activeRegions.map(region => `
            <th style="
              padding: 2px 3px;
              background-color: #333;
              color: white;
              position: sticky;
              top: 0;
              z-index: 2;
              width: 36px;
              font-size:11px;
            ">${regionCodeFromName(region)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>`;

  activeRegions.forEach(src => {
    matrixHTML += `
      <tr>
        <td style="
          padding: 2px 3px;
          font-weight: bold;
          background-color: #333;
          color: white;
          position: sticky;
          left: 0;
          z-index: 1;
          text-align: center;
          width: 36px;
          font-size:11px;
        ">${regionCodeFromName(src)}</td>`;

    activeRegions.forEach(dest => {
      const val = regionsMatrix?.[src]?.[dest];
      if (val && val.count > 0) {
        const avg = Math.round(val.sum / val.count);
        const colorNum = getLatencyColor(avg);
        const bgColor = '#' + new THREE.Color(colorNum).getHexString();
        matrixHTML += `
          <td style="
            padding: 2px 3px;
            background-color: ${bgColor};
            color: white;
            font-size: 11px;
            width: 36px;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          ">${avg}</td>`;
      } else {
        matrixHTML += `<td style="padding: 2px 3px; color: #888; width: 36px; text-align: center;">–</td>`;
      }
    });

    matrixHTML += '</tr>';
  });

  matrixHTML += '</tbody></table></div>';

  let maxRegionAvg = 0;
  regionSummaries.forEach(r => {
    if (r.avg > maxRegionAvg) maxRegionAvg = r.avg;
  });
  let barChartHTML = '';
  regionSummaries.forEach(r => {
    const width = maxRegionAvg > 0 ? (r.avg / maxRegionAvg * 100) : 0;
    barChartHTML += `
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="width: 100px; overflow: hidden; text-overflow: ellipsis;">${r.region}</span>
        <div style="background: linear-gradient(to right,rgb(243, 8, 0),rgb(40, 202, 0)); width: ${width}%; height: 10px; margin: 0 5px;"></div>
        <span>${r.avg} ms</span>
      </div>
    `;
  });

  const operatorStats = Object.values(allOperators).map(op => {
    let sameRegionLatencies = [], crossRegionLatencies = [], sameCompliant = 0, crossCompliant = 0, total = 0;
    state.flightArcs.concat(state.pendingArcs).forEach(arc => {
      if (arc.operator === op.op && arc.source_country === op.country) {
        const srcReg = customRegionMap[arc.source_country] ? 'Middle East' : oceaniaCountryMap[arc.source_country] ? 'Oceania' : (continentCodeToName[arc.source_region] || arc.source_region || 'Unknown');
        const destReg = continentCodeToName[arc.dest_region] || arc.dest_region || 'Unknown';
        const latency = arc.latency || parseFloat(arc.avgTime) || 0;
        if (latency <= 0) return;
        if (srcReg === destReg) {
          sameRegionLatencies.push(latency);
          if (latency <= 100) sameCompliant++;
        } else {
          crossRegionLatencies.push(latency);
          if (latency <= 300) crossCompliant++;
        }
        total++;
      }
    });
    const avgSame = sameRegionLatencies.length ? Math.round(sameRegionLatencies.reduce((a,b) => a+b,0)/sameRegionLatencies.length) : 'N/A';
    const avgCross = crossRegionLatencies.length ? Math.round(crossRegionLatencies.reduce((a,b) => a+b,0)/crossRegionLatencies.length) : 'N/A';
    const regionalCompliance = sameRegionLatencies.length ? Math.round((sameCompliant / sameRegionLatencies.length) * 100) : 0;
    const globalCompliance = crossRegionLatencies.length ? Math.round((crossCompliant / crossRegionLatencies.length) * 100) : 0;
    const avgLatency = total ? Math.round((sameRegionLatencies.concat(crossRegionLatencies)).reduce((a,b) => a+b,0)/total) : 'N/A';
    return {
      op: op.op,
      country: op.country,
      avgLatency,
      regionalCompliance,
      globalCompliance,
      avgSame,
      avgCross,
      total
    };
  });

  const countryStatsEnhanced = Object.entries(allCountries).map(([country, {sum, count, poorCount, operators}]) => {
    let sameRegionLatencies = [], crossRegionLatencies = [], sameCompliant = 0, crossCompliant = 0;
    state.flightArcs.concat(state.pendingArcs).forEach(arc => {
      if (arc.source_country === country) {
        const srcReg = customRegionMap[arc.source_country] ? 'Middle East' : oceaniaCountryMap[arc.source_country] ? 'Oceania' : (continentCodeToName[arc.source_region] || arc.source_region || 'Unknown');
        const destReg = continentCodeToName[arc.dest_region] || arc.dest_region || 'Unknown';
        const latency = arc.latency || parseFloat(arc.avgTime) || 0;
        if (latency <= 0) return;
        if (srcReg === destReg) {
          sameRegionLatencies.push(latency);
          if (latency <= 100) sameCompliant++;
        } else {
          crossRegionLatencies.push(latency);
          if (latency <= 300) crossCompliant++;
        }
      }
    });
    const avgSame = sameRegionLatencies.length ? Math.round(sameRegionLatencies.reduce((a,b) => a+b,0)/sameRegionLatencies.length) : 'N/A';
    const avgCross = crossRegionLatencies.length ? Math.round(crossRegionLatencies.reduce((a,b) => a+b,0)/crossRegionLatencies.length) : 'N/A';
    const regionalCompliance = sameRegionLatencies.length ? Math.round((sameCompliant / sameRegionLatencies.length) * 100) : 0;
    const globalCompliance = crossRegionLatencies.length ? Math.round((crossCompliant / crossRegionLatencies.length) * 100) : 0;
    const avgLatency = count ? Math.round(sum / count) : 'N/A';
    return {
      country,
      avgLatency,
      regionalCompliance,
      globalCompliance,
      avgSame,
      avgCross,
      operatorsCount: operators.size
    };
  });

  const hudElement = document.getElementById('hud-stats');
  if (hudElement) {
    const hudStatsString = JSON.stringify({
      complianceRate,
      avgLatency: state.avgLatency,
      breaches,
      seriousBreaches,
      operatorStats,
      countryStatsEnhanced,
      topBreachesOperators,
      topBreachesCountries,
      connectionSummaries,
      matrixHTML,
      alertsHTML,
      barChartHTML
    });
    if (hudStatsString !== lastHudStats) {
      hudElement.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          #hud-stats { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; font-family: 'Roboto', sans-serif; color: #ffffff; z-index: 2; }
          .title { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; font-size: 24px; }
          .title img { width: 40px; margin-right: 10px; opacity: 0.8; }
          .kpi-cards { position: absolute; top: 60px; left: 50%; transform: translateX(-50%); display: flex; justify-content: center; gap: 20px; }
          .kpi-card { background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 8px; text-align: center; box-shadow: 0 0 10px rgba(173,216,230,0.2); }
          .kpi-card h4 { margin: 0; color: #add8e6; font-size: 16px; }
          .kpi-card p { margin: 5px 0 0; font-size: 24px; font-weight: bold; }
          .left-column { position: absolute; left: 20px; top: 120px; width: 520px; padding: 15px; background: rgba(0,0,0,0.7); border-radius: 8px; overflow-y: auto; max-height: calc(100% - 150px); box-shadow: 0 0 10px rgba(173,216,230,0.2); }
          .right-column { position: absolute; right: 20px; top: 120px; width: 520px; padding: 15px; background: rgba(0,0,0,0.7); border-radius: 8px; overflow-y: auto; max-height: calc(100% - 150px); box-shadow: 0 0 10px rgba(173,216,230,0.2); }
          h3 { color: #add8e6; font-size: 18px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: auto; }
          th, td { border: 1px solid rgba(173,216,230,0.3); padding: 4px 6px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          th { background: rgba(173,216,230,0.18); color: #add8e6; font-size: 12px; height: 110px; vertical-align: bottom; writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 1px; }
          tr th:first-child, tr td:first-child { writing-mode: initial; transform: none; text-align: left; }
          .operator-col { min-width: 120px; max-width: 180px; }
          .country-col { min-width: 60px; max-width: 90px; }
          .flag { width: 16px; vertical-align: middle; margin-right: 4px; }
          .latency-col { min-width: 60px; max-width: 80px; text-align: center; }
          .compliance-col { min-width: 50px; max-width: 60px; text-align: center; }
          .avg-col { min-width: 60px; max-width: 80px; text-align: center; }
          .count-col { min-width: 40px; max-width: 50px; text-align: center; }
          .alert { animation: flash 1s infinite; color: red; font-weight: bold; margin-bottom: 10px; padding: 5px; background: rgba(255,0,0,0.1); border-radius: 4px; }
          @keyframes flash { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
          .legend span { display: block; margin-bottom: 5px; font-size: 14px; }
          .matrix-container { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: auto; padding: 5px; background: rgba(0,0,0,0.7); border-radius: 8px; overflow-x: auto; max-height: 200px; box-shadow: none; font-size: 10px; }
          .matrix-container table { font-size: 10px; }
          .matrix-container th, .matrix-container td { padding: 4px; }
          .alerts-container { position: absolute; top: 10px; right: 20px; padding: 10px; background: rgba(0,0,0,0.7); border-radius: 8px; box-shadow: 0 0 10px rgba(173,216,230,0.2); z-index: 3; }
          .matrix-table h3 { text-align: center; }
          .good { color: #00e676; font-weight: bold; }
          .moderate { color: #ffd600; font-weight: bold; }
          .bad { color: #ff1744; font-weight: bold; }
        </style>
        <div class="title">
          <img src="./qlogo.png" alt="Qualoo Logo">
          Qualoo Live Global Nexus
        </div>
        <div class="kpi-cards">
          <div class="kpi-card">
            <h4>Compliance Rate</h4>
            <p>${complianceRate}%</p>
          </div>
          <div class="kpi-card">
            <h4>Avg Latency</h4>
            <p>${avgLatency} ms</p>
          </div>
          <div class="kpi-card">
            <h4>Breaches</h4>
            <p>${breaches}</p>
          </div>
          <div class="kpi-card">
            <h4>Serious Breaches</h4>
            <p>${seriousBreaches}</p>
          </div>
        </div>
        <div class="alerts-container">
          <h3>Alerts</h3>
          ${alertsHTML}
        </div>
        <div class="left-column">
          <h3>Best Performers (Operators)</h3>
          <table>
            <tr><th class="operator-col">Operator</th><th class="country-col">Country</th><th class="latency-col">Avg Latency</th><th class="compliance-col">Regional Comp.</th><th class="compliance-col">Global Comp.</th><th class="avg-col">Regional Avg</th><th class="avg-col">Global Avg</th></tr>
            ${operatorStats.sort((a,b) => a.avgLatency - b.avgLatency).slice(0,5).map(p => {
              const countryName = (countryCodeToName[p.country] || p.country).slice(0, 30) + ((countryCodeToName[p.country] || p.country).length > 30 ? '...' : '');
              return `<tr><td class="operator-col">${p.op}</td><td class="country-col"><img src="https://flagcdn.com/${p.country.toLowerCase()}.svg" class="flag">${countryName}</td><td class="latency-col">${p.avgLatency} ms</td><td class="compliance-col">${p.regionalCompliance}%</td><td class="compliance-col">${p.globalCompliance}%</td><td class="avg-col">${p.avgSame} ms</td><td class="avg-col">${p.avgCross} ms</td></tr>`;
            }).join('')}
          </table>
          <h3>Best Countries</h3>
          <table>
            <tr><th class="country-col">Country</th><th class="latency-col">Avg Latency</th><th class="compliance-col">Regional Comp.</th><th class="compliance-col">Global Comp.</th><th class="avg-col">Regional Avg</th><th class="avg-col">Global Avg</th><th class="count-col">Operators</th></tr>
            ${countryStatsEnhanced.sort((a,b) => a.avgLatency - b.avgLatency).slice(0,5).map(c => {
              const countryName = (countryCodeToName[c.country] || c.country).slice(0, 30) + ((countryCodeToName[c.country] || c.country).length > 30 ? '...' : '');
              return `<tr><td class="country-col"><img src="https://flagcdn.com/${c.country.toLowerCase()}.svg" class="flag">${countryName}</td><td class="latency-col">${c.avgLatency} ms</td><td class="compliance-col">${c.regionalCompliance}%</td><td class="compliance-col">${c.globalCompliance}%</td><td class="avg-col">${c.avgSame} ms</td><td class="avg-col">${c.avgCross} ms</td><td class="count-col">${c.operatorsCount}</td></tr>`;
            }).join('')}
          </table>
          <div class="matrix-table" style="margin-top:18px;">${matrixHTML}</div>
          <h3>Connection Types</h3>
          <table>
            <tr><th>Type</th><th>Count</th><th>Avg Latency</th></tr>
            ${connectionSummaries.map(s => `<tr><td>${s.type}</td><td>${s.count}</td><td>${s.avg} ms</td></tr>`).join('')}
          </table>
         
        </div>
        <div class="right-column">
          <div>
            <h3>Worst Performers (Operators)</h3>
            <table>
              <tr><th class="operator-col">Operator</th><th class="country-col">Country</th><th class="latency-col">Avg Latency</th><th class="compliance-col">Regional Comp.</th><th class="compliance-col">Global Comp.</th><th class="avg-col">Regional Avg</th><th class="avg-col">Global Avg</th></tr>
              ${operatorStats.sort((a,b) => b.avgLatency - a.avgLatency).slice(0,5).map(p => {
                const countryName = (countryCodeToName[p.country] || p.country).slice(0, 30) + ((countryCodeToName[p.country] || p.country).length > 30 ? '...' : '');
                return `<tr><td class="operator-col">${p.op}</td><td class="country-col"><img src="https://flagcdn.com/${p.country.toLowerCase()}.svg" class="flag">${countryName}</td><td class="latency-col">${p.avgLatency} ms</td><td class="compliance-col">${p.regionalCompliance}%</td><td class="compliance-col">${p.globalCompliance}%</td><td class="avg-col">${p.avgSame} ms</td><td class="avg-col">${p.avgCross} ms</td></tr>`;
              }).join('')}
            </table>
            <h3>Worst Countries</h3>
            <table>
              <tr><th class="country-col">Country</th><th class="latency-col">Avg Latency</th><th class="compliance-col">Regional Comp.</th><th class="compliance-col">Global Comp.</th><th class="avg-col">Regional Avg</th><th class="avg-col">Global Avg</th><th class="count-col">Operators</th></tr>
              ${countryStatsEnhanced.sort((a,b) => b.avgLatency - a.avgLatency).slice(0,5).map(c => {
                const countryName = (countryCodeToName[c.country] || c.country).slice(0, 30) + ((countryCodeToName[c.country] || c.country).length > 30 ? '...' : '');
                return `<tr><td class="country-col"><img src="https://flagcdn.com/${c.country.toLowerCase()}.svg" class="flag">${countryName}</td><td class="latency-col">${c.avgLatency} ms</td><td class="compliance-col">${c.regionalCompliance}%</td><td class="compliance-col">${c.globalCompliance}%</td><td class="avg-col">${c.avgSame} ms</td><td class="avg-col">${c.avgCross} ms</td><td class="count-col">${c.operatorsCount}</td></tr>`;
              }).join('')}
            </table>
          </div>
          <h3>Top Breaches by Operator</h3>
          <table>
            <tr><th class="operator-col">Operator</th><th class="country-col">Country</th><th class="compliance-col">Ratio</th></tr>
            ${topBreachesOperators.map(o => {
              const countryName = (countryCodeToName[o.country] || o.country).slice(0, 30) + ((countryCodeToName[o.country] || o.country).length > 30 ? '...' : '');
              return `<tr><td class="operator-col">${o.op}</td><td class="country-col"><img src="https://flagcdn.com/${o.country.toLowerCase()}.svg" class="flag">${countryName}</td><td class="compliance-col">${Math.min((o.ratio * 100).toFixed(0), 100)}%</td></tr>`;
            }).join('')}
          </table>
          <h3>Top Breaches by Country</h3>
          <table>
            <tr><th class="country-col">Country</th><th class="compliance-col">Ratio</th></tr>
            ${topBreachesCountries.map(c => {
              const countryName = (countryCodeToName[c.country] || c.country).slice(0, 30) + ((countryCodeToName[c.country] || c.country).length > 30 ? '...' : '');
              return `<tr><td class="country-col"><img src="https://flagcdn.com/${c.country.toLowerCase()}.svg" class="flag">${countryName}</td><td class="compliance-col">${Math.min((c.ratio * 100).toFixed(0), 100)}%</td></tr>`;
            }).join('')}
          </table>
        </div>
      `;
      lastHudStats = hudStatsString;
    }
  }

  Object.entries(allCountries).forEach(([country, stats]) => {
    const compliance = 1 - stats.poorRatio;
    let ragColor;
    if (compliance >= 0.8) ragColor = 0x00ff00;
    else if (compliance >= 0.5) ragColor = 0xffbf00;
    else ragColor = 0xff0000;
    const color = new Color(ragColor);

    if (state.countryLines[country]) {
      state.countryLines[country].forEach(line => {
        line.material.color = color;
        line.material.needsUpdate = true;
      });
    }

    if (state.countryLabels[country]) {
      state.countryLabels[country].material.color = color;
      state.countryLabels[country].material.needsUpdate = true;
    }
  });

  const speakInterval = 60000;
  if (now - state.lastSpoken > speakInterval) {
    let speakText = '';
    let extremeOps = worstPerformers.filter(p => p.avg > 500).map(p => `${p.op} in ${getCountryName(p.country)} at ${p.avg} ms`);
    if (extremeOps.length > 0) {
      speakText += `Extremely high latencies detected for ${extremeOps.join(', and ')}. These could indicate significant network issues in those regions. `;
    }
    let manyInstances = worstPerformers.filter(p => p.poorCount > 10 && p.avg <= 500).map(p => `${p.op} in ${getCountryName(p.country)}`);
    if (manyInstances.length > 0) {
      speakText += `Numerous high latency instances reported for ${manyInstances.join(', and ')}. Operators may need to investigate potential congestion. `;
    }
    let highRoutes = [];
    activeRegions.forEach(src => {
      activeRegions.forEach(dest => {
        const val = regionsMatrix[src]?.[dest];
        if (val) {
          const avg = Math.round(val.sum / val.count);
          if (avg > 500) {
            highRoutes.push(`from ${src} to ${dest} at ${avg} ms`);
          }
        }
      });
    });
    if (highRoutes.length > 0) {
      speakText += `Notable high latency routes include ${highRoutes.join(', and ')}. This might suggest inter-continental infrastructure challenges. `;
    }
      // Store current stats in state for news-style TTS updates
  state.worstPerformers = worstPerformers || [];
  state.topWorstCountries = topWorstCountries || [];
  state.topBreachesOperators = topBreachesOperators || [];
  state.topBreachesCountries = topBreachesCountries || [];
  state.regionsMatrix = regionsMatrix || {};
  state.avgLatency = avgLatency || 0;
  state.breachRate = breachRate || 0;
  state.complianceRate = complianceRate || 0;
  state.seriousBreaches = seriousBreaches || 0;
  
  // Trigger immediate alert for serious breaches
  if (seriousBreaches > 0 && now - state.lastAlertTime > 15000) { // Every 15 seconds for alerts
    const alertMessage = `CRITICAL: ${seriousBreaches} serious breaches. Network failing.`;
    speakQueued(alertMessage);
    state.lastAlertTime = now;
  }
  }

  state.lastStatsUpdate = now;

  const operatorCards = Object.values(allOperators).map(op => {
    let sameRegionLatencies = [], crossRegionLatencies = [], total = 0, compliant = 0;
    state.flightArcs.concat(state.pendingArcs).forEach(arc => {
      if (arc.operator === op.op && arc.source_country === op.country) {
        const srcReg = customRegionMap[arc.source_country] ? 'Middle East' : oceaniaCountryMap[arc.source_country] ? 'Oceania' : (continentCodeToName[arc.source_region] || arc.source_region || 'Unknown');
        const destReg = continentCodeToName[arc.dest_region] || arc.dest_region || 'Unknown';
        const latency = arc.latency || parseFloat(arc.avgTime) || 0;
        if (latency <= 0) return;
        if (srcReg === destReg) {
          sameRegionLatencies.push(latency);
          if (latency <= 100) compliant++;
        } else {
          crossRegionLatencies.push(latency);
          if (latency <= 300) compliant++;
        }
        total++;
      }
    });
    const avgSame = sameRegionLatencies.length ? Math.round(sameRegionLatencies.reduce((a,b) => a+b,0)/sameRegionLatencies.length) : 'N/A';
    const avgCross = crossRegionLatencies.length ? Math.round(crossRegionLatencies.reduce((a,b) => a+b,0)/crossRegionLatencies.length) : 'N/A';
    const compliance = total ? Math.round((compliant/total)*100) : 0;
    return {
      asn: op.op,
      name: op.op,
      country: op.country,
      avgSame,
      avgCross,
      compliance,
      color: compliance >= 80 ? '#00c853' : compliance >= 50 ? '#ffd600' : '#d50000',
      complianceRaw: compliance,
      total,
      compliant
    };
  });
  const topOperatorCards = operatorCards.sort((a,b) => b.complianceRaw - a.complianceRaw).slice(0, 5);
  const worstOperatorCards = operatorCards.sort((a,b) => a.complianceRaw - b.complianceRaw).slice(0, 5);

  // renderSimpleOperatorTicker(topOperatorCards, worstOperatorCards); // Removed to prevent duplicate tickers
};

const getBreakingNewsItems = () => {
  let breaking = [];
  const allArcs = state.flightArcs.concat(state.pendingArcs);
  
  if (allArcs.length === 0) return breaking;
  
  // Calculate global performance benchmarks
  const allLatencies = allArcs.map(arc => arc.latency || parseFloat(arc.avgTime) || 0).filter(l => l > 0);
  const globalAvgLatency = allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0;
  const globalP95Latency = allLatencies.length > 0 ? allLatencies.sort((a, b) => a - b)[Math.floor(allLatencies.length * 0.95)] : 0;
  const globalP10Latency = allLatencies.length > 0 ? allLatencies.sort((a, b) => a - b)[Math.floor(allLatencies.length * 0.1)] : 0;
  
  console.log(`📊 Global benchmarks: Avg=${Math.round(globalAvgLatency)}ms, P95=${Math.round(globalP95Latency)}ms, P10=${Math.round(globalP10Latency)}ms`);
  
  // 1. Operator Performance Analysis (Relative to Global)
  const operatorCards = Object.values(allArcs.reduce((acc, arc) => {
    const key = arc.operator + '_' + arc.source_country;
    if (!acc[key]) acc[key] = {op: arc.operator, country: arc.source_country, latencies: [], routes: 0, issues: 0};
    acc[key].latencies.push(arc.latency || parseFloat(arc.avgTime) || 0);
    acc[key].routes++;
    if ((arc.latency || parseFloat(arc.avgTime) || 0) > globalP95Latency) acc[key].issues++;
    return acc;
  }, {})).map(o => {
    const avg = o.latencies.length ? Math.round(o.latencies.reduce((a,b) => a+b,0)/o.latencies.length) : 0;
    const compliance = o.routes > 0 ? Math.round(((o.routes - o.issues) / o.routes) * 100) : 0;
    const percentile = allLatencies.length > 0 ? (allLatencies.filter(l => l <= avg).length / allLatencies.length) * 100 : 50;
    return {op: o.op, country: o.country, avg, compliance, issues: o.issues, routes: o.routes, percentile};
  });
  
  // Critical operators (significantly worse than global average)
  operatorCards.filter(o => 
    o.avg > globalP95Latency && o.compliance < 30 && o.op !== 'Unknown' && o.country !== 'Unknown' && o.routes >= 5
  ).forEach(o => {
    breaking.push({
      type: 'critical_operator',
      text: `🚨 CRITICAL: ${o.op} in ${getCountryName(o.country)} - ${o.avg}ms (${Math.round(o.percentile)}th percentile), ${o.compliance}% compliance`,
      key: `critical_${o.op}_${o.country}`
    });
  });
  
  // Serious compliance breaches (relative to global performance)
  operatorCards.filter(o => 
    o.avg > globalAvgLatency * 1.5 && o.compliance < 50 && o.op !== 'Unknown' && o.country !== 'Unknown' && o.routes >= 3
  ).forEach(o => {
    breaking.push({
      type: 'breach',
      text: `⚠️ COMPLIANCE BREACH: ${o.op} in ${getCountryName(o.country)} - ${o.avg}ms (${Math.round(o.percentile)}th percentile), ${o.compliance}% compliance`,
      key: `breach_${o.op}_${o.country}`
    });
  });
  
  // 2. Country Performance Analysis (Relative to Global)
  const countryStats = Object.values(allArcs.reduce((acc, arc) => {
    const country = arc.source_country || 'Unknown';
    if (!acc[country]) acc[country] = {country, latencies: [], operators: new Set(), routes: 0, issues: 0};
    acc[country].latencies.push(arc.latency || parseFloat(arc.avgTime) || 0);
    acc[country].operators.add(arc.operator);
    acc[country].routes++;
    if ((arc.latency || parseFloat(arc.avgTime) || 0) > globalP95Latency) acc[country].issues++;
    return acc;
  }, {})).map(c => {
    const avg = c.latencies.length ? Math.round(c.latencies.reduce((a,b) => a+b,0)/c.latencies.length) : 0;
    const compliance = c.routes > 0 ? Math.round(((c.routes - c.issues) / c.routes) * 100) : 0;
    const percentile = allLatencies.length > 0 ? (allLatencies.filter(l => l <= avg).length / allLatencies.length) * 100 : 50;
    return {country: c.country, avg, compliance, issues: c.issues, routes: c.routes, operatorCount: c.operators.size, percentile};
  });
  
  // Countries with major issues (relative to global)
  countryStats.filter(c => 
    c.avg > globalP95Latency && c.compliance < 40 && c.country !== 'Unknown' && c.routes >= 10
  ).forEach(c => {
    breaking.push({
      type: 'country_issue',
      text: `🌍 DIGITAL DIVIDE: ${getCountryName(c.country)} - ${c.avg}ms (${Math.round(c.percentile)}th percentile), ${c.compliance}% compliance`,
      key: `country_${c.country}`
    });
  });
  
  // 3. Global Route Analysis (Relative Performance)
  let regionsMatrix = {};
  allArcs.forEach(arc => {
    const srcReg = customRegionMap[arc.source_country] ? 'Middle East' : oceaniaCountryMap[arc.source_country] ? 'Oceania' : (continentCodeToName[arc.source_region] || arc.source_region || 'Unknown');
    const destReg = continentCodeToName[arc.dest_region] || arc.dest_region || 'Unknown';
    if (!regionsMatrix[srcReg]) regionsMatrix[srcReg] = {};
    if (!regionsMatrix[srcReg][destReg]) regionsMatrix[srcReg][destReg] = [];
    regionsMatrix[srcReg][destReg].push(arc.latency || parseFloat(arc.avgTime) || 0);
  });
  
  Object.entries(regionsMatrix).forEach(([src, dests]) => {
    Object.entries(dests).forEach(([dest, lats]) => {
      if (lats.length > 10) {
        const avg = Math.round(lats.reduce((a,b) => a+b,0)/lats.length);
        const issues = lats.filter(l => l > globalP95Latency).length;
        const compliance = Math.round(((lats.length - issues) / lats.length) * 100);
        const percentile = allLatencies.length > 0 ? (allLatencies.filter(l => l <= avg).length / allLatencies.length) * 100 : 50;
        
        // Critical routes (significantly worse than global)
        if (avg > globalP95Latency * 1.2 && compliance < 30) {
          breaking.push({
            type: 'critical_route',
            text: `🌐 CRITICAL ROUTE: ${src} to ${dest} - ${avg}ms (${Math.round(percentile)}th percentile), ${compliance}% compliance`,
            key: `route_${src}_${dest}`
          });
        } else if (avg > globalAvgLatency * 1.5 && compliance < 50) {
          breaking.push({
            type: 'route_issue',
            text: `🌐 ROUTE ISSUE: ${src} to ${dest} - ${avg}ms (${Math.round(percentile)}th percentile), ${compliance}% compliance`,
            key: `route_${src}_${dest}`
          });
        }
      }
    });
  });
  
  // 4. Wired Node Issues (Relative to Global)
  const wiredNodes = allArcs.filter(arc => arc.location_patched);
  if (wiredNodes.length > 0) {
    const wiredLatencies = wiredNodes.map(arc => arc.latency || parseFloat(arc.avgTime) || 0).filter(l => l > 0);
    const avgWiredLatency = wiredLatencies.length > 0 ? Math.round(wiredLatencies.reduce((a,b) => a+b,0)/wiredLatencies.length) : 0;
    const wiredPercentile = allLatencies.length > 0 ? (allLatencies.filter(l => l <= avgWiredLatency).length / allLatencies.length) * 100 : 50;
    
    if (avgWiredLatency > globalP95Latency) {
      breaking.push({
        type: 'wired_issue',
        text: `🔌 WIRED ISSUE: ${wiredNodes.length} wired nodes showing ${avgWiredLatency}ms (${Math.round(wiredPercentile)}th percentile)`,
        key: 'wired_issues'
      });
    }
  }
  
  // 5. Bad Performance Callouts (Red pills) - Aggressive naming
  // Worst operators (bottom 10% performance)
  operatorCards.filter(o => 
    o.avg >= globalP90Latency && o.avg > 300 && o.op !== 'Unknown' && o.country !== 'Unknown' && o.routes >= 5
  ).forEach(o => {
    breaking.push({
      type: 'bad_performance',
      text: `🚨 BAD ISP: ${o.op} in ${getCountryName(o.country)} - ${o.avg}ms (${Math.round(o.percentile)}th percentile), ${o.compliance}% compliance`,
      key: `bad_isp_${o.op}_${o.country}`
    });
  });
  
  // Worst countries (bottom 20% performance)
  countryStats.filter(c => 
    c.avg >= globalP80Latency && c.avg > 300 && c.country !== 'Unknown' && c.routes >= 10
  ).forEach(c => {
    breaking.push({
      type: 'bad_country',
      text: `🌍 BAD COUNTRY: ${getCountryName(c.country)} - ${c.avg}ms (${Math.round(c.percentile)}th percentile), ${c.compliance}% compliance`,
      key: `bad_country_${c.country}`
    });
  });
  
  // Bad global routes (bottom 15% performance)
  Object.entries(regionsMatrix).forEach(([src, dests]) => {
    Object.entries(dests).forEach(([dest, lats]) => {
      if (lats.length > 10) {
        const avg = Math.round(lats.reduce((a,b) => a+b,0)/lats.length);
        const issues = lats.filter(l => l > globalP95Latency).length;
        const compliance = Math.round(((lats.length - issues) / lats.length) * 100);
        const percentile = allLatencies.length > 0 ? (allLatencies.filter(l => l <= avg).length / allLatencies.length) * 100 : 50;
        
        if (avg >= globalP85Latency && avg > 300 && compliance < 70) {
          breaking.push({
            type: 'bad_route',
            text: `🌐 BAD ROUTE: ${src} to ${dest} - ${avg}ms (${Math.round(percentile)}th percentile), ${compliance}% compliance`,
            key: `bad_route_${src}_${dest}`
          });
        }
      }
    });
  });
  
  // 6. Network Type Performance (Relative Analysis)
  const networkTypes = {};
  allArcs.forEach(arc => {
    const type = arc.network_type || 'unknown';
    if (!networkTypes[type]) networkTypes[type] = { sum: 0, count: 0 };
    networkTypes[type].sum += arc.latency || parseFloat(arc.avgTime) || 0;
    networkTypes[type].count++;
  });
  
  Object.entries(networkTypes).forEach(([type, data]) => {
    if (data.count >= 5) { // Only analyze if we have enough data
      const avgLatency = Math.round(data.sum / data.count);
      const percentile = allLatencies.length > 0 ? (allLatencies.filter(l => l <= avgLatency).length / allLatencies.length) * 100 : 50;
      
      if (avgLatency > globalP95Latency) {
        breaking.push({
          type: 'network_issue',
          text: `${type.charAt(0).toUpperCase() + type.slice(1)} network showing ${avgLatency}ms (${Math.round(percentile)}th percentile)`,
          key: `network_${type}`
        });
      }
    }
  });
  
  return breaking;
};

const renderSimpleOperatorTicker = (topOperatorCards, worstOperatorCards) => {
  const oldTicker = document.getElementById('simple-operator-ticker');
  if (oldTicker) oldTicker.remove();

  const best = topOperatorCards.filter(card => card.total > 0).slice(0, 5);
  const worst = worstOperatorCards.filter(card => card.total > 0).slice(0, 5);
  const all = [...best.map(card => ({...card, label: 'Best'})), ...worst.map(card => ({...card, label: 'Worst'}))];
  if (all.length === 0) return;

  const ticker = document.createElement('div');
  ticker.id = 'simple-operator-ticker';
  ticker.style.position = 'fixed';
  ticker.style.bottom = '0';
  ticker.style.left = '0';
  ticker.style.width = '100vw';
  ticker.style.zIndex = '99999';
  ticker.style.background = 'rgba(10,10,30,0.97)';
  ticker.style.backdropFilter = 'blur(6px)';
  ticker.style.boxShadow = '0 -2px 24px 0 rgba(0,0,0,0.5)';
  ticker.style.overflow = 'hidden';
  ticker.style.height = '60px';
  ticker.style.display = 'flex';
  ticker.style.alignItems = 'center';
  ticker.style.fontFamily = 'Orbitron, sans-serif';

  const inner = document.createElement('div');
  inner.className = 'simple-ticker-inner';
  inner.style.display = 'flex';
  inner.style.alignItems = 'center';
  inner.style.gap = '32px';
  inner.style.whiteSpace = 'nowrap';
  inner.style.animation = 'simple-scroll-ticker 32s linear infinite';

  function getColor(compliance) {
    if (compliance >= 80) return 'linear-gradient(90deg,#003c8f 60%,#00c853 100%)';
    if (compliance >= 50) return 'linear-gradient(90deg,#ffbf00 60%,#ffd600 100%)';
    return 'linear-gradient(90deg,#8f0000 60%,#d50000 100%)';
  }

  all.forEach(card => {
    const pill = document.createElement('div');
    pill.style.display = 'flex';
    pill.style.alignItems = 'center';
    pill.style.gap = '12px';
    pill.style.background = getColor(card.compliance);
    pill.style.borderRadius = '18px';
    pill.style.margin = '0 12px';
    pill.style.padding = '10px 24px';
    pill.style.fontSize = '1.1rem';
    pill.style.color = '#fff';
    pill.style.boxShadow = '0 2px 8px #0002';
    pill.innerHTML = `
      <span style='font-weight:bold;'>${card.name}</span>
      <img src="https://flagcdn.com/${card.country.toLowerCase()}.svg" style="width:22px;vertical-align:middle;border-radius:3px;box-shadow:0 0 4px #fff2;"/>
      <span>Compliance: <b>${card.compliance}%</b></span>
      <span style="font-size:0.95em;opacity:0.8;padding-left:8px;">${card.label}</span>
    `;
    inner.appendChild(pill);
  });

  all.forEach(card => {
    const pill = document.createElement('div');
    pill.style.display = 'flex';
    pill.style.alignItems = 'center';
    pill.style.gap = '12px';
    pill.style.background = getColor(card.compliance);
    pill.style.borderRadius = '18px';
    pill.style.margin = '0 12px';
    pill.style.padding = '10px 24px';
    pill.style.fontSize = '1.1rem';
    pill.style.color = '#fff';
    pill.style.boxShadow = '0 2px 8px #0002';
    pill.innerHTML = `
      <span style='font-weight:bold;'>${card.name}</span>
      <img src="https://flagcdn.com/${card.country.toLowerCase()}.svg" style="width:22px;vertical-align:middle;border-radius:3px;box-shadow:0 0 4px #fff2;"/>
      <span>Compliance: <b>${card.compliance}%</b></span>
      <span style="font-size:0.95em;opacity:0.8;padding-left:8px;">${card.label}</span>
    `;
    inner.appendChild(pill);
  });

  ticker.appendChild(inner);
  document.body.appendChild(ticker);

  if (!document.getElementById('simple-ticker-keyframes')) {
    const style = document.createElement('style');
    style.id = 'simple-ticker-keyframes';
    style.innerHTML = `
      @keyframes simple-scroll-ticker {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      #simple-operator-ticker { pointer-events: none; }
      #simple-operator-ticker .simple-ticker-inner > div { pointer-events: auto; }
      @media (max-width: 900px) {
        #simple-operator-ticker { height: 80px !important; }
        #simple-operator-ticker .simple-ticker-inner > div { font-size: 0.98rem !important; padding: 8px 12px !important; }
      }
      @media (max-width: 600px) {
        #simple-operator-ticker { height: 100px !important; }
        #simple-operator-ticker .simple-ticker-inner > div { font-size: 0.85rem !important; padding: 6px 8px !important; }
      }
    `;
    document.head.appendChild(style);
  }
};

const addToTickerQueue = (msg, type = 'info') => {
  if (!tickerQueue.some(item => item.msg === msg)) {
    tickerQueue.push({ msg, type });
    console.log('[DEBUG] addToTickerQueue:', { msg, type, tickerQueue });
    renderTickerQueue();
  } else {
    console.log('[DEBUG] addToTickerQueue: duplicate skipped', { msg, type });
  }
};

const createPersistentTicker = () => {
  if (document.getElementById('news-ticker-container')) return;
  const tickerContainer = document.createElement('div');
  tickerContainer.id = 'news-ticker-container';
  tickerContainer.style.position = 'fixed';
  tickerContainer.style.bottom = '0';
  tickerContainer.style.left = '0';
  tickerContainer.style.width = '100vw';
  tickerContainer.style.zIndex = '10001'; // Ensure ticker is always on top
  tickerContainer.style.background = 'rgba(10,10,30,0.92)';
  tickerContainer.style.backdropFilter = 'blur(6px)';
  tickerContainer.style.boxShadow = '0 -2px 24px 0 rgba(0,0,0,0.5)';
  tickerContainer.style.overflow = 'hidden';
  tickerContainer.style.height = '120px';
  tickerContainer.style.display = 'flex';
  tickerContainer.style.flexDirection = 'column';
  tickerContainer.style.alignItems = 'center';
  tickerContainer.innerHTML = `
    <div style="width:100%;display:flex;align-items:center;justify-content:center;padding:0 0 4px 0;">
      <span style="background:#d50000;color:#fff;font-weight:bold;padding:4px 16px;border-radius:16px;margin-right:18px;font-size:18px;letter-spacing:2px;box-shadow:0 0 8px #d50000;animation:pulseLive 1.2s infinite alternate;">LIVE</span>
      <span style="font-size:2.1rem;font-family:'Orbitron',sans-serif;font-weight:700;letter-spacing:2px;color:#fff;text-shadow:0 2px 8px #000,0 0 16px #00e5ff;">Global Internet Pulse</span>
    </div>
    <div class="ticker-row" style="width:120vw;overflow:hidden;display:flex;align-items:center;height:38px;margin-bottom:2px;">
      <div class="ticker-inner" style="display:flex;align-items:center;gap:32px;white-space:nowrap;will-change:transform;"></div>
    </div>
  `;
  document.body.appendChild(tickerContainer);
  
  // Add initial content to the ticker
  addToTickerQueue('🌍 Qualoo Global Network Monitoring Active', 'info');
  addToTickerQueue('📊 Real-time Internet Quality Analysis', 'info');
  addToTickerQueue('🔍 Monitoring Global Network Performance', 'info');
  
  if (!document.getElementById('ticker-css-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ticker-css-keyframes';
    style.innerHTML = `
      @keyframes ticker-scroll {
        0% { transform: translateX(100vw); }
        100% { transform: translateX(-100%); }
      }
    `;
    document.head.appendChild(style);
  }
};

const renderTickerQueue = () => {
  const inner = document.querySelector('#news-ticker-container .ticker-inner');
  if (!inner) {
    console.log('[DEBUG] renderTickerQueue: ticker-inner not found');
    return;
  }
  inner.innerHTML = '';
  console.log('[DEBUG] renderTickerQueue: tickerQueue', tickerQueue);
  const getBg = (type) => {
    // Positive/Good performance - Green
    if (type === 'best' || type === 'good_performance' || type === 'high_compliance' || type === 'excellent') 
      return 'linear-gradient(90deg,#00c853 60%,#003c8f 100%)';
    
    // Problems/Critical issues - Red
    if (type === 'worst' || type === 'problem' || type === 'critical_operator' || type === 'breach' || type === 'critical_route') 
      return 'linear-gradient(90deg,#d50000 60%,#8f0000 100%)';
    
    // Warnings/Issues - Orange
    if (type === 'country_issue' || type === 'route_issue' || type === 'wired_issue' || type === 'network_issue') 
      return 'linear-gradient(90deg,#ff9800 60%,#f57c00 100%)';
    
    // New/Info - Blue
    if (type === 'new' || type === 'info') 
      return 'linear-gradient(90deg,#6a1b9a 60%,#00e5ff 100%)';
    
    // Default - Blue
    return 'linear-gradient(90deg,#003c8f 60%,#00e5ff 100%)';
  };
  tickerQueue.forEach(item => {
    const pill = document.createElement('div');
    pill.style.flex = '0 0 auto';
    pill.style.margin = '0 18px';
    pill.style.padding = '10px 20px';
    pill.style.borderRadius = '10px';
    pill.style.background = getBg(item.type);
    pill.style.color = '#fff';
    pill.style.display = 'inline-flex';
    pill.style.alignItems = 'center';
    pill.style.gap = '14px';
    pill.style.fontFamily = 'Orbitron,sans-serif';
    pill.style.fontSize = '1.1rem';
    pill.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
    pill.style.whiteSpace = 'nowrap';
    pill.style.overflow = 'hidden';
    pill.innerHTML = item.msg;
    inner.appendChild(pill);
  });
  animateTicker();
};

const animateTicker = () => {
  const inner = document.querySelector('#news-ticker-container .ticker-inner');
  if (!inner) {
    console.log('❌ Ticker inner not found');
    return;
  }
  if (tickerQueue.length === 0) {
    console.log('📰 Ticker queue is empty, adding default messages');
    addToTickerQueue('🌍 Qualoo Global Network Monitoring Active', 'info');
    addToTickerQueue('📊 Real-time Internet Quality Analysis', 'info');
    addToTickerQueue('🔍 Monitoring Global Network Performance', 'info');
    return;
  }
  
  console.log('🎬 Starting ticker animation with', tickerQueue.length, 'items');
  let offset = 0;
  let speed = 1.2;
  cancelAnimationFrame(tickerAnimId);
  function step() {
    offset -= speed;
    inner.style.transform = `translateX(${offset}px)`;
    const firstPill = inner.firstChild;
    if (firstPill) {
      const pillWidth = firstPill.offsetWidth + 36;
      if (Math.abs(offset) > pillWidth) {
        offset += pillWidth;
        tickerQueue.shift();
        renderTickerQueue();
        return;
      }
    }
    tickerAnimId = requestAnimationFrame(step);
  }
  tickerAnimId = requestAnimationFrame(step);
};



const fetchAggregatedInsights = async () => {
  try {
    const res = await fetch('http://localhost:8000/api/aggregated-flows?hours=10');
    if (!res.ok) throw new Error('Failed to fetch aggregated flows');
    const result = await res.json();
    
    // Handle different response formats
    const data = Array.isArray(result) ? result : (result.data || []);
    
    console.log('📊 Aggregated flows response:', result);
    console.log('📊 Processed data:', data);
    
    const insights = [];
    if (Array.isArray(data)) {
      data.forEach(flow => {
        if (flow.avg > 400) {
          insights.push(`Notable: Route ${flow.src}→${flow.dest} averaged ${flow.avg}ms over the last 10 hours.`);
        } else if (flow.highCount && flow.highCount > 0) {
          insights.push(`Alert: Route ${flow.src}→${flow.dest} exceeded 400ms for ${flow.highCount} flows.`);
        }
      });
    } else {
      console.warn('📊 Aggregated flows data is not an array:', data);
    }
    return insights;
  } catch (e) {
    console.warn('Aggregated flows fetch failed:', e);
    return [];
  }
};

const buildNewsSummary = async () => {
  console.log('[DEBUG] buildNewsSummary called');
  const breaking = getBreakingNewsItems();
  let newsItems = breaking.map(item => {
    if (item.type === 'operator') {
      const flag = `<img src='https://flagcdn.com/${item.country.toLowerCase()}.svg' style='width:22px;vertical-align:middle;border-radius:3px;box-shadow:0 0 4px #fff2;margin:0 4px;'>`;
      const avg = (item.avg === 'N/A' || item.avg == null || isNaN(item.avg)) ? '-' : item.avg;
      const msg = `🏢 ${item.asn ? item.asn + ' ' : ''}${item.op} ${flag} (${getCountryName(item.country)}) | Avg: ${avg}ms`;
      return { msg, type: (avg > 400 ? 'worst' : 'info') };
    } else if (item.type === 'route') {
      const avg = (item.avg === 'N/A' || item.avg == null || isNaN(item.avg)) ? '-' : item.avg;
      const msg = `🌐 ${item.src}→${item.dest} | Avg: ${avg}ms`;
      return { msg, type: (avg > 400 ? 'problem' : 'info') };
    } else {
      return { msg: item.text || '', type: 'info' };
    }
  });
  const aggInsights = await fetchAggregatedInsights();
  newsItems = newsItems.concat(aggInsights.map(msg => ({ msg, type: msg.includes('Notable') || msg.includes('Alert') ? 'problem' : 'info' })));
  // Add best operators (top 3)
  const operatorStats = Object.values(state.comprehensiveStats?.operators || {})
    .map(op => ({
      op: op.op,
      country: op.country,
      avg: Math.round(op.totalLatency / op.count),
      breaches: op.breaches
    }))
    .filter(op => op.op && op.country)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);
  operatorStats.forEach(op => {
    const flag = `<img src='https://flagcdn.com/${op.country.toLowerCase()}.svg' style='width:22px;vertical-align:middle;border-radius:3px;box-shadow:0 0 4px #fff2;margin:0 4px;'>`;
    const msg = `🏆 Best: ${op.op} ${flag} (${getCountryName(op.country)}) | Avg: ${op.avg}ms`;
    newsItems.push({ msg, type: 'best' });
  });
  if (newsItems.length === 0) newsItems = [{ msg: '✔️ All systems nominal', type: 'info' }];
  console.log('[DEBUG] buildNewsSummary returning', newsItems);
  return newsItems;
};

const animateQualooLogo = () => {
  if (state.logoSprite) {
    state.scene.remove(state.logoSprite);
    if (state.logoSprite.material.map) state.logoSprite.material.map.dispose();
    state.logoSprite.material.dispose();
    state.logoSprite.geometry.dispose();
    state.logoSprite = null;
  }
  const loader = new TextureLoader();
  loader.load('./qlogo.png', (texture) => {
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1 });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, CONFIG.radius + 0.7, 0);
    sprite.scale.set(0.5, 0.5, 0.5);
    sprite.material.opacity = 1;
    state.scene.add(sprite);
    state.logoSprite = sprite;
    let t = 0;
    function animateLogo() {
      if (!state.logoSprite) return;
      t += 0.016;
      sprite.position.y = CONFIG.radius + 0.7 + t * 2;
      if (t > 2) {
        sprite.material.opacity = Math.max(0, 1 - (t - 2) / 1);
      }
      if (sprite.material.opacity <= 0) {
        state.scene.remove(sprite);
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.dispose();
        sprite.geometry.dispose();
        state.logoSprite = null;
        return;
      }
      requestAnimationFrame(animateLogo);
    }
    animateLogo();
  });
};

const pollLatestTest = async () => {
  try {
    const res = await fetch('http://localhost:8000/api/latest-test');
    
    if (!res.ok) {
      console.warn(`API error: ${res.status} ${res.statusText}`);
      return;
    }
    
    const data = await res.json();
    if (!data.tests || !data.tests.length) return;
    const latest = data.tests[0];
    if (state.lastTestId !== latest.id) {
      state.lastTestId = latest.id;
      const countryName = countryCodeToName[latest.source_country] || latest.source_country;
      const latency = parseFloat(latest.avgTime) || 0;
    if (latency > 400) {
      speakQueued(`BAD TEST: ${latest.operator} in ${countryName} - ${latency}ms. CRITICAL.`, TTS_PRIORITY.CRITICAL);
    } else if (latency > 300) {
      speakQueued(`POOR TEST: ${latest.operator} in ${countryName} - ${latency}ms.`, TTS_PRIORITY.BAD_PERFORMANCE);
    } else if (latency > 200) {
      speakQueued(`SLOW TEST: ${latest.operator} in ${countryName} - ${latency}ms.`, TTS_PRIORITY.BAD_PERFORMANCE);
    } else {
      speakQueued(`New test: ${latest.operator} in ${countryName}.`, TTS_PRIORITY.NEW_TEST);
    }
      createAnimatedArc({
        source: { lat: latest.source_latitude, lng: latest.source_longitude },
        destination: { lat: latest.dest_latitude, lng: latest.dest_longitude },
        avgTime: latest.avgTime,
        source_country: latest.source_country,
        dest_country: latest.dest_country,
        operator: latest.operator,
        source_region: latest.source_region,
        dest_region: latest.dest_region,
        network_type: latest.network_type,
        created_at: latest.created_at
      }, performance.now());
      animateQualooLogo();
    }
  } catch (e) {
    console.warn('Failed to poll latest test:', e);
  }
};

const animate = (timestamp) => {
  if (!state.renderer || !state.scene || !state.camera) {
    console.error('Rendering failed: Missing renderer, scene, or camera', {
      renderer: state.renderer,
      scene: state.scene,
      camera: state.camera
    });
    return;
  }
  if (!state.renderer.domElement.parentNode) {
    console.error('Canvas not in DOM:', state.renderer.domElement);
    return;
  }
  const canvas = state.renderer.domElement;
  const { width, height } = canvas.getBoundingClientRect();
  if (width === 0 || height === 0) {
    console.warn('Canvas has zero dimensions:', { width, height, style: canvas.style });
  }
  state.animationFrameId = requestAnimationFrame(animate);
  const delta = Math.min(timestamp - state.lastFrameTime, 100);
  state.lastFrameTime = timestamp;
  state.fps = 1000 / delta;

  state.controls.update();
  if (state.globe) state.globe.rotation.y += 0.0001 * delta;
  if (state.cloudMesh) state.cloudMesh.rotation.y += 0.0002 * delta;

  if (state.showCountries && state.countryGroup) {
    const s = 1 + Math.sin(timestamp / 2000) * 0.01;
    state.countryGroup.scale.set(s, s, s);

    Object.values(state.countryLabels).forEach(label => {
      label.lookAt(state.camera.position);
    });
  }

  animateArcs(timestamp, delta);
  updateHUD(timestamp);

  state.renderer.render(state.scene, state.camera);
  console.log('Rendered frame:', { delta, frameCount: state.animationFrameId, canvasWidth: width, canvasHeight: height });

  if (CONFIG.debug) {
    if (timestamp % 1000 < delta) console.log(`FPS: ${state.fps.toFixed(1)}`);
  }
};

const cleanup = () => {
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  if (state.batchScheduleId) clearInterval(state.batchScheduleId);
  window.removeEventListener('resize', onWindowResize);
  document.removeEventListener('keydown', toggleDayNight);

  state.flightArcs.forEach(arc => {
    state.arcGroup.remove(arc.tube);
    state.arcGroup.remove(arc.particle);
    state.arcGroup.remove(arc.sourceDot);
    state.arcGroup.remove(arc.destDot);
    arc.tube.geometry.dispose();
    arc.tube.material.dispose();
    arc.particle.geometry.dispose();
    arc.particle.material.dispose();
    arc.sourceDot.geometry.dispose();
    arc.sourceDot.material.dispose();
    arc.destDot.geometry.dispose();
    arc.destDot.material.dispose();
  });
  state.flightArcs = [];

  while (state.scene && state.scene.children.length) {
    const obj = state.scene.children[0];
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose());
      } else {
        obj.material.dispose();
      }
    }
    state.scene.remove(obj);
  }

  if (state.renderer) state.renderer.dispose();

  const hudElement = document.getElementById('hud-stats');
  if (hudElement) hudElement.style.display = 'none';

  const toggleButton = document.getElementById('toggle-day-night');
  if (toggleButton) toggleButton.removeEventListener('click', toggleDayNight);
  const toggleCountriesButton = document.getElementById('toggle-countries');
  if (toggleCountriesButton) toggleCountriesButton.removeEventListener('click', toggleCountries);
  
  // Stop audio monitoring
  stopAudioMonitoring();
};

const toggleCountries = () => {
  state.showCountries = !state.showCountries;
  state.countryGroup.visible = state.showCountries;
};

// Toggle between compliance and latency view modes
const toggleComplianceView = () => {
  state.complianceMode = !state.complianceMode;
  state.viewMode = state.complianceMode ? 'compliance' : 'latency';
  console.log(`🔄 Switched to ${state.viewMode} view mode (complianceMode: ${state.complianceMode})`);
  
  // Update button text
  const complianceButton = document.getElementById('toggle-compliance-view');
  if (complianceButton) {
    complianceButton.textContent = state.complianceMode ? 'Compliance View (Active)' : 'Toggle Compliance View';
    complianceButton.style.background = state.complianceMode ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.2)';
  }
  
  // Update latency button
  const latencyButton = document.getElementById('toggle-latency-view');
  if (latencyButton) {
    latencyButton.textContent = !state.complianceMode ? 'Latency View (Active)' : 'Toggle Latency View';
    latencyButton.style.background = !state.complianceMode ? 'rgba(255,136,0,0.3)' : 'rgba(255,255,255,0.2)';
  }
  
  // Clear existing arcs and redraw with new mode
  clearArcs();
  fetchAllData();
};

const toggleLatencyView = () => {
  toggleComplianceView(); // Same function, just different entry point
};

const addComplianceModeButton = () => {
  const button = document.createElement('button');
  button.textContent = '📊 Benchmarking';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    padding: 10px 15px;
    background: linear-gradient(45deg, #00ff88, #00cc6a);
    color: black;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
    transition: all 0.3s ease;
  `;
  
  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(0, 255, 136, 0.4)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)';
  };
  
  button.onclick = () => {
    toggleBenchmarkPanel();
  };
  
  document.body.appendChild(button);
  
  // Add global rankings button
  const globalButton = document.createElement('button');
  globalButton.textContent = '🌍 Global Rankings';
  globalButton.style.cssText = `
    position: fixed;
    top: 20px;
    left: 200px;
    padding: 10px 15px;
    background: linear-gradient(45deg, #0088ff, #0066cc);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(0, 136, 255, 0.3);
    transition: all 0.3s ease;
  `;
  
  globalButton.onmouseover = () => {
    globalButton.style.transform = 'translateY(-2px)';
    globalButton.style.boxShadow = '0 6px 20px rgba(0, 136, 255, 0.4)';
  };
  
  globalButton.onmouseout = () => {
    globalButton.style.transform = 'translateY(0)';
    globalButton.style.boxShadow = '0 4px 15px rgba(0, 136, 255, 0.3)';
  };
  
  globalButton.onclick = () => {
    createGlobalRankingPanel();
  };
  
  document.body.appendChild(globalButton);
  
  // Add audio detection toggle button
  const audioButton = document.createElement('button');
  audioButton.textContent = '🎤 Audio Detection';
  audioButton.style.cssText = `
    position: fixed;
    top: 20px;
    left: 380px;
    padding: 10px 15px;
    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    transition: all 0.3s ease;
  `;
  
  audioButton.onmouseover = () => {
    audioButton.style.transform = 'translateY(-2px)';
    audioButton.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
  };
  
  audioButton.onmouseout = () => {
    audioButton.style.transform = 'translateY(0)';
    audioButton.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
  };
  
  audioButton.onclick = () => {
    if (audioDetectionEnabled) {
      stopAudioMonitoring();
      audioButton.textContent = '🎤 Audio Detection (Off)';
      audioButton.style.background = 'linear-gradient(45deg, #666, #444)';
      console.log('🔇 Audio detection disabled');
    } else {
      initAudioDetection();
      audioButton.textContent = '🎤 Audio Detection (On)';
      audioButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
      console.log('🔊 Audio detection enabled');
    }
  };
  
  document.body.appendChild(audioButton);
};

const init = async () => {
  createPersistentTicker();
  try {
    if (state.isInitialized) return;
    updateLoading('Initializing...', true);
    console.log('Starting application initialization...');

    if (!checkWebGL()) return;

    console.log('Starting Three.js initialization...');
    if (!initThreeJS()) {
      console.error('Three.js initialization failed, halting application');
      return;
    }
    console.log('Three.js initialized successfully');

    console.log('Creating globe...');
    createGlobe();
    console.log('Globe creation completed');

    const toggleButton = document.getElementById('toggle-day-night');
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleDayNight);
      console.log('Toggle day/night button listener added');
    } else {
      console.warn('Toggle day/night button element not found');
    }

    const toggleCountriesButton = document.getElementById('toggle-countries');
    if (toggleCountriesButton) {
      toggleCountriesButton.addEventListener('click', toggleCountries);
      console.log('Toggle countries button listener added');
    } else {
      console.log('Toggle countries button element not found - this is normal if the button is not in the HTML');
    }

    // Add compliance/latency view toggle button listeners
    const toggleComplianceButton = document.getElementById('toggle-compliance-view');
    if (toggleComplianceButton) {
      toggleComplianceButton.addEventListener('click', toggleComplianceView);
      console.log('Toggle compliance view button listener added');
    } else {
      console.log('Toggle compliance view button element not found');
    }

    const toggleLatencyButton = document.getElementById('toggle-latency-view');
    if (toggleLatencyButton) {
      toggleLatencyButton.addEventListener('click', toggleLatencyView);
      console.log('Toggle latency view button listener added');
    } else {
      console.log('Toggle latency view button element not found');
    }

    const sourceCountries = await fetchUniqueValues('source_countries');
    populateDropdown('source-country', sourceCountries, { convertCountryCodes: true });

    const sourceRegions = await fetchUniqueValues('source_regions');
    populateDropdown('source-region', sourceRegions, { convertCountryCodes: true });

    const operators = await fetchUniqueValues('operators');
    populateDropdown('source-operator', operators);

    const networkTypes = await fetchUniqueValues('network_types');
    populateDropdown('network-type', networkTypes);

    const destCountries = await fetchUniqueValues('dest_countries');
    populateDropdown('dest-country', destCountries, { convertCountryCodes: true });

    const destRegions = await fetchUniqueValues('dest_regions');
    populateDropdown('dest-region', destRegions, { convertCountryCodes: true });

    document.getElementById('toggle-filters').addEventListener('click', () => {
      const filtersPanel = document.getElementById('filters');
      filtersPanel.classList.toggle('show');
    });

    document.getElementById('apply-filters').addEventListener('click', applyFilters);

    // Load wired node locations
    console.log('📍 Loading wired node locations...');
    await loadWiredNodeLocations();

    // Initialize audio detection for Grok compatibility
    console.log('🎤 Initializing audio detection...');
    await initAudioDetection();

    scheduleBatchProcessing();
    animate(performance.now());

    console.log('Fetching all data in background...');
    fetchAllData();

    await speakQueued('Welcome to Qualoo global network monitoring.', TTS_PRIORITY.INFO);

    state.isInitialized = true;
    console.log('Initialization completed');
  } catch (error) {
    showError(`Initialization failed: ${error.message}`);
    console.error('Init error stack:', error.stack);
  } finally {
    setTimeout(() => updateLoading('', false), 1000);
  }
};

window.initGlobalLatencyView = init;

processAndFeedTickerFromApi();
setInterval(processAndFeedTickerFromApi, 60000); // 1 minute for ticker updates (reduced from 3 minutes)
setInterval(pollLatestTest, 30000); // 30 seconds for test polling (reduced frequency)

// Add periodic news-style TTS updates
const triggerNewsUpdate = () => {
  // Check if we should skip this update based on timing
  const now = performance.now();
  const timeSinceLastUpdate = now - (state.lastNewsUpdate || 0);
  const minInterval = 120000; // 2 minutes minimum between updates (allows 30s Grok speech + 90s silence)
  
  if (timeSinceLastUpdate < minInterval) {
    console.log('⏰ Skipping news update - too soon since last update:', Math.round(timeSinceLastUpdate / 1000), 'seconds');
    return;
  }
  
  // Get current stats from the state if available
  const currentStats = {
    worstPerformers: state.worstPerformers || [],
    topWorstCountries: state.topWorstCountries || [],
    topBreachesOperators: state.topBreachesOperators || [],
    topBreachesCountries: state.topBreachesCountries || [],
    regionsMatrix: state.regionsMatrix || {},
    avgLatency: state.avgLatency || 0,
    breachRate: state.breachRate || 0,
    complianceRate: state.complianceRate || 0,
    seriousBreaches: state.seriousBreaches || 0
  };
  
  // Check if we have any data at all
  const hasData = currentStats.worstPerformers.length > 0 || 
                  currentStats.topWorstCountries.length > 0 || 
                  currentStats.avgLatency > 0;
  
  if (!hasData) {
    console.log('📊 No data available yet for news update - data is still loading or database is empty');
    
    // Check if we've tried to fetch data
    if (state.isFetching) {
      speakQueued('Loading network data. Please wait.', TTS_PRIORITY.INFO);
    } else if (state.allDataForStats.length === 0) {
      speakQueued('No test data available. System ready.', TTS_PRIORITY.INFO);
    } else {
      speakQueued('Processing network data. Monitoring active.', TTS_PRIORITY.INFO);
    }
    state.lastNewsUpdate = now;
    return;
  }
  
  const newsUpdate = generateTTSNewsUpdate(currentStats);
  if (newsUpdate) {
    console.log('🎤 NEWS UPDATE:', newsUpdate);
    speakQueued(newsUpdate, TTS_PRIORITY.INFO);
    state.lastNewsUpdate = now;
  } else {
    console.log('📊 No news update generated - insufficient data');
    speakQueued('Processing network data. Monitoring active.', TTS_PRIORITY.INFO);
    state.lastNewsUpdate = now;
  }
};

// Trigger news updates every 3 minutes (increased for Grok compatibility)
setInterval(triggerNewsUpdate, 180000);

// Add summary/problem/aggregated items to the ticker
async function updateTickerWithSummaries() {
  try {
    console.log('[DEBUG] updateTickerWithSummaries called');
    const items = await buildNewsSummary();
    console.log('[DEBUG] updateTickerWithSummaries items:', items);
    items.forEach(item => {
      addToTickerQueue(item.msg, item.type);
    });
  } catch (e) {
    console.warn('Failed to update ticker with summaries:', e);
  }
}

// Call once at startup and then every 1 minute
updateTickerWithSummaries();
setInterval(updateTickerWithSummaries, 60000);

function getCountryName(code) {
  return countryCodeToName[code] || code || 'Unknown';
}

const generateTTSNewsUpdate = (stats) => {
  const messages = [];
  
  // Initialize message type counter if not exists
  if (!state.ttsMessageTypeCounter) {
    state.ttsMessageTypeCounter = 0;
  }
  
  // Rotate through different message types to ensure variety
  let messageType = state.ttsMessageTypeCounter % 6; // 0-5 for different message types
  state.ttsMessageTypeCounter++;
  
  console.log('📊 Generating news update:', {
    messageType,
    worstPerformers: stats.worstPerformers?.length || 0,
    topWorstCountries: stats.topWorstCountries?.length || 0,
    avgLatency: stats.avgLatency,
    complianceRate: stats.complianceRate,
    seriousBreaches: stats.seriousBreaches
  });
  
  // Get current stats from the updateHUD function context
  const {
    worstPerformers = [],
    topWorstCountries = [],
    topBreachesOperators = [],
    topBreachesCountries = [],
    regionsMatrix = {},
    avgLatency = 0,
    breachRate = 0,
    complianceRate = 0,
    seriousBreaches = 0
  } = stats || {};

  // Message Type 0: Critical Breaches
  if (messageType === 0 && seriousBreaches > 0) {
    const worst = worstPerformers.length > 0 ? worstPerformers[0] : null;
    if (worst && worst.avg > 400) {
      messages.push(
        `CRITICAL: ${worst.op} in ${getCountryName(worst.country)} at ${worst.avg}ms. ${seriousBreaches} breaches total.`
      );
    } else {
      messages.push(
        `${seriousBreaches} serious breaches detected. Immediate action required.`
      );
    }
  }

  // Message Type 1: Bad ISP Callout
  else if (messageType === 1 && worstPerformers.length > 0) {
    const worst = worstPerformers[0];
    if (worst.avg > 200) {
      messages.push(
        `BAD ISP: ${worst.op} in ${getCountryName(worst.country)} - ${worst.avg}ms. Unacceptable performance.`
      );
    }
  }

  // Message Type 2: Bad Country Callout
  else if (messageType === 2 && topWorstCountries.length > 0) {
    const worstCountry = topWorstCountries[0];
    if (worstCountry.avg > 250) {
      messages.push(
        `BAD COUNTRY: ${getCountryName(worstCountry.country)} - ${worstCountry.avg}ms avg. ${worstCountry.operatorsCount} operators failing.`
      );
    }
  }

  // Message Type 3: Bad Route Callout
  else if (messageType === 3) {
    const badRoutes = [];
    Object.entries(regionsMatrix).forEach(([src, dests]) => {
      Object.entries(dests).forEach(([dest, val]) => {
        if (val && val.count > 5) {
          const avg = Math.round(val.sum / val.count);
          if (avg > 300) {
            badRoutes.push(`${src} to ${dest}: ${avg}ms`);
          }
        }
      });
    });
    
    if (badRoutes.length > 0) {
      const worstRoute = badRoutes[0];
      messages.push(
        `BAD ROUTE: ${worstRoute}. Network congestion detected.`
      );
    }
  }

  // Message Type 4: Compliance Alert
  else if (messageType === 4) {
    const compliance = Math.round(complianceRate);
    if (compliance < 80) {
      messages.push(
        `COMPLIANCE FAILURE: ${100 - compliance}% failing. ${seriousBreaches} serious breaches.`
      );
    } else {
      messages.push(
        `Compliance: ${compliance}%. ${seriousBreaches > 0 ? `${seriousBreaches} breaches.` : 'All good.'}`
      );
    }
  }

  // Message Type 5: Top Offenders Summary
  else if (messageType === 5) {
    const worst = worstPerformers.length > 0 ? worstPerformers[0] : null;
    const worstCountry = topWorstCountries.length > 0 ? topWorstCountries[0] : null;
    
    if (worst && worst.avg > 300) {
      messages.push(
        `TOP OFFENDER: ${worst.op} in ${getCountryName(worst.country)} - ${worst.avg}ms.`
      );
    } else if (worstCountry && worstCountry.avg > 300) {
      messages.push(
        `WORST COUNTRY: ${getCountryName(worstCountry.country)} - ${worstCountry.avg}ms.`
      );
    } else {
      messages.push(
        `Network status: ${avgLatency}ms avg. ${Math.round(complianceRate)}% compliance.`
      );
    }
  }

  // If no specific message was generated, provide a general update
  if (messages.length === 0) {
    messages.push(
      `Network update: ${avgLatency}ms avg, ${Math.round(complianceRate)}% compliance.`
    );
  }

  return messages[0]; // Return the first (and likely only) message
};

const generateGlobalRouteAnalysis = (regionsMatrix) => {
  const highLatencyRoutes = [];
  const criticalRoutes = [];
  
  Object.entries(regionsMatrix).forEach(([src, dests]) => {
    Object.entries(dests).forEach(([dest, data]) => {
      if (data.count > 5) {
        const avg = Math.round(data.sum / data.count);
        if (avg > 400) {
          criticalRoutes.push({ src, dest, avg, count: data.count });
        } else if (avg > 300) {
          highLatencyRoutes.push({ src, dest, avg, count: data.count });
        }
      }
    });
  });
  
  if (criticalRoutes.length > 0) {
    const route = criticalRoutes.sort((a, b) => b.avg - a.avg)[0];
    return `Critical global route alert: Traffic between ${route.src} and ${route.dest} is averaging ${route.avg} milliseconds, ` +
           `representing a serious regulatory breach. This route affects ${route.count} connections and requires immediate intervention. ` +
           `Operators in these regions should contact Qualoo for emergency network optimization services.`;
  }
  
  if (highLatencyRoutes.length > 0) {
    const route = highLatencyRoutes.sort((a, b) => b.avg - a.avg)[0];
    return `Global connectivity concern: Traffic between ${route.src} and ${route.dest} is averaging ${route.avg} milliseconds, ` +
           `exceeding recommended QoS standards. This affects ${route.count} connections and impacts global digital commerce. ` +
           `Governments and operators should work together to improve this critical infrastructure.`;
  }
  
  return null;
};

const generateGuardianCallToAction = () => {
  const calls = [
    "Become a guardian of the internet—run a Qualoo app or node to contribute to the real-time global view powered by Deep-in.",
    "Join the movement to bridge the digital divide. Run a Qualoo node and help monitor global internet quality in real-time.",
    "Help ensure universal access to high-quality internet. Download the Qualoo app and become part of our global monitoring network.",
    "Contribute to the real-time global view of internet quality. Run a Qualoo node and help identify areas needing improvement.",
    "Be part of the solution. Run a Qualoo app or node to help monitor and improve global internet infrastructure."
  ];
  
  return calls[Math.floor(Math.random() * calls.length)];
};

const generateQualooPromotion = (worstPerformers, topWorstCountries) => {
  const promotions = [
    "Operators struggling with network performance can subscribe to Qualoo premium insights for advanced analytics and optimization recommendations.",
    "Qualoo premium insights help operators dramatically improve customer experience and meet global QoS standards.",
    "Network operators can contact Qualoo for premium insights to resolve critical performance issues and compliance breaches.",
    "Qualoo offers emergency network optimization services for operators experiencing serious compliance violations.",
    "Operators worldwide trust Qualoo premium insights to optimize their infrastructure and bridge the digital divide."
  ];
  
  let target = "operators and countries";
  if (worstPerformers.length > 0) {
    const worst = worstPerformers[0];
    target = `${worst.op} in ${getCountryName(worst.country)}`;
  } else if (topWorstCountries.length > 0) {
    const worstCountry = topWorstCountries[0];
    target = `${getCountryName(worstCountry.country)}`;
  }
  
  const basePromotion = promotions[Math.floor(Math.random() * promotions.length)];
  return `To help improve internet quality in ${target}, ${basePromotion}`;
};

// Test function to trigger news update manually
window.testNewsUpdate = () => {
  console.log('🧪 Manual news update test triggered');
  triggerNewsUpdate();
};

// Function to show current loading status
window.showLoadingStatus = () => {
  console.log('📊 Current Loading Status:', {
    isFetching: state.isFetching,
    isProcessingBatch: state.isProcessingBatch,
    pendingArcs: state.pendingArcs.length,
    flightArcs: state.flightArcs.length,
    allDataForStats: state.allDataForStats.length,
    hasMoreData: state.hasMoreData,
    worstPerformers: state.worstPerformers?.length || 0,
    topWorstCountries: state.topWorstCountries?.length || 0,
    avgLatency: state.avgLatency,
    complianceRate: state.complianceRate
  });
};

// Function to test API endpoint directly
window.testAPIEndpoint = async () => {
  console.log('🧪 Testing API endpoint...');
  try {
    const url = new URL('http://localhost:8000/api/latency-data');
    url.searchParams.set('limit', '10');
    console.log('📡 Testing URL:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📡 API Response:', result);
    
    if (result.data && result.data.length > 0) {
      console.log('✅ API is working - found', result.data.length, 'records');
      console.log('📊 Sample record:', result.data[0]);
    } else {
      console.log('⚠️ API is working but database is empty');
      console.log('📊 Pagination info:', result.pagination);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    console.log('🔧 Possible issues:');
    console.log('   1. Backend server not running on localhost:8000');
    console.log('   2. API endpoint /api/latency-data not implemented');
    console.log('   3. Database connection issues');
    console.log('   4. CORS issues');
  }
};

// Function to test latest test endpoint
window.testLatestTest = async () => {
  console.log('🧪 Testing latest test endpoint...');
  try {
    const response = await fetch('http://localhost:8000/api/latest-test');
    console.log('📡 Latest test response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📡 Latest test response:', result);
    
    if (result.tests && result.tests.length > 0) {
      console.log('✅ Latest test endpoint working - found', result.tests.length, 'recent tests');
      console.log('📊 Latest test:', result.tests[0]);
    } else {
      console.log('⚠️ Latest test endpoint working but no recent tests found');
    }
    
  } catch (error) {
    console.error('❌ Latest test API test failed:', error);
  }
};

// Function to test aggregated flows endpoint
window.testAggregatedFlows = async () => {
  console.log('🧪 Testing aggregated flows endpoint...');
  try {
    const response = await fetch('http://localhost:8000/api/aggregated-flows?hours=10');
    console.log('📡 Aggregated flows response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📡 Aggregated flows response:', result);
    
    if (Array.isArray(result)) {
      console.log('✅ Aggregated flows endpoint working - found', result.length, 'flows');
      if (result.length > 0) {
        console.log('📊 Sample flow:', result[0]);
      }
    } else if (result.data && Array.isArray(result.data)) {
      console.log('✅ Aggregated flows endpoint working - found', result.data.length, 'flows in data property');
      if (result.data.length > 0) {
        console.log('📊 Sample flow:', result.data[0]);
      }
    } else {
      console.log('⚠️ Aggregated flows endpoint working but response format is unexpected:', result);
    }
    
  } catch (error) {
    console.error('❌ Aggregated flows API test failed:', error);
  }
};

// Function to generate comprehensive country benchmarking data
const generateCountryBenchmark = (countryCode) => {
  const countryName = getCountryName(countryCode);
  const operators = {};
  const regions = {};
  const highLatencyRoutes = [];
  
  // Process all arcs to gather country-specific data
  state.flightArcs.concat(state.pendingArcs).forEach(arc => {
    if (arc.source_country === countryCode) {
      const operator = arc.operator || 'Unknown';
      const latency = arc.latency || parseFloat(arc.avgTime) || 0;
      const destRegion = continentCodeToName[arc.dest_region] || arc.dest_region || 'Unknown';
      
      // Track operator performance
      if (!operators[operator]) {
        operators[operator] = {
          name: operator,
          latencies: [],
          regionLatencies: {},
          highLatencyCount: 0,
          totalRoutes: 0,
          userCount: new Set(), // Track unique users
          routeTypes: new Set() // Track route types
        };
      }
      
      operators[operator].latencies.push(latency);
      operators[operator].totalRoutes++;
      operators[operator].userCount.add(arc.operator || 'unknown'); // Track unique users
      operators[operator].routeTypes.add(arc.network_type || 'unknown');
      
      if (latency > 400) {
        operators[operator].highLatencyCount++;
      }
      
      // Track regional performance
      if (!operators[operator].regionLatencies[destRegion]) {
        operators[operator].regionLatencies[destRegion] = [];
      }
      operators[operator].regionLatencies[destRegion].push(latency);
      
      // Track high latency routes
      if (latency > 400) {
        highLatencyRoutes.push({
          operator,
          destRegion,
          latency,
          destCountry: arc.dest_country
        });
      }
    }
  });
  
  // Calculate performance metrics and scoring for each operator
  const operatorBenchmarks = Object.values(operators).map(op => {
    const avgLatency = op.latencies.length > 0 ? 
      Math.round(op.latencies.reduce((a, b) => a + b, 0) / op.latencies.length) : 0;
    
    const complianceRate = op.totalRoutes > 0 ? 
      Math.round(((op.totalRoutes - op.highLatencyCount) / op.totalRoutes) * 100) : 0;
    
    // Calculate weighted average based on route count (more routes = higher confidence)
    const confidenceWeight = Math.min(op.totalRoutes / 10, 1); // Max weight of 1 for 10+ routes
    
    // Scoring system (0-100)
    let latencyScore = 0;
    if (avgLatency <= 200) latencyScore = 100;
    else if (avgLatency <= 300) latencyScore = 80;
    else if (avgLatency <= 400) latencyScore = 60;
    else if (avgLatency <= 500) latencyScore = 40;
    else latencyScore = 20;
    
    let complianceScore = complianceRate; // Direct percentage
    
    // Overall score (weighted average of latency and compliance)
    const overallScore = Math.round((latencyScore * 0.6 + complianceScore * 0.4) * confidenceWeight);
    
    // Calculate regional performance
    const regionalPerformance = Object.entries(op.regionLatencies).map(([region, latencies]) => {
      const avg = latencies.length > 0 ? 
        Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
      const highCount = latencies.filter(l => l > 400).length;
      const regionalCompliance = latencies.length > 0 ? 
        Math.round(((latencies.length - highCount) / latencies.length) * 100) : 0;
      return { region, avg, count: latencies.length, highCount, compliance: regionalCompliance };
    }).sort((a, b) => b.avg - a.avg); // Sort by worst performance first
    
    // Calculate issue severity
    const criticalIssues = op.latencies.filter(l => l > 500).length;
    const seriousIssues = op.latencies.filter(l => l > 400 && l <= 500).length;
    const moderateIssues = op.latencies.filter(l => l > 300 && l <= 400).length;
    
    return {
      name: op.name,
      avgLatency,
      complianceRate,
      totalRoutes: op.totalRoutes,
      highLatencyCount: op.highLatencyCount,
      regionalPerformance,
      overallScore,
      latencyScore,
      complianceScore,
      confidenceWeight,
      userCount: op.userCount.size,
      routeTypes: op.routeTypes.size,
      criticalIssues,
      seriousIssues,
      moderateIssues,
      issueSeverity: criticalIssues * 3 + seriousIssues * 2 + moderateIssues
    };
  }).sort((a, b) => b.overallScore - a.overallScore); // Sort by best score first
  
  // Calculate country-level metrics
  const totalRoutes = operatorBenchmarks.reduce((sum, op) => sum + op.totalRoutes, 0);
  const weightedAvgLatency = totalRoutes > 0 ? 
    Math.round(operatorBenchmarks.reduce((sum, op) => sum + (op.avgLatency * op.totalRoutes), 0) / totalRoutes) : 0;
  
  const totalIssues = operatorBenchmarks.reduce((sum, op) => sum + op.issueSeverity, 0);
  const countryScore = operatorBenchmarks.length > 0 ? 
    Math.round(operatorBenchmarks.reduce((sum, op) => sum + op.overallScore, 0) / operatorBenchmarks.length) : 0;
  
  return {
    countryCode,
    countryName,
    operatorBenchmarks,
    highLatencyRoutes,
    totalOperators: operatorBenchmarks.length,
    overallAvgLatency: weightedAvgLatency,
    countryScore,
    totalRoutes,
    totalIssues,
    criticalIssues: operatorBenchmarks.reduce((sum, op) => sum + op.criticalIssues, 0),
    seriousIssues: operatorBenchmarks.reduce((sum, op) => sum + op.seriousIssues, 0),
    moderateIssues: operatorBenchmarks.reduce((sum, op) => sum + op.moderateIssues, 0)
  };
};

// Function to display country benchmark in console
window.showCountryBenchmark = (countryCode) => {
  const benchmark = generateCountryBenchmark(countryCode);
  
  console.log(`\n📊 COUNTRY BENCHMARK: ${benchmark.countryName} (${countryCode})`);
  console.log(`🌍 Overall Average Latency: ${benchmark.overallAvgLatency}ms`);
  console.log(`🏢 Total Operators: ${benchmark.totalOperators}`);
  console.log(`⚠️ High Latency Routes (>400ms): ${benchmark.highLatencyRoutes.length}\n`);
  
  console.log('🏢 OPERATOR PERFORMANCE COMPARISON:');
  console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Operator          │ Avg Latency │ Compliance │ Routes │ High Latency │');
  console.log('├─────────────────────────────────────────────────────────────────────────────┤');
  
  benchmark.operatorBenchmarks.forEach(op => {
    const status = op.complianceRate >= 80 ? '🟢' : op.complianceRate >= 50 ? '🟡' : '🔴';
    console.log(`│ ${op.name.padEnd(16)} │ ${op.avgLatency.toString().padStart(10)}ms │ ${op.complianceRate.toString().padStart(9)}% │ ${op.totalRoutes.toString().padStart(6)} │ ${op.highLatencyCount.toString().padStart(12)} │ ${status}`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
  
  console.log('🌐 REGIONAL PERFORMANCE BREAKDOWN:');
  benchmark.operatorBenchmarks.forEach(op => {
    if (op.regionalPerformance.length > 0) {
      console.log(`\n🏢 ${op.name}:`);
      op.regionalPerformance.forEach(region => {
        const status = region.avg <= 300 ? '🟢' : region.avg <= 400 ? '🟡' : '🔴';
        console.log(`  ${status} ${region.region}: ${region.avg}ms (${region.count} routes, ${region.highCount} >400ms)`);
      });
    }
  });
  
  if (benchmark.highLatencyRoutes.length > 0) {
    console.log('\n⚠️ HIGH LATENCY ROUTES (>400ms):');
    benchmark.highLatencyRoutes.slice(0, 10).forEach(route => {
      console.log(`  🔴 ${route.operator} → ${route.destRegion} (${route.destCountry}): ${route.latency}ms`);
    });
    if (benchmark.highLatencyRoutes.length > 10) {
      console.log(`  ... and ${benchmark.highLatencyRoutes.length - 10} more routes`);
    }
  }
  
  return benchmark;
};

// Function to list countries with data and show quick comparison
window.listCountriesWithData = () => {
  const countries = {};
  
  // Gather country data
  state.flightArcs.concat(state.pendingArcs).forEach(arc => {
    const country = arc.source_country;
    if (!countries[country]) {
      countries[country] = {
        name: getCountryName(country),
        latencies: [],
        operators: new Set(),
        highLatencyCount: 0
      };
    }
    
    const latency = arc.latency || parseFloat(arc.avgTime) || 0;
    countries[country].latencies.push(latency);
    countries[country].operators.add(arc.operator || 'Unknown');
    if (latency > 400) {
      countries[country].highLatencyCount++;
    }
  });
  
  // Calculate metrics and sort
  const countryList = Object.entries(countries)
    .map(([code, data]) => ({
      code,
      name: data.name,
      avgLatency: data.latencies.length > 0 ? 
        Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length) : 0,
      totalRoutes: data.latencies.length,
      operatorCount: data.operators.size,
      highLatencyCount: data.highLatencyCount,
      complianceRate: data.latencies.length > 0 ? 
        Math.round(((data.latencies.length - data.highLatencyCount) / data.latencies.length) * 100) : 0
    }))
    .filter(c => c.totalRoutes > 0)
    .sort((a, b) => b.avgLatency - a.avgLatency); // Sort by worst performance first
  
  console.log('\n🌍 COUNTRIES WITH DATA:');
  console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Country           │ Avg Latency │ Compliance │ Routes │ Operators │');
  console.log('├─────────────────────────────────────────────────────────────────────────────┤');
  
  countryList.forEach(country => {
    const status = country.complianceRate >= 80 ? '🟢' : country.complianceRate >= 50 ? '🟡' : '🔴';
    console.log(`│ ${country.name.padEnd(16)} │ ${country.avgLatency.toString().padStart(10)}ms │ ${country.complianceRate.toString().padStart(9)}% │ ${country.totalRoutes.toString().padStart(6)} │ ${country.operatorCount.toString().padStart(9)} │ ${status}`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
  
  console.log('💡 To drill down into a specific country, use:');
  console.log('   showCountryBenchmark("US")  // Replace "US" with country code');
  console.log('   Example: showCountryBenchmark("GB") for United Kingdom\n');
  
  return countryList;
};

// Function to create visual benchmarking panel
const createBenchmarkPanel = () => {
  // Remove existing panel if it exists
  const existingPanel = document.getElementById('benchmark-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'benchmark-panel';
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ff88;
    border-radius: 10px;
    padding: 15px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    z-index: 1000;
    overflow-y: auto;
    backdrop-filter: blur(10px);
  `;

  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="margin: 0; color: #00ff88;">📊 BENCHMARKING PANEL</h3>
      <button onclick="document.getElementById('benchmark-panel').remove()" style="background: #ff4444; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✕</button>
    </div>
  `;

  const controls = document.createElement('div');
  controls.innerHTML = `
    <div style="margin-bottom: 15px;">
      <select id="country-select" style="width: 100%; padding: 5px; margin-bottom: 5px; background: #333; color: white; border: 1px solid #555;">
        <option value="">Select Country...</option>
      </select>
      <button onclick="updateBenchmarkPanel()" style="width: 100%; padding: 8px; background: #00ff88; color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🔄 Update Data</button>
    </div>
  `;

  const content = document.createElement('div');
  content.id = 'benchmark-content';
  content.innerHTML = '<p style="text-align: center; color: #888;">Select a country to view benchmarking data...</p>';

  panel.appendChild(header);
  panel.appendChild(controls);
  panel.appendChild(content);

  document.body.appendChild(panel);
  
  // Populate country dropdown
  populateCountryDropdown();
  
  // Add event listener for country selection
  document.getElementById('country-select').addEventListener('change', (e) => {
    if (e.target.value) {
      updateBenchmarkContent(e.target.value);
    }
  });
  
  // Add refresh button functionality
  document.querySelector('#benchmark-panel button').addEventListener('click', () => {
    console.log('🔄 Refreshing benchmark data...');
    populateCountryDropdown();
    const currentCountry = document.getElementById('country-select').value;
    if (currentCountry) {
      updateBenchmarkContent(currentCountry);
    }
  });

  return panel;
};

// Function to populate country dropdown
const populateCountryDropdown = () => {
  const countries = {};
  
  // Check if we have data
  const allArcs = state.flightArcs.concat(state.pendingArcs);
  console.log('📊 Populating country dropdown with', allArcs.length, 'arcs');
  
  allArcs.forEach(arc => {
    const country = arc.source_country;
    if (country && country !== 'Unknown') {
      countries[country] = getCountryName(country);
    }
  });

  console.log('🌍 Found countries:', Object.keys(countries));
  
  const select = document.getElementById('country-select');
  if (!select) {
    console.error('❌ Country select element not found');
    return;
  }
  
  const options = Object.entries(countries)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([code, name]) => `<option value="${code}">${name} (${code})</option>`)
    .join('');
  
  select.innerHTML = '<option value="">Select Country...</option>' + options;
  
  // If no countries found, show a message
  if (Object.keys(countries).length === 0) {
    select.innerHTML = '<option value="">No data available - loading...</option>';
  }
};

// Function to update benchmark content
const updateBenchmarkContent = (countryCode) => {
  console.log('🎯 Updating benchmark content for country:', countryCode);
  
  const benchmark = generateComprehensiveCountryBenchmark(countryCode);
  const content = document.getElementById('benchmark-content');
  
  console.log('📊 Comprehensive benchmark result:', {
    countryName: benchmark.countryName,
    operatorCount: benchmark.operatorBenchmarks ? benchmark.operatorBenchmarks.length : 'undefined',
    totalRoutes: benchmark.totalRoutes,
    totalIssues: benchmark.totalIssues,
    dataSources: benchmark.dataSourcesUsed
  });
  
  console.log('🔍 Full benchmark structure:', benchmark);
  
  if (!benchmark.operatorBenchmarks || benchmark.operatorBenchmarks.length === 0) {
    console.log('⚠️ No operator benchmarks found, trying fallback...');
    
    // Try fallback to original benchmark function
    const fallbackBenchmark = generateCountryBenchmark(countryCode);
    console.log('🔄 Fallback benchmark result:', fallbackBenchmark);
    
    if (fallbackBenchmark.operatorBenchmarks && fallbackBenchmark.operatorBenchmarks.length > 0) {
      console.log('✅ Using fallback benchmark data');
      benchmark = fallbackBenchmark;
    } else {
      content.innerHTML = `
        <div style="text-align: center; color: #888; padding: 20px;">
          <p>📊 No data available for ${benchmark.countryName}</p>
          <p style="font-size: 10px;">Try selecting a different country or wait for more data to load.</p>
          <p style="font-size: 10px; color: #666;">Debug: Found ${state.flightArcs.length + state.pendingArcs.length} total arcs</p>
          <p style="font-size: 10px; color: #666;">All data for stats: ${state.allDataForStats ? state.allDataForStats.length : 'undefined'}</p>
        </div>
      `;
      return;
    }
  }

  // Generate charts
  const charts = generateCharts(benchmark);
  
  let html = `
    <div style="margin-bottom: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #00ff88;">${benchmark.countryName} Overview</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
        <div>🌍 Avg Latency: <span style="color: #00ff88;">${benchmark.overallAvgLatency}ms</span></div>
        <div>🏢 Operators: <span style="color: #00ff88;">${benchmark.totalOperators}</span></div>
        <div>⚠️ High Latency: <span style="color: #ff4444;">${benchmark.highLatencyRoutes.length}</span></div>
        <div>📊 Total Routes: <span style="color: #00ff88;">${benchmark.totalRoutes}</span></div>
        <div>🎯 Country Score: <span style="color: ${benchmark.countryScore >= 80 ? '#00ff88' : benchmark.countryScore >= 50 ? '#ffaa00' : '#ff4444'};">${benchmark.countryScore}/100</span></div>
        <div>🚨 Total Issues: <span style="color: #ff4444;">${benchmark.totalIssues}</span></div>
      </div>
      <div style="margin-top: 10px; padding: 8px; background: #1a1a1a; border-radius: 3px; font-size: 9px; color: #888;">
        <strong>📈 Data Sources:</strong> Flight: ${benchmark.dataSourcesUsed.flightArcs} | Pending: ${benchmark.dataSourcesUsed.pendingArcs} | All Stats: ${benchmark.dataSourcesUsed.allDataForStats} | Total: ${benchmark.dataSourcesUsed.total}
      </div>
    </div>
  `;

  // Operator performance table with scoring
  html += `
    <div style="margin-bottom: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #00ff88;">🏢 Operator Performance & Scoring</h4>
      <div style="background: #222; border-radius: 5px; padding: 10px; font-size: 9px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 3px; margin-bottom: 5px; font-weight: bold; border-bottom: 1px solid #444;">
          <div>Operator</div>
          <div>Score</div>
          <div>Latency</div>
          <div>Compliance</div>
          <div>Routes</div>
          <div>Issues</div>
        </div>
  `;

  benchmark.operatorBenchmarks.forEach(op => {
    const scoreColor = op.overallScore >= 80 ? '#00ff88' : op.overallScore >= 50 ? '#ffaa00' : '#ff4444';
    const complianceColor = op.complianceRate >= 80 ? '#00ff88' : op.complianceRate >= 50 ? '#ffaa00' : '#ff4444';
    const latencyColor = op.avgLatency <= 300 ? '#00ff88' : op.avgLatency <= 400 ? '#ffaa00' : '#ff4444';
    
    html += `
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 3px; padding: 3px 0; border-bottom: 1px solid #333;">
        <div style="font-weight: bold;">${op.name}</div>
        <div style="color: ${scoreColor}; font-weight: bold;">${op.overallScore}</div>
        <div style="color: ${latencyColor};">${op.avgLatency}ms</div>
        <div style="color: ${complianceColor};">${op.complianceRate}%</div>
        <div>${op.totalRoutes}</div>
        <div style="color: ${op.issueSeverity > 10 ? '#ff4444' : op.issueSeverity > 5 ? '#ffaa00' : '#00ff88'};">${op.issueSeverity}</div>
      </div>
    `;
  });

  html += '</div>';

  // Regional performance
  if (benchmark.operatorBenchmarks.some(op => op.regionalPerformance.length > 0)) {
    html += `
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #00ff88;">🌐 Regional Performance</h4>
    `;

    benchmark.operatorBenchmarks.forEach(op => {
      if (op.regionalPerformance.length > 0) {
        html += `<div style="margin-bottom: 10px; font-size: 10px;">
          <div style="font-weight: bold; color: #00ff88; margin-bottom: 5px;">${op.name}:</div>
        `;
        
        op.regionalPerformance.slice(0, 3).forEach(region => {
          const status = region.avg <= 300 ? '🟢' : region.avg <= 400 ? '🟡' : '🔴';
          html += `<div style="margin-left: 10px; margin-bottom: 2px;">
            ${status} ${region.region}: ${region.avg}ms (${region.count} routes)
          </div>`;
        });
        
        html += '</div>';
      }
    });

    html += '</div>';
  }

  // High latency routes
  if (benchmark.highLatencyRoutes.length > 0) {
    html += `
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #ff4444;">⚠️ High Latency Routes (>400ms)</h4>
        <div style="background: #222; border-radius: 5px; padding: 10px; font-size: 10px; max-height: 150px; overflow-y: auto;">
    `;

    benchmark.highLatencyRoutes.slice(0, 8).forEach(route => {
      html += `<div style="margin-bottom: 3px; color: #ff4444;">
        🔴 ${route.operator} → ${route.destRegion}: ${route.latency}ms
      </div>`;
    });

    if (benchmark.highLatencyRoutes.length > 8) {
      html += `<div style="color: #888; font-style: italic;">
        ... and ${benchmark.highLatencyRoutes.length - 8} more routes
      </div>`;
    }

    html += '</div></div>';
  }

  // Add charts section
  html += `
    <div style="margin-bottom: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #00ff88;">📊 Performance Charts</h4>
      <div style="background: #222; border-radius: 5px; padding: 10px; font-size: 9px; font-family: monospace;">
  `;

  // Latency distribution chart
  if (Object.values(charts.latencyDistribution).some(v => v > 0)) {
    html += '<div style="margin-bottom: 10px;"><strong>Latency Distribution:</strong><br>';
    Object.entries(charts.latencyDistribution).forEach(([range, count]) => {
      if (count > 0) {
        const barLength = Math.round((count / Math.max(...Object.values(charts.latencyDistribution))) * 20);
        const bar = '█'.repeat(barLength);
        const color = range.includes('500') ? '#ff4444' : range.includes('400') ? '#ffaa00' : '#00ff88';
        html += `<div style="color: ${color};">${range.padEnd(10)} ${bar} ${count}</div>`;
      }
    });
    html += '</div>';
  }

  // Issue severity chart
  if (charts.issueSeverity.critical > 0 || charts.issueSeverity.serious > 0 || charts.issueSeverity.moderate > 0) {
    html += '<div style="margin-bottom: 10px;"><strong>Issue Severity:</strong><br>';
    Object.entries(charts.issueSeverity).forEach(([severity, count]) => {
      if (count > 0) {
        const barLength = Math.round((count / Math.max(...Object.values(charts.issueSeverity))) * 20);
        const bar = '█'.repeat(barLength);
        const color = severity === 'critical' ? '#ff4444' : severity === 'serious' ? '#ffaa00' : '#ffff00';
        html += `<div style="color: ${color};">${severity.padEnd(10)} ${bar} ${count}</div>`;
      }
    });
    html += '</div>';
  }

  // Regional performance chart
  if (charts.regionalPerformance.length > 0) {
    html += '<div style="margin-bottom: 10px;"><strong>Regional Performance:</strong><br>';
    charts.regionalPerformance.slice(0, 5).forEach(region => {
      const barLength = Math.round((region.avgLatency / Math.max(...charts.regionalPerformance.map(r => r.avgLatency))) * 20);
      const bar = '█'.repeat(barLength);
      const color = region.avgLatency > 400 ? '#ff4444' : region.avgLatency > 300 ? '#ffaa00' : '#00ff88';
      html += `<div style="color: ${color};">${region.region.padEnd(12)} ${bar} ${region.avgLatency}ms (${region.totalRoutes} routes)</div>`;
    });
    html += '</div>';
  }

  html += '</div></div>';

  content.innerHTML = html;
};

// Function to update the entire benchmark panel
window.updateBenchmarkPanel = () => {
  const countrySelect = document.getElementById('country-select');
  if (countrySelect && countrySelect.value) {
    updateBenchmarkContent(countrySelect.value);
  }
};

// Function to show/hide benchmark panel
window.toggleBenchmarkPanel = () => {
  const panel = document.getElementById('benchmark-panel');
  if (panel) {
    panel.remove();
  } else {
    createBenchmarkPanel();
  }
};

// Function to generate chart data for benchmarking
const generateCharts = (benchmark) => {
  const charts = {};
  
  // Check if benchmark has the expected structure
  if (!benchmark || !benchmark.operatorBenchmarks || !Array.isArray(benchmark.operatorBenchmarks)) {
    console.error('❌ Invalid benchmark structure:', benchmark);
    return {
      latencyDistribution: { '0-200ms': 0, '201-300ms': 0, '301-400ms': 0, '401-500ms': 0, '500ms+': 0 },
      operatorPerformance: [],
      issueSeverity: { critical: 0, serious: 0, moderate: 0 },
      regionalPerformance: []
    };
  }
  
  // Latency distribution chart
  const latencyRanges = {
    '0-200ms': 0,
    '201-300ms': 0,
    '301-400ms': 0,
    '401-500ms': 0,
    '500ms+': 0
  };
  
  benchmark.operatorBenchmarks.forEach(op => {
    if (op.latencies && Array.isArray(op.latencies)) {
      op.latencies.forEach(latency => {
        if (latency <= 200) latencyRanges['0-200ms']++;
        else if (latency <= 300) latencyRanges['201-300ms']++;
        else if (latency <= 400) latencyRanges['301-400ms']++;
        else if (latency <= 500) latencyRanges['401-500ms']++;
        else latencyRanges['500ms+']++;
      });
    }
  });
  
  charts.latencyDistribution = latencyRanges;
  
  // Operator performance chart
  charts.operatorPerformance = benchmark.operatorBenchmarks.map(op => ({
    name: op.name || 'Unknown',
    avgLatency: op.avgLatency || 0,
    complianceRate: op.complianceRate || 0,
    overallScore: op.overallScore || 0,
    totalRoutes: op.totalRoutes || 0
  }));
  
  // Issue severity chart
  charts.issueSeverity = {
    critical: benchmark.criticalIssues || 0,
    serious: benchmark.seriousIssues || 0,
    moderate: benchmark.moderateIssues || 0
  };
  
  // Regional performance chart
  const regionalData = {};
  benchmark.operatorBenchmarks.forEach(op => {
    if (op.regionalPerformance && Array.isArray(op.regionalPerformance)) {
      op.regionalPerformance.forEach(region => {
        if (!regionalData[region.region]) {
          regionalData[region.region] = { totalLatency: 0, totalRoutes: 0, issues: 0 };
        }
        regionalData[region.region].totalLatency += (region.avg || 0) * (region.count || 0);
        regionalData[region.region].totalRoutes += region.count || 0;
        regionalData[region.region].issues += region.highCount || 0;
      });
    }
  });
  
  charts.regionalPerformance = Object.entries(regionalData).map(([region, data]) => ({
    region,
    avgLatency: Math.round(data.totalLatency / data.totalRoutes),
    totalRoutes: data.totalRoutes,
    issues: data.issues
  })).sort((a, b) => b.avgLatency - a.avgLatency);
  
  return charts;
};

// Function to create ASCII bar chart
const createBarChart = (data, title, maxWidth = 30) => {
  const maxValue = Math.max(...Object.values(data));
  const maxLabelLength = Math.max(...Object.keys(data).map(label => label.length));
  const labelWidth = Math.max(12, maxLabelLength + 2); // Ensure minimum width and account for longest label
  const barStartPosition = labelWidth + 1; // Fixed position for all bars
  
  let chart = `\n📊 ${title}\n`;
  chart += '─'.repeat(labelWidth + maxWidth + 15) + '\n';
  
  Object.entries(data).forEach(([label, value]) => {
    const barLength = Math.round((value / maxValue) * maxWidth);
    const bar = '█'.repeat(barLength);
    const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
    
    // Create aligned bar with fixed starting position
    const alignedLabel = label.padEnd(labelWidth);
    const alignedBar = ' '.repeat(barStartPosition) + bar;
    chart += `${alignedLabel}${alignedBar} ${value} (${percentage}%)\n`;
  });
  
  return chart;
};

// Function to create performance radar chart (ASCII)
const createRadarChart = (operatorData) => {
  let chart = '\n🎯 OPERATOR PERFORMANCE RADAR\n';
  chart += '─'.repeat(40) + '\n';
  
  const maxScore = 100;
  const maxLatency = Math.max(...operatorData.map(op => op.avgLatency));
  
  operatorData.slice(0, 5).forEach((op, index) => {
    const scoreBar = '█'.repeat(Math.round((op.overallScore / maxScore) * 20));
    const latencyBar = '█'.repeat(Math.round((op.avgLatency / maxLatency) * 20));
    const complianceBar = '█'.repeat(Math.round((op.complianceRate / 100) * 20));
    
    chart += `${(index + 1).toString().padStart(2)}. ${op.name.padEnd(12)} `;
    chart += `Score: ${scoreBar} ${op.overallScore}\n`;
    chart += `    Latency: ${latencyBar} ${op.avgLatency}ms\n`;
    chart += `    Compliance: ${complianceBar} ${op.complianceRate}%\n\n`;
  });
  
  return chart;
};

// Function to display detailed console charts for enhanced benchmarking
window.showDetailedBenchmark = (countryCode) => {
  const benchmark = generateCountryBenchmark(countryCode);
  const charts = generateCharts(benchmark);
  
  console.log(`\n🎯 ENHANCED BENCHMARKING: ${benchmark.countryName} (${countryCode})`);
  console.log(`🌍 Country Score: ${benchmark.countryScore}/100`);
  console.log(`📊 Weighted Avg Latency: ${benchmark.overallAvgLatency}ms`);
  console.log(`🏢 Total Operators: ${benchmark.totalOperators}`);
  console.log(`📈 Total Routes: ${benchmark.totalRoutes}`);
  console.log(`🚨 Total Issues: ${benchmark.totalIssues}\n`);
  
  // Performance radar chart
  console.log(createRadarChart(charts.operatorPerformance));
  
  // Latency distribution chart
  console.log(createBarChart(charts.latencyDistribution, 'LATENCY DISTRIBUTION'));
  
  // Issue severity chart
  console.log(createBarChart(charts.issueSeverity, 'ISSUE SEVERITY'));
  
  // Regional performance chart
  if (charts.regionalPerformance.length > 0) {
    const regionalData = {};
    charts.regionalPerformance.forEach(region => {
      regionalData[region.region] = region.avgLatency;
    });
    console.log(createBarChart(regionalData, 'REGIONAL PERFORMANCE (Avg Latency)'));
  }
  
  console.log('\n🏆 OPERATOR RANKINGS (by Overall Score):');
  console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Rank │ Operator          │ Score │ Latency │ Compliance │ Routes │ Issues │');
  console.log('├─────────────────────────────────────────────────────────────────────────────┤');
  
  benchmark.operatorBenchmarks.forEach((op, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    const status = op.overallScore >= 80 ? '🟢' : op.overallScore >= 50 ? '🟡' : '🔴';
    console.log(`│ ${rank.toString().padStart(4)} │ ${op.name.padEnd(16)} │ ${op.overallScore.toString().padStart(5)} │ ${op.avgLatency.toString().padStart(7)}ms │ ${op.complianceRate.toString().padStart(9)}% │ ${op.totalRoutes.toString().padStart(6)} │ ${op.issueSeverity.toString().padStart(6)} │ ${status}${medal}`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
  
  // Confidence analysis
  console.log('📊 CONFIDENCE ANALYSIS:');
  benchmark.operatorBenchmarks.forEach(op => {
    const confidence = op.confidenceWeight >= 0.8 ? '🟢 High' : op.confidenceWeight >= 0.5 ? '🟡 Medium' : '🔴 Low';
    console.log(`  ${op.name}: ${confidence} confidence (${op.totalRoutes} routes, ${op.userCount} users, ${op.routeTypes} route types)`);
  });
  
  return benchmark;
};

// Function to check if benchmarking data is available
window.checkBenchmarkData = () => {
  const allArcs = state.flightArcs.concat(state.pendingArcs);
  console.log('📊 Data availability check:');
  console.log('  - Total arcs:', allArcs.length);
  console.log('  - Flight arcs:', state.flightArcs.length);
  console.log('  - Pending arcs:', state.pendingArcs.length);
  
  if (allArcs.length === 0) {
    console.log('❌ No data available for benchmarking');
    return false;
  }
  
  const countries = {};
  allArcs.forEach(arc => {
    const country = arc.source_country;
    if (country && country !== 'Unknown') {
      countries[country] = (countries[country] || 0) + 1;
    }
  });
  
  console.log('🌍 Countries with data:', countries);
  return Object.keys(countries).length > 0;
};

// Function to force refresh benchmark panel
window.refreshBenchmarkPanel = () => {
  const panel = document.getElementById('benchmark-panel');
  if (panel) {
    populateCountryDropdown();
    const currentCountry = document.getElementById('country-select').value;
    if (currentCountry) {
      updateBenchmarkContent(currentCountry);
    }
  } else {
    console.log('📊 Benchmark panel not found, creating new one...');
    createBenchmarkPanel();
  }
};

// Enhanced country benchmarking using ALL available data sources
const generateComprehensiveCountryBenchmark = (countryCode) => {
  const countryName = getCountryName(countryCode);
  const operators = {};
  const regions = {};
  const highLatencyRoutes = [];
  
  // Collect ALL available data sources
  const allDataSources = [
    ...state.flightArcs,
    ...state.pendingArcs,
    ...state.allDataForStats
  ];
  
  console.log(`📊 Comprehensive benchmarking for ${countryName} (${countryCode}):`);
  console.log(`  - Flight arcs: ${state.flightArcs.length}`);
  console.log(`  - Pending arcs: ${state.pendingArcs.length}`);
  console.log(`  - All data for stats: ${state.allDataForStats.length}`);
  console.log(`  - Total data points: ${allDataSources.length}`);
  
  // Process all data sources to gather country-specific data
  allDataSources.forEach(arc => {
    if (arc.source_country === countryCode) {
      const operator = arc.operator || 'Unknown';
      const latency = arc.latency || parseFloat(arc.avgTime) || 0;
      const destRegion = continentCodeToName[arc.dest_region] || arc.dest_region || 'Unknown';
      
      // Track operator performance
      if (!operators[operator]) {
        operators[operator] = {
          name: operator,
          latencies: [],
          regionLatencies: {},
          highLatencyCount: 0,
          totalRoutes: 0,
          userCount: new Set(), // Track unique users
          routeTypes: new Set(), // Track route types
          dataSources: new Set() // Track which data sources contributed
        };
      }
      
      operators[operator].latencies.push(latency);
      operators[operator].totalRoutes++;
      operators[operator].userCount.add(arc.operator || 'unknown');
      operators[operator].routeTypes.add(arc.network_type || 'unknown');
      
      // Track which data source this came from
      if (state.flightArcs.includes(arc)) {
        operators[operator].dataSources.add('flightArcs');
      } else if (state.pendingArcs.includes(arc)) {
        operators[operator].dataSources.add('pendingArcs');
      } else if (state.allDataForStats.includes(arc)) {
        operators[operator].dataSources.add('allDataForStats');
      }
      
      if (latency > 400) {
        operators[operator].highLatencyCount++;
      }
      
      // Track regional performance
      if (!operators[operator].regionLatencies[destRegion]) {
        operators[operator].regionLatencies[destRegion] = [];
      }
      operators[operator].regionLatencies[destRegion].push(latency);
      
      // Track high latency routes
      if (latency > 400) {
        highLatencyRoutes.push({
          operator,
          destRegion,
          latency,
          destCountry: arc.dest_country
        });
      }
    }
  });
  
  // Calculate performance metrics and scoring for each operator
  const operatorBenchmarks = Object.values(operators).map(op => {
    const avgLatency = op.latencies.length > 0 ? 
      Math.round(op.latencies.reduce((a, b) => a + b, 0) / op.latencies.length) : 0;
    
    const complianceRate = op.totalRoutes > 0 ? 
      Math.round(((op.totalRoutes - op.highLatencyCount) / op.totalRoutes) * 100) : 0;
    
    // Enhanced confidence weight based on multiple factors
    const routeWeight = Math.min(op.totalRoutes / 10, 1);
    const dataSourceWeight = op.dataSources.size / 3; // More data sources = higher confidence
    const userWeight = Math.min(op.userCount.size / 5, 1);
    const confidenceWeight = (routeWeight + dataSourceWeight + userWeight) / 3;
    
    // Scoring system (0-100)
    let latencyScore = 0;
    if (avgLatency <= 200) latencyScore = 100;
    else if (avgLatency <= 300) latencyScore = 80;
    else if (avgLatency <= 400) latencyScore = 60;
    else if (avgLatency <= 500) latencyScore = 40;
    else latencyScore = 20;
    
    let complianceScore = complianceRate; // Direct percentage
    
    // Overall score (weighted average of latency and compliance)
    const overallScore = Math.round((latencyScore * 0.6 + complianceScore * 0.4) * confidenceWeight);
    
    // Calculate regional performance
    const regionalPerformance = Object.entries(op.regionLatencies).map(([region, latencies]) => {
      const avg = latencies.length > 0 ? 
        Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
      const highCount = latencies.filter(l => l > 400).length;
      const regionalCompliance = latencies.length > 0 ? 
        Math.round(((latencies.length - highCount) / latencies.length) * 100) : 0;
      return { region, avg, count: latencies.length, highCount, compliance: regionalCompliance };
    }).sort((a, b) => b.avg - a.avg); // Sort by worst performance first
    
    // Calculate issue severity
    const criticalIssues = op.latencies.filter(l => l > 500).length;
    const seriousIssues = op.latencies.filter(l => l > 400 && l <= 500).length;
    const moderateIssues = op.latencies.filter(l => l > 300 && l <= 400).length;
    
    return {
      name: op.name,
      avgLatency,
      complianceRate,
      totalRoutes: op.totalRoutes,
      highLatencyCount: op.highLatencyCount,
      regionalPerformance,
      overallScore,
      latencyScore,
      complianceScore,
      confidenceWeight,
      userCount: op.userCount.size,
      routeTypes: op.routeTypes.size,
      dataSources: Array.from(op.dataSources),
      criticalIssues,
      seriousIssues,
      moderateIssues,
      issueSeverity: criticalIssues * 3 + seriousIssues * 2 + moderateIssues
    };
  }).sort((a, b) => b.overallScore - a.overallScore); // Sort by best score first
  
  // Calculate country-level metrics
  const totalRoutes = operatorBenchmarks.reduce((sum, op) => sum + op.totalRoutes, 0);
  const weightedAvgLatency = totalRoutes > 0 ? 
    Math.round(operatorBenchmarks.reduce((sum, op) => sum + (op.avgLatency * op.totalRoutes), 0) / totalRoutes) : 0;
  
  const totalIssues = operatorBenchmarks.reduce((sum, op) => sum + op.issueSeverity, 0);
  const countryScore = operatorBenchmarks.length > 0 ? 
    Math.round(operatorBenchmarks.reduce((sum, op) => sum + op.overallScore, 0) / operatorBenchmarks.length) : 0;
  
  return {
    countryCode,
    countryName,
    operatorBenchmarks,
    highLatencyRoutes,
    totalOperators: operatorBenchmarks.length,
    overallAvgLatency: weightedAvgLatency,
    countryScore,
    totalRoutes,
    totalIssues,
    criticalIssues: operatorBenchmarks.reduce((sum, op) => sum + op.criticalIssues, 0),
    seriousIssues: operatorBenchmarks.reduce((sum, op) => sum + op.seriousIssues, 0),
    moderateIssues: operatorBenchmarks.reduce((sum, op) => sum + op.moderateIssues, 0),
    dataSourcesUsed: {
      flightArcs: state.flightArcs.length,
      pendingArcs: state.pendingArcs.length,
      allDataForStats: state.allDataForStats.length,
      total: allDataSources.length
    }
  };
};

// Function to display comprehensive benchmarking results
window.showComprehensiveBenchmark = (countryCode) => {
  const benchmark = generateComprehensiveCountryBenchmark(countryCode);
  const charts = generateCharts(benchmark);
  
  console.log(`\n🎯 COMPREHENSIVE BENCHMARKING: ${benchmark.countryName} (${countryCode})`);
  console.log(`🌍 Country Score: ${benchmark.countryScore}/100`);
  console.log(`📊 Weighted Avg Latency: ${benchmark.overallAvgLatency}ms`);
  console.log(`🏢 Total Operators: ${benchmark.totalOperators}`);
  console.log(`📈 Total Routes: ${benchmark.totalRoutes}`);
  console.log(`🚨 Total Issues: ${benchmark.totalIssues}`);
  console.log(`📊 Data Sources Used:`);
  console.log(`  - Flight Arcs: ${benchmark.dataSourcesUsed.flightArcs}`);
  console.log(`  - Pending Arcs: ${benchmark.dataSourcesUsed.pendingArcs}`);
  console.log(`  - All Data for Stats: ${benchmark.dataSourcesUsed.allDataForStats}`);
  console.log(`  - Total Data Points: ${benchmark.dataSourcesUsed.total}\n`);
  
  // Performance radar chart
  console.log(createRadarChart(charts.operatorPerformance));
  
  // Latency distribution chart
  console.log(createBarChart(charts.latencyDistribution, 'LATENCY DISTRIBUTION'));
  
  // Issue severity chart
  console.log(createBarChart(charts.issueSeverity, 'ISSUE SEVERITY'));
  
  // Regional performance chart
  if (charts.regionalPerformance.length > 0) {
    const regionalData = {};
    charts.regionalPerformance.forEach(region => {
      regionalData[region.region] = region.avgLatency;
    });
    console.log(createBarChart(regionalData, 'REGIONAL PERFORMANCE (Avg Latency)'));
  }
  
  console.log('\n🏆 OPERATOR RANKINGS (by Overall Score):');
  console.log('┌─────────────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Rank │ Operator          │ Score │ Latency │ Compliance │ Routes │ Issues │ Sources │');
  console.log('├─────────────────────────────────────────────────────────────────────────────────────────┤');
  
  benchmark.operatorBenchmarks.forEach((op, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    const status = op.overallScore >= 80 ? '🟢' : op.overallScore >= 50 ? '🟡' : '🔴';
    const sources = op.dataSources.join(',');
    console.log(`│ ${rank.toString().padStart(4)} │ ${op.name.padEnd(16)} │ ${op.overallScore.toString().padStart(5)} │ ${op.avgLatency.toString().padStart(7)}ms │ ${op.complianceRate.toString().padStart(9)}% │ ${op.totalRoutes.toString().padStart(6)} │ ${op.issueSeverity.toString().padStart(6)} │ ${sources.padEnd(7)} │ ${status}${medal}`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────────────────┘\n');
  
  // Enhanced confidence analysis
  console.log('📊 ENHANCED CONFIDENCE ANALYSIS:');
  benchmark.operatorBenchmarks.forEach(op => {
    const confidence = op.confidenceWeight >= 0.8 ? '🟢 High' : op.confidenceWeight >= 0.5 ? '🟡 Medium' : '🔴 Low';
    const sources = op.dataSources.join(', ');
    console.log(`  ${op.name}: ${confidence} confidence (${op.totalRoutes} routes, ${op.userCount} users, ${op.routeTypes} route types, sources: ${sources})`);
  });
  
  return benchmark;
};

// Global benchmarking system - worldwide rankings and percentiles
const generateGlobalBenchmarks = () => {
  const countries = {};
  const operators = {};
  const globalData = [];
  
  // Collect ALL available data sources
  const allDataSources = [
    ...state.flightArcs,
    ...state.pendingArcs,
    ...state.allDataForStats
  ];
  
  console.log(`🌍 Generating global benchmarks from ${allDataSources.length} data points`);
  
  // Process all data to build global dataset
  allDataSources.forEach(arc => {
    const country = arc.source_country;
    const operator = arc.operator || 'Unknown';
    const latency = arc.latency || parseFloat(arc.avgTime) || 0;
    
    if (country && country !== 'Unknown') {
      // Track country data
      if (!countries[country]) {
        countries[country] = {
          code: country,
          name: getCountryName(country),
          latencies: [],
          operators: new Set(),
          totalRoutes: 0,
          highLatencyCount: 0
        };
      }
      countries[country].latencies.push(latency);
      countries[country].operators.add(operator);
      countries[country].totalRoutes++;
      if (latency > 400) countries[country].highLatencyCount++;
      
      // Track operator data
      if (!operators[operator]) {
        operators[operator] = {
          name: operator,
          latencies: [],
          countries: new Set(),
          totalRoutes: 0,
          highLatencyCount: 0
        };
      }
      operators[operator].latencies.push(latency);
      operators[operator].countries.add(country);
      operators[operator].totalRoutes++;
      if (latency > 400) operators[operator].highLatencyCount++;
      
      // Add to global dataset
      globalData.push({
        country,
        operator,
        latency,
        timestamp: arc.timestamp || Date.now()
      });
    }
  });
  
  // Calculate country benchmarks
  const countryBenchmarks = Object.values(countries).map(country => {
    const avgLatency = country.latencies.length > 0 ? 
      Math.round(country.latencies.reduce((a, b) => a + b, 0) / country.latencies.length) : 0;
    
    const complianceRate = country.totalRoutes > 0 ? 
      Math.round(((country.totalRoutes - country.highLatencyCount) / country.totalRoutes) * 100) : 0;
    
    // Scoring system
    let latencyScore = 0;
    if (avgLatency <= 200) latencyScore = 100;
    else if (avgLatency <= 300) latencyScore = 80;
    else if (avgLatency <= 400) latencyScore = 60;
    else if (avgLatency <= 500) latencyScore = 40;
    else latencyScore = 20;
    
    const overallScore = Math.round((latencyScore * 0.6 + complianceRate * 0.4));
    
    // Calculate issues
    const criticalIssues = country.latencies.filter(l => l > 500).length;
    const seriousIssues = country.latencies.filter(l => l > 400 && l <= 500).length;
    const moderateIssues = country.latencies.filter(l => l > 300 && l <= 400).length;
    
    return {
      code: country.code,
      name: country.name,
      avgLatency,
      complianceRate,
      overallScore,
      totalRoutes: country.totalRoutes,
      operatorCount: country.operators.size,
      criticalIssues,
      seriousIssues,
      moderateIssues,
      totalIssues: criticalIssues * 3 + seriousIssues * 2 + moderateIssues
    };
  }).sort((a, b) => b.overallScore - a.overallScore);
  
  // Calculate operator benchmarks
  const operatorBenchmarks = Object.values(operators).map(op => {
    const avgLatency = op.latencies.length > 0 ? 
      Math.round(op.latencies.reduce((a, b) => a + b, 0) / op.latencies.length) : 0;
    
    const complianceRate = op.totalRoutes > 0 ? 
      Math.round(((op.totalRoutes - op.highLatencyCount) / op.totalRoutes) * 100) : 0;
    
    let latencyScore = 0;
    if (avgLatency <= 200) latencyScore = 100;
    else if (avgLatency <= 300) latencyScore = 80;
    else if (avgLatency <= 400) latencyScore = 60;
    else if (avgLatency <= 500) latencyScore = 40;
    else latencyScore = 20;
    
    const overallScore = Math.round((latencyScore * 0.6 + complianceRate * 0.4));
    
    const criticalIssues = op.latencies.filter(l => l > 500).length;
    const seriousIssues = op.latencies.filter(l => l > 400 && l <= 500).length;
    const moderateIssues = op.latencies.filter(l => l > 300 && l <= 400).length;
    
    return {
      name: op.name,
      avgLatency,
      complianceRate,
      overallScore,
      totalRoutes: op.totalRoutes,
      countryCount: op.countries.size,
      criticalIssues,
      seriousIssues,
      moderateIssues,
      totalIssues: criticalIssues * 3 + seriousIssues * 2 + moderateIssues
    };
  }).sort((a, b) => b.overallScore - a.overallScore);
  
  // Calculate percentiles and rankings
  const calculatePercentiles = (benchmarks) => {
    const scores = benchmarks.map(b => b.overallScore).sort((a, b) => a - b);
    
    return benchmarks.map(benchmark => {
      const rank = scores.indexOf(benchmark.overallScore) + 1;
      const percentile = Math.round((rank / scores.length) * 100);
      const total = scores.length;
      
      return {
        ...benchmark,
        rank,
        percentile,
        total,
        performance: percentile >= 90 ? '🏆 Elite' : 
                    percentile >= 75 ? '🥇 Excellent' :
                    percentile >= 50 ? '🥈 Good' :
                    percentile >= 25 ? '🥉 Fair' : '⚠️ Needs Improvement'
      };
    });
  };
  
  const countryRankings = calculatePercentiles(countryBenchmarks);
  const operatorRankings = calculatePercentiles(operatorBenchmarks);
  
  return {
    countries: countryRankings,
    operators: operatorRankings,
    globalStats: {
      totalCountries: countryRankings.length,
      totalOperators: operatorRankings.length,
      totalRoutes: globalData.length,
      avgGlobalLatency: globalData.length > 0 ? 
        Math.round(globalData.reduce((sum, d) => sum + d.latency, 0) / globalData.length) : 0
    }
  };
};

// Create beautiful D3 benchmark tables
const createD3BenchmarkTables = () => {
  const existingPanel = document.getElementById('d3-benchmark-panel');
  if (existingPanel) { existingPanel.remove(); }
  
  const panel = document.createElement('div');
  panel.id = 'd3-benchmark-panel';
  panel.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 800px; height: 90vh;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(0, 20, 40, 0.98));
    border: 3px solid #00e5ff;
    border-radius: 15px; padding: 20px; color: white;
    font-family: 'Arial', sans-serif; font-size: 14px;
    overflow: hidden; z-index: 1000; backdrop-filter: blur(15px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 229, 255, 0.3);
  `;
  
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2 style="margin: 0; color: #00e5ff; font-size: 24px; text-shadow: 0 0 15px rgba(0, 229, 255, 0.7); font-weight: bold;">
          🏆 Global Performance Rankings
        </h2>
        <p style="margin: 5px 0 0 0; color: #ccc; font-size: 12px; opacity: 0.8;">
          Interactive D3.js benchmark tables with real-time data
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="d3-countries-btn" onclick="showD3CountryRankings()" 
                style="background: linear-gradient(45deg, #00e5ff, #0088cc); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3); transition: all 0.3s ease;">
          🌍 Countries
        </button>
        <button id="d3-operators-btn" onclick="showD3OperatorRankings()" 
                style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3); transition: all 0.3s ease;">
          🏢 Operators
        </button>
        <button onclick="document.getElementById('d3-benchmark-panel').remove()" 
                style="background: linear-gradient(45deg, #ff4444, #cc0000); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3); transition: all 0.3s ease;">
          ✕ Close
        </button>
      </div>
    </div>
  `;
  
  const content = document.createElement('div');
  content.id = 'd3-benchmark-content';
  content.style.cssText = `
    height: calc(90vh - 80px);
    overflow: hidden;
    position: relative;
  `;
  content.innerHTML = '<div style="text-align: center; color: #888; padding: 50px;">Click "Countries" or "Operators" to view beautiful D3 rankings...</div>';
  
  panel.appendChild(header);
  panel.appendChild(content);
  
  document.body.appendChild(panel);
  return panel;
};

// Show beautiful D3 country rankings
window.showD3CountryRankings = () => {
  const globalBenchmarks = generateGlobalBenchmarks();
  const content = document.getElementById('d3-benchmark-content');
  
  if (!globalBenchmarks.countries || globalBenchmarks.countries.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; color: #888; padding: 50px;">
        <p>📊 No country data available for D3 rankings</p>
        <p style="font-size: 12px;">Wait for more data to load or check data sources.</p>
      </div>
    `;
    return;
  }
  
  // Clear content and create SVG
  content.innerHTML = '';
  const svg = d3.select(content)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('background', 'radial-gradient(circle at center, rgba(0, 0, 0, 0.6), rgba(0, 20, 40, 0.8))');
  
  // Create beautiful D3 country rankings table
  createD3CountryTable(svg, globalBenchmarks.countries);
};

// Create beautiful D3 country table
const createD3CountryTable = (svg, countries) => {
  const width = 760;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  
  // Create scales
  const xScale = d3.scaleBand()
    .domain(countries.slice(0, 15).map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(countries, d => d.overallScore)])
    .range([height - margin.bottom, margin.top]);
  
  const colorScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(['#ff1744', '#ffaa00', '#44ff44']);
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#00e5ff')
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .text('🏆 Top 15 Countries by Performance Score');
  
  // Create bars
  const bars = svg.selectAll('.bar')
    .data(countries.slice(0, 15))
    .enter()
    .append('g')
    .attr('class', 'bar');
  
  bars.append('rect')
    .attr('x', d => xScale(d.name))
    .attr('y', d => yScale(d.overallScore))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - margin.bottom - yScale(d.overallScore))
    .attr('fill', d => colorScale(d.overallScore))
    .attr('stroke', '#00e5ff')
    .attr('stroke-width', 1)
    .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
  
  // Add value labels
  bars.append('text')
    .attr('x', d => xScale(d.name) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.overallScore) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text(d => d.overallScore);
  
  // Add country labels
  bars.append('text')
    .attr('x', d => xScale(d.name) + xScale.bandwidth() / 2)
    .attr('y', height - margin.bottom + 15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccc')
    .attr('font-size', '10px')
    .attr('transform', d => `rotate(-45, ${xScale(d.name) + xScale.bandwidth() / 2}, ${height - margin.bottom + 15})`)
    .text(d => d.name);
  
  // Add axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);
  
  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#ccc')
    .style('font-size', '10px');
  
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis)
    .selectAll('text')
    .style('fill', '#ccc')
    .style('font-size', '12px');
  
  // Add axis labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccc')
    .attr('font-size', '12px')
    .text('Countries');
  
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccc')
    .attr('font-size', '12px')
    .text('Performance Score');
};
  


// Show beautiful D3 operator rankings
window.showD3OperatorRankings = () => {
  const globalBenchmarks = generateGlobalBenchmarks();
  const content = document.getElementById('d3-benchmark-content');
  
  if (!globalBenchmarks.operators || globalBenchmarks.operators.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; color: #888; padding: 50px;">
        <p>📊 No operator data available for D3 rankings</p>
        <p style="font-size: 12px;">Wait for more data to load or check data sources.</p>
      </div>
    `;
    return;
  }
  
  // Clear content and create SVG
  content.innerHTML = '';
  const svg = d3.select(content)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('background', 'radial-gradient(circle at center, rgba(0, 0, 0, 0.6), rgba(0, 20, 40, 0.8))');
  
  // Create beautiful D3 operator rankings table
  createD3OperatorTable(svg, globalBenchmarks.operators);
};

// Create beautiful D3 operator table
const createD3OperatorTable = (svg, operators) => {
  const width = 760;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  
  // Create scales
  const xScale = d3.scaleBand()
    .domain(operators.slice(0, 15).map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(operators, d => d.overallScore)])
    .range([height - margin.bottom, margin.top]);
  
  const colorScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(['#ff1744', '#ffaa00', '#44ff44']);
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ff6b6b')
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .text('🏢 Top 15 Operators by Performance Score');
  
  // Create bars
  const bars = svg.selectAll('.bar')
    .data(operators.slice(0, 15))
    .enter()
    .append('g')
    .attr('class', 'bar');
  
  bars.append('rect')
    .attr('x', d => xScale(d.name))
    .attr('y', d => yScale(d.overallScore))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - margin.bottom - yScale(d.overallScore))
    .attr('fill', d => colorScale(d.overallScore))
    .attr('stroke', '#ff6b6b')
    .attr('stroke-width', 1)
    .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
  
  // Add value labels
  bars.append('text')
    .attr('x', d => xScale(d.name) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.overallScore) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text(d => d.overallScore);
  
  // Add operator labels
  bars.append('text')
    .attr('x', d => xScale(d.name) + xScale.bandwidth() / 2)
    .attr('y', height - margin.bottom + 15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccc')
    .attr('font-size', '10px')
    .attr('transform', d => `rotate(-45, ${xScale(d.name) + xScale.bandwidth() / 2}, ${height - margin.bottom + 15})`)
    .text(d => d.name);
  
  // Add axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);
  
  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#ccc')
    .style('font-size', '10px');
  
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis)
    .selectAll('text')
    .style('fill', '#ccc')
    .style('font-size', '12px');
  
  // Add axis labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccc')
    .attr('font-size', '12px')
    .text('Operators');
  
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccc')
    .attr('font-size', '12px')
    .text('Performance Score');
};

// Console functions for global rankings
window.showGlobalRankings = () => {
  const globalBenchmarks = generateGlobalBenchmarks();
  
  console.log(`\n🌍 GLOBAL BENCHMARKING REPORT`);
  console.log(`📊 Total Countries: ${globalBenchmarks.globalStats.totalCountries}`);
  console.log(`🏢 Total Operators: ${globalBenchmarks.globalStats.totalOperators}`);
  console.log(`📈 Total Routes: ${globalBenchmarks.globalStats.totalRoutes}`);
  console.log(`⚡ Average Global Latency: ${globalBenchmarks.globalStats.avgGlobalLatency}ms\n`);
  
  // Country rankings
  console.log('🏆 COUNTRY RANKINGS:');
  console.log('┌─────────────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Rank │ Country          │ Score │ Percentile │ Latency │ Routes │ Operators │ Status │');
  console.log('├─────────────────────────────────────────────────────────────────────────────────────────┤');
  
  globalBenchmarks.countries.forEach((country, index) => {
    const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '  ';
    const status = country.performance;
    console.log(`│ ${country.rank.toString().padStart(4)} │ ${country.name.padEnd(16)} │ ${country.overallScore.toString().padStart(5)} │ ${country.percentile.toString().padStart(9)}% │ ${country.avgLatency.toString().padStart(7)}ms │ ${country.totalRoutes.toString().padStart(6)} │ ${country.operatorCount.toString().padStart(9)} │ ${status.padEnd(8)} │ ${medal}`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────────────────┘\n');
  
  // Operator rankings
  console.log('🏢 OPERATOR RANKINGS:');
  console.log('┌─────────────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Rank │ Operator          │ Score │ Percentile │ Latency │ Routes │ Countries │ Status │');
  console.log('├─────────────────────────────────────────────────────────────────────────────────────────┤');
  
  globalBenchmarks.operators.forEach((operator, index) => {
    const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '  ';
    const status = operator.performance;
    console.log(`│ ${operator.rank.toString().padStart(4)} │ ${operator.name.padEnd(16)} │ ${operator.overallScore.toString().padStart(5)} │ ${operator.percentile.toString().padStart(9)}% │ ${operator.avgLatency.toString().padStart(7)}ms │ ${operator.totalRoutes.toString().padStart(6)} │ ${operator.countryCount.toString().padStart(9)} │ ${status.padEnd(8)} │ ${medal}`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────────────────┘\n');
  
  // Performance distribution
  console.log('📈 PERFORMANCE DISTRIBUTION:');
  const countryDistribution = {
    '🏆 Elite (90%+)': globalBenchmarks.countries.filter(c => c.percentile >= 90).length,
    '🥇 Excellent (75-89%)': globalBenchmarks.countries.filter(c => c.percentile >= 75 && c.percentile < 90).length,
    '🥈 Good (50-74%)': globalBenchmarks.countries.filter(c => c.percentile >= 50 && c.percentile < 75).length,
    '🥉 Fair (25-49%)': globalBenchmarks.countries.filter(c => c.percentile >= 25 && c.percentile < 50).length,
    '⚠️ Needs Improvement (<25%)': globalBenchmarks.countries.filter(c => c.percentile < 25).length
  };
  
  Object.entries(countryDistribution).forEach(([category, count]) => {
    if (count > 0) {
      const barLength = Math.round((count / globalBenchmarks.countries.length) * 30);
      const bar = '█'.repeat(barLength);
      const percentage = Math.round((count / globalBenchmarks.countries.length) * 100);
      console.log(`${category.padEnd(25)} ${bar} ${count} (${percentage}%)`);
    }
  });
  
  return globalBenchmarks;
};

// Function to find specific country/operator ranking
window.findRanking = (name, type = 'country') => {
  const globalBenchmarks = generateGlobalBenchmarks();
  const searchName = name.toLowerCase();
  
  if (type === 'country') {
    const country = globalBenchmarks.countries.find(c => 
      c.name.toLowerCase().includes(searchName) || c.code.toLowerCase().includes(searchName)
    );
    
    if (country) {
      console.log(`\n🏆 ${country.name} (${country.code}) Ranking:`);
      console.log(`  Rank: ${country.rank}/${country.total}`);
      console.log(`  Percentile: ${country.percentile}%`);
      console.log(`  Score: ${country.overallScore}/100`);
      console.log(`  Performance: ${country.performance}`);
      console.log(`  Average Latency: ${country.avgLatency}ms`);
      console.log(`  Total Routes: ${country.totalRoutes}`);
      console.log(`  Operators: ${country.operatorCount}`);
      console.log(`  Issues: ${country.totalIssues}`);
    } else {
      console.log(`❌ Country "${name}" not found in rankings`);
    }
  } else if (type === 'operator') {
    const operator = globalBenchmarks.operators.find(op => 
      op.name.toLowerCase().includes(searchName)
    );
    
    if (operator) {
      console.log(`\n🏢 ${operator.name} Ranking:`);
      console.log(`  Rank: ${operator.rank}/${operator.total}`);
      console.log(`  Percentile: ${operator.percentile}%`);
      console.log(`  Score: ${operator.overallScore}/100`);
      console.log(`  Performance: ${operator.performance}`);
      console.log(`  Average Latency: ${operator.avgLatency}ms`);
      console.log(`  Total Routes: ${operator.totalRoutes}`);
      console.log(`  Countries: ${operator.countryCount}`);
      console.log(`  Issues: ${operator.totalIssues}`);
    } else {
      console.log(`❌ Operator "${name}" not found in rankings`);
    }
  }
};

// Wired node location mapping
let wiredNodeLocations = {};

// Load wired node locations from CSV
const loadWiredNodeLocations = async () => {
  try {
    const response = await fetch('./wirednodelocations.csv');
    const csvText = await response.text();
    
    // Parse CSV with better handling of quoted values
    const lines = csvText.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing that handles quoted values
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value
      
      const userId = values[0];
      const location = values[1]?.replace(/"/g, '') || '';
      const latitude = parseFloat(values[2]) || null;
      const longitude = parseFloat(values[3]) || null;
      
      if (userId && userId !== 'userId' && userId !== '' && (latitude || longitude)) {
        wiredNodeLocations[userId] = {
          location,
          latitude,
          longitude
        };
        console.log(`📍 Loaded wired node: ${userId} -> ${latitude}, ${longitude} (${location})`);
      }
    }
    
    console.log(`📍 Loaded ${Object.keys(wiredNodeLocations).length} wired node locations`);
    console.log('📍 Available wired nodes:', Object.keys(wiredNodeLocations));
    
  } catch (error) {
    console.error('❌ Failed to load wired node locations:', error);
  }
};

// Patch location data for wired nodes
const patchWiredNodeLocation = (arcData) => {
  // Check if this is a wired node (missing source coordinates or has userId that matches our wired nodes)
  const isWiredNode = (arcData.network_type === 'wired' && arcData.userId) || 
                      (!arcData.source_latitude && !arcData.source_longitude && arcData.userId);
  
  if (isWiredNode && arcData.userId) {
    const locationData = wiredNodeLocations[arcData.userId];
    
    if (locationData && locationData.latitude && locationData.longitude) {
      console.log(`📍 Patching location for wired node ${arcData.userId}: ${locationData.latitude}, ${locationData.longitude}`);
      
      // Patch the location data with correct property names
      return {
        ...arcData,
        source_latitude: locationData.latitude,
        source_longitude: locationData.longitude,
        source_country: getCountryFromCoordinates(locationData.latitude, locationData.longitude),
        source_region: getRegionFromCoordinates(locationData.latitude, locationData.longitude),
        location_patched: true,
        original_location: locationData.location
      };
    } else {
      console.log(`⚠️ No location data found for wired node ${arcData.userId} in wiredNodeLocations:`, Object.keys(wiredNodeLocations));
    }
  }
  
  return arcData;
};

// Get country from coordinates (reverse geocoding)
const getCountryFromCoordinates = (lat, lon) => {
  // Simple country mapping based on coordinates from our CSV
  if (lat >= 13.7 && lat <= 13.9 && lon >= 100.5 && lon <= 100.7) return 'TH'; // Bangkok, Thailand
  if (lat >= 41.4 && lat <= 41.6 && lon >= 2.3 && lon <= 2.4) return 'ES'; // Barcelona, Spain
  if (lat >= 4.9 && lat <= 5.0 && lon >= 114.9 && lon <= 115.0) return 'BN'; // Brunei
  if (lat >= 54.6 && lat <= 54.7 && lon >= 1.2 && lon <= 1.3) return 'GB'; // England, UK
  if (lat >= 8.0 && lat <= 8.1 && lon >= 98.8 && lon <= 98.9) return 'TH'; // Thailand (Phuket area)
  
  // Default to unknown if no match
  return 'Unknown';
};

// Get region from coordinates
const getRegionFromCoordinates = (lat, lon) => {
  // Simple region mapping based on our coordinates
  if (lat >= 13.7 && lat <= 13.9 && lon >= 100.5 && lon <= 100.7) return 'AS'; // Bangkok, Asia
  if (lat >= 41.4 && lat <= 41.6 && lon >= 2.3 && lon <= 2.4) return 'EU'; // Barcelona, Europe
  if (lat >= 4.9 && lat <= 5.0 && lon >= 114.9 && lon <= 115.0) return 'AS'; // Brunei, Asia
  if (lat >= 54.6 && lat <= 54.7 && lon >= 1.2 && lon <= 1.3) return 'EU'; // England, Europe
  if (lat >= 8.0 && lat <= 8.1 && lon >= 98.8 && lon <= 98.9) return 'AS'; // Thailand, Asia
  
  return 'Unknown';
};

// Console function to test wired node location patching
window.testWiredNodePatching = () => {
  console.log('🧪 Testing wired node location patching...');
  console.log('📍 Loaded wired node locations:', wiredNodeLocations);
  console.log('📍 Available userIds:', Object.keys(wiredNodeLocations));
  
  // Test with sample wired node data
  const testWiredNode = {
    userId: 'BCN-TEL-01',
    avgTime: '150',
    operator: 'Test Operator',
    network_type: 'wired',
    source_latitude: 0,
    source_longitude: 0,
    source_country: null
  };
  
  console.log('🧪 Testing with sample data:', testWiredNode);
  const patched = patchWiredNodeLocation(testWiredNode);
  console.log('🧪 After patching:', patched);
  
  return { wiredNodeLocations, testResult: patched };
};

// Console function to reload wired node locations
window.reloadWiredNodeLocations = async () => {
  console.log('🔄 Reloading wired node locations...');
  await loadWiredNodeLocations();
  console.log('✅ Wired node locations reloaded');
  return wiredNodeLocations;
};

// Generate dynamic bad actor stories for the news feed
const generateBadActorStories = () => {
  const allArcs = state.flightArcs.concat(state.pendingArcs);
  const stories = [];
  
  // 1. Worst performing operators
  const operatorStats = Object.values(allArcs.reduce((acc, arc) => {
    const key = arc.operator + '_' + arc.source_country;
    if (!acc[key]) acc[key] = {op: arc.operator, country: arc.source_country, latencies: [], routes: 0, issues: 0};
    acc[key].latencies.push(arc.latency || parseFloat(arc.avgTime) || 0);
    acc[key].routes++;
    if ((arc.latency || parseFloat(arc.avgTime) || 0) > 400) acc[key].issues++;
    return acc;
  }, {})).map(o => {
    const avg = o.latencies.length ? Math.round(o.latencies.reduce((a,b) => a+b,0)/o.latencies.length) : 0;
    const compliance = o.routes > 0 ? Math.round(((o.routes - o.issues) / o.routes) * 100) : 0;
    return {op: o.op, country: o.country, avg, compliance, issues: o.issues, routes: o.routes};
  }).filter(o => o.op !== 'Unknown' && o.country !== 'Unknown')
    .sort((a, b) => b.avg - a.avg);
  
  // Top 3 worst operators
  operatorStats.slice(0, 3).forEach((op, index) => {
    const severity = op.avg > 600 ? 'CRITICAL' : op.avg > 500 ? 'SERIOUS' : 'MODERATE';
    const emoji = op.avg > 600 ? '🚨' : op.avg > 500 ? '⚠️' : '🔴';
    stories.push({
      type: 'critical_operator',
      text: `${emoji} ${severity}: ${op.op} in ${getCountryName(op.country)} - ${op.avg}ms avg, ${op.compliance}% compliance`,
      key: `worst_op_${op.op}_${op.country}`
    });
  });
  
  // 2. Countries with digital divide issues
  const countryStats = Object.values(allArcs.reduce((acc, arc) => {
    const country = arc.source_country || 'Unknown';
    if (!acc[country]) acc[country] = {country, latencies: [], operators: new Set(), routes: 0, issues: 0};
    acc[country].latencies.push(arc.latency || parseFloat(arc.avgTime) || 0);
    acc[country].operators.add(arc.operator);
    acc[country].routes++;
    if ((arc.latency || parseFloat(arc.avgTime) || 0) > 400) acc[country].issues++;
    return acc;
  }, {})).map(c => {
    const avg = c.latencies.length ? Math.round(c.latencies.reduce((a,b) => a+b,0)/c.latencies.length) : 0;
    const compliance = c.routes > 0 ? Math.round(((c.routes - c.issues) / c.routes) * 100) : 0;
    return {country: c.country, avg, compliance, issues: c.issues, routes: c.routes, operatorCount: c.operators.size};
  }).filter(c => c.country !== 'Unknown' && c.avg > 300)
    .sort((a, b) => b.avg - a.avg);
  
  // Top 3 worst countries
  countryStats.slice(0, 3).forEach((country, index) => {
    const severity = country.avg > 500 ? 'DIGITAL DIVIDE' : country.avg > 400 ? 'PERFORMANCE ISSUES' : 'CONCERN';
    const emoji = country.avg > 500 ? '🌍' : country.avg > 400 ? '⚠️' : '🔴';
    stories.push({
      type: 'country_issue',
      text: `${emoji} ${severity}: ${getCountryName(country.country)} - ${country.avg}ms avg, ${country.compliance}% compliance, ${country.issues} breaches`,
      key: `worst_country_${country.country}`
    });
  });
  
  // 3. Network type issues
  const networkStats = Object.values(allArcs.reduce((acc, arc) => {
    const type = arc.network_type || 'Unknown';
    if (!acc[type]) acc[type] = {type, latencies: [], routes: 0, issues: 0};
    acc[type].latencies.push(arc.latency || parseFloat(arc.avgTime) || 0);
    acc[type].routes++;
    if ((arc.latency || parseFloat(arc.avgTime) || 0) > 400) acc[type].issues++;
    return acc;
  }, {})).map(n => {
    const avg = n.latencies.length ? Math.round(n.latencies.reduce((a,b) => a+b,0)/n.latencies.length) : 0;
    const compliance = n.routes > 0 ? Math.round(((n.routes - n.issues) / n.routes) * 100) : 0;
    return {type: n.type, avg, compliance, issues: n.issues, routes: n.routes};
  }).filter(n => n.type !== 'Unknown' && n.avg > 300)
    .sort((a, b) => b.avg - a.avg);
  
  // Worst network types
  networkStats.slice(0, 2).forEach((network, index) => {
    const severity = network.avg > 500 ? 'CRITICAL' : network.avg > 400 ? 'SERIOUS' : 'MODERATE';
    const emoji = network.avg > 500 ? '📡' : network.avg > 400 ? '⚠️' : '🔴';
    stories.push({
      type: 'network_issue',
      text: `${emoji} ${severity} ${network.type.toUpperCase()}: ${network.avg}ms avg, ${network.compliance}% compliance, ${network.issues} breaches`,
      key: `worst_network_${network.type}`
    });
  });
  
  // 4. Wired node issues (if any)
  const wiredIssues = allArcs.filter(arc => 
    arc.location_patched && (arc.latency || parseFloat(arc.avgTime) || 0) > 400
  );
  
  if (wiredIssues.length > 0) {
    const wiredAvg = Math.round(wiredIssues.reduce((sum, arc) => sum + (arc.latency || parseFloat(arc.avgTime) || 0), 0) / wiredIssues.length);
    const severity = wiredAvg > 500 ? 'CRITICAL' : wiredAvg > 400 ? 'SERIOUS' : 'MODERATE';
    stories.push({
      type: 'wired_issue',
      text: `🔌 ${severity} WIRED NODES: ${wiredIssues.length} nodes experiencing ${wiredAvg}ms avg latency`,
      key: 'wired_nodes_critical'
    });
  }
  
  // 5. Compliance breach alerts
  const breachAlerts = operatorStats.filter(op => op.compliance < 50 && op.routes > 5);
  breachAlerts.slice(0, 2).forEach((op, index) => {
    stories.push({
      type: 'breach',
      text: `🚨 COMPLIANCE BREACH: ${op.op} in ${getCountryName(op.country)} - ${op.compliance}% compliance, ${op.issues} routes over 400ms`,
      key: `breach_${op.op}_${op.country}`
    });
  });
  
  return stories;
};

// Add bad actor stories to the ticker
const addBadActorStories = () => {
  const stories = generateBadActorStories();
  stories.forEach(story => {
    addToTickerQueue(story.text, story.type);
  });
  console.log(`📰 Added ${stories.length} bad actor stories to news feed`);
};

// Ensure D3 is loaded before creating bubble chart
const ensureD3Loaded = () => {
  return new Promise((resolve, reject) => {
    if (typeof d3 !== 'undefined' && typeof d3.selectAll === 'function') {
      resolve();
      return;
    }
    
    // Wait for D3 to load
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds
    
    const checkD3 = () => {
      attempts++;
      if (typeof d3 !== 'undefined' && typeof d3.selectAll === 'function') {
        console.log('✅ D3 loaded after', attempts * 100, 'ms');
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('D3 failed to load within 5 seconds'));
      } else {
        setTimeout(checkD3, 100);
      }
    };
    
    checkD3();
  });
};

// Create rich D3 bubble chart with bouncing effects and tight packing
const createBubbleChart = async () => {
  try {
    // Wait for D3 to be properly loaded
    await ensureD3Loaded();
    
    console.log('✅ D3 is ready, creating bubble chart...');
  } catch (error) {
    console.error('❌ Failed to load D3:', error);
    alert('D3.js is required for the bubble chart. Please refresh the page.');
    return;
  }

  // Remove existing bubble chart if it exists
  const existingChart = document.getElementById('bubble-chart-container');
  if (existingChart) {
    existingChart.remove();
  }

  // Create container with enhanced styling - much bigger size
  const container = document.createElement('div');
  container.id = 'bubble-chart-container';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1800px;
    height: 1400px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(0, 20, 40, 0.98));
    border: 4px solid #00e5ff;
    border-radius: 20px;
    z-index: 1000;
    padding: 40px;
    color: white;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 229, 255, 0.3);
    backdrop-filter: blur(10px);
  `;

  // Add enhanced header
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <div>
        <h2 style="margin: 0; color: #00e5ff; font-size: 28px; text-shadow: 0 0 15px rgba(0, 229, 255, 0.7); font-weight: bold;">
          🌍 Global Performance Bubble Map
        </h2>
        <p style="margin: 5px 0 0 0; color: #ccc; font-size: 14px; opacity: 0.8;">
          Interactive visualization of network performance across operators and countries
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="view-toggle-btn" onclick="toggleBubbleView()" 
                style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
          🌍 Countries View
        </button>
        <button onclick="document.getElementById('bubble-chart-container').remove()" 
                style="background: linear-gradient(45deg, #ff4444, #cc0000); color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4); transition: all 0.3s ease;">
          ✕ Close
        </button>
        <button onclick="resetBubbleZoom()" 
                style="background: linear-gradient(45deg, #00e5ff, #0088cc); color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 6px 20px rgba(0, 229, 255, 0.4); transition: all 0.3s ease;">
          🔍 Reset Zoom
        </button>
      </div>
    </div>
    <div style="margin-bottom: 25px; font-size: 15px; color: #ccc; line-height: 1.6; background: rgba(0, 229, 255, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #00e5ff;">
      💡 <strong>Bubble Size:</strong> Bigger = More problems (worse performance, lower compliance, more high-latency routes)<br>
      💡 <strong>Bubble Color:</strong> Red = Bad, Orange = Fair, Green = Good performance<br>
      💡 <strong>Scoring:</strong> Based on latency tiers, compliance rate, and high-latency penalties<br>
      💡 <strong>3D Effects:</strong> Professional depth with highlights and shadows<br>
      💡 <strong>Zoom:</strong> Mouse wheel to zoom, drag to pan, double-click to reset<br>
      💡 <strong>Interactive:</strong> Hover for details, click for analysis
    </div>
  `;
  container.appendChild(header);

  // Create SVG container with enhanced styling using D3 - much bigger size
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '1720')
    .attr('height', '1320')
    .style('background', 'radial-gradient(circle at center, rgba(0, 0, 0, 0.6), rgba(0, 20, 40, 0.8))')
    .style('border-radius', '15px')
    .style('border', '2px solid rgba(0, 229, 255, 0.4)')
    .style('box-shadow', 'inset 0 0 30px rgba(0, 229, 255, 0.1)');

  // Add zoom functionality with proper group handling
  const zoom = d3.zoom()
    .scaleExtent([0.3, 5]) // Allow zoom from 30% to 500%
    .on('zoom', (event) => {
      // Apply transform to a container group instead of individual bubbles
      const container = svg.select('g.zoom-container');
      if (container.empty()) {
        // Create container if it doesn't exist
        svg.append('g').attr('class', 'zoom-container');
      }
      svg.select('g.zoom-container').attr('transform', event.transform);
    });

  // Apply zoom to the SVG
  svg.call(zoom);
  
  // Add double-click to reset zoom
  svg.on('dblclick', () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  });

  // Store zoom reference globally for reset function
  window.bubbleChartZoom = zoom;

  document.body.appendChild(container);

  // Generate comprehensive bubble data and store globally
  const bubbleData = generateComprehensiveBubbleData();
  window.bubbleChartState.allData = bubbleData;
  
  if (bubbleData.length === 0) {
    svg.append('text')
      .attr('x', '570')
      .attr('y', '390')
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccc')
      .attr('font-size', '20')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-weight', 'bold')
      .text('No performance data available for bubble chart');
    
    svg.append('text')
      .attr('x', '570')
      .attr('y', '420')
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '14')
      .attr('font-family', 'Arial, sans-serif')
      .text('Please wait for data to load or check your connection');
    return;
  }

  try {
    console.log('🎨 Starting D3 bubble chart creation...');
    console.log('📊 Bubble data:', bubbleData.length, 'items');
    
    // Store SVG reference globally
    window.bubbleChartState.svg = svg;
    
    // Create initial bubbles (countries view by default)
    const countriesData = bubbleData.filter(d => d.type === 'country');
    createBubbles(svg, countriesData, 'countries');

    // Enhanced legend with better styling
    const legend = svg.append('g').attr('transform', 'translate(40, 40)');
    
    // Type legend
    legend.append('circle').attr('r', 12).attr('fill', '#ff6b6b').attr('cx', 0).attr('cy', 0);
    legend.append('text').text('Operators').attr('x', 25).attr('y', 6).attr('fill', 'white').attr('font-size', '15px').attr('font-weight', 'bold');
    
    legend.append('circle').attr('r', 12).attr('fill', '#4ecdc4').attr('cx', 0).attr('cy', 35);
    legend.append('text').text('Countries').attr('x', 25).attr('y', 41).attr('fill', 'white').attr('font-size', '15px').attr('font-weight', 'bold');

    // Problem Score legend with enhanced styling
    const perfLegend = svg.append('g').attr('transform', 'translate(40, 100)');
    perfLegend.append('text').text('Performance Score Scale:').attr('fill', 'white').attr('font-size', '15px').attr('y', 0).attr('font-weight', 'bold');
    
    const perfColors = ['#44ff44', '#ffaa00', '#ff1744'];
    const perfLabels = ['Excellent (≤200ms)', 'Good (≤400ms)', 'Poor (>400ms)'];
    
    perfColors.forEach((color, i) => {
      perfLegend.append('circle').attr('r', 10).attr('fill', color).attr('cx', i * 120).attr('cy', 25);
      perfLegend.append('text').text(perfLabels[i]).attr('x', i * 120 + 20).attr('y', 30).attr('fill', 'white').attr('font-size', '11px').attr('font-weight', 'bold');
    });

    // Size legend
    const sizeLegend = svg.append('g').attr('transform', 'translate(40, 160)');
    sizeLegend.append('text').text('Bubble Size = Problem Level:').attr('fill', 'white').attr('font-size', '15px').attr('y', 0).attr('font-weight', 'bold');
    
    const sizes = [15, 25, 35];
    const sizeLabels = ['Small = Good Performance', 'Medium = Some Issues', 'Big = Poor Performance'];
    
    sizes.forEach((size, i) => {
      sizeLegend.append('circle').attr('r', size).attr('fill', 'rgba(255,255,255,0.3)').attr('cx', i * 140).attr('cy', 25);
      sizeLegend.append('text').text(sizeLabels[i]).attr('x', i * 140).attr('y', 50).attr('fill', 'white').attr('font-size', '11px').attr('text-anchor', 'middle');
    });
    
    // Scoring methodology legend
    const scoringLegend = svg.append('g').attr('transform', 'translate(40, 220)');
    scoringLegend.append('text').text('Scoring Methodology:').attr('fill', 'white').attr('font-size', '15px').attr('y', 0).attr('font-weight', 'bold');
    
    const scoringItems = [
      '• Latency Score: ≤200ms=100, ≤300ms=80, ≤400ms=60, ≤500ms=40, >500ms=20',
      '• Compliance: Direct percentage of routes under 400ms',
      '• Penalties: -5 points per route over 400ms (max -30)',
      '• Problem Score: Inverted performance + penalties + issues'
    ];
    
    scoringItems.forEach((item, i) => {
      scoringLegend.append('text')
        .text(item)
        .attr('x', 0)
        .attr('y', 25 + (i * 15))
        .attr('fill', '#ccc')
        .attr('font-size', '10px');
    });

    // Add animation controls
    const controls = svg.append('g').attr('transform', `translate(1520, 40)`);
    
    controls.append('text')
      .text('Interactive Controls:')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('y', 0);
    
    controls.append('text')
      .text('• Mouse wheel: Zoom in/out')
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .attr('y', 25);
    
    controls.append('text')
      .text('• Drag: Pan around')
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .attr('y', 40);
    
    controls.append('text')
      .text('• Double-click: Reset zoom')
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .attr('y', 55);
    
    controls.append('text')
      .text('• Hover: Show details')
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .attr('y', 70);

    console.log('✅ Rich D3 Bubble chart created successfully with', bubbleData.length, 'bubbles');
    console.log('🎯 Features: 3D effects, problem-based sizing, zoom controls, enhanced interactions');
  } catch (error) {
    console.error('❌ Error creating bubble chart:', error);
    alert('Failed to create bubble chart. Please refresh the page and try again.');
  }
};

// Global state for bubble chart view
window.bubbleChartState = {
  currentView: 'countries', // 'countries' or 'operators'
  allData: null,
  svg: null,
  zoom: null
};

// Toggle between countries and operators view
window.toggleBubbleView = function() {
  const state = window.bubbleChartState;
  const toggleBtn = document.getElementById('view-toggle-btn');
  
  if (state.currentView === 'countries') {
    state.currentView = 'operators';
    toggleBtn.innerHTML = '🏢 Operators View';
    toggleBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
    renderBubbleChart('operators');
  } else {
    state.currentView = 'countries';
    toggleBtn.innerHTML = '🌍 Countries View';
    toggleBtn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
    renderBubbleChart('countries');
  }
};

// Reset zoom function
window.resetBubbleZoom = function() {
  const svg = d3.select('#bubble-chart-container svg');
  if (svg.size() > 0 && window.bubbleChartZoom) {
    svg.transition().duration(750).call(window.bubbleChartZoom.transform, d3.zoomIdentity);
  }
};

// Render bubble chart with specified view
function renderBubbleChart(viewType) {
  const svg = d3.select('#bubble-chart-container svg');
  if (svg.size() === 0) return;
  
  // Stop existing simulation
  if (window.bubbleChartState.currentSimulation) {
    window.bubbleChartState.currentSimulation.stop();
  }
  
  // Clear existing bubbles
  svg.selectAll('g.bubble').remove();
  
  // Get filtered data based on view type
  const allData = window.bubbleChartState.allData || generateComprehensiveBubbleData();
  console.log('🔍 All bubble data:', allData);
  console.log('🔍 View type:', viewType);
  
  const filteredData = allData.filter(d => {
    if (viewType === 'countries') return d.type === 'country';
    if (viewType === 'operators') return d.type === 'operator';
    return false;
  });
  
  console.log('🔍 Filtered data:', filteredData);
  
  if (filteredData.length === 0) {
    svg.append('text')
      .attr('x', '860')
      .attr('y', '660')
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccc')
      .attr('font-size', '20')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-weight', 'bold')
      .text(`No ${viewType} data available`);
    return;
  }
  
  // Re-render bubbles with new data
  createBubbles(svg, filteredData, viewType);
};

// Create bubbles with enhanced styling and country flags for operators
function createBubbles(svg, bubbleData, viewType) {
  const width = 1720;
  const height = 1320;

  // Create enhanced color scales
  const typeColorScale = d3.scaleOrdinal()
    .domain(['operator', 'country'])
    .range(['#ff6b6b', '#4ecdc4']);

  // Enhanced size scale using problem scores
  const maxProblemScore = Math.max(...bubbleData.map(d => d.problemScore));
  const minProblemScore = Math.min(...bubbleData.map(d => d.problemScore));
  const sizeScale = d3.scaleSqrt()
    .domain([minProblemScore, maxProblemScore])
    .range([30, 150]);

  // Enhanced performance color scale
  const performanceScale = d3.scaleLinear()
    .domain([minProblemScore, (minProblemScore + maxProblemScore) / 2, maxProblemScore])
    .range(['#44ff44', '#ffaa00', '#ff1744']);

  // Create enhanced force simulation
  const simulation = d3.forceSimulation(bubbleData)
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => sizeScale(d.problemScore) + 15).strength(0.9))
    .force('x', d3.forceX(width / 2).strength(0.02))
    .force('y', d3.forceY(height / 2).strength(0.02))
    .alphaDecay(0.015)
    .velocityDecay(0.25);

  // Create or get zoom container
  let zoomContainer = svg.select('g.zoom-container');
  if (zoomContainer.empty()) {
    zoomContainer = svg.append('g').attr('class', 'zoom-container');
  }

  // Create bubble groups inside zoom container
  const bubbles = zoomContainer.selectAll('g.bubble')
    .data(bubbleData)
    .enter()
    .append('g')
    .attr('class', 'bubble')
    .attr('transform', d => `translate(${d.x || width/2}, ${d.y || height/2})`)
    .style('cursor', 'pointer');

  // Add 3D bubble circles
  bubbles.append('circle')
    .attr('r', d => sizeScale(d.problemScore))
    .attr('fill', d => performanceScale(d.problemScore))
    .attr('opacity', 0.9)
    .attr('stroke', d => typeColorScale(d.type))
    .attr('stroke-width', 3)
    .style('filter', 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))')
    .style('transition', 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)');

  // Add 3D highlight effect
  bubbles.append('circle')
    .attr('r', d => sizeScale(d.problemScore) * 0.3)
    .attr('fill', 'rgba(255, 255, 255, 0.4)')
    .attr('cx', d => -sizeScale(d.problemScore) * 0.2)
    .attr('cy', d => -sizeScale(d.problemScore) * 0.2)
    .style('filter', 'blur(1px)');

  // Add inner glow effect
  bubbles.append('circle')
    .attr('r', d => sizeScale(d.problemScore) * 0.8)
    .attr('fill', 'none')
    .attr('stroke', d => performanceScale(d.problemScore))
    .attr('stroke-width', 2)
    .attr('opacity', 0.4)
    .style('filter', 'blur(3px)');

  // Add labels with country info for operators
  bubbles.append('text')
    .text(d => {
      if (d.type === 'operator' && d.countryCode && d.countryCode !== 'Unknown') {
        return `${d.name} (${d.countryCode})`;
      }
      return d.name.length > 15 ? d.name.substring(0, 13) + '...' : d.name;
    })
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', 'white')
    .attr('font-size', d => Math.max(12, Math.min(20, sizeScale(d.problemScore) / 7)))
    .attr('font-weight', 'bold')
    .attr('font-family', 'Arial, sans-serif')
    .style('text-shadow', '2px 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)')
    .style('pointer-events', 'none');

  // Add problem score indicators
  bubbles.append('text')
    .text(d => `Problem: ${Math.round(d.problemScore)}`)
    .attr('text-anchor', 'middle')
    .attr('dy', d => sizeScale(d.problemScore) + 30)
    .attr('fill', d => performanceScale(d.problemScore))
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .style('text-shadow', '1px 1px 3px rgba(0,0,0,0.8)')
    .style('pointer-events', 'none');

  // Add performance details
  bubbles.append('text')
    .text(d => `${d.avgLatency}ms`)
    .attr('text-anchor', 'middle')
    .attr('dy', d => sizeScale(d.problemScore) + 45)
    .attr('fill', '#ccc')
    .attr('font-size', '11px')
    .style('text-shadow', '1px 1px 3px rgba(0,0,0,0.8)')
    .style('pointer-events', 'none');

  // Enhanced hover effects
  bubbles.on('mouseover', function(event, d) {
    const bubble = d3.select(this);
    
    bubble.select('circle')
      .transition()
      .duration(400)
      .ease(d3.easeElasticOut)
      .attr('r', sizeScale(d.problemScore) * 1.4)
      .attr('opacity', 1)
      .style('filter', 'drop-shadow(0 12px 24px rgba(0,0,0,0.7))');
    
    bubble.select('circle:last-child')
      .transition()
      .duration(400)
      .attr('opacity', 0.4);
    
    // Show enhanced tooltip
    const tooltip = svg.append('g')
      .attr('class', 'tooltip')
      .attr('transform', `translate(${Math.min(event.pageX + 20, width - 280)}, ${Math.max(event.pageY - 20, 20)})`);
    
    tooltip.append('rect')
      .attr('width', 280)
      .attr('height', 120)
      .attr('fill', 'rgba(0,0,0,0.95)')
      .attr('rx', 12)
      .attr('stroke', performanceScale(d.problemScore))
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))');
    
    tooltip.append('text')
      .attr('x', 20)
      .attr('y', 30)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '16px')
      .text(`${d.name} (${d.type})`);
    
    tooltip.append('text')
      .attr('x', 20)
      .attr('y', 55)
      .attr('fill', performanceScale(d.problemScore))
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(`Problem Score: ${Math.round(d.problemScore)} | Performance: ${d.overallScore} | Avg Latency: ${d.avgLatency}ms`);
    
    tooltip.append('text')
      .attr('x', 20)
      .attr('y', 75)
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .text(`High Latency Routes: ${d.highLatencyRoutes || 0} | Issues: ${d.issues} | Routes: ${d.routes} | Compliance: ${d.complianceRate}%`);
    
    if (d.type === 'operator' && d.countryCode) {
      tooltip.append('text')
        .attr('x', 20)
        .attr('y', 95)
        .attr('fill', '#aaa')
        .attr('font-size', '11px')
        .text(`Country: ${d.countryCode} | Users: ${d.userCount}`);
    }
  });

  bubbles.on('mouseout', function(event, d) {
    const bubble = d3.select(this);
    
    bubble.select('circle')
      .transition()
      .duration(400)
      .ease(d3.easeElasticOut)
      .attr('r', sizeScale(d.problemScore))
      .attr('opacity', 0.9)
      .style('filter', 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))');
    
    bubble.select('circle:last-child')
      .transition()
      .duration(400)
      .attr('opacity', 0.4);
    
    svg.selectAll('.tooltip').remove();
  });

  // Add click event for drill-down functionality
  bubbles.on('click', function(event, d) {
    event.stopPropagation();
    console.log('🔍 Bubble clicked:', d);
    
    if (d.type === 'country') {
      showCountryDrillDown(d);
    } else if (d.type === 'operator') {
      showOperatorDetails(d);
    }
  });

  // Update positions on simulation tick
  simulation.on('tick', () => {
    bubbles.attr('transform', d => `translate(${d.x}, ${d.y})`);
  });

  // Store simulation reference for cleanup
  window.bubbleChartState.currentSimulation = simulation;
};



// Generate comprehensive bubble data using benchmarking scores
const generateComprehensiveBubbleData = () => {
  const allArcs = state.flightArcs.concat(state.pendingArcs);
  const bubbleData = [];

  // Process operators with comprehensive scoring (filter out Unknown)
  const operatorStats = {};
  allArcs.forEach(arc => {
    const key = arc.operator || 'Unknown';
    // Skip Unknown operators
    if (key === 'Unknown' || key === 'unknown') return;
    
    if (!operatorStats[key]) {
      operatorStats[key] = {
        name: key,
        type: 'operator',
        country: arc.source_country || 'Unknown',
        countryCode: arc.source_country || 'Unknown',
        latencies: [],
        issues: 0,
        routes: 0,
        userCount: new Set(),
        routeTypes: new Set()
      };
    }
    const latency = parseFloat(arc.avgTime) || 0;
    operatorStats[key].latencies.push(latency);
    operatorStats[key].routes++;
    operatorStats[key].userCount.add(arc.userId);
    operatorStats[key].routeTypes.add(arc.network_type);
    if (latency > 400) operatorStats[key].issues++;
  });

  // Process countries with comprehensive scoring (filter out Unknown)
  const countryStats = {};
  allArcs.forEach(arc => {
    const key = arc.source_country || 'Unknown';
    // Skip Unknown countries
    if (key === 'Unknown' || key === 'unknown') return;
    
    if (!countryStats[key]) {
      countryStats[key] = {
        name: key,
        type: 'country',
        latencies: [],
        issues: 0,
        routes: 0,
        operators: new Set(),
        userCount: new Set()
      };
    }
    const latency = parseFloat(arc.avgTime) || 0;
    countryStats[key].latencies.push(latency);
    countryStats[key].routes++;
    countryStats[key].operators.add(arc.operator);
    countryStats[key].userCount.add(arc.userId);
    if (latency > 400) countryStats[key].issues++;
  });

  // Calculate comprehensive scores for operators using benchmark methodology
  console.log('🔍 Processing operators:', Object.keys(operatorStats));
  Object.values(operatorStats).forEach(op => {
    console.log('🔍 Operator:', op.name, 'routes:', op.routes);
    if (op.routes >= 2) { // Include more operators
      const avgLatency = op.latencies.reduce((a, b) => a + b, 0) / op.latencies.length;
      const complianceRate = op.routes > 0 ? ((op.routes - op.issues) / op.routes) * 100 : 0;
      
      // Calculate confidence weight based on data quality
      const confidenceWeight = Math.min(op.routes / 5, 1); // Max weight of 1 for 5+ routes
      
      // Enhanced scoring system matching benchmark methodology
      let latencyScore = 0;
      if (avgLatency <= 200) latencyScore = 100;
      else if (avgLatency <= 300) latencyScore = 80;
      else if (avgLatency <= 400) latencyScore = 60;
      else if (avgLatency <= 500) latencyScore = 40;
      else latencyScore = 20;
      
      // Compliance score (direct percentage)
      const complianceScore = complianceRate;
      
      // Calculate high latency penalty (routes over 400ms)
      const highLatencyRoutes = op.latencies.filter(l => l > 400).length;
      const highLatencyPenalty = Math.min(highLatencyRoutes * 5, 30); // Max 30 point penalty
      
      // Overall score with confidence weighting and penalties
      const overallScore = Math.round(
        ((latencyScore * 0.6 + complianceScore * 0.4) - highLatencyPenalty) * confidenceWeight
      );
      
      // Calculate problem score (inverted - worse performance = bigger bubbles)
      const problemScore = Math.max(0, 100 - overallScore + (op.issues * 15) + ((100 - complianceRate) * 3) + (highLatencyRoutes * 8));
      
      bubbleData.push({
        name: op.name,
        type: 'operator',
        country: op.country,
        countryCode: op.countryCode,
        avgLatency: Math.round(avgLatency),
        issues: op.issues,
        routes: op.routes,
        complianceRate: Math.round(complianceRate),
        overallScore: Math.max(0, overallScore),
        problemScore: problemScore,
        highLatencyRoutes: highLatencyRoutes,
        userCount: op.userCount.size,
        routeTypes: op.routeTypes.size
      });
    }
  });

  // Calculate comprehensive scores for countries using benchmark methodology
  console.log('🔍 Processing countries:', Object.keys(countryStats));
  Object.values(countryStats).forEach(country => {
    console.log('🔍 Country:', country.name, 'routes:', country.routes);
    if (country.routes >= 3) { // Include more countries
      const avgLatency = country.latencies.reduce((a, b) => a + b, 0) / country.latencies.length;
      const complianceRate = country.routes > 0 ? ((country.routes - country.issues) / country.routes) * 100 : 0;
      
      // Calculate confidence weight
      const confidenceWeight = Math.min(country.routes / 10, 1);
      
      // Enhanced scoring system matching benchmark methodology
      let latencyScore = 0;
      if (avgLatency <= 200) latencyScore = 100;
      else if (avgLatency <= 300) latencyScore = 80;
      else if (avgLatency <= 400) latencyScore = 60;
      else if (avgLatency <= 500) latencyScore = 40;
      else latencyScore = 20;
      
      // Compliance score (direct percentage)
      const complianceScore = complianceRate;
      
      // Calculate high latency penalty (routes over 400ms)
      const highLatencyRoutes = country.latencies.filter(l => l > 400).length;
      const highLatencyPenalty = Math.min(highLatencyRoutes * 5, 30); // Max 30 point penalty
      
      // Overall score with confidence weighting and penalties
      const overallScore = Math.round(
        ((latencyScore * 0.6 + complianceScore * 0.4) - highLatencyPenalty) * confidenceWeight
      );
      
      // Calculate problem score (inverted - worse performance = bigger bubbles)
      const problemScore = Math.max(0, 100 - overallScore + (country.issues * 15) + ((100 - complianceRate) * 3) + (highLatencyRoutes * 8));
      
      bubbleData.push({
        name: country.name,
        type: 'country',
        avgLatency: Math.round(avgLatency),
        issues: country.issues,
        routes: country.routes,
        complianceRate: Math.round(complianceRate),
        overallScore: Math.max(0, overallScore),
        problemScore: problemScore,
        highLatencyRoutes: highLatencyRoutes,
        operatorCount: country.operators.size,
        userCount: country.userCount.size
      });
    }
  });

  // Sort by overall score (worst first for bubble sizing)
  bubbleData.sort((a, b) => a.overallScore - b.overallScore);

  console.log('📊 Generated bubble data:', bubbleData.length, 'items');
  console.log('📊 Countries in data:', bubbleData.filter(d => d.type === 'country').length);
  console.log('📊 Operators in data:', bubbleData.filter(d => d.type === 'operator').length);
  console.log('📊 Score range:', Math.min(...bubbleData.map(d => d.overallScore)), 'to', Math.max(...bubbleData.map(d => d.overallScore)));
  
  return bubbleData;
};

// Add bubble chart button
const addBubbleChartButton = () => {
  const button = document.createElement('button');
  button.innerHTML = '🌊 Bubble Chart';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    left: 380px;
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
  `;
  
  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
  };
  
  button.onclick = async () => {
    try {
      await createBubbleChart();
    } catch (error) {
      console.error('❌ Error creating bubble chart:', error);
      alert('Failed to create bubble chart. Please try again.');
    }
  };
  
  document.body.appendChild(button);
};

// Initialize UI buttons after all functions are defined
console.log('🔧 Adding UI buttons...');
try {
  addComplianceModeButton();
  console.log('✅ Compliance button added');
} catch (error) {
  console.error('❌ Error adding compliance button:', error);
}

try {
  addBubbleChartButton();
  console.log('✅ Bubble chart button added');
} catch (error) {
  console.error('❌ Error adding bubble chart button:', error);
}

// Also add D3 benchmark tables creation
try {
  createD3BenchmarkTables();
  console.log('✅ D3 benchmark tables created');
} catch (error) {
  console.error('❌ Error creating D3 benchmark tables:', error);
}