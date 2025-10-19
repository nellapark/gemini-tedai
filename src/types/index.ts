export interface MediaFile {
  file: File;
  type: 'video' | 'image' | 'audio';
  preview?: string;
  annotation?: string;
}

export interface AnalysisResult {
  category: string;
  problemSummary: string;
  scopeItems: string[];
  urgency: string;
}

export type InputMode = 'none' | 'live-streaming' | 'upload';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AudioRecording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
}

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface LiveStreamSession {
  id: string;
  timestamp: Date;
  duration: number;
  transcript: TranscriptEntry[];
  videoBlob?: Blob;
  videoUrl?: string;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'user' | 'ai';
  timestamp: number;
}

export type LiveStreamState = 'idle' | 'streaming' | 'stopped';
