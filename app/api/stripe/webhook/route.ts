/**
 * Stripe Webhook API
 * POST - 处理 Stripe 事件
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe/client';
import { subscriptionService } from '@/lib/stripe/subscription-service';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST /api/stripe/webhook
 * 处理 Stripe Webhook 事件
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') || '';

  let event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook 签名验证失败:', err);
    return NextResponse.json(
      { error: 'Webhook 签名验证失败' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // 获取订阅详情
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

          // 更新本地订阅记录
          await subscriptionService.updateSubscription({
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0].price.id,
            plan: plan || 'pro',
            status: 'active',
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });

          console.log(`[Webhook] Checkout completed for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

          const localSub = await subscriptionService.getSubscriptionByCustomerId(
            invoice.customer as string
          );

          if (localSub) {
            await subscriptionService.updateSubscription({
              stripeCustomerId: invoice.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: (subscription as any).items.data[0].price.id,
              plan: localSub.plan,
              status: 'active',
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;

        const localSub = await subscriptionService.getSubscriptionByCustomerId(
          subscription.customer as string
        );

        if (localSub) {
          await subscriptionService.updateSubscription({
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            plan: localSub.plan,
            status: subscription.status === 'active' ? 'active' : 'canceled',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        const localSub = await subscriptionService.getSubscriptionByCustomerId(
          subscription.customer as string
        );

        if (localSub) {
          await prisma.subscription.update({
            where: { stripeCustomerId: subscription.customer as string },
            data: {
              status: 'canceled',
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      default:
        console.log(`[Webhook] 未处理的事件类型: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('处理 Webhook 失败:', error);
    return NextResponse.json(
      { error: '处理 Webhook 失败' },
      { status: 500 }
    );
  }
}
