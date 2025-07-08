# YTClipper Shared UI Setup

This project now includes a shared UI package (`@ytclipper/ui`) that provides consistent design components across all
applications (app, landing, extension).

## ✅ What's Been Set Up

### 1. Shared UI Package (`packages/ui`)

- Built with **shadcn/ui** and **Tailwind CSS**
- TypeScript support with proper types
- CSS custom properties for theming
- Dark mode ready
- Exports both ESM and CommonJS formats

### 2. Automated Component Management

- **`./add-component.sh`** - Add new shadcn/ui components
- **`./update-exports.sh`** - Automatically update exports

### 3. Cross-App Integration

All apps now depend on `@ytclipper/ui`:

- ✅ `apps/app` - React/Vite app
- ✅ `apps/landing` - Next.js app
- ✅ `apps/extension` - Chrome extension

## 🚀 Usage

### Adding New Components

```bash
# Add components to the shared package
./add-component.sh dialog input badge

# This will:
# 1. Add components using shadcn/ui CLI
# 2. Update exports automatically
# 3. Rebuild the package
```

### Using Components in Apps

**React/Vite App (`apps/app`):**

```tsx
import { Button, Card, CardHeader, CardContent } from '@ytclipper/ui';
import '@ytclipper/ui/styles';

function App() {
  return (
    <Card>
      <CardHeader>
        <h2>Title</h2>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

**Next.js App (`apps/landing`):**

```tsx
import { Button } from '@ytclipper/ui';
import '@ytclipper/ui/styles';

export default function Page() {
  return <Button>Landing Button</Button>;
}
```

**Chrome Extension (`apps/extension`):**

```tsx
import { Button } from '@ytclipper/ui';
// Styles imported in content script

function Popup() {
  return <Button>Extension Button</Button>;
}
```

## 📁 Project Structure

```
packages/ui/
├── src/
│   ├── components/          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   ├── styles.css           # Tailwind + design system
│   └── index.ts             # Main exports
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── tsup.config.ts           # Build configuration
└── components.json          # shadcn/ui configuration
```

## 🎨 Design System

The shared UI includes:

- **CSS Variables** for consistent theming
- **Dark mode** support via CSS classes
- **Responsive** design utilities
- **Accessible** components from Radix UI
- **Type-safe** props with TypeScript

## 🔧 Available Scripts

```bash
# Add new components
./add-component.sh button card input dialog

# Update exports after manual changes
./update-exports.sh

# Build UI package
cd packages/ui && pnpm build

# Watch for changes during development
cd packages/ui && pnpm dev
```

## 🌟 Benefits

1. **Consistency** - Same components across all apps
2. **Maintainability** - Single source of truth for UI
3. **Developer Experience** - TypeScript, hot reload, automated exports
4. **Performance** - Tree-shakable imports
5. **Scalability** - Easy to add new components

## 🔄 Development Workflow

1. **Add Component**: `./add-component.sh dialog`
2. **Use Component**: Import in any app
3. **Build**: Package builds automatically
4. **Deploy**: All apps use the same component version

The setup eliminates the need to configure shadcn/ui separately in each app and ensures design consistency across your
entire project!
