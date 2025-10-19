import React from 'react';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  onCapturePhoto: () => void;
  onStop: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  isRecording,
  onCapturePhoto,
  onStop,
}) => {
  return (
    <div className="border-2 border-primary rounded-xl p-4 bg-neutral-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg mb-3"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCapturePhoto}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          📸 Capture Photo
        </button>
        <button
          type="button"
          onClick={onStop}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Stop
        </button>
      </div>
      {isRecording && (
        <p className="text-white text-sm text-center mt-2">
          <span className="animate-pulse text-red-500">●</span> Recording video...
        </p>
      )}
    </div>
  );
};

