import React from 'react';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { MicrophoneIcon } from '../Icons';

interface AudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  onStop: () => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({
  isOpen,
  onClose,
  isRecording,
  onStop,
}) => {
  const handleClose = () => {
    if (isRecording) {
      onStop();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Audio"
      size="md"
    >
      <div className="space-y-6 py-4">
        <div className="flex flex-col items-center">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
            isRecording ? 'bg-red-100 animate-pulse' : 'bg-neutral-100'
          }`}>
            <MicrophoneIcon className={`w-16 h-16 ${
              isRecording ? 'text-red-500' : 'text-neutral-400'
            }`} />
          </div>
          
          <div className="mt-6 text-center">
            {isRecording ? (
              <>
                <div className="flex items-center justify-center gap-2 text-red-500 font-semibold text-lg mb-2">
                  <span className="animate-pulse text-2xl">●</span>
                  <span>Recording...</span>
                </div>
                <p className="text-sm text-neutral-600">
                  Describe the home repair issue in detail
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Maximum 60 seconds
                </p>
              </>
            ) : (
              <p className="text-neutral-600">
                Ready to record audio. Click "Stop Recording" when finished.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {isRecording && (
            <Button variant="danger" fullWidth onClick={onStop}>
              ⏹ Stop Recording
            </Button>
          )}
          <Button 
            variant={isRecording ? 'secondary' : 'primary'}
            fullWidth 
            onClick={handleClose}
          >
            {isRecording ? 'Cancel' : 'Close'}
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          Your microphone will be disabled when you close this window
        </p>
      </div>
    </Modal>
  );
};

