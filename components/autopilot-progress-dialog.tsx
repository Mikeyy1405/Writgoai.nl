'use client';

/**
 * AutoPilot Progress Dialog
 * Shows real-time progress of AutoPilot job execution
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

export interface AutoPilotJob {
  id: string;
  status: 'pending' | 'researching' | 'writing' | 'generating_image' | 'publishing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
  result?: {
    articleId: string;
    wordpressPostId: number;
    wordpressUrl: string;
  };
}

interface AutoPilotProgressDialogProps {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

export function AutoPilotProgressDialog({
  jobId,
  open,
  onClose,
  onComplete,
}: AutoPilotProgressDialogProps) {
  const [job, setJob] = useState<AutoPilotJob | null>(null);
  const [eta, setEta] = useState<number | undefined>();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!jobId || !open) return;

    // Poll for job status
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/client/autopilot/status/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJob(data.job);
          setEta(data.eta);

          // Add step to logs if it's new
          if (data.currentStep && !logs.includes(data.currentStep)) {
            setLogs((prev) => [...prev, data.currentStep]);
          }

          // Handle completion
          if (data.job.status === 'completed') {
            clearInterval(interval);
            if (onComplete && data.job.result) {
              onComplete(data.job.result);
            }
          }

          // Handle failure
          if (data.job.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error fetching job status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobId, open, logs, onComplete]);

  if (!job) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Fetching job status...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {job.status === 'completed' ? (
              <>
                <Check className="h-5 w-5 text-green-500" />
                AutoPilot Completed
              </>
            ) : job.status === 'failed' ? (
              <>
                <X className="h-5 w-5 text-red-500" />
                AutoPilot Failed
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                AutoPilot Running...
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {job.status === 'completed'
              ? 'Your article has been generated and published successfully!'
              : job.status === 'failed'
              ? 'Something went wrong during the AutoPilot execution'
              : 'Autonomous content generation in progress'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round(job.progress)}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-medium text-purple-900">{job.currentStep}</p>
            {eta !== undefined && job.status !== 'completed' && job.status !== 'failed' && (
              <p className="text-xs text-purple-600 mt-1">
                Estimated time remaining: {formatTime(eta)}
              </p>
            )}
          </div>

          {/* Error Message */}
          {job.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-xs text-red-700 mt-1">{job.error}</p>
              </div>
            </div>
          )}

          {/* Steps Log */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Steps:</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {logs.map((log, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 mt-0.5" />
                      <span>{log}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Result Info */}
          {job.status === 'completed' && job.result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900 mb-2">Success!</p>
              <div className="space-y-1 text-xs text-green-700">
                {job.result.wordpressUrl && (
                  <p>
                    <span className="font-medium">WordPress URL:</span>{' '}
                    <a
                      href={job.result.wordpressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-900"
                    >
                      {job.result.wordpressUrl}
                    </a>
                  </p>
                )}
                {job.result.articleId && (
                  <p>
                    <span className="font-medium">Article ID:</span> {job.result.articleId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          {(job.status === 'completed' || job.status === 'failed') && (
            <Button onClick={onClose} variant="default">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
