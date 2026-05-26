#!/bin/bash
# =============================================================
# sync-diario.sh — Sincronização diária do Portal da Transparência
# =============================================================
# Agende no crontab para rodar diariamente:
#   (ex: todo dia às 06:00)
#   0 6 * * * cd /caminho/do/projeto/Portal_da_Transparencia && bash scripts/sync-diario.sh >> logs/sync-$(date +\%F).log 2>&1
# =============================================================

set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Timestamp
echo "========================================"
echo "  🏛️  Sincronização Diária - Portal da Transparência"
echo "  📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "  📂 $PROJECT_ROOT"
echo "========================================"

# Verifica .env
if [ ! -f .env ]; then
    echo "❌ ERRO: Arquivo .env não encontrado em $PROJECT_ROOT"
    exit 1
fi

# Cria diretório de logs se não existir
mkdir -p logs

# Executa importação completa para o ano corrente
ANO=$(date '+%Y')
echo ""
echo "🚀 Iniciando importação do ano $ANO..."

npx tsx scripts/import-all.ts --ano="$ANO" --apenas=receitas,receitas_extra,despesas,diarias,licitacoes,contratos,transferencias,restos_pagar,despesas_extra 2>&1

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Sincronização concluída com sucesso!"
else
    echo "⚠️  Sincronização finalizou com erros (código $EXIT_CODE)."
    echo "   Verifique o log para mais detalhes."
fi

echo "========================================"
exit $EXIT_CODE
