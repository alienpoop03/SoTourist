@echo off
REM Vai nella cartella di sqlite3.exe
cd /d "C:\Users\gabri\sqlite"

REM Esegui il comando .tables e poi resta nella shell
cmd /k sqlite3.exe "C:\Users\gabri\GitHub\SoTourist\Back-End\db\database.db" ".tables"
