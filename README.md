# Call Tone Analyzer: AI-Powered Speech Emotion & Anger Detection

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0.1-blue)
![Vite](https://img.shields.io/badge/Vite-6.2.3-purple)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![Faster-Whisper](https://img.shields.io/badge/AI-Faster--Whisper-orange)

An advanced **open-source Call Tone Analyzer** designed to perform real-time and post-call speech emotion recognition. This tool accurately detects whether a caller is **angry, frustrated, calm, or flat** by leveraging a powerful dual-layer system that fuses **Acoustic Web Audio DSP** signal processing algorithms with state-of-the-art **AI NLP Sentiment Analysis**.

Whether you're building a customer service analytics dashboard, automating QA for call centers, or researching speech emotion recognition, this project provides a comprehensive, 100% open-source foundation.

## 🚀 Key Features

*   **🎙️ AI Speech-to-Text & Emotion Detection:** Uses **Faster-Whisper** for rapid, accurate audio transcription and **VADER Sentiment Analysis** to detect anger, frustration, and other emotional states from the transcribed text.
*   **📊 Dual-Layer Sentiment Fusion:** Combines direct acoustic vocal delivery analysis (pitch, volume, energy) with literal text sentiment to identify complex emotional states like false politeness or passive-aggressiveness.
*   **💻 100% Client-Side Web Audio DSP Engine:** Extracts real-time acoustic features like Autocorrelation F0 pitch tracking, RMS loudness energy, and Zero-Crossing Rate (ZCR) directly in the browser using the Web Audio API.
*   **🖥️ Interactive Call Analytics Dashboard:** Features a beautiful, interactive PCM Waveform Player built with React and Tailwind CSS. Allows zoomable, canvas-rendered waveform visualization, scrub seeking, and timestamped utterance highlights.
*   **🔒 Privacy-First & Fully Open-Source:** No proprietary API keys, no external subscriptions, and no hidden cloud processing. Everything runs on your own infrastructure (Express/Node.js + Python FastAPI).

## 🎯 Use Cases

*   **Customer Support & Call Centers:** Automatically flag angry customers and escalate calls for immediate de-escalation.
*   **Quality Assurance (QA):** Evaluate agent performance based on caller sentiment trends over time.
*   **Sales & Telemarketing:** Analyze prospect tone to determine call success rates and optimal conversational strategies.
*   **Mental Health & Telehealth:** Assist professionals by tracking subtle vocal tone shifts during sessions.

---

## 🛠️ Tech Stack & Architecture

This repository is split into two primary microservices working in tandem:

### 1. Frontend & Node.js Server (TypeScript / React)
*   **Frameworks:** React 19, Vite, Tailwind CSS 4, Motion (Framer Motion)
*   **Backend:** Express.js for serving the SPA and relaying audio payloads.
*   **Core Logic:** Custom Web Audio API engines (`localDSPEngine.ts`), Canvas-based Waveform rendering.

### 2. AI Python Microservice (FastAPI / Whisper)
*   **Framework:** FastAPI
*   **AI Models:** `faster-whisper` for speech-to-text, `vaderSentiment` for NLP sentiment extraction.
*   **Functionality:** Processes audio buffers, transcribes text, maps NLP sentiment (angry, frustrated, calm, flat), and calculates confidence scores.

---

## 📦 How to Install and Run Locally

Ensure you have **Node.js (v18+)** and **Python 3.9+** installed on your machine.

### Step 1: Clone and Setup the Node.js Application
```bash
git clone https://github.com/yourusername/call-tone-analyzer.git
cd call-tone-analyzer
npm install
```

### Step 2: Setup the Python AI Microservice
You need to run the Python backend to enable Whisper transcription and NLP sentiment analysis.
```bash
cd ai_service
# Create a virtual environment (optional but recommended)
python -m venv ai_env
# Activate virtual environment (Windows)
ai_env\Scripts\activate
# Activate virtual environment (Mac/Linux)
# source ai_env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Start Both Servers

**Start the AI Microservice (Port 8000):**
```bash
# Inside the ai_service directory with activated env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Start the Frontend & Express Server (Port 3000):**
```bash
# Open a new terminal, navigate to the root directory
npm run dev
```

The application will start on **`http://localhost:3000`**. Open your browser and upload an audio file to start analyzing call tones!

---

## ⚙️ Available Scripts (Node.js)

| Script | Command | Description |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Runs Express server with Vite dev middleware on port 3000 |
| **Production Build** | `npm run build` | Compiles Vite frontend assets and bundles Express server into `dist/server.cjs` |
| **Production Start** | `npm run start` | Executes the production CommonJS server via `node dist/server.cjs` |
| **Linter** | `npm run lint` | Runs TypeScript type checking |

---

## 🤝 Contributing

Contributions are welcome! If you want to improve the accuracy of the anger detection model, add new acoustic features, or enhance the dashboard UI:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Keywords: Call Tone Analyzer, Speech Emotion Recognition, Anger Detection AI, Audio Sentiment Analysis, Whisper Audio Transcription, Open Source Call Analytics, Customer Service AI, VADER Sentiment, Web Audio API DSP.*
