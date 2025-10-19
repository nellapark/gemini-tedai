import React, { useState } from 'react';
import { CheckCircleIcon } from './components/Icons';
import { Button } from './components/atoms/Button';
import { ErrorMessage } from './components/atoms/ErrorMessage';
import { Divider } from './components/atoms/Divider';
import { Spinner } from './components/atoms/Spinner';
import { LiveStreamingSection } from './components/organisms/LiveStreamingSection';
import { MediaUploadSection } from './components/organisms/MediaUploadSection';
import { MediaPreviewList } from './components/organisms/MediaPreviewList';
import { AudioRecordingSection } from './components/organisms/AudioRecordingSection';
import { AnalysisResultCard } from './components/organisms/AnalysisResultCard';
import { AudioModal } from './components/molecules/AudioModal';
import { useAudioRecording } from './hooks/useAudioRecording';
import { MediaFile, AnalysisResult, InputMode } from './types';

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('none');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<number | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState('');

  const audioRecording = useAudioRecording(mediaFiles, setMediaFiles, setError, inputMode, setInputMode);

  // Check if there are video or image files (audio files don't prevent live streaming)
  const hasVisualMedia = mediaFiles.some(file => file.type === 'video' || file.type === 'image');

  const startLiveStreaming = async () => {
    try {
      setIsLiveStreaming(true);
      setInputMode('live-streaming');
      setError(null);
      alert('Live video streaming with Gemini Live API coming soon! This will allow real-time AI analysis as you show the problem.');
    } catch (err) {
      setError('Failed to start live streaming');
      setIsLiveStreaming(false);
    }
  };

  const stopLiveStreaming = () => {
    setIsLiveStreaming(false);
    setInputMode('none');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }

    const files = Array.from(e.target.files || []);
    const newMediaFiles: MediaFile[] = files.map((file) => {
      let preview: string | undefined;
      if (type === 'image' || type === 'video') {
        preview = URL.createObjectURL(file);
      }
      return { file, type, preview, annotation: '' };
    });

    if (type === 'video') {
      const existingNonVideo = mediaFiles.filter((m) => m.type !== 'video');
      setMediaFiles([...existingNonVideo, ...newMediaFiles.slice(0, 1)]);
    } else if (type === 'image') {
      const existingImages = mediaFiles.filter((m) => m.type === 'image');
      if (existingImages.length + newMediaFiles.length > 5) {
        setError('Maximum 5 images allowed');
        return;
      }
      setMediaFiles([...mediaFiles, ...newMediaFiles]);
    }
    setError(null);
  };

  const removeMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);

    if (newFiles.length === 0) {
      setInputMode('none');
    }
  };

  const startEditingAnnotation = (index: number) => {
    setEditingAnnotation(index);
    setTempAnnotation(mediaFiles[index].annotation || '');
  };

  const saveAnnotation = () => {
    if (editingAnnotation !== null) {
      const newFiles = [...mediaFiles];
      newFiles[editingAnnotation].annotation = tempAnnotation;
      setMediaFiles(newFiles);
      setEditingAnnotation(null);
      setTempAnnotation('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === 'none') {
      setError('Please use live streaming OR upload/record video or photos to continue');
      return;
    }

    if (inputMode === 'upload' && mediaFiles.length === 0) {
      setError('Please upload or record at least one video or photo');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      mediaFiles.forEach((media) => {
        formData.append('media', media.file);
      });
      formData.append('description', description);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startNew = () => {
    setInputMode('none');
    setMediaFiles([]);
    setDescription('');
    setAnalysisResult(null);
    setError(null);
    setIsLiveStreaming(false);
  };

  if (analysisResult) {
    return (
      <AnalysisResultCard
        result={analysisResult}
        onStartNew={startNew}
        onRequestQuotes={() => alert('Quote request feature coming soon!')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-2">QuoteScout</h1>
          <p className="text-lg text-neutral-600">Your AI-Powered Home Service Agent</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Show Us the Problem</h2>
            <p className="text-neutral-600">
              Choose how you'd like to show us your home repair issue.
              <span className="font-semibold text-primary"> Either live streaming OR uploading media is required.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <LiveStreamingSection
              isStreaming={isLiveStreaming}
              inputMode={inputMode}
              hasVisualMedia={hasVisualMedia}
              onStart={startLiveStreaming}
              onStop={stopLiveStreaming}
            />

            <Divider label="OR" />

            <MediaUploadSection
              inputMode={inputMode}
              isAnalyzing={isAnalyzing}
              onVideoUpload={(e) => handleFileUpload(e, 'video')}
              onPhotoUpload={(e) => handleFileUpload(e, 'image')}
            />

            <MediaPreviewList
              mediaFiles={mediaFiles}
              editingIndex={editingAnnotation}
              tempAnnotation={tempAnnotation}
              onRemove={removeMedia}
              onStartEdit={startEditingAnnotation}
              onSaveAnnotation={saveAnnotation}
              onCancelEdit={() => setEditingAnnotation(null)}
              onAnnotationChange={setTempAnnotation}
            />

            {/* Text Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Additional Description
                <span className="text-neutral-500 font-normal ml-2">(Optional but Highly Recommended)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about the issue... When did it start? What have you tried? Any specific concerns or deadlines?"
                rows={4}
                disabled={isAnalyzing}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Adding context helps us provide more accurate analysis and better quotes
              </p>
            </div>

            <AudioRecordingSection
              inputMode={inputMode}
              isAnalyzing={isAnalyzing}
              onOpenModal={audioRecording.openAudioModal}
            />

            {error && <ErrorMessage message={error} />}

            <Button variant="secondary" fullWidth type="submit" disabled={isAnalyzing || inputMode === 'none'} className="py-4">
              {isAnalyzing ? (
                <>
                  <Spinner />
                  Analyzing your home repair issue...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Get AI Analysis & Quotes
                </>
              )}
            </Button>

            {inputMode === 'none' && (
              <p className="text-sm text-neutral-500 text-center -mt-4">
                Please use live streaming or upload media to continue
              </p>
            )}
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>Powered by Google Gemini AI • Your data is secure and private</p>
        </div>
      </div>

      {/* Modals */}
      <AudioModal
        isOpen={audioRecording.showAudioModal}
        onClose={audioRecording.closeAudioModal}
        recordingState={audioRecording.recordingState}
        recordings={audioRecording.recordings}
        selectedRecording={audioRecording.selectedRecording}
        recordingDuration={audioRecording.recordingDuration}
        onStart={audioRecording.startRecording}
        onPause={audioRecording.pauseRecording}
        onResume={audioRecording.resumeRecording}
        onStop={audioRecording.stopRecording}
        onRestart={audioRecording.restartRecording}
        onDelete={audioRecording.deleteRecording}
        onUpload={audioRecording.uploadRecordings}
        onSelectRecording={audioRecording.setSelectedRecording}
      />
    </div>
  );
}

export default App;

