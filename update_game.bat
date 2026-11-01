@echo off
chcp 65001 >nul
title Vocaloid Survival 3D — Обновление игры (Git)
echo ===============================================================
echo   VOCALOID SURVIVAL 3D — АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ИЗ GITHUB
echo   Репозиторий: https://github.com/NoLegalCats/Vocaloid-Survival
echo ===============================================================
echo.

cd /d "%~dp0"

where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist ".git" (
        echo [1/2] Найдена локальная Git-папка. Загружаем свежие обновления...
        git fetch --all
        git reset --hard origin/main 2>nul || git reset --hard origin/master 2>nul || git pull
    ) else (
        echo [1/2] Инициализация Git-репозитория и загрузка файлов...
        git init
        git remote add origin https://github.com/NoLegalCats/Vocaloid-Survival.git 2>nul
        git remote set-url origin https://github.com/NoLegalCats/Vocaloid-Survival.git
        git fetch --all
        git checkout -f -B main origin/main 2>nul || git checkout -f -B master origin/master
    )
    echo.
    echo [2/2] Игра успешно обновлена через Git!
) else (
    echo [!] Git не установлен. Скачиваем обновление напрямую с GitHub через PowerShell...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$url = 'https://github.com/NoLegalCats/Vocaloid-Survival/archive/refs/heads/main.zip'; " ^
      "$zip = Join-Path $PWD '_update_tmp.zip'; " ^
      "$ext = Join-Path $PWD '_update_tmp_dir'; " ^
      "Invoke-WebRequest -Uri $url -OutFile $zip; " ^
      "if (Test-Path $ext) { Remove-Item $ext -Recurse -Force }; " ^
      "Expand-Archive -Path $zip -DestinationPath $ext -Force; " ^
      "$inner = Get-ChildItem -Path $ext | Select-Object -First 1; " ^
      "Copy-Item -Path (Join-Path $inner.FullName '*') -Destination $PWD -Recurse -Force; " ^
      "Remove-Item $zip -Force; Remove-Item $ext -Recurse -Force;"
    echo.
    echo [2/2] Игра успешно обновлена из архива GitHub!
)

echo.
echo Готово! Можете запускать index.html.
pause
