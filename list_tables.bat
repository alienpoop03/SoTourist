@echo off
REM Naviga nella cartella che contiene sqlite3.exe
cd /d "C:\Users\gabri\sqlite"

REM Esegue il comando .tables sul database
sqlite3.exe "C:\Users\gabri\GitHub\SoTourist\Back-End\db\database.db" ".tables"

pause
