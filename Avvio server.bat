@echo off
setlocal enabledelayedexpansion

:: Trova l'IP locale del computer (IPv4 della rete attiva)
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /C:"IPv4"') do (
    set ip=%%A
    set ip=!ip:~1!
    set ip=!ip: =!
)

echo IP locale rilevato: %ip%

:: ⬇️ Scrivilo in un file che può essere letto dal backend/frontend
echo export const API_BASE_URL = "http://%ip%:3000"; > SoTourist\Front-End\src\app\services\ip.config.ts

:: Apri Visual Studio Code
start cmd /c "cd /d .\SoTourist && start code ."

:: Avvia il frontend con host esplicito (non localhost)
start cmd /k "cd /d .\SoTourist\Front-End && ionic serve --host=!ip!" --no-open

start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" http://%ip%:8100

:: Avvia il backend
start cmd /k "cd /d .\SoTourist\Back-End && set IP=%ip% && node index.js"