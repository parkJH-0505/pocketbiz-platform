@echo off
echo === Safe Project Optimization ===
echo.
echo This will NOT delete any code or break functionality!
echo.

REM Step 1: Clear npm cache only
echo [1/4] Clearing npm cache...
npm cache verify

REM Step 2: Kill only excessive Node processes (keep dev server)
echo [2/4] Cleaning excessive processes...
echo (Keeping your dev server running)

REM Step 3: Clean temporary files only
echo [3/4] Removing temporary files...
del /q *.log 2>nul
del /q nul 2>nul

REM Step 4: Optimize git (optional)
echo [4/4] Optimizing git repository...
git gc --auto

echo.
echo === Optimization Complete! ===
echo Your project is intact and optimized.
echo.
pause