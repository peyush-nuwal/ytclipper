# YT Clipper Landing Page

A Next.js landing page for YT Clipper with waitlist functionality.

## Features

- Modern Next.js 15 with TypeScript
- Tailwind CSS for styling
- MongoDB integration for waitlist
- API routes for waitlist management
- Responsive design
- **Comprehensive Security**: Rate limiting, bot detection, IP banning, input validation
- **Enhanced Email Validation**: RFC-compliant with spam pattern detection
- **Attack Prevention**: Protection against DDoS, spam, and bot attacks

## Environment Setup

1. Copy the environment example file:
```bash
cp .env.example .env.local
```

2. Update the `.env.local` file with your MongoDB credentials:
```env
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@yt-clipper-cluster.ft19gmx.mongodb.net/?retryWrites=true&w=majority&appName=yt-clipper-cluster
```

Replace `<db_username>` and `<db_password>` with your actual MongoDB Atlas credentials.

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### POST /api/waitlist
Add a user to the waitlist.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe", // optional
  "source": "landing", // optional
  "metadata": {} // optional
}
```

**Response:**
```json
{
  "message": "Successfully added to waitlist",
  "id": "unique_id"
}
```

### GET /api/waitlist
Get waitlist statistics.

**Response:**
```json
{
  "message": "Waitlist status",
  "count": 42
}
```

## Database Schema

The waitlist data is stored in MongoDB with the following structure:

```typescript
interface WaitlistEntry {
  _id?: ObjectId;
  email: string;
  name?: string;
  createdAt: Date;
  source?: string;
  metadata?: Record<string, any>;
}
```

## Components

### WaitlistForm
A React component for collecting waitlist signups.

```tsx
import WaitlistForm from '@/components/WaitlistForm';

<WaitlistForm source="homepage" className="max-w-md" />
```

## Testing

Run tests with:
```bash
pnpm test
```

## Building

Build for production:
```bash
pnpm build
```

## Security

The waitlist API includes comprehensive security measures:
- Rate limiting (5 requests per 15 minutes per IP)
- Bot detection and IP banning
- Enhanced email validation
- Input sanitization and size limits
- Security headers and CORS protection

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

## Deployment

The app can be deployed to any platform that supports Next.js (Vercel, Netlify, etc.).

**Production Security Notes:**
- Set `ADMIN_KEY` environment variable for admin endpoint protection
- Consider using Redis for rate limiting stores in high-traffic environments
- Monitor the admin endpoint for suspicious activities
