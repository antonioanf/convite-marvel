# 🦋 Convite Borboleta — Anna Liz · 4 aninhos

Convite de aniversário em formato de site (uma página), feito para ser aberto **no celular** pelo link do WhatsApp.
Visual "iridescente tech": fundo perolado, gradientes holográficos, cartões em bento e borboletas metalizadas, tudo tirado das fotos do ensaio.

- Abertura com a borboleta de `originais/borboleta.png`: as asas abrem e o convite aparece em ~0,55 s depois do toque
- Hero com a foto principal em "cartão holográfico", que inclina com o giroscópio ou o dedo
- Borboletas 3D/2D que fogem do dedo, pousam na foto e **podem ser pegas** (meta: 10)
- Raspadinha prateada na data e velinhas para apagar segurando o dedo (ou soprando)
- Contagem regressiva, local e agenda, galeria com lightbox, confirmação pelo WhatsApp e Pix

**Lighthouse (mobile, build de produção, Lighthouse 13.6):** Performance 88 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 3,2 s).

---

## 1. Começando

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
npm run dev            # abre em http://localhost:5173
npm run build          # gera a pasta dist/ para publicar
npm run preview        # testa o build em http://localhost:4173
```

## 2. O que falta preencher (TODOs)

Tudo fica em **`src/config/convite.ts`**. Procure por `TODO`:

| Campo | O que colocar | Enquanto estiver vazio… |
|---|---|---|
| `festa.endereco` | Ex.: `'Rua Tal, 123 – Bairro, Cidade-PB'` | Aparece "Endereço completo em breve" |
| `festa.linkMapa` | Link do Google Maps (no app: Compartilhar → Copiar link) | O botão "Como chegar" não aparece |
| `rsvp.whatsapp` | Só dígitos, com 55 + DDD: `'5583999999999'` | A confirmação mostra o aviso "WhatsApp ainda não configurado" |
| `rsvp.prazo` | Data limite: `'2027-05-01'` | Some a frase "Confirme até…" |
| `assinatura` | Ex.: `'Com amor, papai e mamãe'` | O rodapé mostra só "Esperamos você!" |
| `pix` | Troque `null` pelo objeto do exemplo comentado | A seção de presentes não aparece |
| `site.url` | Endereço publicado, sem barra no final | **A imagem da prévia no WhatsApp não aparece** |

O horário já está definido: `festa.dataHora` é `2027-05-16T16:00:00-03:00` e `horarioDefinido` é `true`. O cartão mostra 16:00 e a agenda (Google e `.ics`) cria o evento das 16:00 às 20:00 (`duracaoHoras: 4`). Se um dia voltar a ser "a definir", basta pôr `horarioDefinido: false`: o convite mostra "A definir" e a agenda vira evento de dia inteiro.

Depois de mudar data, nome ou local, gere de novo a imagem de prévia: `npm run og`. A imagem (`public/og.jpg`, 1200×630) tem a foto principal, "Anna Liz", "4 aninhos" e a data; o quadrado do meio (foto + nome + data + "4") funciona sozinho na miniatura pequena do WhatsApp.

A borboleta da abertura sai de `originais/borboleta.png`: `npm run borboleta` (ou `npm run borboleta -- 400 60` para escolher largura e qualidade). O original atual tem só 294 px; com um de 600 px ou mais ela fica mais nítida em telas 3x.

## 3. Publicar na Vercel (e atualizar o `site.url`)

1. O projeto já está no repositório privado `https://github.com/antonioanf/convite-borboleta` (branch `main`). Envie o que estiver só no computador com `git push`.
2. Em [vercel.com](https://vercel.com), entre com a conta do GitHub, clique em **Add New → Project**, autorize o acesso ao repositório `convite-borboleta` (se ele não aparecer: **Adjust GitHub App Permissions** e marque o repositório) e clique em **Deploy**. O Vite é detectado sozinho (build `npm run build`, saída `dist`).
3. Copie o endereço que a Vercel mostrar, ex.: `https://convite-borboleta.vercel.app`.
   Para um nome mais bonito: **Settings → Domains** (dá para trocar o subdomínio `.vercel.app`).
4. No `convite.ts`, coloque esse endereço em `site.url` (sem barra no final).
5. Rode `npm run og`, faça commit e `git push`. A Vercel publica de novo sozinha em ~1 minuto.
6. Teste a prévia colando o link num chat do WhatsApp. Se a imagem antiga ainda aparecer (cache do WhatsApp), envie com `?v=2` no final.

Sem GitHub: `npx vercel` dentro da pasta (e `npx vercel --prod` para publicar a versão final).

## 4. Paleta (tirada das fotos)

Fica em `convite.paleta`. Os tons de **texto** são calculados em `src/config/tema.ts` (misturas com o roxo profundo) para passar no contraste AA.

| Nome no config | Cor | De onde vem |
|---|---|---|
| `perola` | `#F6F2FA` | parede clara do estúdio (fundo) |
| `lavanda` | `#E4D4F7` | balões claros |
| `lilas` | `#C3A3EE` | vestido / balões médios |
| `violeta` | `#8B5CF6` | balões mais fortes |
| `roxo` | `#3B1C6E` | sombras dos balões — **texto principal** |
| `rosa` | `#F48FB8` | glacê do bolo |
| `magenta` | `#E0428A` | borboleta rosa / número do bolo (acento) |
| `prata`, `holoCiano`, `holoRosa` | `#E9E6F2`, `#A5F3FC`, `#F9A8D4` | balões metalizados (gradiente holográfico) |

## 5. Tipografia

Servidas pelo próprio site (`public/fonts/`, vindas do `@fontsource`), com `preload` e `font-display: swap`:

- **Instrument Serif** (itálico): nome e títulos
- **Manrope** (variável 200–800): textos
- **JetBrains Mono** (variável): números, data, contagem e rótulos em caixa alta

> Nos screenshots do **WebKit do Playwright no Windows**, a Manrope aparece toda fina: esse WebKit de teste não aplica pesos de fontes variáveis. No Chrome e no Safari de verdade (iPhone) os pesos aparecem certos.

## 6. Fotos

As originais ficam em `originais/` e são convertidas para WebP com:

```bash
npm run fotos     # gera public/fotos/<nome>.webp (até 1200 px) e <nome>-600.webp
```

| Arquivo | Onde aparece |
|---|---|
| `anna-deitada` | **Hero** (foto principal) e galeria |
| `anna-girando` | Cartão largo da idade (formato original, sem recorte) e galeria |
| `anna-bolo` | Seção "Sopre as velinhas" e galeria |
| `anna-balao3` | Só na galeria |

- Cada foto tem `largura`, `altura` e `foco` (ponto do recorte, CSS `object-position`) no config.
- Nenhuma foto tem legenda visível; a descrição fica só no `alt`.
- As fotos atuais vieram com só ~890 px de largura (comprimidas pelo WhatsApp). Quando chegarem as do estúdio em alta, coloque-as em `originais/` com os mesmos nomes e rode `npm run fotos`.

## 7. Música e sons

- `musica: '/musica/caixinha-de-musica.mp3'` (ou `null` para não ter música nem efeitos sonoros).
- A música só começa depois do toque de abertura, com fade-in.
- Os efeitos (brilho, sininho, "pop") são gerados por código (Web Audio) e respeitam o botão de mudo.

## 8. Interações

| Interação | Como funciona | Fallback |
|---|---|---|
| Rastro de brilho | Arrastar o dedo deixa estrelinhas (~0,6 s) | Máx. 120 partículas (60 no modo leve) |
| Toque solta borboletas | Toque rápido numa área vazia → 2–3 borboletas + vibração | — |
| Pegue as borboletas | Tocar numa borboleta → brilho + contador `n/10`; outra entra em 2–4 s; aos 10, mensagem surpresa | Funciona no 2D e no 3D |
| Foto holográfica | Inclina até 8° com o giroscópio (ou o dedo/mouse) | Parada com reduced-motion |
| Raspadinha da data | Raspar ~60% completa sozinha, com brilho e confete. O cartão tem `touch-action: none`: raspar **não rola a página** | Já revelada com reduced-motion; a data está sempre no HTML; botão "Revelar" para teclado |
| Velinhas | Segurar ~1,3 s (ou Espaço/Enter) apaga; opcional "usar microfone" para soprar | Se negar o microfone, segurar continua funcionando |
| Contagem | Números que viram, bolinha "ao vivo"; no dia vira "É hoje!" | — |
| Confirmação ("Você vem?") | Nome e recado opcional (sem número de pessoas); o botão vira check, borboletas + confete e abre o WhatsApp com a mensagem pronta | Aviso se o WhatsApp não estiver configurado |

### O que saiu

- O campo "quantas pessoas" do "Você vem?" (e a linha correspondente na mensagem do WhatsApp).
- A seção e o botão "Compartilhe o convite".
- As legendas visíveis das fotos (o texto continua no `alt`, para leitores de tela).
- O rótulo "Convite · Nº 04" da abertura, do hero e da imagem de prévia.
- O easter egg de chacoalhar o celular (`lib/shake.ts`, a dica "Psiu…" e o pedido de permissão de movimento). A inclinação da foto principal continua (usa o giroscópio, outro sensor).
- A borboleta da abertura desenhada em código: agora é a imagem `originais/borboleta.png` (`npm run borboleta`).

## 9. Testes

### Parâmetros na URL

| Parâmetro | Efeito |
|---|---|
| `?modo=leve` / `?modo=3d` | Força as borboletas 2D / 3D |
| `?agora=2027-05-16T10:00` | Simula a data/hora atual ("É hoje!"; `2027-05-17T10:00` mostra o agradecimento) |
| `?abrir=1` | Pula a intro |
| `?teste=1` | Expõe `window.__convite` para os testes automáticos |

### Automáticos (Playwright)

```bash
npx playwright install chromium webkit   # só na primeira vez
npm run dev                               # em outro terminal
npm run shots -- --video                  # screenshots: iPhone 13, Pixel 5, 360x740, 430x932
npm run testes                            # testes de interação
```

`npm run testes` cobre: intro, horário e agenda, raspadinha (inclusive que raspar com o dedo não rola a página), velinhas (toque curto não apaga, segurar apaga), pegar 10 borboletas nos modos leve e 3D, toque que solta borboletas, lightbox, RSVP, Pix, `.ics` e os estados da contagem. Os resultados ficam em `screenshots/`.

### Desempenho (`npm run perf`)

```bash
npm run build && npm run preview          # em outro terminal (http://localhost:4173)
npm run perf                              # ou: npm run perf -- http://localhost:4173/ screenshots/desempenho 3
```

Abre o convite no Chromium emulando um Pixel 5 com a **CPU 4x mais lenta** e mede três fases: abertura (carregar + tocar na intro), scroll do convite inteiro com o dedo e interações (toques, rastro de brilho, raspadinha, velinhas). Para cada fase mostra as tarefas longas (> 50 ms), o tempo bloqueado e o FPS médio (mediana das rodadas), e grava o trace de cada rodada em `screenshots/desempenho/` (abre no DevTools → Performance → *Load profile*).

**Antes e depois da rodada de desempenho** (Pixel 5 emulado, CPU 4x mais lenta, mediana de 2 rodadas; "antes" é o commit `7fff1bb`, "depois" é a versão atual):

| Fase | Tarefas longas (antes → depois) | Tempo bloqueado | Maior tarefa | FPS médio | Quadros lentos (> 50 ms) |
|---|---|---|---|---|---|
| Abertura | 8,5 → 7 | 956 → 899 ms | 461 → 344 ms | 24,5 → 38,5 | 16 → 8,5 |
| Scroll do convite | 53,5 → **4** | 315 → **15** ms | 93 → 59 ms | 23,3 → 29,4 | 106,5 → **26** |
| Interações | 7 → 2,5 | 84 → 97 ms | 105 → 118 ms | 27,3 → 37,5 | 59,5 → 11,5 |

O FPS fica abaixo de 60 porque a CPU está 4x mais lenta de propósito; num celular de verdade a folga é maior.

## 10. Como funciona por dentro

```
index.html                 intro em HTML/CSS puro (borboleta embutida como imagem): aparece instantaneamente
src/main.ts                entrada pequena: intro + moldura no desktop
src/config/convite.ts      ← TODO o conteúdo
src/config/tema.ts         paleta → variáveis CSS (+ tons de texto com contraste AA)
src/lib/
  butterflyField.ts        simulação das borboletas (voo, fuga do dedo, pouso, captura)
  wingArt.ts               textura metalizada da asa (a mesma no 3D e no 2D)
  holo.ts                  ângulo do brilho holográfico (inclinação + scroll)
  sfx.ts                   efeitos sonoros
  celebrate.ts             confete + borboletas
  datas.ts, calendar.ts    datas formatadas, Google Agenda e .ics (dia inteiro se o horário não estiver definido)
src/components/
  effects/                 Mesh (fundo), EffectsLayer (canvas 2D), Butterflies3D (R3F, lazy)
  sections/                Hero, Destaque, Countdown, Details, Gallery, Lightbox, Velinhas, Rsvp, Pix, Footer
  fun/                     Scratch, Candles, CatchCounter, ProgressBar
  ui/                      Card, HoloPhoto, Press, Icons, Cake, Photo, BottomBar, MusicButton...
```

- **Uma simulação e dois desenhos:** `butterflyField.ts` calcula as borboletas; a cena 3D e o canvas 2D só desenham.
- **Pouso:** elementos com `data-perch="fx,fy,ângulo;..."` viram lugar de pouso (hoje, a moldura da foto principal).
- **Modo leve automático:** com `hardwareConcurrency ≤ 4`, `deviceMemory ≤ 4`, sem WebGL, FPS < 45 na cena 3D ou economia de dados.
- **Desempenho** (detalhes e números em `npm run perf`, seção 9):
  - DPR máximo 1,5; 3D só depois da intro; o canvas 2D descansa quando não há nada para desenhar.
  - Animações contínuas só com `transform`/`opacity` (as entradas dos cartões e as letras do nome não animam mais `filter: blur`).
  - Nada lê o layout no meio de um quadro: a posição do scroll é lida uma vez no evento de scroll (`lib/scrollPos.ts`), a barra de progresso só mede a altura da página quando ela muda, o pouso das borboletas mede a foto no máximo a cada 0,25 s.
  - Poucas camadas: o fundo mesh é uma camada animada só (as 4 manchas num elemento) e o grão faz parte do fundo; o brilho que segue o dedo (`.spot`) não tem `will-change`; o `backdrop-filter` ficou só na pill de baixo.
  - O brilho holográfico só é atualizado nos elementos visíveis, e as animações CSS das seções fora da tela ficam pausadas.
- **Desktop:** o próprio convite aparece num `<iframe>` dentro de uma moldura de celular.

### Bibliotecas

Runtime: Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, GSAP + ScrollTrigger, Lenis, React Three Fiber + drei, canvas-confetti (baixado só na primeira comemoração).
Só para desenvolvimento: Playwright (testes e imagem OG), `@fontsource` (fontes), `sharp` (conversão das fotos e da borboleta da abertura).
