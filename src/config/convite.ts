/**
 * ============================================================
 *  CONFIGURAÇÃO DO CONVITE
 *  Todo o conteúdo do convite vem deste arquivo.
 *  Procure por "TODO" para ver o que ainda falta preencher.
 * ============================================================
 */

/**
 * Paleta de filme de super-herói: o fundo escuro é só a base para as cores de luz brilharem.
 * Os tons de TEXTO (com contraste AA) são calculados em src/config/tema.ts.
 */
export interface Paleta {
  /** Base escura (azul-noite profundo) */
  fundo: string
  /** Fundo dos cartões (vidro escuro) */
  fundo2: string
  /** Aço (metal escovado, emblema) */
  aco: string
  /** Texto principal (branco quente) */
  branco: string
  /** Vermelho intenso (acento principal, reflexos do metal) */
  vermelho: string
  /** Dourado (5 ANOS, poeira cósmica, brasas do rodapé) */
  dourado: string
  /** Azul elétrico (raios, tempestade) */
  azul: string
  /** Ciano de energia (eletricidade, contagem) */
  ciano: string
  /** Roxo cósmico (rasgos do céu, magia) */
  roxo: string
  /** Laranja de fogo (rajada, impacto, nuvens iluminadas) */
  fogo: string
  /** Azul claro do brilho do raio (bordas de energia, foco) */
  eletrico: string
  /** Brasa (rachaduras, metal incandescente) */
  brasa: string
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
  musica: true,
  // TODO: Pix para presentes. Para mostrar a seção, troque `null` por:
  // { chave: 'sua-chave', tipo: 'Celular', titular: 'Nome do titular', mensagem: 'Sua presença é o nosso maior presente.' }
  pix: null,
  paleta: {
    fundo: '#07081A',
    fundo2: '#0E1030',
    aco: '#A7B0BE',
    branco: '#FFF6EC',
    vermelho: '#E62429',
    dourado: '#F5B700',
    azul: '#1E90FF',
    ciano: '#22D3EE',
    roxo: '#7B2FF7',
    fogo: '#FF6A00',
    eletrico: '#7FC4FF',
    brasa: '#FF3D1A',
    violeta: '#9B5CFF',
    turquesa: '#14C8C4',
  },
  secoes: {
    contagem: true,
    local: true,
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
