# YTClipper Chrome Extension

A Chrome extension for collecting timestamps, highlights, and notes from YouTube videos for research purposes.

## Features

- 🎯 **Quick Timestamp Collection**: Press `Ctrl+Shift+T` to instantly save the current video timestamp
- 📝 **Rich Annotations**: Add titles, notes, and tags to your timestamps
- 🎨 **Visual Timeline**: See timestamp markers on the YouTube progress bar
- 🔄 **Backend Sync**: Automatically sync with your YTClipper backend
- 💾 **Offline Support**: Timestamps saved locally and synced when online
- 🚀 **Hot Reload**: Development mode with instant reload

## Development

### Prerequisites

- Node.js 18+
- PNPM
- Chrome/Chromium browser

### Setup

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev:extension

# For Firefox development
pnpm dev:extension:firefox
```

### Loading the Extension

#### Chrome/Chromium:

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `apps/extension/dist` directory

#### Firefox:

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `apps/extension/dist/manifest.json`

### Build for Production

```bash
# Build for Chrome
pnpm build

# Build for Firefox
pnpm build:firefox
```

## Usage

### Basic Timestamp Collection

1. Navigate to any YouTube video
2. Press `Ctrl+Shift+T` at any moment to save a timestamp
3. Or click the extension icon and use the popup interface

### Advanced Features

- **Add Notes**: Click the extension icon and add detailed notes to timestamps
- **Tag Organization**: Use comma-separated tags for better organization
- **Jump to Timestamps**: Click on any timestamp marker to jump to that moment
- **Export Data**: Export your timestamps for backup or sharing

### Keyboard Shortcuts

- `Ctrl+Shift+T` - Save timestamp at current time
- Extension popup for detailed timestamp management

## Architecture

### Content Script (`src/content/index.ts`)
- Monitors YouTube video playback
- Adds timestamp markers to progress bar
- Handles keyboard shortcuts
- Communicates with background script

### Background Service Worker (`src/background/index.ts`)
- Manages extension lifecycle
- Handles data persistence
- Syncs with backend API
- Manages Chrome storage

### Popup Interface (`src/popup/`)
- React-based UI for timestamp management
- Add, edit, and organize timestamps
- Settings and sync controls

### Content UI (`src/content-ui/index.tsx`)
- Floating timestamp collection interface
- Injected into YouTube pages
- Quick capture and annotation

## API Integration

The extension integrates with the YTClipper backend API:

```typescript
// Default configuration
{
  apiEndpoint: 'http://localhost:8080/api/v1',
  autoSave: true,
  showNotifications: true
}
```

### Backend Endpoints Used

- `POST /api/v1/timestamps` - Save new timestamps
- `GET /api/v1/timestamps/:videoId` - Retrieve video timestamps
- `PUT /api/v1/timestamps/:id` - Update timestamp
- `DELETE /api/v1/timestamps/:id` - Delete timestamp

## Data Storage

### Local Storage Structure

```json
{
  "timestamps": {
    "videoId": [
      {
        "id": "unique_id",
        "timestamp": 120.5,
        "title": "Important moment",
        "note": "Key insight about...",
        "tags": ["research", "important"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Sync Storage (Settings)

```json
{
  "apiEndpoint": "http://localhost:8080/api/v1",
  "autoSave": true,
  "showNotifications": true
}
```

## Permissions

The extension requires the following permissions:

- `activeTab` - Access current YouTube tab
- `storage` - Save timestamps locally
- `scripting` - Inject content scripts
- `tabs` - Manage tab information

## Development Scripts

```bash
# Development with hot reload
pnpm dev

# Firefox development
pnpm dev:firefox

# Production build
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Testing
pnpm test
pnpm test:ui
```

## File Structure

```
apps/extension/
├── manifest.ts              # Extension manifest configuration
├── src/
│   ├── background/          # Background service worker
│   ├── content/             # Content script for YouTube
│   ├── content-ui/          # React UI injected into pages
│   ├── popup/               # Extension popup interface
│   └── shared/              # Shared utilities and types
├── packages/
│   └── dev-utils/           # Development utilities
├── public/                  # Static assets (icons, etc.)
├── _locales/               # Internationalization
└── dist/                   # Built extension (generated)
```

## Browser Compatibility

- ✅ Chrome 88+ (Manifest V3)
- ✅ Edge 88+
- ✅ Firefox 109+ (with manifest adaptations)

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Ensure linting passes
4. Test in both Chrome and Firefox
5. Update documentation

## License

MIT License - see the root project LICENSE file. 