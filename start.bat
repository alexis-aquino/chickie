@echo off
setlocal enabledelayedexpansion
cd /d %~dp0

echo ================================================
echo   Chickie (pure Python + MySQL / Streamlit)
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
"%MYSQL_BIN%" -u root chickie < schema.sql 2>nul

rem --- 3. Python virtual environment ---
if not exist .venv (
    echo Creating Python virtual environment...
    python -m venv .venv
    .venv\Scripts\python -m pip install -q --upgrade pip
    .venv\Scripts\python -m pip install -q -r requirements.txt
)

rem --- 4. .env (only created if missing) ---
if not exist .env (
    echo Creating .env with local defaults...
    echo DATABASE_URL=mysql+pymysql://root:@localhost:3306/chickie> .env
    echo   NOTE: assumed XAMPP's default blank root password. If your MySQL
    echo   root user has a password, edit .env and re-run.
)

rem --- 5. Launch Streamlit ---
echo Starting Chickie on http://localhost:8501 ...
start "Chickie" cmd /k "cd /d %~dp0 && .venv\Scripts\python -m streamlit run main.py"

%SystemRoot%\System32\timeout.exe /t 5 /nobreak >nul
explorer.exe "http://localhost:8501"

endlocal
