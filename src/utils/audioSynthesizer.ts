/**
 * Utility to synthesize realistic sample voice call audio Blobs directly in the browser
 * using Web Audio API or SpeechSynthesis + MediaStream Destination,
 * ensuring users can test preset call scenarios immediately with 1 click!
 */

export interface SampleScenario {
  id: string;
  title: string;
  expectedTone: 'Angry' | 'Flat' | 'Frustrated' | 'Calm' | 'Anxious';
  toneCategory: 'angry' | 'flat' | 'frustrated' | 'calm' | 'anxious';
  description: string;
  transcriptText: string;
  pitch: number; // 0.5 to 2
  rate: number;  // 0.5 to 2
  volume: number; // 0.1 to 1
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'angry-billing',
    title: 'Angry Billing Dispute',
    expectedTone: 'Angry',
    toneCategory: 'angry',
    description: 'High pitch volatility, loud volume, fast rushed delivery, demanding tone',
    transcriptText: 'I have been charged double on my account for three months straight! I called last week and nothing was fixed! Cancel my account right now or I will file a formal complaint!',
    pitch: 1.5,
    rate: 1.35,
    volume: 1.0,
  },
  {
    id: 'flat-monotone',
    title: 'Flat & Monotone Call',
    expectedTone: 'Flat',
    toneCategory: 'flat',
    description: 'Unchanging low pitch, zero emotional variance, slow robotic cadence',
    transcriptText: 'Yes hello. I am calling to check the status of ticket reference number four zero nine two. I was told to call back today. My account number is nine eight seven.',
    pitch: 0.8,
    rate: 0.85,
    volume: 0.7,
  },
  {
    id: 'frustrated-delivery',
    title: 'Frustrated Delivery Delay',
    expectedTone: 'Frustrated',
    toneCategory: 'frustrated',
    description: 'Strained voice, heavy sighs, variable tempo with sharp pauses',
    transcriptText: 'Look, my package was supposed to arrive yesterday morning. The tracking link has not updated in two days. I really needed this for an event today, and no one seems to know where it is.',
    pitch: 1.15,
    rate: 1.1,
    volume: 0.9,
  },
  {
    id: 'calm-inquiry',
    title: 'Calm & Polite Inquiry',
    expectedTone: 'Calm',
    toneCategory: 'calm',
    description: 'Smooth pitch contour, steady cadence, balanced volume, pleasant tone',
    transcriptText: 'Good afternoon. I hope you are having a nice day. I would like to inquire about upgrading my current subscription plan when you have a moment to assist.',
    pitch: 1.0,
    rate: 1.0,
    volume: 0.8,
  },
];

/**
 * Synthesizes audio for a scenario and returns a Blob with audio/wav or audio/webm
 */
export async function synthesizeScenarioAudio(scenario: SampleScenario): Promise<{ blob: Blob; base64: string; mimeType: string }> {
  // If SpeechSynthesis and MediaRecorder are available, synthesize vocal speech
  return new Promise((resolve, reject) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 22050 });
      const dest = audioCtx.createMediaStreamDestination();
      
      // Use SpeechSynthesis if supported
      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        const utterance = new SpeechSynthesisUtterance(scenario.transcriptText);
        utterance.pitch = scenario.pitch;
        utterance.rate = scenario.rate;
        utterance.volume = scenario.volume;

        // Fallback: Web Audio synth if MediaRecorder fails or speech synthesis lacks audio capture
        const recorder = new MediaRecorder(dest.stream);
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const base64 = await blobToBase64(blob);
          audioCtx.close();
          resolve({ blob, base64, mimeType: 'audio/webm' });
        };

        // Also add acoustic noise/tone cues to dest
        createAcousticTone(audioCtx, dest, scenario);

        recorder.start();
        window.speechSynthesis.speak(utterance);

        utterance.onend = () => {
          setTimeout(() => {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, 300);
        };

        utterance.onerror = () => {
          // Fallback to pure WebAudio synthesizer if speech synthesis errors out
          synthesizeWebAudioFallback(scenario).then(resolve).catch(reject);
        };

        // Safety timeout
        setTimeout(() => {
          if (recorder.state === 'recording') {
            window.speechSynthesis.cancel();
            recorder.stop();
          }
        }, 12000);

      } else {
        synthesizeWebAudioFallback(scenario).then(resolve).catch(reject);
      }
    } catch (err) {
      // Fallback
      synthesizeWebAudioFallback(scenario).then(resolve).catch(reject);
    }
  });
}

/**
 * Creates subtle background speech-like pitch/tone cues in WebAudio
 */
function createAcousticTone(audioCtx: AudioContext, dest: MediaStreamAudioDestinationNode, scenario: SampleScenario) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  if (scenario.toneCategory === 'angry') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  } else if (scenario.toneCategory === 'flat') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
  } else {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  }

  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  osc.stop(audioCtx.currentTime + 8);
}

/**
 * Pure WebAudio fallback that creates a realistic vocal formant simulation
 */
export async function synthesizeWebAudioFallback(scenario: SampleScenario): Promise<{ blob: Blob; base64: string; mimeType: string }> {
  const sampleRate = 16000;
  const duration = 5; // 5 seconds
  const numFrames = sampleRate * duration;
  
  // Create WAV buffer manually
  const buffer = new Float32Array(numFrames);
  
  let baseFreq = scenario.pitch * 160;
  let freqVariance = scenario.toneCategory === 'angry' ? 80 : scenario.toneCategory === 'flat' ? 2 : 25;
  
  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    // Simulate vocal cadence with pauses
    const cadence = Math.sin(t * Math.PI * 2.5);
    if (cadence < -0.3) {
      buffer[i] = 0;
      continue;
    }
    
    // Pitch modulation
    const mod = Math.sin(t * Math.PI * (scenario.rate * 4)) * freqVariance;
    const currentFreq = baseFreq + mod;
    
    // Formant simulation (vowels)
    const voice = Math.sin(2 * Math.PI * currentFreq * t) * 0.5
      + Math.sin(4 * Math.PI * currentFreq * t) * 0.25
      + Math.sin(6 * Math.PI * currentFreq * t) * 0.1;
      
    buffer[i] = voice * (cadence * 0.5 + 0.5) * scenario.volume * 0.3;
  }

  const wavBlob = createWavBlob(buffer, sampleRate);
  const base64 = await blobToBase64(wavBlob);
  return { blob: wavBlob, base64, mimeType: 'audio/wav' };
}

/**
 * Helper to encode Float32Array PCM audio into standard WAV Blob
 */
function createWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * blockAlign) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channels * bytesPerSample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Float to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      if (res.includes(',')) {
        resolve(res.split(',')[1]);
      } else {
        resolve(res);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
