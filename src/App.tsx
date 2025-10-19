import React, { useState, useRef } from 'react';
import { UploadIcon, VideoIcon, ImageIcon, MicrophoneIcon, CheckCircleIcon } from './components/Icons';

interface MediaFile {
  file: File;
  type: 'video' | 'image' | 'audio';
  preview?: string;
  annotation?: string;
}

interface AnalysisResult {
  category: string;
  problemSummary: string;
  scopeItems: string[];
  urgency: string;
}

type InputMode = 'none' | 'live-streaming' | 'upload';

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('none');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isCapturingMedia, setIsCapturingMedia] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<number | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startLiveStreaming = async () => {
    try {
      setIsLiveStreaming(true);
      setInputMode('live-streaming');
      setError(null);
      // TODO: Implement Gemini Live API integration
      alert('Live video streaming with Gemini Live API coming soon! This will allow real-time AI analysis as you show the problem.');
    } catch (err) {
      setError('Failed to start live streaming');
      setIsLiveStreaming(false);
    }
  };

  const stopLiveStreaming = () => {
    setIsLiveStreaming(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }
    
    const files = Array.from(e.target.files || []);
    
    // Validate based on type
    const newMediaFiles: MediaFile[] = files.map(file => {
      let preview: string | undefined;
      if (type === 'image' || type === 'video') {
        preview = URL.createObjectURL(file);
      }
      return { file, type, preview, annotation: '' };
    });

    // Limit: 1 video, 5 images
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
    }
    setError(null);
  };

  const startMediaCapture = async (type: 'video' | 'photo') => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: type === 'video' 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturingMedia(true);
        
        if (type === 'video') {
          // Start recording video
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks: Blob[] = [];
          
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const file = new File([blob], `recorded-${Date.now()}.webm`, { type: 'video/webm' });
            const preview = URL.createObjectURL(blob);
            
            const existingNonVideo = mediaFiles.filter(m => m.type !== 'video');
            setMediaFiles([...existingNonVideo, { file, type: 'video', preview, annotation: '' }]);
            
            stream.getTracks().forEach(track => track.stop());
            setIsCapturingMedia(false);
          };
          
          mediaRecorder.start();
          
          // Auto-stop after 60 seconds
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 60000);
        }
      }
    } catch (err) {
      setError('Failed to access camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          
          const existingImages = mediaFiles.filter(m => m.type === 'image');
          if (existingImages.length >= 5) {
            setError('Maximum 5 images allowed');
            return;
          }
          
          setMediaFiles([...mediaFiles, { file, type: 'image', preview, annotation: '' }]);
        }
      }, 'image/jpeg');
    }
  };

  const stopMediaCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsCapturingMedia(false);
  };

  const startAudioRecording = async () => {
    if (inputMode === 'none') {
      setInputMode('upload');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const existingNonAudio = mediaFiles.filter(m => m.type !== 'audio');
        setMediaFiles([...existingNonAudio, { file, type: 'audio', annotation: '' }]);
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecordingAudio(false);
      };
      
      mediaRecorder.start();
      setIsRecordingAudio(true);
      
      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 60000);
    } catch (err) {
      setError('Failed to access microphone');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const updateAnnotation = (index: number, annotation: string) => {
    const newFiles = [...mediaFiles];
    newFiles[index].annotation = annotation;
    setMediaFiles(newFiles);
  };

  const startEditingAnnotation = (index: number) => {
    setEditingAnnotation(index);
    setTempAnnotation(mediaFiles[index].annotation || '');
  };

  const saveAnnotation = () => {
    if (editingAnnotation !== null) {
      updateAnnotation(editingAnnotation, tempAnnotation);
      setEditingAnnotation(null);
      setTempAnnotation('');
    }
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
    setInputMode('none');
    setMediaFiles([]);
    setDescription('');
    setAnalysisResult(null);
    setError(null);
    setIsLiveStreaming(false);
    setIsRecordingAudio(false);
    setIsCapturingMedia(false);
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
            <p className="text-neutral-600">
              Choose how you'd like to show us your home repair issue. 
              <span className="font-semibold text-primary"> Either live streaming OR uploading media is required.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* OPTION 1: Live Video Streaming (Recommended) */}
            <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded mr-2">RECOMMENDED</span>
                    Live Video Streaming
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Stream live video to Gemini AI and get instant spoken feedback as you show the problem
                  </p>
                </div>
              </div>
              
              {!isLiveStreaming ? (
                <button
                  type="button"
                  onClick={startLiveStreaming}
                  disabled={inputMode === 'upload'}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <VideoIcon className="w-5 h-5 mr-2" />
                  Start Live Streaming with AI
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="animate-pulse text-red-500 font-semibold mb-2">● LIVE</div>
                    <p className="text-sm text-neutral-600">Streaming to Gemini AI...</p>
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveStreaming}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Stop Streaming
                  </button>
                </div>
              )}
              
              {inputMode === 'upload' && (
                <p className="text-xs text-neutral-500 mt-2 text-center">
                  Clear uploaded media to use live streaming
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-neutral-300"></div>
              <span className="px-4 text-sm font-medium text-neutral-500">OR</span>
              <div className="flex-1 border-t border-neutral-300"></div>
            </div>

            {/* OPTION 2: Upload or Record Video/Photos */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">Upload or Record Media</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Upload existing files or use your camera to capture video/photos of the problem
                </p>
              </div>

              {/* Video Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Video */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    className="hidden"
                    disabled={isAnalyzing || inputMode === 'live-streaming'}
                  />
                  <div className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors h-full">
                    <UploadIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-neutral-800 text-center">Upload Video</p>
                    <p className="text-xs text-neutral-500 text-center mt-1">Up to 60 seconds</p>
                  </div>
                </label>

                {/* Record Video */}
                <button
                  type="button"
                  onClick={() => startMediaCapture('video')}
                  disabled={isAnalyzing || inputMode === 'live-streaming' || isCapturingMedia}
                  className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <VideoIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-800 text-center">Record Video</p>
                  <p className="text-xs text-neutral-500 text-center mt-1">Use your camera</p>
                </button>
              </div>

              {/* Camera Preview for Recording */}
              {isCapturingMedia && (
                <div className="border-2 border-primary rounded-xl p-4 bg-neutral-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      📸 Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopMediaCapture}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                  {mediaRecorderRef.current?.state === 'recording' && (
                    <p className="text-white text-sm text-center mt-2">
                      <span className="animate-pulse text-red-500">●</span> Recording video...
                    </p>
                  )}
                </div>
              )}

              {/* Photo Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Photos */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                    disabled={isAnalyzing || inputMode === 'live-streaming'}
                  />
                  <div className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors h-full">
                    <UploadIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-neutral-800 text-center">Upload Photos</p>
                    <p className="text-xs text-neutral-500 text-center mt-1">Up to 5 images</p>
                  </div>
                </label>

                {/* Take Photos */}
                <button
                  type="button"
                  onClick={() => startMediaCapture('photo')}
                  disabled={isAnalyzing || inputMode === 'live-streaming' || isCapturingMedia}
                  className="border-2 border-dashed border-primary rounded-xl p-6 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-800 text-center">Take Photos</p>
                  <p className="text-xs text-neutral-500 text-center mt-1">Use your camera</p>
                </button>
              </div>
            </div>

            {/* Media Preview with Annotations */}
            {mediaFiles.length > 0 && (
              <div className="border border-neutral-200 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-800 mb-3">Your Media ({mediaFiles.length})</h3>
                <div className="space-y-4">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-3">
                      <div className="flex gap-3">
                        {/* Media Preview */}
                        <div className="relative group flex-shrink-0">
                          {media.type === 'video' && (
                            <video src={media.preview} className="w-24 h-24 object-cover rounded-lg" />
                          )}
                          {media.type === 'image' && (
                            <img src={media.preview} alt="Upload" className="w-24 h-24 object-cover rounded-lg" />
                          )}
                          {media.type === 'audio' && (
                            <div className="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center">
                              <MicrophoneIcon className="w-8 h-8 text-neutral-400" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>

                        {/* Annotation */}
                        <div className="flex-1">
                          <p className="text-xs text-neutral-500 mb-2 truncate">{media.file.name}</p>
                          {editingAnnotation === index ? (
                            <div className="space-y-2">
                              <textarea
                                value={tempAnnotation}
                                onChange={(e) => setTempAnnotation(e.target.value)}
                                placeholder="Describe what's shown in this media..."
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveAnnotation}
                                  className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAnnotation(null)}
                                  className="text-sm bg-neutral-200 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {media.annotation ? (
                                <p className="text-sm text-neutral-700 mb-1">{media.annotation}</p>
                              ) : (
                                <p className="text-sm text-neutral-400 italic mb-1">No annotation yet</p>
                              )}
                              <button
                                type="button"
                                onClick={() => startEditingAnnotation(index)}
                                className="text-xs text-primary hover:underline"
                              >
                                {media.annotation ? 'Edit' : 'Add'} annotation
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Audio Recording */}
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">
                Voice Note (Optional)
              </h3>
              {!isRecordingAudio ? (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  disabled={isAnalyzing || inputMode === 'live-streaming'}
                  className="w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MicrophoneIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-800 text-center">Record Audio</p>
                  <p className="text-xs text-neutral-500 text-center mt-1">Use your microphone to describe the issue</p>
                </button>
              ) : (
                <div className="border-2 border-red-500 rounded-xl p-6 bg-red-50">
                  <div className="text-center">
                    <div className="animate-pulse text-red-500 text-4xl mb-2">●</div>
                    <p className="text-sm font-medium text-neutral-800 mb-3">Recording...</p>
                    <button
                      type="button"
                      onClick={stopAudioRecording}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      Stop Recording
                    </button>
                  </div>
                </div>
              )}
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
              disabled={isAnalyzing || inputMode === 'none'}
              className="w-full bg-accent hover:bg-orange-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing your home repair issue...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Get AI Analysis & Quotes
                </>
              )}
            </button>
            
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
    </div>
  );
}

export default App;

