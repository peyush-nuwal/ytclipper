# Security Implementation for YT Clipper Waitlist

This document outlines the comprehensive security measures implemented to protect the waitlist API from abuse, bot
attacks, and spam.

## 🛡️ Security Features Overview

### 1. **Enhanced Email Validation**

- **Zod Schema Validation**: Strict email format validation with length limits (5-254 characters)
- **RFC 5321 Compliance**: Follows email address standards
- **Suspicious Pattern Detection**: Blocks emails with:
  - Multiple consecutive plus signs (`++`)
  - Multiple consecutive dots (`...`)
  - Multiple @ symbols
  - Angle brackets (`<>`)
  - Leading/trailing dots

### 2. **Bot Detection & Prevention**

- **User Agent Analysis**: Detects common bot patterns:
  - `bot`, `crawler`, `spider`, `scraper`
  - `curl`, `wget`, `python`, `axios`, `postman`
- **Header Analysis**: Validates browser-like headers
- **Missing Headers Detection**: Flags requests missing essential browser headers

### 3. **Rate Limiting System**

- **Per-IP Rate Limiting**: 5 requests per 15 minutes
- **Temporary Blocking**: 1-hour block after rate limit exceeded
- **Progressive Penalties**: Escalating restrictions for repeat offenders

### 4. **IP-Based Security**

- **Request Tracking**: Monitors requests per minute per IP
- **Suspicious Activity Scoring**: Tracks bot-like behavior
- **Permanent IP Banning**: After 10 suspicious activities
- **Automatic Cleanup**: Removes old tracking data

### 5. **Input Validation & Sanitization**

- **Request Size Limits**: 1KB maximum request body
- **Field Length Limits**:
  - Name: 100 characters max
  - Source: 50 characters max
  - Metadata: 10 keys maximum
- **Character Restrictions**: Alphanumeric + safe characters only

### 6. **Security Headers & Middleware**

- **Content Security Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer Policy**: Controls referrer information
- **CORS Configuration**: Proper cross-origin controls

## 🚨 Security Responses

### Already Registered Users

```json
{
  "error": "Great news! You're already on our waitlist. We'll notify you as soon as YT Clipper is ready!",
  "type": "already_registered"
}
```

### Rate Limiting

```json
{
  "error": "Too many requests. You are temporarily blocked until [time]",
  "type": "security_violation"
}
```

### Bot Detection

```json
{
  "error": "Bot activity detected. Please use a regular browser to join the waitlist",
  "type": "security_violation"
}
```

### IP Banning

```json
{
  "error": "IP address has been permanently blocked due to suspicious activity",
  "type": "security_violation"
}
```

## 📊 Rate Limiting Configuration

| Setting              | Value      | Description                     |
| -------------------- | ---------- | ------------------------------- |
| Window               | 15 minutes | Time window for rate limiting   |
| Max Requests         | 5          | Maximum requests per window     |
| Temp Block           | 1 hour     | Duration of temporary blocks    |
| Bot Detection Window | 1 minute   | Time window for bot detection   |
| Max Requests/Minute  | 10         | Threshold for bot flagging      |
| Suspicious Threshold | 10         | Activities before permanent ban |

## 🔍 Monitoring & Logging

### Tracked Metadata

Each waitlist entry includes security metadata:

- **IP Address**: Client IP (respects proxy headers)
- **User Agent**: Browser/client identification
- **Timestamp**: Request timestamp
- **Source**: Entry point tracking

### Admin Endpoint

Development endpoint for monitoring: `/api/waitlist/admin`

- View waitlist entries with security data
- Monitor suspicious activities
- Protected by admin key in production

## 🛠️ Configuration

### Environment Variables

```bash
# Required
MONGODB_URI=your-mongodb-connection-string

# Optional (for production admin access)
ADMIN_KEY=your-secure-admin-key
```

### Security Settings

Located in `src/lib/security.ts`:

```typescript
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per window
const TEMP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour
const SUSPICIOUS_THRESHOLD = 10; // Activities before ban
const MAX_REQUESTS_PER_MINUTE = 10; // Bot detection threshold
```

## 🚀 Production Considerations

### Recommended Enhancements

1. **Redis Integration**: Replace in-memory stores with Redis for scalability
2. **Database Logging**: Store security events in database
3. **Alerting System**: Monitor for attack patterns
4. **Geo-blocking**: Block requests from suspicious countries
5. **CAPTCHA Integration**: Add CAPTCHA for suspicious requests

### Monitoring Endpoints

- `GET /api/waitlist` - Rate limited public endpoint
- `GET /api/waitlist/admin` - Protected admin endpoint (dev only)

## 🔧 Testing

Run security tests:

```bash
pnpm test
```

Tests cover:

- Email validation edge cases
- Bot detection patterns
- Security function behavior
- Input sanitization

## 📝 Incident Response

### If Under Attack

1. Monitor logs for patterns
2. Check admin endpoint for suspicious IPs
3. Consider temporary rate limit adjustments
4. Review blocked IPs for false positives

### IP Unblocking

Currently requires server restart. In production, implement admin controls for IP management.

## ✅ Security Checklist

- [x] Email validation with suspicious pattern detection
- [x] Bot detection and blocking
- [x] Rate limiting per IP
- [x] Progressive penalties for abuse
- [x] Request size limits
- [x] Input sanitization
- [x] Security headers
- [x] CORS configuration
- [x] Admin monitoring endpoint
- [x] Comprehensive logging
- [x] Test coverage

## 🔒 Additional Notes

- All security measures are transparent to legitimate users
- False positives are minimized through progressive penalties
- System self-cleans old data to prevent memory leaks
- Security responses avoid revealing system details to attackers
