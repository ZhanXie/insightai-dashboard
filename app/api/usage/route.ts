/**
 * 用量 API
 * GET - 获取用量统计和历史
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { usageService } from '@/lib/usage/usage-service';
import { subscriptionService } from '@/lib/stripe/subscription-service';

/**
 * GET /api/usage
 * 获取用量统计和历史
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await usageService.getUsageStats({ userId });
      return NextResponse.json(stats);
    }

    if (action === 'history') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const history = await usageService.getUsageHistory(userId, page, limit);
      return NextResponse.json(history);
    }

    if (action === 'limit') {
      const subscription = await subscriptionService.getSubscriptionStatus(userId);
      const plan = subscription?.plan || 'free';
      const limit = await usageService.checkUsageLimit(userId, plan as 'free' | 'pro' | 'team');
      return NextResponse.json(limit);
    }

    // 默认返回统计和当前限制
    const [stats, subscription, limit] = await Promise.all([
      usageService.getUsageStats({ userId }),
      subscriptionService.getSubscriptionStatus(userId),
      usageService.checkUsageLimit(userId, 'free'),
    ]);

    return NextResponse.json({
      stats,
      subscription: subscription || { status: 'none' },
      limit,
    });
  } catch (error) {
    console.error('获取用量信息失败:', error);
    return NextResponse.json(
      { error: '获取用量信息失败' },
      { status: 500 }
    );
  }
}
