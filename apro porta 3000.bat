@echo off
echo 🔓 Sblocco porta 3000 TCP per Express.js...
netsh advfirewall firewall add rule name="Express 3000" dir=in action=allow protocol=TCP localport=3000
echo ✅ Porta 3000 abilitata in entrata. Premi un tasto per chiudere.
pause
