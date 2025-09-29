// Import all modules
import { CONFIG, OPENAI_API_KEY, TTS_PRIORITY, MIN_TTS_INTERVAL, POST_TTS_COOLDOWN } from './config.js';
import { state, audioContext, analyser, microphone, audioDetectionEnabled, isOtherAudioPlaying, audioCheckInterval, grokDetectionEnabled, lastGrokDetection, GROK_COOLDOWN, ttsQueue, ttsSpeaking, lastTTSFinishTime, tickerQueue, tickerAnimId, lastProcessedTimestamp, lastHudStats, lastTickerStatsString } from './state.js';
import { getLatencyColor, latLongToVector3, getCountryName, getOperator, regionCodeFromName, getFilterKey, createCircleTexture, countryCodeToName } from './utils.js';
import { initThreeJS, onWindowResize, toggleDayNight, createGlobe, createAnimatedArc, animateArcs } from './three-core.js';

// Import Three.js
import * as THREE from './node_modules/three/build/three.module.js';

if (typeof THREE === 'undefined') {
  throw new Error('Three.js is not loaded. Please check the imports.');
}

console.log('Three.js version:', THREE.REVISION);

// Error handling and UI utilities
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

// Data fetching and processing
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
      option.value = value;
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

// Data processing functions
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

// Data fetching
const fetchAllData = async (filters = {}) => {
  const filterKey = getFilterKey(filters);
  state.activeFilterKey = filterKey;
  console.log('🌍 Fetching all latency data for last hour with filters:', filters);
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
        allData.push(...filteredData);
        state.pendingArcs.push(...filteredData);
        cursor = pagination.nextCursor;
        hasMore = pagination.hasMore;
        pageCount++;
        console.log(`📥 Stats page ${pageCount}: ${data.length} arcs (Filtered to ${filteredData.length}, Total collected: ${allData.length})`);
        
        if (pageCount === 1) {
          console.log('🎤 Triggering initial news update with first batch of data');
          setTimeout(() => triggerNewsUpdate(), 1000);
        }
      } else {
        hasMore = false;
        console.log('⚠️ No data returned from API - database may be empty or API endpoint issue');
        
        if (pageCount === 0) {
          console.log('🚨 No data available in database - this could indicate:');
          console.log('   1. Database is empty (no tests have been run)');
          console.log('   2. API endpoint is not working correctly');
          console.log('   3. Database connection issues');
          console.log('   4. Time range filters are too restrictive');
          
          setTimeout(() => {
            speakQueued('No test data available. System ready for real-time monitoring.');
          }, 1000);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (state.activeFilterKey !== filterKey) {
      console.log('Filter changed, aborting fetchAllData (after fetch)');
      return;
    }

    state.allDataForStats = allData;
    console.log(`📊 Total data fetched for stats: ${allData.length} rows`);
    processDataForStatistics(allData);
    console.log(`🎬 Queued ${state.pendingArcs.length} arcs for animation`);
    console.log('✅ Data fetching complete - stats updated, animation queued');
    updateTickerWithSummaries();
    
    console.log('🎤 Triggering news update after data load complete');
    setTimeout(() => {
      triggerNewsUpdate();
      setTimeout(() => addBadActorStories(), 3000);
    }, 2000);
  } catch (error) {
    console.error('❌ Fetch error:', error);
    showError(`Data fetching failed: ${error.message}`);
  } finally {
    state.isFetching = false;
  }
};

// Statistics processing
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

// UI functions
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

const toggleCountries = () => {
  state.showCountries = !state.showCountries;
  if (state.countryGroup) {
    state.countryGroup.visible = state.showCountries;
  }
  console.log('Countries visibility toggled:', state.showCountries);
};

const toggleComplianceView = () => {
  state.complianceMode = !state.complianceMode;
  console.log('Compliance mode toggled:', state.complianceMode);
  clearArcs();
  fetchAllData(state.filters);
};

const toggleLatencyView = () => {
  state.complianceMode = false;
  console.log('Latency view activated');
  clearArcs();
  fetchAllData(state.filters);
};

// Animation loop
const animate = (timestamp) => {
  state.animationFrameId = requestAnimationFrame(animate);
  
  const delta = timestamp - state.lastFrameTime;
  state.lastFrameTime = timestamp;
  
  if (state.controls) {
    state.controls.update();
  }
  
  animateArcs(timestamp, delta);
  updateHUD(timestamp);
  
  if (state.renderer && state.scene && state.camera) {
    state.renderer.render(state.scene, state.camera);
  }
};

// Batch processing
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

// Main initialization
const init = async () => {
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

    // Add event listeners
    const toggleButton = document.getElementById('toggle-day-night');
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleDayNight);
      console.log('Toggle day/night button listener added');
    }

    const toggleCountriesButton = document.getElementById('toggle-countries');
    if (toggleCountriesButton) {
      toggleCountriesButton.addEventListener('click', toggleCountries);
      console.log('Toggle countries button listener added');
    }

    const toggleComplianceButton = document.getElementById('toggle-compliance-view');
    if (toggleComplianceButton) {
      toggleComplianceButton.addEventListener('click', toggleComplianceView);
      console.log('Toggle compliance view button listener added');
    }

    const toggleLatencyButton = document.getElementById('toggle-latency-view');
    if (toggleLatencyButton) {
      toggleLatencyButton.addEventListener('click', toggleLatencyView);
      console.log('Toggle latency view button listener added');
    }

    // Populate dropdowns
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

    // Add filter event listeners
    document.getElementById('toggle-filters').addEventListener('click', () => {
      const filtersPanel = document.getElementById('filters');
      filtersPanel.classList.toggle('show');
    });

    document.getElementById('apply-filters').addEventListener('click', applyFilters);

    // Initialize advanced features
    console.log('📍 Loading wired node locations...');
    await loadWiredNodeLocations();

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

// Export for global access
window.initGlobalLatencyView = init;

// Import all the advanced features (these will be added in separate files)
// import { loadWiredNodeLocations, patchWiredNodeLocation } from './wired-nodes.js';
// import { initAudioDetection, startAudioMonitoring, stopAudioMonitoring } from './audio.js';
// import { speakQueued, processTTSQueue } from './tts.js';
// import { createPersistentTicker, addToTickerQueue, renderTickerQueue, animateTicker } from './ticker.js';
// import { updateHUD, getBreakingNewsItems } from './hud.js';
// import { triggerNewsUpdate, updateTickerWithSummaries, addBadActorStories } from './news.js';
// import { createBubbleChart, addBubbleChartButton } from './bubble-chart.js';
// import { createBenchmarkPanel, generateCountryBenchmark } from './benchmark.js';
// import { createD3BenchmarkTables } from './d3-charts.js';

// Start the application
console.log('🔧 Starting optimized application...');
init(); 