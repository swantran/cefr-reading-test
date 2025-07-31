// Pronunciation Exercise Generator
// Creates targeted exercises based on phonetic analysis results

export class PronunciationExerciseGenerator {
    constructor() {
        this.initializeExerciseDatabase();
    }

    initializeExerciseDatabase() {
        // Exercise database organized by pronunciation issue type
        this.exerciseDatabase = {
            vowels: {
                'æ': {
                    name: 'Short A Sound',
                    description: 'The /æ/ sound as in "cat"',
                    commonErrors: ['e', 'ʌ', 'ɑ:'],
                    exercises: [
                        {
                            type: 'minimal_pairs',
                            title: 'Minimal Pairs Practice',
                            instructions: 'Practice distinguishing /æ/ from similar sounds',
                            pairs: [
                                { target: 'cat', contrast: 'cut', focus: '/æ/ vs /ʌ/' },
                                { target: 'bat', contrast: 'bet', focus: '/æ/ vs /e/' },
                                { target: 'hat', contrast: 'hot', focus: '/æ/ vs /ɒ/' },
                                { target: 'back', contrast: 'beck', focus: '/æ/ vs /e/' }
                            ]
                        },
                        {
                            type: 'isolation',
                            title: 'Sound Isolation',
                            instructions: 'Practice the /æ/ sound in isolation',
                            words: ['cat', 'bat', 'hat', 'mat', 'sat', 'fat', 'rat', 'pat']
                        },
                        {
                            type: 'sentences',
                            title: 'Sentence Practice',
                            instructions: 'Practice /æ/ in connected speech',
                            sentences: [
                                'The cat sat on the mat.',
                                'Pat had a black hat.',
                                'The bat flew back to the cave.'
                            ]
                        }
                    ]
                },
                'i:': {
                    name: 'Long E Sound',
                    description: 'The /i:/ sound as in "bee"',
                    commonErrors: ['ɪ', 'eɪ'],
                    exercises: [
                        {
                            type: 'minimal_pairs',
                            title: 'Long vs Short I',
                            instructions: 'Distinguish /i:/ from /ɪ/',
                            pairs: [
                                { target: 'sheep', contrast: 'ship', focus: '/i:/ vs /ɪ/' },
                                { target: 'beat', contrast: 'bit', focus: '/i:/ vs /ɪ/' },
                                { target: 'seat', contrast: 'sit', focus: '/i:/ vs /ɪ/' }
                            ]
                        }
                    ]
                }
            },
            consonants: {
                'θ': {
                    name: 'Voiceless TH',
                    description: 'The unvoiced /θ/ sound as in "think"',
                    commonErrors: ['s', 'f', 't'],
                    exercises: [
                        {
                            type: 'articulation',
                            title: 'Tongue Position',
                            instructions: 'Place tongue tip between teeth, blow air gently',
                            words: ['think', 'three', 'thin', 'thick', 'throw', 'thumb']
                        },
                        {
                            type: 'minimal_pairs',
                            title: 'TH vs S',
                            instructions: 'Distinguish /θ/ from /s/',
                            pairs: [
                                { target: 'think', contrast: 'sink', focus: '/θ/ vs /s/' },
                                { target: 'thick', contrast: 'sick', focus: '/θ/ vs /s/' },
                                { target: 'three', contrast: 'see', focus: '/θ/ vs /s/' }
                            ]
                        }
                    ]
                },
                'ð': {
                    name: 'Voiced TH',
                    description: 'The voiced /ð/ sound as in "this"',
                    commonErrors: ['d', 'z', 'v'],
                    exercises: [
                        {
                            type: 'articulation',
                            title: 'Voice with Tongue Position',
                            instructions: 'Place tongue between teeth, add voice/vibration',
                            words: ['this', 'that', 'these', 'those', 'they', 'then']
                        }
                    ]
                },
                'r': {
                    name: 'R Sound',
                    description: 'The English /r/ sound',
                    commonErrors: ['l', 'w'],
                    exercises: [
                        {
                            type: 'articulation',
                            title: 'Tongue Position for R',
                            instructions: 'Curl tongue tip back slightly, do not touch roof of mouth',
                            words: ['red', 'run', 'right', 'room', 'ready', 'really']
                        },
                        {
                            type: 'minimal_pairs',
                            title: 'R vs L',
                            instructions: 'Distinguish /r/ from /l/',
                            pairs: [
                                { target: 'right', contrast: 'light', focus: '/r/ vs /l/' },
                                { target: 'red', contrast: 'led', focus: '/r/ vs /l/' },
                                { target: 'rice', contrast: 'lice', focus: '/r/ vs /l/' }
                            ]
                        }
                    ]
                }
            },
            suprasegmental: {
                stress: {
                    name: 'Word Stress',
                    description: 'Placing emphasis on the correct syllable',
                    exercises: [
                        {
                            type: 'stress_patterns',
                            title: 'Two-Syllable Stress',
                            instructions: 'Practice stress on first vs second syllable',
                            words: [
                                { word: 'TEAcher', pattern: 'Xx', stressed: 1 },
                                { word: 'beTWEEN', pattern: 'xX', stressed: 2 },
                                { word: 'HAPpy', pattern: 'Xx', stressed: 1 }
                            ]
                        },
                        {
                            type: 'sentence_stress',
                            title: 'Sentence Stress',
                            instructions: 'Emphasize content words, reduce function words',
                            sentences: [
                                { text: 'I WANT to GO to the STORE', stressed: [1, 3, 6] },
                                { text: 'She IS a GOOD teachER', stressed: [2, 4, 5] }
                            ]
                        }
                    ]
                },
                rhythm: {
                    name: 'Speech Rhythm',
                    description: 'Natural timing and flow of speech',
                    exercises: [
                        {
                            type: 'rhythm_drills',
                            title: 'Syllable Timing',
                            instructions: 'Practice even syllable timing',
                            phrases: [
                                'da-da-da-da',
                                'BA-da-BA-da',
                                'ba-DA-ba-DA'
                            ]
                        }
                    ]
                },
                intonation: {
                    name: 'Intonation Patterns',
                    description: 'Pitch patterns for questions and statements',
                    exercises: [
                        {
                            type: 'question_intonation',
                            title: 'Rising Intonation',
                            instructions: 'Use rising pitch for yes/no questions',
                            questions: [
                                'Are you ready?',
                                'Is this correct?',
                                'Can you help me?'
                            ]
                        },
                        {
                            type: 'statement_intonation',
                            title: 'Falling Intonation',
                            instructions: 'Use falling pitch for statements',
                            statements: [
                                'I am ready.',
                                'This is correct.',
                                'I can help you.'
                            ]
                        }
                    ]
                }
            },
            clarity: {
                energy: {
                    name: 'Speech Clarity',
                    description: 'Clear, energetic articulation',
                    exercises: [
                        {
                            type: 'projection',
                            title: 'Voice Projection',
                            instructions: 'Speak clearly and loudly enough to be heard',
                            sentences: [
                                'Please speak clearly and distinctly.',
                                'Good pronunciation requires clear articulation.',
                                'Practice makes perfect pronunciation.'
                            ]
                        },
                        {
                            type: 'articulation',
                            title: 'Mouth Exercises',
                            instructions: 'Warm up your articulators',
                            exercises: [
                                'Exaggerate lip movements: /pa-pa-pa/, /ma-ma-ma/',
                                'Tongue twisters: "Red leather, yellow leather"',
                                'Open mouth wide: /a-a-a/, then close to /i-i-i/'
                            ]
                        }
                    ]
                }
            }
        };

        // Exercise difficulty progression
        this.difficultyLevels = {
            beginner: {
                focus: ['isolation', 'slow_repetition'],
                complexity: 'single_sounds'
            },
            intermediate: {
                focus: ['minimal_pairs', 'word_level'],
                complexity: 'sound_contrasts'
            },
            advanced: {
                focus: ['sentences', 'connected_speech'],
                complexity: 'discourse_level'
            }
        };
    }

    // Main method to generate exercises based on phonetic analysis
    generateExercises(phoneticAnalysis, userLevel) {
        const exercises = [];
        
        // Analyze results and identify problem areas
        const problemAreas = this.identifyProblemAreas(phoneticAnalysis);
        
        for (const problem of problemAreas) {
            const targetedExercises = this.createTargetedExercises(problem, userLevel);
            exercises.push(...targetedExercises);
        }

        // Sort by priority (most problematic areas first)
        exercises.sort((a, b) => b.priority - a.priority);
        
        return {
            summary: this.generateExerciseSummary(problemAreas),
            exercises: exercises.slice(0, 6), // Limit to 6 exercises per session
            estimatedTime: this.calculateEstimatedTime(exercises.slice(0, 6)),
            nextSession: this.planNextSession(problemAreas, exercises)
        };
    }

    identifyProblemAreas(analysis) {
        const problems = [];

        // Check vowel issues
        if (analysis.segmental?.vowels?.accuracy < 0.7) {
            for (const detail of analysis.segmental.vowels.details || []) {
                if (detail.accuracy < 0.7) {
                    problems.push({
                        type: 'vowel',
                        sound: detail.phoneme,
                        severity: 1 - detail.accuracy,
                        category: 'segmental',
                        issues: detail.issues || []
                    });
                }
            }
        }

        // Check consonant issues
        if (analysis.segmental?.consonants?.accuracy < 0.7) {
            for (const detail of analysis.segmental.consonants.details || []) {
                if (detail.accuracy < 0.7) {
                    problems.push({
                        type: 'consonant',
                        sound: detail.phoneme,
                        severity: 1 - detail.accuracy,
                        category: 'segmental',
                        issues: detail.issues || []
                    });
                }
            }
        }

        // Check suprasegmental issues
        if (analysis.suprasegmental?.stress?.accuracy < 0.7) {
            problems.push({
                type: 'stress',
                severity: 1 - analysis.suprasegmental.stress.accuracy,
                category: 'suprasegmental',
                issues: analysis.suprasegmental.stress.issues || []
            });
        }

        if (analysis.suprasegmental?.rhythm?.accuracy < 0.7) {
            problems.push({
                type: 'rhythm',
                severity: 1 - analysis.suprasegmental.rhythm.accuracy,
                category: 'suprasegmental',
                issues: analysis.suprasegmental.rhythm.issues || []
            });
        }

        if (analysis.suprasegmental?.intonation?.accuracy < 0.7) {
            problems.push({
                type: 'intonation',
                severity: 1 - analysis.suprasegmental.intonation.accuracy,
                category: 'suprasegmental',
                issues: analysis.suprasegmental.intonation.issues || []
            });
        }

        // Check clarity issues (low energy, poor articulation)
        if (analysis.overall < 60) {
            problems.push({
                type: 'energy',
                severity: (60 - analysis.overall) / 60,
                category: 'clarity',
                issues: ['Low speech energy', 'Unclear articulation']
            });
        }

        return problems;
    }

    createTargetedExercises(problem, userLevel) {
        const exercises = [];
        let exerciseData = null;

        // Find appropriate exercises for the problem
        if (problem.category === 'segmental') {
            if (problem.type === 'vowel') {
                exerciseData = this.exerciseDatabase.vowels[problem.sound];
            } else if (problem.type === 'consonant') {
                exerciseData = this.exerciseDatabase.consonants[problem.sound];
            }
        } else if (problem.category === 'suprasegmental') {
            exerciseData = this.exerciseDatabase.suprasegmental[problem.type];
        } else if (problem.category === 'clarity') {
            exerciseData = this.exerciseDatabase.clarity[problem.type];
        }

        if (!exerciseData) {
            // Create generic exercise if specific one not found
            return this.createGenericExercise(problem, userLevel);
        }

        // Create exercises based on user level and problem severity
        for (const exercise of exerciseData.exercises) {
            const adaptedExercise = this.adaptExerciseToLevel(exercise, userLevel, problem);
            adaptedExercise.targetSound = problem.sound || problem.type;
            adaptedExercise.priority = problem.severity;
            adaptedExercise.category = problem.category;
            adaptedExercise.estimatedTime = this.estimateExerciseTime(exercise);
            
            exercises.push(adaptedExercise);
        }

        return exercises;
    }

    adaptExerciseToLevel(exercise, userLevel, problem) {
        const adapted = { ...exercise };
        
        // Adjust difficulty based on user level
        if (userLevel === 'A1' || userLevel === 'A2') {
            // Beginner: Focus on individual sounds
            adapted.instructions = 'Start slowly. ' + adapted.instructions;
            if (adapted.type === 'minimal_pairs') {
                adapted.pairs = adapted.pairs.slice(0, 3); // Fewer pairs
            }
            if (adapted.words) {
                adapted.words = adapted.words.slice(0, 5); // Fewer words
            }
        } else if (userLevel === 'B1' || userLevel === 'B2') {
            // Intermediate: Add context
            adapted.instructions += ' Practice at normal speaking speed.';
        } else {
            // Advanced: Focus on fluency and naturalness
            adapted.instructions += ' Focus on natural, fluent production.';
            if (adapted.sentences) {
                adapted.sentences.push(...this.generateAdvancedSentences(problem));
            }
        }

        return adapted;
    }

    createGenericExercise(problem, userLevel) {
        return [{
            type: 'generic',
            title: `${problem.type} Practice`,
            instructions: `Focus on improving your ${problem.type} pronunciation`,
            targetSound: problem.sound || problem.type,
            priority: problem.severity,
            category: problem.category,
            estimatedTime: 5,
            exercises: problem.issues.map(issue => ({
                focus: issue,
                instruction: `Work on: ${issue}`
            }))
        }];
    }

    generateAdvancedSentences(problem) {
        const sentences = {
            'θ': [
                'Three things through thick and thin.',
                'The thoughtful thesis thoroughly tested theories.'
            ],
            'ð': [
                'They gather together in the weather.',
                'These rather smooth feathers feel soothing.'
            ],
            'r': [
                'Really red roses grow rapidly in rich soil.',
                'The rural railroad requires regular repairs.'
            ]
        };

        return sentences[problem.sound] || [
            `Practice ${problem.sound} in connected speech.`,
            `Focus on natural ${problem.sound} production.`
        ];
    }

    generateExerciseSummary(problemAreas) {
        const categories = {};
        problemAreas.forEach(problem => {
            if (!categories[problem.category]) {
                categories[problem.category] = [];
            }
            categories[problem.category].push(problem);
        });

        const summary = {
            totalIssues: problemAreas.length,
            categories: Object.keys(categories),
            priorities: problemAreas
                .sort((a, b) => b.severity - a.severity)
                .slice(0, 3)
                .map(p => ({
                    type: p.type,
                    sound: p.sound,
                    severity: Math.round(p.severity * 100)
                })),
            recommendation: this.generateRecommendation(problemAreas)
        };

        return summary;
    }

    generateRecommendation(problemAreas) {
        const sortedProblems = problemAreas.sort((a, b) => b.severity - a.severity);
        
        if (sortedProblems.length === 0) {
            return "Great job! Your pronunciation is very good. Keep practicing to maintain your skills.";
        }

        const topProblem = sortedProblems[0];
        let recommendation = '';

        if (topProblem.category === 'segmental') {
            recommendation = `Focus on ${topProblem.type} sounds, especially /${topProblem.sound}/. `;
        } else if (topProblem.category === 'suprasegmental') {
            recommendation = `Work on ${topProblem.type} patterns in your speech. `;
        } else {
            recommendation = `Improve speech clarity and articulation. `;
        }

        if (problemAreas.length > 3) {
            recommendation += "Consider working with a pronunciation coach for comprehensive improvement.";
        } else {
            recommendation += "Regular practice with these exercises will help you improve quickly.";
        }

        return recommendation;
    }

    calculateEstimatedTime(exercises) {
        return exercises.reduce((total, exercise) => total + (exercise.estimatedTime || 5), 0);
    }

    estimateExerciseTime(exercise) {
        const timeMap = {
            'minimal_pairs': 4,
            'isolation': 3,
            'sentences': 5,
            'articulation': 6,
            'stress_patterns': 7,
            'rhythm_drills': 5,
            'question_intonation': 4,
            'projection': 3
        };

        return timeMap[exercise.type] || 5;
    }

    planNextSession(problemAreas, currentExercises) {
        const unaddressed = problemAreas.slice(6); // Problems not covered in current session
        
        return {
            hasMore: unaddressed.length > 0,
            nextFocus: unaddressed.length > 0 ? unaddressed[0].type : 'review',
            suggestion: unaddressed.length > 0 
                ? `Next session: focus on ${unaddressed[0].type} sounds`
                : 'Next session: review and practice fluency'
        };
    }

    // Method to track progress and adapt exercises
    updateExerciseProgress(exerciseId, userPerformance) {
        // This would integrate with a progress tracking system
        // For now, return adaptive suggestions
        
        if (userPerformance.accuracy > 0.8) {
            return {
                status: 'mastered',
                suggestion: 'Move to more advanced exercises',
                nextLevel: 'increase_complexity'
            };
        } else if (userPerformance.accuracy > 0.6) {
            return {
                status: 'improving',
                suggestion: 'Continue practicing, add variation',
                nextLevel: 'add_context'
            };
        } else {
            return {
                status: 'needs_work',
                suggestion: 'Slow down, focus on accuracy first',
                nextLevel: 'simplify'
            };
        }
    }
}