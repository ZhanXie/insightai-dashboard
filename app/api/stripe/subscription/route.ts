/**
 * Stripe 订阅状态 API
 * GET - 获取用户订阅状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { subscriptionService } from '@/lib/stripe/subscription-service';

/**
 * GET /api/stripe/subscription
 * 获取订阅状态
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;

    const subscription = await subscriptionService.getSubscriptionStatus(userId);

    return NextResponse.json(subscription || { status: 'none' });
  } catch (error) {
    console.error('获取订阅状态失败:', error);
    return NextResponse.json(
      { error: '获取订阅状态失败' },
      { status: 500 }
    );
  }
}
