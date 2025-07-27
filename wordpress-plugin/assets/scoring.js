// Scoring and grading logic
import { GRADE_THRESHOLDS, SCORING_WEIGHTS } from './cefrData.js';

export class ScoringEngine {
    constructor() {
        this.weights = SCORING_WEIGHTS;
        this.thresholds = GRADE_THRESHOLDS;
    }

    calculateScore(analysisData, duration, idealDuration) {
        const scores = {
            pronunciation: this.calculatePronunciationScore(analysisData.accuracy || 0),
            fluency: this.calculateFluencyScore(duration, idealDuration),
            completeness: this.calculateCompletenessScore(analysisData.transcription, analysisData.expectedText),
            clarity: this.calculateClarityScore(analysisData)
        };

        const compositeScore = Object.keys(scores).reduce((total, key) => {
            return total + (scores[key] * this.weights[key]);
        }, 0) * 100;

        return {
            individual: scores,
            composite: Math.round(compositeScore),
            grade: this.mapToGrade(compositeScore)
        };
    }

    calculatePronunciationScore(accuracy) {
        // Convert API accuracy (0-1) to score (0-1)
        return Math.max(0, Math.min(1, accuracy));
    }

    calculateFluencyScore(duration, idealDuration) {
        if (!duration || !idealDuration) return 0;
        
        const deviation = Math.abs(duration - idealDuration) / idealDuration;
        
        // Penalize both too fast and too slow
        if (deviation <= 0.1) return 1.0;      // Within 10% - perfect
        if (deviation <= 0.2) return 0.9;      // Within 20% - excellent  
        if (deviation <= 0.3) return 0.8;      // Within 30% - good
        if (deviation <= 0.5) return 0.6;      // Within 50% - fair
        if (deviation <= 0.7) return 0.4;      // Within 70% - poor
        
        return Math.max(0.1, 1 - deviation);   // Very poor but not zero
    }

    calculateCompletenessScore(transcription, expectedText) {
        if (!transcription || !expectedText) return 0.5; // Default for missing data
        
        // Simple word count comparison
        const transcribedWords = this.getWords(transcription);
        const expectedWords = this.getWords(expectedText);
        
        if (expectedWords.length === 0) return 0.5;
        
        const completeness = Math.min(1, transcribedWords.length / expectedWords.length);
        return completeness;
    }

    calculateClarityScore(analysisData) {
        // This would be enhanced with actual clarity metrics from the API
        // For now, use a combination of factors
        if (analysisData.isOffline) return 0.7; // Default for offline
        
        const accuracy = analysisData.accuracy || 0;
        const hasTranscription = analysisData.transcription && analysisData.transcription.length > 0;
        
        return (accuracy * 0.8) + (hasTranscription ? 0.2 : 0);
    }

    mapToGrade(compositeScore) {
        for (const [grade, threshold] of Object.entries(this.thresholds)) {
            if (compositeScore >= threshold) {
                return grade;
            }
        }
        return 'A1';
    }

    getGradeInfo(grade) {
        const info = {
            A1: { name: "Beginner", color: "#ff6b6b", description: "Basic pronunciation skills" },
            A2: { name: "Elementary", color: "#ffa726", description: "Developing pronunciation" },
            B1: { name: "Intermediate", color: "#ffeb3b", description: "Good pronunciation control" },
            B2: { name: "Upper Intermediate", color: "#8bc34a", description: "Strong pronunciation skills" },
            C1: { name: "Advanced", color: "#4caf50", description: "Excellent pronunciation" },
            C2: { name: "Proficient", color: "#2196f3", description: "Near-native pronunciation" }
        };
        
        return info[grade] || info.A1;
    }

    getWords(text) {
        return text.toLowerCase()
                  .replace(/[^\w\s]/g, '')
                  .split(/\s+/)
                  .filter(word => word.length > 0);
    }

    getDetailedFeedback(scores, grade) {
        const feedback = [];
        
        if (scores.individual.pronunciation < 0.7) {
            feedback.push("Focus on clear pronunciation of individual sounds");
        }
        if (scores.individual.fluency < 0.7) {
            feedback.push("Work on speaking at a natural pace");
        }
        if (scores.individual.completeness < 0.8) {
            feedback.push("Ensure you read the complete sentence");
        }
        if (scores.individual.clarity < 0.7) {
            feedback.push("Speak more clearly and distinctly");
        }

        if (feedback.length === 0) {
            feedback.push("Excellent work! Keep practicing to maintain your skills.");
        }

        return feedback;
    }
}