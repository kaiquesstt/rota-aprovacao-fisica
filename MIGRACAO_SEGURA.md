# Migração segura da v14 para Rota da Aprovação 2.0

## Antes de substituir o site
1. Abra a versão atual do site no mesmo computador e navegador que você usa para estudar.
2. Vá em **Dados & Backup**.
3. Clique em **Exportar backup** e guarde o arquivo JSON.
4. Não apague os dados do navegador e não mude o endereço do GitHub Pages.

## Por que os dados permanecem
O endereço continuará sendo:
`https://kaiquesstt.github.io/rota-aprovacao-fisica/`

LocalStorage e IndexedDB pertencem à origem do site, não ao arquivo `index.html`. Como o domínio e o caminho do projeto permanecem os mesmos, a nova interface consegue ler o progresso existente.

A chave de compatibilidade também permanece exatamente a mesma:
`seduc-pa-fisica-maraba-v2`

## Plano de recuperação
O projeto inclui a versão antiga em:
`https://kaiquesstt.github.io/rota-aprovacao-fisica/legacy-v14.html`

Se algo parecer errado na 2.0, abra essa página antes de limpar qualquer dado. Ela roda na mesma origem e consegue acessar o armazenamento já existente.

Você também pode abrir **Configurações → Importar JSON** na 2.0 para restaurar o backup exportado antes da migração.
