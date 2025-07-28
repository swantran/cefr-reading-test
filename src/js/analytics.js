// Advanced Analytics Engine for CEFR Reading Test
import { CEFR_LEVELS, GRADE_THRESHOLDS } from './cefrData.js';

export class AnalyticsEngine {
    constructor(storageManager) {
        this.storage = storageManager;
        this.learningPatterns = this.initializeLearningPatterns();
    }

    initializeLearningPatterns() {
        return {
            streakThreshold: 3, // Days in a row for streak
            masteryThreshold: 85, // Score needed for mastery
            strugglingThreshold: 60, // Below this needs help
            improvementWindow: 7, // Days to measure improvement
            consistencyVariance: 15 // Max variance for consistency
        };
    }

    // === CORE ANALYTICS ===
    
    getComprehensiveAnalytics() {
        const history = this.storage.getTestHistory();
        if (history.length === 0) return this.getEmptyAnalytics();

        return {
            overview: this.getOverviewMetrics(history),
            performance: this.getPerformanceAnalytics(history),
            learning: this.getLearningAnalytics(history),
            skills: this.getSkillBreakdown(history),
            progress: this.getProgressTrends(history),
            insights: this.generateInsights(history),
            recommendations: this.getRecommendations(history)
        };
    }

    getOverviewMetrics(history) {
        const totalTests = history.length;
        const recentTests = history.slice(0, 10);
        const allScores = history.map(h => h.scores.composite);
        
        return {
            totalTests,
            averageScore: this.calculateAverage(allScores),
            bestScore: Math.max(...allScores),
            recentAverage: this.calculateAverage(recentTests.map(t => t.scores.composite)),
            currentStreak: this.calculateStreak(history),
            timeSpent: this.calculateTotalTime(history),
            levelsAttempted: [...new Set(history.map(h => h.level))].length,
            lastTest: history[0]?.timestamp || null
        };
    }

    getPerformanceAnalytics(history) {
        const byLevel = this.groupByLevel(history);
        const byGrade = this.groupByGrade(history);
        const recentPerformance = this.getRecentPerformance(history);
        
        return {
            levelPerformance: this.analyzeLevelPerformance(byLevel),
            gradeDistribution: this.analyzeGradeDistribution(byGrade),
            difficultyProgression: this.analyzeDifficultyProgression(history),
            consistencyScore: this.calculateConsistency(history),
            improvementRate: this.calculateImprovementRate(history),
            recentTrend: recentPerformance
        };
    }

    getLearningAnalytics(history) {
        return {
            learningVelocity: this.calculateLearningVelocity(history),
            masteredSkills: this.identifyMasteredSkills(history),
            strugglingAreas: this.identifyStrugglingAreas(history),
            optimalPracticeTime: this.calculateOptimalPracticeTime(history),
            readinessForNextLevel: this.assessReadinessForNextLevel(history),
            learningStyle: this.identifyLearningStyle(history)
        };
    }

    getSkillBreakdown(history) {
        const skills = ['pronunciation', 'fluency', 'completeness', 'clarity'];
        const breakdown = {};
        
        skills.forEach(skill => {
            const scores = history.map(h => h.scores.individual[skill] * 100);
            breakdown[skill] = {
                current: scores[0] || 0,
                average: this.calculateAverage(scores),
                trend: this.calculateTrend(scores.slice(0, 10)),
                improvement: this.calculateImprovement(scores),
                consistency: this.calculateConsistency(scores)
            };
        });
        
        return breakdown;
    }

    getProgressTrends(history) {
        const last30Days = this.getResultsInLastDays(history, 30);
        const last7Days = this.getResultsInLastDays(history, 7);
        
        return {
            daily: this.getDailyProgress(last30Days),
            weekly: this.getWeeklyProgress(history),
            monthly: this.getMonthlyProgress(history),
            recent: this.getRecentProgress(last7Days),
            milestones: this.identifyMilestones(history)
        };
    }

    generateInsights(history) {
        const insights = [];
        
        // Performance insights
        if (this.isImproving(history)) {
            insights.push({
                type: 'positive',
                category: 'progress',
                title: 'Steady Improvement Detected',
                message: 'Your scores have been consistently improving over recent tests.',
                confidence: 0.85
            });
        }

        // Skill-specific insights
        const skillBreakdown = this.getSkillBreakdown(history);
        const weakestSkill = this.findWeakestSkill(skillBreakdown);
        const strongestSkill = this.findStrongestSkill(skillBreakdown);

        if (weakestSkill) {
            insights.push({
                type: 'improvement',
                category: 'skills',
                title: `Focus on ${weakestSkill.charAt(0).toUpperCase() + weakestSkill.slice(1)}`,
                message: `Your ${weakestSkill} scores are below your other skills. Targeted practice could help.`,
                confidence: 0.7
            });
        }

        if (strongestSkill) {
            insights.push({
                type: 'positive',
                category: 'skills',
                title: `Strong ${strongestSkill.charAt(0).toUpperCase() + strongestSkill.slice(1)}`,
                message: `Your ${strongestSkill} skills are excellent! This is a real strength.`,
                confidence: 0.8
            });
        }

        // Level readiness insights
        const readiness = this.assessReadinessForNextLevel(history);
        if (readiness.ready) {
            insights.push({
                type: 'achievement',
                category: 'progression',
                title: 'Ready for Next Level',
                message: `Based on your performance, you're ready to try ${readiness.nextLevel} level tests.`,
                confidence: readiness.confidence
            });
        }

        return insights;
    }

    getRecommendations(history) {
        const recommendations = [];
        const skillBreakdown = this.getSkillBreakdown(history);
        const performance = this.getPerformanceAnalytics(history);
        
        // Practice frequency recommendations
        const lastTest = history[0];
        const daysSinceLastTest = lastTest ? 
            Math.floor((Date.now() - lastTest.timestamp) / (1000 * 60 * 60 * 24)) : 0;
        
        if (daysSinceLastTest > 3) {
            recommendations.push({
                type: 'practice',
                priority: 'high',
                title: 'Resume Regular Practice',
                description: 'Consistent practice is key to improvement. Try to practice daily.',
                actionable: true,
                action: 'Take a practice test now'
            });
        }

        // Skill-specific recommendations
        Object.entries(skillBreakdown).forEach(([skill, data]) => {
            if (data.average < this.learningPatterns.strugglingThreshold) {
                recommendations.push({
                    type: 'skill-improvement',
                    priority: 'medium',
                    title: `Improve ${skill.charAt(0).toUpperCase() + skill.slice(1)}`,
                    description: this.getSkillImprovementTip(skill),
                    actionable: true,
                    action: `Focus on ${skill} exercises`
                });
            }
        });

        // Level progression recommendations
        if (performance.consistencyScore > 0.8) {
            const currentLevel = this.getCurrentDominantLevel(history);
            const nextLevel = this.getNextLevel(currentLevel);
            if (nextLevel) {
                recommendations.push({
                    type: 'progression',
                    priority: 'medium',
                    title: `Try ${nextLevel} Level`,
                    description: 'Your performance is consistent. Time to challenge yourself!',
                    actionable: true,
                    action: `Switch to ${nextLevel} level`
                });
            }
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // === HELPER METHODS ===

    calculateAverage(scores) {
        if (scores.length === 0) return 0;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    calculateStreak(history) {
        let streak = 0;
        let lastDate = null;
        
        for (const result of history) {
            const testDate = new Date(result.timestamp).toDateString();
            if (lastDate && testDate !== lastDate) {
                const dayDiff = Math.floor((new Date(lastDate) - new Date(testDate)) / (1000 * 60 * 60 * 24));
                if (dayDiff > 1) break;
            }
            if (!lastDate || testDate !== lastDate) {
                streak++;
                lastDate = testDate;
            }
        }
        
        return streak;
    }

    calculateTotalTime(history) {
        return history.reduce((total, result) => total + (result.duration || 0), 0);
    }

    groupByLevel(history) {
        return history.reduce((groups, result) => {
            if (!groups[result.level]) groups[result.level] = [];
            groups[result.level].push(result);
            return groups;
        }, {});
    }

    groupByGrade(history) {
        return history.reduce((groups, result) => {
            if (!groups[result.grade]) groups[result.grade] = [];
            groups[result.grade].push(result);
            return groups;
        }, {});
    }

    analyzeLevelPerformance(byLevel) {
        const performance = {};
        Object.entries(byLevel).forEach(([level, tests]) => {
            const scores = tests.map(t => t.scores.composite);
            performance[level] = {
                attempts: tests.length,
                averageScore: this.calculateAverage(scores),
                bestScore: Math.max(...scores),
                lastAttempt: tests[0].timestamp,
                masteryLevel: this.calculateMasteryLevel(scores)
            };
        });
        return performance;
    }

    calculateMasteryLevel(scores) {
        const recentScores = scores.slice(0, 3);
        const averageRecent = this.calculateAverage(recentScores);
        
        if (averageRecent >= this.learningPatterns.masteryThreshold) return 'mastered';
        if (averageRecent >= this.learningPatterns.strugglingThreshold) return 'proficient';
        return 'developing';
    }

    isImproving(history) {
        if (history.length < 5) return false;
        
        const recent = history.slice(0, 5).map(h => h.scores.composite);
        const older = history.slice(5, 10).map(h => h.scores.composite);
        
        const recentAvg = this.calculateAverage(recent);
        const olderAvg = this.calculateAverage(older);
        
        return recentAvg > olderAvg + 5; // 5 point improvement threshold
    }

    findWeakestSkill(skillBreakdown) {
        let weakest = null;
        let lowestScore = 100;
        
        Object.entries(skillBreakdown).forEach(([skill, data]) => {
            if (data.average < lowestScore) {
                lowestScore = data.average;
                weakest = skill;
            }
        });
        
        return weakest;
    }

    findStrongestSkill(skillBreakdown) {
        let strongest = null;
        let highestScore = 0;
        
        Object.entries(skillBreakdown).forEach(([skill, data]) => {
            if (data.average > highestScore) {
                highestScore = data.average;
                strongest = skill;
            }
        });
        
        return strongest;
    }

    getSkillImprovementTip(skill) {
        const tips = {
            pronunciation: 'Practice with native speaker audio and focus on individual phonemes',
            fluency: 'Work on speaking rhythm and natural pace - not too fast or slow',
            completeness: 'Ensure you read every word clearly and completely',
            clarity: 'Speak distinctly and minimize background noise during recording'
        };
        return tips[skill] || 'Focus on consistent practice and feedback';
    }

    assessReadinessForNextLevel(history) {
        const currentLevel = this.getCurrentDominantLevel(history);
        const nextLevel = this.getNextLevel(currentLevel);
        
        if (!nextLevel) return { ready: false, confidence: 0 };
        
        const currentLevelTests = history.filter(h => h.level === currentLevel).slice(0, 5);
        if (currentLevelTests.length < 3) return { ready: false, confidence: 0 };
        
        const averageScore = this.calculateAverage(currentLevelTests.map(t => t.scores.composite));
        const consistency = this.calculateConsistency(currentLevelTests.map(t => t.scores.composite));
        
        const ready = averageScore >= this.learningPatterns.masteryThreshold && consistency > 0.7;
        const confidence = Math.min(0.95, (averageScore / 100) * consistency);
        
        return { ready, nextLevel, confidence, currentAverage: averageScore };
    }

    getCurrentDominantLevel(history) {
        if (history.length === 0) return 'A1';
        
        const recentTests = history.slice(0, 10);
        const levelCounts = recentTests.reduce((counts, test) => {
            counts[test.level] = (counts[test.level] || 0) + 1;
            return counts;
        }, {});
        
        return Object.keys(levelCounts).reduce((a, b) => 
            levelCounts[a] > levelCounts[b] ? a : b
        );
    }

    getNextLevel(currentLevel) {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
    }

    calculateConsistency(scores) {
        if (scores.length < 2) return 0;
        
        const mean = this.calculateAverage(scores);
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Convert to consistency score (0-1, where 1 is perfect consistency)
        return Math.max(0, 1 - (standardDeviation / 50));
    }

    calculateTrend(scores) {
        if (scores.length < 2) return 0;
        
        // Simple linear regression slope
        const n = scores.length;
        const x = Array.from({length: n}, (_, i) => i);
        const meanX = this.calculateAverage(x);
        const meanY = this.calculateAverage(scores);
        
        const numerator = scores.reduce((sum, y, i) => sum + (x[i] - meanX) * (y - meanY), 0);
        const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateImprovement(scores) {
        if (scores.length < 4) return 0;
        
        const recent = scores.slice(0, 2);
        const older = scores.slice(-2);
        
        return this.calculateAverage(recent) - this.calculateAverage(older);
    }

    getEmptyAnalytics() {
        return {
            overview: { totalTests: 0, averageScore: 0, bestScore: 0 },
            performance: { levelPerformance: {}, consistencyScore: 0 },
            learning: { masteredSkills: [], strugglingAreas: [] },
            skills: {},
            progress: { daily: [], weekly: [], monthly: [] },
            insights: [],
            recommendations: [{
                type: 'practice',
                priority: 'high',
                title: 'Take Your First Test',
                description: 'Start your learning journey with a pronunciation test',
                actionable: true,
                action: 'Begin assessment'
            }]
        };
    }

    // === TEACHER DASHBOARD METHODS ===
    
    getTeacherDashboardData(studentIds = []) {
        // This will be used for the teacher dashboard
        return {
            classOverview: this.getClassOverview(studentIds),
            studentProgress: this.getStudentProgress(studentIds),
            needsAttention: this.getStudentsNeedingAttention(studentIds),
            achievements: this.getRecentAchievements(studentIds)
        };
    }
}