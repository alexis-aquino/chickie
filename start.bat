@echo off
setlocal enabledelayedexpansion
cd /d %~dp0

echo ================================================
echo   Chickie - starting local dev stack
echo ================================================

set XAMPP_DIR=C:\xampp
set MYSQL_BIN=%XAMPP_DIR%\mysql\bin\mysql.exe

rem --- 1. Start MySQL (XAMPP) if it isn't already listening on 3306 ---
netstat -an | findstr ":3306" >nul
if errorlevel 1 (
    if not exist "%XAMPP_DIR%\mysql_start.bat" (
        echo Could not find XAMPP at %XAMPP_DIR%.
        echo Start your MySQL server manually, then re-run this script.
        pause
        exit /b 1
    )
    echo Starting MySQL via XAMPP...
    start "Chickie MySQL" "%XAMPP_DIR%\mysql_start.bat"

    set MYSQL_WAIT=0
    :waitmysql
    %SystemRoot%\System32\timeout.exe /t 1 /nobreak >nul
    netstat -an | findstr ":3306" >nul
    if errorlevel 1 (
        set /a MYSQL_WAIT+=1
        if !MYSQL_WAIT! GEQ 30 (
            echo MySQL did not come up after 30s - check the "Chickie MySQL" window.
            pause
            exit /b 1
        )
        goto waitmysql
    )
    echo MySQL is up.
) else (
    echo MySQL already running.
)

rem --- 2. Ensure the database and schema exist (safe to re-run) ---
echo Ensuring "chickie" database and schema exist...
"%MYSQL_BIN%" -u root -e "CREATE DATABASE IF NOT EXISTS chickie" 2>nul
"%MYSQL_BIN%" -u root chickie < server\schema.sql 2>nul

rem --- 3. Backend virtual environment ---
if not exist server\.venv (
    echo Creating Python virtual environment for the backend...
    python -m venv server\.venv
    server\.venv\Scripts\python -m pip install -q --upgrade pip
    server\.venv\Scripts\python -m pip install -q -r server\requirements.txt
)

rem --- 4. server\.env (only created if missing - won't clobber your secret) ---
if not exist server\.env (
    echo Creating server\.env with local defaults...
    for /f %%s in ('server\.venv\Scripts\python -c "import secrets; print(secrets.token_hex(32))"') do set AUTH_SECRET=%%s
    (
        echo DATABASE_URL=mysql+pymysql://root:@localhost:3306/chickie
        echo AUTH_SECRET=!AUTH_SECRET!
        echo CORS_ORIGIN=http://localhost:5173
    ) > server\.env
    echo   NOTE: assumed XAMPP's default blank root password. If your MySQL
    echo   root user has a password, edit server\.env and re-run.
)

rem --- 5. Frontend dependencies ---
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

rem --- 6. .env.local (only created if missing) ---
if not exist .env.local (
    echo VITE_API_BASE_URL=http://localhost:8000> .env.local
)

rem --- 7. Launch backend + frontend, each in their own window ---
echo Starting backend (FastAPI) on http://localhost:8000 ...
start "Chickie Backend" cmd /k "cd /d %~dp0server && .venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

echo Starting frontend (Vite) on http://localhost:5173 ...
start "Chickie Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo All set. Backend: http://localhost:8000  Frontend: http://localhost:5173
echo Close the "Chickie MySQL" / "Chickie Backend" / "Chickie Frontend" windows to stop each service.
echo.

%SystemRoot%\System32\timeout.exe /t 5 /nobreak >nul
explorer.exe "http://localhost:5173"

endlocal
