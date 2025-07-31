// Advanced Phonetic Analysis Engine for CEFR Pronunciation Assessment
export class PhoneticAnalysisEngine {
    constructor() {
        this.initializePhoneticData();
        this.initializeAnalysisAlgorithms();
    }

    initializePhoneticData() {
        // IPA phoneme mappings for English
        this.phonemeMap = {
            // Vowels
            vowels: {
                'a': ['æ', 'ɑ:', 'ʌ', 'eɪ'], // cat, car, cut, cake
                'e': ['e', 'ɛ', 'i:', 'ɪ'],   // bed, pen, bee, bit
                'i': ['ɪ', 'i:', 'aɪ'],       // bit, bee, bite
                'o': ['ɒ', 'ɔ:', 'əʊ', 'ʊ'], // hot, saw, go, put
                'u': ['ʌ', 'u:', 'ʊ', 'ju:'], // cut, boot, put, cute
                'y': ['ɪ', 'aɪ', 'j']         // gym, my, yes
            },
            // Consonants
            consonants: {
                'b': ['b'], 'p': ['p'], 'd': ['d'], 't': ['t'], 'g': ['g'], 'k': ['k'],
                'f': ['f'], 'v': ['v'], 's': ['s'], 'z': ['z'], 'θ': ['θ'], 'ð': ['ð'],
                'ʃ': ['ʃ'], 'ʒ': ['ʒ'], 'h': ['h'], 'l': ['l'], 'r': ['r'], 'j': ['j'],
                'w': ['w'], 'm': ['m'], 'n': ['n'], 'ŋ': ['ŋ'], 'tʃ': ['tʃ'], 'dʒ': ['dʒ']
            }
        };

        // Common pronunciation errors by CEFR level
        this.levelSpecificErrors = {
            A1: [
                { pattern: /th/, issues: ['θ/ð confusion', 'consonant cluster difficulty'] },
                { pattern: /r/, issues: ['r-sound articulation', 'r-coloring'] },
                { pattern: /æ/, issues: ['vowel length', 'vowel quality'] }
            ],
            A2: [
                { pattern: /ɪ|i:/, issues: ['short/long vowel distinction', 'vowel tenseness'] },
                { pattern: /w|v/, issues: ['consonant confusion', 'lip positioning'] },
                { pattern: /ŋ/, issues: ['final consonant drops', 'consonant clusters'] }
            ],
            B1: [
                { pattern: /əʊ|aʊ/, issues: ['diphthong quality', 'vowel gliding'] },
                { pattern: /ʃ|tʃ/, issues: ['fricative/affricate distinction', 'tongue positioning'] },
                { pattern: /stress/, issues: ['word stress patterns', 'rhythm'] }
            ],
            B2: [
                { pattern: /ɜ:|ə/, issues: ['schwa usage', 'vowel reduction'] },
                { pattern: /l|r/, issues: ['liquid consonant distinction', 'final consonants'] },
                { pattern: /intonation/, issues: ['sentence melody', 'question intonation'] }
            ],
            C1: [
                { pattern: /linking/, issues: ['connected speech', 'liaison'] },
                { pattern: /weak forms/, issues: ['function word reduction', 'rhythm'] },
                { pattern: /register/, issues: ['formal/informal pronunciation', 'clarity'] }
            ],
            C2: [
                { pattern: /subtle distinctions/, issues: ['minimal pairs', 'accent features'] },
                { pattern: /discourse markers/, issues: ['prosodic patterns', 'emphasis'] },
                { pattern: /register variation/, issues: ['style shifting', 'audience awareness'] }
            ]
        };

        // Phonetic scoring rubrics
        this.phoneticRubrics = {
            segmental: {
                vowels: {
                    weight: 0.3,
                    criteria: ['accuracy', 'length', 'quality', 'clarity']
                },
                consonants: {
                    weight: 0.4,
                    criteria: ['articulation', 'voicing', 'manner', 'place']
                }
            },
            suprasegmental: {
                stress: {
                    weight: 0.15,
                    criteria: ['word stress', 'sentence stress', 'prominence']
                },
                rhythm: {
                    weight: 0.1,
                    criteria: ['timing', 'syllable length', 'flow']
                },
                intonation: {
                    weight: 0.05,
                    criteria: ['pitch patterns', 'melody', 'expressiveness']
                }
            }
        };
    }

    initializeAnalysisAlgorithms() {
        // Initialize analysis algorithms
        this.algorithms = {
            formantAnalysis: this.initializeFormantAnalysis(),
            spectralAnalysis: this.initializeSpectralAnalysis(),
            prosodyAnalysis: this.initializeProsodyAnalysis(),
            phoneticAlignment: this.initializePhoneticAlignment()
        };
    }

    // === CORE ANALYSIS METHODS ===

    async analyzePhonetics(audioData, text, level) {
        try {
            // Extract acoustic features
            const acousticFeatures = await this.extractAcousticFeatures(audioData);
            
            // Perform phonetic segmentation
            const phoneticSegments = await this.segmentPhonetically(acousticFeatures, text);
            
            // Analyze each phonetic component
            const segmentalAnalysis = await this.analyzeSegmentals(phoneticSegments, level);
            const suprasegmentalAnalysis = await this.analyzeSuprasegmentals(acousticFeatures, text, level);
            
            // Generate comprehensive feedback
            const detailedFeedback = this.generateDetailedFeedback(
                segmentalAnalysis, 
                suprasegmentalAnalysis, 
                level
            );

            return {
                overall: this.calculateOverallScore(segmentalAnalysis, suprasegmentalAnalysis),
                segmental: segmentalAnalysis,
                suprasegmental: suprasegmentalAnalysis,
                feedback: detailedFeedback,
                level: level,
                text: text,
                timestamp: Date.now(),
                isBasicAnalysis: false
            };

        } catch (error) {
            console.error('Phonetic analysis error:', error);
            return this.getFallbackAnalysis(text, level);
        }
    }

    async extractAcousticFeatures(audioData) {
        // Real acoustic feature extraction using Web Audio API
        try {
            console.log('Starting acoustic feature extraction...');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created');
            
            const arrayBuffer = await audioData.arrayBuffer();
            console.log('Array buffer created, size:', arrayBuffer.byteLength);
            
            const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio decoded, duration:', decodedAudio.duration, 'channels:', decodedAudio.numberOfChannels);
            
            console.log('Extracting F0...');
            const fundamental = await this.extractF0(decodedAudio);
            console.log('F0 extracted:', fundamental);
            
            console.log('Extracting formants...');
            const formants = await this.extractFormants(decodedAudio);
            console.log('Formants extracted:', formants);
            
            console.log('Extracting spectral features...');
            const spectral = await this.extractSpectralFeatures(decodedAudio);
            console.log('Spectral features extracted:', spectral);
            
            console.log('Extracting temporal features...');
            const temporal = await this.extractTemporalFeatures(decodedAudio);
            console.log('Temporal features extracted:', temporal);
            
            console.log('Extracting energy features...');
            const energy = await this.extractEnergyFeatures(decodedAudio);
            console.log('Energy features extracted:', energy);
            
            const features = {
                fundamental,
                formants,
                spectral,
                temporal,
                energy
            };
            
            console.log('All acoustic features extracted successfully:', features);
            return features;
        } catch (error) {
            console.error('Audio feature extraction failed at step:', error.message);
            console.error('Full error:', error);
            console.error('Stack trace:', error.stack);
            return this.getFallbackFeatures();
        }
    }

    async segmentPhonetically(features, text) {
        // Simulate phonetic segmentation
        // In production, this would use forced alignment algorithms
        
        const words = text.toLowerCase().split(/\s+/);
        const segments = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[.,!?;:]/, '');
            const phonemes = this.wordToPhonemes(word);
            
            segments.push({
                word: word,
                phonemes: phonemes,
                startTime: (i / words.length) * features.temporal.duration,
                endTime: ((i + 1) / words.length) * features.temporal.duration,
                stress: this.predictWordStress(word),
                features: this.extractWordFeatures(features, i, words.length)
            });
        }

        return segments;
    }

    async analyzeSegmentals(segments, level) {
        const vowelAnalysis = [];
        const consonantAnalysis = [];
        let overallAccuracy = 0;

        for (const segment of segments) {
            for (const phoneme of segment.phonemes) {
                const analysis = this.analyzePhoneme(phoneme, segment.features, level);
                
                if (this.isVowel(phoneme)) {
                    vowelAnalysis.push(analysis);
                } else {
                    consonantAnalysis.push(analysis);
                }
                
                overallAccuracy += analysis.accuracy;
            }
        }

        const totalPhonemes = vowelAnalysis.length + consonantAnalysis.length;
        overallAccuracy = totalPhonemes > 0 ? overallAccuracy / totalPhonemes : 0;

        return {
            vowels: {
                count: vowelAnalysis.length,
                accuracy: this.calculateAverageAccuracy(vowelAnalysis),
                issues: this.identifyVowelIssues(vowelAnalysis, level),
                details: vowelAnalysis
            },
            consonants: {
                count: consonantAnalysis.length,
                accuracy: this.calculateAverageAccuracy(consonantAnalysis),
                issues: this.identifyConsonantIssues(consonantAnalysis, level),
                details: consonantAnalysis
            },
            overall: overallAccuracy * 100
        };
    }

    async analyzeSuprasegmentals(features, text, level) {
        const stressAnalysis = this.analyzeStress(features, text);
        const rhythmAnalysis = this.analyzeRhythm(features, text);
        const intonationAnalysis = this.analyzeIntonation(features, text);

        return {
            stress: {
                accuracy: stressAnalysis.accuracy,
                patterns: stressAnalysis.patterns,
                issues: stressAnalysis.issues
            },
            rhythm: {
                accuracy: rhythmAnalysis.accuracy,
                timing: rhythmAnalysis.timing,
                flow: rhythmAnalysis.flow,
                issues: rhythmAnalysis.issues
            },
            intonation: {
                accuracy: intonationAnalysis.accuracy,
                contour: intonationAnalysis.contour,
                expressiveness: intonationAnalysis.expressiveness,
                issues: intonationAnalysis.issues
            },
            overall: (stressAnalysis.accuracy + rhythmAnalysis.accuracy + intonationAnalysis.accuracy) / 3 * 100
        };
    }

    // === DETAILED ANALYSIS METHODS ===

    analyzePhoneme(phoneme, features, level) {
        // Real phoneme analysis based on acoustic features
        let accuracy = 0.5; // Start with low base score
        
        // Analyze energy levels - mumbling has low energy
        if (features.energy < 0.1) {
            accuracy -= 0.3; // Penalize mumbling/low energy
        } else if (features.energy > 0.2) {
            accuracy += 0.2; // Reward clear articulation
        }

        // Analyze spectral clarity - clear pronunciation has distinct peaks
        if (features.spectral && features.spectral.clarity) {
            accuracy += features.spectral.clarity * 0.3;
        }

        // Analyze formant quality for vowels
        if (this.isVowel(phoneme) && features.formants) {
            const formantAccuracy = this.analyzeVowelFormants(phoneme, features.formants);
            accuracy += formantAccuracy * 0.4;
        }

        // Analyze consonant features
        if (!this.isVowel(phoneme)) {
            const consonantAccuracy = this.analyzeConsonantFeatures(phoneme, features);
            accuracy += consonantAccuracy * 0.4;
        }

        // Apply level-specific penalties for common errors
        const levelErrors = this.levelSpecificErrors[level] || [];
        for (const error of levelErrors) {
            if (error.pattern.test && error.pattern.test(phoneme)) {
                accuracy -= 0.1;
            }
        }

        // Clamp accuracy between 0 and 1
        const finalAccuracy = Math.max(0, Math.min(1.0, accuracy));

        return {
            phoneme: phoneme,
            accuracy: finalAccuracy,
            target: phoneme,
            produced: this.simulateProducedPhoneme(phoneme, finalAccuracy),
            issues: this.identifyPhonemeIssues(phoneme, finalAccuracy, level),
            feedback: this.generatePhonemeNeedback(phoneme, finalAccuracy, level)
        };
    }

    analyzeStress(features, text) {
        // Simulate stress pattern analysis
        const words = text.split(/\s+/);
        const stressPatterns = [];
        let correctStressCount = 0;

        for (const word of words) {
            const expectedStress = this.predictWordStress(word);
            const detectedStress = this.simulateStressDetection(word, features);
            const isCorrect = this.compareStressPatterns(expectedStress, detectedStress);
            
            stressPatterns.push({
                word: word,
                expected: expectedStress,
                detected: detectedStress,
                correct: isCorrect
            });

            if (isCorrect) correctStressCount++;
        }

        const accuracy = words.length > 0 ? correctStressCount / words.length : 0;

        return {
            accuracy: accuracy,
            patterns: stressPatterns,
            issues: this.identifyStressIssues(stressPatterns)
        };
    }

    analyzeRhythm(features, text) {
        // Simulate rhythm analysis
        const syllableCount = this.countSyllables(text);
        const expectedDuration = syllableCount * 0.2; // ~200ms per syllable
        const actualDuration = features.temporal.duration;
        
        const timingAccuracy = Math.min(1.0, expectedDuration / actualDuration);
        const flowScore = 0.8 + Math.random() * 0.2; // Simulate flow analysis

        return {
            accuracy: (timingAccuracy + flowScore) / 2,
            timing: {
                expected: expectedDuration,
                actual: actualDuration,
                ratio: timingAccuracy
            },
            flow: flowScore,
            issues: this.identifyRhythmIssues(timingAccuracy, flowScore)
        };
    }

    analyzeIntonation(features, text) {
        // Simulate intonation analysis
        const isQuestion = text.includes('?');
        const expectedContour = isQuestion ? 'rising' : 'falling';
        const detectedContour = this.simulateContourDetection(features, isQuestion);
        
        const contourAccuracy = expectedContour === detectedContour ? 0.9 : 0.6;
        const expressiveness = 0.7 + Math.random() * 0.3;

        return {
            accuracy: (contourAccuracy + expressiveness) / 2,
            contour: {
                expected: expectedContour,
                detected: detectedContour,
                match: expectedContour === detectedContour
            },
            expressiveness: expressiveness,
            issues: this.identifyIntonationIssues(contourAccuracy, expressiveness)
        };
    }

    // === UTILITY METHODS ===

    wordToPhonemes(word) {
        // Simplified phoneme conversion (in production, use a pronunciation dictionary)
        const phonemes = [];
        for (const char of word.toLowerCase()) {
            if (this.phonemeMap.vowels[char]) {
                phonemes.push(this.phonemeMap.vowels[char][0]);
            } else if (this.phonemeMap.consonants[char]) {
                phonemes.push(this.phonemeMap.consonants[char][0]);
            }
        }
        return phonemes;
    }

    isVowel(phoneme) {
        const vowelPatterns = ['æ', 'ɑ:', 'ʌ', 'eɪ', 'e', 'ɛ', 'i:', 'ɪ', 'aɪ', 'ɒ', 'ɔ:', 'əʊ', 'ʊ', 'u:', 'ju:', 'ə'];
        return vowelPatterns.includes(phoneme);
    }

    predictWordStress(word) {
        // Simplified stress prediction
        if (word.length <= 2) return [1]; // Single stress for short words
        if (word.length <= 4) return [1, 0]; // First syllable stress for medium words
        return [1, 0, 0]; // Default pattern for longer words
    }

    countSyllables(text) {
        // Simplified syllable counting
        return text.toLowerCase().match(/[aeiouy]+/g)?.length || 1;
    }

    calculateOverallScore(segmental, suprasegmental) {
        const segmentalWeight = 0.7;
        const suprasegmentalWeight = 0.3;
        
        return (segmental.overall * segmentalWeight + suprasegmental.overall * suprasegmentalWeight);
    }

    generateDetailedFeedback(segmental, suprasegmental, level) {
        const feedback = {
            strengths: [],
            improvements: [],
            specificTips: [],
            levelAppropriate: []
        };

        // Analyze strengths
        if (segmental.vowels.accuracy > 0.8) {
            feedback.strengths.push("Excellent vowel pronunciation");
        }
        if (segmental.consonants.accuracy > 0.8) {
            feedback.strengths.push("Strong consonant articulation");
        }
        if (suprasegmental.stress.accuracy > 0.8) {
            feedback.strengths.push("Good word stress patterns");
        }

        // Identify improvements
        if (segmental.vowels.accuracy < 0.7) {
            feedback.improvements.push("Focus on vowel clarity and length");
            feedback.specificTips.push("Practice vowel sounds in isolation before combining in words");
        }
        if (segmental.consonants.accuracy < 0.7) {
            feedback.improvements.push("Work on consonant precision");
            feedback.specificTips.push("Pay attention to tongue and lip positions for each consonant");
        }
        if (suprasegmental.rhythm.accuracy < 0.7) {
            feedback.improvements.push("Improve speech rhythm and timing");
            feedback.specificTips.push("Practice with a metronome or rhythm exercises");
        }

        // Level-appropriate feedback
        const levelFeedback = this.getLevelSpecificFeedback(level, segmental, suprasegmental);
        feedback.levelAppropriate = levelFeedback;

        return feedback;
    }

    getLevelSpecificFeedback(level, segmental, suprasegmental) {
        const feedback = [];
        
        switch (level) {
            case 'A1':
            case 'A2':
                feedback.push("Focus on clear articulation of individual sounds");
                feedback.push("Practice common consonant and vowel sounds");
                break;
            case 'B1':
            case 'B2':
                feedback.push("Work on word stress patterns and connected speech");
                feedback.push("Practice intonation in questions and statements");
                break;
            case 'C1':
            case 'C2':
                feedback.push("Focus on subtle pronunciation features and natural rhythm");
                feedback.push("Work on register-appropriate pronunciation variations");
                break;
        }

        return feedback;
    }

    // === REAL AUDIO ANALYSIS METHODS ===

    async extractF0(audioBuffer) {
        // Extract fundamental frequency using autocorrelation
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Analyze in 50ms windows
        const windowSize = Math.floor(sampleRate * 0.05);
        const f0Values = [];
        
        for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
            const window = channelData.slice(i, i + windowSize);
            const f0 = this.calculateF0Autocorrelation(window, sampleRate);
            if (f0 > 0) f0Values.push(f0);
        }
        
        const mean = f0Values.length > 0 ? f0Values.reduce((a, b) => a + b) / f0Values.length : 0;
        const range = f0Values.length > 0 ? Math.max(...f0Values) - Math.min(...f0Values) : 0;
        
        return { mean, range, values: f0Values };
    }

    async extractFormants(audioBuffer) {
        // Extract formants using LPC analysis
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Use larger window for formant analysis (25ms)
        const windowSize = Math.floor(sampleRate * 0.025);
        const formantFrames = [];
        
        for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
            const window = channelData.slice(i, i + windowSize);
            const formants = this.calculateFormants(window, sampleRate);
            formantFrames.push(formants);
        }
        
        // Average the formants
        const avgFormants = this.averageFormants(formantFrames);
        return avgFormants;
    }

    async extractSpectralFeatures(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Calculate FFT for spectral analysis
        const fftSize = 2048;
        const spectrum = this.calculateSpectrum(channelData, fftSize);
        
        const centroid = this.calculateSpectralCentroid(spectrum, sampleRate);
        const bandwidth = this.calculateSpectralBandwidth(spectrum, centroid, sampleRate);
        const rolloff = this.calculateSpectralRolloff(spectrum, sampleRate, 0.85);
        const clarity = this.calculateSpectralClarity(spectrum);
        
        return { centroid, bandwidth, rolloff, clarity };
    }

    async extractTemporalFeatures(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        const duration = audioBuffer.duration;
        const silences = this.detectSilences(channelData, sampleRate);
        const voicedRatio = this.calculateVoicedRatio(channelData, sampleRate);
        
        return { duration, silences: silences.length, voicedRatio };
    }

    async extractEnergyFeatures(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        
        // Calculate RMS energy
        let sumSquares = 0;
        let peak = 0;
        
        for (let i = 0; i < channelData.length; i++) {
            const sample = Math.abs(channelData[i]);
            sumSquares += sample * sample;
            if (sample > peak) peak = sample;
        }
        
        const rms = Math.sqrt(sumSquares / channelData.length);
        
        return { rms, peak };
    }

    extractWordFeatures(features, index, totalWords) {
        const progress = index / totalWords;
        return {
            energy: features.energy.rms * (0.8 + Math.random() * 0.4),
            pitch: features.fundamental.mean * (0.9 + Math.random() * 0.2),
            formants: features.formants
        };
    }

    simulateProducedPhoneme(target, accuracy) {
        if (accuracy > 0.9) return target;
        
        // Simulate common substitutions based on accuracy
        const substitutions = {
            'θ': ['s', 'f', 't'],
            'ð': ['d', 'z', 'v'],
            'ɪ': ['i:', 'e'],
            'i:': ['ɪ', 'eɪ'],
            'æ': ['e', 'ʌ']
        };

        if (substitutions[target] && Math.random() > accuracy) {
            const subs = substitutions[target];
            return subs[Math.floor(Math.random() * subs.length)];
        }

        return target;
    }

    simulateStressDetection(word, features) {
        const expected = this.predictWordStress(word);
        // Add some variation based on features
        return expected.map(stress => stress * (0.8 + Math.random() * 0.4));
    }

    simulateContourDetection(features, isQuestion) {
        const random = Math.random();
        if (isQuestion) {
            return random > 0.2 ? 'rising' : 'falling';
        } else {
            return random > 0.3 ? 'falling' : 'rising';
        }
    }

    // === HELPER METHODS ===

    calculateAverageAccuracy(analyses) {
        if (analyses.length === 0) return 0;
        return analyses.reduce((sum, analysis) => sum + analysis.accuracy, 0) / analyses.length;
    }

    identifyVowelIssues(vowelAnalyses, level) {
        const issues = [];
        const lowAccuracy = vowelAnalyses.filter(v => v.accuracy < 0.7);
        
        if (lowAccuracy.length > 0) {
            issues.push(`${lowAccuracy.length} vowel sounds need improvement`);
        }

        return issues;
    }

    identifyConsonantIssues(consonantAnalyses, level) {
        const issues = [];
        const lowAccuracy = consonantAnalyses.filter(c => c.accuracy < 0.7);
        
        if (lowAccuracy.length > 0) {
            issues.push(`${lowAccuracy.length} consonant sounds need work`);
        }

        return issues;
    }

    identifyPhonemeIssues(phoneme, accuracy, level) {
        const issues = [];
        
        if (accuracy < 0.6) {
            issues.push('Poor articulation');
        }
        if (accuracy < 0.8 && this.isVowel(phoneme)) {
            issues.push('Vowel quality needs improvement');
        }

        return issues;
    }

    identifyStressIssues(patterns) {
        const issues = [];
        const incorrectCount = patterns.filter(p => !p.correct).length;
        
        if (incorrectCount > 0) {
            issues.push(`${incorrectCount} words have incorrect stress patterns`);
        }

        return issues;
    }

    identifyRhythmIssues(timingAccuracy, flowScore) {
        const issues = [];
        
        if (timingAccuracy < 0.7) {
            issues.push('Speech tempo needs adjustment');
        }
        if (flowScore < 0.7) {
            issues.push('Work on speech flow and smoothness');
        }

        return issues;
    }

    identifyIntonationIssues(contourAccuracy, expressiveness) {
        const issues = [];
        
        if (contourAccuracy < 0.7) {
            issues.push('Practice question and statement intonation patterns');
        }
        if (expressiveness < 0.7) {
            issues.push('Add more variation and expression to speech');
        }

        return issues;
    }

    generatePhonemeNeedback(phoneme, accuracy, level) {
        if (accuracy > 0.9) return "Excellent pronunciation";
        if (accuracy > 0.7) return "Good, with minor improvements needed";
        if (accuracy > 0.5) return "Needs practice - focus on tongue/lip position";
        return "Requires significant work - consider intensive practice";
    }

    compareStressPatterns(expected, detected) {
        if (expected.length !== detected.length) return false;
        
        for (let i = 0; i < expected.length; i++) {
            const expectedStress = expected[i] > 0.5;
            const detectedStress = detected[i] > 0.5;
            if (expectedStress !== detectedStress) return false;
        }
        
        return true;
    }

    // === SIGNAL PROCESSING HELPER METHODS ===

    calculateF0Autocorrelation(window, sampleRate) {
        // Autocorrelation-based pitch detection
        const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
        const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
        
        let maxCorrelation = 0;
        let bestPeriod = 0;
        
        for (let period = minPeriod; period <= maxPeriod; period++) {
            let correlation = 0;
            let norm = 0;
            
            for (let i = 0; i < window.length - period; i++) {
                correlation += window[i] * window[i + period];
                norm += window[i] * window[i];
            }
            
            if (norm > 0) {
                correlation /= norm;
                if (correlation > maxCorrelation) {
                    maxCorrelation = correlation;
                    bestPeriod = period;
                }
            }
        }
        
        return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
    }

    calculateFormants(window, sampleRate) {
        // Simplified formant estimation using peak detection
        const spectrum = this.calculateSpectrum(window, 1024);
        const freqBin = sampleRate / spectrum.length;
        
        // Find peaks in low frequency range for formants
        const peaks = this.findSpectralPeaks(spectrum, 5);
        const formants = { F1: 0, F2: 0, F3: 0 };
        
        if (peaks.length > 0) formants.F1 = peaks[0] * freqBin;
        if (peaks.length > 1) formants.F2 = peaks[1] * freqBin;
        if (peaks.length > 2) formants.F3 = peaks[2] * freqBin;
        
        return formants;
    }

    calculateSpectrum(samples, fftSize) {
        // Simple FFT using built-in methods or approximation
        const spectrum = new Array(fftSize / 2).fill(0);
        
        for (let k = 0; k < spectrum.length; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < Math.min(samples.length, fftSize); n++) {
                const angle = -2 * Math.PI * k * n / fftSize;
                real += samples[n] * Math.cos(angle);
                imag += samples[n] * Math.sin(angle);
            }
            spectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return spectrum;
    }

    calculateSpectralCentroid(spectrum, sampleRate) {
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            const freq = i * sampleRate / (2 * spectrum.length);
            weightedSum += freq * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    calculateSpectralBandwidth(spectrum, centroid, sampleRate) {
        let weightedVariance = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            const freq = i * sampleRate / (2 * spectrum.length);
            const deviation = freq - centroid;
            weightedVariance += deviation * deviation * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
    }

    calculateSpectralRolloff(spectrum, sampleRate, threshold) {
        const totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
        const thresholdEnergy = totalEnergy * threshold;
        
        let cumulativeEnergy = 0;
        for (let i = 0; i < spectrum.length; i++) {
            cumulativeEnergy += spectrum[i];
            if (cumulativeEnergy >= thresholdEnergy) {
                return i * sampleRate / (2 * spectrum.length);
            }
        }
        
        return sampleRate / 2;
    }

    calculateSpectralClarity(spectrum) {
        // Measure how "peaky" the spectrum is (clear vs muddy)
        const mean = spectrum.reduce((sum, val) => sum + val, 0) / spectrum.length;
        const variance = spectrum.reduce((sum, val) => sum + (val - mean) ** 2, 0) / spectrum.length;
        const clarity = variance / (mean ** 2 + 1e-10); // Coefficient of variation
        
        return Math.min(1.0, clarity / 10); // Normalize to 0-1
    }

    findSpectralPeaks(spectrum, numPeaks) {
        const peaks = [];
        
        for (let i = 1; i < spectrum.length - 1; i++) {
            if (spectrum[i] > spectrum[i-1] && spectrum[i] > spectrum[i+1]) {
                peaks.push({ index: i, magnitude: spectrum[i] });
            }
        }
        
        // Sort by magnitude and return top peaks
        peaks.sort((a, b) => b.magnitude - a.magnitude);
        return peaks.slice(0, numPeaks).map(peak => peak.index);
    }

    detectSilences(channelData, sampleRate, threshold = 0.01) {
        const silences = [];
        const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
        let inSilence = false;
        let silenceStart = 0;
        
        for (let i = 0; i < channelData.length; i += windowSize) {
            const window = channelData.slice(i, i + windowSize);
            const energy = this.calculateRMS(window);
            
            if (energy < threshold) {
                if (!inSilence) {
                    inSilence = true;
                    silenceStart = i / sampleRate;
                }
            } else {
                if (inSilence) {
                    inSilence = false;
                    silences.push({
                        start: silenceStart,
                        end: i / sampleRate,
                        duration: (i / sampleRate) - silenceStart
                    });
                }
            }
        }
        
        return silences;
    }

    calculateVoicedRatio(channelData, sampleRate) {
        const windowSize = Math.floor(sampleRate * 0.02); // 20ms windows
        let voicedFrames = 0;
        let totalFrames = 0;
        
        for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
            const window = channelData.slice(i, i + windowSize);
            const f0 = this.calculateF0Autocorrelation(window, sampleRate);
            
            totalFrames++;
            if (f0 > 50 && f0 < 400) { // Typical human voice range
                voicedFrames++;
            }
        }
        
        return totalFrames > 0 ? voicedFrames / totalFrames : 0;
    }

    calculateRMS(samples) {
        let sumSquares = 0;
        for (let i = 0; i < samples.length; i++) {
            sumSquares += samples[i] * samples[i];
        }
        return Math.sqrt(sumSquares / samples.length);
    }

    averageFormants(formantFrames) {
        if (formantFrames.length === 0) return { F1: 0, F2: 0, F3: 0 };
        
        const avg = { F1: 0, F2: 0, F3: 0 };
        let validFrames = 0;
        
        for (const frame of formantFrames) {
            if (frame.F1 > 0 && frame.F2 > 0) {
                avg.F1 += frame.F1;
                avg.F2 += frame.F2;
                avg.F3 += frame.F3;
                validFrames++;
            }
        }
        
        if (validFrames > 0) {
            avg.F1 /= validFrames;
            avg.F2 /= validFrames;
            avg.F3 /= validFrames;
        }
        
        return avg;
    }

    analyzeVowelFormants(phoneme, formants) {
        // Expected formant ranges for different vowels
        const vowelTargets = {
            'æ': { F1: 700, F2: 1700 }, // cat
            'ɑ:': { F1: 750, F2: 1100 }, // car
            'ʌ': { F1: 650, F2: 1400 }, // cut
            'i:': { F1: 300, F2: 2300 }, // bee
            'ɪ': { F1: 400, F2: 2000 }, // bit
            'u:': { F1: 300, F2: 900 }, // boot
            'ʊ': { F1: 400, F2: 1100 }  // put
        };
        
        const target = vowelTargets[phoneme];
        if (!target || !formants.F1 || !formants.F2) return 0.5;
        
        // Calculate distance from target
        const f1Error = Math.abs(formants.F1 - target.F1) / target.F1;
        const f2Error = Math.abs(formants.F2 - target.F2) / target.F2;
        
        const avgError = (f1Error + f2Error) / 2;
        return Math.max(0, 1 - avgError); // Convert error to accuracy
    }

    analyzeConsonantFeatures(phoneme, features) {
        // Analyze consonant based on energy and spectral characteristics
        let accuracy = 0.5;
        
        // Fricatives should have high frequency energy
        if (['s', 'z', 'ʃ', 'ʒ', 'f', 'v', 'θ', 'ð'].includes(phoneme)) {
            if (features.spectral && features.spectral.centroid > 2000) {
                accuracy += 0.3; // Good fricative energy
            }
        }
        
        // Stops should have burst characteristics
        if (['p', 'b', 't', 'd', 'k', 'g'].includes(phoneme)) {
            if (features.energy > 0.2) {
                accuracy += 0.3; // Good burst energy
            }
        }
        
        return Math.min(1.0, accuracy);
    }

    getFallbackFeatures() {
        return {
            fundamental: { mean: 0, range: 0, values: [] },
            formants: { F1: 0, F2: 0, F3: 0 },
            spectral: { centroid: 0, bandwidth: 0, rolloff: 0, clarity: 0 },
            temporal: { duration: 1, silences: 0, voicedRatio: 0 },
            energy: { rms: 0.01, peak: 0.01 }
        };
    }

    getFallbackAnalysis(text, level) {
        // Provide basic analysis when advanced analysis fails
        return {
            overall: 75,
            segmental: {
                vowels: { count: 5, accuracy: 0.75, issues: [], details: [] },
                consonants: { count: 8, accuracy: 0.76, issues: [], details: [] },
                overall: 75.5
            },
            suprasegmental: {
                stress: { accuracy: 0.7, patterns: [], issues: [] },
                rhythm: { accuracy: 0.75, timing: {}, flow: 0.75, issues: [] },
                intonation: { accuracy: 0.73, contour: {}, expressiveness: 0.73, issues: [] },
                overall: 72.7
            },
            feedback: {
                strengths: ["Basic pronunciation is understandable"],
                improvements: ["Continue practicing for more detailed feedback"],
                specificTips: ["Record in a quiet environment for better analysis"],
                levelAppropriate: ["Keep practicing at your current level"]
            },
            level: level,
            text: text,
            timestamp: Date.now(),
            isBasicAnalysis: true
        };
    }

    // === INITIALIZATION METHODS ===

    initializeFormantAnalysis() {
        return {
            vowelSpace: {
                F1: { min: 300, max: 1000 },
                F2: { min: 800, max: 2500 }
            },
            consonantMarkers: {
                fricatives: { spectralPeak: { min: 3000, max: 8000 } },
                stops: { burstIntensity: { min: 0.1, max: 0.8 } }
            }
        };
    }

    initializeSpectralAnalysis() {
        return {
            frequencyBands: {
                low: { min: 0, max: 500 },
                mid: { min: 500, max: 2000 },
                high: { min: 2000, max: 8000 }
            },
            noiseThreshold: 0.1
        };
    }

    initializeProsodyAnalysis() {
        return {
            f0Range: { min: 80, max: 400 },
            stressMarkers: ['duration', 'intensity', 'pitch'],
            rhythmMetrics: ['syllableTiming', 'stressInterval']
        };
    }

    initializePhoneticAlignment() {
        return {
            alignmentWindow: 0.05, // 50ms window
            phoneticModels: {}, // Would contain HMM or neural models
            confidenceThreshold: 0.7
        };
    }
}