/**
 * Borboletas 3D (React Three Fiber). Carregado de forma lazy depois da intro.
 * Cada borboleta = corpo + 2 asas (planos com a textura gerada em wingArt.ts)
 * girando no eixo do corpo; shader iridescente muda a cor com o ângulo de visão.
 * As posições vêm da simulação compartilhada (butterflyField).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { field } from '../../lib/butterflyField'
import { VARIANTS, WING, WINGSPAN_UNITS, wingCanvas } from '../../lib/wingArt'
import { tilt } from '../../lib/tilt'
import { perf } from '../../lib/perf'
import { convite } from '../../config/convite'
import { renderState } from './EffectsLayer'

const POOL = 22
const FOV = 35
const CAM_Z = 10
const VIEW_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180)

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform sampler2D map;
  uniform float uTime;
  uniform vec3 cA;
  uniform vec3 cB;
  uniform vec3 cC;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  vec3 irid(float k) {
    k = fract(k);
    if (k < 0.333) return mix(cA, cB, k * 3.0);
    if (k < 0.666) return mix(cB, cC, (k - 0.333) * 3.0);
    return mix(cC, cA, (k - 0.666) * 3.0);
  }
  void main() {
    vec4 t = texture2D(map, vUv);
    if (t.a < 0.5) discard;
    float facing = abs(dot(normalize(vN), normalize(vV)));
    // a cor iridescente desliza conforme o ângulo da asa em relação à câmera
    float k = (1.0 - facing) * 1.4 + vUv.x * 0.35 + vW.x * 0.06 + uTime * 0.04;
    vec3 ir = irid(k);
    // metal holográfico: quanto mais de lado a asa, mais a cor desliza para ciano/rosa/lavanda
    float edge = pow(1.0 - facing, 1.4);
    vec3 col = mix(t.rgb, t.rgb * 0.7 + ir * 0.45, 0.12 + edge * 0.45);
    col += vec3(1.0) * pow(facing, 18.0) * 0.14;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

interface Rig {
  root: THREE.Group
  wingR: THREE.Group
  wingL: THREE.Group
  meshR: THREE.Mesh
  meshL: THREE.Mesh
}

function useRigs() {
  return useMemo(() => {
    const p = convite.paleta
    const geo = new THREE.PlaneGeometry(WING.W / WING.S, WING.H / WING.S)
    // pivô no corpo: o canvas tem o corpo em (OX, OY)
    geo.translate((WING.W / 2 - WING.OX) / WING.S, (WING.OY - WING.H / 2) / WING.S, 0)
    const uniforms = { uTime: { value: 0 } }
    const cA = new THREE.Color(p.holoCiano)
    const cB = new THREE.Color(p.holoRosa)
    const cC = new THREE.Color(p.lavanda)
    const mats = Array.from({ length: VARIANTS }, (_, v) => {
      const tex = new THREE.CanvasTexture(wingCanvas(v))
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      return new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        uniforms: { map: { value: tex }, uTime: uniforms.uTime, cA: { value: cA }, cB: { value: cB }, cC: { value: cC } },
      })
    })
    const bodyGeo = new THREE.CapsuleGeometry(2.4, 26, 4, 8)
    const bodyMat = new THREE.MeshBasicMaterial({ color: p.roxo })
    const group = new THREE.Group()
    const rigs: Rig[] = []
    for (let i = 0; i < POOL; i++) {
      const root = new THREE.Group()
      root.rotation.order = 'ZXY'
      const body = new THREE.Mesh(bodyGeo, bodyMat)
      body.position.y = -1
      const wingR = new THREE.Group()
      const wingL = new THREE.Group()
      const meshR = new THREE.Mesh(geo, mats[i % VARIANTS])
      const meshL = new THREE.Mesh(geo, mats[i % VARIANTS])
      meshL.scale.x = -1
      wingR.add(meshR)
      wingL.add(meshL)
      root.add(wingR, wingL, body)
      root.visible = false
      group.add(root)
      rigs.push({ root, wingR, wingL, meshR, meshL })
    }
    return { group, rigs, mats, uniforms }
  }, [])
}

function Swarm() {
  const { group, rigs, mats, uniforms } = useRigs()
  const { camera, size } = useThree()
  const fps = useRef({ start: -1, frames: 0, done: false })

  useEffect(() => {
    return () => {
      renderState.threeReady = false
    }
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t

    // medição de FPS: 2s depois de um aquecimento curto
    const f = fps.current
    if (!f.done) {
      if (t > 0.6 && f.start < 0) f.start = t
      if (f.start >= 0) {
        f.frames++
        if (t - f.start >= 2) {
          f.done = true
          const measured = f.frames / (t - f.start)
          if (measured < 45) perf.downgrade(`FPS ${measured.toFixed(0)}`)
        }
      }
    }

    // parallax pela inclinação do celular
    camera.position.x += (tilt.x * 0.6 - camera.position.x) * Math.min(1, dt * 5)
    camera.position.y += (-tilt.y * 0.6 - camera.position.y) * Math.min(1, dt * 5)
    camera.lookAt(0, 0, 0)

    const k = VIEW_H / size.height
    const list = field.butterflies
    for (let i = 0; i < POOL; i++) {
      const r = rigs[i]
      const b = list[i]
      if (!b) {
        r.root.visible = false
        continue
      }
      r.root.visible = true
      const mat = mats[b.variant % VARIANTS]
      if (r.meshR.material !== mat) {
        r.meshR.material = mat
        r.meshL.material = mat
      }
      r.root.position.set((b.x - size.width / 2) * k, -(b.y - size.height / 2) * k, b.z)
      const s = (b.size * k) / WINGSPAN_UNITS
      r.root.scale.setScalar(s)
      const perched = b.state === 'perched'
      // ZXY: guinada no plano da tela, depois arfagem e rolagem no eixo do corpo
      r.root.rotation.set(perched ? 0.25 : 0.55, Math.max(-0.6, Math.min(0.6, b.bank)), -b.heading - Math.PI / 2)
      const a = b.wing * 1.3
      r.wingR.rotation.y = -a
      r.wingL.rotation.y = a
    }
  })

  return <primitive object={group} />
}

export default function Butterflies3D() {
  const [visible, setVisible] = useState(!document.hidden)
  const [dpr, setDpr] = useState(Math.min(1.5, window.devicePixelRatio || 1))

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <Canvas
      className="fx-layer"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 31 }}
      dpr={dpr}
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 40 }}
      onCreated={() => {
        // a partir do primeiro frame o canvas 2D deixa de desenhar as borboletas
        requestAnimationFrame(() => (renderState.threeReady = true))
      }}
      aria-hidden="true"
    >
      {/* drei: reduz a resolução se o desempenho cair durante o uso */}
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(1.5, window.devicePixelRatio || 1))} />
      <Swarm />
    </Canvas>
  )
}
