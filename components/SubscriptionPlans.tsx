/**
 * 订阅计划展示组件
 */

'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  priceId: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: '免费版',
    description: '适合个人学习和基础使用',
    price: '免费',
    features: ['每月 100k Token', '5 个项目', '基础报告模板'],
    priceId: '',
  },
  {
    id: 'pro',
    name: '专业版',
    description: '适合研究人员和专业人士',
    price: '¥99/月',
    features: ['每月 1M Token', '无限项目', '高级报告模板', '优先客服支持'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
  },
  {
    id: 'team',
    name: '团队版',
    description: '适合团队协作和企业使用',
    price: '¥299/月',
    features: ['每月 5M Token', '无限项目', '所有报告模板', 'API 访问', '专属客户经理'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM || '',
  },
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSubscribe?: (plan: string) => void;
}

export function SubscriptionPlans({ currentPlan, onSubscribe }: SubscriptionPlansProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`flex flex-col ${
            currentPlan === plan.id ? 'border-primary shadow-md' : ''
          }`}
        >
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-3xl font-bold mb-4">{plan.price}</div>
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentPlan === plan.id ? (
              <Button variant="outline" className="w-full" disabled>
                当前计划
              </Button>
            ) : plan.id === 'free' ? (
              <Button variant="outline" className="w-full" disabled>
                免费使用
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => onSubscribe?.(plan.id)}
              >
                订阅
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
