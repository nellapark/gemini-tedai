import React, { useState, useEffect } from 'react';
import { ComputerUseSession, ContractorLead, AnalysisResult } from '../../types';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { Badge } from '../atoms/Badge';

interface QuoteDashboardProps {
  jobId: string;
  zipCode: string;
  analysisResult: AnalysisResult;
}

export const QuoteDashboard: React.FC<QuoteDashboardProps> = ({
  jobId,
  zipCode,
  analysisResult,
}) => {
  const [sessions, setSessions] = useState<ComputerUseSession[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allContractors, setAllContractors] = useState<ContractorLead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startQuoteSearch();
  }, []);

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

        if (data.type === 'session_update') {
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
              <h1 className="text-3xl font-bold text-neutral-800">Finding Contractors</h1>
              <p className="text-neutral-600 mt-1">
                AI is searching {sessions.length} platforms in your area (Zip: {zipCode})
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
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)} animate-pulse`} />
                    <h3 className="font-bold text-lg">{getPlatformName(session.platform)}</h3>
                  </div>
                  <Badge variant={session.status === 'completed' ? 'success' : 'secondary'}>
                    {session.status}
                  </Badge>
                </div>
              </div>

              {/* Screenshot Preview */}
              {session.screenshot && (
                <div className="relative h-64 bg-neutral-900">
                  <img
                    src={session.screenshot}
                    alt="Computer use screenshot"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-sm font-medium">{session.currentAction}</p>
                  </div>
                </div>
              )}

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

              {/* Current Action */}
              <div className="p-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 mb-3">
                  <span className="font-semibold">Current Action:</span> {session.currentAction}
                </p>

                {/* Contractors Found */}
                {session.contractors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-neutral-700 mb-2">
                      Contractors Found: {session.contractors.length}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {session.contractors.map((contractor) => (
                        <div
                          key={contractor.id}
                          className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg border border-green-200"
                        >
                          {contractor.profileImage && (
                            <img
                              src={contractor.profileImage}
                              alt={contractor.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-neutral-800 truncate">
                              {contractor.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-500">★</span>
                              <span className="text-xs text-neutral-600">
                                {contractor.rating} ({contractor.reviewCount} reviews)
                              </span>
                            </div>
                          </div>
                          {contractor.price && (
                            <span className="text-sm font-bold text-green-700">{contractor.price}</span>
                          )}
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

        {/* All Contractors Summary */}
        {allContractors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">
              All Contractors Found ({allContractors.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="border-2 border-neutral-200 rounded-xl p-4 hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    {contractor.profileImage && (
                      <img
                        src={contractor.profileImage}
                        alt={contractor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-800 truncate">{contractor.name}</h3>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-semibold text-neutral-700">
                          {contractor.rating}
                        </span>
                        <span className="text-xs text-neutral-500">
                          ({contractor.reviewCount})
                        </span>
                      </div>
                      <Badge variant="secondary" size="sm" className="mt-1">
                        {getPlatformName(contractor.platform)}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{contractor.description}</p>

                  {contractor.price && (
                    <div className="mb-3">
                      <span className="text-lg font-bold text-green-700">{contractor.price}</span>
                    </div>
                  )}

                  {contractor.availability && (
                    <p className="text-xs text-neutral-500 mb-3">
                      Available: {contractor.availability}
                    </p>
                  )}

                  <Button variant="primary" fullWidth size="sm">
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {sessions.length === 0 && isSearching && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Spinner className="mx-auto mb-4" />
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
          {!isSearching && allContractors.length > 0 && (
            <Button variant="success">Continue to Quote Comparison →</Button>
          )}
        </div>
      </div>
    </div>
  );
};

