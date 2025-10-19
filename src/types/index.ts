export interface MediaFile {
  file: File;
  type: 'video' | 'image' | 'audio';
  preview?: string;
  annotation?: string;
  source?: 'upload' | 'live-stream'; // Track where the media came from
}

export interface AgentLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'action' | 'success' | 'error';
}

export interface ComputerUseSession {
  id: string;
  platform: 'taskrabbit' | 'thumbtack';
  status: 'initializing' | 'navigating' | 'searching' | 'extracting' | 'completed' | 'error';
  progress: number;
  currentAction: string;
  screenshot?: string;
  liveViewUrl?: string;
  browserbaseSessionID?: string;
  contractors: ContractorLead[];
  logs: AgentLog[]; // Timestamped log entries
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface ContractorLead {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  price?: string;
  description: string;
  profileUrl: string;
  phoneNumber?: string;
  email?: string;
  availability?: string;
  platform: 'taskrabbit' | 'thumbtack';
  profileImage?: string;
}

export interface QuoteRequest {
  jobId: string;
  zipCode: string;
  analysisResult: AnalysisResult;
  sessions: ComputerUseSession[];
}

export interface AnalysisResult {
  // ISSUE CLASSIFIER
  category: string;
  subcategory: string;
  
  // CORE PROBLEM IDENTIFICATION
  problemSummary: string;
  detailedDescription: string;
  
  // SEVERITY & DETAILS
  severity: 'Minor' | 'Moderate' | 'Major' | 'Severe';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  urgencyReason: string;
  
  // DIMENSIONS & SCOPE
  affectedAreas: string[];
  estimatedSize: string;
  visibleDamage: string[];
  
  // STANDARDIZED SCOPE OF WORK
  scopeOfWork: {
    summary: string;
    requiredTasks: Array<{
      task: string;
      description: string;
      priority: 'Required' | 'Recommended' | 'Optional';
    }>;
    materialsNeeded: string[];
    estimatedDuration: string;
    accessRequirements: string[];
  };
  
  // SAFETY & SPECIAL CONSIDERATIONS
  safetyHazards: string[];
  specialConsiderations?: string[];
  
  // MEASUREMENTS & TECHNICAL DETAILS
  measurements: {
    hasVisibleMeasurements: boolean;
    estimatedMeasurements: string[];
  };
  
  // RECOMMENDATIONS
  recommendedActions: string[];
  additionalInspectionNeeded: boolean;
  
  // TIMELINE & CONTEXT
  issueHistory: {
    whenStarted: string;
    howItHappened: string;
    previousAttempts: string[];
  };
  userTimeline: {
    desiredCompletionDate: string;
    schedulingConstraints: string[];
  };
  userConcerns: string[];
  environmentalFactors: string[];
  
  // Legacy fields for backward compatibility
  scopeItems?: string[];
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
