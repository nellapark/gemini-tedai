import React, { useState } from 'react';
import { CheckCircleIcon } from '../Icons';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { AnalysisResult, MediaFile } from '../../types';
import { generateScopeOfWorkPDF } from '../../utils/pdfGenerator';

interface AnalysisResultCardProps {
  result: AnalysisResult;
  mediaFiles: MediaFile[];
  onStartNew: () => void;
  onRequestQuotes: () => void;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  result,
  mediaFiles,
  onStartNew,
  onRequestQuotes,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    scope: true,
    safety: true,
    measurements: false,
    recommendations: true,
    history: true,
    timeline: true,
    concerns: true,
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'warning';
      default: return 'success';
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'Severe': return 'danger';
      case 'Major': return 'warning';
      case 'Moderate': return 'warning';
      default: return 'success';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Required': return 'text-red-600 bg-red-50';
      case 'Recommended': return 'text-orange-600 bg-orange-50';
      case 'Optional': return 'text-blue-600 bg-blue-50';
      default: return 'text-neutral-600 bg-neutral-50';
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Get image and video files for annotation
      const imageFiles = mediaFiles.filter(f => f.type === 'image' || f.type === 'video');
      
      let annotatedImages: Array<{ url: string; annotation: string }> = [];

      if (imageFiles.length > 0) {
        // Send images to backend for Gemini Vision annotation
        const formData = new FormData();
        imageFiles.forEach(media => {
          formData.append('images', media.file);
        });
        
        // Create context from analysis result
        const context = `${result.category} - ${result.subcategory || ''}\n${result.problemSummary}\n${result.detailedDescription || ''}`;
        formData.append('analysisContext', context);

        const response = await fetch('/api/annotate-images', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          annotatedImages = data.annotatedImages;
        } else {
          console.error('Failed to annotate images');
          // Continue with PDF generation without annotations
        }
      }

      // Generate PDF
      const pdfBlob = await generateScopeOfWorkPDF(result, annotatedImages);

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scope-of-work-${result.category.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">Analysis Complete!</h1>
              <p className="text-sm text-neutral-500 mt-1">Comprehensive scope of work generated</p>
            </div>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Category</p>
              <p className="text-lg font-bold text-blue-900">{result.category}</p>
              {result.subcategory && (
                <p className="text-sm text-blue-700">{result.subcategory}</p>
              )}
            </div>

            <div className={`rounded-xl p-4 border-2 ${
              result.urgency === 'Critical' || result.urgency === 'High' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${
                result.urgency === 'Critical' || result.urgency === 'High' 
                  ? 'text-red-700' 
                  : 'text-yellow-700'
              }`}>Urgency</p>
              <p className={`text-lg font-bold ${
                result.urgency === 'Critical' || result.urgency === 'High' 
                  ? 'text-red-900' 
                  : 'text-yellow-900'
              }`}>{result.urgency}</p>
              {result.urgencyReason && (
                <p className={`text-sm ${
                  result.urgency === 'Critical' || result.urgency === 'High' 
                    ? 'text-red-700' 
                    : 'text-yellow-700'
                }`}>{result.urgencyReason}</p>
              )}
            </div>

            {result.severity && result.affectedAreas ? (
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Severity</p>
                <p className="text-lg font-bold text-purple-900">{result.severity}</p>
                <p className="text-sm text-purple-700">
                  {result.affectedAreas.length} area{result.affectedAreas.length !== 1 ? 's' : ''} affected
                </p>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
                <p className="text-xs font-semibold text-neutral-700 uppercase mb-1">Status</p>
                <p className="text-lg font-bold text-neutral-900">Ready for quotes</p>
              </div>
            )}
          </div>

          {/* Problem Overview */}
          <section className="mb-8 bg-neutral-50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">Problem Overview</h2>
            <p className="text-neutral-700 font-medium mb-2">{result.problemSummary}</p>
            {result.detailedDescription && (
              <p className="text-neutral-600 leading-relaxed">{result.detailedDescription}</p>
            )}
            
            {result.affectedAreas && result.affectedAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-neutral-700 mb-2">Affected Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {result.affectedAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            )}

            {result.estimatedSize && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-neutral-700">Estimated Size: 
                  <span className="font-normal text-neutral-600 ml-2">{result.estimatedSize}</span>
                </p>
              </div>
            )}
          </section>

          {/* Issue History & Context */}
          {result.issueHistory && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('history')}
                className="w-full flex items-center justify-between p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">Issue History & Context</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.history ? '−' : '+'}</span>
              </button>
              {expandedSections.history && (
                <div className="mt-4 p-6 bg-white border-2 border-indigo-200 rounded-xl space-y-4">
                  {result.issueHistory.whenStarted && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-indigo-900 mb-1">When It Started</p>
                      <p className="text-neutral-700">{result.issueHistory.whenStarted}</p>
                    </div>
                  )}
                  
                  {result.issueHistory.howItHappened && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-indigo-900 mb-1">How It Happened</p>
                      <p className="text-neutral-700">{result.issueHistory.howItHappened}</p>
                    </div>
                  )}
                  
                  {result.issueHistory.previousAttempts && result.issueHistory.previousAttempts.length > 0 && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-indigo-900 mb-2">Previous Fix Attempts</p>
                      <ul className="space-y-1">
                        {result.issueHistory.previousAttempts.map((attempt, idx) => (
                          <li key={idx} className="text-neutral-700">• {attempt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* User Timeline & Scheduling */}
          {result.userTimeline && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('timeline')}
                className="w-full flex items-center justify-between p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">Timeline & Scheduling Requirements</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.timeline ? '−' : '+'}</span>
              </button>
              {expandedSections.timeline && (
                <div className="mt-4 p-6 bg-white border-2 border-cyan-200 rounded-xl space-y-4">
                  {result.userTimeline.desiredCompletionDate && (
                    <div className="bg-cyan-50 p-4 rounded-lg border-l-4 border-cyan-500">
                      <p className="text-sm font-semibold text-cyan-900 mb-1">Desired Completion</p>
                      <p className="text-lg font-bold text-cyan-800">{result.userTimeline.desiredCompletionDate}</p>
                    </div>
                  )}
                  
                  {result.userTimeline.schedulingConstraints && result.userTimeline.schedulingConstraints.length > 0 && (
                    <div className="bg-cyan-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-cyan-900 mb-2">Scheduling Constraints</p>
                      <ul className="space-y-1">
                        {result.userTimeline.schedulingConstraints.map((constraint, idx) => (
                          <li key={idx} className="text-neutral-700 flex items-start">
                            <span className="text-cyan-600 mr-2">🕒</span>
                            {constraint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* User Concerns & Environmental Factors */}
          {((result.userConcerns && result.userConcerns.length > 0) || 
            (result.environmentalFactors && result.environmentalFactors.length > 0)) && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('concerns')}
                className="w-full flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">Additional Concerns & Factors</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.concerns ? '−' : '+'}</span>
              </button>
              {expandedSections.concerns && (
                <div className="mt-4 p-6 bg-white border-2 border-amber-200 rounded-xl space-y-4">
                  {result.userConcerns && result.userConcerns.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-3">User Concerns & Priorities</p>
                      <ul className="space-y-2">
                        {result.userConcerns.map((concern, idx) => (
                          <li key={idx} className="flex items-start bg-amber-50 p-3 rounded-lg">
                            <span className="text-amber-600 mr-2 mt-0.5">💭</span>
                            <span className="text-neutral-700">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.environmentalFactors && result.environmentalFactors.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-3">Environmental & Situational Factors</p>
                      <ul className="space-y-2">
                        {result.environmentalFactors.map((factor, idx) => (
                          <li key={idx} className="flex items-start bg-amber-50 p-3 rounded-lg">
                            <span className="text-amber-600 mr-2 mt-0.5">🌍</span>
                            <span className="text-neutral-700">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Visible Damage */}
          {result.visibleDamage && result.visibleDamage.length > 0 && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('details')}
                className="w-full flex items-center justify-between p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">Visible Damage & Symptoms</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.details ? '−' : '+'}</span>
              </button>
              {expandedSections.details && (
                <div className="mt-4 p-6 bg-white border-2 border-orange-200 rounded-xl">
                  <ul className="space-y-2">
                    {result.visibleDamage.map((damage, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-orange-600 mr-3 mt-1 font-bold">⚠</span>
                        <span className="text-neutral-700">{damage}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Scope of Work */}
          {result.scopeOfWork ? (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('scope')}
                className="w-full flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">Professional Scope of Work</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.scope ? '−' : '+'}</span>
              </button>
              {expandedSections.scope && (
                <div className="mt-4 p-6 bg-white border-2 border-green-200 rounded-xl">
                  {result.scopeOfWork.summary && (
                    <p className="text-neutral-700 font-medium mb-6 p-4 bg-green-50 rounded-lg">
                      {result.scopeOfWork.summary}
                    </p>
                  )}

                  {/* Required Tasks */}
                  {result.scopeOfWork.requiredTasks && result.scopeOfWork.requiredTasks.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-neutral-800 mb-3">Required Tasks</h3>
                      <div className="space-y-3">
                        {result.scopeOfWork.requiredTasks.map((task, idx) => (
                          <div key={idx} className="border-l-4 border-neutral-300 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <p className="font-semibold text-neutral-800">{task.task}</p>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 mt-1">{task.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materials Needed */}
                  {result.scopeOfWork.materialsNeeded && result.scopeOfWork.materialsNeeded.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-neutral-800 mb-3">Materials Needed</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.scopeOfWork.materialsNeeded.map((material, idx) => (
                          <li key={idx} className="flex items-center bg-neutral-50 px-3 py-2 rounded-lg">
                            <span className="text-green-600 mr-2">✓</span>
                            <span className="text-neutral-700">{material}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Duration & Access */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.scopeOfWork.estimatedDuration && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Estimated Duration</p>
                        <p className="text-lg font-bold text-blue-700">{result.scopeOfWork.estimatedDuration}</p>
                      </div>
                    )}
                    
                    {result.scopeOfWork.accessRequirements && result.scopeOfWork.accessRequirements.length > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Access Requirements</p>
                        <ul className="space-y-1">
                          {result.scopeOfWork.accessRequirements.map((req, idx) => (
                            <li key={idx} className="text-sm text-purple-700">• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          ) : result.scopeItems && result.scopeItems.length > 0 ? (
            // Fallback to legacy scopeItems format
            <section className="mb-8">
              <div className="p-6 bg-green-50 rounded-xl">
                <h2 className="text-xl font-bold text-neutral-800 mb-3">Scope of Work</h2>
                <ul className="space-y-2">
                  {result.scopeItems.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary mr-3 mt-1">•</span>
                      <span className="text-neutral-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Safety Hazards */}
          {result.safetyHazards && result.safetyHazards.length > 0 && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('safety')}
                className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">⚠️ Safety Hazards & Considerations</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.safety ? '−' : '+'}</span>
              </button>
              {expandedSections.safety && (
                <div className="mt-4 p-6 bg-white border-2 border-red-200 rounded-xl">
                  <ul className="space-y-3">
                    {result.safetyHazards.map((hazard, idx) => (
                      <li key={idx} className="flex items-start bg-red-50 p-3 rounded-lg">
                        <span className="text-red-600 mr-3 mt-0.5 text-xl">⚠️</span>
                        <span className="text-neutral-800 font-medium">{hazard}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {result.specialConsiderations && result.specialConsiderations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-red-200">
                      <p className="font-semibold text-neutral-800 mb-2">Special Considerations:</p>
                      <ul className="space-y-2">
                        {result.specialConsiderations.map((consideration, idx) => (
                          <li key={idx} className="text-neutral-700">• {consideration}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Measurements */}
          {result.measurements && result.measurements.estimatedMeasurements && result.measurements.estimatedMeasurements.length > 0 && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('measurements')}
                className="w-full flex items-center justify-between p-4 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">📏 Measurements & Technical Details</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.measurements ? '−' : '+'}</span>
              </button>
              {expandedSections.measurements && (
                <div className="mt-4 p-6 bg-white border-2 border-neutral-200 rounded-xl">
                  {!result.measurements.hasVisibleMeasurements && (
                    <p className="text-sm text-neutral-600 italic mb-3">
                      Note: These are estimated measurements based on visual analysis
                    </p>
                  )}
                  <ul className="space-y-2">
                    {result.measurements.estimatedMeasurements.map((measurement, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-neutral-600 mr-2">📐</span>
                        <span className="text-neutral-700">{measurement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Recommendations */}
          {result.recommendedActions && result.recommendedActions.length > 0 && (
            <section className="mb-8">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full flex items-center justify-between p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
              >
                <h2 className="text-xl font-bold text-neutral-800">💡 Recommended Immediate Actions</h2>
                <span className="text-2xl text-neutral-600">{expandedSections.recommendations ? '−' : '+'}</span>
              </button>
              {expandedSections.recommendations && (
                <div className="mt-4 p-6 bg-white border-2 border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-4 font-medium">
                    Take these actions while waiting for a contractor:
                  </p>
                  <ul className="space-y-3">
                    {result.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start bg-yellow-50 p-3 rounded-lg">
                        <span className="text-yellow-600 mr-3 mt-0.5">👉</span>
                        <span className="text-neutral-800">{action}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {result.additionalInspectionNeeded !== undefined && result.additionalInspectionNeeded && (
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> A contractor will likely need an in-person inspection for a fully accurate quote.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-4 pt-6 border-t-2 border-neutral-200">
            {/* Download PDF Button - Prominent */}
            <Button 
              variant="success" 
              fullWidth 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="py-4 text-lg font-semibold"
            >
              {isGeneratingPDF ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF with AI Annotations...
                </>
              ) : (
                <>
                  📄 Download Detailed Scope of Work PDF
                </>
              )}
            </Button>

            {/* Other Action Buttons */}
            <div className="flex gap-4">
              <Button variant="secondary" fullWidth onClick={onStartNew}>
                ← Start New Job
              </Button>
              <Button variant="primary" fullWidth onClick={onRequestQuotes}>
                Request Quotes from Contractors →
              </Button>
            </div>
          </div>

          <p className="text-xs text-neutral-500 text-center mt-4">
            Download includes professionally formatted scope of work with AI-annotated images, measurements, and detailed descriptions
          </p>
        </div>
      </div>
    </div>
  );
};

