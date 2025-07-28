// Analytics Dashboard UI Components
export class AnalyticsDashboard {
    constructor(analyticsEngine, container) {
        this.analytics = analyticsEngine;
        this.container = container;
        this.activeTab = 'overview';
    }

    render() {
        const data = this.analytics.getComprehensiveAnalytics();
        
        const html = `
            <div class="analytics-dashboard">
                ${this.renderHeader(data.overview)}
                ${this.renderTabNavigation()}
                ${this.renderTabContent(data)}
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachEventListeners();
        this.renderCharts(data);
    }

    renderHeader(overview) {
        return `
            <div class="analytics-header">
                <h2>📊 Your Learning Analytics</h2>
                <div class="stats-cards">
                    <div class="stat-card">
                        <div class="stat-number">${overview.totalTests}</div>
                        <div class="stat-label">Total Tests</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${Math.round(overview.averageScore)}%</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${overview.bestScore}%</div>
                        <div class="stat-label">Best Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${overview.currentStreak}</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTabNavigation() {
        const tabs = [
            { id: 'overview', label: '📈 Overview', icon: '📈' },
            { id: 'skills', label: '🎯 Skills', icon: '🎯' },
            { id: 'progress', label: '📊 Progress', icon: '📊' },
            { id: 'insights', label: '💡 Insights', icon: '💡' }
        ];

        return `
            <div class="analytics-tabs">
                ${tabs.map(tab => `
                    <button class="tab-button ${this.activeTab === tab.id ? 'active' : ''}" 
                            data-tab="${tab.id}">
                        <span class="tab-icon">${tab.icon}</span>
                        <span class="tab-label">${tab.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderTabContent(data) {
        return `
            <div class="analytics-content">
                <div class="tab-panel ${this.activeTab === 'overview' ? 'active' : ''}" data-panel="overview">
                    ${this.renderOverviewPanel(data.overview, data.performance)}
                </div>
                <div class="tab-panel ${this.activeTab === 'skills' ? 'active' : ''}" data-panel="skills">
                    ${this.renderSkillsPanel(data.skills)}
                </div>
                <div class="tab-panel ${this.activeTab === 'progress' ? 'active' : ''}" data-panel="progress">
                    ${this.renderProgressPanel(data.progress)}
                </div>
                <div class="tab-panel ${this.activeTab === 'insights' ? 'active' : ''}" data-panel="insights">
                    ${this.renderInsightsPanel(data.insights, data.recommendations)}
                </div>
            </div>
        `;
    }

    renderOverviewPanel(overview, performance) {
        return `
            <div class="overview-panel">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h3>🎯 Performance Summary</h3>
                        <div class="performance-metrics">
                            <div class="metric">
                                <span class="metric-label">Recent Average:</span>
                                <span class="metric-value">${Math.round(overview.recentAverage)}%</span>
                                <span class="metric-trend ${overview.recentAverage > overview.averageScore ? 'positive' : 'negative'}">
                                    ${overview.recentAverage > overview.averageScore ? '↗️' : '↘️'}
                                </span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Consistency:</span>
                                <span class="metric-value">${Math.round(performance.consistencyScore * 100)}%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Levels Attempted:</span>
                                <span class="metric-value">${overview.levelsAttempted}</span>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>📅 Practice Frequency</h3>
                        <div class="practice-calendar" id="practiceCalendar">
                            <div class="calendar-placeholder">Practice calendar will load here</div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>🏆 Level Performance</h3>
                        <div class="level-performance" id="levelPerformance">
                            ${this.renderLevelPerformance(performance.levelPerformance)}
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>📈 Score Progression</h3>
                        <div class="score-chart" id="scoreChart">
                            <canvas id="scoreProgressChart" width="300" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSkillsPanel(skills) {
        if (!skills || Object.keys(skills).length === 0) {
            return `
                <div class="skills-panel">
                    <div class="empty-state">
                        <h3>📊 Skill Analysis</h3>
                        <p>Complete a few tests to see your detailed skill breakdown.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="skills-panel">
                <div class="skills-grid">
                    ${Object.entries(skills).map(([skill, data]) => `
                        <div class="skill-card">
                            <div class="skill-header">
                                <h3>${this.getSkillIcon(skill)} ${this.formatSkillName(skill)}</h3>
                                <div class="skill-score ${this.getScoreClass(data.current)}">${Math.round(data.current)}%</div>
                            </div>
                            <div class="skill-body">
                                <div class="skill-stats">
                                    <div class="stat">
                                        <span class="stat-label">Average:</span>
                                        <span class="stat-value">${Math.round(data.average)}%</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Trend:</span>
                                        <span class="stat-value ${data.trend > 0 ? 'positive' : data.trend < 0 ? 'negative' : 'neutral'}">
                                            ${data.trend > 0 ? '↗️ Improving' : data.trend < 0 ? '↘️ Declining' : '→ Stable'}
                                        </span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Consistency:</span>
                                        <span class="stat-value">${Math.round(data.consistency * 100)}%</span>
                                    </div>
                                </div>
                                <div class="skill-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${data.current}%"></div>
                                    </div>
                                </div>
                                <div class="skill-advice">
                                    ${this.getSkillAdvice(skill, data)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="skills-comparison">
                    <h3>📊 Skills Radar Chart</h3>
                    <div class="radar-chart" id="skillsRadar">
                        <canvas id="skillsRadarChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    renderProgressPanel(progress) {
        return `
            <div class="progress-panel">
                <div class="progress-grid">
                    <div class="analytics-card full-width">
                        <h3>📈 Score Trends Over Time</h3>
                        <div class="chart-container">
                            <canvas id="progressChart" width="600" height="300"></canvas>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>📅 Weekly Progress</h3>
                        <div class="weekly-stats">
                            ${this.renderWeeklyStats(progress.weekly)}
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>🎯 Milestones</h3>
                        <div class="milestones-list">
                            ${this.renderMilestones(progress.milestones)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInsightsPanel(insights, recommendations) {
        return `
            <div class="insights-panel">
                <div class="insights-grid">
                    <div class="analytics-card">
                        <h3>💡 AI Insights</h3>
                        <div class="insights-list">
                            ${insights.length > 0 ? insights.map(insight => `
                                <div class="insight-item ${insight.type}">
                                    <div class="insight-header">
                                        <span class="insight-icon">${this.getInsightIcon(insight.type)}</span>
                                        <h4>${insight.title}</h4>
                                        <span class="confidence-badge">
                                            ${Math.round(insight.confidence * 100)}% confident
                                        </span>
                                    </div>
                                    <p class="insight-message">${insight.message}</p>
                                </div>
                            `).join('') : '<p class="empty-message">Complete more tests to unlock AI insights!</p>'}
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>🎯 Recommendations</h3>
                        <div class="recommendations-list">
                            ${recommendations.length > 0 ? recommendations.map(rec => `
                                <div class="recommendation-item priority-${rec.priority}">
                                    <div class="recommendation-header">
                                        <h4>${rec.title}</h4>
                                        <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                                    </div>
                                    <p class="recommendation-description">${rec.description}</p>
                                    ${rec.actionable ? `
                                        <button class="action-button" data-action="${rec.action}">
                                            ${rec.action}
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('') : '<p class="empty-message">No specific recommendations at this time.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderLevelPerformance(levelPerformance) {
        if (!levelPerformance || Object.keys(levelPerformance).length === 0) {
            return '<p class="empty-message">No level data available yet.</p>';
        }

        return Object.entries(levelPerformance).map(([level, data]) => `
            <div class="level-item">
                <div class="level-header">
                    <span class="level-badge ${level.toLowerCase()}">${level}</span>
                    <span class="level-score">${Math.round(data.averageScore)}%</span>
                    <span class="mastery-badge ${data.masteryLevel}">${data.masteryLevel}</span>
                </div>
                <div class="level-stats">
                    <span class="stat-small">${data.attempts} attempts</span>
                    <span class="stat-small">Best: ${data.bestScore}%</span>
                </div>
            </div>
        `).join('');
    }

    getSkillIcon(skill) {
        const icons = {
            pronunciation: '🗣️',
            fluency: '⏱️',
            completeness: '✅',
            clarity: '🔊'
        };
        return icons[skill] || '📊';
    }

    formatSkillName(skill) {
        return skill.charAt(0).toUpperCase() + skill.slice(1);
    }

    getScoreClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 60) return 'fair';
        return 'needs-improvement';
    }

    getSkillAdvice(skill, data) {
        if (data.current >= 85) return '✨ Excellent! Keep up the great work.';
        if (data.current >= 70) return '👍 Good progress. Small improvements will help.';
        if (data.current >= 60) return '📈 Room for improvement. Focus on this area.';
        return '🎯 This needs attention. Consider targeted practice.';
    }

    getInsightIcon(type) {
        const icons = {
            positive: '🎉',
            improvement: '📈',
            achievement: '🏆',
            warning: '⚠️'
        };
        return icons[type] || '💡';
    }

    attachEventListeners() {
        // Tab switching
        this.container.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Action buttons in recommendations
        this.container.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleRecommendationAction(action);
            });
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Update tab buttons
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update panels
        this.container.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabId);
        });

        // Re-render charts for the active tab
        if (tabId === 'skills') {
            this.renderSkillsRadarChart();
        } else if (tabId === 'progress') {
            this.renderProgressChart();
        }
    }

    handleRecommendationAction(action) {
        // Emit custom event for the main app to handle
        const event = new CustomEvent('analyticsAction', {
            detail: { action }
        });
        this.container.dispatchEvent(event);
    }

    renderCharts(data) {
        // These would integrate with Chart.js or similar
        // For now, we'll add placeholders and implement in next step
        this.renderScoreProgressChart(data.progress);
        if (this.activeTab === 'skills') {
            this.renderSkillsRadarChart(data.skills);
        }
    }

    renderScoreProgressChart(progressData) {
        // Placeholder for score progression chart
        const canvas = this.container.querySelector('#scoreProgressChart');
        if (canvas && progressData.daily) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Score Progress Chart', canvas.width / 2, canvas.height / 2);
            ctx.fillText('(Chart.js integration pending)', canvas.width / 2, canvas.height / 2 + 20);
        }
    }

    renderSkillsRadarChart(skillsData) {
        // Placeholder for radar chart
        const canvas = this.container.querySelector('#skillsRadarChart');
        if (canvas && skillsData) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Skills Radar Chart', canvas.width / 2, canvas.height / 2);
            ctx.fillText('(Chart.js integration pending)', canvas.width / 2, canvas.height / 2 + 20);
        }
    }

    renderWeeklyStats(weeklyData) {
        // Placeholder implementation
        return `
            <div class="weekly-item">
                <span class="week-label">This Week</span>
                <span class="week-value">5 tests</span>
            </div>
            <div class="weekly-item">
                <span class="week-label">Last Week</span>
                <span class="week-value">3 tests</span>
            </div>
            <div class="weekly-item">
                <span class="week-label">Improvement</span>
                <span class="week-value positive">+67%</span>
            </div>
        `;
    }

    renderMilestones(milestones) {
        const defaultMilestones = [
            { title: 'First Test Completed', date: 'Recently', achieved: true },
            { title: 'Score Above 70%', date: 'Pending', achieved: false },
            { title: '7-Day Streak', date: 'Pending', achieved: false }
        ];

        return defaultMilestones.map(milestone => `
            <div class="milestone-item ${milestone.achieved ? 'achieved' : 'pending'}">
                <span class="milestone-icon">${milestone.achieved ? '✅' : '⏳'}</span>
                <div class="milestone-content">
                    <h4>${milestone.title}</h4>
                    <span class="milestone-date">${milestone.date}</span>
                </div>
            </div>
        `).join('');
    }
}