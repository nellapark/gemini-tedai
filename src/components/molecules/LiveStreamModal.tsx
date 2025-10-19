import React, { useEffect, useRef } from 'react';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { VideoIcon } from '../Icons';
import { LiveStreamSession, TranscriptEntry, LiveStreamState } from '../../types';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamState: LiveStreamState;
  sessions: LiveStreamSession[];
  selectedSession: string | null;
  currentTranscript: TranscriptEntry[];
  streamDuration: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaStream: MediaStream | null;
  onStart: () => void;
  onStop: () => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
  onSelectSession: (id: string | null) => void;
}

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({
  isOpen,
  onClose,
  streamState,
  sessions,
  selectedSession,
  currentTranscript,
  streamDuration,
  videoRef,
  mediaStream,
  onStart,
  onStop,
  onDelete,
  onUpload,
  onSelectSession,
}) => {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentTranscript]);

  useEffect(() => {
    // Attach media stream to video element when available
    if (videoRef.current && mediaStream && (streamState === 'idle' || streamState === 'streaming')) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [videoRef, mediaStream, streamState]);

  useEffect(() => {
    if (playbackVideoRef.current && selectedSession && streamState !== 'streaming') {
      const session = sessions.find(s => s.id === selectedSession);
      if (session && session.videoUrl) {
        playbackVideoRef.current.src = session.videoUrl;
        playbackVideoRef.current.load();
      }
    }
  }, [selectedSession, sessions, streamState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSessionClick = (id: string) => {
    if (streamState === 'idle' || streamState === 'stopped') {
      onSelectSession(id);
    }
  };

  const getDisplayTranscript = () => {
    if (streamState === 'streaming' || (streamState === 'stopped' && !selectedSession)) {
      return currentTranscript;
    }
    
    if (selectedSession) {
      const session = sessions.find(s => s.id === selectedSession);
      return session?.transcript || [];
    }
    
    return [];
  };

  const displayTranscript = getDisplayTranscript();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Streaming with Gemini AI" size="xl">
      <div className="space-y-6">
        {/* Video and Transcript Container */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          {/* Video Preview */}
          <div className="bg-neutral-900 rounded-xl overflow-hidden aspect-video relative">
            {(streamState === 'idle' || streamState === 'streaming') && !selectedSession ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {streamState === 'streaming' && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <span className="animate-pulse">●</span>
                    <span className="text-sm font-semibold">LIVE</span>
                    <span className="text-sm">{formatDuration(streamDuration)}</span>
                  </div>
                )}
                {streamState === 'idle' && (
                  <div className="absolute top-4 left-4 bg-neutral-800 bg-opacity-75 text-white px-3 py-2 rounded-lg">
                    <p className="text-sm">Camera ready - Click "Begin Streaming" to start</p>
                  </div>
                )}
              </>
            ) : selectedSession && streamState === 'stopped' ? (
              <video
                ref={playbackVideoRef}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-neutral-400">
                  <VideoIcon className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm">No video</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {/* <div className="bg-neutral-50 rounded-xl p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Live Transcript</h3>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[400px]">
              {displayTranscript.length === 0 ? (
                <p className="text-sm text-neutral-400 italic text-center mt-8">
                  Transcript will appear here as you interact with Gemini AI...
                </p>
              ) : (
                displayTranscript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg ${
                      entry.speaker === 'user'
                        ? 'bg-blue-100 ml-8'
                        : 'bg-white mr-8 border border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${
                        entry.speaker === 'user' ? 'text-blue-700' : 'text-primary'
                      }`}>
                        {entry.speaker === 'user' ? 'You' : 'Gemini AI'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-800">{entry.text}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div> */}
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2 justify-center border-t border-neutral-200 pt-4">
          {(streamState === 'idle' || (streamState === 'stopped' && !selectedSession)) && (
            <Button 
              variant="success" 
              onClick={() => {
                console.log('🔘 Begin Streaming button clicked!');
                console.log('Stream state:', streamState);
                onStart();
              }} 
              className="px-6"
            >
              <VideoIcon className="w-4 h-4 mr-2" />
              Begin Streaming
            </Button>
          )}

          {streamState === 'streaming' && (
            <Button variant="danger" onClick={onStop} className="px-6">
              ⏹ Stop Streaming
            </Button>
          )}

          {streamState === 'stopped' && selectedSession && (
            <Button 
              variant="secondary" 
              onClick={() => onSelectSession(null)}
              className="px-6"
            >
              ← Back to Sessions
            </Button>
          )}
        </div>

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">
              Sessions ({sessions.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    selectedSession === session.id
                      ? 'border-primary bg-blue-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  } ${streamState === 'idle' || streamState === 'stopped' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <VideoIcon className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        Session {index + 1}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatTimestamp(session.timestamp)} • {formatDuration(session.duration)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id);
                    }}
                    disabled={streamState !== 'idle' && streamState !== 'stopped'}
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
            disabled={sessions.length === 0}
          >
            Upload {sessions.length > 0 ? `(${sessions.length})` : ''}
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          Conduct multiple live streaming sessions and review them before uploading
        </p>
      </div>
    </Modal>
  );
};

