import React, { useRef, useEffect } from 'react';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { MicrophoneIcon } from '../Icons';
import { AudioRecording, RecordingState } from '../../types';

interface AudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingState: RecordingState;
  recordings: AudioRecording[];
  selectedRecording: string | null;
  recordingDuration: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
  onSelectRecording: (id: string | null) => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({
  isOpen,
  onClose,
  recordingState,
  recordings,
  selectedRecording,
  recordingDuration,
  onStart,
  onPause,
  onResume,
  onStop,
  onRestart,
  onDelete,
  onUpload,
  onSelectRecording,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && selectedRecording) {
      const recording = recordings.find((r) => r.id === selectedRecording);
      if (recording) {
        audioRef.current.src = recording.url;
        audioRef.current.load();
      }
    }
  }, [selectedRecording, recordings]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRecordingClick = (id: string) => {
    if (recordingState === 'idle' || recordingState === 'stopped') {
      onSelectRecording(id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Audio" size="lg">
      <div className="space-y-6">
        {/* Main Recording Area */}
        <div className="bg-neutral-50 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center">
          {recordingState === 'idle' && selectedRecording === null && recordings.length === 0 && (
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-4">
                <MicrophoneIcon className="w-12 h-12 text-neutral-400" />
              </div>
              <p className="text-neutral-600 mb-2">Ready to record</p>
              <p className="text-sm text-neutral-500">Click "Start Recording" to begin</p>
            </div>
          )}

          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="text-center w-full">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                recordingState === 'recording' ? 'bg-red-100 animate-pulse' : 'bg-yellow-100'
              }`}>
                <MicrophoneIcon className={`w-12 h-12 ${
                  recordingState === 'recording' ? 'text-red-500' : 'text-yellow-600'
                }`} />
              </div>
              <div className="text-3xl font-mono font-bold text-neutral-800 mb-2">
                {formatDuration(recordingDuration)}
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                {recordingState === 'recording' && (
                  <span className="animate-pulse text-red-500 text-sm">● Recording</span>
                )}
                {recordingState === 'paused' && (
                  <span className="text-yellow-600 text-sm">⏸ Paused</span>
                )}
              </div>
            </div>
          )}

          {selectedRecording && recordingState === 'idle' && (
            <div className="text-center w-full">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MicrophoneIcon className="w-12 h-12 text-primary" />
              </div>
              <p className="text-neutral-600 mb-4">Playing recording</p>
              <audio
                ref={audioRef}
                controls
                className="w-full max-w-md mx-auto"
              />
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          {recordingState === 'idle' && (
            <Button variant="success" onClick={onStart}>
              <MicrophoneIcon className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          {recordingState === 'recording' && (
            <>
              <Button variant="secondary" onClick={onPause}>
                ⏸ Pause
              </Button>
              <Button variant="danger" onClick={onStop}>
                ⏹ Stop
              </Button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <Button variant="success" onClick={onResume}>
                ▶️ Resume
              </Button>
              <Button variant="danger" onClick={onStop}>
                ⏹ Stop
              </Button>
              <Button variant="secondary" onClick={onRestart}>
                🔄 Restart
              </Button>
            </>
          )}
        </div>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">
              Recordings ({recordings.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recordings.map((recording, index) => (
                <div
                  key={recording.id}
                  onClick={() => handleRecordingClick(recording.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    selectedRecording === recording.id
                      ? 'border-primary bg-blue-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  } ${recordingState === 'idle' || recordingState === 'stopped' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <MicrophoneIcon className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        Recording {index + 1}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatTimestamp(recording.timestamp)} • {formatDuration(recording.duration)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(recording.id);
                    }}
                    disabled={recordingState !== 'idle' && recordingState !== 'stopped'}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onUpload}
            disabled={recordings.length === 0}
          >
            Upload {recordings.length > 0 ? `(${recordings.length})` : ''}
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          Record multiple audio clips and upload them all at once
        </p>
      </div>
    </Modal>
  );
};

