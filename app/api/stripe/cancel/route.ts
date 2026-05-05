/**
 * Stripe 取消订阅 API
 * POST - 取消当前用户的 Stripe 订阅
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { subscriptionService } from '@/lib/stripe/subscription-service';

/**
 * POST /api/stripe/cancel
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    await subscriptionService.cancelSubscription(userId);

    return NextResponse.json({ success: true, message: '已提交取消请求' });
  } catch (error) {
    console.error('取消订阅失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '取消订阅失败' },
      { status: 500 }
    );
  }
}
