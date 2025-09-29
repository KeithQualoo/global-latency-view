import { CONFIG, continentCodeToName, customRegionMap, oceaniaCountryMap } from './config.js';

// Utility Functions
export const getLatencyColor = (ms) => {
  const thresholds = CONFIG.latencyThresholds;
  const colors = CONFIG.colors;
  if (ms < thresholds.excellent) return colors.excellent;
  if (ms < thresholds.good) return colors.good;
  if (ms < thresholds.average) return colors.average;
  if (ms < thresholds.poor) return colors.poor;
  if (ms < thresholds.bad) return colors.bad;
  return colors.terrible;
};

export const latLongToVector3 = (lat, lon, radius = CONFIG.radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

export const getCountryName = (code) => {
  return countryCodeToName[code] || code || 'Unknown';
};

export const getOperator = (item, opts = {}) => {
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
  if (netType === 'mobile' && op) return op;
  if ((netType === 'wifi' || netType === 'wired') && org) return org;
  return op || org || 'Unknown';
};

export const regionCodeFromName = (name) => {
  for (const [code, full] of Object.entries(continentCodeToName)) {
    if (full === name) return code;
  }
  if (name === 'Middle East') return 'ME';
  if (name === 'Oceania') return 'OC';
  return name.slice(0, 2).toUpperCase();
};

export const getFilterKey = (filters) => {
  return JSON.stringify(filters || {});
};

export const createCircleTexture = (size = 32) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// Country code to name mapping
export const countryCodeToName = {
  "AD": "Andorra", "AE": "United Arab Emirates", "AF": "Afghanistan", "AG": "Antigua and Barbuda",
  "AI": "Anguilla", "AL": "Albania", "AM": "Armenia", "AO": "Angola", "AQ": "Antarctica",
  "AR": "Argentina", "AS": "American Samoa", "AT": "Austria", "AU": "Australia", "AW": "Aruba",
  "AX": "Åland Islands", "AZ": "Azerbaijan", "BA": "Bosnia and Herzegovina", "BB": "Barbados",
  "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria", "BH": "Bahrain",
  "BI": "Burundi", "BJ": "Benin", "BL": "Saint Barthélemy", "BM": "Bermuda", "BN": "Brunei Darussalam",
  "BO": "Bolivia, Plurinational State of", "BQ": "Bonaire, Sint Eustatius and Saba", "BR": "Brazil",
  "BS": "Bahamas", "BT": "Bhutan", "BV": "Bouvet Island", "BW": "Botswana", "BY": "Belarus",
  "BZ": "Belize", "CA": "Canada", "CC": "Cocos (Keeling) Islands", "CD": "Congo, Democratic Republic of the",
  "CF": "Central African Republic", "CG": "Congo", "CH": "Switzerland", "CI": "Côte d'Ivoire",
  "CK": "Cook Islands", "CL": "Chile", "CM": "Cameroon", "CN": "China", "CO": "Colombia",
  "CR": "Costa Rica", "CU": "Cuba", "CV": "Cabo Verde", "CW": "Curaçao", "CX": "Christmas Island",
  "CY": "Cyprus", "CZ": "Czechia", "DE": "Germany", "DJ": "Djibouti", "DK": "Denmark",
  "DM": "Dominica", "DO": "Dominican Republic", "DZ": "Algeria", "EC": "Ecuador", "EE": "Estonia",
  "EG": "Egypt", "EH": "Western Sahara", "ER": "Eritrea", "ES": "Spain", "ET": "Ethiopia",
  "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands (Malvinas)", "FM": "Micronesia, Federated States of",
  "FO": "Faroe Islands", "FR": "France", "GA": "Gabon", "GB": "United Kingdom of Great Britain and Northern Ireland",
  "GD": "Grenada", "GE": "Georgia", "GF": "French Guiana", "GG": "Guernsey", "GH": "Ghana",
  "GI": "Gibraltar", "GL": "Greenland", "GM": "Gambia", "GN": "Guinea", "GP": "Guadeloupe",
  "GQ": "Equatorial Guinea", "GR": "Greece", "GS": "South Georgia and the South Sandwich Islands",
  "GT": "Guatemala", "GU": "Guam", "GW": "Guinea-Bissau", "GY": "Guyana", "HK": "Hong Kong",
  "HM": "Heard Island and McDonald Islands", "HN": "Honduras", "HR": "Croatia", "HT": "Haiti",
  "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IM": "Isle of Man",
  "IN": "India", "IO": "British Indian Ocean Territory", "IQ": "Iraq", "IR": "Iran, Islamic Republic of",
  "IS": "Iceland", "IT": "Italy", "JE": "Jersey", "JM": "Jamaica", "JO": "Jordan", "JP": "Japan",
  "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia", "KI": "Kiribati", "KM": "Comoros",
  "KN": "Saint Kitts and Nevis", "KP": "Korea, Democratic People's Republic of", "KR": "Korea, Republic of",
  "KW": "Kuwait", "KY": "Cayman Islands", "KZ": "Kazakhstan", "LA": "Lao People's Democratic Republic",
  "LB": "Lebanon", "LC": "Saint Lucia", "LI": "Liechtenstein", "LK": "Sri Lanka", "LR": "Liberia",
  "LS": "Lesotho", "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "LY": "Libya",
  "MA": "Morocco", "MC": "Monaco", "MD": "Moldova, Republic of", "ME": "Montenegro",
  "MF": "Saint Martin (French part)", "MG": "Madagascar", "MH": "Marshall Islands",
  "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar", "MN": "Mongolia", "MO": "Macao",
  "MP": "Northern Mariana Islands", "MQ": "Martinique", "MR": "Mauritania", "MS": "Montserrat",
  "MT": "Malta", "MU": "Mauritius", "MV": "Maldives", "MW": "Malawi", "MX": "Mexico",
  "MY": "Malaysia", "MZ": "Mozambique", "NA": "Namibia", "NC": "New Caledonia", "NE": "Niger",
  "NF": "Norfolk Island", "NG": "Nigeria", "NI": "Nicaragua", "NL": "Netherlands, Kingdom of the",
  "NO": "Norway", "NP": "Nepal", "NR": "Nauru", "NU": "Niue", "NZ": "New Zealand", "OM": "Oman",
  "PA": "Panama", "PE": "Peru", "PF": "French Polynesia", "PG": "Papua New Guinea", "PH": "Philippines",
  "PK": "Pakistan", "PL": "Poland", "PM": "Saint Pierre and Miquelon", "PN": "Pitcairn",
  "PR": "Puerto Rico", "PS": "Palestine, State of", "PT": "Portugal", "PW": "Palau", "PY": "Paraguay",
  "QA": "Qatar", "RE": "Réunion", "RO": "Romania", "RS": "Serbia", "RU": "Russian Federation",
  "RW": "Rwanda", "SA": "Saudi Arabia", "SB": "Solomon Islands", "SC": "Seychelles", "SD": "Sudan",
  "SE": "Sweden", "SG": "Singapore", "SH": "Saint Helena, Ascension and Tristan da Cunha",
  "SI": "Slovenia", "SJ": "Svalbard and Jan Mayen", "SK": "Slovakia", "SL": "Sierra Leone",
  "SM": "San Marino", "SN": "Senegal", "SO": "Somalia", "SR": "Suriname", "SS": "South Sudan",
  "ST": "Sao Tome and Principe", "SV": "El Salvador", "SX": "Sint Maarten (Dutch part)",
  "SY": "Syrian Arab Republic", "SZ": "Eswatini", "TC": "Turks and Caicos Islands", "TD": "Chad",
  "TF": "French Southern Territories", "TG": "Togo", "TH": "Thailand", "TJ": "Tajikistan",
  "TK": "Tokelau", "TL": "Timor-Leste", "TM": "Turkmenistan", "TN": "Tunisia", "TO": "Tonga",
  "TR": "Türkiye", "TT": "Trinidad and Tobago", "TV": "Tuvalu", "TW": "Taiwan, Province of China",
  "TZ": "Tanzania, United Republic of", "UA": "Ukraine", "UG": "Uganda", "UM": "United States Minor Outlying Islands",
  "US": "United States of America", "UY": "Uruguay", "UZ": "Uzbekistan", "VA": "Holy See",
  "VC": "Saint Vincent and the Grenadines", "VE": "Venezuela, Bolivarian Republic of",
  "VG": "Virgin Islands (British)", "VI": "Virgin Islands (U.S.)", "VN": "Viet Nam", "VU": "Vanuatu",
  "WF": "Wallis and Futuna", "WS": "Samoa", "YE": "Yemen", "YT": "Mayotte", "ZA": "South Africa",
  "ZM": "Zambia", "ZW": "Zimbabwe"
}; 