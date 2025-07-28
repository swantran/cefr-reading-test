// Exemplar Audio System for CEFR Pronunciation Comparison
import { CEFR_LEVELS } from './cefrData.js';

export class ExemplarAudioManager {
    constructor() {
        this.audioCache = new Map();
        this.isLoading = false;
        this.supportedVoices = [];
        this.selectedVoice = null;
        this.fallbackVoices = [
            { name: 'Google UK English Female', lang: 'en-GB' },
            { name: 'Google US English', lang: 'en-US' },
            { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
            { name: 'Microsoft Hazel - English (Great Britain)', lang: 'en-GB' }
        ];
        
        this.initializeSpeechSynthesis();
        this.initializeRecordedExemplars();
    }

    async initializeSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Wait for voices to load
        const getVoices = () => {
            return new Promise((resolve) => {
                let voices = speechSynthesis.getVoices();
                if (voices.length) {
                    resolve(voices);
                } else {
                    speechSynthesis.addEventListener('voiceschanged', () => {
                        resolve(speechSynthesis.getVoices());
                    }, { once: true });
                }
            });
        };

        try {
            const voices = await getVoices();
            this.supportedVoices = voices.filter(voice => 
                voice.lang.startsWith('en-') && 
                (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
            );

            // Select best available voice
            this.selectedVoice = this.selectBestVoice();
            console.log('Selected voice:', this.selectedVoice?.name);
        } catch (error) {
            console.error('Error initializing speech synthesis:', error);
        }
    }

    selectBestVoice() {
        // Priority order: Google UK Female > Google US > Microsoft UK > Microsoft US > Default
        const priorities = [
            voice => voice.name.includes('Google') && voice.lang === 'en-GB' && voice.name.includes('Female'),
            voice => voice.name.includes('Google') && voice.lang === 'en-US',
            voice => voice.name.includes('Microsoft') && voice.lang === 'en-GB',
            voice => voice.name.includes('Microsoft') && voice.lang === 'en-US',
            voice => voice.default && voice.lang.startsWith('en-')
        ];

        for (const priorityCheck of priorities) {
            const voice = this.supportedVoices.find(priorityCheck);
            if (voice) return voice;
        }

        return this.supportedVoices[0] || null;
    }

    initializeRecordedExemplars() {
        // This would contain paths to pre-recorded high-quality exemplar audio files
        // For now, we'll use synthetic speech but structure it for future real recordings
        this.recordedExemplars = {
            // A1: {
            //     "I am happy today": "/audio/exemplars/a1/i-am-happy-today.mp3",
            //     "The cat is black": "/audio/exemplars/a1/the-cat-is-black.mp3",
            //     // ... more recordings
            // },
            // In production, these would be professional native speaker recordings
        };
    }

    async generateExemplarAudio(text, level) {
        const cacheKey = `${level}_${text}`;
        
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }

        // Check for pre-recorded exemplar first
        if (this.recordedExemplars[level] && this.recordedExemplars[level][text]) {
            const audioUrl = this.recordedExemplars[level][text];
            const audio = new Audio(audioUrl);
            this.audioCache.set(cacheKey, { audio, type: 'recorded' });
            return { audio, type: 'recorded' };
        }

        // Generate synthetic exemplar
        const syntheticAudio = await this.generateSyntheticExemplar(text, level);
        if (syntheticAudio) {
            this.audioCache.set(cacheKey, { audio: syntheticAudio, type: 'synthetic' });
            return { audio: syntheticAudio, type: 'synthetic' };
        }

        return null;
    }

    async generateSyntheticExemplar(text, level) {
        if (!this.selectedVoice || !('speechSynthesis' in window)) {
            return null;
        }

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.selectedVoice;
                
                // Adjust speech parameters based on CEFR level
                const speechParams = this.getSpeechParametersForLevel(level);
                utterance.rate = speechParams.rate;
                utterance.pitch = speechParams.pitch;
                utterance.volume = speechParams.volume;

                // Create audio context for recording
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const destination = audioContext.createMediaStreamDestination();
                const mediaRecorder = new MediaRecorder(destination.stream);
                
                const chunks = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(blob);
                    const audio = new Audio(audioUrl);
                    resolve(audio);
                };

                utterance.onstart = () => {
                    mediaRecorder.start();
                };

                utterance.onend = () => {
                    setTimeout(() => {
                        mediaRecorder.stop();
                        audioContext.close();
                    }, 100);
                };

                utterance.onerror = (error) => {
                    console.error('Speech synthesis error:', error);
                    mediaRecorder.stop();
                    audioContext.close();
                    reject(error);
                };

                speechSynthesis.speak(utterance);

            } catch (error) {
                console.error('Error generating synthetic exemplar:', error);
                reject(error);
            }
        });
    }

    getSpeechParametersForLevel(level) {
        // Adjust speech parameters to match expected proficiency level
        const params = {
            A1: { rate: 0.7, pitch: 1.0, volume: 0.9 },  // Slower, clear
            A2: { rate: 0.8, pitch: 1.0, volume: 0.9 },  // Slightly faster
            B1: { rate: 0.9, pitch: 1.0, volume: 0.9 },  // Normal pace
            B2: { rate: 1.0, pitch: 1.0, volume: 0.9 },  // Natural speed
            C1: { rate: 1.0, pitch: 0.95, volume: 0.9 }, // Natural with slight complexity
            C2: { rate: 1.0, pitch: 0.9, volume: 0.9 }   // Professional pace
        };

        return params[level] || params.B1;
    }

    async playExemplar(text, level) {
        this.isLoading = true;
        
        try {
            const exemplar = await this.generateExemplarAudio(text, level);
            if (exemplar && exemplar.audio) {
                await this.playAudio(exemplar.audio);
                return {
                    success: true,
                    type: exemplar.type,
                    message: exemplar.type === 'recorded' ? 
                        'Playing professional exemplar recording' : 
                        'Playing synthetic exemplar audio'
                };
            } else {
                throw new Error('Could not generate exemplar audio');
            }
        } catch (error) {
            console.error('Error playing exemplar:', error);
            return {
                success: false,
                error: error.message,
                message: 'Could not play exemplar audio'
            };
        } finally {
            this.isLoading = false;
        }
    }

    async playAudio(audio) {
        return new Promise((resolve, reject) => {
            audio.onended = resolve;
            audio.onerror = reject;
            audio.currentTime = 0;
            audio.play().catch(reject);
        });
    }

    async getExemplarMetadata(text, level) {
        const exemplar = await this.generateExemplarAudio(text, level);
        if (!exemplar) return null;

        return {
            text,
            level,
            type: exemplar.type,
            duration: exemplar.audio.duration || CEFR_LEVELS[level].sentences.find(s => s.text === text)?.idealDuration || 5,
            voice: this.selectedVoice?.name || 'System Default',
            quality: exemplar.type === 'recorded' ? 'Professional' : 'Synthetic',
            available: true
        };
    }

    // Advanced comparison features
    async compareWithExemplar(userAudio, text, level) {
        const exemplar = await this.generateExemplarAudio(text, level);
        if (!exemplar) {
            return {
                success: false,
                message: 'Exemplar not available for comparison'
            };
        }

        // This would integrate with advanced audio analysis
        // For now, return basic comparison structure
        return {
            success: true,
            exemplar: {
                text,
                level,
                type: exemplar.type,
                audio: exemplar.audio
            },
            comparison: {
                tempoSimilarity: 0, // Would be calculated by audio analysis
                pronunciationMatch: 0, // Would be calculated by phonetic analysis
                rhythmAlignment: 0, // Would be calculated by prosodic analysis
                overallSimilarity: 0
            },
            recommendations: [
                'Listen to the exemplar carefully',
                'Pay attention to word stress patterns',
                'Practice matching the rhythm and pace'
            ]
        };
    }

    // Utility methods
    getAvailableVoices() {
        return this.supportedVoices.map(voice => ({
            name: voice.name,
            lang: voice.lang,
            isSelected: voice === this.selectedVoice
        }));
    }

    setVoice(voiceName) {
        const voice = this.supportedVoices.find(v => v.name === voiceName);
        if (voice) {
            this.selectedVoice = voice;
            this.audioCache.clear(); // Clear cache to regenerate with new voice
            return true;
        }
        return false;
    }

    clearCache() {
        // Clean up audio URLs to prevent memory leaks
        for (const [key, value] of this.audioCache) {
            if (value.audio.src && value.audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(value.audio.src);
            }
        }
        this.audioCache.clear();
    }

    // Batch preload exemplars for a level
    async preloadExemplarsForLevel(level) {
        if (!CEFR_LEVELS[level]) return;

        const sentences = CEFR_LEVELS[level].sentences;
        const preloadPromises = sentences.map(sentence => 
            this.generateExemplarAudio(sentence.text, level)
        );

        try {
            await Promise.all(preloadPromises);
            console.log(`Preloaded ${sentences.length} exemplars for level ${level}`);
        } catch (error) {
            console.error(`Error preloading exemplars for level ${level}:`, error);
        }
    }
}