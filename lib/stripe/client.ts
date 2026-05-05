/**
 * Stripe 客户端 (懒加载)
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * 获取 Stripe 客户端实例
 * 延迟初始化，避免在开发环境中因未配置密钥导致模块加载崩溃
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error(
        'STRIPE_SECRET_KEY 未配置。请在 .env.local 中添加 Stripe 密钥，或暂时忽略此错误（订阅功能将不可用）。'
      );
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    });
  }
  return stripeInstance;
}

export default getStripe;
