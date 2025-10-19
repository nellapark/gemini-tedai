import React from 'react';
import { UploadIcon } from '../Icons';
import { UploadCard } from '../molecules/UploadCard';
import { InputMode } from '../../types';

interface MediaUploadSectionProps {
  inputMode: InputMode;
  isAnalyzing: boolean;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  inputMode,
  isAnalyzing,
  onVideoUpload,
  onPhotoUpload,
}) => {
  const isDisabled = isAnalyzing || inputMode === 'live-streaming';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-3">Upload Media</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Upload video or photos of the problem
        </p>
      </div>

      {/* Upload Options */}
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
          icon={<UploadIcon className="w-10 h-10 text-primary" />}
          title="Upload Photos"
          subtitle="Up to 5 images"
          accept="image/*"
          multiple
          onChange={onPhotoUpload}
          disabled={isDisabled}
        />
      </div>
    </div>
  );
};

