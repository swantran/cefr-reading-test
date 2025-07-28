// Adaptive Testing Engine for CEFR Level Placement
import { CEFR_LEVELS } from './cefrData.js';

export class AdaptiveTestingEngine {
    constructor(storageManager) {
        this.storage = storageManager;
        this.levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        this.thresholds = {
            advancement: 75,    // Score needed to advance to next level
            mastery: 85,       // Score indicating mastery of current level
            struggle: 60,      // Score indicating difficulty at current level
            minAttempts: 3,    // Minimum attempts per level before advancement
            maxAttempts: 5     // Maximum attempts per level before forced progression
        };
        this.currentAssessment = this.initializeAssessment();
    }

    initializeAssessment() {
        // Check if there's an ongoing assessment
        const saved = this.storage.getSettings().currentAssessment;
        if (saved && this.isValidAssessment(saved)) {
            return saved;
        }

        // Start new assessment
        return {
            id: this.generateAssessmentId(),
            startTime: Date.now(),
            currentLevel: 'A1',
            currentSentenceIndex: 0,
            levelAttempts: {},
            levelScores: {},
            isPlacementTest: true,
            placementComplete: false,
            assignedLevel: null,
            assessmentHistory: []
        };
    }

    isValidAssessment(assessment) {
        return assessment && 
               assessment.id && 
               !assessment.placementComplete &&
               (Date.now() - assessment.startTime) < (24 * 60 * 60 * 1000); // Valid for 24 hours
    }

    generateAssessmentId() {
        return 'assess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // === MAIN ASSESSMENT FLOW ===

    startPlacementTest() {
        this.currentAssessment = {
            id: this.generateAssessmentId(),
            startTime: Date.now(),
            currentLevel: 'A1',
            currentSentenceIndex: 0,
            levelAttempts: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
            levelScores: { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] },
            isPlacementTest: true,
            placementComplete: false,
            assignedLevel: null,
            assessmentHistory: []
        };

        this.saveAssessment();
        return {
            level: 'A1',
            sentenceIndex: 0,
            isPlacementTest: true,
            instructions: 'Welcome to the CEFR Placement Test. We\'ll start with basic level and automatically adjust based on your performance.'
        };
    }

    processTestResult(result) {
        const level = this.currentAssessment.currentLevel;
        const score = result.scores.composite;

        // Record the result
        this.currentAssessment.levelScores[level].push(score);
        this.currentAssessment.levelAttempts[level]++;
        this.currentAssessment.assessmentHistory.push({
            level,
            sentenceIndex: this.currentAssessment.currentSentenceIndex,
            score,
            timestamp: Date.now(),
            result
        });

        const decision = this.makeProgressionDecision(level, score);
        
        // Update current position
        if (decision.action === 'advance_level') {
            this.currentAssessment.currentLevel = decision.nextLevel;
            this.currentAssessment.currentSentenceIndex = 0;
        } else if (decision.action === 'next_sentence') {
            this.currentAssessment.currentSentenceIndex++;
            
            // Check if we've completed all sentences at this level
            const levelData = CEFR_LEVELS[level];
            if (this.currentAssessment.currentSentenceIndex >= levelData.sentences.length) {
                // Force level progression after completing all sentences
                const forceDecision = this.forceProgression(level);
                if (forceDecision.action === 'advance_level') {
                    this.currentAssessment.currentLevel = forceDecision.nextLevel;
                    this.currentAssessment.currentSentenceIndex = 0;
                } else if (forceDecision.action === 'complete_assessment') {
                    this.currentAssessment.placementComplete = true;
                    this.currentAssessment.assignedLevel = forceDecision.assignedLevel;
                }
            }
        } else if (decision.action === 'complete_assessment') {
            this.currentAssessment.placementComplete = true;
            this.currentAssessment.assignedLevel = decision.assignedLevel;
        }

        this.saveAssessment();
        return decision;
    }

    makeProgressionDecision(currentLevel, latestScore) {
        const levelIndex = this.levels.indexOf(currentLevel);
        const scores = this.currentAssessment.levelScores[currentLevel];
        const attempts = this.currentAssessment.levelAttempts[currentLevel];
        
        // Calculate average and recent performance
        const averageScore = this.calculateAverage(scores);
        const recentScores = scores.slice(-2); // Last 2 attempts
        const recentAverage = this.calculateAverage(recentScores);

        // Check for advancement conditions
        if (this.shouldAdvanceLevel(currentLevel, averageScore, recentAverage, attempts)) {
            const nextLevel = this.getNextLevel(currentLevel);
            if (nextLevel) {
                return {
                    action: 'advance_level',
                    nextLevel,
                    reason: `Strong performance (avg: ${Math.round(averageScore)}%) indicates readiness for ${nextLevel}`,
                    feedback: `Excellent work! Moving to ${nextLevel} level.`,
                    currentLevel,
                    averageScore: Math.round(averageScore)
                };
            } else {
                // Reached highest level
                return {
                    action: 'complete_assessment',
                    assignedLevel: currentLevel,
                    reason: `Excellent performance at highest level`,
                    feedback: `Outstanding! You've demonstrated ${currentLevel} level proficiency.`,
                    finalScore: Math.round(averageScore)
                };
            }
        }

        // Check for completion at current level
        if (this.shouldCompleteAtLevel(currentLevel, averageScore, attempts)) {
            return {
                action: 'complete_assessment',
                assignedLevel: currentLevel,
                reason: `Consistent performance indicates ${currentLevel} level`,
                feedback: `Assessment complete. Your CEFR level is ${currentLevel}.`,
                finalScore: Math.round(averageScore)
            };
        }

        // Continue at current level
        return {
            action: 'next_sentence',
            currentLevel,
            reason: `Continuing ${currentLevel} assessment`,
            feedback: this.getEncouragementFeedback(latestScore, averageScore),
            progress: {
                attemptsAtLevel: attempts,
                averageScore: Math.round(averageScore),
                needsMoreData: attempts < this.thresholds.minAttempts
            }
        };
    }

    shouldAdvanceLevel(level, averageScore, recentAverage, attempts) {
        // Need minimum attempts
        if (attempts < this.thresholds.minAttempts) return false;

        // Strong recent performance
        if (recentAverage >= this.thresholds.mastery && averageScore >= this.thresholds.advancement) {
            return true;
        }

        // Consistent high performance over time
        if (attempts >= this.thresholds.maxAttempts && averageScore >= this.thresholds.advancement) {
            return true;
        }

        return false;
    }

    shouldCompleteAtLevel(level, averageScore, attempts) {
        // Completed enough attempts and score indicates this is appropriate level
        if (attempts >= this.thresholds.minAttempts) {
            // Score is good but not high enough for advancement
            if (averageScore >= this.thresholds.struggle && averageScore < this.thresholds.advancement) {
                return true;
            }

            // Maximum attempts reached
            if (attempts >= this.thresholds.maxAttempts) {
                return true;
            }
        }

        return false;
    }

    forceProgression(level) {
        const averageScore = this.calculateAverage(this.currentAssessment.levelScores[level]);
        
        if (averageScore >= this.thresholds.advancement) {
            const nextLevel = this.getNextLevel(level);
            if (nextLevel) {
                return {
                    action: 'advance_level',
                    nextLevel,
                    reason: 'Completed all sentences with good performance'
                };
            }
        }

        return {
            action: 'complete_assessment',
            assignedLevel: level,
            reason: 'Assessment complete'
        };
    }

    getEncouragementFeedback(latestScore, averageScore) {
        if (latestScore >= 85) {
            return "Excellent pronunciation! Keep up the great work.";
        } else if (latestScore >= 75) {
            return "Good performance! You're making steady progress.";
        } else if (latestScore >= 60) {
            return "Making progress. Focus on clear pronunciation.";
        } else {
            return "Keep practicing! Take your time with each word.";
        }
    }

    // === HELPER METHODS ===

    calculateAverage(scores) {
        if (scores.length === 0) return 0;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    getNextLevel(currentLevel) {
        const currentIndex = this.levels.indexOf(currentLevel);
        return currentIndex < this.levels.length - 1 ? this.levels[currentIndex + 1] : null;
    }

    getPreviousLevel(currentLevel) {
        const currentIndex = this.levels.indexOf(currentLevel);
        return currentIndex > 0 ? this.levels[currentIndex - 1] : null;
    }

    getCurrentTestInfo() {
        if (!this.currentAssessment || this.currentAssessment.placementComplete) {
            return null;
        }

        const level = this.currentAssessment.currentLevel;
        const levelData = CEFR_LEVELS[level];
        const sentenceIndex = this.currentAssessment.currentSentenceIndex;

        return {
            level,
            sentenceIndex,
            sentence: levelData.sentences[sentenceIndex],
            isPlacementTest: this.currentAssessment.isPlacementTest,
            progress: {
                currentLevel: level,
                attemptsAtLevel: this.currentAssessment.levelAttempts[level],
                averageAtLevel: Math.round(this.calculateAverage(this.currentAssessment.levelScores[level])),
                totalSentences: levelData.sentences.length,
                levelProgress: `${this.currentAssessment.levelAttempts[level]} attempts at ${level}`
            }
        };
    }

    getAssessmentSummary() {
        if (!this.currentAssessment.placementComplete) {
            return null;
        }

        const summary = {
            assessmentId: this.currentAssessment.id,
            assignedLevel: this.currentAssessment.assignedLevel,
            duration: Date.now() - this.currentAssessment.startTime,
            totalAttempts: Object.values(this.currentAssessment.levelAttempts).reduce((sum, attempts) => sum + attempts, 0),
            levelPerformance: {},
            recommendations: this.generateRecommendations()
        };

        // Calculate performance at each attempted level
        this.levels.forEach(level => {
            const scores = this.currentAssessment.levelScores[level];
            if (scores.length > 0) {
                summary.levelPerformance[level] = {
                    attempts: this.currentAssessment.levelAttempts[level],
                    averageScore: Math.round(this.calculateAverage(scores)),
                    bestScore: Math.max(...scores),
                    consistency: this.calculateConsistency(scores)
                };
            }
        });

        return summary;
    }

    calculateConsistency(scores) {
        if (scores.length < 2) return 1;
        
        const mean = this.calculateAverage(scores);
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);
        
        return Math.max(0, 1 - (standardDeviation / 50));
    }

    generateRecommendations() {
        const assignedLevel = this.currentAssessment.assignedLevel;
        const performance = this.currentAssessment.levelScores[assignedLevel];
        const averageScore = this.calculateAverage(performance);

        const recommendations = [];

        if (averageScore >= 85) {
            recommendations.push({
                type: 'advancement',
                message: `Consider challenging yourself with ${this.getNextLevel(assignedLevel)} level content for continued growth.`
            });
        } else if (averageScore >= 70) {
            recommendations.push({
                type: 'consolidation',
                message: `Focus on consistent practice at ${assignedLevel} level to build confidence.`
            });
        } else {
            recommendations.push({
                type: 'reinforcement',
                message: `Practice more with ${assignedLevel} level content and consider reviewing ${this.getPreviousLevel(assignedLevel)} level basics.`
            });
        }

        return recommendations;
    }

    // === PERSISTENCE ===

    saveAssessment() {
        const settings = this.storage.getSettings();
        settings.currentAssessment = this.currentAssessment;
        this.storage.saveSettings(settings);
    }

    clearAssessment() {
        const settings = this.storage.getSettings();
        delete settings.currentAssessment;
        this.storage.saveSettings(settings);
        this.currentAssessment = this.initializeAssessment();
    }

    // === PRACTICE MODE METHODS ===

    startPracticeMode(selectedLevel) {
        return {
            level: selectedLevel,
            sentenceIndex: 0,
            isPlacementTest: false,
            instructions: `Practice mode: ${selectedLevel} level selected. You can switch levels anytime.`
        };
    }

    hasCompletedPlacement() {
        const result = this.currentAssessment && this.currentAssessment.placementComplete;
        console.log('hasCompletedPlacement check:', {
            currentAssessment: this.currentAssessment,
            placementComplete: this.currentAssessment?.placementComplete,
            result
        });
        return result;
    }

    getAssignedLevel() {
        return this.hasCompletedPlacement() ? this.currentAssessment.assignedLevel : null;
    }
}