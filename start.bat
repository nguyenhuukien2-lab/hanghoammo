@echo off
echo ========================================
echo   HANGHOAMMO - E-COMMERCE SYSTEM
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js chua duoc cai dat!
    echo.
    echo Vui long cai dat Node.js tu: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js da duoc cai dat
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Dang cai dat dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Cai dat dependencies that bai!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Cai dat dependencies thanh cong!
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] File .env khong ton tai!
    echo Vui long tao file .env voi noi dung:
    echo.
    echo PORT=3000
    echo MONGODB_URI=mongodb://localhost:27017/HANGHOAMMO
    echo JWT_SECRET=your_secret_key_here
    echo JWT_EXPIRE=7d
    echo NODE_ENV=development
    echo.
    pause
)

echo ========================================
echo   DANG KHOI DONG SERVER...
echo ========================================
echo.
echo Trang chu: http://localhost:3000
echo Trang san pham: http://localhost:3000/products
echo Trang admin: http://localhost:3000/admin
echo.
echo Nhan Ctrl+C de dung server
echo ========================================
echo.

npm run dev