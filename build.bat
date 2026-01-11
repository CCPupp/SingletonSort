@echo off

echo ================================
echo Singleton Sort - Build Script
echo ================================
echo.

REM Build Angular app
echo Step 1: Building Angular application...
cd SingletonSort
call npm run build
cd ..
echo Angular build complete
echo.

REM Download Go dependencies
echo Step 2: Downloading Go dependencies...
go mod download
echo Go dependencies downloaded
echo.

REM Build Go executable
echo Step 3: Building Go executable...
go build -ldflags="-s -w" -o singleton-sort.exe
echo Go executable built
echo.

echo ================================
echo Build complete!
echo ================================
echo.
echo To run the application:
echo   singleton-sort.exe
echo.
echo The app will start on http://localhost:8989
echo and automatically open in your browser.
echo.
pause
