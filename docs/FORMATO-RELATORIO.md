# Código de relatório das listas de questões (ROTA1)

As listas de questões em HTML terminam com um relatório. Junto do relatório, a lista mostra um código que começa com `ROTA1:`. Esse código é colado em **Questões → Importar relatório** e o app registra, de uma vez, o bloco de questões e o tempo de estudo.

## Formato

```
ROTA1:<JSON codificado em base64, UTF-8>
```

O app também aceita o JSON puro colado diretamente.

| Campo | Obrigatório | Descrição |
|---|---|---|
| `v` | sim | Versão do formato. Sempre `1`. |
| `id` | sim | Identificador único da tentativa. Impede importar a mesma lista duas vezes. |
| `topicId` | não | Id do conteúdo no app (`src/data/topics.ts`). Quando presente, o vínculo é automático. |
| `topic` | sim | Título do conteúdo. Usado para sugerir o vínculo quando não há `topicId`. |
| `discipline` | não | Ex.: `Física`. Restringe a busca do conteúdo. |
| `date` | sim | `AAAA-MM-DD`. |
| `total` | sim | Número de questões respondidas. |
| `correct` | sim | Número de acertos. |
| `durationSeconds` | sim | Tempo total da lista, em segundos, sem as pausas. |
| `perQuestion` | não | Lista de `{ "n": 1, "correct": true, "seconds": 95 }`. |

## Trecho para gerar o código na lista HTML

```js
function rotaCode(report){
  const json = JSON.stringify({ v: 1, ...report });
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return 'ROTA1:' + b64;
}
// Exemplo
rotaCode({
  id: 'gauss-' + Date.now(),
  topic: 'Lei de Gauss: significado físico',
  discipline: 'Física',
  date: new Date().toLocaleDateString('sv-SE'),
  total: 12, correct: 9, durationSeconds: 1500,
  perQuestion: [{ n: 1, correct: true, seconds: 95 }]
});
```

O bloco importado entra com a banca **“Lista própria”**. Assim ele não se mistura com as estatísticas de questões da FGV.
