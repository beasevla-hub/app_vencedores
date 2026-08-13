# Validação local

Em 13 de agosto de 2026, o painel foi aberto em uma instância local com `LOCAL_DEV_BYPASS_AUTH=true`. A tela de análise carregou sem redirecionar para o Cloudflare e exibiu a identidade visual da THI Engenharia e Arquitetura.

O seletor de órgão/subprefeitura foi preenchido dinamicamente pela fonte de dados `Captação Geral` do Notion, contendo, entre outros, `SEME`, `SUB PERUS` e `SUB SANTO AMARO`. Os campos de período e o botão `Gerar análise` também foram apresentados corretamente.

A validação restante consiste em selecionar um órgão com resultados no período, gerar o detalhamento e acionar o download do PDF no navegador local. Esse passo é viável no fluxo documentado no README; a prévia hospedada permanece bloqueada pelo erro de autenticação do Cloudflare relatado pelo usuário.

Na sequência da validação local, a opção `SEME` foi encontrada na lista dinâmica e selecionada com sucesso.

Com o intervalo de 01/01/2026 a 13/08/2026, o painel gerou um resumo de `8` empresas e `9` licitações. Os indicadores exibidos incluíram a THI Engenharia e Arquitetura como maior empresa consolidada, maior contrato de R$ 7.633.000,00, valor publicado de R$ 22.279.105,28, valor contratado de R$ 19.955.696,63 e saldo de R$ 2.323.408,65. O detalhamento renderizou grupos ordenados, processos, objetos, valores e descontos percentuais.

O botão `Baixar PDF` gerou o arquivo `relatorio-vencedores-seme-2026-01-01-2026-08-13.pdf`, confirmado no histórico de downloads do navegador.

Após o ajuste de tipografia dos cartões, a instância local foi recarregada e a lista dinâmica de órgãos voltou a carregar corretamente.

A análise da SEME foi regenerada com sucesso depois do ajuste de tipografia; os indicadores e o agrupamento por empresa permaneceram consistentes.

Uma segunda amostra, identificada como `relatorio-vencedores-seme-2026-01-01-2026-08-13 (1).pdf`, foi gerada e confirmada no histórico de downloads após a correção.

A inspeção visual da segunda amostra confirmou cabeçalho, logotipo, período, cartões de resumo, tabela agrupada, marca d’água, rodapé e paginação em duas páginas. Os valores monetários extensos dos cartões foram apresentados integralmente após o ajuste tipográfico.

Na preparação da comparação da SUB PERUS, o painel local recarregou e preencheu novamente a lista dinâmica de órgãos sem falhas.

Para a SUB PERUS no período de 01/01/2026 a 08/07/2026, a análise gerada reproduziu o modelo de referência: 1 empresa, 1 licitação, MC Engenharia e Construções S.A. como maior empresa e maior contrato de R$ 393.239,75, valor publicado de R$ 524.584,22, valor contratado de R$ 393.239,75 e saldo de R$ 131.344,47. O edital 01/SUB/PR/2026, processo, objeto e desconto de 25,04% também corresponderam ao PDF de referência.

O PDF `relatorio-vencedores-sub-perus-2026-01-01-2026-07-08.pdf` foi gerado e confirmado no histórico de downloads.

A inspeção visual confirmou uma página única, com cabeçalho, logotipo no topo direito, período, sete cartões, grupo da MC Engenharia e Construções S.A., tabela do edital, marca d’água e rodapé de totais. A composição corresponde à estrutura do modelo de SUB PERUS, adaptada à identidade visual solicitada.

Na preparação da comparação da SUB SANTO AMARO, a lista de órgãos foi carregada novamente pela fonte Captação Geral.

Na primeira comparação da SUB SANTO AMARO, a quantidade de empresas e licitações correspondeu ao modelo (9 e 10), mas alguns valores de `Valor aceito` sem separadores aparentaram escala monetária incorreta. A normalização desses registros precisa ser ajustada antes da validação final desse modelo.

Após a alteração da normalização, a recarga automática de desenvolvimento reinicializou o formulário; a SUB SANTO AMARO será selecionada novamente para confirmar os totais corrigidos.

Com a correção aplicada, a SUB SANTO AMARO reproduziu os valores esperados para o período de referência: 9 empresas, 10 licitações, Ramon Aguilera como maior empresa e maior contrato de R$ 3.289.000,00, valor publicado de R$ 9.445.013,57, valor contratado de R$ 8.358.293,67 e saldo de R$ 1.086.719,90. Os descontos voltaram a valores plausíveis e os grupos permaneceram ordenados por valor aceito consolidado.

O PDF corrigido `relatorio-vencedores-sub-santo-amaro-2026-01-01-2026-07-08.pdf` foi gerado e confirmado no histórico de downloads.

Após a correção de paginação, a instância local recarregou e a lista dinâmica de órgãos permaneceu disponível para a geração da amostra final.

A análise final da SUB SANTO AMARO foi regenerada com os indicadores financeiros corrigidos e está pronta para exportação com a nova regra de não dividir linhas de licitação.

A versão final `relatorio-vencedores-sub-santo-amaro-2026-01-01-2026-07-08 (1).pdf` foi gerada e confirmada no histórico de downloads.

A inspeção final confirmou duas páginas, cabeçalho e cartões na primeira página, grupos ordenados, totais e rodapés nas duas páginas. A regra de não dividir linhas preservou cada licitação integralmente; a segunda licitação do grupo S. C. Engenharia foi movida integralmente para a página seguinte, mantendo os valores, processo e objeto juntos. O layout, os totais e a paginação correspondem ao padrão do modelo de SUB SANTO AMARO.

## Síntese da comparação

| Modelo | Resultado da validação | Ajustes aplicados |
|---|---|---|
| SEME | Indicadores, grupos e PDF em duas páginas verificados. | Valores extensos dos cartões foram repartidos para não haver corte. |
| SUB PERUS | Indicadores e relatório de uma página corresponderam ao modelo. | Nenhum ajuste específico necessário. |
| SUB SANTO AMARO | Indicadores, grupos e PDF em duas páginas corresponderam ao modelo. | Leitura de ponto decimal do Notion corrigida; linhas de licitação não são divididas entre páginas. |
