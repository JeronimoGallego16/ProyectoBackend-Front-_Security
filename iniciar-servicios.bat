@echo off
if /i "%~1"=="__PERSISTENT_WINDOW" goto run
start "Iniciar servicios" "%ComSpec%" /k ""%~f0" __PERSISTENT_WINDOW"
exit /b

:run
shift
setlocal

set "PROJECT_ROOT=%~dp0.."
set "FRONTEND_DIR=%~dp0"
set "SECURITY_DIR=%PROJECT_ROOT%\backEndProyecto1"
set "NOTIFICATIONS_DIR=%PROJECT_ROOT%\Backend_ms_notificaciones"
set "NOTIFICATION_SERVICE_TOKEN_FILE=%NOTIFICATIONS_DIR%\.notification-service-token"
set "SERVICE_TOKEN="
set "NOTIFICATION_SERVICE_TOKEN="
set "FIREBASE_ENABLED=true"
set "FIREBASE_PROJECT_ID=oauthbackend-28668"
set "FIREBASE_CREDENTIALS_PATH=%PROJECT_ROOT%\firebase-credentials.json"
set "FIREBASE_CHECK_REVOKED=true"

if not exist "%SECURITY_DIR%\mvnw.cmd" (
    echo No se encontro el backend Spring Boot en "%SECURITY_DIR%".
    pause
    exit /b 1
)

if not exist "%NOTIFICATIONS_DIR%\main.py" (
    echo No se encontro el microservicio de notificaciones en "%NOTIFICATIONS_DIR%".
    pause
    exit /b 1
)

if not exist "%FIREBASE_CREDENTIALS_PATH%" (
    echo No se encontraron las credenciales de Firebase en:
    echo "%FIREBASE_CREDENTIALS_PATH%"
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%package.json" (
    echo No se encontro package.json en "%FRONTEND_DIR%".
    pause
    exit /b 1
)

where java >nul 2>&1
if errorlevel 1 (
    echo Java no esta instalado o no esta disponible en PATH.
    pause
    exit /b 1
)

set "PYTHON_EXE=%NOTIFICATIONS_DIR%\.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    echo No se encontro el entorno virtual del microservicio en:
    echo "%NOTIFICATIONS_DIR%\.venv"
    echo Crealo e instala sus dependencias con:
    echo py -3.13 -m venv "%NOTIFICATIONS_DIR%\.venv"
    echo "%NOTIFICATIONS_DIR%\.venv\Scripts\python.exe" -m pip install -r "%NOTIFICATIONS_DIR%\requirements.txt"
    pause
    exit /b 1
)

"%PYTHON_EXE%" -c "import fastapi, googleapiclient, google_auth_oauthlib, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Faltan dependencias de Python para el microservicio.
    echo Ejecuta: "%PYTHON_EXE%" -m pip install -r "%NOTIFICATIONS_DIR%\requirements.txt"
    pause
    exit /b 1
)

if not defined GMAIL_SENDER (
    set /p "GMAIL_SENDER=Ingresa el correo Gmail autorizado para enviar notificaciones: "
)
if not defined GMAIL_SENDER (
    echo Se requiere GMAIL_SENDER para enviar correos.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo npm no esta instalado o no esta disponible en PATH.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(8000, 8181); foreach ($port in $ports) { if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { Write-Output ('Puerto ocupado: ' + $port); exit 1 } }"
if errorlevel 1 (
    echo Deten los servicios que ya esten usando los puertos 8000 o 8181 y vuelve a ejecutar este BAT.
    pause
    exit /b 1
)

echo Iniciando los tres servicios en ventanas independientes...

echo Iniciando primero el microservicio de notificaciones...
start "Microservicio de notificaciones - FastAPI" /D "%NOTIFICATIONS_DIR%" cmd /k ""%PYTHON_EXE%" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo Esperando a que FastAPI cree el secreto compartido y responda...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i = 0; $i -lt 30; $i++) { try { $null = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 2; $ready = $true; break } catch { Start-Sleep -Seconds 1 } }; if (-not $ready) { exit 1 }"
if errorlevel 1 (
    echo FastAPI no respondio en http://127.0.0.1:8000.
    echo Revisa la ventana del microservicio antes de continuar.
    pause
    exit /b 1
)

echo FastAPI esta listo. Iniciando backend de seguridad y frontend...
start "Backend de seguridad - Spring Boot" /D "%SECURITY_DIR%" cmd /k "call mvnw.cmd spring-boot:run"
start "Frontend - Angular" /D "%FRONTEND_DIR%" cmd /k "npm start"

echo.
echo Frontend:             http://localhost:4200
echo Backend de seguridad: http://localhost:8181
echo Notificaciones:       http://localhost:8000
echo.
echo Cierra cada ventana de servicio para detenerlo.
echo El inicio de los servicios finalizo.
pause
endlocal
