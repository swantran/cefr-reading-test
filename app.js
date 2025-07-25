var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};
function filledCell(cell) { return cell !== '' && cell != null; }
function loadFileData(filename) { ... } // Copy XLSX code

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Transcription:', transcript);
    // Send to backend for accuracy
    fetch('https://cefr-speech-backend.herokuapp.com/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: 'base64-data', text: 'expected text' })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Backend response:', data);
        // Update accuracy
    })
    .catch(error => console.error('Backend error:', error));
};
recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    console.log('No speech detected, falling back to 0');
    resolve(0); // Avoid static 85%
};