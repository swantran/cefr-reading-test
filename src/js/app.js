// Main application logic
import { AudioRecorder } from './audioRecorder.js';
import { APIClient } from './apiClient.js';
import { ScoringEngine } from './scoring.js';
import { StorageManager } from './storage.js';
import { CEFR_LEVELS } from './cefrData.js';
import { AnalyticsEngine } from './analytics.js';
import { AnalyticsDashboard } from './analyticsUI.js';
import { AdaptiveTestingEngine } from './adaptiveTesting.js';
import { AudioVisualizer } from './audioVisualizer.js';
import { PhoneticAnalysisEngine } from './phoneticAnalysis.js';
import { PronunciationExerciseGenerator } from './pronunciationExercises.js';

class CEFRReadingTest {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.apiClient = new APIClient();
        this.scoringEngine = new ScoringEngine();
        this.storage = new StorageManager();
        this.analytics = new AnalyticsEngine(this.storage);
        this.analyticsDashboard = null;
        this.adaptiveTesting = new AdaptiveTestingEngine(this.storage);
        this.phoneticAnalysis = new PhoneticAnalysisEngine();
        this.audioVisualizer = new AudioVisualizer();
        this.exerciseGenerator = new PronunciationExerciseGenerator();
        
        this.currentLevel = 'A1';
        this.currentSentenceIndex = 0;
        this.isRecording = false;
        this.timer = null;
        this.autoStopTimer = null;
        this.recordingStartTime = null;
        this.isInitialized = false;
        this.settings = this.storage.getSettings();
        this.currentView = 'test'; // 'test' or 'analytics'
        this.testMode = 'placement'; // 'placement' or 'practice'
        this.placementCompleted = this.adaptiveTesting.hasCompletedPlacement();
        this.currentAudioBlob = null; // For phonetic visualization
        
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
            console.log('CEFR Reading Test initialized successfully - VERSION: 2025-01-31-phonetic-debug with detailed phonetic analysis debugging');
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
            
            // Practice exercise button
            const practiceBtn = e.target.closest('.start-exercise');
            if (practiceBtn) {
                e.preventDefault();
                const exerciseId = practiceBtn.dataset.exerciseId;
                this.startPracticeExercise(exerciseId);
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
        console.log('renderTestView - placementCompleted:', this.placementCompleted);
        
        // Show different UI based on placement completion
        if (this.placementCompleted) {
            console.log('Showing post-placement view (level selector)');
            this.renderPostPlacementView();
        } else {
            console.log('Showing placement test view (hiding level selector)');
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
                const focusArea = action.split(' ')[2] || 'skills';
                this.showNotification(`Switched to practice mode. Focus on ${focusArea} during your next test.`, 'info');
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
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentLevelIndex = levels.indexOf(assignedLevel);
        
        // Only show assigned level and next level (if exists)
        const availableLevels = [assignedLevel];
        if (currentLevelIndex < levels.length - 1) {
            availableLevels.push(levels[currentLevelIndex + 1]);
        }
        
        const html = `
            <div class="level-selector-content">
                <div class="placement-results">
                    <h3>📊 Your CEFR Level: <span class="assigned-level">${assignedLevel}</span></h3>
                    <p>Based on your placement test, you've been assigned to ${assignedLevel} level. Practice at your level to improve, or try the next level when ready.</p>
                </div>
                
                <h4>Practice Mode - Your Available Levels</h4>
                <div class="level-grid">
                    ${availableLevels.map(level => {
                        const data = CEFR_LEVELS[level];
                        const isAssigned = level === assignedLevel;
                        const isNext = level === levels[currentLevelIndex + 1];
                        return `
                        <div class="level-card ${level === this.currentLevel ? 'active' : ''} ${isAssigned ? 'recommended' : ''} ${isNext ? 'next-level' : ''}" 
                             data-level="${level}" 
                             tabindex="0"
                             role="button"
                             aria-pressed="${level === this.currentLevel}">
                            <h4>${level} - ${data.name} ${isAssigned ? '⭐ Your Level' : isNext ? '🎯 Next Challenge' : ''}</h4>
                            <p>${data.description}</p>
                            ${level === assignedLevel ? '<span class="recommended-badge">Recommended</span>' : ''}
                        </div>
                        `;
                    }).join('')}
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

        // Initialize phonetic visualizations if phonetic analysis is available
        console.log('Checking for phoneticAnalysis in analysisData:', analysisData.phoneticAnalysis ? 'FOUND' : 'NOT FOUND');
        if (analysisData.phoneticAnalysis) {
            console.log('Setting up phonetic visualizations...');
            setTimeout(() => {
                console.log('Initializing phonetic visualizations now...');
                this.initializePhoneticVisualizations();
            }, 100); // Small delay to ensure DOM elements are ready
        }

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

        // Validate that the selected level is available to the user
        const assignedLevel = this.adaptiveTesting.getAssignedLevel();
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const assignedLevelIndex = levels.indexOf(assignedLevel);
        const selectedLevelIndex = levels.indexOf(level);
        
        // Only allow assigned level and the next level
        if (selectedLevelIndex > assignedLevelIndex + 1) {
            this.showNotification(`Level ${level} is not yet available. Complete ${levels[assignedLevelIndex + 1] || assignedLevel} level first.`, 'warning');
            return;
        }
        
        if (selectedLevelIndex < assignedLevelIndex) {
            this.showNotification(`You've already been placed at ${assignedLevel} level. Practice at your current level or try the next challenge.`, 'info');
            return;
        }

        this.currentLevel = level;
        this.currentSentenceIndex = 0;
        this.testMode = 'practice';
        
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
            this.recordingPromise = this.audioRecorder.startRecording();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Update UI
            this.updateRecordingState(true);
            this.startTimer();
            
            // Set up auto-stop timer based on sentence ideal duration with 10% buffer
            const levelData = CEFR_LEVELS[this.currentLevel];
            const sentence = levelData.sentences[this.currentSentenceIndex];
            const autoStopDuration = Math.ceil(sentence.idealDuration * 1.1 * 1000); // 10% buffer, convert to ms
            
            this.autoStopTimer = setTimeout(() => {
                if (this.isRecording) {
                    console.log(`Auto-stopping recording after ${autoStopDuration/1000}s (${sentence.idealDuration}s + 10% buffer)`);
                    this.stopRecording();
                    this.showNotification(`Recording automatically stopped after ${(autoStopDuration/1000).toFixed(1)}s`, 'info');
                }
            }, autoStopDuration);
            
            // Announce to screen readers
            this.announceToScreenReader(`Recording started - will auto-stop in ${(autoStopDuration/1000).toFixed(1)} seconds`);
            console.log(`Recording started successfully - will auto-stop in ${autoStopDuration/1000}s`);
            
        } catch (error) {
            console.error('Recording failed:', error);
            this.showNotification(error.message || 'Failed to start recording. Please check microphone permissions.', 'error');
            this.updateRecordingState(false);
            this.isRecording = false;
        }
    }

    async detectSilence(audioBlob) {
        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Get audio data from first channel
            const channelData = audioBuffer.getChannelData(0);
            
            // Calculate RMS (Root Mean Square) energy
            let sum = 0;
            for (let i = 0; i < channelData.length; i++) {
                sum += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sum / channelData.length);
            
            // Convert to decibels
            const db = 20 * Math.log10(rms);
            
            console.log('Audio analysis:', { rms, db, samples: channelData.length });
            
            // Consider it silence if RMS is very low or dB is below threshold
            // Threshold: -40dB is very quiet speech, -60dB is effective silence
            const silenceThreshold = -45; // dB
            const isSilent = db < silenceThreshold || rms < 0.001;
            
            audioContext.close();
            
            return isSilent;
        } catch (error) {
            console.warn('Silence detection failed:', error);
            return false; // If we can't detect, assume there's audio
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
            
            // Clear auto-stop timer if it exists
            if (this.autoStopTimer) {
                clearTimeout(this.autoStopTimer);
                this.autoStopTimer = null;
            }
            
            // Show loading state
            this.showLoading(true);
            
            // Stop the recording
            this.audioRecorder.stopRecording();
            
            // Wait for recording to complete and get audio data
            const audioData = await this.recordingPromise;
            console.log('Audio data:', audioData);
            
            if (!audioData || !audioData.duration) {
                throw new Error('No audio data available or invalid recording');
            }
            
            // Check for silence - analyze audio energy
            const isSilent = await this.detectSilence(audioData.blob);
            if (isSilent) {
                this.showNotification('No speech detected. Please speak clearly and try again.', 'warning');
                this.showLoading(false);
                return; // Exit early, no analysis needed
            }
            
            const duration = audioData.duration;
            
            // Store audio blob for phonetic visualization
            this.currentAudioBlob = audioData.blob;
            
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
                analysisData = await this.apiClient.getMockAnalysis(duration, sentence.idealDuration, sentence.text, audioData.blob);
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
                console.log('phoneticAnalysisData.isBasicAnalysis:', phoneticAnalysisData?.isBasicAnalysis);
            } catch (error) {
                console.warn('Phonetic analysis failed:', error);
            }

            // Enhance analysis data with phonetic insights
            if (phoneticAnalysisData) {
                analysisData.phoneticAnalysis = phoneticAnalysisData;
                analysisData.detailedFeedback = phoneticAnalysisData.feedback;
                analysisData.pronunciationScore = phoneticAnalysisData.overall;
                console.log('Enhanced analysisData with phoneticAnalysis:', analysisData.phoneticAnalysis ? 'YES' : 'NO');
            } else {
                console.log('No phoneticAnalysisData to add to analysisData');
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
        this.renderPlacementResults(testResult, decision, analysisData);
        
        // Check if placement test is complete
        if (decision.action === 'complete_assessment') {
            this.placementCompleted = true;
            setTimeout(() => {
                this.showPlacementComplete(decision);
            }, 2000);
        }
        
        this.announceToScreenReader(`Score: ${scores.composite}%. ${decision.feedback}`);
    }

    renderPlacementResults(result, decision, analysisData = null) {
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

                ${analysisData && analysisData.phoneticAnalysis ? this.renderPhoneticAnalysisResults(analysisData.phoneticAnalysis) : ''}
            </div>
        `;

        console.log('renderPlacementResults - analysisData:', analysisData ? 'PRESENT' : 'MISSING');
        console.log('renderPlacementResults - phoneticAnalysis:', analysisData?.phoneticAnalysis ? 'PRESENT' : 'MISSING');

        container.innerHTML = html;
        container.classList.add('show');
        
        // Initialize phonetic visualizations if phonetic analysis is available
        if (analysisData && analysisData.phoneticAnalysis) {
            console.log('Setting up phonetic visualizations for placement results...');
            setTimeout(() => {
                console.log('Initializing phonetic visualizations for placement results now...');
                this.initializePhoneticVisualizations();
            }, 100); // Small delay to ensure DOM elements are ready
        }
        
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

    async startPracticeExercise(exerciseId) {
        try {
            // Get the current exercise data
            const currentExercises = this.exerciseGenerator.getExercisesForLevel(this.currentLevel);
            const exercise = currentExercises.exercises[exerciseId];
            
            if (!exercise) {
                this.showNotification('Exercise not found.', 'error');
                return;
            }

            // Switch to practice page
            this.showPracticePage(exercise, exerciseId);
            
        } catch (error) {
            console.error('Error starting practice exercise:', error);
            this.showNotification('Failed to start practice exercise.', 'error');
        }
    }

    showPracticePage(exercise, exerciseId) {
        // Create practice page content
        const practiceHTML = `
            <div class="practice-page">
                <div class="practice-header">
                    <button class="btn btn-secondary back-to-results" id="backToResults">
                        ← Back to Results
                    </button>
                    <h2>🎯 Pronunciation Practice</h2>
                    <div class="exercise-info">
                        <span class="exercise-type">${exercise.type}</span>
                        <span class="exercise-level">Level: ${this.currentLevel}</span>
                    </div>
                </div>

                <div class="practice-content">
                    <div class="exercise-details">
                        <h3>${exercise.title}</h3>
                        <p class="instructions">${exercise.instructions}</p>
                    </div>

                    <div class="practice-sections">
                        ${this.renderPracticeSections(exercise)}
                    </div>

                    <div class="practice-controls">
                        <div class="recording-section">
                            <button class="btn btn-primary" id="practiceRecordBtn">
                                🎤 Start Recording
                            </button>
                            <button class="btn btn-secondary" id="practicePlaybackBtn" style="display: none;">
                                ▶️ Play Recording
                            </button>
                        </div>
                        
                        <div class="practice-waveform">
                            <canvas id="practiceWaveform" width="600" height="150"></canvas>
                        </div>
                        
                        <div class="practice-feedback" id="practiceFeedback" style="display: none;">
                            <!-- Feedback will be shown here -->
                        </div>
                    </div>

                    <div class="practice-navigation">
                        <button class="btn btn-success" id="completePractice">
                            ✅ Complete Practice
                        </button>
                        <button class="btn btn-outline-primary" id="nextExercise" style="display: none;">
                            Next Exercise →
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Replace main content with practice page
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = practiceHTML;
            
            // Add event listeners for practice page
            this.addPracticeEventListeners(exercise, exerciseId);
        }
    }

    renderPracticeSections(exercise) {
        let sectionsHTML = '';

        // Minimal pairs section
        if (exercise.minimalPairs && exercise.minimalPairs.length > 0) {
            sectionsHTML += `
                <div class="practice-section">
                    <h4>🔀 Minimal Pairs Practice</h4>
                    <div class="minimal-pairs-grid">
                        ${exercise.minimalPairs.map(pair => `
                            <div class="pair-item">
                                <span class="word-a">${pair.word1}</span>
                                <span class="vs">vs</span>
                                <span class="word-b">${pair.word2}</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="practice-tip">Practice distinguishing between these similar sounds.</p>
                </div>
            `;
        }

        // Isolation practice section
        if (exercise.isolationWords && exercise.isolationWords.length > 0) {
            sectionsHTML += `
                <div class="practice-section">
                    <h4>🎯 Isolation Practice</h4>
                    <div class="isolation-words">
                        ${exercise.isolationWords.map(word => `
                            <span class="practice-word">${word}</span>
                        `).join('')}
                    </div>
                    <p class="practice-tip">Practice each word clearly and distinctly.</p>
                </div>
            `;
        }

        // Sentence practice section
        if (exercise.sentences && exercise.sentences.length > 0) {
            sectionsHTML += `
                <div class="practice-section">
                    <h4>💬 Sentence Practice</h4>
                    <div class="practice-sentences">
                        ${exercise.sentences.map(sentence => `
                            <div class="practice-sentence">"${sentence}"</div>
                        `).join('')}
                    </div>
                    <p class="practice-tip">Focus on natural rhythm and intonation.</p>
                </div>
            `;
        }

        // Articulation exercises
        if (exercise.articulationExercises && exercise.articulationExercises.length > 0) {
            sectionsHTML += `
                <div class="practice-section">
                    <h4>👄 Articulation Exercises</h4>
                    <div class="articulation-exercises">
                        ${exercise.articulationExercises.map(word => `
                            <span class="practice-word">${word}</span>
                        `).join('')}
                    </div>
                    <p class="practice-tip">Focus on precise tongue and lip movements.</p>
                </div>
            `;
        }

        return sectionsHTML;
    }

    addPracticeEventListeners(exercise, exerciseId) {
        let isRecording = false;
        let currentRecording = null;
        
        // Back button
        const backBtn = document.getElementById('backToResults');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.hidePracticePage();
            });
        }

        // Recording button
        const recordBtn = document.getElementById('practiceRecordBtn');
        if (recordBtn) {
            recordBtn.addEventListener('click', async () => {
                if (isRecording) {
                    // Stop recording
                    try {
                        const audioBlob = await this.stopRecording();
                        currentRecording = audioBlob;
                        
                        // Show playback button and analyze
                        document.getElementById('practicePlaybackBtn').style.display = 'inline-block';
                        this.analyzePracticeRecording(audioBlob, exercise);
                        
                        recordBtn.textContent = '🎤 Record Again';
                        isRecording = false;
                    } catch (error) {
                        console.error('Error stopping recording:', error);
                    }
                } else {
                    // Start recording
                    try {
                        await this.startRecording();
                        recordBtn.textContent = '⏹️ Stop Recording';
                        isRecording = true;
                        
                        // Clear previous feedback
                        document.getElementById('practiceFeedback').style.display = 'none';
                    } catch (error) {
                        console.error('Error starting recording:', error);
                        this.showNotification('Failed to start recording.', 'error');
                    }
                }
            });
        }

        // Playback button
        const playbackBtn = document.getElementById('practicePlaybackBtn');
        if (playbackBtn) {
            playbackBtn.addEventListener('click', () => {
                if (currentRecording) {
                    this.playAudioBlob(currentRecording);
                }
            });
        }

        // Complete practice button
        const completeBtn = document.getElementById('completePractice');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                this.completePracticeExercise(exerciseId);
            });
        }
    }

    async analyzePracticeRecording(audioBlob, exercise) {
        const feedbackDiv = document.getElementById('practiceFeedback');
        
        try {
            // Check for silence first
            const isSilent = await this.detectSilence(audioBlob);
            if (isSilent) {
                feedbackDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <h5>⚠️ No Speech Detected</h5>
                        <p>We couldn't detect any speech in your recording. Please try recording again and speak clearly.</p>
                    </div>
                `;
                feedbackDiv.style.display = 'block';
                return;
            }

            // Show waveform
            const canvas = document.getElementById('practiceWaveform');
            if (canvas && this.audioVisualizer) {
                this.audioVisualizer.setCanvas('practiceWaveform');
                await this.audioVisualizer.drawWaveform(audioBlob, {
                    color: '#007bff',
                    showGrid: true,
                    showTimeLabels: true
                });
            }

            // Simple feedback based on exercise type
            const feedback = this.generatePracticeFeedback(exercise, audioBlob);
            
            feedbackDiv.innerHTML = `
                <div class="alert alert-info">
                    <h5>📊 Practice Feedback</h5>
                    ${feedback}
                </div>
            `;
            feedbackDiv.style.display = 'block';

        } catch (error) {
            console.error('Error analyzing practice recording:', error);
            feedbackDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5>❌ Analysis Error</h5>
                    <p>Unable to analyze your recording. Please try again.</p>
                </div>
            `;
            feedbackDiv.style.display = 'block';
        }
    }

    generatePracticeFeedback(exercise, audioBlob) {
        // Generate encouragement and tips based on exercise type
        const feedbackMessages = {
            'Vowel Sound Practice': [
                'Great job practicing vowel sounds!',
                'Focus on keeping your mouth position consistent.',
                'Try to hold each vowel sound for 2-3 seconds.'
            ],
            'Consonant Cluster Practice': [
                'Well done working on consonant clusters!',
                'Remember to pronounce each consonant clearly.',
                'Practice slowly at first, then increase speed.'
            ],
            'Word Stress Practice': [
                'Excellent stress pattern practice!',
                'Make sure stressed syllables are longer and louder.',
                'Practice with a steady rhythm.'
            ],
            'Intonation Practice': [
                'Nice work on intonation patterns!',
                'Remember that questions usually rise at the end.',
                'Statements typically fall at the end.'
            ]
        };

        const messages = feedbackMessages[exercise.type] || [
            'Great pronunciation practice!',
            'Keep practicing regularly for best results.',
            'Focus on clarity and natural rhythm.'
        ];

        return `
            <p><strong>${messages[0]}</strong></p>
            <ul>
                <li>${messages[1]}</li>
                <li>${messages[2]}</li>
            </ul>
            <p><em>Tip: Record yourself multiple times and compare your progress!</em></p>
        `;
    }

    completePracticeExercise(exerciseId) {
        // Mark exercise as completed (you could save this to localStorage)
        this.showNotification('Practice completed! Great job!', 'success');
        
        // Return to results page
        setTimeout(() => {
            this.hidePracticePage();
        }, 1500);
    }

    hidePracticePage() {
        // Return to the main results view
        this.renderMainContent();
        
        // Re-show the pronunciation exercises section
        setTimeout(() => {
            const pronunciationSection = document.querySelector('.pronunciation-exercises');
            if (pronunciationSection) {
                pronunciationSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
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
        console.log('renderPhoneticAnalysisResults called with:', phoneticData ? 'DATA PRESENT' : 'NO DATA');
        if (!phoneticData) return '';

        console.log('phoneticData.isBasicAnalysis:', phoneticData.isBasicAnalysis);
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

                <!-- Visual Phonetic Analysis Section -->
                <div class="visual-analysis">
                    <h4>📊 Visual Phonetic Analysis</h4>
                    
                    <div class="visualization-tabs">
                        <button class="tab-btn active" data-tab="waveform">📊 Waveform</button>
                        <button class="tab-btn" data-tab="spectrogram">🌈 Spectrogram</button>
                        <button class="tab-btn" data-tab="formants">🎯 Formants</button>
                    </div>
                    
                    <div class="visualization-content">
                        <div class="viz-panel active" id="waveform-panel">
                            <div class="waveform-comparison">
                                <div class="waveform-section">
                                    <h6>🎯 Target Pronunciation</h6>
                                    <canvas id="exemplarWaveformCanvas" width="600" height="120"></canvas>
                                </div>
                                <div class="waveform-section">
                                    <h6>🎤 Your Pronunciation</h6>
                                    <canvas id="waveformCanvas" width="600" height="120"></canvas>
                                </div>
                            </div>
                            <div class="legend">
                                <span class="legend-item">
                                    <span class="color-box exemplar"></span>Target Pronunciation
                                </span>
                                <span class="legend-item">
                                    <span class="color-box user"></span>Your Pronunciation
                                </span>
                                <div class="viz-controls">
                                    <button class="btn btn-sm btn-secondary" id="exportWaveform">
                                        💾 Export Image
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="viz-panel" id="spectrogram-panel">
                            <canvas id="spectrogramCanvas" width="600" height="300"></canvas>
                            <div class="spectrogram-legend">
                                <div class="frequency-info">
                                    <span>Low Frequency</span>
                                    <div class="intensity-scale">
                                        <div class="scale-bar"></div>
                                        <span class="scale-label">Intensity</span>
                                    </div>
                                    <span>High Frequency</span>
                                </div>
                                <div class="viz-controls">
                                    <button class="btn btn-sm btn-secondary" id="exportSpectrogram">
                                        💾 Export Image
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="viz-panel" id="formants-panel">
                            <canvas id="formantsCanvas" width="500" height="400"></canvas>
                            <div class="formant-info">
                                <div class="formant-values">
                                    <p>F1 (jaw height): <span id="f1-value">--</span> Hz</p>
                                    <p>F2 (tongue position): <span id="f2-value">--</span> Hz</p>
                                    <p>F3 (lip rounding): <span id="f3-value">--</span> Hz</p>
                                </div>
                                <div class="viz-controls">
                                    <button class="btn btn-sm btn-secondary" id="exportFormants">
                                        💾 Export Image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Targeted Pronunciation Exercises -->
                ${this.renderPronunciationExercises(phoneticData)}
            </div>
        `;
    }

    renderPronunciationExercises(phoneticData) {
        if (!phoneticData) {
            console.log('🎯 No phonetic data provided for exercise generation');
            return '';
        }
        
        console.log('🎯 Generating exercises from phonetic data:', phoneticData);
        
        // Generate exercises based on phonetic analysis
        const exerciseData = this.exerciseGenerator.generateExercises(phoneticData, this.currentLevel);
        
        console.log('🎯 Exercise data generated:', exerciseData);
        
        if (!exerciseData.exercises || exerciseData.exercises.length === 0) {
            return `
                <div class="pronunciation-exercises">
                    <h4>🎯 Targeted Pronunciation Practice</h4>
                    <div class="exercise-summary excellent">
                        <p>Excellent pronunciation! Your speech shows strong accuracy across all areas.</p>
                        <p>Continue practicing to maintain your skills and develop even more natural fluency.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="pronunciation-exercises">
                <h4>🎯 Targeted Pronunciation Practice</h4>
                
                <div class="exercise-summary">
                    <div class="summary-stats">
                        <div class="stat">
                            <span class="stat-value">${exerciseData.summary.totalIssues}</span>
                            <span class="stat-label">Areas to improve</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${exerciseData.estimatedTime}min</span>
                            <span class="stat-label">Practice time</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${exerciseData.exercises.length}</span>
                            <span class="stat-label">Exercises</span>
                        </div>
                    </div>
                    
                    <div class="recommendation">
                        <p><strong>Recommendation:</strong> ${exerciseData.summary.recommendation}</p>
                    </div>
                    
                    ${exerciseData.summary.priorities.length > 0 ? `
                        <div class="priority-areas">
                            <h5>Top Priority Areas:</h5>
                            <div class="priority-list">
                                ${exerciseData.summary.priorities.map(priority => `
                                    <div class="priority-item">
                                        <span class="priority-sound">/${priority.sound || priority.type}/</span>
                                        <span class="priority-severity">${priority.severity}% difficulty</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="exercises-list">
                    ${exerciseData.exercises.map((exercise, index) => `
                        <div class="exercise-card" data-exercise-id="${index}">
                            <div class="exercise-header">
                                <h5>${exercise.title}</h5>
                                <div class="exercise-meta">
                                    <span class="exercise-category ${exercise.category}">${exercise.category}</span>
                                    <span class="exercise-time">${exercise.estimatedTime}min</span>
                                    <span class="exercise-priority priority-${Math.round(exercise.priority * 10)}">${Math.round(exercise.priority * 100)}% priority</span>
                                </div>
                            </div>
                            
                            <div class="exercise-content">
                                <p class="exercise-instructions">${exercise.instructions}</p>
                                
                                ${exercise.type === 'minimal_pairs' && exercise.pairs ? `
                                    <div class="minimal-pairs">
                                        <h6>Practice Pairs:</h6>
                                        <div class="pairs-grid">
                                            ${exercise.pairs.map(pair => `
                                                <div class="pair-item">
                                                    <span class="target-word">${pair.target}</span>
                                                    <span class="vs">vs</span>
                                                    <span class="contrast-word">${pair.contrast}</span>
                                                    <span class="focus-note">${pair.focus}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${exercise.type === 'isolation' && exercise.words ? `
                                    <div class="isolation-practice">
                                        <h6>Practice Words:</h6>
                                        <div class="word-list">
                                            ${exercise.words.map(word => `
                                                <span class="practice-word">${word}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${exercise.type === 'sentences' && exercise.sentences ? `
                                    <div class="sentence-practice">
                                        <h6>Practice Sentences:</h6>
                                        <div class="sentence-list">
                                            ${exercise.sentences.map(sentence => `
                                                <div class="practice-sentence">"${sentence}"</div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${exercise.type === 'articulation' && exercise.words ? `
                                    <div class="articulation-practice">
                                        <h6>Articulation Focus:</h6>
                                        <div class="word-list">
                                            ${exercise.words.map(word => `
                                                <span class="practice-word">${word}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${exercise.exercises ? `
                                    <div class="generic-exercises">
                                        ${exercise.exercises.map(ex => `
                                            <div class="generic-exercise">
                                                <strong>${ex.focus}:</strong> ${ex.instruction}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="exercise-actions">
                                <button class="btn btn-sm btn-primary start-exercise" data-exercise-id="${index}">
                                    🎤 Practice This
                                </button>
                                <button class="btn btn-sm btn-secondary mark-complete" data-exercise-id="${index}">
                                    ✅ Mark Complete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${exerciseData.nextSession.hasMore ? `
                    <div class="next-session">
                        <h5>Next Practice Session</h5>
                        <p>${exerciseData.nextSession.suggestion}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getScoreColor(score) {
        if (score >= 85) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 65) return 'fair';
        return 'needs-work';
    }

    // === PHONETIC VISUALIZATION METHODS ===

    async initializePhoneticVisualizations() {
        console.log('Initializing phonetic visualizations...');
        
        // Setup tab switching
        this.setupVisualizationTabs();
        
        // Setup export buttons
        this.setupExportButtons();
        
        // Initialize visualizations if audio is available
        if (this.currentAudioBlob) {
            await this.renderPhoneticVisualizations();
        }
    }

    setupVisualizationTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.viz-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update active panel
                panels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `${targetTab}-panel`) {
                        panel.classList.add('active');
                    }
                });
                
                // Re-render visualization for the active tab
                this.renderVisualizationForTab(targetTab);
            });
        });
    }

    setupExportButtons() {
        const exportWaveform = document.getElementById('exportWaveform');
        const exportSpectrogram = document.getElementById('exportSpectrogram');
        const exportFormants = document.getElementById('exportFormants');

        if (exportWaveform) {
            exportWaveform.addEventListener('click', () => {
                this.audioVisualizer.setCanvas('waveformCanvas');
                this.audioVisualizer.exportAsImage('pronunciation-waveform.png');
            });
        }

        if (exportSpectrogram) {
            exportSpectrogram.addEventListener('click', () => {
                this.audioVisualizer.setCanvas('spectrogramCanvas');
                this.audioVisualizer.exportAsImage('pronunciation-spectrogram.png');
            });
        }

        if (exportFormants) {
            exportFormants.addEventListener('click', () => {
                this.audioVisualizer.setCanvas('formantsCanvas');
                this.audioVisualizer.exportAsImage('pronunciation-formants.png');
            });
        }
    }

    async renderPhoneticVisualizations() {
        if (!this.currentAudioBlob) {
            console.warn('No audio blob available for visualization');
            return;
        }

        // Start with waveform (default active tab)
        await this.renderVisualizationForTab('waveform');
    }

    async renderVisualizationForTab(tabName) {
        if (!this.currentAudioBlob) return;

        try {
            console.log(`Rendering ${tabName} visualization...`);
            
            switch (tabName) {
                case 'waveform':
                    await this.renderWaveform();
                    break;
                case 'spectrogram':
                    await this.renderSpectrogram();
                    break;
                case 'formants':
                    await this.renderFormants();
                    break;
                default:
                    console.warn('Unknown visualization tab:', tabName);
            }
        } catch (error) {
            console.error(`Error rendering ${tabName} visualization:`, error);
            this.showVisualizationError(tabName);
        }
    }

    async renderWaveform() {
        // Render user's waveform
        if (!this.audioVisualizer.setCanvas('waveformCanvas')) {
            console.error('Cannot set waveform canvas');
            return;
        }

        const success = await this.audioVisualizer.drawWaveform(this.currentAudioBlob, {
            color: '#007bff',
            lineWidth: 2,
            showGrid: true,
            showTimeLabels: true
        });

        if (!success) {
            console.error('Failed to draw user waveform');
        }

        // Render exemplar waveform
        try {
            await this.renderExemplarWaveform();
        } catch (error) {
            console.error('Error drawing exemplar waveform:', error);
        }
    }

    async renderExemplarWaveform() {
        // Generate exemplar waveform based on current sentence
        const levelData = CEFR_LEVELS[this.currentLevel];
        const sentence = levelData.sentences[this.currentSentenceIndex];
        
        console.log('Generating exemplar waveform for:', sentence.text);
        
        // Set canvas for exemplar waveform
        if (!this.audioVisualizer.setCanvas('exemplarWaveformCanvas')) {
            console.error('Cannot set exemplar waveform canvas');
            return;
        }

        // Generate synthetic exemplar waveform based on sentence characteristics
        await this.audioVisualizer.drawExemplarWaveform(sentence, {
            color: '#28a745',
            lineWidth: 2,
            showGrid: true,
            showTimeLabels: true
        });
    }

    async renderSpectrogram() {
        if (!this.audioVisualizer.setCanvas('spectrogramCanvas')) {
            console.error('Cannot set spectrogram canvas');
            return;
        }

        const success = await this.audioVisualizer.drawSpectrogram(this.currentAudioBlob, {
            fftSize: 2048,
            hopSize: 512,
            colorMap: 'viridis'
        });

        if (!success) {
            console.error('Failed to draw spectrogram');
        }
    }

    async renderFormants() {
        if (!this.audioVisualizer.setCanvas('formantsCanvas')) {
            console.error('Cannot set formants canvas');
            return;
        }

        // Extract current phoneme from sentence if possible
        const levelData = CEFR_LEVELS[this.currentLevel];
        const sentence = levelData.sentences[this.currentSentenceIndex];
        
        // Try to identify target phoneme (simplified)
        let targetPhoneme = null;
        const text = sentence.text.toLowerCase();
        if (text.includes('eat') || text.includes('see')) targetPhoneme = 'i';
        else if (text.includes('cat') || text.includes('bad')) targetPhoneme = 'æ';
        else if (text.includes('boot') || text.includes('food')) targetPhoneme = 'u';

        const result = await this.audioVisualizer.drawFormantPlot(this.currentAudioBlob, targetPhoneme, {
            showVowelSpace: true,
            showTargetRegion: !!targetPhoneme,
            pointSize: 6
        });

        if (result.success && result.formants && result.formants.length > 0) {
            // Update formant values display
            const avgFormants = this.calculateAverageFormants(result.formants);
            this.updateFormantDisplay(avgFormants);
        }
    }

    calculateAverageFormants(formants) {
        const validFormants = formants.filter(f => f.f1 > 0 && f.f2 > 0);
        if (validFormants.length === 0) return { f1: 0, f2: 0, f3: 0 };

        const sum = validFormants.reduce((acc, f) => ({
            f1: acc.f1 + f.f1,
            f2: acc.f2 + f.f2,
            f3: acc.f3 + (f.f3 || 0)
        }), { f1: 0, f2: 0, f3: 0 });

        return {
            f1: Math.round(sum.f1 / validFormants.length),
            f2: Math.round(sum.f2 / validFormants.length),
            f3: Math.round(sum.f3 / validFormants.length)
        };
    }

    updateFormantDisplay(formants) {
        const f1Element = document.getElementById('f1-value');
        const f2Element = document.getElementById('f2-value');
        const f3Element = document.getElementById('f3-value');

        if (f1Element) f1Element.textContent = formants.f1 > 0 ? formants.f1 : '--';
        if (f2Element) f2Element.textContent = formants.f2 > 0 ? formants.f2 : '--';
        if (f3Element) f3Element.textContent = formants.f3 > 0 ? formants.f3 : '--';
    }

    showVisualizationError(tabName) {
        const canvas = document.getElementById(`${tabName}Canvas`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `Error loading ${tabName} visualization`,
                canvas.width / 2,
                canvas.height / 2 - 10
            );
            ctx.fillText(
                'Audio analysis may not be available',
                canvas.width / 2,
                canvas.height / 2 + 10
            );
        }
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