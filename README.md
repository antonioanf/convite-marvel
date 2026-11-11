# Missão JL · João Lucas · 5 anos

Convite de aniversário em formato de site (uma página), feito para ser aberto **no celular** pelo link do WhatsApp.
Clima de filme de super-herói: realista e adulto, mas colorido e cheio de energia.

- **Abertura:** noite de tempestade, chuva e o emblema JL de aço. No toque, um raio atinge o emblema, o metal fica em brasa e a luz revela o convite já colorido.
- **Hero como pôster de cinema:** no topo, céu de tempestade com uma explosão de luz atravessando as nuvens (raios volumétricos, nuvens acesas em dourado, laranja e azul nas bordas); no meio, o emblema e "JOÃO LUCAS" / "5 ANOS" em contraluz; na base, rochas escuras com brasas e poeira subindo entre elas; embaixo, degradê até o quase preto azulado `#05070D`, onde ficam data, local e frase.
- **6 poderes com gestos** (WebGL com bloom; fallback em canvas 2D), seção PODERES com mão-fantasma, medidor e SOBRECARGA.
- Contagem regressiva, A missão (data decodificada pela rajada, local, mapa, agenda), Aceitar missão (credencial em PNG + WhatsApp) e rodapé com brasas.

---

## 1. Começando

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
npm run dev            # http://localhost:5173  (use `npm run dev -- --host` para abrir no celular pela rede)
npm run build          # gera dist/ para publicar
npm run preview        # testa o build em http://localhost:4173
```

## 2. O que falta preencher (TODOs)

Tudo fica em **`src/config/convite.ts`**. Procure por `TODO`:

| Campo | O que colocar | Enquanto estiver vazio… |
|---|---|---|
| `festa.endereco` | Ex.: `'Av. Tal, 123 – Bairro, Fortaleza-CE'` | Aparece "Endereço completo em breve" |
| `festa.linkMapa` | Link do Google Maps (no app: Compartilhar → Copiar link) | "Como chegar" abre uma busca pelo nome do local |
| `rsvp.whatsapp` | Só dígitos, com 55 + DDD: `'5585999999999'` | A confirmação mostra o aviso "WhatsApp ainda não configurado" (nunca abre link quebrado) |
| `rsvp.prazo` | Data limite: `'2026-11-22'` | Some a frase "Confirme até…" |
| `assinatura` | Ex.: `'Com carinho, papai e mamãe'` | O rodapé mostra só "Te espero na festa!" |
| `pix` | Troque `null` pelo objeto do exemplo comentado | A seção de presentes não aparece |
| `site.url` | Endereço publicado, sem barra no final | **A imagem da prévia no WhatsApp não aparece** |

Data fixa: quinta-feira, 26/11/2026, 15:00 (`2026-11-26T15:00:00-03:00`, `America/Fortaleza`), Enjoy Kids · Shopping Liv Mall.

## 3. Paleta

Fica em `convite.paleta`. O fundo escuro é só a base para as cores de luz brilharem.

| Nome | Cor | Uso |
|---|---|---|
| `vermelho` | `#E62429` | reflexos do metal, seção "A missão" |
| `dourado` | `#F5B700` | 5 ANOS, botões, seção PODERES, poeira cósmica |
| `azul` | `#1E90FF` | eletricidade, Tempestade, contagem |
| `ciano` | `#22D3EE` | energia, números da contagem |
| `roxo` | `#7B2FF7` | rasgos do céu, "Aceitar missão" |
| `fogo` | `#FF6A00` | nuvens acesas, Rajada |
| `branco` | `#FFF6EC` | texto (branco quente) |

Os tons de **texto** das cores escuras demais para letra pequena (vermelho, roxo) são clareados em `src/config/tema.ts` (`text-vermelho-txt`, `text-roxo-txt`).

**Legibilidade.** As cores vibrantes ficam na luz e nos efeitos, não atrás do texto: fora do pôster do hero o fundo é escuro e calmo (`#05070D`). Cartões com fundo escuro 90% opaco, borda luminosa fina e sombra (sem `backdrop-filter`). Títulos e rótulos sobre o céu têm sombra forte e um degradê escuro localizado. Os canvas de efeitos (faíscas do dedo, clarões) ficam **atrás** do conteúdo e só vêm para a frente durante um poder ativo; as brasas do hero e do rodapé nascem abaixo do texto e apagam antes de chegar nele.

`node scripts/contraste.mjs [--aparelho=360x740]` mede **todo** texto (hero, títulos, cartões, rodapé) contra o **pior pixel** do fundo — com as animações rodando e o texto no alto, no meio e embaixo da tela. Mínimo 4,5:1 (texto normal) e 3:1 (título grande). Resultado atual: 41 de 41 no iPhone 13 e no 360x740 (antes da reforma: 11 e 12 abaixo do mínimo).

## 3b. Imagem de fundo das seções

Do "ROLE" para baixo (contagem, missão, poderes, aceitar missão, rodapé) há uma imagem atrás das seções. O hero e a abertura não mudam.

- **Origem:** `originais/fundo.jpg` (ou `.png`). Para trocar, substitua o arquivo e rode `npm run fotos`: gera `public/fotos/fundo-1200.webp` e `fundo-750.webp` (qualidade ~72, no máximo ~200 KB cada; se passar, baixa a qualidade). A imagem atual tem só 626 px de largura e é ampliada — um original de 1200 px ou mais fica mais nítido.
- **Carregamento:** preguiçoso de verdade — só começa a baixar quando a pessoa rola ~1/4 da tela (perto do fim do hero), então não disputa com a abertura nem com o LCP. O `srcset` escolhe 750 ou 1200 px conforme a tela.
- **Como aparece:** camada fixa atrás das seções (um `<img>`, sem `background-attachment: fixed`, que o iPhone ignora), com parallax leve só com `transform` (desligado com `prefers-reduced-motion`). Por cima: `#05070D` a 68% + vinheta. A emenda com o hero é um degradê de 200 px. Os títulos de seção têm uma faixa escura que se dissolve nas bordas; os cartões continuam 90% opacos. Os poderes continuam por cima de tudo.
- `node scripts/fundo.mjs` tira os prints (transição e duas seções, iPhone 13 e 360x740) e confere que a imagem não baixa antes de rolar.

## 3c. Tamanhos das seções (escala compacta)

Missão, Poderes (com a Sobrecarga) e Aceitar missão usam a classe `compacta`: fontes, ícones, botões, paddings, espaços entre cartões e margens ~15–20% menores que o resto do convite. Todos os valores ficam num só bloco, `.compacta { --fs-…; --btn-h; --pad; … }` em `src/index.css`. Para ajustar, mude ali. Os componentes usam as classes `t-titulo`, `t-texto`, `t-rotulo`… e as variáveis (`p-(--pad)`, `gap-(--gap)`); as regras base (`.btn`, `.field`, `.ico`, `.secao-titulo`…) leem as mesmas variáveis com o tamanho antigo como padrão, por isso contagem, presentes e barra de baixo não mudaram.

Pisos: texto de leitura ≥ 15px, rótulos ≥ 12px, botões e áreas de toque ≥ 44px, campo de nome 16px (abaixo disso o iPhone dá zoom ao digitar). `node scripts/compacto.mjs <rótulo> [url]` tira os prints dessas seções e da credencial (iPhone 13 e 360x740) e lista fontes, alturas de toque e textos que quebram ou transbordam.

## 4. Os poderes

Funcionam no convite inteiro, menos sobre campos de texto, botões e links. Arrastar na vertical continua rolando a página.

| Poder | Gesto | Cores |
|---|---|---|
| Tempestade | arrastar rápido de cima para baixo (começando no alto da tela): o raio cai onde o dedo parou | azul elétrico e branco |
| Impacto | toque duplo num ponto | laranja e vermelho incandescente |
| Rajada de energia | segurar (carrega) e soltar: o feixe sai na direção do toque | laranja de fogo e azul-celeste |
| Magia | girar o dedo em círculos (mais de 1,5 volta) | violeta e turquesa com fiapos dourados |
| Portal | desenhar um círculo fechado e soltar | anéis turquesa, violeta e dourado |
| Energia cósmica | segurar com dois dedos (ou segurar bem longo, > 2,6 s) | azul, ciano, dourado e laranja |

- **Motor** (`src/poderes/`): `gestos.ts` reconhece os gestos (no pacote principal, pequeno); `acionar.ts` baixa o motor sob demanda; `motor.ts` é um chunk separado (~19 KB gzip) que só baixa perto da seção PODERES ou no primeiro gesto. `sim.ts` simula (raios fractais, ondas de choque, rachaduras com brasa esfriando, pedras com física, fumaça, feixe, névoa, portal, esferas com rastro de cometa); o WebGL (`gl/`) desenha com bloom e distorção (refração das ondas, lente do portal, ar ondulando de calor). Sem WebGL, ou se o aparelho ficar abaixo de ~28 fps, cai para o canvas 2D (`render2d.ts`). O renderizador WebGL é outro chunk (`gl/renderGL.ts`): se ele não baixar, se um shader não compilar ou se o WebGL der erro no meio de um efeito, o motor passa sozinho para o 2D (num canvas novo — um canvas que já teve WebGL não aceita 2D). Se um chunk dos efeitos não baixar, há mais 2 tentativas por outro endereço (`?tentativa=N`, porque o Safari guarda a falha do `import()`); sem motor nenhum, cada poder vira o brilho suave e continua contando.
- **Convite reage:** tremor, ondulação, levitação (magia) e puxão do portal nos cartões, só com `translate`/`rotate`/`scale`.
- **Segurança:** no máximo 3 clarões por segundo, nunca branco puro em tela cheia (opacidade ≤ 0,55); com `prefers-reduced-motion` cada poder vira só um brilho suave colorido; partículas limitadas (300 no WebGL, 120 no 2D); o motor para com a aba em segundo plano e quando não há efeito vivo; enquanto um poder roda, os efeitos de fundo do hero ficam pausados.
- **Seção PODERES:** mão-fantasma animada para cada gesto, botão "Disparar" e o medidor "PODERES n/6" (guardado no aparelho). Com os 6, destrava a SOBRECARGA: tudo junto por ~3 s, terminando em "TODOS OS PODERES ATIVADOS. TE ESPERO NA FESTA!".

## 5. Testes

### Parâmetros na URL

| Parâmetro | Efeito |
|---|---|
| `?modo=leve` / `?modo=normal` | Força o modo leve / normal (o normal não cai para o leve sozinho) |
| `?motor=2d` | Força o fallback 2D dos poderes |
| `?debug=1` | Painel no canto de cima: efeitos em WebGL ou 2D, estado do áudio (running/suspended/interrupted), reduced-motion, último gesto reconhecido e erros capturados — para pedir um print a quem testou |
| `?agora=2026-11-26T10:00` | Simula a data/hora ("É hoje" com explosão cósmica; `2026-11-27T10:00` mostra "Missão cumprida") |
| `?abrir=1` | Pula a abertura |
| `?teste=1` | Expõe `window.__convite` (poderes e acionar) para os testes |

### iPhone (Safari)

- **Som:** o iOS só libera o Web Audio dentro de um toque. O contexto é criado, retomado (`resume()`) e "destravado" com um buffer silencioso no primeiro `touchend` da abertura, de forma síncrona. Se o iOS suspender ou interromper o som (ligação, outro app, segundo plano), ele é retomado ao voltar para a aba e, se precisar, no próximo toque. A chave de silencioso do iPhone corta o Web Audio: na primeira visita aparece a dica "Ative o som do iPhone 🔊".
- **Gestos:** Touch Events passivos (no iPhone, Pointer Events recebem `pointercancel` assim que a página rola, e o gesto morreria). Toques a menos de 20 px das bordas laterais são ignorados (gesto de voltar do Safari). Sem vibração no iPhone: as chamadas são ignoradas sem erro.
- `node scripts/iphone.mjs` roda os testes no WebKit do Playwright emulando o iPhone 13 (`npx playwright install webkit` uma vez): abertura, os 6 gestos, borda, shader quebrado → 2D, chunk que não baixa → novas tentativas. O WebKit do Playwright no Windows/Linux não tem Web Audio: o som só dá para conferir num iPhone (com `?debug=1`).

### Scripts (Playwright, Chromium emulando Pixel 5)

```bash
npx playwright install chromium        # só na primeira vez
node scripts/ver.mjs                   # prints da abertura, hero e seções → screenshots/ver/
node scripts/contraste.mjs [--aparelho=360x740]   # contraste de todo texto contra o pior pixel do fundo
node scripts/comparar.mjs <rótulo>      # prints do hero e das seções no iPhone 13 e no 360x740 → screenshots/<rótulo>/
node scripts/fundo.mjs                 # prints da imagem de fundo das seções + confere o carregamento preguiçoso
node scripts/compacto.mjs <rótulo> [url]   # prints de Missão/Poderes/Aceitar missão + fontes, toque e quebras de linha
node scripts/lighthouse.mjs <rótulo> <url> <cli-do-lighthouse>   # uma rodada do Lighthouse (celular)
node scripts/quadros.mjs [--gestos] [--2d] [poder]   # cada poder quadro a quadro → screenshots/quadros/
node scripts/folha.mjs                 # junta os quadros de cada poder numa folha (_folha-<poder>.png)
node scripts/diag-motor.mjs [--gpu] [--2d]          # tempo de quadro de cada poder
npm run build && npm run preview       # (outro terminal) e então:
node scripts/perf-hero.mjs [--leve]    # FPS e tarefas longas do hero, CPU 4x mais lenta; trace em screenshots/desempenho/
node scripts/perf-camadas.mjs          # FPS do hero desligando uma camada por vez
```

## 6. Desempenho do hero

Medido com `scripts/perf-hero.mjs` (Chromium, Pixel 5 emulado, **CPU 4x mais lenta**, build de produção, hero parado por 6 s):

| Modo | FPS | Tarefas longas | Tempo bloqueado |
|---|---|---|---|
| Normal (forçado com `?modo=normal`) | 11,5 | 12 | 1,6 s |
| Leve, antes do ajuste | 12,3 | — | — |
| **Leve, depois do ajuste** | **58,8** | **0** | **0 ms** |

- Esse Chromium de teste compõe as camadas **sem GPU** (na CPU), por isso o modo normal fica tão baixo ali; num celular com GPU a folga é bem maior. Mesmo assim, **o convite se protege sozinho**: nos primeiros 4 s ele mede o FPS e, abaixo de 45, liga o modo leve (o `?modo=normal` existe só para medir sem essa troca).
- `scripts/perf-camadas.mjs` mostrou que nenhuma camada sozinha é a culpada: é a soma (sem nenhuma camada decorativa: ~52 fps). No modo leve, as que mais pesavam eram os raios de sol (`mix-blend-mode`), o grão, a aura do selo e a eletricidade do título.
- **O que o modo leve corta** (o normal continua igual): raios de sol parados e sem blend; céu e nuvens parados e sem desfoque; sem grão de filme; aura do selo parada e sem o reflexo; eletricidade do título em rajadas (~1 s a cada ~3 s, 2 arcos); brasas e poeira 6 + 8 (antes 8 + 12), desenhadas a ~30 fps.
- Enquanto um poder está ativo, as animações do fundo do hero (céu, nuvens, raios de sol, grão, brasas e eletricidade do título) ficam pausadas.
- Poderes: com GPU, ~55 fps (17–19 ms por quadro). Os shaders são compilados e "aquecidos" em segundo plano assim que o motor baixa, para o primeiro poder não travar (no Windows, o primeiro quadro caiu de 4,5 s para ~1 s; em celular a compilação costuma ser mais rápida).

## 7. Como funciona por dentro

```
index.html                 abertura em HTML/CSS puro (aparece na hora); paleta e emblema injetados pelo vite.config.ts
src/main.ts                entrada pequena: abertura + moldura no desktop
src/config/convite.ts      ← TODO o conteúdo
src/config/tema.ts         paleta → variáveis CSS (+ tons de texto AA)
src/intro/intro.ts         chuva, relâmpagos e o raio que abre o convite
src/components/
  cena/Cena.tsx            fundo fixo escuro e calmo (#05070D)
  cena/FundoSecoes.tsx     imagem de fundo das seções (fixa, parallax, carregamento preguiçoso)
  hero/Poster.tsx          pôster do hero: céu (lib/fx/ceu.ts, pintado num Worker), explosão de luz, contraluz, rochas (lib/fx/rochas.ts), brasas
  hero/                    Hero, Selo (emblema de metal), TituloEletrico
  sections/                Countdown, Missao, Poderes, Rsvp (credencial), Pix, Footer
src/poderes/               gestos, acionar, motor (chunk), sim, gl/, render2d, cartoes, catalogo, estado
src/lib/fx/                raio fractal, camada 2D (faíscas do dedo, clarão), atmosfera, pausa do fundo
src/lib/credencial.ts      credencial em PNG (canvas) e salvar/compartilhar
```

- Nenhuma imagem da internet: céu, emblema, cidade, mapa, mãos e efeitos são gerados por código.
- Sons gerados por Web Audio (`lib/sfx.ts`), respeitando o botão de mudo.
- No desktop, o próprio convite aparece num `<iframe>` dentro de uma moldura de celular.
