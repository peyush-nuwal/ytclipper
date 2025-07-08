#!/bin/bash

# Script to automatically update the index.ts file after adding components
# This scans all component files and adds their exports to index.ts

cd "$(dirname "$0")/packages/ui"

echo "Updating index.ts exports..."

# Start with the base content
cat > src/index.ts << 'EOF'
// Export components
export { Button, buttonVariants } from "./components/button"
EOF

# Find all component files except button.tsx and add their exports
for file in src/components/*.tsx; do
    if [[ "$file" != *"button.tsx"* && -f "$file" ]]; then
        component_name=$(basename "$file" .tsx)
        echo "Found component: $component_name"
        
        # Extract exports from the file
        exports=$(grep -o "export.*{[^}]*}" "$file" | sed 's/export.*{\([^}]*\)}.*/\1/' | tr -d '\n' | sed 's/,$//')
        
        if [[ -n "$exports" ]]; then
            echo "export {" >> src/index.ts
            echo "  $exports" >> src/index.ts
            echo "} from \"./components/$component_name\"" >> src/index.ts
        fi
    fi
done

# Add utilities and types
cat >> src/index.ts << 'EOF'

// Export utilities
export { cn } from "./lib/utils"

// Export types
export type { ButtonProps } from "./components/button"
EOF

echo "Updated index.ts successfully!"

# Rebuild the package
echo "Building package..."
pnpm build
