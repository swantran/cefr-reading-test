// Audio recording and processing functionality
export class AudioRecorder {
    constructor() {
        this.recorder = null;
        this.stream = null;
        this.chunks = [];
        this.startTime = null;
        this.isRecording = false;
        this.recordedAudio = null;
    }

    async initialize() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw new Error('Microphone access denied. Please allow microphone access to continue.');
        }
    }

    startRecording() {
        if (!this.stream) {
            throw new Error('Microphone not initialized');
        }

        this.chunks = [];
        this.recorder = new MediaRecorder(this.stream, {
            mimeType: this.getSupportedMimeType()
        });
        
        this.recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.chunks.push(event.data);
            }
        };

        this.recorder.start(100); // Collect data every 100ms
        this.startTime = Date.now();
        this.isRecording = true;
        
        return new Promise((resolve) => {
            this.recorder.onstop = () => {
                this.isRecording = false;
                const blob = new Blob(this.chunks, { type: this.getSupportedMimeType() });
                const duration = (Date.now() - this.startTime) / 1000;
                this.recordedAudio = {
                    blob,
                    duration,
                    url: URL.createObjectURL(blob)
                };
                resolve(this.recordedAudio);
            };
        });
    }

    stopRecording() {
        if (this.recorder && this.isRecording) {
            this.recorder.stop();
        }
    }

    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm';
    }

    async convertToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    getRecordedAudio() {
        return this.recordedAudio;
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.recordedAudio?.url) {
            URL.revokeObjectURL(this.recordedAudio.url);
        }
        this.recorder = null;
        this.recordedAudio = null;
    }
}