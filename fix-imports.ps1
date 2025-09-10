# PowerShell script to fix unused imports

# Remove unused imports
Write-Host "Fixing unused imports..."

# Fix StageInput.tsx
(Get-Content "src\components\kpi\StageInput.tsx") -replace "ChevronRight, ", "" | Set-Content "src\components\kpi\StageInput.tsx"

# Fix NumericInput.tsx - remove fieldKey from interface
(Get-Content "src\components\kpi\NumericInput.tsx") -replace "  fieldKey\?: string;", "" | Set-Content "src\components\kpi\NumericInput.tsx"

# Fix RubricInput.tsx - remove getScoreBgColor
$content = Get-Content "src\components\kpi\RubricInput.tsx" -Raw
$content = $content -replace "  const getScoreBgColor[^}]+\};[\r\n]+", ""
$content | Set-Content "src\components\kpi\RubricInput.tsx"

# Fix ActionPlan.tsx
(Get-Content "src\components\results\ActionPlan.tsx") -replace ", Zap, Users", "" | Set-Content "src\components\results\ActionPlan.tsx"
(Get-Content "src\components\results\ActionPlan.tsx") -replace ", TrendingUp", "" | Set-Content "src\components\results\ActionPlan.tsx"

# Fix AIAnalysis.tsx
(Get-Content "src\components\results\AIAnalysis.tsx") -replace ", getAxisTextColor", "" | Set-Content "src\components\results\AIAnalysis.tsx"

# Fix KPIManagement.tsx
(Get-Content "src\pages\admin\KPIManagement.tsx") -replace ", Filter", "" | Set-Content "src\pages\admin\KPIManagement.tsx"
(Get-Content "src\pages\admin\KPIManagement.tsx") -replace "import { Card, CardHeader, CardBody }", "import { Card, CardBody }" | Set-Content "src\pages\admin\KPIManagement.tsx"

# Fix Assessments.tsx
(Get-Content "src\pages\startup\Assessments.tsx") -replace "import { KPICard } from '../../components/common/KPICard';[\r\n]", "" | Set-Content "src\pages\startup\Assessments.tsx"

# Fix Dashboard.tsx
(Get-Content "src\pages\startup\Dashboard.tsx") -replace ", TrendingUp", "" | Set-Content "src\pages\startup\Dashboard.tsx"
(Get-Content "src\pages\startup\Dashboard.tsx") -replace ", Users", "" | Set-Content "src\pages\startup\Dashboard.tsx"

# Fix Results.tsx
(Get-Content "src\pages\startup\Results.tsx") -replace ", AlertCircle", "" | Set-Content "src\pages\startup\Results.tsx"
(Get-Content "src\pages\startup\Results.tsx") -replace "import { getAxisColor, getAxisBgColor, getAxisTextColor }", "import { getAxisBgColor }" | Set-Content "src\pages\startup\Results.tsx"

# Fix axisColors.tsx
(Get-Content "src\utils\axisColors.ts") -replace "import { AxisKey } from '../types';[\r\n]", "" | Set-Content "src\utils\axisColors.ts"

# Fix csvScoring.ts
(Get-Content "src\utils\csvScoring.ts") -replace "import type { RawValue, KPIDefinition, KPIResponse, AxisKey } from '../types';[\r\n]import type { StageRule } from './csvParser';", "import type { RawValue, KPIDefinition, KPIResponse, AxisKey } from '../types';" | Set-Content "src\utils\csvScoring.ts"

# Fix pdfExport.ts
(Get-Content "src\utils\pdfExport.ts") -replace "import type { AxisKey, KPIResponse }", "import type { AxisKey }" | Set-Content "src\utils\pdfExport.ts"

# Fix scoring.ts
(Get-Content "src\utils\scoring.ts") -replace "import type { KPIDefinition, KPIResponse, RawValue, AxisKey }", "import type { KPIResponse, RawValue, AxisKey }" | Set-Content "src\utils\scoring.ts"

Write-Host "Imports fixed!"