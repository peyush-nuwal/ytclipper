import { connectToDatabase } from './db';
import { COLLECTIONS, WaitlistEntry, WaitlistInput } from './schema';

export class WaitlistService {
  private static async getCollection() {
    const client = await connectToDatabase();
    const db = client.db('ytclipper');
    return db.collection<WaitlistEntry>(COLLECTIONS.WAITLIST);
  }

  static async addToWaitlist(
    data: WaitlistInput
  ): Promise<{ id: string; success: boolean; error?: string }> {
    try {
      const collection = await this.getCollection();

      // Check if email already exists
      const existingEntry = await collection.findOne({ email: data.email });
      if (existingEntry) {
        return {
          id: '',
          success: false,
          error: 'Email already registered for waitlist',
        };
      }

      // Create waitlist entry
      const waitlistEntry: Omit<WaitlistEntry, '_id'> = {
        email: data.email,
        name: data.name,
        source: data.source,
        metadata: data.metadata,
        createdAt: new Date(),
      };

      // Insert into database
      const result = await collection.insertOne(waitlistEntry);

      if (!result.acknowledged) {
        throw new Error('Failed to insert waitlist entry');
      }

      return {
        id: result.insertedId.toString(),
        success: true,
      };
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return {
        id: '',
        success: false,
        error: 'Failed to add to waitlist',
      };
    }
  }

  static async getWaitlistCount(): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments();
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 0;
    }
  }

  static async isEmailRegistered(email: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const entry = await collection.findOne({ email });
      return !!entry;
    } catch (error) {
      console.error('Error checking email registration:', error);
      return false;
    }
  }

  static async getWaitlistEntries(
    limit: number = 100,
    skip: number = 0
  ): Promise<WaitlistEntry[]> {
    try {
      const collection = await this.getCollection();
      return await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .toArray();
    } catch (error) {
      console.error('Error getting waitlist entries:', error);
      return [];
    }
  }
}
