# Conferência de Lotes: piloto funcional

Protótipo B2B criado em 03/10/2026 para validar um fluxo de referência: CSV de pedidos aprovados versus CSV preparado para importar no ERP. Ainda sem compradores, licenças vendidas ou compatibilidade validada com layouts de ERPs específicos.

## Executar

No repositório público, inicie um servidor estático na pasta `portfolio` e abra `/b2b/index.html`; assim os links de retorno e o favicon têm os caminhos completos. Também é possível servir `site` como demonstração isolada, com o processamento funcional, ou usar a demonstração hospedada. A interface depende de Web Crypto e File API de um navegador atual; localhost/HTTPS permite SHA-256. Execute os testes com `node --test tests/engine.test.cjs`. O motor usa apenas JavaScript padrão; não chama API de IA ou outra API, nem mantém dados em armazenamento persistente.

## Contrato de entrada

- Dois CSVs UTF-8, até 2 MiB e 10.000 registros cada, com cabeçalhos `pedido`, `sku`, `quantidade`, `preco_unitario`. Podem existir colunas extras, desde que os cabeçalhos sejam únicos e cada registro tenha a mesma quantidade de campos.
- Separador de colunas `;` ou `,` e decimal `,` ou `.` escolhidos explicitamente. Sem adivinhar locale. Aspas seguem regras CSV estritas; aspas duplicadas, delimitadores e quebras de linha em campos entre aspas são aceitos. Identidades não aceitam caracteres de controle.
- Pedido e SKU são textos de até 120 caracteres, com espaços externos removidos. Maiúsculas/minúsculas e zeros iniciais preservados. Chave composta sem colisão de separador.
- Quantidade inteira positiva até 1.000.000; preço não negativo, até duas casas, sem milhares/expoente, até R$9.999.999.999,99. Preços, produtos e totais usam BigInt em centavos, sem arredondamento por ponto flutuante.
- Uma chave duplicada em qualquer lado é bloqueada; as linhas não são somadas ou sobrescritas. Linha com erro também bloqueia sua chave quando identificável. Erros sem identidade continuam impedindo resultado sem pendências.
- Registros correspondentes, divergentes, ausentes, inesperados e bloqueados são separados. Linhas físicas de origem estão disponíveis, inclusive após linhas vazias ou campos multilinha.

## Resultados e limites

O exemplo sintético contém um registro correspondente, um divergente, um ausente, um inesperado e uma chave bloqueada por repetição. Não são falhas do processamento: são entradas com problemas deliberados que a ferramenta detecta. Os totais excluem linhas/chaves inválidas e são marcados como parciais nesses casos.

O relatório JSON inclui SHA-256 dos bytes dos dois arquivos, nomes, tamanho, configurações e resultados. A UI pagina cem chaves por vez; o relatório completo contém todas. O CSV de saída usa cabeçalhos técnicos estáveis, campos entre aspas e prefixo de apóstrofo em conteúdos que poderiam iniciar fórmulas de planilha. Linhas inválidas também são exportadas. Relatórios são baixados localmente por ação do usuário.

Esta conferência não verifica todas as regras fiscais, de estoque, cadastro, negócio ou ERP. Não altera/importa/aprova pedidos, executa pagamentos, processa PDFs/OCR ou prova homologação de integração. Um resultado sem divergências é restrito às regras descritas e deve ser revisado pelo operador.

## Autoria e oferta

Codex implementou motor, interface funcional, páginas e testes. Claude Opus 5.5 com esforço xhigh produziu a direção visual, as pranchas locais pelo workflow Higgsfield brandkit e o diagrama vetorial original. A primeira rodada do Claude atingiu limite de sessão. Após o upgrade da assinatura feito pelo usuário, Claude retomou e entregou as páginas PT/EN/ES e o CSS comercial aprimorados; Codex integrou, verificou e publicou a versão funcional. Geração cloud Higgsfield não ocorreu e não houve compra feita pelo agente.

Piloto de configuração proposto a partir de R$497: um fluxo, dois layouts CSV, uma configuração de colunas/regras acordada, relatório, exemplo, uma rodada de ajustes e correção de defeitos do escopo entregue por sete dias. Valor e prazo somente após avaliar amostras sanitizadas. Nenhuma contratação, assinatura, cobrança real ou mensagem a novos prospects foi executada pela demonstração.

A análise de mercado usa fontes primárias, mas não comprova disposição a pagar por esta solução. Próximo critério de decisão: três empresas descrevem a mesma necessidade e duas aceitam piloto pago; ainda não atingido. Medir adaptação e suporte antes de transformar em licença ou assinatura.
