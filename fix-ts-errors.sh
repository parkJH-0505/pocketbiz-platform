#!/bin/bash

# Fix type imports
echo "Fixing type imports..."

# Fix Button.tsx
sed -i "s/import { ButtonHTMLAttributes, ReactNode } from 'react'/import type { ButtonHTMLAttributes, ReactNode } from 'react'/" src/components/common/Button.tsx
sed -i "s/import { theme } from '..\/..\/lib\/theme'//" src/components/common/Button.tsx

# Fix Card.tsx
sed -i "s/import { HTMLAttributes, ReactNode } from 'react'/import type { HTMLAttributes, ReactNode } from 'react'/" src/components/common/Card.tsx

# Fix Navigation.tsx
sed -i "s/import { ReactNode } from 'react'/import type { ReactNode } from 'react'/" src/components/common/Navigation.tsx

# Remove unused imports
echo "Removing unused imports..."

# Fix CSVKPICard.tsx
sed -i "s/, Upload//g" src/components/common/CSVKPICard.tsx
sed -i "s/, X//g" src/components/common/CSVKPICard.tsx

# Fix other unused imports
sed -i "s/, useEffect//g" src/components/kpi/CalculationInput.tsx
sed -i "s/, Check//g" src/components/kpi/MultiSelectInput.tsx
sed -i "s/ChevronRight, //g" src/components/kpi/StageInput.tsx

echo "TypeScript errors fixed!"