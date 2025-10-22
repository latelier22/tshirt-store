// components/config3d/Canvas3D.tsx
'use client'

import { useRef, PropsWithChildren } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  useTexture,
  AccumulativeShadows,
  RandomizedLight,
  Decal,
  Environment,
  Center,
} from '@react-three/drei'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import * as THREE from 'three'
import { state } from './store'

export default function Configurator3D({
  position = [0, 0, 2.5],
  fov = 25,
}: { position?: [number, number, number]; fov?: number }) {
  return (
    <Canvas
      shadows
      camera={{ position, fov }}
      gl={{ preserveDrawingBuffer: true }}
      className="absolute inset-0"
    >
      <ambientLight intensity={0.5 * Math.PI} />
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
      <CameraRig>
        <Backdrop />
        <Center>
          <Shirt />
        </Center>
      </CameraRig>
    </Canvas>
  )
}

function Backdrop() {
  const shadows = useRef<any>(null)
  const snap = useSnapshot(state)

  useFrame((_, delta) => {
    const mesh = shadows.current?.getMesh?.()
    const mat = mesh?.material as THREE.Material & { color?: THREE.Color }
    if (!mat?.color) return
    const target = new THREE.Color(snap.color)
    easing.dampC(mat.color, target, 0.25, delta)
  })

  return (
    <AccumulativeShadows
      ref={shadows}
      temporal
      frames={60}
      alphaTest={0.85}
      scale={5}
      resolution={2048}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -0.14]}
    >
      <RandomizedLight amount={4} radius={9} intensity={0.55 * Math.PI} ambient={0.25} position={[5, 5, -10]} />
      <RandomizedLight amount={4} radius={5} intensity={0.25 * Math.PI} ambient={0.55} position={[-5, 5, -9]} />
    </AccumulativeShadows>
  )
}

function CameraRig({ children }: PropsWithChildren) {
  const group = useRef<any>(null)
  const snap = useSnapshot(state)

  useFrame((ctx, delta) => {
    easing.damp3(
      ctx.camera.position,
      [snap.intro ? -ctx.viewport.width / 4 : 0, 0, 2],
      0.25,
      delta
    )
    easing.dampE(group.current.rotation, [ctx.pointer.y / 10, -ctx.pointer.x / 5, 0], 0.25, delta)
  })

  return <group ref={group}>{children}</group>
}

function Shirt(props: any) {
  const snap = useSnapshot(state)
  const texture = useTexture(`/${snap.decal}.png`)
  const { nodes, materials } = useGLTF('/shirt_baked_collapsed.glb') as any

  useFrame((_, delta) => {
    const mat = materials?.lambert1 as THREE.MeshStandardMaterial
    if (!mat?.color) return
    easing.dampC(mat.color, new THREE.Color(snap.color), 0.25, delta)
  })

  return (
    <mesh
      castShadow
      geometry={nodes.T_Shirt_male.geometry}
      material={materials.lambert1}
      material-roughness={1}
      {...props}
      dispose={null}
    >
      <Decal position={[0, 0.04, 0.15]} rotation={[0, 0, 0]} scale={0.15} map={texture} />
    </mesh>
  )
}

useGLTF.preload('/shirt_baked_collapsed.glb')
;(['/logo-fond-sombre.png', '/logo-fond-clair.png', '/logo-fond-moyen.png'] as const).forEach(useTexture.preload)
