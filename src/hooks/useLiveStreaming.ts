import { useState, useRef } from 'react';
import { LiveStreamSession, TranscriptEntry, LiveStreamState } from '../types';

export const useLiveStreaming = (
  setError: (error: string | null) => void,
  onStreamingStopped?: () => void
) => {
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [streamState, setStreamState] = useState<LiveStreamState>('idle');
  const [sessions, setSessions] = useState<LiveStreamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptEntry[]>([]);
  const [streamDuration, setStreamDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamStartTimeRef = useRef<number>(0);
  const currentSessionIdRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const currentInterimIdRef = useRef<string | null>(null);
  const currentSpeakerRef = useRef<'user' | 'ai'>('user');
  const isGeminiSpeakingRef = useRef<boolean>(false);
  const geminiStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openLiveModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setMediaStream(stream);
      setShowLiveModal(true);
      setStreamState('idle');
      setCurrentTranscript([]);
      setStreamDuration(0);
      
      // Reset speaker tracking for new session
      currentInterimIdRef.current = null;
      currentSpeakerRef.current = 'user';
      isGeminiSpeakingRef.current = false;
    } catch (err) {
      setError('Failed to access camera and microphone. Please make sure you granted permissions.');
    }
  };

  const startStreaming = async () => {
    console.log('🚀 startStreaming called!');
    console.log('Media stream available:', !!mediaStream);
    
    if (!mediaStream) {
      console.error('❌ No media stream available!');
      setError('Camera/microphone not initialized. Please close and reopen the modal.');
      return;
    }

    try {
          // Initialize WebSocket connection to Gemini Live API
          // Get API key from runtime config (production) or Vite env (development)
          // @ts-ignore - Runtime config
          const runtimeKey = typeof window !== 'undefined' && window.__ENV__?.VITE_GEMINI_API_KEY;
          // @ts-ignore - Vite env types
          const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
          const apiKey = runtimeKey || viteKey || '';
          
          console.log('🔍 Checking API key...');
          console.log('  - Has key:', !!apiKey);
          console.log('  - Key length:', apiKey.length);
          console.log('  - Key start:', apiKey ? apiKey.substring(0, 15) + '...' : 'N/A');
          console.log('  - Source:', runtimeKey ? 'runtime config' : viteKey ? 'vite env' : 'none');
          
          if (!apiKey) {
            console.error('❌ API key is not set!');
            console.error('📝 For local development, add to your .env file:');
            console.error('   VITE_GEMINI_API_KEY=your_api_key_here');
            console.error('   Then restart: npm run dev');
            console.error('📝 For production, ensure GEMINI_API_KEY is set in Cloud Run');
            setError('API key missing. Check console for setup instructions.');
            return;
          }
      
      console.log('🔑 API key found:', apiKey.substring(0, 10) + '...');
      
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      console.log('🔗 Connecting to:', wsUrl.replace(apiKey, 'API_KEY_HIDDEN'));
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      currentSessionIdRef.current = `session-${Date.now()}`;
      videoChunksRef.current = [];

      // Setup WebSocket handlers
        ws.onopen = () => {
          console.log('✅ WebSocket connected to Gemini Live API');
          
          // Send initial setup message for Gemini 2.0 Flash Experimental (supports Live API)
          const setupMessage = {
            setup: {
              model: 'models/gemini-2.0-flash-exp',
              generation_config: {
                response_modalities: ['AUDIO'], // Gemini 2.0 only supports AUDIO in live mode
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: 'Puck'
                    }
                  }
                },
                temperature: 0.7,
              },
              system_instruction: {
                parts: [{
                  text: `You are a helpful, curious human assistant specializing in home repair issues. You're analyzing a live video stream from the user's camera.

YOUR ROLE:
- Be genuinely curious and ask questions to understand the problem better
- Actively provide feedback about what you can and cannot see in the video
- Guide users to get better camera angles when needed

VIDEO FEEDBACK GUIDELINES:
- If the video is too far away, ask them to "move the camera closer so I can see the details better"
- If something is unclear or blurry, say "could you adjust the camera angle? I'm having trouble seeing [specific part]"
- If lighting is poor, mention "the lighting is a bit dark, could you shine more light on the area?"
- If you need to see a different angle, ask "can you show me the [side/back/top] of that?"
- When you have a good view, acknowledge it: "great, I can see it clearly now"

INTERACTION STYLE:
- Keep responses conversational, brief (1-3 sentences), and natural
- Show genuine interest: "interesting, tell me more about when this started"
- Ask follow-up questions: "does it make any noise?", "when did you first notice this?"
- Provide helpful observations: "I can see some water damage around the edges"
- Be encouraging and supportive throughout

Remember: You're helping them document and understand their repair issue through an interactive video conversation. Guide them to show you what you need to see.`
                }]
              }
            }
          };
          
          console.log('📤 Sending setup message:', JSON.stringify(setupMessage, null, 2));
          ws.send(JSON.stringify(setupMessage));
          
          // Start Web Speech API for transcribing USER's voice
          startSpeechRecognition();
          
          // Start streaming audio after a short delay to ensure setup is complete
          setTimeout(() => {
            startAudioStreaming(ws);
          }, 500);
        };

      ws.onmessage = async (event) => {
        try {
          // Check if message is binary (Blob) or text (JSON)
          if (event.data instanceof Blob) {
            console.log('📦 Received binary data (Blob):', event.data.size, 'bytes');
            
            // Convert Blob to text and parse as JSON
            const text = await event.data.text();
            console.log('📄 Blob text content:', text.substring(0, 200) + '...');
            
            try {
              const data = JSON.parse(text);
              handleJsonMessage(data);
            } catch (parseErr) {
              console.error('❌ Could not parse Blob as JSON:', parseErr);
              console.log('Raw text:', text);
            }
          } else {
            // Direct JSON string
            const data = JSON.parse(event.data);
            handleJsonMessage(data);
          }
        } catch (err) {
          console.error('❌ Error handling WebSocket message:', err);
          console.error('Event data type:', typeof event.data);
          console.error('Event data:', event.data);
        }
      };
      
      const handleJsonMessage = (data: any) => {
        console.log('📥 Received from Gemini:', JSON.stringify(data, null, 2));
        
        // Handle setup complete
        if (data.setupComplete) {
          console.log('✅ Gemini setup complete!');
        }
        
        // Handle server content - this is where AI responses come
        if (data.serverContent) {
          console.log('🤖 Server content received:', data.serverContent);
          
          const modelTurn = data.serverContent.modelTurn;
          const turnComplete = data.serverContent.turnComplete;
          
          if (modelTurn?.parts) {
            console.log('📝 Model turn parts:', modelTurn.parts);
            
              modelTurn.parts.forEach((part: any) => {
                // Handle inline data (audio responses)
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
                  console.log('📦 Received audio from Gemini, mimeType:', part.inlineData.mimeType);
                  
                  // Just play audio - Gemini Live API doesn't provide text transcripts
                  playAudioResponse(part.inlineData.data, part.inlineData.mimeType);
                }
              });
          }
          
          if (turnComplete) {
            console.log('✅ Turn complete');
          }
        }
        
        // Handle tool calls
        if (data.toolCall) {
          console.log('🔧 Tool call:', data.toolCall);
        }
        
        // Handle errors from server
        if (data.error) {
          console.error('❌ Server error:', data.error);
          setError(`Gemini API Error: ${data.error.message || 'Unknown error'}`);
        }
      };
      
      const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number = 1) => {
        const header = new ArrayBuffer(44);
        const view = new DataView(header);

        // "RIFF" chunk descriptor
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + dataLength, true); // File size - 8
        view.setUint32(8, 0x57415645, false); // "WAVE"

        // "fmt " sub-chunk
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numChannels, true); // NumChannels
        view.setUint32(24, sampleRate, true); // SampleRate
        view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
        view.setUint16(32, numChannels * 2, true); // BlockAlign
        view.setUint16(34, 16, true); // BitsPerSample

        // "data" sub-chunk
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, dataLength, true); // Subchunk2Size

        return new Uint8Array(header);
      };

      const playAudioResponse = async (base64Audio: string, mimeType: string) => {
        try {
          console.log('🎵 Attempting to play audio, mime:', mimeType, 'data length:', base64Audio.length);
          
          // Initialize playback audio context if not exists
          if (!playbackAudioContextRef.current) {
            playbackAudioContextRef.current = new AudioContext();
            console.log('🔊 Created new AudioContext for playback');
          }
          
          const audioContext = playbackAudioContextRef.current;
          
          // Decode base64 to binary
          const binaryString = atob(base64Audio);
          const pcmData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            pcmData[i] = binaryString.charCodeAt(i);
          }
          
          console.log('📦 Decoded PCM data:', pcmData.length, 'bytes');
          
          // Extract sample rate from mime type (e.g., "audio/pcm;rate=24000")
          let sampleRate = 24000; // Default
          const rateMatch = mimeType.match(/rate=(\d+)/);
          if (rateMatch) {
            sampleRate = parseInt(rateMatch[1]);
          }
          console.log('📊 Sample rate:', sampleRate, 'Hz');
          
          // Create WAV file from PCM data
          const wavHeader = createWavHeader(pcmData.length, sampleRate, 1);
          const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
          wavFile.set(wavHeader, 0);
          wavFile.set(pcmData, wavHeader.length);
          
          console.log('🎼 Created WAV file:', wavFile.length, 'bytes');
          
          try {
            const audioBuffer = await audioContext.decodeAudioData(wavFile.buffer.slice(0));
            console.log('✅ Audio decoded successfully:', audioBuffer.duration, 'seconds');
            
            // Add to queue
            audioQueueRef.current.push(audioBuffer);
            console.log('📋 Added to queue, total chunks:', audioQueueRef.current.length);
            
            // Start playing if not already playing
            if (!isPlayingRef.current) {
              playNextAudioChunk();
            }
          } catch (decodeErr) {
            console.error('❌ Error decoding WAV audio:', decodeErr);
          }
        } catch (err) {
          console.error('❌ Error in playAudioResponse:', err);
        }
      };
      
       const playNextAudioChunk = () => {
         if (!playbackAudioContextRef.current || audioQueueRef.current.length === 0) {
           isPlayingRef.current = false;
           console.log('🔇 Gemini audio queue empty');
           
           // Keep Gemini flag set for 1 second after last audio chunk
           // This prevents misattribution during brief gaps
           if (geminiStopTimeoutRef.current) {
             clearTimeout(geminiStopTimeoutRef.current);
           }
           geminiStopTimeoutRef.current = setTimeout(() => {
             isGeminiSpeakingRef.current = false;
             console.log('🔇 Gemini finished speaking (with delay)');
           }, 1000);
           
           return;
         }
        
        // Cancel any pending timeout - Gemini is still speaking
        if (geminiStopTimeoutRef.current) {
          clearTimeout(geminiStopTimeoutRef.current);
          geminiStopTimeoutRef.current = null;
        }
        
        // Mark that Gemini is speaking
        isGeminiSpeakingRef.current = true;
        isPlayingRef.current = true;
        console.log('🤖 Gemini speaking flag SET');
        
        const audioContext = playbackAudioContextRef.current;
        const audioBuffer = audioQueueRef.current.shift()!;
        
        console.log('🔊 Playing Gemini audio, duration:', audioBuffer.duration, 'seconds');
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        // Store reference to current audio source so we can stop it if needed
        currentAudioSourceRef.current = source;
        
        source.onended = () => {
          console.log('🔇 Audio chunk finished, checking for more...');
          currentAudioSourceRef.current = null;
          playNextAudioChunk();
        };
        
        try {
          source.start(0);
          console.log('▶️ Gemini audio playback started!');
        } catch (err) {
          console.error('❌ Error starting audio playback:', err);
          isPlayingRef.current = false;
          isGeminiSpeakingRef.current = false;
          currentAudioSourceRef.current = null;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection error with Gemini Live API. Check your API key and internet connection.');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        if (event.code !== 1000) {
          console.error('Abnormal closure:', event);
        }
      };

      // Start recording video for playback
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // Capture in 100ms chunks

      // Start duration tracking
      streamStartTimeRef.current = Date.now();
      setStreamState('streaming');
      
      durationIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - streamStartTimeRef.current) / 1000;
        setStreamDuration(elapsed);
      }, 100);

      // Capture video frames and send to Gemini
      startVideoCapture(ws);

    } catch (err) {
      console.error('Failed to start streaming:', err);
      setError('Failed to start live streaming with Gemini AI');
    }
  };

   const startSpeechRecognition = () => {
     try {
       // @ts-ignore - Web Speech API
       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
       
       if (!SpeechRecognition) {
         console.warn('⚠️ Web Speech API not supported in this browser');
         return;
       }

       const recognition = new SpeechRecognition();
       recognition.continuous = true;
       recognition.interimResults = true; // Word-by-word for user
       recognition.lang = 'en-US';

       recognition.onresult = (event: any) => {
         let interimTranscript = '';
         let finalTranscript = '';
         
         for (let i = event.resultIndex; i < event.results.length; i++) {
           const transcript = event.results[i][0].transcript;
           if (event.results[i].isFinal) {
             finalTranscript += transcript;
           } else {
             interimTranscript += transcript;
           }
         }

         // Determine speaker based on whether Gemini is currently playing audio
         const speaker = isGeminiSpeakingRef.current ? 'ai' : 'user';
         const speakerLabel = speaker === 'ai' ? '🤖 Gemini' : '🗣️ User';

         // If speaker changed, finalize the previous entry and start a new one
         if (currentSpeakerRef.current !== speaker) {
           console.log(`🔄 Speaker changed from ${currentSpeakerRef.current} to ${speaker}`);
           currentInterimIdRef.current = null; // Clear interim ID to start new entry
           currentSpeakerRef.current = speaker;
         }

         if (interimTranscript) {
           console.log(`${speakerLabel} (interim) [flag=${isGeminiSpeakingRef.current}]:`, interimTranscript);
           
           setCurrentTranscript(prev => {
             const interimIndex = currentInterimIdRef.current 
               ? prev.findIndex((entry, idx) => idx >= Math.max(0, prev.length - 5) && entry.id === currentInterimIdRef.current)
               : -1;
             
             if (interimIndex !== -1 && prev[interimIndex].speaker === speaker) {
               // Update existing interim entry ONLY if speaker matches
               const newTranscript = [...prev];
               newTranscript[interimIndex] = {
                 ...newTranscript[interimIndex],
                 text: interimTranscript.trim(),
               };
               return newTranscript;
             } else {
               // Create new interim entry
               currentInterimIdRef.current = `${speaker}-interim-${Date.now()}`;
               return [...prev, {
                 id: currentInterimIdRef.current,
                 text: interimTranscript.trim(),
                 speaker: speaker,
                 timestamp: Date.now(),
               }];
             }
           });
         }

          if (finalTranscript) {
            const trimmedFinal = finalTranscript.trim();
            console.log(`${speakerLabel} (final) [flag=${isGeminiSpeakingRef.current}]:`, trimmedFinal);
            
            setCurrentTranscript(prev => {
              // Check for duplicates: if the last entry for this speaker has the exact same text, skip it
              const lastEntryForSpeaker = [...prev].reverse().find(entry => entry.speaker === speaker);
              if (lastEntryForSpeaker && lastEntryForSpeaker.text === trimmedFinal) {
                console.log(`⚠️ Skipping duplicate final transcript for ${speakerLabel}:`, trimmedFinal);
                return prev; // Skip this duplicate
              }
              
              const interimIndex = currentInterimIdRef.current 
                ? prev.findIndex((entry, idx) => idx >= Math.max(0, prev.length - 5) && entry.id === currentInterimIdRef.current)
                : -1;
              
              if (interimIndex !== -1 && prev[interimIndex].speaker === speaker) {
                // Replace interim entry with final ONLY if speaker matches
                const newTranscript = [...prev];
                newTranscript[interimIndex] = {
                  id: `${speaker}-${Date.now()}`,
                  text: trimmedFinal,
                  speaker: speaker,
                  timestamp: Date.now(),
                };
                currentInterimIdRef.current = null;
                return newTranscript;
              } else {
                // No matching interim, add as new final entry
                currentInterimIdRef.current = null;
                return [...prev, {
                  id: `${speaker}-${Date.now()}`,
                  text: trimmedFinal,
                  speaker: speaker,
                  timestamp: Date.now(),
                }];
              }
            });
          }
       };

       recognition.onerror = (event: any) => {
         if (event.error !== 'no-speech' && event.error !== 'aborted') {
           console.error('❌ User speech recognition error:', event.error);
         }
       };

       recognition.onend = () => {
         console.log('🔄 User speech recognition ended');
         // Auto-restart if still streaming and not stopped manually
         if (speechRecognitionRef.current !== null) {
           setTimeout(() => {
             try {
               if (speechRecognitionRef.current) {
                 recognition.start();
                 console.log('✅ Auto-restarted user speech recognition');
               }
             } catch (err) {
               console.error('Error restarting recognition:', err);
             }
           }, 100);
         }
       };

       recognition.start();
       speechRecognitionRef.current = recognition;
       console.log('✅ User speech recognition started - word-by-word');
     } catch (err) {
       console.error('❌ Error starting user speech recognition:', err);
     }
   };

   const startAudioStreaming = (ws: WebSocket) => {
    if (!mediaStream) {
      console.error('❌ No media stream available for audio');
      return;
    }

    try {
      console.log('🎤 Starting audio streaming...');
      
      // Create audio context - use default sample rate first, we'll resample
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(mediaStream);
      
      // Use ScriptProcessor with larger buffer for better stability
      const processor = audioContext.createScriptProcessor(16384, 1, 1);
      
      let chunkCount = 0;
      let lastSendTime = 0;
      const sendInterval = 100; // Send every 100ms to avoid overwhelming
      
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) {
          if (chunkCount === 0) {
            console.error('❌ WebSocket not open when trying to send audio');
          }
          return;
        }
        
        const now = Date.now();
        if (now - lastSendTime < sendInterval) {
          return; // Throttle sending
        }
        lastSendTime = now;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const sampleRate = e.inputBuffer.sampleRate;
        
        // Resample to 16kHz if needed
        let audioData = inputData;
        if (sampleRate !== 16000) {
          const ratio = 16000 / sampleRate;
          const newLength = Math.floor(inputData.length * ratio);
          const resampledData = new Float32Array(newLength);
          
          for (let i = 0; i < newLength; i++) {
            const srcIndex = i / ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
            const t = srcIndex - srcIndexFloor;
            resampledData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
          }
          audioData = resampledData;
        }
        
        // Convert float32 to PCM16
        const pcm16 = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          const s = Math.max(-1, Math.min(1, audioData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const base64 = btoa(
          String.fromCharCode(...Array.from(new Uint8Array(pcm16.buffer)))
        );
        
        // Send audio chunk to Gemini with correct format
        const message = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: 'audio/pcm',
              data: base64
            }]
          }
        };
        
        try {
          ws.send(JSON.stringify(message));
          chunkCount++;
          if (chunkCount === 1 || chunkCount % 10 === 0) {
            console.log(`🎵 Audio chunk #${chunkCount} sent (${pcm16.length} samples @ 16kHz)`);
          }
        } catch (err) {
          console.error('❌ Error sending audio chunk:', err);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('✅ Audio streaming started successfully');
    } catch (err) {
      console.error('❌ Error starting audio stream:', err);
      setError('Failed to start audio streaming');
    }
  };

  const startVideoCapture = (ws: WebSocket) => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const captureFrame = () => {
      if (streamState !== 'streaming' || !videoRef.current || !ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob((blob) => {
        if (blob && ws.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then(buffer => {
            const base64 = btoa(
              new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            
            // Send frame to Gemini
            const message = {
              realtimeInput: {
                mediaChunks: [{
                  mimeType: 'image/jpeg',
                  data: base64
                }]
              }
            };
            
            try {
              ws.send(JSON.stringify(message));
              console.log('📹 Video frame sent');
            } catch (err) {
              console.error('❌ Error sending video frame:', err);
            }
          });
        }
      }, 'image/jpeg', 0.5);

      // Capture next frame (every 2 seconds to avoid overwhelming the API)
      if (streamState === 'streaming') {
        setTimeout(captureFrame, 2000);
      }
    };

    // Wait a bit before starting video capture to let audio streaming start
    setTimeout(() => {
      console.log('📹 Starting video capture...');
      captureFrame();
      console.log('✅ Video capture started successfully');
    }, 1500);
  };

  const stopStreaming = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Clear Gemini speaking timeout
    if (geminiStopTimeoutRef.current) {
      clearTimeout(geminiStopTimeoutRef.current);
      geminiStopTimeoutRef.current = null;
    }
    isGeminiSpeakingRef.current = false;

    // Stop Gemini audio immediately
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
        console.log('🔇 Stopped Gemini audio immediately');
      } catch (err) {
        console.error('Error stopping audio:', err);
      }
    }
    
    // Clear audio queue and reset playback state
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    // Reset speaker tracking
    currentInterimIdRef.current = null;
    currentSpeakerRef.current = 'user';

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
        console.log('🛑 Speech recognition stopped');
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        const newSession: LiveStreamSession = {
          id: currentSessionIdRef.current,
          timestamp: new Date(streamStartTimeRef.current),
          duration: streamDuration,
          transcript: currentTranscript,
          videoBlob,
          videoUrl,
        };

        setSessions(prev => [...prev, newSession]);
        setSelectedSession(newSession.id);
        setStreamState('stopped');
        
        // Notify parent component that streaming has stopped
        if (onStreamingStopped) {
          onStreamingStopped();
        }
      };
    } else {
      setStreamState('stopped');
      
      // Notify parent component that streaming has stopped
      if (onStreamingStopped) {
        onStreamingStopped();
      }
    }
  };

  const deleteSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session && session.videoUrl) {
      URL.revokeObjectURL(session.videoUrl);
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selectedSession === id) {
      setSelectedSession(null);
    }
  };

  const uploadSessions = () => {
    if (sessions.length === 0) return;
    // Sessions will be stored as live stream data type
    // For now, just close the modal - in the future, these could be uploaded to the server
    closeLiveModal();
  };

  const closeLiveModal = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Clear Gemini speaking timeout
    if (geminiStopTimeoutRef.current) {
      clearTimeout(geminiStopTimeoutRef.current);
      geminiStopTimeoutRef.current = null;
    }
    isGeminiSpeakingRef.current = false;

    // Stop Gemini audio immediately
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
        console.log('🔇 Stopped Gemini audio immediately');
      } catch (err) {
        console.error('Error stopping audio:', err);
      }
    }
    
    // Clear audio queue and reset playback state
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    // Reset speaker tracking
    currentInterimIdRef.current = null;
    currentSpeakerRef.current = 'user';

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
        console.log('🛑 Speech recognition stopped');
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (playbackAudioContextRef.current) {
      playbackAudioContextRef.current.close();
      playbackAudioContextRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    sessions.forEach(session => {
      if (session.videoUrl) {
        URL.revokeObjectURL(session.videoUrl);
      }
    });

    setShowLiveModal(false);
    setStreamState('idle');
    setSessions([]);
    setSelectedSession(null);
    setCurrentTranscript([]);
    setStreamDuration(0);
    
    // Notify parent component that streaming has stopped (if it was streaming)
    if (onStreamingStopped) {
      onStreamingStopped();
    }
  };

  return {
    showLiveModal,
    streamState,
    sessions,
    selectedSession,
    currentTranscript,
    streamDuration,
    videoRef,
    mediaStream,
    openLiveModal,
    startStreaming,
    stopStreaming,
    deleteSession,
    uploadSessions,
    closeLiveModal,
    setSelectedSession,
  };
};

