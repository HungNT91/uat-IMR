@echo off
echo ========================================
echo   LONG CHAU - KHO TONG LOCAL SERVER
echo ========================================
echo.
echo Dang khoi dong server...
echo.

cd /d "%~dp0"

echo Server dang chay tai: http://localhost:8000
echo Mo trinh duyet va vao: http://localhost:8000
echo.
echo Nhan Ctrl+C de dung server
echo ========================================
echo.

python -m http.server 8000

pause
