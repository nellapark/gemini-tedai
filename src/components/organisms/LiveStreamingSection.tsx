import React from 'react';
import { VideoIcon } from '../Icons';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { RecordingIndicator } from '../molecules/RecordingIndicator';
import { InputMode, MediaFile } from '../../types';

interface LiveStreamingSectionProps {
  isStreaming: boolean;
  inputMode: InputMode;
  hasVisualMedia: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const LiveStreamingSection: React.FC<LiveStreamingSectionProps> = ({
  isStreaming,
  inputMode,
  hasVisualMedia,
  onStart,
  onStop,
}) => {
  return (
    <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
            <Badge variant="success" size="sm">RECOMMENDED</Badge>
            <span className="ml-2">Live Video Streaming</span>
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Stream live video to Gemini AI and get instant spoken feedback as you show the problem
          </p>
        </div>
      </div>

      {!isStreaming ? (
        <Button
          variant="success"
          fullWidth
          onClick={onStart}
          disabled={hasVisualMedia}
          className="py-4"
        >
          <VideoIcon className="w-5 h-5 mr-2" />
          Start Live Streaming with AI
        </Button>
      ) : (
        <div className="space-y-3">
          <RecordingIndicator label="Streaming to Gemini AI..." isLive />
          <Button variant="danger" fullWidth onClick={onStop}>
            Stop Streaming
          </Button>
        </div>
      )}

      {hasVisualMedia && (
        <p className="text-xs text-neutral-500 mt-2 text-center">
          Clear uploaded video/photos to use live streaming
        </p>
      )}
    </div>
  );
};

