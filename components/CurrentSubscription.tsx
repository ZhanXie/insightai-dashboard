/**
 * 当前订阅状态组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface CurrentSubscriptionProps {
  subscription: Subscription | null;
  onCancel?: () => void;
}

const planNames: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  team: '团队版',
};

const statusNames: Record<string, string> = {
  active: '活跃',
  inactive: '未激活',
  canceled: '已取消',
  past_due: '逾期',
};

export function CurrentSubscription({ subscription, onCancel }: CurrentSubscriptionProps) {
  if (!subscription || subscription.plan === 'free') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>当前订阅</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline">免费版</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                升级到专业版解锁更多功能
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>当前订阅</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>{planNames[subscription.plan] || subscription.plan}</Badge>
            <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
              {statusNames[subscription.status] || subscription.status}
            </Badge>
          </div>

          {subscription.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              账单周期截止至{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('zh-CN')}
            </p>
          )}

          {subscription.cancelAtPeriodEnd && (
            <p className="text-sm text-yellow-600">
              订阅将在当前周期结束时到期
            </p>
          )}

          {!subscription.cancelAtPeriodEnd && subscription.status === 'active' && (
            <Button variant="outline" onClick={onCancel}>
              取消订阅
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
