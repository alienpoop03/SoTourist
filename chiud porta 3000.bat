@echo off
echo 🔒 Rimozione regola firewall per Express porta 3000...
netsh advfirewall firewall delete rule name="Express 3000"
echo ✅ Porta 3000 bloccata nuovamente. Premi un tasto per uscire.
pause