// Main application logic
import { AudioRecorder } from './audioRecorder.js';
import { APIClient } from './apiClient.js';
import { ScoringEngine } from './scoring.js';
import { StorageManager } from './storage.js';
import { CEFR_LEVELS } from './cefrData.js';
import { AnalyticsEngine } from './analytics.js';
import { AnalyticsDashboard } from './analyticsUI.js';
import { AdaptiveTestingEngine } from './adaptiveTesting.js';
import { ExemplarAudioManager } from './exemplarAudio.js';
import { PhoneticAnalysisEngine } from './phoneticAnalysis.js';

class CEFRReadingTest {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.apiClient = new APIClient();
        this.scoringEngine = new ScoringEngine();
        this.storage = new StorageManager();
        this.analytics = new AnalyticsEngine(this.storage);
        this.analyticsDashboard = null;
        this.adaptiveTesting = new AdaptiveTestingEngine(this.storage);
        this.exemplarAudio = new ExemplarAudioManager();
        this.phoneticAnalysis = new PhoneticAnalysisEngine();
        
        this.currentLevel = 'A1';
        this.currentSentenceIndex = 0;
        this.isRecording = false;
        this.timer = null;
        this.recordingStartTime = null;
        this.isInitialized = false;
        this.settings = this.storage.getSettings();
        this.currentView = 'test'; // 'test' or 'analytics'
        this.testMode = 'placement'; // 'placement' or 'practice'
        this.placementCompleted = this.adaptiveTesting.hasCompletedPlacement();
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            await this.setupEventListeners();
            this.renderNavigation();
            this.renderMainContent();
            this.updateUI();
            
            // Initialize analytics dashboard
            const analyticsContainer = document.getElementById('analyticsContainer');
            if (analyticsContainer) {
                this.analyticsDashboard = new AnalyticsDashboard(this.analytics, analyticsContainer);
            }
            
            // Preload exemplar audio for current level (non-blocking)
            if (this.currentLevel) {
                this.exemplarAudio.preloadExemplarsForLevel(this.currentLevel)
                    .catch(error => console.log('Non-critical: exemplar preload failed', error));
            }
            
            // Check API health once (non-blocking)
            console.log('Checking API health once...');
            this.apiClient.checkHealth()
                .then(isAPIOnline => {
                    console.log('API health check result:', isAPIOnline);
                    if (!isAPIOnline) {
                        console.log('API is offline, using local analysis');
                        this.showNotification('Working in offline mode', 'info');
                    }
                })
                .catch(error => {
                    console.log('API health check failed (expected for offline app):', error.message);
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
        console.log('Setting up event listeners...');
        
        // Use a simpler approach - delegate from document with better logic
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target.id, e.target.className, e.target.tagName);
            
            // Level selection
            if (e.target.closest('.level-card')) {
                const level = e.target.closest('.level-card').dataset.level;
                console.log('Level card clicked:', level);
                this.selectLevel(level);
                return;
            }
            
            // Check if click is on Start Recording button or its contents
            const startBtn = e.target.closest('#startBtn');
            if (startBtn) {
                console.log('Start button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.startRecording();
                return;
            }
            
            // Check other buttons using the same pattern
            const stopBtn = e.target.closest('#stopBtn');
            if (stopBtn) {
                console.log('Stop button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.stopRecording();
                return;
            }
            
            const retryBtn = e.target.closest('#retryBtn');
            if (retryBtn) {
                console.log('Retry button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.retryCurrentSentence();
                return;
            }
            
            const nextBtn = e.target.closest('#nextBtn');
            if (nextBtn) {
                console.log('Next button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.nextSentence();
                return;
            }
            
            const playAudioBtn = e.target.closest('#playAudioBtn');
            if (playAudioBtn) {
                console.log('Play audio button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.playRecordedAudio();
                return;
            }
            
            // Exemplar audio controls
            const playExemplarBtn = e.target.closest('#playExemplarBtn');
            if (playExemplarBtn) {
                console.log('Play exemplar button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.playExemplarAudio();
                return;
            }
            
            const compareBtn = e.target.closest('#compareBtn');
            if (compareBtn) {
                console.log('Compare button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.compareWithExemplar();
                return;
            }
        });

        // Keyboard shortcuts
        if (this.settings.enableKeyboardShortcuts) {
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        }

        // Settings and other controls - using the same pattern
        document.addEventListener('click', (e) => {
            const exportBtn = e.target.closest('#exportBtn');
            if (exportBtn) {
                e.preventDefault();
                this.exportResults();
                return;
            }
            
            const clearHistoryBtn = e.target.closest('#clearHistoryBtn');
            if (clearHistoryBtn) {
                e.preventDefault();
                this.clearHistory();
                return;
            }
            
            const themeToggle = e.target.closest('#themeToggle');
            if (themeToggle) {
                e.preventDefault();
                this.toggleTheme();
                return;
            }
            
            // Navigation buttons
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                e.preventDefault();
                const view = navBtn.dataset.view;
                this.switchView(view);
                return;
            }
        });

        // Analytics action events
        document.addEventListener('analyticsAction', (e) => {
            this.handleAnalyticsAction(e.detail.action);
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

        console.log('Event listeners set up');
    }

    renderNavigation() {
        const container = document.getElementById('navigation');
        if (!container) return;

        const html = `
            <nav class="main-nav">
                <div class="nav-brand">
                    <h1>📚 CEFR Reading Test</h1>
                </div>
                <div class="nav-menu">
                    <button class="nav-btn ${this.currentView === 'test' ? 'active' : ''}" data-view="test">
                        <span>🎤</span> Practice Test
                    </button>
                    <button class="nav-btn ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">
                        <span>📊</span> Analytics
                    </button>
                </div>
                <div class="nav-actions">
                    <button id="themeToggle" class="nav-action-btn" title="Toggle theme">
                        <span>🌙</span>
                    </button>
                </div>
            </nav>
        `;
        
        container.innerHTML = html;
    }

    renderMainContent() {
        if (this.currentView === 'test') {
            this.renderTestView();
        } else if (this.currentView === 'analytics') {
            this.renderAnalyticsView();
        }
    }

    renderTestView() {
        // Show different UI based on placement completion
        if (this.placementCompleted) {
            this.renderPostPlacementView();
        } else {
            this.renderPlacementTestView();
        }
        
        this.renderTestArea();
        this.renderHistory();
    }

    renderPlacementTestView() {
        // Hide level selector during placement test
        this.hideElement('levelSelector');
        
        // Show placement test info
        this.showElement('placementInfo');
        this.renderPlacementInfo();
        
        this.showElement('testArea');
        this.showElement('results');
        this.showElement('historySection');
        this.hideElement('analyticsContainer');
    }

    renderPostPlacementView() {
        // Show level selector for practice mode
        this.showElement('levelSelector');
        this.renderLevelSelector();
        
        // Hide placement info
        this.hideElement('placementInfo');
        
        this.showElement('testArea');
        this.showElement('results');
        this.showElement('historySection');
        this.hideElement('analyticsContainer');
    }


    renderAnalyticsView() {
        // Hide test containers and show analytics
        this.hideElement('levelSelector');
        this.hideElement('testArea');
        this.hideElement('results');
        this.hideElement('historySection');
        this.showElement('analyticsContainer');
        
        // Render analytics dashboard
        if (this.analyticsDashboard) {
            this.analyticsDashboard.render();
        }
    }

    switchView(view) {
        if (this.isRecording) {
            this.showNotification('Please stop recording before switching views', 'warning');
            return;
        }
        
        this.currentView = view;
        this.renderNavigation();
        this.renderMainContent();
        
        // Update URL without page reload
        history.pushState({ view }, '', `?view=${view}`);
    }

    handleAnalyticsAction(action) {
        switch (action) {
            case 'Take a practice test now':
            case 'Begin assessment':
                this.switchView('test');
                break;
            case 'Focus on pronunciation exercises':
            case 'Focus on fluency exercises':
            case 'Focus on completeness exercises':
            case 'Focus on clarity exercises':
                this.switchView('test');
                this.showNotification(`Switched to practice mode. Focus on ${action.split(' ')[2]} during your next test.`, 'info');
                break;
            default:
                console.log('Unhandled analytics action:', action);
        }
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = '';
        }
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    renderLevelSelector() {
        const container = document.getElementById('levelSelector');
        if (!container) return;

        const assignedLevel = this.adaptiveTesting.getAssignedLevel();
        const html = `
            <div class="level-selector-content">
                <div class="placement-results">
                    <h3>📊 Your CEFR Level: <span class="assigned-level">${assignedLevel}</span></h3>
                    <p>Based on your placement test, you've been assigned to ${assignedLevel} level. You can now practice at any level or continue with recommended content.</p>
                </div>
                
                <h4>Practice Mode - Choose Your Level</h4>
                <div class="level-grid">
                    ${Object.entries(CEFR_LEVELS).map(([level, data]) => `
                        <div class="level-card ${level === this.currentLevel ? 'active' : ''} ${level === assignedLevel ? 'recommended' : ''}" 
                             data-level="${level}" 
                             tabindex="0"
                             role="button"
                             aria-pressed="${level === this.currentLevel}">
                            <h4>${level} - ${data.name} ${level === assignedLevel ? '⭐' : ''}</h4>
                            <p>${data.description}</p>
                            ${level === assignedLevel ? '<span class="recommended-badge">Recommended</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderPlacementInfo() {
        const container = document.getElementById('placementInfo');
        if (!container) return;

        const testInfo = this.adaptiveTesting.getCurrentTestInfo();
        if (!testInfo) return;

        const html = `
            <div class="placement-test-info">
                <div class="placement-header">
                    <h3>🎯 CEFR Placement Test</h3>
                    <div class="test-status">
                        <span class="current-level">Current Level: ${testInfo.level}</span>
                        <span class="progress-info">${testInfo.progress.levelProgress}</span>
                    </div>
                </div>
                
                <div class="placement-instructions">
                    <p>We're determining your English proficiency level. Read each sentence clearly and naturally. The test will automatically progress based on your performance.</p>
                    
                    <div class="progress-indicators">
                        <div class="level-progress">
                            <span>📈 ${testInfo.progress.averageAtLevel}% average at ${testInfo.level}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderTestArea() {
        const container = document.getElementById('testArea');
        if (!container) {
            console.error('testArea container not found!');
            return;
        }

        // Get current test info from adaptive testing or use manual selection
        let testInfo, levelData, sentence, progress;
        
        if (!this.placementCompleted || this.testMode === 'placement') {
            testInfo = this.adaptiveTesting.getCurrentTestInfo();
            if (testInfo) {
                this.currentLevel = testInfo.level;
                this.currentSentenceIndex = testInfo.sentenceIndex;
                levelData = CEFR_LEVELS[testInfo.level];
                sentence = testInfo.sentence;
                progress = ((testInfo.sentenceIndex + 1) / levelData.sentences.length) * 100;
            } else {
                // Start placement test
                const placementStart = this.adaptiveTesting.startPlacementTest();
                this.currentLevel = placementStart.level;
                this.currentSentenceIndex = placementStart.sentenceIndex;
                levelData = CEFR_LEVELS[this.currentLevel];
                sentence = levelData.sentences[this.currentSentenceIndex];
                progress = ((this.currentSentenceIndex + 1) / levelData.sentences.length) * 100;
            }
        } else {
            // Practice mode - use manual selection
            levelData = CEFR_LEVELS[this.currentLevel];
            sentence = levelData.sentences[this.currentSentenceIndex];
            progress = ((this.currentSentenceIndex + 1) / levelData.sentences.length) * 100;
        }

        const html = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div class="sentence-display" id="sentenceDisplay" role="main" aria-live="polite">
                <p class="sentence-text" id="sentenceText">${sentence.text}</p>
                <div class="sentence-info">
                    <span class="level-indicator">${this.currentLevel} Level</span>
                    <span class="sentence-progress">${this.currentSentenceIndex + 1} / ${levelData.sentences.length}</span>
                    ${this.settings.showTimer ? `<span class="duration-hint">~${sentence.idealDuration}s</span>` : ''}
                    ${!this.placementCompleted ? '<span class="placement-badge">📍 Placement Test</span>' : ''}
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

            <!-- Exemplar Audio Controls -->
            <div class="exemplar-controls" id="exemplarControls">
                <div class="exemplar-header">
                    <h4>📖 Listen to Perfect Pronunciation</h4>
                    <p>Hear how this sentence should be pronounced by a native speaker</p>
                </div>
                <div class="exemplar-actions">
                    <button type="button" class="btn btn-secondary" id="playExemplarBtn">
                        <span>🔊</span> Play Exemplar
                    </button>
                    <button type="button" class="btn btn-secondary" id="compareBtn" style="display: none;">
                        <span>⚖️</span> Compare with My Recording
                    </button>
                    <div class="exemplar-info" id="exemplarInfo" style="display: none;">
                        <span class="voice-info"></span>
                        <span class="quality-badge"></span>
                    </div>
                </div>
            </div>

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

            ${analysisData.phoneticAnalysis ? this.renderPhoneticAnalysisResults(analysisData.phoneticAnalysis) : ''}

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
        
        // Update analytics dashboard if visible
        if (this.currentView === 'analytics' && this.analyticsDashboard) {
            setTimeout(() => {
                this.analyticsDashboard.render();
            }, 100);
        }
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

        // Only allow manual level selection in practice mode
        if (!this.placementCompleted) {
            this.showNotification('Please complete the placement test first', 'info');
            return;
        }

        this.currentLevel = level;
        this.currentSentenceIndex = 0;
        this.testMode = 'practice';
        
        this.renderLevelSelector();
        this.renderTestArea();
        this.hideResults();
        
        // Preload exemplar audio for new level (non-blocking)
        if (level !== 'CUSTOM') {
            this.exemplarAudio.preloadExemplarsForLevel(level)
                .catch(error => console.log('Non-critical: exemplar preload failed', error));
        }
        
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
        console.log('Stop recording called, isRecording:', this.isRecording);
        
        if (!this.isRecording) {
            console.log('Not recording, ignoring stop request');
            return;
        }

        try {
            this.isRecording = false;
            this.updateRecordingState(false);
            this.stopTimer();
            
            // Show loading state
            this.showLoading(true);
            
            // Wait for recording to complete and get audio data
            const audioData = await this.audioRecorder.stopRecording();
            console.log('Audio data:', audioData);
            
            if (!audioData || !audioData.duration) {
                throw new Error('No audio data available or invalid recording');
            }
            
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
                analysisData = this.apiClient.getMockAnalysis(duration, sentence.idealDuration, sentence.text);
                this.showNotification('Using offline analysis due to connection issues', 'warning');
            }

            // Perform advanced phonetic analysis
            let phoneticAnalysisData = null;
            try {
                console.log('Running phonetic analysis...');
                phoneticAnalysisData = await this.phoneticAnalysis.analyzePhonetics(
                    audioData.blob, 
                    sentence.text, 
                    this.currentLevel
                );
                console.log('Phonetic analysis complete:', phoneticAnalysisData);
            } catch (error) {
                console.warn('Phonetic analysis failed:', error);
            }

            // Enhance analysis data with phonetic insights
            if (phoneticAnalysisData) {
                analysisData.phoneticAnalysis = phoneticAnalysisData;
                analysisData.detailedFeedback = phoneticAnalysisData.feedback;
                analysisData.pronunciationScore = phoneticAnalysisData.overall;
            }

            // Process results through adaptive testing if in placement mode
            if (!this.placementCompleted) {
                this.processPlacementResult(analysisData, duration, sentence);
            } else {
                // Show normal results for practice mode
                this.renderResults(analysisData, duration, sentence);
                this.announceToScreenReader(`Analysis complete. Your grade is ${analysisData.grade || 'calculated'}`);
            }
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showNotification('Failed to analyze recording', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    processPlacementResult(analysisData, duration, sentence) {
        const scores = this.scoringEngine.calculateScore(analysisData, duration, sentence.idealDuration);
        
        const testResult = {
            level: this.currentLevel,
            sentence: sentence.text,
            scores,
            grade: scores.grade,
            duration,
            idealDuration: sentence.idealDuration,
            isOffline: analysisData.isOffline || false
        };

        // Save to history
        this.storage.saveTestResult(testResult);

        // Process through adaptive testing engine
        const decision = this.adaptiveTesting.processTestResult(testResult);
        
        // Render placement results with progression info
        this.renderPlacementResults(testResult, decision);
        
        // Check if placement test is complete
        if (decision.action === 'complete_assessment') {
            this.placementCompleted = true;
            setTimeout(() => {
                this.showPlacementComplete(decision);
            }, 2000);
        }
        
        this.announceToScreenReader(`Score: ${scores.composite}%. ${decision.feedback}`);
    }

    renderPlacementResults(result, decision) {
        const container = document.getElementById('results');
        if (!container) return;

        const gradeInfo = this.scoringEngine.getGradeInfo(result.scores.grade);
        
        const html = `
            <div class="placement-results">
                <div class="score-summary">
                    <div class="grade-display">
                        <div class="grade-badge" style="background-color: ${gradeInfo.color}">
                            ${result.scores.grade}
                        </div>
                        <div class="score-value">${result.scores.composite}%</div>
                    </div>
                </div>

                <div class="progression-info">
                    <h4>📊 ${decision.action === 'advance_level' ? 'Level Up!' : decision.action === 'complete_assessment' ? 'Assessment Complete!' : 'Continue Practice'}</h4>
                    <p class="feedback-message">${decision.feedback}</p>
                    
                    ${decision.action === 'advance_level' ? `
                        <div class="level-progression">
                            <span class="from-level">${decision.currentLevel}</span>
                            <span class="arrow">→</span>
                            <span class="to-level">${decision.nextLevel}</span>
                        </div>
                    ` : ''}
                    
                    ${decision.progress ? `
                        <div class="progress-stats">
                            <span>Attempts at ${decision.currentLevel}: ${decision.progress.attemptsAtLevel}</span>
                            <span>Average: ${decision.progress.averageScore}%</span>
                        </div>
                    ` : ''}
                </div>

                <div class="controls">
                    ${decision.action === 'complete_assessment' ? `
                        <button class="btn btn-success" id="viewPlacementSummary">
                            <span>📊</span> View Complete Results
                        </button>
                    ` : `
                        <button class="btn btn-success" id="continueBtn">
                            <span>➡️</span> Continue Assessment
                        </button>
                    `}
                </div>
            </div>
        `;

        container.innerHTML = html;
        container.classList.add('show');
        
        // Update placement info for next test
        if (decision.action !== 'complete_assessment') {
            setTimeout(() => {
                this.renderPlacementInfo();
                this.renderTestArea();
            }, 1000);
        }
    }

    showPlacementComplete(decision) {
        const summary = this.adaptiveTesting.getAssessmentSummary();
        
        const html = `
            <div class="placement-complete-modal">
                <div class="modal-content">
                    <div class="placement-header">
                        <h2>🎉 CEFR Placement Test Complete!</h2>
                        <div class="assigned-level-display">
                            <span class="level-label">Your CEFR Level:</span>
                            <span class="assigned-level">${summary.assignedLevel}</span>
                        </div>
                    </div>
                    
                    <div class="placement-summary">
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-value">${summary.totalAttempts}</span>
                                <span class="stat-label">Total Attempts</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${Math.round(summary.duration / 60000)}m</span>
                                <span class="stat-label">Duration</span>
                            </div>
                        </div>
                        
                        <div class="level-performance">
                            <h4>Performance by Level</h4>
                            ${Object.entries(summary.levelPerformance).map(([level, perf]) => `
                                <div class="level-perf-item">
                                    <span class="level">${level}</span>
                                    <span class="attempts">${perf.attempts} attempts</span>
                                    <span class="average">${perf.averageScore}% avg</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="recommendations">
                            <h4>Recommendations</h4>
                            ${summary.recommendations.map(rec => `
                                <p class="recommendation">• ${rec.message}</p>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="startPracticeMode">
                            <span>🎯</span> Start Practice Mode
                        </button>
                        <button class="btn btn-secondary" id="viewAnalytics">
                            <span>📊</span> View Analytics
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'placement-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        
        // Add event listeners
        overlay.querySelector('#startPracticeMode').addEventListener('click', () => {
            this.startPracticeMode();
            document.body.removeChild(overlay);
        });
        
        overlay.querySelector('#viewAnalytics').addEventListener('click', () => {
            this.switchView('analytics');
            document.body.removeChild(overlay);
        });
    }

    startPracticeMode() {
        this.testMode = 'practice';
        this.placementCompleted = true;
        
        // Set to assigned level
        const assignedLevel = this.adaptiveTesting.getAssignedLevel();
        this.currentLevel = assignedLevel;
        this.currentSentenceIndex = 0;
        
        // Re-render the interface
        this.renderMainContent();
        this.hideResults();
        
        this.showNotification(`Practice mode activated! Starting at your assigned ${assignedLevel} level.`, 'success');
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

    async playExemplarAudio() {
        const playBtn = document.getElementById('playExemplarBtn');
        const exemplarInfo = document.getElementById('exemplarInfo');
        
        if (!playBtn) return;
        
        // Get current sentence
        const levelData = CEFR_LEVELS[this.currentLevel];
        const sentence = levelData.sentences[this.currentSentenceIndex];
        
        // Disable button and show loading
        playBtn.disabled = true;
        const originalContent = playBtn.innerHTML;
        playBtn.innerHTML = '<span class="spinner"></span> Loading...';
        
        try {
            const result = await this.exemplarAudio.playExemplar(sentence.text, this.currentLevel);
            
            if (result.success) {
                // Show exemplar info
                if (exemplarInfo) {
                    const voiceInfo = exemplarInfo.querySelector('.voice-info');
                    const qualityBadge = exemplarInfo.querySelector('.quality-badge');
                    
                    if (voiceInfo) {
                        voiceInfo.textContent = `Voice: ${this.exemplarAudio.selectedVoice?.name || 'System Default'}`;
                    }
                    
                    if (qualityBadge) {
                        qualityBadge.textContent = result.type === 'recorded' ? 'Professional' : 'Synthetic';
                        qualityBadge.className = `quality-badge ${result.type}`;
                    }
                    
                    exemplarInfo.style.display = 'block';
                }
                
                // Show comparison button if user has recorded
                const compareBtn = document.getElementById('compareBtn');
                const audioPlayer = document.getElementById('audioPlayer');
                if (compareBtn && audioPlayer && audioPlayer.src) {
                    compareBtn.style.display = 'inline-flex';
                }
                
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message || 'Could not play exemplar audio', 'error');
            }
        } catch (error) {
            console.error('Error playing exemplar:', error);
            this.showNotification('Error playing exemplar audio', 'error');
        } finally {
            // Restore button
            playBtn.disabled = false;
            playBtn.innerHTML = originalContent;
        }
    }

    async compareWithExemplar() {
        const compareBtn = document.getElementById('compareBtn');
        const audioPlayer = document.getElementById('audioPlayer');
        
        if (!compareBtn || !audioPlayer || !audioPlayer.src) {
            this.showNotification('No recording available for comparison', 'warning');
            return;
        }
        
        // Get current sentence
        const levelData = CEFR_LEVELS[this.currentLevel];
        const sentence = levelData.sentences[this.currentSentenceIndex];
        
        // Disable button and show loading
        compareBtn.disabled = true;
        const originalContent = compareBtn.innerHTML;
        compareBtn.innerHTML = '<span class="spinner"></span> Comparing...';
        
        try {
            // This would use the user's audio data for comparison
            // For now, we'll show a comparison interface
            const result = await this.exemplarAudio.compareWithExemplar(
                null, // userAudio - would need actual audio data
                sentence.text,
                this.currentLevel
            );
            
            if (result.success) {
                this.showComparisonResults(result);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error comparing with exemplar:', error);
            this.showNotification('Error comparing with exemplar', 'error');
        } finally {
            // Restore button
            compareBtn.disabled = false;
            compareBtn.innerHTML = originalContent;
        }
    }

    showComparisonResults(comparisonData) {
        const container = document.getElementById('results');
        if (!container) return;
        
        const html = `
            <div class="comparison-results">
                <h3>📊 Pronunciation Comparison</h3>
                <div class="exemplar-info">
                    <h4>Reference Audio</h4>
                    <p>Text: "${comparisonData.exemplar.text}"</p>
                    <p>Level: ${comparisonData.exemplar.level}</p>
                    <p>Type: ${comparisonData.exemplar.type === 'recorded' ? 'Professional Recording' : 'Synthetic Voice'}</p>
                </div>
                
                <div class="comparison-metrics">
                    <h4>Comparison Analysis</h4>
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-label">Tempo Similarity</span>
                            <span class="metric-value">${comparisonData.comparison.tempoSimilarity}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Pronunciation Match</span>
                            <span class="metric-value">${comparisonData.comparison.pronunciationMatch}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Rhythm Alignment</span>
                            <span class="metric-value">${comparisonData.comparison.rhythmAlignment}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Overall Similarity</span>
                            <span class="metric-value overall">${comparisonData.comparison.overallSimilarity}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="recommendations">
                    <h4>💡 Recommendations</h4>
                    <ul>
                        ${comparisonData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="audio-controls">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('audioPlayer').play()">
                        <span>🔊</span> Play My Recording
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="window.cefrApp.playExemplarAudio()">
                        <span>🎯</span> Play Exemplar Again
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        container.classList.add('show');
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
                console.log('Spacebar pressed for recording, isRecording:', this.isRecording);
                if (this.isRecording) {
                    console.log('Stopping recording via spacebar');
                    this.stopRecording();
                } else {
                    console.log('Starting recording via spacebar');
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

    renderPhoneticAnalysisResults(phoneticData) {
        if (!phoneticData || phoneticData.isBasicAnalysis) return '';

        const segmental = phoneticData.segmental;
        const suprasegmental = phoneticData.suprasegmental;
        const feedback = phoneticData.feedback;

        return `
            <div class="phonetic-analysis">
                <h4>🔬 Advanced Phonetic Analysis</h4>
                
                <div class="phonetic-scores">
                    <div class="phonetic-score-grid">
                        <div class="phonetic-score-card">
                            <h5>Vowel Sounds</h5>
                            <div class="score-circle ${this.getScoreColor(segmental.vowels.accuracy * 100)}">
                                ${Math.round(segmental.vowels.accuracy * 100)}%
                            </div>
                            <p>${segmental.vowels.count} sounds analyzed</p>
                        </div>
                        
                        <div class="phonetic-score-card">
                            <h5>Consonant Sounds</h5>
                            <div class="score-circle ${this.getScoreColor(segmental.consonants.accuracy * 100)}">
                                ${Math.round(segmental.consonants.accuracy * 100)}%
                            </div>
                            <p>${segmental.consonants.count} sounds analyzed</p>
                        </div>
                        
                        <div class="phonetic-score-card">
                            <h5>Word Stress</h5>
                            <div class="score-circle ${this.getScoreColor(suprasegmental.stress.accuracy * 100)}">
                                ${Math.round(suprasegmental.stress.accuracy * 100)}%
                            </div>
                            <p>Stress patterns</p>
                        </div>
                        
                        <div class="phonetic-score-card">
                            <h5>Speech Rhythm</h5>
                            <div class="score-circle ${this.getScoreColor(suprasegmental.rhythm.accuracy * 100)}">
                                ${Math.round(suprasegmental.rhythm.accuracy * 100)}%
                            </div>
                            <p>Timing & flow</p>
                        </div>
                    </div>
                </div>

                <div class="phonetic-feedback">
                    ${feedback.strengths.length > 0 ? `
                        <div class="feedback-section strengths">
                            <h5>✅ Strengths</h5>
                            <ul>
                                ${feedback.strengths.map(strength => `<li>${strength}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${feedback.improvements.length > 0 ? `
                        <div class="feedback-section improvements">
                            <h5>📈 Areas for Improvement</h5>
                            <ul>
                                ${feedback.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${feedback.specificTips.length > 0 ? `
                        <div class="feedback-section tips">
                            <h5>💡 Pronunciation Tips</h5>
                            <ul>
                                ${feedback.specificTips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${feedback.levelAppropriate.length > 0 ? `
                        <div class="feedback-section level-specific">
                            <h5>🎯 For Your Level (${phoneticData.level})</h5>
                            <ul>
                                ${feedback.levelAppropriate.map(advice => `<li>${advice}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getScoreColor(score) {
        if (score >= 85) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 65) return 'fair';
        return 'needs-work';
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
    console.log('DOM Content Loaded, initializing CEFR app...');
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
    if (window.cefrApp) {
        if (event.state && event.state.level) {
            window.cefrApp.selectLevel(event.state.level);
        }
        if (event.state && event.state.view) {
            window.cefrApp.switchView(event.state.view);
        }
    }
});

// Handle URL parameters on page load
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const level = urlParams.get('level');
    
    setTimeout(() => {
        if (window.cefrApp) {
            if (view && ['test', 'analytics'].includes(view)) {
                window.cefrApp.switchView(view);
            }
            if (level && window.cefrApp.currentLevel !== level) {
                window.cefrApp.selectLevel(level);
            }
        }
    }, 100);
});

export { CEFRReadingTest };