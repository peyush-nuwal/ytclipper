import prisma from '@/lib/prisma';
import { z } from 'zod';

export const COLLECTIONS = {
  WAITLIST: 'waitlist',
} as const;

export const waitlistSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must not exceed 254 characters')
    .transform(email => email.toLowerCase().trim()),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .optional(),
  source: z
    .string()
    .max(50, 'Source must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Source can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export class WaitlistService {
  static async addToWaitlist(
    data: WaitlistInput
  ): Promise<{ id: number | null; success: boolean; error?: string }> {
    try {
      const existing = await prisma.waitlist.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        return {
          id: null,
          success: false,
          error: 'Email already registered for waitlist',
        };
      }

      const result = await prisma.waitlist.create({
        data: {
          email: data.email,
          source: data.source,
          createdAt: new Date(),
        },
      });

      return {
        id: result.id,
        success: true,
      };
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return {
        id: null,
        success: false,
        error: 'Failed to add to waitlist',
      };
    }
  }

  static async getWaitlistCount(): Promise<number> {
    try {
      return await prisma.waitlist.count();
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 0;
    }
  }

  static async isEmailRegistered(email: string): Promise<boolean> {
    try {
      const entry = await prisma.waitlist.findUnique({
        where: { email },
      });
      return !!entry;
    } catch (error) {
      console.error('Error checking email registration:', error);
      return false;
    }
  }

  static async getWaitlistEntries(limit: number = 100, skip: number = 0) {
    try {
      return await prisma.waitlist.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
    } catch (error) {
      console.error('Error getting waitlist entries:', error);
      return [];
    }
  }
}
