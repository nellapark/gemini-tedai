import React from 'react';
import { UploadIcon, VideoIcon, ImageIcon } from '../Icons';
import { UploadCard } from '../molecules/UploadCard';
import { CameraPreview } from '../molecules/CameraPreview';
import { InputMode } from '../../types';

interface MediaUploadSectionProps {
  inputMode: InputMode;
  isAnalyzing: boolean;
  isCapturingMedia: boolean;
  isRecording: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoRecord: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoCapture: () => void;
  onCapturePhoto: () => void;
  onStopCapture: () => void;
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  inputMode,
  isAnalyzing,
  isCapturingMedia,
  isRecording,
  videoRef,
  onVideoUpload,
  onVideoRecord,
  onPhotoUpload,
  onPhotoCapture,
  onCapturePhoto,
  onStopCapture,
}) => {
  const isDisabled = isAnalyzing || inputMode === 'live-streaming';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-3">Upload or Record Media</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Upload existing files or use your camera to capture video/photos of the problem
        </p>
      </div>

      {/* Video Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadCard
          icon={<UploadIcon className="w-10 h-10 text-primary" />}
          title="Upload Video"
          subtitle="Up to 60 seconds"
          accept="video/*"
          onChange={onVideoUpload}
          disabled={isDisabled}
        />
        <UploadCard
          icon={<VideoIcon className="w-10 h-10 text-primary" />}
          title="Record Video"
          subtitle="Use your camera"
          isButton
          onClick={onVideoRecord}
          disabled={isDisabled || isCapturingMedia}
        />
      </div>

      {/* Camera Preview */}
      {isCapturingMedia && (
        <CameraPreview
          videoRef={videoRef}
          isRecording={isRecording}
          onCapturePhoto={onCapturePhoto}
          onStop={onStopCapture}
        />
      )}

      {/* Photo Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadCard
          icon={<UploadIcon className="w-10 h-10 text-primary" />}
          title="Upload Photos"
          subtitle="Up to 5 images"
          accept="image/*"
          multiple
          onChange={onPhotoUpload}
          disabled={isDisabled}
        />
        <UploadCard
          icon={<ImageIcon className="w-10 h-10 text-primary" />}
          title="Take Photos"
          subtitle="Use your camera"
          isButton
          onClick={onPhotoCapture}
          disabled={isDisabled || isCapturingMedia}
        />
      </div>
    </div>
  );
};

