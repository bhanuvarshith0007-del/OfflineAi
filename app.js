let model;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const queryInput = document.getElementById('queryInput');
const searchBtn = document.getElementById('searchBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const switchCamBtn = document.getElementById('switchCamBtn');
const captureBtn = document.getElementById('captureBtn');

let currentStream = null;
let useFrontCamera = false;
let recognition = null;
let isListening = false;

const plantsData = {};
const animalsData = {};
const insectsData = {};
const healthData = {};

// Load JSON data locally
async function loadJSON(filename, targetObj) {
  try {
    const res = await fetch(filename);
    if (!res.ok) throw new Error(`Failed to load ${filename}`);
    const data = await res.json();
    Object.assign(targetObj, data);
  } catch (e) {
    output.textContent = e.message;
  }
}


// Initialize all data
async function initData() {
  await Promise.all([
    loadJSON('plants.json', plantsData),
    loadJSON('animals.json', animalsData),
    loadJSON('insects.json', insectsData),
    loadJSON('health.json', healthData),
    loadJSON('malaria.json', malariaData)
  ]);
  output.textContent = "Data loaded. Ready!";
}

// Initialize camera stream
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  const constraints = {
    video: { facingMode: useFrontCamera ? 'user' : 'environment' },
    audio: false
  };
  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    output.textContent = `Camera started (${useFrontCamera ? 'front' : 'back'}). Ready for capture.`;
  } catch (e) {
    output.textContent = `Camera error: ${e.message}`;
  }
}

// Switch camera button
switchCamBtn.addEventListener('click', () => {
  useFrontCamera = !useFrontCamera;
  startCamera();
});

// Capture image from video and classify
captureBtn.addEventListener('click', async () => {
  if (!currentStream) {
    output.textContent = "Camera not started.";
    return;
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  output.textContent = "Classifying image...";
  const img = tf.browser.fromPixels(canvas);
  const predictions = await model.classify(img);
  img.dispose();

  if (predictions.length === 0) {
    output.textContent = "No prediction found.";
    return;
  }
  let malariaData = {};

fetch('malaria.json')
  .then(response => response.json())
  .then(data => {
    malariaData = data;
    console.log("JSON loaded:", malariaData);
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
  });
  document.getElementById('searchBtn').disabled = true;

fetch('malaria.json')
  .then(response => response.json())
  .then(data => {
    malariaData = data;
    document.getElementById('searchBtn').disabled = false; // enable after loading
  });

  // Show top 3 predictions with info from JSONs
  let resultText = '';
  predictions.slice(0, 3).forEach(pred => {
    const label = pred.className.toLowerCase();
    const prob = (pred.probability * 100).toFixed(2);

    let info = '';
    if (plantsData[label]) {
      info = `🌱 Plant: ${label}\nDescription: ${plantsData[label].description}\nPrecautions: ${plantsData[label].precautions.join(', ')}`;
    } else if (animalsData[label]) {
      info = `🐾 Animal: ${label}\nDescription: ${animalsData[label].description}\nPrecautions: ${animalsData[label].precautions.join(', ')}`;
    } else if (insectsData[label]) {
      info = `🐞 Insect: ${label}\nDescription: ${insectsData[label].description}\nPrecautions: ${insectsData[label].precautions.join(', ')}`;
    } else {
      info = `Object: ${label} (Not in database)`;
    }

    resultText += `Prediction: ${label} (${prob}%)\n${info}\n\n`;
  });
  output.textContent = resultText || "No matching info found.";
});

// Search button text input handler
searchBtn.addEventListener('click', () => {
  const q = queryInput.value.trim().toLowerCase();
  if (!q) {
    output.textContent = "Please enter a search term.";
    return;
  }

  // Search in all JSONs
  if (plantsData[q]) {
    displayInfo('Plant', q, plantsData[q]);
  } else if (animalsData[q]) {
    displayInfo('Animal', q, animalsData[q]);
  } else if (insectsData[q]) {
    displayInfo('Insect', q, insectsData[q]);
  } else if (healthData[q]) {
    displayInfo('Health Issue', q, healthData[q]);
  } else {
    output.textContent = "No information found for: " + q;
  }
});

function displayInfo(type, name, data) {
  output.textContent = `${type}: ${name}\nDescription: ${data.description}\nPrecautions: ${data.precautions.join(', ')}`;
}

// Voice input setup
function initVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    voiceBtn.disabled = true;
    voiceStatus.textContent = "Voice recognition not supported.";
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    voiceStatus.textContent = "Listening...";
    voiceBtn.textContent = "🛑 Stop Voice Input";
  };
  recognition.onend = () => {
    isListening = false;
    voiceStatus.textContent = "";
    voiceBtn.textContent = "🎤 Voice Input";
  };
  recognition.onerror = (event) => {
    voiceStatus.textContent = "Error: " + event.error;
  };
  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript.toLowerCase();
    queryInput.value = speechResult;
    voiceStatus.textContent = `Heard: "${speechResult}"`;
    searchBtn.click();
  };
}

async function init() {
  output.textContent = "Loading model and data, please wait...";
  model = await mobilenet.load({version: 2, alpha: 1.0});
  await initData();
  await startCamera();
  initVoice();
}

init();