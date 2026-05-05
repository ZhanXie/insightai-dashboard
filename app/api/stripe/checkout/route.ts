/**
 * Stripe Checkout API
 * POST - 创建 Checkout Session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { subscriptionService } from '@/lib/stripe/subscription-service';

/**
 * POST /api/stripe/checkout
 * 创建结账会话
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { plan, successUrl, cancelUrl } = body;

    if (!plan || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: '缺少必要参数：plan, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    const validPlans = ['pro', 'team'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `不支持的计划: ${plan}` },
        { status: 400 }
      );
    }

    const result = await subscriptionService.createCheckoutSession({
      userId,
      plan,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('创建 Checkout Session 失败:', error);
    return NextResponse.json(
      { error: '创建 Checkout Session 失败' },
      { status: 500 }
    );
  }
}
