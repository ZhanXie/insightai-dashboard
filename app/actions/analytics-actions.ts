"use server";

import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import {
  getDashboardStats as getDashboardStatsService,
  getDocumentsOverTime as getDocumentsOverTimeService,
  getChatActivity as getChatActivityService,
  getDocumentFormatDistribution as getDocumentFormatDistributionService,
} from "@/lib/analytics/analytics-service";

export async function getDashboardStats() {
  const guard = await requireAuth();
  if ("response" in guard) return null;
  const { userId } = guard;

  return getDashboardStatsService(userId);
}

export async function getDocumentsOverTime() {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const { userId } = guard;

  return getDocumentsOverTimeService(userId);
}

export async function getChatActivity() {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const { userId } = guard;

  return getChatActivityService(userId);
}

export async function getDocumentFormatDistribution() {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const { userId } = guard;

  return getDocumentFormatDistributionService(userId);
}
