import './index.css'
import { initIntro } from './intro/intro'
import { loadApp } from './lib/appLoader'
import { diag } from './lib/diag'

const html = document.documentElement

if (html.classList.contains('desk')) {
  import('./shell/desktop').then((m) => m.mountDesktop())
} else {
  initIntro()
  // ?abrir=1 (testes) pula a intro: carrega o app direto
  if (!document.getElementById('intro')) loadApp()
}

// ?debug=1: painel no canto com motor, áudio, reduced-motion, último gesto e erros
if (diag.ativo) import('./lib/painelDiag').then((p) => p.iniciarPainelDiag())
