import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from './node_modules/three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from './node_modules/three/examples/jsm/geometries/TextGeometry.js';
import { CONFIG } from './config.js';
import { state } from './state.js';
import { createCircleTexture, latLongToVector3 } from './utils.js';

// Destructure Three.js components
const {
  Vector3, Scene, Color, PerspectiveCamera, MeshBasicMaterial,
  MeshStandardMaterial, SphereGeometry, Mesh, AmbientLight, DirectionalLight,
  BufferGeometry, TubeGeometry, LineBasicMaterial, Line, HemisphereLight, Group,
  TextureLoader, MeshLambertMaterial, Quaternion, BufferAttribute, Points,
  PointsMaterial, AdditiveBlending, ShaderMaterial, WebGLRenderer, BoxGeometry,
  CanvasTexture, NormalBlending, CatmullRomCurve3
} = THREE;

console.log('Three.js version:', THREE.REVISION);

// Core Three.js functionality
export const initThreeJS = (container) => {
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

    // Lighting setup
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

    // Controls setup
    state.controls = new OrbitControls(state.camera, canvas);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.05;
    state.controls.minDistance = 6;
    state.controls.maxDistance = 100;
    console.log('OrbitControls initialized');

    document.addEventListener('keydown', toggleDayNight);
    console.log('Keydown event listener added for toggle');

    // Test cube for debugging
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
    console.error('InitThreeJS error stack:', error.stack);
    return false;
  }
};

export const onWindowResize = () => {
  if (!state.camera || !state.renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(width, height);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  console.log('Window resized:', { width, height });
};

export const toggleDayNight = () => {
  state.isDayMode = !state.isDayMode;
  if (state.globe) {
    state.globe.material.map = state.isDayMode ? state.dayTexture : state.nightTexture;
    state.globe.material.needsUpdate = true;
    console.log('Toggled day/night mode:', state.isDayMode);
  }
};

export const createGlobe = () => {
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

  // Load textures
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

  // Load submarine cables
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

  // Load world countries
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

export const createAnimatedArc = (arcData, batchStartTime) => {
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

export const animateArcs = (now, delta) => {
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

// Import missing functions
import { getLatencyColor } from './utils.js';
import { customRegionMap, continentCodeToName } from './config.js'; 