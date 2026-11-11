import './index.css'
import { initIntro } from './intro/intro'
import { loadApp } from './lib/appLoader'

const html = document.documentElement

if (html.classList.contains('desk')) {
  import('./shell/desktop').then((m) => m.mountDesktop())
} else {
  initIntro()
  // ?abrir=1 (testes) pula a intro: carrega o app direto
  if (!document.getElementById('intro')) loadApp()
}
