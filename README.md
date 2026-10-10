## v2.7.0
- **Conteúdos reorganizados**: de 615 microconteúdos para 180 unidades, cada uma do tamanho de uma lista de questões. Repetições entre itens do edital foram eliminadas (ex.: campos de fio/espira/solenoide aparecem uma vez só). O progresso, as questões, o tempo e os erros já registrados foram levados para as novas unidades. Uma unidade só fica “Dominado” se todas as partes que ela juntou estavam dominadas.
- **Mapa de conteúdos em três níveis**: área → item do edital → unidades.
- **Ritmo até a prova** (substitui “Meu plano”): unidades por dia necessárias, ritmo dos últimos 7 dias, projeção e fila sugerida.
- **Página de Erros**: erros por causa e disciplina, marcar como resolvido, voltar a estudar. A importação de relatórios pode registrar a causa.
- **Discursiva no painel de corte**: média dos treinos contra o mínimo de 5 pontos.
- **Removidos**: página Materiais, fila e alertas de revisão, versão legada v14.
- **Conquistas** refeitas para o método atual (listas importadas, unidades dominadas, corte, discursiva).
- **Mapa de calor** das últimas 5 semanas, por dia da semana.
- **Duas abas abertas** não se sobrescrevem mais: a aba que salva atualiza a outra.
- **Datas** calculadas no fuso local (antes, depois das 21h algumas telas mostravam o dia seguinte).
- **Publicação**: ações do GitHub atualizadas (fim do aviso do Node 20).

## v2.6.0
- **Importar relatório das listas de questões**: cole o código `ROTA1:` do fim da lista em Questões e o app registra acertos, tempo total e tempo por questão. Formato em `docs/FORMATO-RELATORIO.md`.
- **Banca**: registros novos não vêm mais como “FGV” por padrão. Listas importadas entram como “Lista própria”.
- **Próxima ação sugerida** passa a considerar o peso de cada disciplina no edital (questões por hora de estudo). Física tem peso extra por ser também o tema da discursiva. A sugestão também considera o risco em cada parte da prova e mostra o motivo.
- **Painel da linha de corte** (Hoje e Desempenho): Conhecimentos Básicos e Específicos medidos separadamente, com a linha de 50% exigida no item 8.16 do edital.
- **Prontidão honesta**: sem valores inventados. Só aparece a partir de 30 questões registradas e usa apenas componentes com dados reais.
- **Discursiva**: nova página para treinar as 2 questões de 5 pontos. Tem estimativa de linhas (15 a 30), nota, devolutiva e botão para copiar a resposta para correção. Treinos da v14 são preservados.
- **Simulados** podem ser registrados separando Básicos e Específicos.
- **Sessão em andamento é salva**: o cronômetro e as questões da sessão sobrevivem a recarregar ou fechar a aba. Se o app ficar fechado por mais de 30 min com o cronômetro rodando, a sessão volta pausada no último momento em que estava aberta.

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
