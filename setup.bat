@echo off
cd /d "%~dp0"
echo Installing project dependencies...
npm install

echo.
echo Creating environment file if missing...
if not exist .env (
    copy .env.example .env
)

echo.
echo Setup complete.
echo Run the project with:
echo npm run dev
pause
