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
  const videoChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamStartTimeRef = useRef<number>(0);
  const currentSessionIdRef = useRef<string>('');

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
    } catch (err) {
      setError('Failed to access camera and microphone. Please make sure you granted permissions.');
    }
  };

  const startStreaming = async () => {
    if (!mediaStream) return;

    try {
      // Initialize WebSocket connection to Gemini Live API
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      currentSessionIdRef.current = `session-${Date.now()}`;
      videoChunksRef.current = [];

      // Setup WebSocket handlers
      ws.onopen = () => {
        console.log('WebSocket connected to Gemini Live API');
        
        // Send initial setup message
        const setupMessage = {
          setup: {
            model: 'models/gemini-2.0-flash-exp',
            generation_config: {
              response_modalities: ['AUDIO'],
            },
            system_instruction: {
              parts: [{
                text: 'You are an AI assistant helping users analyze home repair issues. Provide helpful feedback and ask clarifying questions about what you see in the video feed.'
              }]
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle server text response
          if (data.serverContent?.modelTurn?.parts) {
            data.serverContent.modelTurn.parts.forEach((part: any) => {
              if (part.text) {
                const entry: TranscriptEntry = {
                  id: `ai-${Date.now()}-${Math.random()}`,
                  text: part.text,
                  speaker: 'ai',
                  timestamp: Date.now(),
                };
                setCurrentTranscript(prev => [...prev, entry]);
              }
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error with Gemini Live API');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
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
            ws.send(JSON.stringify(message));
          });
        }
      }, 'image/jpeg', 0.7);

      // Capture next frame (every 1 second to avoid overwhelming the API)
      if (streamState === 'streaming') {
        setTimeout(captureFrame, 1000);
      }
    };

    captureFrame();
  };

  const stopStreaming = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
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

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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

