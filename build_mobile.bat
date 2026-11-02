@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   VOCALOID SURVIVAL 3D — СБОРКА МОБИЛЬНОЙ ВЕРСИИ (.HTML)
echo   (Сжатие всех картинок + мобильный UI, без папки music)
echo ========================================================
echo.

python build_mobile.py

echo.
if %ERRORLEVEL% EQU 0 (
    echo [ОК] Файл Vocaloid_Survival_Mobile.html успешно создан!
    echo Теперь его можно перекинуть на телефон и открыть в любом браузере.
) else (
    echo [ОШИБКА] Для сжатия картинок и сборки требуется установленный Python 3 (желательно с библиотекой Pillow: pip install pillow).
)
echo.
pause
