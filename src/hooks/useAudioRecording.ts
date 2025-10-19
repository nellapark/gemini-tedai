import { useState, useRef } from 'react';
import { MediaFile, InputMode, AudioRecording, RecordingState } from '../types';

export const useAudioRecording = (
  mediaFiles: MediaFile[],
  setMediaFiles: (files: MediaFile[]) => void,
  setError: (error: string | null) => void,
  inputMode: InputMode,
  setInputMode: (mode: InputMode) => void
) => {
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const openAudioModal = async () => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setShowAudioModal(true);
      setRecordingState('idle');
    } catch (err) {
      setError('Failed to access microphone. Please make sure you granted microphone permissions.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    setRecordingDuration(0);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.start();
    setRecordingState('recording');

    // Update duration every 100ms
    durationIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTimeRef.current - pausedDurationRef.current) / 1000;
      setRecordingDuration(elapsed);
    }, 100);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      const pauseTime = Date.now();
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      
      // Track paused duration
      const pauseDuration = Date.now() - pauseTime;
      pausedDurationRef.current += pauseDuration;

      // Resume duration updates
      durationIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current - pausedDurationRef.current) / 1000;
        setRecordingDuration(elapsed);
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const id = `audio-${Date.now()}`;
        
        const newRecording: AudioRecording = {
          id,
          blob,
          url,
          duration: recordingDuration,
          timestamp: new Date(),
        };

        setRecordings((prev) => [...prev, newRecording]);
        setSelectedRecording(id);
        setRecordingState('idle');
        setRecordingDuration(0);
      };
    }
  };

  const restartRecording = () => {
    if (mediaRecorderRef.current) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.stop();
      }
    }
    audioChunksRef.current = [];
    setRecordingState('idle');
    setRecordingDuration(0);
    startRecording();
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find((r) => r.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecording === id) {
      setSelectedRecording(null);
    }
  };

  const uploadRecordings = () => {
    if (recordings.length === 0) return;

    const existingNonAudio = mediaFiles.filter((m) => m.type !== 'audio');
    const newAudioFiles: MediaFile[] = recordings.map((recording) => {
      const file = new File([recording.blob], `audio-${recording.timestamp.getTime()}.webm`, { 
        type: 'audio/webm' 
      });
      return {
        file,
        type: 'audio' as const,
        annotation: '',
        source: 'upload' as const,
      };
    });

    setMediaFiles([...existingNonAudio, ...newAudioFiles]);
    closeAudioModal();
  };

  const closeAudioModal = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clean up recording URLs
    recordings.forEach((recording) => {
      URL.revokeObjectURL(recording.url);
    });

    setShowAudioModal(false);
    setRecordingState('idle');
    setRecordings([]);
    setSelectedRecording(null);
    setRecordingDuration(0);
  };

  return {
    showAudioModal,
    recordingState,
    recordings,
    selectedRecording,
    recordingDuration,
    openAudioModal,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    deleteRecording,
    uploadRecordings,
    closeAudioModal,
    setSelectedRecording,
  };
};

