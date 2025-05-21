::cmd /c "cd /d .\SoTourist\Front-End && ionic build && npx cap sync &&  npx cap open android"

@echo off
setlocal enabledelayedexpansion

:: 🔍 Trova l'IP locale
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    set ip=%%a
)

:: ✂️ Rimuove eventuali spazi all'inizio
set ip=%ip:~1%
echo 🌐 IP locale trovato: %ip%

:: ✏️ Sovrascrive ip.config.ts con l'IP aggiornato
echo export const API_BASE_URL = 'http://%ip%:3000'; > ".\SoTourist\Front-End\src\app\services\ip.config.ts"
echo 📄 ip.config.ts aggiornato con IP %ip%

:: ▶️ Builda e apre Android Studio
cd /d .\SoTourist\Front-End
call ionic build
call npx cap sync
call npx cap open android
