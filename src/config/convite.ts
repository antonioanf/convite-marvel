/**
 * ============================================================
 *  CONFIGURAÇÃO DO CONVITE
 *  Todo o conteúdo do convite vem deste arquivo.
 *  Para um novo cliente, edite só aqui e troque os arquivos
 *  em /public (fotos e música).
 *
 *  Procure por "TODO" para ver o que ainda falta preencher.
 * ============================================================
 */

export interface Foto {
  /** Caminho a partir de /public, ex.: "/fotos/ensaio-1.webp". Sem `src` = placeholder bonito. */
  src?: string
  /** Versão menor para o carrossel (opcional), ex.: "/fotos/ensaio-1-600.webp" */
  srcPequena?: string
  /** Descrição da foto (acessibilidade). */
  alt: string
  /** Tamanho original em px (evita "pulos" no carregamento e define o formato no carrossel). */
  largura?: number
  altura?: number
  /** Ponto de foco do recorte (CSS object-position), ex.: "50% 35%" = rosto um pouco acima do meio. */
  foco?: string
}

export interface Paleta {
  /** Fundo perolado (parede clara do estúdio) */
  perola: string
  /** Lavanda clara (balões claros) */
  lavanda: string
  /** Lilás (vestido / balões médios) */
  lilas: string
  /** Violeta (balões mais fortes) */
  violeta: string
  /** Roxo profundo: cor do texto principal (no lugar do preto) */
  roxo: string
  /** Rosa (glacê do bolo) */
  rosa: string
  /** Magenta: acento (borboleta rosa / número do bolo) */
  magenta: string
  /** Prata iridescente (balões metalizados) + os dois toques do gradiente holográfico */
  prata: string
  holoCiano: string
  holoRosa: string
}

export interface ConviteConfig {
  crianca: {
    nome: string
    idade: number
    /** Frase curta que aparece no convite */
    frase: string
  }
  festa: {
    /** Data e hora no formato ISO com fuso, ex.: "2027-05-16T16:00:00-03:00" */
    dataHora: string
    /**
     * `false` enquanto o horário não estiver decidido: o convite mostra "horário a definir"
     * e a agenda (.ics / Google) vira um evento de dia inteiro. A contagem usa o horário de `dataHora`.
     */
    horarioDefinido: boolean
    /** Duração aproximada (usada na agenda e para saber quando a festa acabou) */
    duracaoHoras: number
    /** Fuso usado para exibir data/hora (IANA) */
    fusoHorario: string
    local: string
    /** Vazio = linha escondida */
    endereco: string
    /** Link do Google Maps (botão "Como chegar"). Vazio = botão escondido */
    linkMapa: string
  }
  rsvp: {
    /** WhatsApp dos pais: só dígitos, com DDI e DDD. Ex.: 5583999999999. Vazio = aviso no lugar do envio */
    whatsapp: string
    /** Data limite para confirmar (ISO), ex.: "2027-05-01". Vazio = sem prazo */
    prazo: string
  }
  /** Assinatura no rodapé, ex.: "Com amor, papai e mamãe". Vazio = linha escondida */
  assinatura: string
  /** Foto principal (hero) */
  fotoPrincipal: Foto
  /** Foto horizontal do cartão da idade */
  fotoDestaque: Foto
  /** Foto vertical da seção das velinhas */
  fotoBolo: Foto
  galeria: Foto[]
  /** Caminho do mp3 em /public. `null` = sem música (o botão e os efeitos sonoros somem). */
  musica: string | null
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
    velinhas: boolean
    rsvp: boolean
    pix: boolean
  }
  /** Usado nas meta tags (prévia do link no WhatsApp) */
  site: {
    /** Endereço final publicado, sem barra no final. Ex.: "https://convite-anna-liz.vercel.app" */
    url: string
    titulo: string
    descricao: string
    /** Imagem 1200x630 em /public */
    imagemOg: string
  }
}

const deitada: Foto = {
  src: '/fotos/anna-deitada.webp',
  srcPequena: '/fotos/anna-deitada-600.webp',
  alt: 'Anna Liz deitada no chão, sorrindo com as mãos no rosto, de tiara de flores e vestido lilás, com balões lilás ao fundo',
  largura: 890,
  altura: 1600,
  foco: '50% 70%',
}
const girando: Foto = {
  src: '/fotos/anna-girando.webp',
  srcPequena: '/fotos/anna-girando-600.webp',
  alt: 'Anna Liz rodopiando com o vestido lilás, entre balões lilás e grandes borboletas metalizadas',
  largura: 1200,
  altura: 1048,
  foco: '40% 50%',
}
const bolo: Foto = {
  src: '/fotos/anna-bolo.webp',
  srcPequena: '/fotos/anna-bolo-600.webp',
  alt: 'Anna Liz de tiara olhando sorridente para o seu bolo cor-de-rosa com uma borboleta escrita Anna Liz',
  largura: 888,
  altura: 1600,
  foco: '50% 97%',
}
const balao3: Foto = {
  src: '/fotos/anna-balao3.webp',
  srcPequena: '/fotos/anna-balao3-600.webp',
  alt: 'Anna Liz deitada com a mão no rosto entre balões roxos metalizados e flores de balão',
  largura: 1195,
  altura: 1062,
  foco: '0% 50%',
}

export const convite: ConviteConfig = {
  crianca: {
    nome: 'Anna Liz',
    idade: 4,
    frase: 'Vem voar comigo nos meus 4 aninhos!',
  },
  festa: {
    dataHora: '2027-05-16T16:00:00-03:00',
    horarioDefinido: true,
    duracaoHoras: 4,
    fusoHorario: 'America/Fortaleza',
    local: 'Chácara São Pedro',
    // TODO: endereço completo, ex.: 'Rua Tal, 123 – Bairro, Cidade-PB'
    endereco: '',
    // TODO: link do Google Maps (abra o local no Maps → Compartilhar → Copiar link)
    linkMapa: '',
  },
  rsvp: {
    // TODO: WhatsApp de quem recebe as confirmações (só dígitos, com 55 + DDD), ex.: '5583999999999'
    whatsapp: '',
    // TODO: data limite para confirmar, ex.: '2027-05-01'
    prazo: '',
  },
  // TODO: assinatura do rodapé, ex.: 'Com amor, papai e mamãe'
  assinatura: '',
  fotoPrincipal: deitada,
  fotoDestaque: girando,
  fotoBolo: bolo,
  galeria: [deitada, girando, bolo, balao3],
  musica: '/musica/caixinha-de-musica.mp3',
  // TODO: Pix para presentes. Para mostrar a seção, troque `null` por:
  // { chave: 'sua-chave', tipo: 'Celular', titular: 'Nome do titular', mensagem: 'Sua presença é o nosso maior presente! 💜' }
  pix: null,
  paleta: {
    perola: '#F6F2FA',
    lavanda: '#E4D4F7',
    lilas: '#C3A3EE',
    violeta: '#8B5CF6',
    roxo: '#3B1C6E',
    rosa: '#F48FB8',
    magenta: '#E0428A',
    prata: '#E9E6F2',
    holoCiano: '#A5F3FC',
    holoRosa: '#F9A8D4',
  },
  secoes: {
    contagem: true,
    local: true,
    galeria: true,
    velinhas: true,
    rsvp: true,
    pix: true,
  },
  site: {
    // TODO: endereço publicado (sem barra no final). Sem ele, a imagem da prévia no WhatsApp não aparece.
    url: '',
    titulo: 'Anna Liz · 4 aninhos',
    descricao: 'Domingo, 16 de maio de 2027 · Chácara São Pedro. Vem voar comigo nos meus 4 aninhos! 🦋',
    imagemOg: '/og.jpg',
  },
}
