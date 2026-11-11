import { useEffect, useState, useSyncExternalStore } from 'react'
import { appState } from '../lib/appState'
import { perf } from '../lib/perf'
import { som } from '../lib/audio'
import { now } from '../lib/debug'

export const useOpened = () => useSyncExternalStore(appState.subscribe, appState.isOpened)
export const useLite = () => useSyncExternalStore(perf.subscribe, perf.isLite)
export const useMuted = () => useSyncExternalStore(som.subscribe, som.isMuted)
export const useMusicPlaying = () => useSyncExternalStore(som.subscribe, som.isMusicPlaying)

/** Relógio que atualiza a cada `ms` (respeita ?agora= para testes). */
export function useNow(ms = 1000) {
  const [t, setT] = useState(now)
  useEffect(() => {
    const id = setInterval(() => setT(now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return t
}
