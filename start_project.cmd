@echo off
REM === Переход в корень проекта ===
cd /d "%~dp0"

REM === Настройка путей ===
set "FRONTEND_DIR=frontend"
set "BACKEND_DIR=backend"
set "PYTHON_VENV=%~dp0.venv\Scripts\activate.bat"
set "NODE18_DIR=C:\Program Files\nodejs-18\node-v18.20.8-win-x64"

if not exist "%~dp0backend\.venv" (
    echo [INFO] Создаю виртуальное окружение...
    python -m venv "%~dp0backend\.venv"
)

REM === Активация Python-окружения ===
call "%PYTHON_VENV%"

REM === Запуск backend ===
cd /d "%BACKEND_DIR%"
if not exist requirements.txt (
    echo [WARNING] requirements.txt не найден
) else (
    pip install -r requirements.txt
)

start cmd /k "python -m uvicorn server:app --reload"

REM === Очистка frontend-зависимостей ===
cd /d "%~dp0%FRONTEND_DIR%"
if exist node_modules (
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)

REM === Установка зависимостей через Node.js v18 ===
if not exist "%NODE18_DIR%\npm.cmd" (
    echo [ERROR] npm не найден по пути: %NODE18_DIR%
    pause
    exit /b 1
)

call "%NODE18_DIR%\npm.cmd" install --legacy-peer-deps

REM === Запуск frontend через craco ===
if exist node_modules\.bin\craco (
    call "%NODE18_DIR%\node.exe" node_modules\.bin\craco start
) else (
    echo [ERROR] craco не установлен. Попробуй: npm install @craco/craco --save-dev
    pause
    exit /b 1
)

pause

