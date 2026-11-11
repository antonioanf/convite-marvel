/**
 * ============================================================
 *  CONFIGURAÇÃO DO CONVITE
 *  Todo o conteúdo do convite vem deste arquivo.
 *  Procure por "TODO" para ver o que ainda falta preencher.
 * ============================================================
 */

export interface Foto {
  /** Caminho a partir de /public, ex.: "/fotos/foto-1.webp". */
  src?: string
  /** Versão menor (opcional), ex.: "/fotos/foto-1-600.webp" */
  srcPequena?: string
  /** Descrição da foto (acessibilidade). */
  alt: string
  largura?: number
  altura?: number
  /** Ponto de foco do recorte (CSS object-position), ex.: "50% 35%". */
  foco?: string
}

export interface Paleta {
  /** Fundo quase preto azulado (céu de tempestade) */
  fundo: string
  /** Fundo dos cartões (vidro escuro) */
  fundo2: string
  /** Aço (metal escovado, emblema) */
  aco: string
  /** Texto principal (branco frio) */
  branco: string
  /** Energia elétrica (raios, bordas) */
  eletrico: string
  /** Ciano (brilho de energia) */
  ciano: string
  /** Fogo (acento quente) */
  fogo: string
  /** Brasa (rachaduras, metal incandescente) */
  brasa: string
  /** Dourado (poeira cósmica, brasas do rodapé) */
  dourado: string
  /** Violeta e turquesa (magia e portal) */
  violeta: string
  turquesa: string
}

export interface ConviteConfig {
  crianca: {
    nome: string
    idade: number
    /** Frase curta que aparece no convite */
    frase: string
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
  /** Fotos da galeria. Desligada: o convite é todo gerado por código. */
  galeria: Foto[]
  /** Trilha e efeitos sonoros gerados por código. `false` = convite mudo (o botão some). */
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
    poderes: boolean
    rsvp: boolean
    pix: boolean
  }
  /** Usado nas meta tags (prévia do link no WhatsApp) */
  site: {
    /** Endereço final publicado, sem barra no final. Ex.: "https://missao-joao-lucas.vercel.app" */
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
  // { chave: 'sua-chave', tipo: 'Celular', titular: 'Nome do titular', mensagem: 'Sua presença é o nosso maior presente.' }
  pix: null,
  paleta: {
    fundo: '#05070C',
    fundo2: '#0B1220',
    aco: '#9AA6B6',
    branco: '#E9EEF5',
    eletrico: '#7FB8FF',
    ciano: '#22D3EE',
    fogo: '#FF7A1A',
    brasa: '#FF3D1A',
    dourado: '#FFB627',
    violeta: '#8B5CF6',
    turquesa: '#14B8C4',
  },
  secoes: {
    contagem: true,
    local: true,
    galeria: false,
    poderes: true,
    rsvp: true,
    pix: true,
  },
  site: {
    // TODO: endereço publicado (sem barra no final). Sem ele, a imagem da prévia no WhatsApp não aparece.
    url: '',
    titulo: 'João Lucas · 5 anos · Uma nova missão',
    descricao: 'Quinta-feira, 26 de novembro de 2026, às 15h · Enjoy Kids · Shopping Liv Mall. Venha comemorar comigo com muita aventura!',
    imagemOg: '/og.jpg',
  },
}
