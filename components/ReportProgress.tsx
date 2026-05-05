/**
 * 报告进度组件
 * 显示报告生成的实时状态
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Stage {
  stage: string;
  message: string;
  progress: number;
}

interface ReportProgressProps {
  reportId: string;
  onComplete?: () => void;
}

const stageLabels: Record<string, string> = {
  researching: '网页研究',
  retrieving: '文档检索',
  analyzing: '内容分析',
  writing: '报告撰写',
};

export function ReportProgress({ reportId, onComplete }: ReportProgressProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/reports/${reportId}/generate`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'stage') {
          setCurrentStage(data.stage);
          setStages((prev) => {
            const exists = prev.find((s) => s.stage === data.stage);
            if (exists) {
              return prev.map((s) =>
                s.stage === data.stage ? { ...s, message: data.message, progress: data.progress } : s
              );
            }
            return [...prev, { stage: data.stage, message: data.message, progress: data.progress }];
          });
        }

        if (data.type === 'complete') {
          eventSource.close();
          onComplete?.();
        }

        if (data.type === 'error') {
          setError(data.error);
          eventSource.close();
        }
      } catch (e) {
        console.error('解析 SSE 消息失败:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setError('连接失败');
    };

    return () => {
      eventSource.close();
    };
  }, [reportId, onComplete]);

  return (
    <Card className="p-4 space-y-3">
      {['researching', 'retrieving', 'analyzing', 'writing'].map((stageKey) => {
        const stage = stages.find((s) => s.stage === stageKey);
        const isCurrent = currentStage === stageKey;
        const isComplete = stage && stage.progress === 100;
        const isError = error && currentStage === stageKey;

        return (
          <div key={stageKey} className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : isCurrent ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {stageLabels[stageKey]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stage ? `${stage.progress}%` : '等待中'}
                </span>
              </div>
              {stage && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stage.message}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}
    </Card>
  );
}
