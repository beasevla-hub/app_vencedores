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
| Qualidade | Testes Vitest para credencial, consulta real ao Notion, normalização de valores, filtros, cálculos e agrupamento. |

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

No Notion, crie ou escolha uma integração interna em `notion.so/my-integrations` com permissão de leitura de conteúdo. Depois, abra a base **Captação Geral**, escolha **Compartilhar** e adicione essa integração. O app consulta a fonte de dados `Captação Geral` vinculada à base já configurada no código.

## Executar e validar

```bash
pnpm dev
```

Abra a URL mostrada no terminal, selecione um órgão e um intervalo de período e clique em **Gerar análise**. Para gerar o arquivo, clique em **Baixar PDF** depois que o detalhamento for carregado.

Os comandos abaixo validam tipos, integração e compilação de produção:

```bash
pnpm check
pnpm test
pnpm build
```

## Regras de cálculo

| Indicador | Regra |
|---|---|
| Total de empresas | Quantidade de nomes únicos em `Emp. em Análise`. |
| Total de licitações | Quantidade de registros filtrados. |
| Valor publicado | Soma de `VALOR DA OBRA`. |
| Valor contratado | Soma de `Valor aceito`. |
| Saldo/economia | `Valor publicado − Valor contratado`. |
| Empresa com maior valor aceito | Empresa com a maior soma de `Valor aceito`. |
| Maior contrato | Maior `Valor aceito` individual. |
| Desconto | `(Valor da obra − Valor aceito) ÷ Valor da obra`. |

## Observação sobre validação hospedada

>A validação visual autenticada na prévia hospedada não foi concluída porque o acesso do usuário foi bloqueado por uma falha de autenticação do Cloudflare. A aplicação, os testes e a compilação foram verificados no ambiente de desenvolvimento; a validação visual final do PDF deve ser feita localmente seguindo os passos acima.
