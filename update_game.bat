@echo off
chcp 65001 >nul
title Vocaloid Survival 3D - Update Game (git pull + sync music)
cd /d "%~dp0"

echo ========================================================
echo   VOCALOID SURVIVAL 3D - GIT PULL AND MUSIC SYNC
echo ========================================================

git pull
call "%~dp0sync_music.bat"

echo.
echo [OK] Update and music playlist sync completed!
pause
