# Painel de Análise de Licitações — THI Engenharia e Arquitetura

Este projeto gera análises consolidadas da base **Captação Geral** do Notion. O painel filtra licitações por órgão/subprefeitura e intervalo de datas, considera os status **Aceita e Habilitada** e **Perdida**, apresenta indicadores financeiros, agrupa editais por empresa e permite baixar o relatório em PDF A4.

## Funcionalidades entregues

| Área | Implementação |
|---|---|
| Fonte de dados | Consulta ao Notion API, com conexão realizada apenas pelo servidor. |
| Filtros | Lista dinâmica de `Sub/Prefeitura`, data inicial e data final. |
| Regras financeiras | Soma dos valores publicados e aceitos, saldo/economia, maior contrato e empresa com maior valor consolidado. |
| Detalhamento | Agrupamento decrescente por `Emp. em Análise`, com editais, processos, objetos e desconto percentual. |
| PDF | Cabeçalho, período, indicadores, tabela por empresa, rodapé de totais, logotipo e marca d’água da THI. |
| Qualidade | Testes Vitest unitários para normalização de valores, filtros, cálculos, agrupamento e geração de PDF; integração real com o Notion em suíte separada e opcional. |

## Configuração local

Instale **Node.js 22** e **pnpm 10**. Em seguida, clone o repositório, instale as dependências e crie um arquivo `.env` na raiz do projeto. Não versione esse arquivo nem exponha o token do Notion no navegador.

```bash
git clone https://github.com/beasevla-hub/app_vencedores.git
cd app_vencedores
pnpm install
```

Use o conteúdo abaixo como base para o arquivo `.env`:

```dotenv
NOTION_API_KEY=ntn_seu_token_de_integracao_aqui
LOCAL_DEV_BYPASS_AUTH=true
```

O `LOCAL_DEV_BYPASS_AUTH=true` libera apenas o painel rodando localmente com `NODE_ENV=development`; ele não cria um bypass para ambiente de produção. Remova essa variável caso queira integrar uma autenticação própria.

Para a execução local, não configure `OAUTH_SERVER_URL`, `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID` nem variáveis `BUILT_IN_FORGE_*`. O projeto ignora esses serviços hospedados no modo local.

### Logotipo oficial

O PNG oficial da THI fica versionado em `client/public/thi-logo.png` e é servido em `/thi-logo.png` tanto pelo Vite quanto pelo build de produção. O painel e o PDF usam o mesmo arquivo; se ele não estiver disponível, o PDF usa uma marca vetorial de fallback e continua sendo exportado.

No Notion, crie ou escolha uma integração interna em `notion.so/my-integrations` com permissão de leitura de conteúdo. Depois, abra a base **Captação Geral**, escolha **Compartilhar** e adicione essa integração. O app consulta a fonte de dados `Captação Geral` vinculada à base já configurada no código.

## Executar e validar

```bash
pnpm dev
```

Abra a URL mostrada no terminal, selecione um órgão e um intervalo de período e clique em **Gerar análise**. Para gerar o arquivo, clique em **Baixar PDF** depois que o detalhamento for carregado.

### Windows / PowerShell

O script `pnpm dev` é multiplataforma e deve ser executado exatamente da mesma forma no PowerShell: `pnpm dev`. Ele configura `NODE_ENV=development` internamente, portanto não é necessário incluir `NODE_ENV=...` no comando nem definir essa variável manualmente no Windows.

Se você clonou o projeto antes desta correção, atualize a cópia local e reinstale as dependências antes de iniciar:

```powershell
git pull origin main
pnpm install
pnpm dev
```

Os comandos abaixo validam tipos, testes unitários e compilação de produção:

```bash
pnpm check
pnpm test
pnpm build
```

O comando `pnpm test` executa somente testes unitários, incluindo os cenários de paginação e dados extremos do PDF, e não acessa serviços externos. Para validar a conexão e a leitura reais do Notion, use `pnpm test:integration`; essa suíte carrega o `.env` e é ignorada automaticamente quando `NOTION_API_KEY` não estiver configurada. Para executar as duas suítes em sequência, use `pnpm test:all`.

## Regras de cálculo

| Indicador | Regra |
|---|---|
| Total de empresas | Quantidade de nomes únicos em `Emp. em Análise`. |
| Total de licitações | Quantidade de licitações distintas; lotes da mesma licitação contam uma vez. |
| Valor publicado | Soma de `VALOR DA OBRA`. |
| Valor contratado | Soma de `Valor aceito`. |
| Saldo/economia | `Valor publicado − Valor contratado`. |
| Empresa com maior valor aceito | Empresa com a maior soma de `Valor aceito`. |
| Maior contrato | Maior `Valor aceito` individual. |
| Desconto | `(Valor da obra − Valor aceito) ÷ Valor da obra`. |

## Validação visual e de PDF

A interface foi validada localmente em larguras de desktop e mobile, incluindo busca de órgãos, geração de relatório, estado sem resultados, aviso de filtros desatualizados e bloqueio do PDF nesse estado. A geração de PDF foi conferida com dados reais da base e com um conjunto sintético de 108 registros, 18 empresas, múltiplos lotes, descrições longas, acentuação e tabelas que continuam em páginas seguintes.
