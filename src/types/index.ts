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

