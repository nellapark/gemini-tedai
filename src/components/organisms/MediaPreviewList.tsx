import React from 'react';
import { MediaFile } from '../../types';
import { MediaPreviewCard } from '../molecules/MediaPreviewCard';
import { AnnotationEditor } from '../molecules/AnnotationEditor';

interface MediaPreviewListProps {
  mediaFiles: MediaFile[];
  editingIndex: number | null;
  tempAnnotation: string;
  onRemove: (index: number) => void;
  onStartEdit: (index: number) => void;
  onSaveAnnotation: () => void;
  onCancelEdit: () => void;
  onAnnotationChange: (value: string) => void;
}

export const MediaPreviewList: React.FC<MediaPreviewListProps> = ({
  mediaFiles,
  editingIndex,
  tempAnnotation,
  onRemove,
  onStartEdit,
  onSaveAnnotation,
  onCancelEdit,
  onAnnotationChange,
}) => {
  if (mediaFiles.length === 0) return null;

  return (
    <div className="border border-neutral-200 rounded-xl p-4">
      <h3 className="font-semibold text-neutral-800 mb-3">Your Media ({mediaFiles.length})</h3>
      <div className="space-y-4">
        {mediaFiles.map((media, index) => {
          const needsAnnotation = media.type === 'video' || media.type === 'image';
          
          return (
            <div key={index}>
              {editingIndex === index && needsAnnotation ? (
                <div className="border border-neutral-200 rounded-lg p-3">
                  <div className="flex gap-3">
                    <div className="w-24 h-24 flex-shrink-0 bg-neutral-100 rounded-lg" />
                    <div className="flex-1">
                      <p className="text-xs text-neutral-500 mb-2 truncate">{media.file.name}</p>
                      <AnnotationEditor
                        value={tempAnnotation}
                        onChange={onAnnotationChange}
                        onSave={onSaveAnnotation}
                        onCancel={onCancelEdit}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <MediaPreviewCard
                  media={media}
                  onRemove={() => onRemove(index)}
                  onAnnotate={() => onStartEdit(index)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

