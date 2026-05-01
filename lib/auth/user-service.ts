// User service - business logic for user operations
// Abstracts Prisma queries and provides consistent error handling

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http/api-error";

// Get user by email
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// Create a new user
export async function createUser(
  email: string,
  passwordHash: string,
  name?: string
) {
  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Create new user
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
}