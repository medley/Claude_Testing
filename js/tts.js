// ============================================================================
// TEXT-TO-SPEECH MODULE
// Google Cloud Text-to-Speech API integration for spelling game
// ============================================================================

// ----------------------------------------------------------------------------
// GOOGLE CLOUD TTS CONFIGURATION
// ----------------------------------------------------------------------------

// Google Cloud Text-to-Speech API Configuration
const GOOGLE_TTS_API_KEY = 'AIzaSyDsuPomvQilWZtwH7B5-jqe59EVx2u7biI';
const GOOGLE_TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const GOOGLE_VOICE_NAME = 'en-US-Neural2-C'; // Warm, natural-sounding female voice

// ----------------------------------------------------------------------------
// AUDIO CACHE
// ----------------------------------------------------------------------------

// Audio cache to avoid repeated API calls
const audioCache = new Map();

// ----------------------------------------------------------------------------
// GOOGLE CLOUD TTS FUNCTION
// ----------------------------------------------------------------------------

/**
 * Speaks text using Google Cloud Text-to-Speech API (ONLY Google TTS - no browser fallback)
 * @param {string} text - The text to speak
 * @param {boolean} useCache - Whether to use cached audio (default: true)
 * @returns {Promise} - Resolves when audio playback is complete
 */
async function speakWithGoogleTTS(text, useCache = true) {
    console.log('🎤 Google TTS called for text:', text);

    // Check cache first
    if (useCache && audioCache.has(text)) {
        console.log('✅ Using cached audio for:', text);
        const cachedAudio = audioCache.get(text);
        return playAudioFromBase64(cachedAudio);
    }

    try {
        // Show subtle loading indicator
        showSpeechLoading();

        console.log('📡 Calling Google TTS API...');
        const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${GOOGLE_TTS_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: { text: text },
                voice: {
                    languageCode: 'en-US',
                    name: GOOGLE_VOICE_NAME,
                    ssmlGender: 'FEMALE'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    pitch: 0,          // Neutral pitch for natural sound
                    speakingRate: 0.95 // Near-natural speed (slightly slower for clarity)
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Google TTS API error: ${response.status}`);
        }

        const data = await response.json();
        const audioContent = data.audioContent;

        console.log('✅ Google TTS API response received, audio length:', audioContent.length);

        // Cache the audio
        if (useCache) {
            audioCache.set(text, audioContent);
            console.log('💾 Cached audio for:', text);
        }

        hideSpeechLoading();
        return playAudioFromBase64(audioContent);

    } catch (error) {
        console.error('❌ Google TTS API failed:', error);
        hideSpeechLoading();
        // Show friendly error message instead of fallback
        showSpeechError();
        throw error; // Re-throw to prevent execution
    }
}

// ----------------------------------------------------------------------------
// AUDIO PLAYBACK
// ----------------------------------------------------------------------------

/**
 * Plays audio from a base64 encoded MP3 string
 * @param {string} base64Audio - Base64 encoded audio data
 * @returns {Promise} - Resolves when playback completes
 */
function playAudioFromBase64(base64Audio) {
    return new Promise((resolve, reject) => {
        console.log('🔊 Playing audio...');
        const audio = new Audio('data:audio/mp3;base64,' + base64Audio);
        audio.onended = () => {
            console.log('✅ Audio playback finished');
            resolve();
        };
        audio.onerror = (err) => {
            console.error('❌ Audio playback error:', err);
            reject(err);
        };
        audio.play().catch(reject);
    });
}

// ----------------------------------------------------------------------------
// UI HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Shows a friendly error message when voice is unavailable
 */
function showSpeechError() {
    showEncouragement('🎤 Voice is temporarily unavailable. Please try again in a moment!');
}

/**
 * Shows loading indicator on the speak button
 */
function showSpeechLoading() {
    const speakBtn = document.querySelector('.speak-button');
    if (speakBtn) {
        speakBtn.style.opacity = '0.6';
        speakBtn.style.pointerEvents = 'none';
    }
}

/**
 * Hides loading indicator on the speak button
 */
function hideSpeechLoading() {
    const speakBtn = document.querySelector('.speak-button');
    if (speakBtn) {
        speakBtn.style.opacity = '1';
        speakBtn.style.pointerEvents = 'auto';
    }
}

// ----------------------------------------------------------------------------
// MAIN SPEAK FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Speaks the current word using best practice spelling instruction:
 * word → pause → letters → pause → word
 * This follows educational best practices for spelling instruction.
 */
async function speakWord() {
    console.log('🎯 speakWord() called for word:', currentWord);

    createSparkles(document.querySelector('.speak-button'));

    try {
        // Step 1: Say the full word first
        await speakWithGoogleTTS(currentWord, true);

        // Step 2: Pause 500ms
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 3: Spell out letter by letter
        const letters = currentWord.toUpperCase().split('');
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i].toLowerCase();
            await speakWithGoogleTTS(letter, true);
            // Pause between letters
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Step 4: Pause 800ms
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 5: Say the full word again
        await speakWithGoogleTTS(currentWord, true);

    } catch (error) {
        console.error('❌ Error in speakWord:', error);
    }
}

/**
 * Speaks the action cue for action mode words
 * First speaks the action instruction, then spells the word letter by letter
 */
async function speakActionCue() {
    console.log('🎯 speakActionCue() called for word:', currentWord);

    const actionCue = actionCues[currentWord.toLowerCase()];
    if (!actionCue) return;

    try {
        // First say the action instruction using Google TTS
        console.log('📢 Speaking action instruction:', actionCue.audio);
        await speakWithGoogleTTS(actionCue.audio, true);

        // Brief pause before spelling
        await new Promise(resolve => setTimeout(resolve, 500));

        // Then spell out the word letter by letter
        const letters = currentWord.toUpperCase().split('');
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i].toLowerCase();
            try {
                await speakWithGoogleTTS(letter, true);
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error('❌ Error speaking letter:', letter, error);
                // Stop on error - don't continue spelling
                break;
            }
        }
    } catch (error) {
        console.error('❌ Error speaking action cue:', error);
    }
}
