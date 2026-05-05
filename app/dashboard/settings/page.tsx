/**
 * 设置页面
 */

'use client';

import { useEffect, useState } from 'react';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { CurrentSubscription } from '@/components/CurrentSubscription';
import { UsageOverview } from '@/components/UsageOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface UsageStats {
  totalTokens: number;
  totalRequests: number;
  byType: Record<string, { tokens: number; count: number }>;
}

export default function SettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, usageRes] = await Promise.all([
          fetch('/api/stripe/subscription'),
          fetch('/api/usage?action=stats'),
        ]);
        const subData = await subRes.json();
        const usageData = await usageRes.json();
        setSubscription(subData.status === 'none' ? null : subData);
        setUsageStats(usageData);
      } catch (error) {
        console.error('获取设置数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleSubscribe(plan: string) {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/dashboard/settings?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/settings?canceled=true`,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('创建结账会话失败:', error);
    }
  }

  async function handleCancel() {
    if (!confirm('确定要取消订阅吗？')) {
      return;
    }

    try {
      await fetch('/api/stripe/cancel', { method: 'POST' });
      // 刷新订阅状态
      const res = await fetch('/api/stripe/subscription');
      const data = await res.json();
      setSubscription(data.status === 'none' ? null : data);
    } catch (error) {
      console.error('取消订阅失败:', error);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground mt-1">
          管理你的订阅计划和用量统计
        </p>
      </div>

      <CurrentSubscription
        subscription={subscription}
        onCancel={handleCancel}
      />

      <UsageOverview stats={usageStats} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle>订阅计划</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionPlans
            currentPlan={subscription?.plan}
            onSubscribe={handleSubscribe}
          />
        </CardContent>
      </Card>
    </div>
  );
}
