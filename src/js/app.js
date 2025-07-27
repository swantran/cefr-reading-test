// Main application logic
import { AudioRecorder } from './audioRecorder.js';
import { APIClient } from './apiClient.js';
import { ScoringEngine } from './scoring.js';
import { StorageManager } from './storage.js';
import { CEFR_LEVELS } from './cefrData.js';

class CEFRReadingTest {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.apiClient = new APIClient();
        this.scoringEngine = new ScoringEngine();
        this.storage = new StorageManager();
        
        this.currentLevel = 'A1';
        this.currentSentenceIndex = 0;
        this.isRecording = false;
        this.timer = null;
        this.recordingStartTime = null;
        this.isInitialized = false;
        this.settings = this.storage.getSettings();
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            await this.setupEventListeners();
            this.renderLevelSelector();
            this.renderTestArea();
            this.renderHistory();
            this.updateUI();
            
            // Check API health (non-blocking)
            this.apiClient.checkHealth()
                .then(isAPIOnline => {
                    if (!isAPIOnline) {
                        this.showNotification('API is offline. Using local analysis.', 'warning');
                    }
                })
                .catch(error => {
                    console.log('API health check failed (expected):', error);
                    this.showNotification('Working in offline mode', 'info');
                });
            
            this.isInitialized = true;
            console.log('CEFR Reading Test initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
    }

    setupEventListeners() {
        // Level selection - delegate from document
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target.id, e.target.className, e.target.tagName);
            
            if (e.target.closest('.level-card')) {
                const level = e.target.closest('.level-card').dataset.level;
                console.log('Level card clicked:', level);
                this.selectLevel(level);
            }
            
            // Recording controls - delegate from document
            if (e.target.id === 'startBtn' || e.target.closest('#startBtn')) {
                console.log('Start button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.startRecording();
                return;
            }
            if (e.target.id === 'stopBtn' || e.target.closest('#stopBtn')) {
                console.log('Stop button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.stopRecording();
                return;
            }
            if (e.target.id === 'retryBtn' || e.target.closest('#retryBtn')) {
                console.log('Retry button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.retryCurrentSentence();
                return;
            }
            if (e.target.id === 'nextBtn' || e.target.closest('#nextBtn')) {
                console.log('Next button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.nextSentence();
                return;
            }
            if (e.target.id === 'playAudioBtn' || e.target.closest('#playAudioBtn')) {
                console.log('Play audio button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.playRecordedAudio();
                return;
            }
        });

        // Keyboard shortcuts
        if (this.settings.enableKeyboardShortcuts) {
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        }

        // Settings and other controls - delegate from document
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportBtn' || e.target.closest('#exportBtn')) {
                e.preventDefault();
                this.exportResults();
            }
            if (e.target.id === 'clearHistoryBtn' || e.target.closest('#clearHistoryBtn')) {
                e.preventDefault();
                this.clearHistory();
            }
            if (e.target.id === 'themeToggle' || e.target.closest('#themeToggle')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Custom text upload - delegate from document
        document.addEventListener('dragover', (e) => {
            if (e.target.closest('#uploadArea')) {
                this.handleDragOver(e);
            }
        });
        
        document.addEventListener('drop', (e) => {
            if (e.target.closest('#uploadArea')) {
                this.handleFileDrop(e);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('#uploadArea')) {
                const fileInput = document.getElementById('fileInput');
                if (fileInput) fileInput.click();
            }
        });

        // Settings
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('setting-input')) {
                this.updateSettings();
            }
        });
    }

    renderLevelSelector() {
        const container = document.getElementById('levelSelector');
        if (!container) return;

        const html = `
            <h3>Choose Your Level</h3>
            <div class="level-grid">
                ${Object.entries(CEFR_LEVELS).map(([level, data]) => `
                    <div class="level-card ${level === this.currentLevel ? 'active' : ''}" 
                         data-level="${level}" 
                         tabindex="0"
                         role="button"
                         aria-pressed="${level === this.currentLevel}">
                        <h4>${level} - ${data.name}</h4>
                        <p>${data.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderTestArea() {
        const container = document.getElementById('testArea');
        if (!container) return;

        const levelData = CEFR_LEVELS[this.currentLevel];
        const sentence = levelData.sentences[this.currentSentenceIndex];
        const progress = ((this.currentSentenceIndex + 1) / levelData.sentences.length) * 100;

        const html = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div class="sentence-display" id="sentenceDisplay" role="main" aria-live="polite">
                <p class="sentence-text" id="sentenceText">${sentence.text}</p>
                <div class="sentence-info">
                    ${this.currentSentenceIndex + 1} / ${levelData.sentences.length}
                    ${this.settings.showTimer ? `• ~${sentence.idealDuration}s` : ''}
                </div>
            </div>

            <div class="recording-indicator" id="recordingIndicator">
                <div class="recording-dot"></div>
                <span>Recording...</span>
            </div>

            ${this.settings.showTimer ? `
                <div class="timer" id="timer" aria-live="polite">
                    <span id="timerDisplay">00:00</span>
                </div>
            ` : ''}

            <div class="controls">
                <button type="button" class="btn" id="startBtn" aria-describedby="startBtnDesc">
                    <span>🎤</span> Start Recording
                </button>
                <button type="button" class="btn btn-error" id="stopBtn" disabled aria-describedby="stopBtnDesc">
                    <span>⏹</span> Stop Recording
                </button>
                <button type="button" class="btn btn-secondary" id="retryBtn" style="display: none;">
                    <span>🔄</span> Retry
                </button>
                <button type="button" class="btn btn-success" id="nextBtn" style="display: none;">
                    <span>➡️</span> Next Sentence
                </button>
            </div>

            <div class="audio-playback" id="audioPlayback">
                <div class="audio-controls">
                    <button type="button" class="btn btn-secondary" id="playAudioBtn">
                        <span>🔊</span> Play Recording
                    </button>
                    <audio id="audioPlayer" controls style="margin-left: 1rem;"></audio>
                </div>
            </div>

            <div id="loadingIndicator" class="loading" style="display: none; justify-content: center; margin: 2rem 0;">
                <div class="spinner"></div>
                <span>Analyzing your pronunciation...</span>
            </div>

            <!-- Accessibility descriptions -->
            <div id="startBtnDesc" class="sr-only">Press spacebar or click to start recording your pronunciation</div>
            <div id="stopBtnDesc" class="sr-only">Press spacebar or click to stop recording</div>
        `;

        container.innerHTML = html;
        
        // Ensure event listeners work
        console.log('Test area rendered, buttons should be clickable');
        this.updateUI();
    }

    renderResults(analysisData, duration, sentence) {
        const container = document.getElementById('results');
        if (!container) return;

        const scores = this.scoringEngine.calculateScore(analysisData, duration, sentence.idealDuration);
        const gradeInfo = this.scoringEngine.getGradeInfo(scores.grade);
        const feedback = this.scoringEngine.getDetailedFeedback(scores, scores.grade);

        const html = `
            <div class="grade-display">
                <div class="grade-badge" style="background-color: ${gradeInfo.color}">
                    ${scores.grade}
                </div>
                <div class="grade-name">${gradeInfo.name}</div>
                <p class="grade-description">${gradeInfo.description}</p>
            </div>

            <div class="scores-grid">
                <div class="score-card">
                    <h4>Pronunciation</h4>
                    <p class="score-value">${Math.round(scores.individual.pronunciation * 100)}%</p>
                </div>
                <div class="score-card">
                    <h4>Fluency</h4>
                    <p class="score-value">${Math.round(scores.individual.fluency * 100)}%</p>
                </div>
                <div class="score-card">
                    <h4>Completeness</h4>
                    <p class="score-value">${Math.round(scores.individual.completeness * 100)}%</p>
                </div>
                <div class="score-card">
                    <h4>Overall Score</h4>
                    <p class="score-value">${scores.composite}%</p>
                </div>
            </div>

            <div class="feedback">
                <h4>Feedback & Suggestions</h4>
                <ul>
                    ${feedback.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>

            ${analysisData.isOffline ? `
                <div class="feedback">
                    <h4>⚠️ Offline Mode</h4>
                    <p>This analysis was performed locally. For more accurate results, ensure you have an internet connection.</p>
                </div>
            ` : ''}

            <div class="controls">
                <button class="btn btn-secondary" id="retryBtn">
                    <span>🔄</span> Try Again
                </button>
                <button class="btn btn-success" id="nextBtn">
                    <span>➡️</span> Next Sentence
                </button>
            </div>
        `;

        container.innerHTML = html;
        container.classList.add('show');

        // Save result to history
        const testResult = {
            level: this.currentLevel,
            sentence: sentence.text,
            scores,
            grade: scores.grade,
            duration,
            idealDuration: sentence.idealDuration,
            isOffline: analysisData.isOffline || false
        };

        this.storage.saveTestResult(testResult);
        this.updateProgressDisplay();
    }

    renderHistory() {
        const container = document.getElementById('historySection');
        if (!container) return;

        const recentResults = this.storage.getRecentResults(5);
        const progressData = this.storage.getProgressData();

        const html = `
            <h3>Recent Results</h3>
            ${recentResults.length === 0 ? `
                <p>No test results yet. Complete your first test to see your progress!</p>
            ` : `
                <div class="history-list">
                    ${recentResults.map(result => `
                        <div class="history-item">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${result.level}</strong> - ${result.grade}
                                    <span style="color: var(--text-secondary);">(${result.scores.composite}%)</span>
                                </div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    ${new Date(result.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                            <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                                "${result.sentence.substring(0, 50)}${result.sentence.length > 50 ? '...' : ''}"
                            </p>
                        </div>
                    `).join('')}
                </div>
            `}

            ${progressData ? `
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                    <h4>Progress Overview</h4>
                    <div class="scores-grid">
                        <div class="score-card">
                            <h4>Total Tests</h4>
                            <p class="score-value">${progressData.totalTests}</p>
                        </div>
                        <div class="score-card">
                            <h4>Average Score</h4>
                            <p class="score-value">${Math.round(progressData.averageScore)}%</p>
                        </div>
                        <div class="score-card">
                            <h4>Best Score</h4>
                            <p class="score-value">${progressData.bestScore}%</p>
                        </div>
                        <div class="score-card">
                            <h4>Current Level</h4>
                            <p class="score-value">${progressData.currentLevel}</p>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="controls" style="margin-top: 2rem;">
                <button class="btn btn-secondary" id="exportBtn">
                    <span>📄</span> Export Results
                </button>
                <button class="btn btn-warning" id="clearHistoryBtn">
                    <span>🗑</span> Clear History
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    async selectLevel(level) {
        if (this.isRecording) {
            this.showNotification('Please stop recording before changing levels', 'warning');
            return;
        }

        this.currentLevel = level;
        this.currentSentenceIndex = 0;
        this.renderLevelSelector();
        this.renderTestArea();
        this.hideResults();
        
        // Update URL without page reload
        history.pushState({ level }, '', `?level=${level}`);
    }

    async startRecording() {
        console.log('Start recording called');
        
        if (this.isRecording) {
            console.log('Already recording, returning');
            return;
        }

        try {
            console.log('Initializing audio recorder...');
            
            // Initialize audio recorder if needed
            if (!this.audioRecorder.stream) {
                await this.audioRecorder.initialize();
                console.log('Audio recorder initialized');
            }

            // Start recording
            console.log('Starting recording...');
            const recordingPromise = this.audioRecorder.startRecording();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Update UI
            this.updateRecordingState(true);
            this.startTimer();
            
            // Announce to screen readers
            this.announceToScreenReader('Recording started');
            console.log('Recording started successfully');

            // Wait for recording to complete
            await recordingPromise;
            
        } catch (error) {
            console.error('Recording failed:', error);
            this.showNotification(error.message || 'Failed to start recording. Please check microphone permissions.', 'error');
            this.updateRecordingState(false);
            this.isRecording = false;
        }
    }

    async stopRecording() {
        if (!this.isRecording) return;

        try {
            this.audioRecorder.stopRecording();
            this.isRecording = false;
            this.updateRecordingState(false);
            this.stopTimer();
            
            // Show loading state
            this.showLoading(true);
            
            // Get recorded audio data
            const audioData = this.audioRecorder.getRecordedAudio();
            const duration = audioData.duration;
            
            // Show audio playback if enabled
            if (this.settings.audioPlayback) {
                this.showAudioPlayback(audioData.url);
            }

            // Get current sentence
            const levelData = CEFR_LEVELS[this.currentLevel];
            const sentence = levelData.sentences[this.currentSentenceIndex];
            
            // Convert audio to base64 and analyze
            const base64Audio = await this.audioRecorder.convertToBase64(audioData.blob);
            
            let analysisData;
            try {
                analysisData = await this.apiClient.transcribeAudio(base64Audio, sentence.text);
            } catch (error) {
                console.warn('API analysis failed, using offline mode:', error);
                analysisData = this.apiClient.getMockAnalysis(duration, sentence.idealDuration);
                this.showNotification('Using offline analysis due to connection issues', 'warning');
            }

            // Show results
            this.renderResults(analysisData, duration, sentence);
            this.announceToScreenReader(`Analysis complete. Your grade is ${analysisData.grade || 'calculated'}`);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showNotification('Failed to analyze recording', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    retryCurrentSentence() {
        this.hideResults();
        this.hideAudioPlayback();
        this.updateUI();
    }

    nextSentence() {
        const levelData = CEFR_LEVELS[this.currentLevel];
        
        if (this.currentSentenceIndex < levelData.sentences.length - 1) {
            this.currentSentenceIndex++;
            this.renderTestArea();
            this.hideResults();
            this.hideAudioPlayback();
        } else {
            // Level completed
            this.showNotification(`Congratulations! You've completed all ${this.currentLevel} level sentences.`, 'success');
            this.currentSentenceIndex = 0;
            this.renderTestArea();
            this.hideResults();
        }
    }

    updateRecordingState(isRecording) {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const sentenceDisplay = document.getElementById('sentenceDisplay');
        const recordingIndicator = document.getElementById('recordingIndicator');

        if (startBtn) startBtn.disabled = isRecording;
        if (stopBtn) stopBtn.disabled = !isRecording;
        
        if (sentenceDisplay) {
            sentenceDisplay.classList.toggle('recording', isRecording);
        }
        
        if (recordingIndicator) {
            recordingIndicator.classList.toggle('active', isRecording);
        }
    }

    startTimer() {
        if (!this.settings.showTimer) return;
        
        this.timer = setInterval(() => {
            const elapsed = (Date.now() - this.recordingStartTime) / 1000;
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                const minutes = Math.floor(elapsed / 60);
                const seconds = Math.floor(elapsed % 60);
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 100);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    showAudioPlayback(audioUrl) {
        const container = document.getElementById('audioPlayback');
        const audioPlayer = document.getElementById('audioPlayer');
        
        if (container && audioPlayer) {
            audioPlayer.src = audioUrl;
            container.classList.add('show');
        }
    }

    hideAudioPlayback() {
        const container = document.getElementById('audioPlayback');
        if (container) {
            container.classList.remove('show');
        }
    }

    playRecordedAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && audioPlayer.src) {
            audioPlayer.play();
        }
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    hideResults() {
        const container = document.getElementById('results');
        if (container) {
            container.classList.remove('show');
        }
    }

    updateUI() {
        // Update any dynamic UI elements based on current state
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        // This would update any progress indicators
        // Implementation depends on specific UI requirements
    }

    handleKeyboardShortcuts(event) {
        // Prevent shortcuts when typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
                break;
            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.retryCurrentSentence();
                }
                break;
            case 'KeyN':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.nextSentence();
                }
                break;
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleFileDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        const textFile = files.find(file => file.type === 'text/plain');
        
        if (textFile) {
            this.loadCustomText(textFile);
        } else {
            this.showNotification('Please drop a text file (.txt)', 'warning');
        }
    }

    async loadCustomText(file) {
        try {
            const text = await file.text();
            const sentences = this.parseCustomText(text);
            
            if (sentences.length === 0) {
                this.showNotification('No valid sentences found in the file', 'warning');
                return;
            }

            // Create custom level
            CEFR_LEVELS['CUSTOM'] = {
                name: 'Custom Text',
                description: 'Your uploaded text',
                sentences: sentences
            };

            this.selectLevel('CUSTOM');
            this.showNotification(`Loaded ${sentences.length} sentences from your file`, 'success');
            
        } catch (error) {
            console.error('Failed to load custom text:', error);
            this.showNotification('Failed to load text file', 'error');
        }
    }

    parseCustomText(text) {
        // Split text into sentences and estimate ideal durations
        const sentences = text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10) // Minimum sentence length
            .map(text => ({
                text,
                idealDuration: Math.max(3, Math.min(15, text.split(' ').length * 0.6)) // Rough estimate
            }));
            
        return sentences.slice(0, 10); // Limit to 10 sentences
    }

    exportResults() {
        try {
            const data = this.storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `cefr-test-results-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Results exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Failed to export results', 'error');
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all test history? This cannot be undone.')) {
            this.storage.clearHistory();
            this.renderHistory();
            this.showNotification('History cleared', 'success');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        this.settings.theme = newTheme;
        this.storage.saveSettings(this.settings);
    }

    updateSettings() {
        const inputs = document.querySelectorAll('.setting-input');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                this.settings[input.name] = input.checked;
            } else {
                this.settings[input.name] = input.value;
            }
        });
        
        this.storage.saveSettings(this.settings);
        this.showNotification('Settings updated', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Cleanup when page unloads
    cleanup() {
        this.audioRecorder.cleanup();
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cefrApp = new CEFRReadingTest();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.cefrApp) {
        window.cefrApp.cleanup();
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.level && window.cefrApp) {
        window.cefrApp.selectLevel(event.state.level);
    }
});

export { CEFRReadingTest };