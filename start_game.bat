@echo off
chcp 65001 >nul
title Vocaloid Survival 3D - Launcher & Auto Music Watcher
cd /d "%~dp0"

call "%~dp0sync_music.bat"
start "" "play.html"
call "%~dp0scan_music.bat"
