import { useState, useRef } from 'react';
import { MediaFile, InputMode } from '../types';

export const useAudioRecording = (
  mediaFiles: MediaFile[],
  setMediaFiles: (files: MediaFile[]) => void,
  setError: (error: string | null) => void,
  inputMode: InputMode,
  setInputMode: (mode: InputMode) => void
) => {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startAudioRecording = async () => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });

        const existingNonAudio = mediaFiles.filter((m) => m.type !== 'audio');
        setMediaFiles([...existingNonAudio, { file, type: 'audio', annotation: '' }]);

        cleanupAudio();
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setShowAudioModal(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 60000);
    } catch (err) {
      setError('Failed to access microphone. Please make sure you granted microphone permissions.');
      setShowAudioModal(false);
    }
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecordingAudio(false);
    setShowAudioModal(false);
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const closeAudioModal = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanupAudio();
  };

  return {
    isRecordingAudio,
    showAudioModal,
    startAudioRecording,
    stopAudioRecording,
    closeAudioModal,
  };
};

