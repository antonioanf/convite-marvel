/**
 * ============================================================
 *  CONFIGURAÇÃO DO CONVITE
 *  Todo o conteúdo do convite vem deste arquivo.
 *  Para um novo cliente, edite só aqui (e as fotos em /public/fotos).
 *
 *  Procure por "TODO" para ver o que ainda falta preencher.
 * ============================================================
 */

export interface Foto {
  /** Caminho a partir de /public, ex.: "/fotos/joao-heroi.webp". */
  src?: string
  /** Versão menor (opcional), ex.: "/fotos/joao-heroi-600.webp" */
  srcPequena?: string
  /** Descrição da foto (acessibilidade). */
  alt: string
  /** Tamanho original em px (evita "pulos" no carregamento). */
  largura?: number
  altura?: number
  /** Ponto de foco do recorte (CSS object-position), ex.: "50% 35%". */
  foco?: string
}

export interface Paleta {
  /** Vermelho herói (faixa do título, botões principais) */
  vermelho: string
  /** Azul royal (pontas da faixa, uniforme) */
  azul: string
  /** Azul-marinho: cor do texto principal e dos contornos (no lugar do preto) */
  marinho: string
  /** Amarelo herói (explosões, destaques) */
  amarelo: string
  /** Azul-céu (fundo) */
  ceu: string
  branco: string
  /** Ciano neon: só para efeitos de energia e HUD */
  ciano: string
}

export interface ConviteConfig {
  crianca: {
    nome: string
    idade: number
    /** Frase curta que aparece no convite */
    frase: string
  }
  heroi: {
    /** Nome de herói, ex.: "Super João Lucas" */
    nome: string
    /**
     * Foto do hero (opcional). Preenchida = a foto aparece num quadro de HQ com a explosão "5 ANOS!".
     * Vazia (`null`) = aparece o herói ilustrado em SVG.
     */
    foto: Foto | null
  }
  festa: {
    /** Data e hora no formato ISO com fuso, ex.: "2026-11-26T15:00:00-03:00" */
    dataHora: string
    /**
     * `false` enquanto o horário não estiver decidido: o convite mostra "horário a definir"
     * e a agenda (.ics / Google) vira um evento de dia inteiro.
     */
    horarioDefinido: boolean
    /** Duração aproximada (usada na agenda e para saber quando a festa acabou) */
    duracaoHoras: number
    /** Fuso usado para exibir data/hora (IANA) */
    fusoHorario: string
    local: string
    /** Vazio = "Endereço completo em breve" */
    endereco: string
    /** Link do Google Maps (botão "Como chegar"). Vazio = botão escondido */
    linkMapa: string
  }
  rsvp: {
    /** WhatsApp dos pais: só dígitos, com DDI e DDD. Ex.: 5585999999999. Vazio = aviso no lugar do envio */
    whatsapp: string
    /** Data limite para confirmar (ISO), ex.: "2026-11-20". Vazio = sem prazo */
    prazo: string
  }
  /** Assinatura no rodapé, ex.: "Com carinho, papai e mamãe". Vazio = linha escondida */
  assinatura: string
  /** Fotos da galeria (quadros de HQ). Só aparece com `secoes.galeria: true`. */
  galeria: Foto[]
  /** Música e efeitos sonoros gerados por código. `false` = convite mudo (o botão some). */
  musica: boolean
  /** Pix para presentes. `null` = seção escondida. */
  pix: {
    chave: string
    /** Ex.: "CPF", "E-mail", "Celular", "Aleatória" */
    tipo: string
    titular: string
    mensagem: string
  } | null
  paleta: Paleta
  secoes: {
    contagem: boolean
    local: boolean
    galeria: boolean
    arena: boolean
    rsvp: boolean
    pix: boolean
  }
  /** Usado nas meta tags (prévia do link no WhatsApp) */
  site: {
    /** Endereço final publicado, sem barra no final. Ex.: "https://super-joao-lucas.vercel.app" */
    url: string
    titulo: string
    descricao: string
    /** Imagem 1200x630 em /public */
    imagemOg: string
  }
}

export const convite: ConviteConfig = {
  crianca: {
    nome: 'João Lucas',
    idade: 5,
    frase: 'Venha comemorar comigo com muita aventura!',
  },
  heroi: {
    nome: 'Super João Lucas',
    // Quando chegar a foto do João Lucas fantasiado: coloque em originais/, rode `npm run fotos` e troque `null` por:
    // { src: '/fotos/joao-heroi.webp', srcPequena: '/fotos/joao-heroi-600.webp', alt: 'João Lucas fantasiado de super-herói', largura: 1200, altura: 1600, foco: '50% 30%' }
    foto: null,
  },
  festa: {
    dataHora: '2026-11-26T15:00:00-03:00',
    horarioDefinido: true,
    duracaoHoras: 3,
    fusoHorario: 'America/Fortaleza',
    local: 'Enjoy Kids · Shopping Liv Mall',
    // TODO: endereço completo, ex.: 'Av. Tal, 123 – Bairro, Cidade-CE'
    endereco: '',
    // TODO: link do Google Maps (abra o local no Maps → Compartilhar → Copiar link)
    linkMapa: '',
  },
  rsvp: {
    // TODO: WhatsApp de quem recebe as confirmações (só dígitos, com 55 + DDD), ex.: '5585999999999'
    whatsapp: '',
    // TODO: data limite para confirmar, ex.: '2026-11-22'
    prazo: '',
  },
  // TODO: assinatura do rodapé, ex.: 'Com carinho, papai e mamãe'
  assinatura: '',
  galeria: [],
  musica: true,
  // TODO: Pix para presentes. Para mostrar a seção, troque `null` por:
  // { chave: 'sua-chave', tipo: 'Celular', titular: 'Nome do titular', mensagem: 'Sua presença é o nosso maior presente! 💙' }
  pix: null,
  paleta: {
    vermelho: '#E63946',
    azul: '#1D4ED8',
    marinho: '#0B1F4D',
    amarelo: '#FFD60A',
    ceu: '#BFE3FF',
    branco: '#FFFFFF',
    ciano: '#22D3EE',
  },
  secoes: {
    contagem: true,
    local: true,
    galeria: false,
    arena: true,
    rsvp: true,
    pix: true,
  },
  site: {
    // TODO: endereço publicado (sem barra no final). Sem ele, a imagem da prévia no WhatsApp não aparece.
    url: '',
    titulo: 'Super João Lucas · 5 anos',
    descricao: 'Quinta-feira, 26 de novembro de 2026 · Enjoy Kids · Shopping Liv Mall. Venha comemorar comigo com muita aventura! ⚡',
    imagemOg: '/og.jpg',
  },
}
