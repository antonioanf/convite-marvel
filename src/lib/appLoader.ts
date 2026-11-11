/**
 * O app React é montado atrás da intro: o arquivo é baixado em segundo plano
 * (<link rel="prefetch"> gerado no build) e executado quando o celular fica livre
 * depois do load (ou no primeiro toque, o que vier antes). A promessa resolve
 * quando a primeira montagem terminou, ou seja, quando dá para mostrar o convite.
 */
import { appState } from './appState'

let p: Promise<void> | null = null
export const loadApp = () => (p ??= import('../app/mount').then(() => appState.whenMounted()))
