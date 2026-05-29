@echo off
REM ============================================================
REM  baixar-e-importar-mensal.bat
REM  Agenda no Windows: baixa a folha do mês e importa pro banco
REM
REM  ⚙️  Configurado para: TODO MÊS, dia 05, às 08:00
REM ============================================================
REM
REM  ⚠️  IMPORTANTE: O Puppeteer ABRE O CHROME visível na tela!
REM      O script só funciona se você estiver logado no PC.
REM      Ele vai abrir e fechar o navegador automaticamente.
REM
REM  📋 Configuração no Agendador de Tarefas:
REM    1. Win+R > "taskschd.msc" > Enter
REM    2. Ação > "Criar Tarefa..."
REM    3. Nome: "Baixar Folha Mensal"
REM    4. Aba Geral:
REM       - "Executar somente quando o usuário estiver conectado"
REM       - Marcar "Executar com privilégios mais altos"
REM    5. Aba Gatilhos > Novo:
REM       - Mensalmente
REM       - Dia: 5
REM       - Horário: 08:00
REM    6. Aba Ações > Novo:
REM       - Programa: C:\Windows\System32\cmd.exe
REM       - Argumentos:
REM           /c "C:\Users\Áurea Letícia\Documents\sitio-prefeitura\Portal_da_Transparencia\scripts\automatico\baixar-e-importar-mensal.bat"
REM    7. Aba Configurações:
REM       - Marcar "Permitir executar tarefa sob demanda"
REM       - Marcar "Se a tarefa falhar, reiniciar a cada 30 minutos"
REM       - Máximo de tentativas: 3
REM ============================================================

SET PROJECT_DIR=C:\Users\Áurea Letícia\Documents\sitio-prefeitura\Portal_da_Transparencia
SET LOG_DIR=%PROJECT_DIR%\logs
SET LOG_FILE=%LOG_DIR%\folha-mensal-%DATE:/=-%.log
SET NPX=C:\Program Files\nodejs\npx.cmd

REM ---- Configuração de Retry ----
SET MAX_RETRIES=3
SET RETRY_DELAY_SEC=60
SET /A ATTEMPT=1

REM Criar pasta de logs se não existir
IF NOT EXIST "%LOG_DIR%" mkdir "%LOG_DIR%"

ECHO ======================================== >> "%LOG_FILE%"
ECHO Inicio: %DATE% %TIME% >> "%LOG_FILE%"
ECHO ======================================== >> "%LOG_FILE%"

REM Ir para o diretório do projeto
CD /D "%PROJECT_DIR%"

:RETRY_LOOP
ECHO [Tentativa %ATTEMPT% de %MAX_RETRIES%] >> "%LOG_FILE%"

REM 1. Baixar a folha do mês atual
ECHO [1/2] Baixando folha do mes atual... >> "%LOG_FILE%"
"%NPX%" tsx scripts/automatico/baixar-folhas-site.ts >> "%LOG_FILE%" 2>&1
SET DOWNLOAD_EXIT=%ERRORLEVEL%

REM Se download falhou, tentar de novo
IF %DOWNLOAD_EXIT% NEQ 0 (
    ECHO [ERRO] Download falhou (codigo %DOWNLOAD_EXIT%). >> "%LOG_FILE%"
    GOTO CHECK_RETRY
)

REM 2. Importar para o banco
ECHO [2/2] Importando CSVs para o Supabase... >> "%LOG_FILE%"
"%NPX%" tsx scripts/automatico/importar-csv-folhas.ts >> "%LOG_FILE%" 2>&1
SET IMPORT_EXIT=%ERRORLEVEL%

REM Se import falhou, tentar de novo
IF %IMPORT_EXIT% NEQ 0 (
    ECHO [ERRO] Import falhou (codigo %IMPORT_EXIT%). >> "%LOG_FILE%"
    GOTO CHECK_RETRY
)

REM Sucesso! Sai do loop
GOTO FIM

:CHECK_RETRY
IF %ATTEMPT% GEQ %MAX_RETRIES% (
    ECHO [FATAL] Excedeu %MAX_RETRIES% tentativas. Abortando. >> "%LOG_FILE%"
    GOTO FIM
)

REM Aguardar antes de tentar de novo
ECHO [RETRY] Aguardando %RETRY_DELAY_SEC% segundos antes da tentativa %ATTEMPT%... >> "%LOG_FILE%"
ping -n %RETRY_DELAY_SEC% 127.0.0.1 > nul
SET /A ATTEMPT+=1
GOTO RETRY_LOOP

:FIM
ECHO ======================================== >> "%LOG_FILE%"
ECHO Fim: %DATE% %TIME% >> "%LOG_FILE%"
ECHO ======================================== >> "%LOG_FILE%"
ECHO. >> "%LOG_FILE%"
