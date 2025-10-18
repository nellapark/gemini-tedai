import React, { useState } from 'react';
import { UploadIcon, VideoIcon, ImageIcon, MicrophoneIcon, CheckCircleIcon } from './components/Icons';

interface MediaFile {
  file: File;
  type: 'video' | 'image' | 'audio';
  preview?: string;
}

interface AnalysisResult {
  category: string;
  problemSummary: string;
  scopeItems: string[];
  urgency: string;
}

function App() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image' | 'audio') => {
    const files = Array.from(e.target.files || []);
    
    // Validate based on type
    const newMediaFiles: MediaFile[] = files.map(file => {
      let preview: string | undefined;
      if (type === 'image' || type === 'video') {
        preview = URL.createObjectURL(file);
      }
      return { file, type, preview };
    });

    // Limit: 1 video, 5 images, 1 audio
    if (type === 'video') {
      const existingNonVideo = mediaFiles.filter(m => m.type !== 'video');
      setMediaFiles([...existingNonVideo, ...newMediaFiles.slice(0, 1)]);
    } else if (type === 'image') {
      const existingImages = mediaFiles.filter(m => m.type === 'image');
      if (existingImages.length + newMediaFiles.length > 5) {
        setError('Maximum 5 images allowed');
        return;
      }
      setMediaFiles([...mediaFiles, ...newMediaFiles]);
    } else if (type === 'audio') {
      const existingNonAudio = mediaFiles.filter(m => m.type !== 'audio');
      setMediaFiles([...existingNonAudio, ...newMediaFiles.slice(0, 1)]);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mediaFiles.length === 0) {
      setError('Please upload at least one video or image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      mediaFiles.forEach(media => {
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
    setMediaFiles([]);
    setDescription('');
    setAnalysisResult(null);
    setError(null);
  };

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mr-4" />
              <h1 className="text-3xl font-bold text-neutral-800">Analysis Complete!</h1>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-neutral-800">Category</h2>
                  <span className="px-4 py-1 bg-primary text-white rounded-full text-sm font-medium">
                    {analysisResult.category}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-2">Problem Summary</h2>
                <p className="text-neutral-600 leading-relaxed">{analysisResult.problemSummary}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-neutral-800">Urgency Level</h2>
                  <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                    analysisResult.urgency === 'Critical' ? 'bg-red-500 text-white' :
                    analysisResult.urgency === 'High' ? 'bg-orange-500 text-white' :
                    analysisResult.urgency === 'Medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {analysisResult.urgency}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-3">Scope of Work</h2>
                <ul className="space-y-2">
                  {analysisResult.scopeItems.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary mr-3 mt-1">•</span>
                      <span className="text-neutral-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={startNew}
                className="flex-1 bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Start New Job
              </button>
              <button
                className="flex-1 bg-accent hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                onClick={() => alert('Quote request feature coming soon!')}
              >
                Request Quotes
              </button>
            </div>
          </div>
        </div>
      </div>
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
            <p className="text-neutral-600">Upload a video, photos, or audio to get started. A 30-second video works best!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Video Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <div className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors">
                  <VideoIcon className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-800 text-center">Upload Video</p>
                  <p className="text-xs text-neutral-500 text-center mt-1">Up to 60 seconds</p>
                </div>
              </label>

              {/* Photo Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <div className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors">
                  <ImageIcon className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-800 text-center">Upload Photos</p>
                  <p className="text-xs text-neutral-500 text-center mt-1">Up to 5 images</p>
                </div>
              </label>

              {/* Audio Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'audio')}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <div className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors">
                  <MicrophoneIcon className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-800 text-center">Voice Note</p>
                  <p className="text-xs text-neutral-500 text-center mt-1">Quick description</p>
                </div>
              </label>
            </div>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="border border-neutral-200 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-800 mb-3">Uploaded Media ({mediaFiles.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.type === 'video' && (
                        <video src={media.preview} className="w-full h-24 object-cover rounded-lg" />
                      )}
                      {media.type === 'image' && (
                        <img src={media.preview} alt="Upload" className="w-full h-24 object-cover rounded-lg" />
                      )}
                      {media.type === 'audio' && (
                        <div className="w-full h-24 bg-neutral-100 rounded-lg flex items-center justify-center">
                          <MicrophoneIcon className="w-8 h-8 text-neutral-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{media.file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Additional Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about the issue..."
                rows={4}
                disabled={isAnalyzing}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAnalyzing || mediaFiles.length === 0}
              className="w-full bg-accent hover:bg-orange-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Your AI agent is on the case!
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5 mr-2" />
                  Get AI Analysis
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>Powered by Google Gemini AI • Your data is secure and private</p>
        </div>
      </div>
    </div>
  );
}

export default App;

