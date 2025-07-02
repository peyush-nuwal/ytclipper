interface RateLimitData {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockExpires?: number;
}

interface IPData {
  requests: number[];
  permanentlyBlocked: boolean;
  suspiciousActivity: number;
}

// In-memory stores (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitData>();
const ipStore = new Map<string, IPData>();

// Configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per 15 minutes
const TEMP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour
const SUSPICIOUS_THRESHOLD = 10; // 10 suspicious activities = permanent block
const BOT_DETECTION_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10; // Maximum requests per minute before flagging as bot

export interface SecurityResult {
  allowed: boolean;
  reason?: string;
  remainingRequests?: number;
  resetTime?: number;
}

export function isValidEmail(email: string): boolean {
  // Enhanced email validation
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) return false;

  // Additional checks
  if (email.length > 254) return false; // RFC 5321 limit
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (email.includes('..')) return false;

  // Check for suspicious patterns (common spam indicators)
  const suspiciousPatterns = [
    /\+{2,}/, // Multiple plus signs
    /\.{3,}/, // Multiple dots
    /@.*@/, // Multiple @ symbols
    /[<>]/, // Angle brackets
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(email));
}

export function detectBot(
  userAgent?: string,
  headers?: Record<string, string>
): boolean {
  if (!userAgent) return true; // No user agent = likely bot

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /axios/i,
    /postman/i,
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) return true;

  // Check for missing common browser headers
  if (!headers) return false;

  const browserHeaders = ['accept', 'accept-language', 'accept-encoding'];
  const missingHeaders = browserHeaders.filter(
    header => !headers[header.toLowerCase()]
  );

  return missingHeaders.length >= 2; // Missing 2+ browser headers = likely bot
}

export function checkRateLimit(
  ip: string,
  userAgent?: string,
  headers?: Record<string, string>
): SecurityResult {
  const now = Date.now();

  // Check if IP is permanently blocked
  const ipData = ipStore.get(ip);
  if (ipData?.permanentlyBlocked) {
    return {
      allowed: false,
      reason:
        'IP address has been permanently blocked due to suspicious activity',
    };
  }

  // Bot detection
  if (detectBot(userAgent, headers)) {
    // Increment suspicious activity for this IP
    const currentIpData = ipData || {
      requests: [],
      permanentlyBlocked: false,
      suspiciousActivity: 0,
    };
    currentIpData.suspiciousActivity++;

    if (currentIpData.suspiciousActivity >= SUSPICIOUS_THRESHOLD) {
      currentIpData.permanentlyBlocked = true;
      ipStore.set(ip, currentIpData);
      return {
        allowed: false,
        reason:
          'IP address has been permanently blocked due to repeated bot activity',
      };
    }

    ipStore.set(ip, currentIpData);
    return {
      allowed: false,
      reason:
        'Bot activity detected. Please use a regular browser to join the waitlist',
    };
  }

  // Track requests per minute for this IP
  const currentRequests = ipData?.requests || [];
  const recentRequests = currentRequests.filter(
    time => now - time < BOT_DETECTION_WINDOW
  );

  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    const updatedIpData = ipData || {
      requests: [],
      permanentlyBlocked: false,
      suspiciousActivity: 0,
    };
    updatedIpData.suspiciousActivity++;
    updatedIpData.requests = [...recentRequests, now];

    if (updatedIpData.suspiciousActivity >= SUSPICIOUS_THRESHOLD) {
      updatedIpData.permanentlyBlocked = true;
    }

    ipStore.set(ip, updatedIpData);

    return {
      allowed: false,
      reason: updatedIpData.permanentlyBlocked
        ? 'IP address has been permanently blocked due to suspicious activity'
        : 'Too many requests. Please wait before trying again',
    };
  }

  // Update IP tracking
  const updatedRequests = [...recentRequests, now];
  const updatedIpData = ipData || {
    requests: [],
    permanentlyBlocked: false,
    suspiciousActivity: 0,
  };
  updatedIpData.requests = updatedRequests;
  ipStore.set(ip, updatedIpData);

  // Check rate limiting
  const key = ip;
  let rateLimitData = rateLimitStore.get(key);

  // Clean up expired data
  if (rateLimitData && now > rateLimitData.resetTime) {
    rateLimitData = undefined;
  }

  // Check if temporarily blocked
  if (
    rateLimitData?.blocked &&
    rateLimitData.blockExpires &&
    now < rateLimitData.blockExpires
  ) {
    return {
      allowed: false,
      reason: `Too many requests. You are temporarily blocked until ${new Date(rateLimitData.blockExpires).toLocaleTimeString()}`,
      resetTime: rateLimitData.blockExpires,
    };
  }

  // Initialize or update rate limit data
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
      blocked: false,
    };
  } else {
    rateLimitData.count++;
  }

  // Check if limit exceeded
  if (rateLimitData.count > RATE_LIMIT_MAX_REQUESTS) {
    rateLimitData.blocked = true;
    rateLimitData.blockExpires = now + TEMP_BLOCK_DURATION;
    rateLimitStore.set(key, rateLimitData);

    return {
      allowed: false,
      reason: `Rate limit exceeded. You are temporarily blocked for 1 hour due to too many requests`,
      resetTime: rateLimitData.blockExpires,
    };
  }

  rateLimitStore.set(key, rateLimitData);

  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_MAX_REQUESTS - rateLimitData.count,
    resetTime: rateLimitData.resetTime,
  };
}

export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const headers = {
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'), // Cloudflare
    'x-client-ip': request.headers.get('x-client-ip'),
    'x-cluster-client-ip': request.headers.get('x-cluster-client-ip'),
  };

  // X-Forwarded-For can contain multiple IPs, take the first one
  if (headers['x-forwarded-for']) {
    const ips = headers['x-forwarded-for'].split(',');
    return ips[0].trim();
  }

  // Try other headers
  for (const [, ip] of Object.entries(headers)) {
    if (ip) return ip.trim();
  }

  // Fallback
  return 'unknown';
}

// Cleanup function to remove old entries (call periodically)
export function cleanupSecurityData(): void {
  const now = Date.now();

  // Cleanup rate limit store
  for (const [key, data] of rateLimitStore.entries()) {
    if (
      now > data.resetTime &&
      (!data.blockExpires || now > data.blockExpires)
    ) {
      rateLimitStore.delete(key);
    }
  }

  // Cleanup old IP requests (keep only recent ones)
  for (const [ip, data] of ipStore.entries()) {
    if (!data.permanentlyBlocked) {
      const recentRequests = data.requests.filter(
        time => now - time < BOT_DETECTION_WINDOW * 10
      );
      if (recentRequests.length === 0 && data.suspiciousActivity === 0) {
        ipStore.delete(ip);
      } else {
        data.requests = recentRequests;
        ipStore.set(ip, data);
      }
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupSecurityData, 30 * 60 * 1000);
