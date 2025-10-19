import React from 'react';
import { CheckCircleIcon } from '../Icons';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { AnalysisResult } from '../../types';

interface AnalysisResultCardProps {
  result: AnalysisResult;
  onStartNew: () => void;
  onRequestQuotes: () => void;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  result,
  onStartNew,
  onRequestQuotes,
}) => {
  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'warning';
      default: return 'success';
    }
  };

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
                <Badge variant="primary">{result.category}</Badge>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">Problem Summary</h2>
              <p className="text-neutral-600 leading-relaxed">{result.problemSummary}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-neutral-800">Urgency Level</h2>
                <Badge variant={getUrgencyVariant(result.urgency)}>{result.urgency}</Badge>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-3">Scope of Work</h2>
              <ul className="space-y-2">
                {result.scopeItems.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-primary mr-3 mt-1">•</span>
                    <span className="text-neutral-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button variant="primary" fullWidth onClick={onStartNew}>
              Start New Job
            </Button>
            <Button variant="secondary" fullWidth onClick={onRequestQuotes}>
              Request Quotes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

