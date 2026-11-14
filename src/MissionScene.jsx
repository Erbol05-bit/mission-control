// The 3D view. Everything is built from simple shapes in code, no model files.
//
// mode="preview": the spacecraft alone, so the player sees parts appear.
// mode="cruise":  the spacecraft approaches the target.
// mode="orbit":   the spacecraft circles the target.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const BODY_COLORS = {
  moon: ['#8f8f8f', '#5f5f5f', '#b9b9b9'],
  mars: ['#b5532a', '#7d3214', '#d98a5a'],
  asteroid: ['#5e5248', '#3a322c', '#857668'],
}
const ORBIT_RADIUS = { low: 1.4, standard: 1.9, high: 2.6 }
const BUS_SIZE = { small: 0.5, medium: 0.7, large: 0.9 }
const PANEL_LENGTH = { solarS: 0.9, solarL: 1.6, solarXL: 2.4 }
const DISH_RADIUS = { lga: 0.08, mga: 0.25, hga: 0.5 }
const CATEGORY_COLORS = {
  imaging: 0x4fc3f7,
  composition: 0xba68c8,
  subsurface: 0xff8a65,
  topography: 0x81c784,
  thermal: 0xe57373,
  volatiles: 0xfff176,
  sample: 0xffffff,
}

// A simple spotted surface drawn on a canvas and used as a texture.
function bodyTexture([base, dark, light]) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 500; i++) {
    ctx.globalAlpha = 0.15 + Math.random() * 0.25
    ctx.fillStyle = Math.random() < 0.5 ? dark : light
    ctx.beginPath()
    ctx.arc(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 16, 0, Math.PI * 2)
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeBody(targetId) {
  const material = new THREE.MeshStandardMaterial({
    map: bodyTexture(BODY_COLORS[targetId]),
    roughness: 1,
  })
  if (targetId !== 'asteroid') {
    return new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), material)
  }
  // An asteroid is lumpy: push each vertex in or out a little.
  const geometry = new THREE.IcosahedronGeometry(0.8, 4)
  const pos = geometry.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const bump =
      1 + 0.18 * Math.sin(v.x * 4.1 + 1) * Math.cos(v.y * 3.3) + 0.12 * Math.sin(v.z * 5.7 + v.x * 2)
    v.multiplyScalar(bump)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  material.flatShading = true
  return new THREE.Mesh(geometry, material)
}

function makeStars() {
  const points = []
  for (let i = 0; i < 1500; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20)
    points.push(v.x, v.y, v.z)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 }))
}

// The spacecraft grows and changes with the player's choices.
function makeSpacecraft(design, instruments) {
  const group = new THREE.Group()
  const size = BUS_SIZE[design.busId]
  if (!size) return group

  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.6, roughness: 0.4 })
  const grey = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.3, roughness: 0.5 })
  group.add(new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.2, size), gold))

  const panelLength = PANEL_LENGTH[design.powerId]
  if (panelLength) {
    const blue = new THREE.MeshStandardMaterial({
      color: 0x1b3a8a, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide,
    })
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(panelLength, size * 0.7, 0.02), blue)
      panel.position.x = side * (size / 2 + panelLength / 2 + 0.08)
      group.add(panel)
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1), grey)
      arm.rotation.z = Math.PI / 2
      arm.position.x = side * (size / 2 + 0.04)
      group.add(arm)
    }
  }

  const dishRadius = DISH_RADIUS[design.antennaId]
  if (dishRadius) {
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(dishRadius, dishRadius * 0.5, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }),
    )
    dish.position.y = size * 0.6 + dishRadius * 0.25
    dish.rotation.x = Math.PI
    group.add(dish)
  }

  // Instruments sit in a row on the side that faces the target.
  instruments.forEach((instrument, i) => {
    const r = 0.04 + Math.min(instrument.mass, 70) / 700
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: CATEGORY_COLORS[instrument.category] ?? 0xffffff }),
    )
    const spread = instruments.length > 1 ? i / (instruments.length - 1) - 0.5 : 0
    mesh.position.set(spread * size * 0.8, -size * 0.6 - 0.11, size * 0.2 * (i % 2 ? 1 : -1))
    group.add(mesh)
  })
  return group
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose()
    if (child.material) {
      child.material.map?.dispose()
      child.material.dispose()
    }
  })
}

export default function MissionScene({ result, mode = 'preview', height = 280 }) {
  const mountRef = useRef(null)
  const stateRef = useRef({})

  // Set up the renderer once.
  useEffect(() => {
    const mount = mountRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05080f)
    scene.add(makeStars())
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(5, 3, 4)
    scene.add(sun)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true

    const resize = () => {
      const width = mount.clientWidth
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    const state = stateRef.current
    Object.assign(state, { scene, camera, controls, content: null, craft: null, body: null })

    const clock = new THREE.Clock()
    let frame
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const { craft, body } = state
      if (body) body.rotation.y += dt * 0.05
      if (craft && state.mode === 'preview') {
        craft.rotation.y += dt * 0.4
      } else if (craft) {
        // In cruise the spacecraft spirals in from far away to its orbit.
        state.progress = Math.min(1, state.progress + dt / 8)
        const eased = 1 - Math.pow(1 - state.progress, 3)
        const radius =
          state.mode === 'cruise' ? 7 - (7 - state.orbitRadius) * eased : state.orbitRadius
        state.angle += dt * (state.mode === 'cruise' ? 0.5 : 0.35)
        craft.position.set(
          Math.cos(state.angle) * radius,
          Math.sin(state.angle * 0.5) * 0.15,
          Math.sin(state.angle) * radius,
        )
        craft.lookAt(0, 0, 0)
      }
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      disposeObject(scene)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [height])

  // Rebuild the spacecraft and the target whenever the design or mode changes.
  const { design } = result
  const targetId = result.mission.target
  const instrumentKey = design.instrumentIds.join(',')
  useEffect(() => {
    const state = stateRef.current
    if (!state.scene) return
    if (state.content) {
      state.scene.remove(state.content)
      disposeObject(state.content)
    }
    const content = new THREE.Group()
    const craft = makeSpacecraft(design, result.instruments)
    content.add(craft)
    state.craft = craft
    state.body = null
    state.mode = mode
    state.orbitRadius = ORBIT_RADIUS[design.orbitId]
    state.progress = 0
    state.angle = state.angle ?? 0

    if (mode === 'preview') {
      craft.position.set(0, 0, 0)
      state.camera.position.set(2.6, 1.6, 3.2)
    } else {
      craft.scale.setScalar(0.2)
      const body = makeBody(targetId)
      content.add(body)
      state.body = body
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(state.orbitRadius, 0.006, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0x4f6fb5 }),
      )
      ring.rotation.x = Math.PI / 2
      content.add(ring)
      state.camera.position.set(0, 2.6, mode === 'cruise' ? 9 : 5.5)
    }
    state.controls.target.set(0, 0, 0)
    state.scene.add(content)
    state.content = content
    // The design object changes on every click; these keys are what the 3D view depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, targetId, design.busId, design.powerId, design.antennaId, design.orbitId, instrumentKey])

  return <div ref={mountRef} className="scene" style={{ height }} />
}
