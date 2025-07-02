import { ObjectId } from 'mongodb';
import { z } from 'zod';

// MongoDB collection schema using Drizzle pattern
export interface WaitlistEntry {
  _id?: ObjectId;
  email: string;
  name?: string;
  createdAt: Date;
  source?: string;
  metadata?: Record<string, any>;
}

// Enhanced Zod validation schema for API input
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
  metadata: z
    .record(z.any())
    .refine(
      data => Object.keys(data || {}).length <= 10,
      'Metadata cannot have more than 10 keys'
    )
    .optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

// Collection name
export const COLLECTIONS = {
  WAITLIST: 'waitlist',
} as const;
