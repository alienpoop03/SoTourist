 @echo off
start cmd /c "cd /d .\SoTourist && start code ."
start cmd /k "cd /d .\SoTourist\Front-End && ionic serve"
start cmd /k "cd /d .\SoTourist\Back-End && node index.js"
