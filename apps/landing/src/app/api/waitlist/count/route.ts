import { NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist';
import { SuccessResponse, ErrorResponse } from '@/lib/types';

export async function GET() {
  try {
    const totalCount = await WaitlistService.getWaitlistCount();

    const response: SuccessResponse<{ count: number }> = {
      success: true,
      message: 'Waitlist count retrieved successfully',
      data: {
        count: totalCount + 200,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching waitlist count:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch waitlist count',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
