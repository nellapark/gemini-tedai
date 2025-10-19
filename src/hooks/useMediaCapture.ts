import { useState, useRef } from 'react';
import { MediaFile, InputMode } from '../types';

export const useMediaCapture = (
  mediaFiles: MediaFile[],
  setMediaFiles: (files: MediaFile[]) => void,
  setError: (error: string | null) => void,
  inputMode: InputMode,
  setInputMode: (mode: InputMode) => void
) => {
  const [isCapturingMedia, setIsCapturingMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startMediaCapture = async (type: 'video' | 'photo') => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: type === 'video',
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturingMedia(true);

        if (type === 'video') {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const file = new File([blob], `recorded-${Date.now()}.webm`, { type: 'video/webm' });
            const preview = URL.createObjectURL(blob);

            const existingNonVideo = mediaFiles.filter((m) => m.type !== 'video');
            setMediaFiles([...existingNonVideo, { file, type: 'video', preview, annotation: '' }]);

            stream.getTracks().forEach((track) => track.stop());
            setIsCapturingMedia(false);
          };

          mediaRecorder.start();

          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 60000);
        }
      }
    } catch (err) {
      setError('Failed to access camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);

          const existingImages = mediaFiles.filter((m) => m.type === 'image');
          if (existingImages.length >= 5) {
            setError('Maximum 5 images allowed');
            return;
          }

          setMediaFiles([...mediaFiles, { file, type: 'image', preview, annotation: '' }]);
        }
      }, 'image/jpeg');
    }
  };

  const stopMediaCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCapturingMedia(false);
  };

  return {
    isCapturingMedia,
    videoRef,
    mediaRecorderRef,
    startMediaCapture,
    capturePhoto,
    stopMediaCapture,
  };
};

