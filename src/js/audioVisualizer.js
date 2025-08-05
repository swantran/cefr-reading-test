// Audio Visualization Engine for CEFR Phonetic Analysis
export class AudioVisualizer {
    constructor(canvasId) {
        if (canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        }
        this.audioContext = null;
        this.initAudioContext();
    }

    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        }
    }

    setCanvas(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        return this.ctx !== null;
    }

    // === WAVEFORM VISUALIZATION ===
    
    async drawWaveform(audioBlob, options = {}) {
        if (!this.ctx || !this.audioContext) return false;

        const {
            color = '#007bff',
            lineWidth = 2,
            showGrid = true,
            showTimeLabels = true
        } = options;

        try {
            // Convert blob to audio buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background grid if enabled
            if (showGrid) {
                this.drawGrid();
            }
            
            // Draw waveform
            this.renderWaveform(audioBuffer, color, lineWidth);
            
            // Add time labels if enabled
            if (showTimeLabels) {
                this.drawTimeLabels(audioBuffer.duration);
            }
            
            return true;
        } catch (error) {
            console.error('Error drawing waveform:', error);
            return false;
        }
    }

    renderWaveform(audioBuffer, color, lineWidth) {
        const data = audioBuffer.getChannelData(0);
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        
        // Calculate step size for downsampling
        const step = Math.ceil(data.length / width);
        const amplitude = (height / 2) * 0.8; // Use 80% of available height
        
        this.ctx.beginPath();
        
        for (let i = 0; i < width; i++) {
            // Find min and max in this segment for better visualization
            let min = 1.0;
            let max = -1.0;
            
            const startIdx = i * step;
            const endIdx = Math.min(startIdx + step, data.length);
            
            for (let j = startIdx; j < endIdx; j++) {
                const sample = data[j];
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }
            
            // Draw vertical line from min to max
            const minY = centerY - (min * amplitude);
            const maxY = centerY - (max * amplitude);
            
            if (i === 0) {
                this.ctx.moveTo(i, centerY - (data[0] * amplitude));
            } else {
                this.ctx.lineTo(i, minY);
                this.ctx.lineTo(i, maxY);
            }
        }
        
        this.ctx.stroke();
    }

    drawGrid() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Horizontal center line
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
        
        // Vertical grid lines (time markers)
        const numLines = 10;
        for (let i = 1; i < numLines; i++) {
            const x = (width / numLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
    }

    drawTimeLabels(duration) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        const numLabels = 5;
        for (let i = 0; i <= numLabels; i++) {
            const x = (width / numLabels) * i;
            const time = (duration / numLabels) * i;
            const label = time.toFixed(1) + 's';
            
            this.ctx.fillText(label, x, height - 5);
        }
    }

    // === SPECTROGRAM VISUALIZATION ===
    
    async drawSpectrogram(audioBlob, options = {}) {
        if (!this.ctx || !this.audioContext) return false;

        const {
            fftSize = 2048,
            hopSize = 512,
            windowFunction = 'hann',
            colorMap = 'viridis'
        } = options;

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Generate spectrogram data
            const spectrogramData = await this.computeSpectrogram(audioBuffer, fftSize, hopSize);
            
            // Render spectrogram
            this.renderSpectrogram(spectrogramData, colorMap);
            
            // Add frequency labels
            this.drawFrequencyLabels(audioBuffer.sampleRate / 2);
            
            return true;
        } catch (error) {
            console.error('Error drawing spectrogram:', error);
            return false;
        }
    }

    async computeSpectrogram(audioBuffer, fftSize, hopSize) {
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const spectrogramData = [];
        
        // Create window function
        const window = this.createWindow(fftSize, 'hann');
        
        for (let i = 0; i <= data.length - fftSize; i += hopSize) {
            // Extract windowed segment
            const segment = new Float32Array(fftSize);
            for (let j = 0; j < fftSize; j++) {
                segment[j] = data[i + j] * window[j];
            }
            
            // Compute FFT
            const spectrum = await this.computeFFT(segment);
            
            // Convert to magnitude (dB)
            const magnitudes = new Float32Array(spectrum.length / 2);
            for (let k = 0; k < magnitudes.length; k++) {
                const real = spectrum[k * 2];
                const imag = spectrum[k * 2 + 1];
                const magnitude = Math.sqrt(real * real + imag * imag);
                magnitudes[k] = 20 * Math.log10(Math.max(magnitude, 1e-10));
            }
            
            spectrogramData.push(magnitudes);
        }
        
        return spectrogramData;
    }

    createWindow(size, type = 'hann') {
        const window = new Float32Array(size);
        
        switch (type) {
            case 'hann':
                for (let i = 0; i < size; i++) {
                    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
                }
                break;
            case 'hamming':
                for (let i = 0; i < size; i++) {
                    window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1));
                }
                break;
            default:
                window.fill(1); // Rectangular window
        }
        
        return window;
    }

    async computeFFT(data) {
        // Simple DFT implementation for browsers without native FFT
        const N = data.length;
        const output = new Float32Array(N * 2); // Complex output
        
        for (let k = 0; k < N; k++) {
            let realSum = 0;
            let imagSum = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                realSum += data[n] * Math.cos(angle);
                imagSum += data[n] * Math.sin(angle);
            }
            
            output[k * 2] = realSum;
            output[k * 2 + 1] = imagSum;
        }
        
        return output;
    }

    renderSpectrogram(spectrogramData, colorMap = 'viridis') {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.clearRect(0, 0, width, height);
        
        const imageData = this.ctx.createImageData(width, height);
        const timeFrames = spectrogramData.length;
        const freqBins = spectrogramData[0].length;
        
        // Find min/max for normalization
        let minMag = Infinity;
        let maxMag = -Infinity;
        
        for (const frame of spectrogramData) {
            for (const mag of frame) {
                minMag = Math.min(minMag, mag);
                maxMag = Math.max(maxMag, mag);
            }
        }
        
        // Render pixels
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const timeIdx = Math.floor((x / width) * timeFrames);
                const freqIdx = Math.floor(((height - y) / height) * freqBins);
                
                if (timeIdx < timeFrames && freqIdx < freqBins) {
                    const magnitude = spectrogramData[timeIdx][freqIdx];
                    const normalized = (magnitude - minMag) / (maxMag - minMag);
                    const color = this.getColorFromMap(normalized, colorMap);
                    
                    const pixelIdx = (y * width + x) * 4;
                    imageData.data[pixelIdx] = color.r;
                    imageData.data[pixelIdx + 1] = color.g;
                    imageData.data[pixelIdx + 2] = color.b;
                    imageData.data[pixelIdx + 3] = 255;
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    getColorFromMap(value, colorMap) {
        // Clamp value between 0 and 1
        value = Math.max(0, Math.min(1, value));
        
        switch (colorMap) {
            case 'viridis':
                return this.viridisColor(value);
            case 'plasma':
                return this.plasmaColor(value);
            case 'hot':
                return this.hotColor(value);
            default:
                return this.grayscaleColor(value);
        }
    }

    viridisColor(t) {
        // Approximation of the Viridis colormap
        const r = Math.max(0, Math.min(255, 255 * (0.267 + 0.533 * t - 0.8 * t * t)));
        const g = Math.max(0, Math.min(255, 255 * (0.004 + 1.0 * t - 0.5 * t * t)));
        const b = Math.max(0, Math.min(255, 255 * (0.329 + 1.1 * t - 1.4 * t * t + 0.8 * t * t * t)));
        
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    }

    hotColor(t) {
        if (t < 1/3) {
            return { r: Math.round(255 * 3 * t), g: 0, b: 0 };
        } else if (t < 2/3) {
            return { r: 255, g: Math.round(255 * 3 * (t - 1/3)), b: 0 };
        } else {
            return { r: 255, g: 255, b: Math.round(255 * 3 * (t - 2/3)) };
        }
    }

    grayscaleColor(t) {
        const val = Math.round(255 * t);
        return { r: val, g: val, b: val };
    }

    drawFrequencyLabels(maxFreq) {
        const height = this.canvas.height;
        const width = this.canvas.width;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        
        const freqLabels = [0, 1000, 2000, 3000, 4000, maxFreq];
        
        for (const freq of freqLabels) {
            const y = height - (freq / maxFreq) * height;
            this.ctx.fillText(freq + 'Hz', 5, y - 2);
        }
    }

    // === FORMANT PLOT VISUALIZATION ===
    
    async drawFormantPlot(audioBlob, targetPhoneme = null, options = {}) {
        if (!this.ctx || !this.audioContext) return false;

        const {
            showVowelSpace = true,
            showTargetRegion = true,
            pointSize = 6
        } = options;

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Extract formants
            const formants = await this.extractFormants(audioBuffer);
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw vowel space background
            if (showVowelSpace) {
                this.drawVowelSpace();
            }
            
            // Draw target region if specified
            if (showTargetRegion && targetPhoneme) {
                this.drawTargetRegion(targetPhoneme);
            }
            
            // Plot user's formants
            this.plotFormants(formants, '#ff4444', pointSize);
            
            // Add axes and labels
            this.drawFormantAxes();
            
            return { success: true, formants };
        } catch (error) {
            console.error('Error drawing formant plot:', error);
            return { success: false, error };
        }
    }

    async extractFormants(audioBuffer) {
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const windowSize = 1024;
        const hopSize = 512;
        const formants = [];
        
        for (let i = 0; i <= data.length - windowSize; i += hopSize) {
            const window = data.slice(i, i + windowSize);
            
            // Apply window function
            const windowed = window.map((sample, idx) => 
                sample * 0.5 * (1 - Math.cos(2 * Math.PI * idx / (windowSize - 1)))
            );
            
            // Compute spectrum
            const spectrum = await this.computeFFT(new Float32Array(windowed));
            
            // Find spectral peaks (simplified formant detection)
            const peaks = this.findSpectralPeaks(spectrum, sampleRate);
            
            if (peaks.length >= 2) {
                formants.push({
                    f1: peaks[0] || 0,
                    f2: peaks[1] || 0,
                    f3: peaks[2] || 0,
                    time: i / sampleRate
                });
            }
        }
        
        return formants;
    }

    findSpectralPeaks(spectrum, sampleRate, numPeaks = 3) {
        const magnitudes = [];
        const freqBinSize = sampleRate / (spectrum.length / 2);
        
        // Convert to magnitude spectrum
        for (let i = 0; i < spectrum.length / 2; i++) {
            const real = spectrum[i * 2];
            const imag = spectrum[i * 2 + 1];
            const magnitude = Math.sqrt(real * real + imag * imag);
            magnitudes.push({ freq: i * freqBinSize, mag: magnitude });
        }
        
        // Find peaks in relevant frequency range (80-4000 Hz for formants)
        const relevant = magnitudes.filter(bin => bin.freq >= 80 && bin.freq <= 4000);
        
        // Simple peak finding
        const peaks = [];
        for (let i = 1; i < relevant.length - 1; i++) {
            if (relevant[i].mag > relevant[i-1].mag && 
                relevant[i].mag > relevant[i+1].mag &&
                relevant[i].mag > 0.01) { // Threshold
                peaks.push(relevant[i]);
            }
        }
        
        // Sort by magnitude and return top frequencies
        peaks.sort((a, b) => b.mag - a.mag);
        return peaks.slice(0, numPeaks).map(p => p.freq).sort((a, b) => a - b);
    }

    drawVowelSpace() {
        // Standard vowel formant values (F1 vs F2)
        const vowels = {
            'i': { f1: 280, f2: 2250, label: 'i (beat)' },
            'ɪ': { f1: 350, f2: 2000, label: 'ɪ (bit)' },
            'e': { f1: 400, f2: 2100, label: 'e (bait)' },
            'ɛ': { f1: 550, f2: 1800, label: 'ɛ (bet)' },
            'æ': { f1: 700, f2: 1750, label: 'æ (bat)' },
            'ɑ': { f1: 750, f2: 1200, label: 'ɑ (bot)' },
            'ɔ': { f1: 650, f2: 900, label: 'ɔ (bought)' },
            'o': { f1: 450, f2: 800, label: 'o (boat)' },
            'ʊ': { f1: 400, f2: 1000, label: 'ʊ (book)' },
            'u': { f1: 300, f2: 900, label: 'u (boot)' }
        };
        
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
        this.ctx.font = '12px Arial';
        
        // Draw vowel regions
        Object.entries(vowels).forEach(([symbol, data]) => {
            const { x, y } = this.formantToCanvas(data.f1, data.f2);
            
            // Draw vowel region circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Label
            this.ctx.fillStyle = '#333';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(symbol, x, y + 4);
        });
    }

    drawTargetRegion(phoneme) {
        const targets = {
            'i': { f1: 280, f2: 2250 },
            'æ': { f1: 700, f2: 1750 },
            'u': { f1: 300, f2: 900 },
            // Add more as needed
        };
        
        if (targets[phoneme]) {
            const { x, y } = this.formantToCanvas(targets[phoneme].f1, targets[phoneme].f2);
            
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TARGET', x, y - 40);
        }
    }

    plotFormants(formants, color = '#ff4444', pointSize = 6) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        
        formants.forEach((formant, index) => {
            if (formant.f1 > 0 && formant.f2 > 0) {
                const { x, y } = this.formantToCanvas(formant.f1, formant.f2);
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Connect points if multiple formants
                if (index > 0 && formants[index - 1].f1 > 0) {
                    const prev = this.formantToCanvas(formants[index - 1].f1, formants[index - 1].f2);
                    this.ctx.beginPath();
                    this.ctx.moveTo(prev.x, prev.y);
                    this.ctx.lineTo(x, y);
                    this.ctx.stroke();
                }
            }
        });
    }

    formantToCanvas(f1, f2) {
        // Convert formant frequencies to canvas coordinates
        // F1 range: 200-800 Hz (Y-axis, inverted)
        // F2 range: 600-2500 Hz (X-axis, inverted)
        
        const padding = 50;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;
        
        const f1Min = 200, f1Max = 800;
        const f2Min = 600, f2Max = 2500;
        
        // Invert both axes (traditional formant plot orientation)
        const x = padding + width * (1 - (f2 - f2Min) / (f2Max - f2Min));
        const y = padding + height * (1 - (f1 - f1Min) / (f1Max - f1Min));
        
        return { x: Math.max(padding, Math.min(this.canvas.width - padding, x)), 
                 y: Math.max(padding, Math.min(this.canvas.height - padding, y)) };
    }

    drawFormantAxes() {
        const padding = 50;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#333';
        
        // Draw axes
        this.ctx.beginPath();
        // Y-axis
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, padding + height);
        // X-axis
        this.ctx.lineTo(padding + width, padding + height);
        this.ctx.stroke();
        
        // F1 labels (Y-axis)
        this.ctx.textAlign = 'right';
        const f1Labels = [200, 300, 400, 500, 600, 700, 800];
        f1Labels.forEach(f1 => {
            const y = padding + height * (1 - (f1 - 200) / 600);
            this.ctx.fillText(f1 + ' Hz', padding - 10, y + 4);
        });
        
        // F2 labels (X-axis)
        this.ctx.textAlign = 'center';
        const f2Labels = [600, 1000, 1500, 2000, 2500];
        f2Labels.forEach(f2 => {
            const x = padding + width * (1 - (f2 - 600) / 1900);
            this.ctx.fillText(f2 + ' Hz', x, padding + height + 20);
        });
        
        // Axis titles
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.save();
        this.ctx.translate(20, padding + height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('F1 (Hz)', 0, 0);
        this.ctx.restore();
        
        this.ctx.fillText('F2 (Hz)', padding + width / 2, this.canvas.height - 10);
    }

    // === EXEMPLAR WAVEFORM GENERATION ===
    
    async drawExemplarWaveform(sentence, options = {}) {
        if (!this.ctx) return false;

        const {
            color = '#28a745',
            lineWidth = 2,
            showGrid = true,
            showTimeLabels = true
        } = options;

        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background grid if enabled
            if (showGrid) {
                this.drawGrid();
            }

            // Generate synthetic waveform based on sentence characteristics
            this.renderExemplarWaveform(sentence, color, lineWidth);
            
            // Add time labels if enabled
            if (showTimeLabels) {
                this.drawTimeLabels(sentence.idealDuration);
            }
            
            return true;
        } catch (error) {
            console.error('Error drawing exemplar waveform:', error);
            return false;
        }
    }

    renderExemplarWaveform(sentence, color, lineWidth) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const duration = sentence.idealDuration;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        
        // Generate waveform based on sentence characteristics
        const words = sentence.text.toLowerCase().split(' ');
        const syllables = this.estimateSyllables(sentence.text);
        const amplitude = (height / 2) * 0.6; // Use 60% of available height for exemplar
        
        this.ctx.beginPath();
        
        // Generate waveform pattern based on text analysis
        for (let x = 0; x < width; x++) {
            const timeProgress = x / width; // 0 to 1
            const currentTime = timeProgress * duration;
            
            // Create waveform based on phonetic patterns
            let waveValue = this.generatePhoneticWaveform(
                currentTime, 
                duration, 
                words, 
                syllables,
                sentence.text
            );
            
            // Add natural speech variations
            waveValue += this.addSpeechVariations(currentTime, duration, timeProgress);
            
            const y = centerY - (waveValue * amplitude);
            
            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Add word boundaries as visual markers
        this.drawWordBoundaries(words, duration, color);
    }

    generatePhoneticWaveform(currentTime, totalDuration, words, syllables, text) {
        // Base frequency components for natural speech
        const f1 = 2 * Math.PI * 120; // Fundamental frequency ~120Hz
        const f2 = 2 * Math.PI * 240; // First harmonic
        const f3 = 2 * Math.PI * 60;  // Sub-harmonic for rhythm
        
        // Calculate word timing
        const wordDuration = totalDuration / words.length;
        const currentWordIndex = Math.floor(currentTime / wordDuration);
        const currentWord = words[currentWordIndex] || words[words.length - 1];
        
        // Base waveform with natural speech characteristics
        let wave = 0;
        
        // Main speech signal
        wave += 0.4 * Math.sin(f1 * currentTime);
        wave += 0.2 * Math.sin(f2 * currentTime + Math.PI/4);
        wave += 0.1 * Math.sin(f3 * currentTime);
        
        // Vowel emphasis - vowels have higher amplitude
        const vowelFactor = this.getVowelIntensity(currentWord, currentTime % wordDuration, wordDuration);
        wave *= (0.7 + 0.3 * vowelFactor);
        
        // Consonant patterns - some consonants create noise-like patterns
        const consonantNoise = this.getConsonantNoise(currentWord, currentTime % wordDuration, wordDuration);
        wave += 0.1 * consonantNoise;
        
        // Word stress patterns
        const stressPattern = this.getWordStress(currentWordIndex, words.length, currentTime % wordDuration, wordDuration);
        wave *= stressPattern;
        
        // Sentence-level prosody (intonation)
        const prosody = this.getSentenceProsody(currentTime, totalDuration, text);
        wave *= prosody;
        
        return Math.max(-1, Math.min(1, wave)); // Clamp to [-1, 1]
    }

    addSpeechVariations(currentTime, duration, progress) {
        // Add natural speech variations and breathing patterns
        let variation = 0;
        
        // Micro-variations in amplitude (natural voice tremor)
        variation += 0.05 * Math.sin(2 * Math.PI * 8 * currentTime); // 8Hz tremor
        
        // Breathing pattern - slight reduction at regular intervals
        const breathingCycle = 4; // 4-second breathing cycle
        const breathPhase = (currentTime % breathingCycle) / breathingCycle;
        if (breathPhase > 0.8) { // Slight dip for breathing
            variation -= 0.1 * (breathPhase - 0.8) * 5;
        }
        
        // Random micro-variations
        variation += 0.02 * (Math.random() - 0.5);
        
        return variation;
    }

    getVowelIntensity(word, timeInWord, wordDuration) {
        const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
        const vowelPositions = [];
        
        // Find vowel positions in the word
        for (let i = 0; i < word.length; i++) {
            if (vowels.includes(word[i])) {
                vowelPositions.push(i / word.length);
            }
        }
        
        if (vowelPositions.length === 0) return 0.5;
        
        const progressInWord = timeInWord / wordDuration;
        
        // Find closest vowel position
        let minDistance = Infinity;
        for (const vowelPos of vowelPositions) {
            const distance = Math.abs(progressInWord - vowelPos);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        
        // Vowel intensity peaks at vowel positions
        return Math.max(0, 1 - minDistance * 4); // Peak intensity at vowels
    }

    getConsonantNoise(word, timeInWord, wordDuration) {
        const noisyConsonants = ['s', 'sh', 'f', 'th', 'z', 'v'];
        const progressInWord = timeInWord / wordDuration;
        const letterIndex = Math.floor(progressInWord * word.length);
        const currentLetter = word[letterIndex] || '';
        
        // Add noise for fricative consonants
        if (noisyConsonants.some(cons => word.includes(cons))) {
            return 0.3 * (Math.random() - 0.5);
        }
        
        return 0.1 * (Math.random() - 0.5);
    }

    getWordStress(wordIndex, totalWords, timeInWord, wordDuration) {
        // First and last words often get stress
        if (wordIndex === 0 || wordIndex === totalWords - 1) {
            return 1.2;
        }
        
        // Content words (longer words) get more stress
        // This is a simple approximation
        const midWordTime = wordDuration / 2;
        const distanceFromCenter = Math.abs(timeInWord - midWordTime);
        const stressFactor = 1 + 0.3 * Math.cos(2 * Math.PI * distanceFromCenter / wordDuration);
        
        return stressFactor;
    }

    getSentenceProsody(currentTime, totalDuration, text) {
        const progress = currentTime / totalDuration;
        
        // Question intonation - rising at the end
        if (text.includes('?')) {
            return 0.8 + 0.4 * progress;
        }
        
        // Statement intonation - falling at the end
        if (text.endsWith('.') || text.endsWith('!')) {
            return 1.2 - 0.3 * Math.pow(progress, 2);
        }
        
        // Default neutral prosody
        return 1.0 + 0.2 * Math.sin(Math.PI * progress);
    }

    drawWordBoundaries(words, duration, color) {
        const wordDuration = duration / words.length;
        const height = this.canvas.height;
        
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = 0.3;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        for (let i = 1; i < words.length; i++) {
            const x = (i * wordDuration / duration) * this.canvas.width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, height * 0.1);
            this.ctx.lineTo(x, height * 0.9);
            this.ctx.stroke();
        }
        
        // Reset line dash and alpha
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
    }

    estimateSyllables(text) {
        // Simple syllable estimation based on vowel groups
        const vowels = /[aeiouy]+/gi;
        const matches = text.match(vowels);
        return matches ? matches.length : 1;
    }

    // === UTILITY METHODS ===
    
    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Export canvas as image
    exportAsImage(filename = 'phonetic-analysis.png') {
        if (this.canvas) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = this.canvas.toDataURL();
            link.click();
        }
    }
}