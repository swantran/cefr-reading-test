// Local storage and data persistence
export class StorageManager {
    constructor() {
        this.storageKey = 'cefrReadingTest';
        this.maxResults = 50; // Keep last 50 test results
    }

    saveTestResult(result) {
        try {
            const results = this.getTestHistory();
            
            const testResult = {
                id: this.generateId(),
                timestamp: Date.now(),
                date: new Date().toISOString(),
                level: result.level,
                sentence: result.sentence,
                scores: result.scores,
                grade: result.grade,
                duration: result.duration,
                idealDuration: result.idealDuration,
                isOffline: result.isOffline || false
            };

            results.unshift(testResult);
            
            // Keep only the most recent results
            if (results.length > this.maxResults) {
                results.splice(this.maxResults);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(results));
            return testResult.id;
        } catch (error) {
            console.error('Failed to save test result:', error);
            return null;
        }
    }

    getTestHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load test history:', error);
            return [];
        }
    }

    getRecentResults(count = 10) {
        const history = this.getTestHistory();
        return history.slice(0, count);
    }

    getResultsByLevel(level) {
        const history = this.getTestHistory();
        return history.filter(result => result.level === level);
    }

    getProgressData() {
        const history = this.getTestHistory();
        
        if (history.length === 0) return null;

        // Calculate average scores by level
        const byLevel = {};
        history.forEach(result => {
            if (!byLevel[result.level]) {
                byLevel[result.level] = [];
            }
            byLevel[result.level].push(result.scores.composite);
        });

        // Calculate trends
        const recent = history.slice(0, 10);
        const older = history.slice(10, 20);
        
        const recentAvg = recent.length > 0 ? 
            recent.reduce((sum, r) => sum + r.scores.composite, 0) / recent.length : 0;
        const olderAvg = older.length > 0 ? 
            older.reduce((sum, r) => sum + r.scores.composite, 0) / older.length : 0;

        return {
            totalTests: history.length,
            averageScore: recentAvg,
            improvement: recentAvg - olderAvg,
            byLevel,
            recentResults: recent,
            bestScore: Math.max(...history.map(r => r.scores.composite)),
            currentLevel: this.getCurrentLevel(history)
        };
    }

    getCurrentLevel(history) {
        if (history.length === 0) return 'A1';
        
        // Find the highest level with consistent good performance
        const recent = history.slice(0, 5);
        const levelCounts = {};
        
        recent.forEach(result => {
            if (result.scores.composite >= 70) { // Good performance threshold
                levelCounts[result.level] = (levelCounts[result.level] || 0) + 1;
            }
        });

        // Return the highest level with at least 2 good performances
        const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'];
        for (const level of levels) {
            if ((levelCounts[level] || 0) >= 2) {
                return level;
            }
        }
        
        return 'A1';
    }

    exportData() {
        const data = {
            testHistory: this.getTestHistory(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.testHistory && Array.isArray(data.testHistory)) {
                localStorage.setItem(this.storageKey, JSON.stringify(data.testHistory));
                return true;
            }
            throw new Error('Invalid data format');
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Settings management
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKey + '_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    getSettings() {
        try {
            const data = localStorage.getItem(this.storageKey + '_settings');
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            autoAdvance: false,
            showTimer: true,
            enableKeyboardShortcuts: true,
            audioPlayback: true,
            theme: 'light',
            language: 'en'
        };
    }
}