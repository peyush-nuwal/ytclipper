# @ytclipper/ui

Shared UI components for YTClipper applications built with shadcn/ui and Tailwind CSS.

## Installation

This package is automatically available in all workspace applications. Just import the components you need:

```tsx
import { Button, Card, CardHeader, CardContent, cn } from '@ytclipper/ui'
```

> **Note**: No need to import styles separately! The package works with your app's existing Tailwind CSS configuration.

## Usage

### In React Apps (app, landing, extension)

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, CardDescription } from '@ytclipper/ui'

function App() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Example Card</CardTitle>
        <CardDescription>This card uses the shared UI package</CardDescription>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </CardContent>
    </Card>
  )
}
```

## Adding New Components

Use the provided script to add new shadcn/ui components:

```bash
# From the project root
./add-component.sh button card input dialog
```

This will:
1. Add the components to the UI package using shadcn/ui CLI
2. Update exports automatically
3. Rebuild the package
4. Make them available for import across all apps

## Available Components

- `Button` - Primary UI button with variants (default, secondary, outline, destructive, ghost, link)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` - Card components
- `cn` - Utility function for merging CSS classes

## Component Variants

### Button
```tsx
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

{/* Sizes */}
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

## Development

```bash
# Build the package
cd packages/ui
pnpm build

# Watch for changes during development
pnpm dev
```

## Architecture

The package exports JavaScript components only and relies on each app's existing Tailwind CSS configuration for styling. This approach:

- ✅ Avoids CSS conflicts between apps
- ✅ Works with existing shadcn/ui setups
- ✅ Maintains consistency through shared component logic
- ✅ Allows for app-specific theming
