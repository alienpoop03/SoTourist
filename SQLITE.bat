@echo off
REM Cambia la directory per entrare nella cartella 'Back-End\db' del progetto
cd /d "%~dp0\SoTourist\Back-End\db"

REM Avvia sqlite3 in modalità interattiva con il database
.\sqlite3.exe database.db

REM Non chiudere la finestra
pause
