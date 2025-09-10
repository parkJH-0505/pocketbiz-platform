# PowerShell script to fix encoding issues
$files = @(
    "src\pages\startup\Assessments.tsx",
    "src\pages\startup\Results.tsx",
    "src\components\results\ActionPlan.tsx"
)

foreach ($file in $files) {
    Write-Host "Processing $file..."
    
    # Read file content
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Replace broken Korean characters in comments
    $content = $content -replace '// \?[^\n]*', '// '
    $content = $content -replace '/\* \?[^\*]* \*/', '/* */'
    
    # Fix specific broken patterns
    $content = $content -replace '// \?�동 \?�\?\?- 3초마\?\?', '// 자동 저장 - 3초마다'
    $content = $content -replace '// CSV \?�일 변\?�\? 감시 \?�정', '// CSV 파일 변경 감시 설정'
    $content = $content -replace '// \?�체 진행\?�\?', '// 전체 진행률'
    $content = $content -replace '// KPI \?�이\?� 로드', '// KPI 데이터 로드'
    $content = $content -replace '\?�선\?�위 \?�션 \?�랜', '우선순위 액션 플랜'
    
    # Save with UTF8 encoding without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Get-Item $file).FullName, $content, $utf8NoBom)
    
    Write-Host "Fixed $file"
}

Write-Host "Encoding fixes complete!"