import { startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

// startTransition: a primeira montagem é feita em pedacinhos (o React cede a vez ao navegador),
// então montar o app atrás da intro não trava a animação nem o toque.
const root = createRoot(document.getElementById('root')!)
startTransition(() => root.render(<App />))
