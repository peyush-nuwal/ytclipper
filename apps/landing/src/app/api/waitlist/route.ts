import { NextRequest, NextResponse } from 'next/server';
import { waitlistSchema } from '@/lib/schema';
import { WaitlistService } from '@/lib/waitlist';
import { checkRateLimit, getClientIP, isValidEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const headers = Object.fromEntries(request.headers.entries());

    // Security checks
    const securityCheck = checkRateLimit(clientIP, userAgent, headers);
    if (!securityCheck.allowed) {
      return NextResponse.json(
        {
          error: securityCheck.reason,
          type: 'security_violation',
        },
        { status: 429 }
      );
    }

    // Parse request body with size limit
    let body;
    try {
      const text = await request.text();
      if (text.length > 1024) {
        // 1KB limit
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    // Validate input with Zod
    const validationResult = waitlistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Please check your input and try again',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Additional email validation
    if (!isValidEmail(validatedData.email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
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
        return NextResponse.json(
          {
            error:
              "Great news! You're already on our waitlist. We'll notify you as soon as YT Clipper is ready!",
            type: 'already_registered',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            'Unable to add you to the waitlist right now. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Return success response with rate limit info
    return NextResponse.json(
      {
        message:
          "Welcome to the YT Clipper waitlist! We'll notify you when it's ready.",
        id: result.id,
        remainingRequests: securityCheck.remainingRequests,
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining':
            securityCheck.remainingRequests?.toString() || '0',
          'X-RateLimit-Reset': securityCheck.resetTime?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);

    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get waitlist count using service
    const count = await WaitlistService.getWaitlistCount();

    return NextResponse.json(
      {
        message: 'Waitlist status',
        count,
        remainingRequests: securityCheck.remainingRequests,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining':
            securityCheck.remainingRequests?.toString() || '0',
          'X-RateLimit-Reset': securityCheck.resetTime?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching waitlist status:', error);

    return NextResponse.json(
      { error: 'Unable to fetch waitlist status right now' },
      { status: 500 }
    );
  }
}
