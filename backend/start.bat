@echo off
echo.
echo ===================================
echo   RPCraft Backend - Iniciando...
echo ===================================
echo.

:: Verificar se o Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

:: Verificar se o npm está instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)

:: Verificar se existe package.json
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo Certifique-se de estar no diretorio correto.
    pause
    exit /b 1
)

:: Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

:: Verificar se existe arquivo .env
if not exist ".env" (
    echo.
    echo [AVISO] Arquivo .env nao encontrado!
    echo.
    echo Crie um arquivo .env com o seguinte conteudo:
    echo GEMINI_API_KEY=sua_chave_da_api_aqui
    echo.
    echo Obtenha sua chave em: https://aistudio.google.com/app/apikey
    echo.
    set /p continuar="Deseja continuar mesmo assim? (s/n): "
    if /i not "%continuar%"=="s" (
        exit /b 1
    )
)

echo.
echo [INFO] Iniciando servidor...
echo [INFO] Pressione Ctrl+C para parar o servidor
echo.

:: Iniciar o servidor
npm run dev

pause 