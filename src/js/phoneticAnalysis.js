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
        // Simulate advanced acoustic feature extraction
        // In production, this would use Web Audio API and signal processing
        
        const features = {
            fundamental: this.extractF0(audioData),
            formants: this.extractFormants(audioData),
            spectral: this.extractSpectralFeatures(audioData),
            temporal: this.extractTemporalFeatures(audioData),
            energy: this.extractEnergyFeatures(audioData)
        };

        return features;
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
        // Simulate detailed phoneme analysis
        const baseAccuracy = 0.7 + Math.random() * 0.3; // 70-100% base accuracy
        
        // Adjust for level-specific common errors
        const levelErrors = this.levelSpecificErrors[level] || [];
        let accuracyAdjustment = 0;
        
        for (const error of levelErrors) {
            if (error.pattern.test && error.pattern.test(phoneme)) {
                accuracyAdjustment -= 0.1; // Reduce accuracy for common errors
            }
        }

        const finalAccuracy = Math.max(0.3, Math.min(1.0, baseAccuracy + accuracyAdjustment));

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

    // === SIMULATION METHODS (for development/testing) ===

    extractF0(audioData) {
        return { mean: 150 + Math.random() * 100, range: 50 + Math.random() * 50 };
    }

    extractFormants(audioData) {
        return {
            F1: 500 + Math.random() * 300,
            F2: 1500 + Math.random() * 500,
            F3: 2500 + Math.random() * 500
        };
    }

    extractSpectralFeatures(audioData) {
        return {
            centroid: 1000 + Math.random() * 1000,
            bandwidth: 500 + Math.random() * 500,
            rolloff: 3000 + Math.random() * 1000
        };
    }

    extractTemporalFeatures(audioData) {
        return {
            duration: 2 + Math.random() * 3,
            silences: Math.floor(Math.random() * 3)
        };
    }

    extractEnergyFeatures(audioData) {
        return {
            rms: 0.1 + Math.random() * 0.3,
            peak: 0.5 + Math.random() * 0.5
        };
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