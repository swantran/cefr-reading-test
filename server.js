const express = require('express');
const cors = require('cors');
const { SpeechClient } = require('@google-cloud/speech').v1;
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS with specific origins
app.use(cors({
    origin: ['http://localhost:3000', 'https://cefreading.netlify.app'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Initialize Google Cloud Speech Client
const speechClient = new SpeechClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || JSON.stringify(require('./cefr-reading-test-123456.json')))
});

// Transcription route
app.post('/transcribe', async (req, res) => {
    try {
        console.log('Received /transcribe request:', {
            audioLength: req.body.audio?.length,
            textLength: req.body.text?.length
        });

        const audioBase64 = req.body.audio;
        const expectedText = req.body.text;

        if (!audioBase64 || !expectedText) {
            console.error('Missing audio or text in request body');
            return res.status(400).json({ error: 'Missing audio or text' });
        }

        const audioBytes = Buffer.from(audioBase64.split(',')[1], 'base64');

        const audio = {
            content: audioBytes
        };
        const config = {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            enableWordConfidence: true
        };
        const request = {
            audio: audio,
            config: config
        };

        console.log('Sending request to Google Cloud Speech-to-Text');
        const [response] = await speechClient.recognize(request);
        console.log('Received Google Cloud response:', response);

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        const wordConfidences = response.results[0]?.alternatives[0]?.words || [];

        const transcriptWords = transcription.toLowerCase().replace(/[.,]/g, '').split(' ').filter(word => word);
        const expectedWords = expectedText.toLowerCase().replace(/[.,]/g, '').split(' ').filter(word => word);
        let correctWords = 0;
        const wordScores = [];
        for (let i = 0; i < Math.min(transcriptWords.length, expectedWords.length); i++) {
            if (transcriptWords[i] === expectedWords[i]) {
                correctWords++;
                wordScores.push(wordConfidences[i]?.confidence || 1.0);
            }
        }
        const accuracy = expectedWords.length > 0 ? correctWords / expectedWords.length : 0;
        const avgConfidence = wordScores.length > 0 ? wordScores.reduce((sum, score) => sum + score, 0) / wordScores.length : 0;

        console.log('Transcription:', transcription, 'Expected:', expectedText, 'Accuracy:', accuracy, 'Confidence:', avgConfidence);
        res.json({ transcription, accuracy, confidence: avgConfidence });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});