import React from 'react';
import { MicrophoneIcon } from '../Icons';
import { InputMode } from '../../types';

interface AudioRecordingSectionProps {
  inputMode: InputMode;
  isAnalyzing: boolean;
  onOpenModal: () => void;
}

export const AudioRecordingSection: React.FC<AudioRecordingSectionProps> = ({
  inputMode,
  isAnalyzing,
  onOpenModal,
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-700 mb-3">Voice Note (Optional)</h3>
      <button
        type="button"
        onClick={onOpenModal}
        disabled={isAnalyzing || inputMode === 'live-streaming'}
        className="w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MicrophoneIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-neutral-800 text-center">Record Audio</p>
        <p className="text-xs text-neutral-500 text-center mt-1">
          Record multiple voice notes to describe the issue
        </p>
      </button>
    </div>
  );
};

