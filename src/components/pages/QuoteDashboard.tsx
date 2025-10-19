import React, { useState, useEffect, useRef } from 'react';
import { ComputerUseSession, ContractorLead, AnalysisResult } from '../../types';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { Badge } from '../atoms/Badge';

interface QuoteDashboardProps {
  jobId: string;
  zipCode: string;
  city: string;
  analysisResult: AnalysisResult;
}

export const QuoteDashboard: React.FC<QuoteDashboardProps> = ({
  jobId,
  zipCode,
  city,
  analysisResult,
}) => {
  const [sessions, setSessions] = useState<ComputerUseSession[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allContractors, setAllContractors] = useState<ContractorLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [taskrabbitGraphic, setTaskrabbitGraphic] = useState<string | null>(null);
  const [thumbtackGraphic, setThumbtackGraphic] = useState<string | null>(null);
  const [isGeneratingGraphics, setIsGeneratingGraphics] = useState(false);
  
  const contractorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startQuoteSearch();
  }, []);

  // Detect when both sessions are completed and trigger fade-in + scroll
  useEffect(() => {
    const allSessionsCompleted = sessions.length === 2 && 
      sessions.every(s => s.status === 'completed' || s.status === 'error');
    
    if (allSessionsCompleted && allContractors.length > 0 && !showResults) {
      // Small delay before showing results for smooth transition
      setTimeout(() => {
        setShowResults(true);
        
        // Scroll to contractors section after fade-in starts
        setTimeout(() => {
          contractorsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 300);
      }, 500);
    }
  }, [sessions, allContractors, showResults]);

  const startQuoteSearch = async () => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/request-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          zipCode,
          city,
          category: analysisResult.category,
          subcategory: analysisResult.subcategory,
          problemSummary: analysisResult.problemSummary,
          scopeOfWork: analysisResult.scopeOfWork,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start quote search');
      }

      // Setup SSE connection for real-time updates
      const eventSource = new EventSource(`/api/quote-progress/${jobId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);

        if (data.type === 'session_update') {
          console.log('Session update:', data.session.platform, 'liveViewUrl:', data.session.liveViewUrl);
          setSessions((prev) => {
            const existing = prev.find((s) => s.id === data.session.id);
            if (existing) {
              return prev.map((s) => (s.id === data.session.id ? data.session : s));
            }
            return [...prev, data.session];
          });
        } else if (data.type === 'contractors_found') {
          setAllContractors((prev) => [...prev, ...data.contractors]);
        } else if (data.type === 'complete') {
          setIsSearching(false);
          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.message);
          setIsSearching(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setError('Connection lost. Please refresh the page.');
        setIsSearching(false);
        eventSource.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: ComputerUseSession['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'initializing':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const loadDemoData = async () => {
    console.log('Loading demo data...');
    setIsDemoMode(true);
    setIsSearching(true);
    setError(null);

    try {
      // Load TaskRabbit contractors
      const taskrabbitResponse = await fetch('/dummy-contractor-data/taskrabbit-contractors.json');
      const taskrabbitContractors = await taskrabbitResponse.json();

      // Load Thumbtack contractors
      const thumbtackResponse = await fetch('/dummy-contractor-data/thumbtack-contractors.json');
      const thumbtackContractors = await thumbtackResponse.json();

      // Add unique IDs if not present
      const formattedTaskRabbit = taskrabbitContractors.map((c: any, i: number) => ({
        ...c,
        id: c.id || `taskrabbit-demo-${i}`,
      }));

      const formattedThumbtack = thumbtackContractors.map((c: any, i: number) => ({
        ...c,
        id: c.id || `thumbtack-demo-${i}`,
      }));

      // Combine all contractors
      const allDemoContractors = [...formattedTaskRabbit, ...formattedThumbtack];
      
      console.log('Demo data loaded:', allDemoContractors.length, 'contractors');
      
      setAllContractors(allDemoContractors);
      setShowResults(true);
      
      // Small delay to show transition
      setTimeout(() => {
        setIsSearching(false);
      }, 300);

      // Simulate completed sessions
      setSessions([
        {
          id: 'taskrabbit-demo',
          platform: 'taskrabbit',
          status: 'completed',
          progress: 100,
          currentAction: 'Demo data loaded',
          liveViewUrl: null,
          browserbaseSessionID: null,
          logs: [
            {
              timestamp: new Date(),
              message: '✅ Loaded demo TaskRabbit contractors',
              type: 'success',
            },
          ],
          error: null,
          startTime: new Date(),
          endTime: new Date(),
          contractors: formattedTaskRabbit,
        },
        {
          id: 'thumbtack-demo',
          platform: 'thumbtack',
          status: 'completed',
          progress: 100,
          currentAction: 'Demo data loaded',
          liveViewUrl: null,
          browserbaseSessionID: null,
          logs: [
            {
              timestamp: new Date(),
              message: '✅ Loaded demo Thumbtack contractors',
              type: 'success',
            },
          ],
          error: null,
          startTime: new Date(),
          endTime: new Date(),
          contractors: formattedThumbtack,
        },
      ]);

      // Scroll to results after a short delay
      setTimeout(() => {
        contractorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);

      // Generate comparison graphics
      generateComparisonGraphics(formattedTaskRabbit, formattedThumbtack);
    } catch (error) {
      console.error('Error loading demo data:', error);
      setError('Failed to load demo data');
      setIsSearching(false);
    }
  };

  const generateComparisonGraphics = async (taskrabbitContractors: any[], thumbtackContractors: any[]) => {
    console.log('Generating comparison graphics...');
    setIsGeneratingGraphics(true);

    try {
      // Generate TaskRabbit graphic
      const taskrabbitResponse = await fetch('/api/generate-comparison-graphic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractors: taskrabbitContractors,
          platform: 'taskrabbit',
        }),
      });

      if (taskrabbitResponse.ok) {
        const taskrabbitData = await taskrabbitResponse.json();
        setTaskrabbitGraphic(taskrabbitData.svgCode);
        console.log('TaskRabbit graphic generated');
      }

      // Generate Thumbtack graphic
      const thumbtackResponse = await fetch('/api/generate-comparison-graphic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractors: thumbtackContractors,
          platform: 'thumbtack',
        }),
      });

      if (thumbtackResponse.ok) {
        const thumbtackData = await thumbtackResponse.json();
        setThumbtackGraphic(thumbtackData.svgCode);
        console.log('Thumbtack graphic generated');
      }

      setIsGeneratingGraphics(false);
    } catch (error) {
      console.error('Error generating graphics:', error);
      setIsGeneratingGraphics(false);
    }
  };

  const getPlatformName = (platform: string) => {
    return platform === 'taskrabbit' ? 'TaskRabbit' : 'Thumbtack';
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-neutral-800">Finding Contractors</h1>
                {!isDemoMode ? (
                  <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>Google Computer Use</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                    <span>🎭 Demo Mode</span>
                  </div>
                )}
              </div>
              <p className="text-neutral-600">
                {isDemoMode 
                  ? `Viewing ${sessions.length} demo contractor results • Zip: ${zipCode}`
                  : `Watching AI browse ${sessions.length} platforms live • Zip: ${zipCode}`
                }
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {isDemoMode 
                  ? 'Showing sample contractor data for demonstration purposes'
                  : 'Real-time browser automation powered by Gemini 2.5 Computer Use'
                }
              </p>
            </div>
            {isSearching && (
              <div className="flex items-center space-x-2">
                <Spinner />
                <span className="text-sm text-neutral-600">Searching...</span>
              </div>
            )}
          </div>

          {/* Job Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">{analysisResult.category}</h3>
            <p className="text-sm text-blue-800">{analysisResult.problemSummary}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Parallel Computer Use Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-neutral-200"
            >
              {/* Session Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Computer icon with animation */}
                    <div className="relative">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                      </svg>
                      {session.status !== 'completed' && session.status !== 'error' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{getPlatformName(session.platform)}</h3>
                      <p className="text-xs text-blue-100">Browser Automation</p>
                    </div>
                  </div>
                  <Badge variant={session.status === 'completed' ? 'success' : session.status === 'error' ? 'danger' : 'primary'}>
                    {session.status}
                  </Badge>
                </div>
              </div>

              {/* Live Browser Session Preview */}
              <div className="relative h-96 bg-neutral-900 overflow-hidden">
                  {session.liveViewUrl ? (
                    <>
                      {/* Browserbase Live View iframe */}
                      <iframe
                        src={session.liveViewUrl}
                        className="w-full h-full border-0"
                        allow="camera; microphone; display-capture"
                        title={`Live session: ${session.platform}`}
                      />
                    
                    {/* Live indicator badge */}
                    {session.status !== 'completed' && session.status !== 'error' && (
                      <div className="absolute top-3 left-3 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span>LIVE</span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Loading state before live view is available */
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <svg className="w-16 h-16 mb-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-medium text-gray-400">Initializing browser session...</p>
                    <p className="text-xs text-gray-500 mt-2">Google Computer Use is starting up</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Status: {session.status} | Session ID: {session.browserbaseSessionID || 'pending'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Waiting for live view URL...
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="p-4 bg-neutral-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">Progress</span>
                  <span className="text-sm font-bold text-neutral-900">{session.progress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
              </div>

              {/* Agent Activity Logs */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-neutral-700 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Agent Activity
                  </h4>
                  <span className="text-xs text-neutral-500">
                    {session.logs?.length || 0} event{(session.logs?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div 
                    className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100"
                    ref={(el) => {
                      // Auto-scroll to bottom when new logs are added
                      if (el && session.logs && session.logs.length > 0) {
                        el.scrollTop = el.scrollHeight;
                      }
                    }}
                  >
                    {session.logs && session.logs.length > 0 ? (
                      <div className="divide-y divide-neutral-100">
                        {session.logs.map((log, index) => {
                          const logTime = new Date(log.timestamp);
                          const timeString = logTime.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: false 
                          });
                          
                          const isReasoning = log.message.includes('🤔 Agent Reasoning:');
                          
                          return (
                            <div 
                              key={index} 
                              className={`p-3 flex items-start space-x-3 hover:bg-neutral-50 transition-colors ${
                                log.type === 'error' ? 'bg-red-50' : 
                                log.type === 'success' ? 'bg-green-50' : 
                                isReasoning ? 'bg-purple-50 border-l-4 border-purple-400' : 
                                ''
                              }`}
                            >
                              <span className="text-xs font-mono text-neutral-400 flex-shrink-0 mt-0.5">
                                {timeString}
                              </span>
                              <span 
                                className={`text-sm flex-1 whitespace-pre-wrap ${
                                  log.type === 'error' ? 'text-red-700' : 
                                  log.type === 'success' ? 'text-green-700' : 
                                  log.type === 'action' ? 'text-blue-700 font-medium' : 
                                  isReasoning ? 'text-purple-700 italic' :
                                  'text-neutral-600'
                                }`}
                              >
                                {log.message}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-neutral-400 text-sm">
                        Waiting for agent activity...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Action Summary */}
              <div className="p-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 mb-3">
                  <span className="font-semibold">Status:</span> {session.currentAction}
                </p>

                {/* Contractors Found */}
                {session.contractors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-neutral-700 mb-2">
                      Contractors Found: {session.contractors.length}
                    </p>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {session.contractors.map((contractor) => (
                        <div
                          key={contractor.id}
                          className="p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-start space-x-3 mb-2">
                            {contractor.profileImage && (
                              <img
                                src={contractor.profileImage}
                                alt={contractor.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-semibold text-sm text-neutral-800 truncate">
                                  {contractor.name}
                                </p>
                                {contractor.isTopRated && (
                                  <span className="text-xs">⭐</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                                <span className="text-yellow-500">★</span>
                                <span>
                                  {contractor.rating} ({contractor.reviewCount})
                                </span>
                                {contractor.yearsOfExperience && (
                                  <span>• {contractor.yearsOfExperience}y exp</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {contractor.price ? (
                                <span className="text-sm font-bold text-green-700 block">{contractor.price}</span>
                              ) : (
                                <span className="text-xs text-green-600">
                                  {contractor.priceNeedsFollowUp ? '📞 Quote' : 'Contact'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Specialties preview */}
                          {contractor.specialties && contractor.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contractor.specialties.slice(0, 3).map((specialty, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                                >
                                  {specialty}
                                </span>
                              ))}
                              {contractor.specialties.length > 3 && (
                                <span className="text-xs text-neutral-500">
                                  +{contractor.specialties.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Review counts preview */}
                          <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-600">
                            {contractor.goodReviews && contractor.goodReviews.length > 0 && (
                              <span className="text-green-600">
                                ✓ {contractor.goodReviews.length} positive
                              </span>
                            )}
                            {contractor.badReviews && contractor.badReviews.length > 0 && (
                              <span className="text-orange-600">
                                ⚠ {contractor.badReviews.length} critical
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {session.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{session.error}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Divider and Results Header - Fade in before contractors */}
        {showResults && allContractors.length > 0 && (
          <>
            {/* Animated Divider */}
            <div className="my-8 animate-fadeIn">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-neutral-50 px-6 py-2 text-sm font-semibold text-neutral-600 rounded-full shadow-sm">
                    ✨ AI Search Complete - Results Below
                  </span>
                </div>
              </div>
            </div>

            {/* AI-Generated Comparison Graphics */}
            {isDemoMode && (taskrabbitGraphic || thumbtackGraphic || isGeneratingGraphics) && (
              <div className="mb-8 space-y-6 animate-fadeInSlideUp">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-neutral-800 mb-2 flex items-center justify-center">
                    <span className="mr-3 text-3xl">🎨</span>
                    AI-Generated Comparison Graphics
                  </h2>
                  <p className="text-sm text-neutral-600">
                    Powered by Gemini 2.0 Flash • Playful visual comparison of contractors
                  </p>
                </div>

                {isGeneratingGraphics && (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-purple-200">
                    <div className="flex justify-center mb-4">
                      <Spinner />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                      🤖 Generating Playful Comparison Graphics...
                    </h3>
                    <p className="text-neutral-600">
                      Gemini is creating animated visuals for both platforms
                    </p>
                  </div>
                )}

                {/* TaskRabbit Graphic */}
                {taskrabbitGraphic && (
                  <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl shadow-lg p-6 border-2 border-teal-300 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-teal-800 flex items-center">
                        <span className="mr-2">🛠️</span>
                        TaskRabbit Comparison
                      </h3>
                      <Badge variant="success">AI Generated</Badge>
                    </div>
                    <div 
                      className="bg-white rounded-xl p-4 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: taskrabbitGraphic }}
                    />
                  </div>
                )}

                {/* Thumbtack Graphic */}
                {thumbtackGraphic && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-blue-300 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-blue-800 flex items-center">
                        <span className="mr-2">👍</span>
                        Thumbtack Comparison
                      </h3>
                      <Badge variant="primary">AI Generated</Badge>
                    </div>
                    <div 
                      className="bg-white rounded-xl p-4 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: thumbtackGraphic }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* All Contractors Summary */}
            <div 
              ref={contractorsRef}
              className="bg-white rounded-2xl shadow-lg p-8 animate-fadeInSlideUp border-2 border-green-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-neutral-800 flex items-center">
                  <span className="mr-3 text-4xl">🎯</span>
                  All Contractors Found ({allContractors.length})
                </h2>
                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-semibold">Search Complete</span>
                </div>
              </div>
              
              {/* Subtitle */}
              <p className="text-neutral-600 mb-6 pb-6 border-b border-neutral-200">
                Below are the top contractors from TaskRabbit and Thumbtack with detailed reviews, specialties, and pricing information.
              </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="border-2 border-neutral-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-xl transition-all bg-white"
                >
                  {/* Header with Profile */}
                  <div className="flex items-start space-x-4 mb-4">
                    {contractor.profileImage && (
                      <img
                        src={contractor.profileImage}
                        alt={contractor.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-lg text-neutral-800">{contractor.name}</h3>
                        {contractor.isTopRated && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                            ⭐ TOP RATED
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500 text-lg">★</span>
                          <span className="text-sm font-bold text-neutral-800">
                            {contractor.rating}
                          </span>
                          <span className="text-xs text-neutral-500">
                            ({contractor.reviewCount} reviews)
                          </span>
                        </div>
                        {contractor.yearsOfExperience && (
                          <span className="text-xs text-neutral-600">
                            • {contractor.yearsOfExperience} yrs exp
                          </span>
                        )}
                      </div>

                      <Badge variant="primary" size="sm">
                        {getPlatformName(contractor.platform)}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-neutral-700 mb-4">{contractor.description}</p>

                  {/* Specialties */}
                  {contractor.specialties && contractor.specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-neutral-600 mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-2">
                        {contractor.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-900">Pricing:</span>
                      {contractor.price ? (
                        <span className="text-lg font-bold text-green-700">{contractor.price}</span>
                      ) : (
                        <span className="text-sm text-green-700">
                          {contractor.priceNeedsFollowUp ? '📞 Contact for quote' : 'Contact for pricing'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Good Reviews */}
                  {contractor.goodReviews && contractor.goodReviews.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-neutral-700 mb-2 flex items-center">
                        <span className="text-green-600 mr-1">✓</span> Positive Reviews:
                      </p>
                      <div className="space-y-2">
                        {contractor.goodReviews.slice(0, 2).map((review, idx) => (
                          <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs">
                            <p className="text-neutral-700 italic">"{review.text}"</p>
                            <div className="flex items-center justify-between mt-1 text-neutral-500">
                              <span>— {review.author}</span>
                              {review.rating && (
                                <span className="text-yellow-600">{'★'.repeat(review.rating)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bad Reviews */}
                  {contractor.badReviews && contractor.badReviews.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-neutral-700 mb-2 flex items-center">
                        <span className="text-orange-600 mr-1">⚠</span> Critical Feedback:
                      </p>
                      <div className="space-y-2">
                        {contractor.badReviews.slice(0, 1).map((review, idx) => (
                          <div key={idx} className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-xs">
                            <p className="text-neutral-700 italic">"{review.text}"</p>
                            <div className="flex items-center justify-between mt-1 text-neutral-500">
                              <span>— {review.author}</span>
                              {review.rating && (
                                <span className="text-orange-600">{'★'.repeat(review.rating)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {contractor.availability && (
                    <p className="text-xs text-neutral-600 mb-3 flex items-center">
                      <span className="mr-2">📅</span>
                      {contractor.availability}
                    </p>
                  )}

                  {/* Action Button */}
                  <a
                    href={contractor.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="primary" fullWidth size="sm">
                      View Full Profile →
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
          </>
        )}

        {/* Loading State */}
        {sessions.length === 0 && isSearching && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <Spinner />
            </div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">Initializing AI Search</h3>
            <p className="text-neutral-600">
              Setting up computer use sessions for TaskRabbit and Thumbtack...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button variant="secondary" onClick={() => window.history.back()}>
            ← Back to Analysis
          </Button>
          {!isDemoMode && (
            <Button 
              variant="primary" 
              onClick={loadDemoData}
            >
              🎭 Demo Fallback
            </Button>
          )}
          {isDemoMode && (
            <Badge variant="success">Demo Mode Active</Badge>
          )}
          {!isSearching && allContractors.length > 0 && (
            <Button variant="success">Continue to Quote Comparison →</Button>
          )}
        </div>
      </div>
    </div>
  );
};

