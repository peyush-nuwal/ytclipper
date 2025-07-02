import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist';

// Basic admin endpoint for viewing waitlist data
// In production, this should be protected with proper authentication
export async function GET(request: NextRequest) {
  // Simple protection - only allow in development or with admin key
  const adminKey = request.headers.get('x-admin-key');
  const isDevMode = process.env.NODE_ENV === 'development';
  const validAdminKey = process.env.ADMIN_KEY;

  if (
    !isDevMode &&
    (!adminKey || !validAdminKey || adminKey !== validAdminKey)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    switch (action) {
      case 'entries':
        const entries = await WaitlistService.getWaitlistEntries(limit, skip);
        return NextResponse.json({
          entries: entries.map(entry => ({
            id: entry._id?.toString(),
            email: entry.email,
            name: entry.name,
            source: entry.source,
            createdAt: entry.createdAt,
            ip: entry.metadata?.ip,
            userAgent: entry.metadata?.userAgent?.substring(0, 100),
          })),
          total: entries.length,
        });

      case 'stats':
        const count = await WaitlistService.getWaitlistCount();
        return NextResponse.json({
          totalUsers: count,
          message: 'Waitlist statistics',
        });

      default:
        return NextResponse.json({
          availableActions: ['entries', 'stats'],
          usage: {
            entries: '/api/waitlist/admin?action=entries&limit=50&skip=0',
            stats: '/api/waitlist/admin?action=stats',
          },
        });
    }
  } catch (error) {
    console.error('Admin endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
