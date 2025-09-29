@echo off
echo Iniciando servidor en segundo plano...
start /B node server/index.js

echo Esperando 3 segundos para que el servidor inicie...
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo Probando endpoint /api/status
echo ========================================
curl -s http://localhost:3001/api/status

echo.
echo.
echo ========================================
echo Probando endpoint /api/sample-data
echo ========================================
curl -s http://localhost:3001/api/sample-data

echo.
echo.
echo ========================================
echo Probando endpoint /api/test-connection
echo ========================================
curl -s http://localhost:3001/api/test-connection

echo.
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul

echo Cerrando servidor...
taskkill /F /IM node.exe > nul 2>&1

