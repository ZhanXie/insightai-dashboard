/**
 * Subscription 服务层
 * 负责 Stripe 订阅管理
 */

import { prisma } from '@/lib/prisma';
import type { Subscription } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';
import { getStripe } from './client';

export interface CreateCheckoutSessionInput {
  userId: string;
  plan: 'free' | 'pro' | 'team';
  successUrl: string;
  cancelUrl: string;
}

export interface UpdateSubscriptionInput {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: string;
  status: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Subscription 服务类
 */
export class SubscriptionService {
  /**
   * 创建 Checkout Session
   */
  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<{ url: string }> {
    const { userId, plan, successUrl, cancelUrl } = input;

    // 获取或创建 Stripe Customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    let customerId: string;

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId;
    } else {
      // 获取用户信息
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('用户不存在');
      }

      // 创建 Stripe Customer
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;

      // 保存 Customer ID
      if (subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            stripeCustomerId: customerId,
            plan: 'free',
            status: 'inactive',
            stripePriceId: '',
          },
        });
      }
    }

    // 获取 Price ID
    const priceIdMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_ID_PRO || '',
      team: process.env.STRIPE_PRICE_ID_TEAM || '',
    };

    const priceId = priceIdMap[plan];
    if (!priceId) {
      throw new Error(`未找到计划 ${plan} 对应的价格 ID`);
    }

    // 创建 Checkout Session
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
      },
    });

    return { url: session.url || '' };
  }

  /**
   * 获取订阅状态
   */
  async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { userId },
    });
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('未找到活跃订阅');
    }

    // 在 Stripe 取消订阅
    await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // 更新本地数据库
    return prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * 更新订阅信息（从 Webhook 调用）
   */
  async updateSubscription(input: UpdateSubscriptionInput): Promise<Subscription> {
    const { stripeCustomerId, ...data } = input;

    return prisma.subscription.upsert({
      where: {
        stripeCustomerId,
      },
      create: {
        userId: '', // 需要通过 metadata 获取
        stripeCustomerId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * 根据 Stripe Customer ID 查找订阅
   */
  async getSubscriptionByCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { stripeCustomerId },
    });
  }
}

// 导出单例
export const subscriptionService = new SubscriptionService();
