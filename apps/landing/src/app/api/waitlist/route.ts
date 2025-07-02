import { NextRequest, NextResponse } from 'next/server';
import { waitlistSchema } from '@/lib/schema';
import { WaitlistService } from '@/lib/waitlist';
import { checkRateLimit, getClientIP, isValidEmail } from '@/lib/security';
import {
  SuccessResponse,
  ErrorResponse,
  WaitlistEntryData,
  WaitlistCountData,
} from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const headers = Object.fromEntries(request.headers.entries());

    // Security checks
    const securityCheck = checkRateLimit(clientIP, userAgent, headers);
    if (!securityCheck.allowed) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message:
            securityCheck.reason ||
            'Too many requests. Please try again later.',
          details: { type: 'security_violation' },
        },
      };
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // Parse request body with size limit
    let body;
    try {
      const text = await request.text();
      if (text.length > 1024) {
        // 1KB limit
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: 'Request body too large',
          },
        };
        return NextResponse.json(errorResponse, { status: 413 });
      }
      body = JSON.parse(text);
    } catch {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON format',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate input with Zod
    const validationResult = waitlistSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check your input and try again',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Additional email validation
    if (!isValidEmail(validatedData.email)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please enter a valid email address',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Add security metadata
    const secureData = {
      ...validatedData,
      metadata: {
        ...validatedData.metadata,
        ip: clientIP,
        userAgent: userAgent?.substring(0, 200), // Limit length
        timestamp: new Date().toISOString(),
      },
    };

    // Add to waitlist using service
    const result = await WaitlistService.addToWaitlist(secureData);

    if (!result.success) {
      if (result.error === 'Email already registered for waitlist') {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_REGISTERED',
            message:
              "Great news! You're already on our waitlist. We'll notify you as soon as YT Clipper is ready!",
            details: { type: 'already_registered' },
          },
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'WAITLIST_SERVICE_ERROR',
          message:
            'Unable to add you to the waitlist right now. Please try again later.',
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Return success response with rate limit info
    const successResponse: SuccessResponse<WaitlistEntryData> = {
      success: true,
      message:
        "Welcome to the YT Clipper waitlist! We'll notify you when it's ready.",
      data: {
        id: result.id!,
        remainingRequests: securityCheck.remainingRequests,
      },
    };

    return NextResponse.json(successResponse, {
      status: 201,
      headers: {
        'X-RateLimit-Remaining':
          securityCheck.remainingRequests?.toString() || '0',
        'X-RateLimit-Reset': securityCheck.resetTime?.toString() || '0',
      },
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong. Please try again later.',
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get client information for rate limiting
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const headers = Object.fromEntries(request.headers.entries());

    // Apply lighter rate limiting for GET requests
    const securityCheck = checkRateLimit(clientIP, userAgent, headers);
    if (!securityCheck.allowed) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      };
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // Get waitlist count using service
    const count = await WaitlistService.getWaitlistCount();

    const successResponse: SuccessResponse<WaitlistCountData> = {
      success: true,
      message: 'Waitlist status retrieved successfully',
      data: {
        count,
        remainingRequests: securityCheck.remainingRequests,
      },
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: {
        'X-RateLimit-Remaining':
          securityCheck.remainingRequests?.toString() || '0',
        'X-RateLimit-Reset': securityCheck.resetTime?.toString() || '0',
      },
    });
  } catch (error) {
    console.error('Error fetching waitlist status:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to fetch waitlist status right now',
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
