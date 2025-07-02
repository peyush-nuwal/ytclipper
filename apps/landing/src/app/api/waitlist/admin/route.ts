import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist';
import {
  SuccessResponse,
  ErrorResponse,
  WaitlistAdminEntriesData,
  WaitlistAdminStatsData,
  WaitlistAdminHelpData,
} from '@/lib/types';

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
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    switch (action) {
      case 'entries':
        const entries = await WaitlistService.getWaitlistEntries(limit, skip);
        const successResponse: SuccessResponse<WaitlistAdminEntriesData> = {
          success: true,
          message: 'Waitlist entries retrieved successfully',
          data: {
            entries: entries.map(entry => ({
              id: entry._id?.toString() || '',
              email: entry.email,
              name: entry.name,
              source: entry.source,
              createdAt: entry.createdAt?.toISOString() || '',
              ip: entry.metadata?.ip,
              userAgent: entry.metadata?.userAgent?.substring(0, 100),
            })),
            total: entries.length,
          },
        };
        return NextResponse.json(successResponse);

      case 'stats':
        const count = await WaitlistService.getWaitlistCount();
        const statsResponse: SuccessResponse<WaitlistAdminStatsData> = {
          success: true,
          message: 'Waitlist statistics retrieved successfully',
          data: {
            totalUsers: count,
          },
        };
        return NextResponse.json(statsResponse);

      default:
        const helpResponse: SuccessResponse<WaitlistAdminHelpData> = {
          success: true,
          message: 'Available admin actions',
          data: {
            availableActions: ['entries', 'stats'],
            usage: {
              entries: '/api/waitlist/admin?action=entries&limit=50&skip=0',
              stats: '/api/waitlist/admin?action=stats',
            },
          },
        };
        return NextResponse.json(helpResponse);
    }
  } catch (error) {
    console.error('Admin endpoint error:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
