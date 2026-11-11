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
  /** Ciano neon: só para brilhos de energia */
  ciano: string
  /** Acentos de cada herói da equipe (Faísca, Tremor, Turbo, Astra) */
  turquesa: string
  mostarda: string
  fogo: string
  lilas: string
  /** Dourado (raios de luz, partículas, pôr do sol) */
  dourado: string
}

export interface ConviteConfig {
  crianca: {
    nome: string
    idade: number
    /** Frase curta que aparece no convite */
    frase: string
  }
  equipe: {
    /** Nome da equipe de heróis, ex.: "Equipe JL" */
    nome: string
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
  /** Fotos da galeria (quadros de HQ). Desligada: o convite é todo ilustrado. */
  galeria: Foto[]
  /** Tema heroico e efeitos sonoros gerados por código. `false` = convite mudo (o botão some). */
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
    /** Endereço final publicado, sem barra no final. Ex.: "https://equipe-jl.vercel.app" */
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
  equipe: {
    nome: 'Equipe JL',
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
    turquesa: '#14B8C4',
    mostarda: '#D9A21B',
    fogo: '#FF7A1A',
    lilas: '#B794F6',
    dourado: '#FFB627',
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
    titulo: 'João Lucas faz 5 anos · Junte-se à Equipe JL!',
    descricao: 'Quinta-feira, 26 de novembro de 2026 · Enjoy Kids · Shopping Liv Mall. Venha comemorar comigo com muita aventura!',
    imagemOg: '/og.jpg',
  },
}
