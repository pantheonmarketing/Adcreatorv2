@echo off
echo Pushing updates to GitHub...
git add .
git commit -m "Auto-update: %date% %time%"
git push origin main
echo Updates pushed successfully!
pause