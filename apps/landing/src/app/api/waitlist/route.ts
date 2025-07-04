import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService, waitlistSchema } from '@/lib/waitlist';
import { checkRateLimit, getClientIP, isValidEmail } from '@/lib/security';
import {
  SuccessResponse,
  ErrorResponse,
  WaitlistEntryData,
  WaitlistCountData,
} from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const headers = Object.fromEntries(request.headers.entries());

    const securityCheck = checkRateLimit(clientIP, userAgent, headers);
    if (!securityCheck.allowed) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message:
              securityCheck.reason ||
              'Too many requests. Please try again later.',
            details: { type: 'security_violation' },
          },
        },
        { status: 429 }
      );
    }

    let body;
    try {
      const text = await request.text();
      if (text.length > 1024) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'REQUEST_TOO_LARGE',
              message: 'Request body too large',
            },
          },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON format',
          },
        },
        { status: 400 }
      );
    }

    const validationResult = waitlistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please check your input and try again',
            details: validationResult.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    if (!isValidEmail(validatedData.email)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please enter a valid email address',
          },
        },
        { status: 400 }
      );
    }

    const result = await WaitlistService.addToWaitlist(validatedData);

    if (!result.success) {
      if (result.error === 'Email already registered for waitlist') {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'EMAIL_ALREADY_REGISTERED',
              message:
                "Great news! You're already on our waitlist. We'll notify you as soon as YT Clipper is ready!",
              details: { type: 'already_registered' },
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'WAITLIST_SERVICE_ERROR',
            message:
              'Unable to add you to the waitlist right now. Please try again later.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<SuccessResponse<WaitlistEntryData>>(
      {
        success: true,
        message:
          "Welcome to the YT Clipper waitlist! We'll notify you when it's ready.",
        data: {
          id: result.id!.toString(),
          remainingRequests: securityCheck.remainingRequests,
        },
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': `${securityCheck.remainingRequests ?? 0}`,
          'X-RateLimit-Reset': `${securityCheck.resetTime ?? 0}`,
        },
      }
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const headers = Object.fromEntries(request.headers.entries());

    const securityCheck = checkRateLimit(clientIP, userAgent, headers);
    if (!securityCheck.allowed) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        { status: 429 }
      );
    }

    const count = await WaitlistService.getWaitlistCount();

    return NextResponse.json<SuccessResponse<WaitlistCountData>>(
      {
        success: true,
        message: 'Waitlist status retrieved successfully',
        data: {
          count,
          remainingRequests: securityCheck.remainingRequests,
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': `${securityCheck.remainingRequests ?? 0}`,
          'X-RateLimit-Reset': `${securityCheck.resetTime ?? 0}`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching waitlist status:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to fetch waitlist status right now',
        },
      },
      { status: 500 }
    );
  }
}
