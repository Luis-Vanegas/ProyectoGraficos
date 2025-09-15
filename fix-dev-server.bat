@echo off
echo Limpiando cache y reiniciando servidor de desarrollo...

echo.
echo 1. Deteniendo procesos en puertos 5173 y 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /f /pid %%a 2>nul

echo.
echo 2. Limpiando cache de node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 3. Limpiando cache de Vite...
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist

echo.
echo 4. Reinstalando dependencias...
npm install

echo.
echo 5. Iniciando servidor backend...
start "Backend Server" cmd /k "cd server && npm start"

echo.
echo 6. Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak >nul

echo.
echo 7. Iniciando servidor frontend...
npm run dev

echo.
echo Servidor reiniciado correctamente!
echo Abre tu navegador en: http://localhost:5173
pause
