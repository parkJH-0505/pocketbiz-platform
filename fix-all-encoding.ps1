# PowerShell script to fix Korean text encoding in all source files
$sourceDir = "src"

# Get all TypeScript and TypeScript React files
$files = Get-ChildItem -Path $sourceDir -Recurse -Include *.ts,*.tsx | Where-Object { !$_.FullName.Contains('.bak') }

Write-Host "Found $($files.Count) files to check and fix"

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content as UTF-8
    $content = Get-Content -Path $file.FullName -Encoding UTF8 -Raw
    
    if ($content -match '\?[�\ufffd]') {
        Write-Host "  - Found broken Korean text, fixing..." -ForegroundColor Yellow
        
        # Common Korean text replacements
        $replacements = @{
            # Comments and descriptions
            '가중치 �\?변\?\?' = '가중치 값 변환'
            'KPI�\?\?�규\?\?\?�수 계산' = 'KPI별 정규화 점수 계산'
            'KPI�\?\?�수 \?�규\?\?로직' = 'KPI별 점수 정규화 로직'
            '\?�장 규모' = '시장 규모'
            '�\?가\?�자 \?\?' = '총 가입자 수'
            '\?�간 반복 \?�익' = '월간 반복 수익'
            '5000만원 \?�상' = '5000만원 이상'
            '고객 \?�득 비용' = '고객 획득 비용'
            '\?\?��\?�록 좋음' = '낮을수록 좋음'
            '\?�비\?\?가\?�성' = '서비스 확장성'
            '\?�적 \?�자�\?' = '누적 투자금'
            '10\?\?\?�상' = '10억 이상'
            '\?�웨\?\?' = '런웨이'
            '\?� 규모' = '팀 규모'
            '축별 \?�수 계산' = '축별 점수 계산'
            '\?�체 \?�수 계산' = '전체 점수 계산'
            '기여\?\?\?�으�\?\?�렬' = '기여도 순으로 정렬'
            
            # PDF Export related
            'PDF \?�보\?�기 \?�수 \(\?�제 구현\?� jsPDF \?�의 \?�이브러�\?\?�용\)' = 'PDF 내보내기 함수 (실제 구현은 jsPDF 등의 라이브러리 사용)'
            '\?�기\?�는 Mock 구현' = '여기서는 Mock 구현'
            '\?�제로는 jsPDF\?\?puppeteer�\?\?�용\?�여 PDF \?�성' = '실제로는 jsPDF나 puppeteer를 사용하여 PDF 생성'
            '\.\.\.? PDF \?�성 로직' = '... PDF 생성 로직'
            '리포\?\?HTML \?�성 \(PDF 변\?�용\)' = '리포트 HTML 생성 (PDF 변환용)'
            '\?�켓비즈 \?��\? 리포\?\?' = '로켓비즈 진단 리포트'
            '\?��\?' = '헤더'
            '\?��\?\?�업 \?�장 진단 리포\?\?' = '스타트업 성장 진단 리포트'
            '종합 \?�수' = '종합 점수'
            '종합 \?��\? 결과' = '종합 평가 결과'
            '축별 \?�수' = '축별 점수'
            '축별 \?��\? \?�수' = '축별 평가 점수'
            '주요 \?�사\?�트' = '주요 인사이트'
            '주요 분석 \?�사\?�트' = '주요 분석 인사이트'
            '\?�선\?�위 \?�션' = '우선순위 액션'
            
            # CSV Scoring
            'CSV 기반 \?�규\?\?\?�수 계산' = 'CSV 기반 정규화 점수 계산'
            'Rubric/MultiSelect \?�\?\?' = 'Rubric/MultiSelect 타입'
            'MultiSelect \?�\?\?' = 'MultiSelect 타입'
            'weight�\?\?�수�\?\?�용' = 'weight를 점수로 사용'
            '최�\? 15\?�을 100\?�으�\?\?�규\?\?' = '최대 15점을 100점으로 정규화'
            'Rubric \?�\?\?' = 'Rubric 타입'
            'score�\?직접 \?�용' = 'score를 직접 사용'
            'Numeric \?�\?\?' = 'Numeric 타입'
            'minMax 기반 \?�형 보간' = 'minMax 기반 선형 보간'
            '\?�형 보간' = '선형 보간'
            'Calculation \?�\?\?' = 'Calculation 타입'
            '계산\?\?결과�\?percentage�\?처리' = '계산된 결과를 percentage로 처리'
            'CSV 기반 축별 \?�수 계산' = 'CSV 기반 축별 점수 계산'
            '해당 축과 \?�계\?\?\?�당\?�는 KPI \?�터�\?' = '해당 축과 관계된 해당하는 KPI 필터링'
            '\?�계�\?규칙 가\?�오�\?' = '단계별 규칙 가져오기'
            '종합 \?�수 계산' = '종합 점수 계산'
            '최고 기여 KPI 찾기' = '최고 기여 KPI 찾기'
            '가중치 \* \?�수 기�\?\?�로 \?�렬' = '가중치 * 점수 기준으로 정렬'
            'Calculation \?�\?\?KPI\?\?�\?계산' = 'Calculation 타입 KPI값 계산'
            '공식\?�서 변\?\?추출' = '공식에서 변수 추출'
            '중괄\?\?\?�거' = '중괄호 제거'
            '\?�당 \?�드�\?가�\?KPI \?�답 찾기' = '해당 필드에 가진 KPI 응답 찾기'
            '\?�요\?\?값이 \?�으�\?계산 불�\?' = '필요한 값이 없으면 계산 불가'
            '\?�전\?\?\?�식 계산' = '안전한 수식 계산'
            
            # Component texts
            '\?�효\?\?\?�자�\?\?�력\?�세\?\?' = '유효한 숫자를 입력하세요'
            '\?�수 �\?' = '우수 개'
            '보통 �\?' = '보통 개'
            '개선 �\?' = '개선 중'
            '\?�정\?\?' = '안정적'
            '\?�락 �\?' = '하락 중'
            '\?\ufffd\ufffd\? \?\ufffd\ud5a5\?\?' = '높은 영향'
            'KPI 관�\?' = 'KPI 관리'
            '\?��\? 지\?��\? 관리하�\?\?�정\?\?\?\?\?�습\?�다\.' = '핵심 지표를 관리하고 설정할 수 있습니다.'
            '\?\?KPI 추�\?' = '새 KPI 추가'
            '\?\ufffd\?\ufffd\ubcf4\?\?' = '대시보드'
            '\?\ufffd\ufffd\?\?\ufffd\uc5c5 \?\ufffd\ufffd\? \?\ufffd\ud669\?\?\?\ufffd\ub208\?\?\?\ufffd\uc778\?\ufffd\uc138\?\?' = '스타트업 성장 현황을 한눈에 확인하세요'
            '진단 \?\ufffd\ub8cc\?\?' = '진단 완료율'
            '\?�요 리소\?\?' = '필요 리소스'
            '\?�점' = '약점'
            '\?�️ 개선 \?�요' = '⚠️ 개선 필요'
            '개선 \?�요' = '개선 필요'
            
            # Stage input
            '가중치 \?�시' = '가중치 표시'
        }
        
        foreach ($pattern in $replacements.Keys) {
            $content = $content -replace [regex]::Escape($pattern), $replacements[$pattern]
        }
        
        # Save the fixed content
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  - Fixed and saved" -ForegroundColor Green
    } else {
        Write-Host "  - No broken Korean text found" -ForegroundColor Gray
    }
}

Write-Host "`nAll files processed!" -ForegroundColor Green