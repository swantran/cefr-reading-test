// API client for speech analysis
export class APIClient {
    constructor() {
        this.baseURL = 'https://cefr-speech-backend.herokuapp.com';
        this.retryAttempts = 3;
        this.timeout = 30000; // 30 seconds
    }

    async transcribeAudio(audioBase64, expectedText, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseURL}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio: audioBase64,
                    text: expectedText,
                    timestamp: Date.now()
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validate response structure
            if (!this.validateResponse(data)) {
                throw new Error('Invalid response format from server');
            }

            return data;

        } catch (error) {
            console.error(`API call failed (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < this.retryAttempts && !error.name === 'AbortError') {
                // Wait before retry (exponential backoff)
                await this.delay(Math.pow(2, retryCount) * 1000);
                return this.transcribeAudio(audioBase64, expectedText, retryCount + 1);
            }
            
            throw error;
        }
    }

    validateResponse(data) {
        return data && 
               typeof data.accuracy === 'number' && 
               data.accuracy >= 0 && 
               data.accuracy <= 1;
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Offline fallback - mock analysis
    getMockAnalysis(duration, idealDuration) {
        const fluencyScore = Math.max(0, 1 - Math.abs(duration - idealDuration) / idealDuration);
        const mockAccuracy = Math.random() * 0.3 + 0.7; // 70-100% random accuracy
        
        return {
            accuracy: mockAccuracy,
            fluency: fluencyScore,
            transcription: "Audio analysis unavailable offline",
            isOffline: true
        };
    }
}