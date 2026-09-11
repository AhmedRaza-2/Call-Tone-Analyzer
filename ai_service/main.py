import os
import io
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import tempfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Tone Analysis AI Microservice")

# Initialize Whisper model (using 'base' for speed, can be upgraded to 'small' or 'large' for better accuracy)
MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
# using cpu for maximum compatibility if no GPU is present, change device="cuda" if GPU is available
logger.info(f"Loading Faster Whisper model: {MODEL_SIZE}")
try:
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    logger.info("Whisper model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {e}")
    model = None

# Initialize Sentiment Analyzer
analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str):
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    
    # Simple mapping
    if compound <= -0.4:
        return "angry", compound * 100
    elif compound <= -0.1:
        return "frustrated", compound * 100
    elif compound >= 0.3:
        return "calm", compound * 100
    else:
        return "flat", compound * 100

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Whisper model not initialized")

    try:
        # Save uploaded file to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        logger.info(f"Processing audio file: {file.filename}, size: {len(contents)} bytes")
        start_time = time.time()
        
        # Transcribe with Whisper
        segments, info = model.transcribe(tmp_path, beam_size=5)
        
        full_text = []
        utterances = []
        
        for segment in segments:
            seg_text = segment.text.strip()
            full_text.append(seg_text)
            
            # Analyze sentiment for each utterance
            tone_cat, score = analyze_sentiment(seg_text)
            
            utterances.append({
                "id": f"u{segment.id}",
                "startTime": segment.start,
                "endTime": segment.end,
                "timestamp": f"{time.strftime('%M:%S', time.gmtime(segment.start))} - {time.strftime('%M:%S', time.gmtime(segment.end))}",
                "speaker": "Caller",  # Whisper alone doesn't do diarization without extra effort
                "text": seg_text,
                "textSentiment": tone_cat,
                "textSentimentScore": round(score),
                "acousticTone": "unknown", # Python side doesn't do the DSP, so we leave it unknown or rely purely on text
                "fusionMatch": "NLP Only",
                "fusionAnalysis": f"Whisper Transcribed text mapped to sentiment score: {round(score)}",
                "keywords": []
            })
            
        # Clean up temp file
        os.remove(tmp_path)
        
        full_transcript = " ".join(full_text)
        overall_tone_cat, overall_score = analyze_sentiment(full_transcript)
        
        transcription_time = time.time() - start_time
        logger.info(f"Transcription completed in {transcription_time:.2f} seconds.")

        # Construct final result mimicking the expected frontend structure
        result = {
            "overallTone": f"{overall_tone_cat.capitalize()} (Detected via Whisper NLP)",
            "primaryToneCategory": overall_tone_cat,
            "confidenceScore": round(info.language_probability * 100),
            "sentimentScore": round(overall_score),
            "summaryText": f"Analyzed via Faster-Whisper ({info.language} language detected with {info.language_probability:.0%} probability) and VADER sentiment NLP. Processed in {transcription_time:.1f}s.",
            "fullTranscript": f"[Caller]: {full_transcript}",
            "utterances": utterances,
            "textVsAcousticFusion": {
                "textSentimentCategory": overall_tone_cat,
                "textSentimentScore": round(overall_score),
                "acousticToneCategory": "unknown",
                "acousticToneScore": 0,
                "fusionDiagnosis": "Whisper NLP Analysis",
                "fusionExplanation": "Text sentiment analyzed directly from Whisper transcript.",
                "discrepancyLevel": "none"
            },
            "voiceCharacteristics": {
                "pitch": "N/A",
                "pitchLevel": "normal",
                "pace": "N/A",
                "paceLevel": "moderate",
                "volume": "N/A",
                "volumeLevel": "normal",
                "speechEnergy": "N/A",
                "speechEnergyLevel": "steady"
            },
            "timeline": [
                 {
                    "timestamp": "00:00 - End",
                    "speaker": "Caller",
                    "tone": overall_tone_cat.capitalize(),
                    "toneCategory": overall_tone_cat,
                    "intensityScore": 8 if overall_tone_cat == 'angry' else 5,
                    "pitchPaceNote": f"Sentiment: {round(overall_score)}",
                    "transcriptQuote": full_transcript[:100] + "..." if len(full_transcript) > 100 else full_transcript
                 }
            ],
            "keyTriggers": [],
            "recommendedResponse": {
                "agentStrategy": "Maintain calm and professional demeanor." if overall_tone_cat in ['angry', 'frustrated'] else "Standard protocol.",
                "suggestedPhrases": [],
                "deescalationNeeded": overall_tone_cat in ['angry', 'frustrated']
            },
            "detectedLanguage": info.language,
            "speakerCountEstimated": 1
        }
        
        return {"success": True, "result": result}
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
