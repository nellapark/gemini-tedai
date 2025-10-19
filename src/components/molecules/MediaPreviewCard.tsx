import React from 'react';
import { MicrophoneIcon } from '../Icons';
import { MediaFile } from '../../types';

interface MediaPreviewCardProps {
  media: MediaFile;
  onRemove: () => void;
  onAnnotate: () => void;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  media,
  onRemove,
  onAnnotate,
}) => {
  const needsAnnotation = media.type === 'video' || media.type === 'image';
  const missingAnnotation = needsAnnotation && !media.annotation;

  return (
    <div className={`border-2 rounded-lg p-3 transition-colors ${
      missingAnnotation 
        ? 'border-red-500 bg-red-50' 
        : 'border-neutral-200 bg-white'
    }`}>
      <div className="flex gap-3">
        <div className="relative group flex-shrink-0">
          {media.type === 'video' && (
            <video src={media.preview} className="w-24 h-24 object-cover rounded-lg" />
          )}
          {media.type === 'image' && (
            <img src={media.preview} alt="Upload" className="w-24 h-24 object-cover rounded-lg" />
          )}
          {media.type === 'audio' && (
            <div className="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center">
              <MicrophoneIcon className="w-8 h-8 text-neutral-400" />
            </div>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1">
          <p className="text-xs text-neutral-500 mb-2 truncate">{media.file.name}</p>
          {needsAnnotation ? (
            <>
              {media.annotation ? (
                <p className="text-sm text-neutral-700 mb-1">{media.annotation}</p>
              ) : (
                <p className="text-sm text-red-600 font-medium mb-1">⚠️ Annotation required</p>
              )}
              <button
                type="button"
                onClick={onAnnotate}
                className={`text-xs hover:underline ${
                  missingAnnotation ? 'text-red-600 font-semibold' : 'text-primary'
                }`}
              >
                {media.annotation ? 'Edit' : 'Add'} annotation
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-600">Audio recording</p>
          )}
        </div>
      </div>
    </div>
  );
};

