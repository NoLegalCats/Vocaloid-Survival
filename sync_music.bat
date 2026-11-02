@echo off
chcp 65001 >nul
title Vocaloid Survival 3D - Sync Music (playlist.json / playlist.txt / playlist.js)
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; " ^
  "$q = [char]34; $nl = [Environment]::NewLine; $utf8 = New-Object System.Text.UTF8Encoding($false); " ^
  "$musicDir = if (Test-Path -LiteralPath 'music') { (Get-Item -LiteralPath 'music').FullName } elseif ((Split-Path -Leaf $PWD.Path) -ieq 'music') { $PWD.Path } else { (New-Item -ItemType Directory -Path 'music').FullName }; " ^
  "$exts = @('.mp3','.wav','.ogg','.oga','.opus','.flac','.m4a','.aac','.mp4','.webm','.weba','.wma','.mka','.ape','.wv'); " ^
  "$txtPath = [System.IO.Path]::Combine($musicDir, 'playlist.txt'); " ^
  "$jsonPath = [System.IO.Path]::Combine($musicDir, 'playlist.json'); " ^
  "$jsPath = [System.IO.Path]::Combine($musicDir, 'playlist.js'); " ^
  "$prev = @(); if ([System.IO.File]::Exists($txtPath)) { $prev = @([System.IO.File]::ReadAllLines($txtPath, $utf8) | Where-Object { $_.Trim() -ne '' }) }; " ^
  "$allPaths = [System.IO.Directory]::GetFiles($musicDir); " ^
  "$files = @($allPaths | ForEach-Object { [System.IO.Path]::GetFileName($_) } | Where-Object { $exts -contains ([System.IO.Path]::GetExtension($_).ToLowerInvariant()) } | Sort-Object); " ^
  "foreach ($f in $files) { if ($prev -notcontains $f) { Write-Host ('  [+] Added track:   ' + $f) -ForegroundColor Green } } " ^
  "foreach ($p in $prev)  { if ($files -notcontains $p) { Write-Host ('  [-] Removed track: ' + $p) -ForegroundColor Yellow } } " ^
  "$txtContent = if ($files.Count -gt 0) { ($files -join $nl) + $nl } else { '' }; " ^
  "[System.IO.File]::WriteAllText($txtPath, $txtContent, $utf8); " ^
  "$jsonItems = @($files | ForEach-Object { '  ' + $q + ($_.Replace('\', '\\').Replace([string]$q, '\' + $q)) + $q }) -join (',' + $nl); " ^
  "$prevItems = @($prev  | ForEach-Object { '  ' + $q + ($_.Replace('\', '\\').Replace([string]$q, '\' + $q)) + $q }) -join (',' + $nl); " ^
  "$prevBlock = if ($prev.Count -gt 0 -and (($prev -join '|') -ne ($files -join '|'))) { 'window.MUSIC_PREVIOUS_TRACKS = [' + $nl + $prevItems + $nl + '];' + $nl } else { '' }; " ^
  "$jsonBody = $prevBlock + 'window.MUSIC_PLAYLIST_JSON = [' + $nl + $jsonItems + $nl + '];' + $nl + 'window.MUSIC_FOLDER_TRACKS = window.MUSIC_PLAYLIST_JSON;' + $nl; " ^
  "[System.IO.File]::WriteAllText($jsonPath, $jsonBody, $utf8); " ^
  "[System.IO.File]::WriteAllText($jsPath, $jsonBody, $utf8); " ^
  "Write-Host ('[OK] Updated music/playlist.json, playlist.txt, playlist.js! Total tracks: ' + $files.Count) -ForegroundColor Cyan"
