const express = require('express');
   const cors = require('cors');
   const { SpeechClient } = require('@google-cloud/speech').v1;
   const app = express();
   const port = process.env.PORT || 3001;

   app.use(cors());
   app.use(express.json({ limit: '10mb' }));

  const speechClient = new SpeechClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || JSON.stringify(require('./cefr-reading-test-123456.json')))
});
   app.post('/transcribe', async (req, res) => {
       try {
           const audioBase64 = req.body.audio;
           const expectedText = req.body.text;
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

           const [response] = await speechClient.recognize(request);
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

   app.listen(port, () => {
       console.log(`Server running at http://localhost:${port}`);
   });