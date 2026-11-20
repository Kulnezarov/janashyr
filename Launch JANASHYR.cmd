@echo off
setlocal
pushd "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 LTS or later, then start this file again.
  pause
  popd
  exit /b 1
)
node.exe "%~dp0scripts\launch-preview.mjs"
set "JANASHYR_EXIT=%ERRORLEVEL%"
if not "%JANASHYR_EXIT%"=="0" pause
popd
exit /b %JANASHYR_EXIT%
