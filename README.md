## v2.4.0
- Evolução diária com seletor de 15 ou 30 dias.
- Filtros visuais de conteúdo, incluindo ocultar dominados.
- Feedback central destacado ao salvar, excluir, importar ou atualizar progresso.
- Celebração de conquistas com modal e confetes.
- Busca global no cabeçalho para conteúdos e fórmulas.
- Estados vazios mais claros e cards responsivos sem rolagem horizontal.

## v2.3.3
- Adiciona modo livre do cronômetro: inicia em 00:00 e conta para cima.
- Mantém modo regressivo por duração e tela inteira.

## v2.3.2

Correções: cronômetro/início, modo tela inteira, exclusão de blocos de questões e retorno das conquistas.

# Rota da Aprovação 2.2

Versão com refinamento visual ampliado, tipografia maior e layout desktop menos compacto.

# Rota da Aprovação 2.0 — Física SEDUC-PA

Nova interface desktop-first construída em React + TypeScript + Vite, usando como referência visual o conceito “Comando de Estudo”.

## Arquitetura
- React + TypeScript + Vite
- Zustand para estado global
- Dexie/IndexedDB para armazenamento moderno
- LocalStorage com a mesma chave da v14 para compatibilidade
- Recharts para gráficos
- Lucide para ícones
- PWA com Service Worker
- GitHub Actions para publicar no GitHub Pages

## Compatibilidade de dados
A aplicação preserva a chave antiga:

`seduc-pa-fisica-maraba-v2`

No primeiro carregamento ela procura, nessa ordem de segurança, os dados do LocalStorage da versão anterior, o IndexedDB antigo e o novo IndexedDB. O conjunto mais recente é migrado para o formato 2.0.

A versão v14 original está incluída em `public/legacy-v14.html` como rota de recuperação.

## Publicação
Este projeto já está configurado para o repositório:

`rota-aprovacao-fisica`

O `vite.config.ts` usa `base: '/rota-aprovacao-fisica/'`.

No GitHub, configure **Settings → Pages → Source: GitHub Actions**. O workflow `.github/workflows/deploy.yml` faz o restante automaticamente.


## v2.5 — Sessão integrada
- Cronômetro baseado em tempo real, sem perder minutos em abas de segundo plano.
- Meta regressiva flexível: após 00:00, continua contando o tempo extra até encerrar.
- Registro de questões e acertos dentro da própria sessão de estudo.
- Encerramento único salva tempo + questões e atualiza gráficos/desempenho.
