#!/bin/bash

# Script to add shadcn/ui components to the shared UI package
# Usage: ./add-component.sh button card input

if [ $# -eq 0 ]; then
    echo "Usage: $0 <component1> [component2] [component3] ..."
    echo "Example: $0 button card input"
    exit 1
fi

cd packages/ui

echo "Adding components to @ytclipper/ui: $@"

for component in "$@"; do
    echo "Adding $component..."
    pnpm dlx shadcn@latest add "$component" --yes
done

echo "Updating exports..."
cd ../..
./update-exports.sh

echo "Components added successfully!"
echo "You can now import them in your apps like:"
echo "import { Button, Card, Input } from '@ytclipper/ui'"
