# TTS Audio Troubleshooting Guide

## Quick Diagnostic Commands

Open your browser console and run these commands:

### 1. Check TTS Queue Status
```javascript
console.log('TTS Queue:', {
  queueLength: ttsQueue?.length || 0,
  isSpeaking: ttsSpeaking,
  lastFinishTime: lastTTSFinishTime,
  timeSinceLastSpeak: Date.now() - (lastTTSFinishTime || 0),
  audioDetectionOn: audioDetectionEnabled,
  otherAudioPlaying: isOtherAudioPlaying
});
```

### 2. Test TTS Directly
```javascript
speakQueued('Testing audio playback now.', window.TTS_PRIORITY.CRITICAL);
```

### 3. Check Server Connection
```javascript
fetch('http://localhost:8000/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Test', voice: 'nova', model: 'gpt-4o-mini-tts' })
})
.then(r => console.log('Server response:', r.status, r.ok))
.catch(e => console.error('Server error:', e));
```

### 4. Check Audio Context State
```javascript
console.log('Audio Context:', {
  exists: !!audioContext,
  state: audioContext?.state,
  suspended: audioContext?.state === 'suspended'
});
```

---

## Common Issues & Fixes

### Issue 1: Audio Detection Blocking TTS

**Problem:** The microphone permission system might detect TTS audio as "other audio" and block itself.

**Check:**
```javascript
console.log('Audio Detection:', audioDetectionEnabled, 'Other Audio:', isOtherAudioPlaying);
```

**Fix:** Temporarily disable audio detection:
```javascript
// In console:
audioDetectionEnabled = false;
isOtherAudioPlaying = false;
console.log('Audio detection disabled. Try TTS again.');
```

Or click the "🎤 Audio Detection" button in the UI to turn it off.

---

### Issue 2: Browser Autoplay Policy

**Problem:** Browsers block audio until user interacts with the page.

**Symptoms:**
- No audio plays
- Console shows: "play() failed because the user didn't interact with the document first"

**Fix:** Click the "Enable Audio" button in the menu bar at the top.

If button doesn't exist or doesn't work:
```javascript
// Unlock audio manually in console:
new Audio().play().then(() => console.log('Audio unlocked!')).catch(e => console.error('Failed:', e));
```

---

### Issue 3: Server Not Running

**Problem:** The backend server at localhost:8000 isn't running.

**Check:**
```javascript
fetch('http://localhost:8000/health')
  .then(r => console.log('Server health:', r.ok))
  .catch(() => console.error('❌ Server not running!'));
```

**Fix:** Start the server:
```bash
node server.js
```

---

### Issue 4: Response Check Order Bug

**Problem:** Code checks response.ok AFTER converting to blob, which fails silently.

**Location:** Line 2856-2860 in app.js

**Current (BUGGY):**
```javascript
const blob = await response.blob();  // ❌ Converts first
if (!response.ok) {                   // Then checks
  const errText = await response.text().catch(() => '');
  console.error('TTS HTTP error', response.status, errText);
  throw new Error(`TTS failed: ${response.status}`);
}
```

**Issue:** Can't read response.text() after blob() already consumed the response!

---

### Issue 5: Long Cooldown Blocking Next TTS

**Problem:** 15-second cooldown after each TTS prevents rapid announcements.

**Check:**
```javascript
const timeSince = Date.now() - (lastTTSFinishTime || 0);
console.log('Time since last TTS:', Math.round(timeSince / 1000), 'seconds');
console.log('Cooldown:', window.POST_TTS_COOLDOWN / 1000, 'seconds');
```

**Temporary fix** (for testing):
```javascript
window.POST_TTS_COOLDOWN = 1000; // Reduce to 1 second
lastTTSFinishTime = 0; // Reset timer
```

---

### Issue 6: Queue Cleared by Audio Detection

**Problem:** When "other audio" is detected, the system clears non-critical TTS messages.

**Check:**
```javascript
// Watch for queue clearing
const originalLength = ttsQueue.length;
setTimeout(() => {
  if (ttsQueue.length < originalLength) {
    console.warn(`Queue was cleared! ${originalLength} → ${ttsQueue.length}`);
  }
}, 5000);
```

**Fix:** Disable audio detection or add all messages as CRITICAL:
```javascript
speakQueued('Important message', window.TTS_PRIORITY.CRITICAL);
```

---

## Step-by-Step Troubleshooting

### Step 1: Check if TTS is even trying
```javascript
// Add a log to see if processTTSQueue is being called
const originalProcess = processTTSQueue;
window.processTTSQueue = async function() {
  console.log('🔊 processTTSQueue called, queue length:', ttsQueue.length);
  return originalProcess.call(this);
};
```

### Step 2: Force a TTS message
```javascript
// Clear everything and force one message
ttsQueue.length = 0;
ttsSpeaking = false;
lastTTSFinishTime = 0;
audioDetectionEnabled = false;
isOtherAudioPlaying = false;
speakQueued('This is a test message.', window.TTS_PRIORITY.CRITICAL);
```

### Step 3: Check for JavaScript errors
Open browser console → Look for red error messages

Common errors:
- `Failed to fetch` → Server not running
- `play() failed` → Need user interaction
- `TTS HTTP error` → Check server logs

### Step 4: Verify server is working
```bash
# In terminal, test server directly:
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","voice":"nova","model":"gpt-4o-mini-tts"}' \
  --output test.mp3

# Should create test.mp3 file - try playing it
```

---

## Immediate Fix to Try

Run this comprehensive fix in console:

```javascript
// EMERGENCY TTS RESTART
console.log('🚨 Emergency TTS restart...');

// 1. Stop audio detection (might be blocking)
audioDetectionEnabled = false;
isOtherAudioPlaying = false;

// 2. Clear queue and reset state
ttsQueue.length = 0;
ttsSpeaking = false;
lastTTSFinishTime = 0;

// 3. Unlock audio context
if (audioContext && audioContext.state === 'suspended') {
  audioContext.resume().then(() => console.log('✅ Audio context resumed'));
}

// 4. Test with user interaction (click anywhere first!)
document.body.addEventListener('click', async function unlockAudio() {
  try {
    await new Audio().play().catch(() => {});
    console.log('✅ Audio unlocked by user click');
    
    // 5. Try TTS
    speakQueued('Audio system restarted. Testing speech.', window.TTS_PRIORITY.CRITICAL);
    
    document.body.removeEventListener('click', unlockAudio);
  } catch (e) {
    console.error('Failed to unlock:', e);
  }
}, { once: true });

console.log('👆 Now click anywhere on the page to unlock audio...');
```

---

## Configuration Check

Verify TTS settings in localStorage:

```javascript
console.log('TTS Configuration:', {
  provider: localStorage.getItem('TTS_PROVIDER') || 'openai',
  voice: localStorage.getItem('OPENAI_VOICE_ID') || 'nova',
  elevenVoice: localStorage.getItem('ELEVEN_VOICE_ID'),
  elevenKey: localStorage.getItem('ELEVENLABS_API_KEY') ? 'SET' : 'NOT SET',
  lang: localStorage.getItem('TTS_LANG') || 'en',
  translate: localStorage.getItem('TTS_TRANSLATE')
});
```

---

## Most Likely Culprits

Based on the code, here are the most likely issues in order:

1. **Audio Detection Blocking (80% likely)**
   - `audioDetectionEnabled = true` + `isOtherAudioPlaying = true`
   - Fix: Disable audio detection

2. **Browser Autoplay Policy (15% likely)**
   - Need user gesture to unlock
   - Fix: Click "Enable Audio" button

3. **Server Not Running (4% likely)**
   - Backend API not responding
   - Fix: Start server with `node server.js`

4. **Response Check Bug (1% likely)**
   - Silent failure on server errors
   - Fix: Check response.ok before blob()

---

## Watch Console for These Messages

**Good signs:**
- ✅ "Silence detected, proceeding with TTS"
- 🎤 "Audio finished, waiting 15 seconds before next TTS"

**Bad signs:**
- ⏸️ "Other audio detected, waiting for silence before TTS"
- 🔊 "Detected other audio playing, pausing TTS"
- ❌ "TTS HTTP error"
- ❌ "TTS error: [error message]"



