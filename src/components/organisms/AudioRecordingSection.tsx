import React from 'react';
import { MicrophoneIcon } from '../Icons';
import { Button } from '../atoms/Button';
import { RecordingIndicator } from '../molecules/RecordingIndicator';
import { InputMode } from '../../types';

interface AudioRecordingSectionProps {
  isRecording: boolean;
  inputMode: InputMode;
  isAnalyzing: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const AudioRecordingSection: React.FC<AudioRecordingSectionProps> = ({
  isRecording,
  inputMode,
  isAnalyzing,
  onStart,
  onStop,
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-700 mb-3">Voice Note (Optional)</h3>
      {!isRecording ? (
        <button
          type="button"
          onClick={onStart}
          disabled={isAnalyzing || inputMode === 'live-streaming'}
          className="w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MicrophoneIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-800 text-center">Record Audio</p>
          <p className="text-xs text-neutral-500 text-center mt-1">
            Use your microphone to describe the issue
          </p>
        </button>
      ) : (
        <div className="border-2 border-red-500 rounded-xl p-6 bg-red-50">
          <div className="text-center">
            <div className="animate-pulse text-red-500 text-4xl mb-2">●</div>
            <p className="text-sm font-medium text-neutral-800 mb-3">Recording...</p>
            <Button variant="danger" onClick={onStop}>
              Stop Recording
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

