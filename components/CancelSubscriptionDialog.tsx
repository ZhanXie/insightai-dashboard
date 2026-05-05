/**
 * 取消订阅确认对话框
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange, onSuccess }: CancelSubscriptionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/cancel', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '取消订阅失败');
      }
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>取消订阅</DialogTitle>
          <DialogDescription>
            确定要取消当前订阅吗？订阅将在当前计费周期结束后失效，届时你将恢复为免费版。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            保留订阅
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            {isLoading ? '处理中...' : '确认取消'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
