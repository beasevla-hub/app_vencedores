@echo off
setlocal EnableExtensions

rem Garante que o script seja executado a partir da pasta do projeto.
cd /d "%~dp0"

where pnpm >nul 2>&1
if errorlevel 1 (
    echo [ERRO] pnpm nao foi encontrado no PATH.
    echo Instale o Node.js 22 e o pnpm 10 antes de executar este arquivo.
    pause
    exit /b 1
)

rem Escolhe uma porta aleatoria no intervalo dinamico do Windows (49152-65535)
rem e testa se ela esta livre. O servidor ainda possui fallback automatico.
set "PORT="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; do { $p=Get-Random -Minimum 49152 -Maximum 65536; $l=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$p); try { $l.Start(); $l.Stop(); Write-Output $p; break } catch { try { $l.Stop() } catch {} } } while ($true)"`) do set "PORT=%%P"

if not defined PORT (
    echo [ERRO] Nao foi possivel encontrar uma porta livre.
    pause
    exit /b 1
)

echo.
echo Iniciando o app Vencedores na porta aleatoria %PORT%...
echo Acesse a URL exibida pelo servidor neste terminal.
echo Para encerrar, pressione Ctrl+C.
echo.

set "NODE_ENV=development"
pnpm dev

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo O servidor foi encerrado com codigo %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
