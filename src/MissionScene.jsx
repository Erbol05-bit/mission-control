// The 3D view. Everything is built from simple shapes in code, no model files.
//
// mode="preview": the spacecraft alone, so the player sees parts appear.
// mode="cruise":  the spacecraft approaches the target.
// mode="orbit":   the spacecraft circles the target.
// mode="science": same orbit, with scan cones and a data beam to Earth.
//
// highlight: which part to glow green ("bus", "power", "antenna", "inst:<id>").
// effect:    in-flight event to show ("storm", "safemode", "antenna", "instrument").

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
const CRAFT_SCALE = 0.2 // spacecraft size in the flight view
const EARTH = new THREE.Vector3(-26, 9, -20)
const RED = 0xff2020
const ORANGE = 0xff9a20
const GREEN = 0x3ecf8e
const DEAD = 0x2b2b2b

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

function makePoints(count, spread, color, size) {
  const points = []
  for (let i = 0; i < count; i++) {
    const v = spread()
    points.push(v.x, v.y, v.z)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color, size }))
}

const makeStars = () =>
  makePoints(
    1500,
    () => new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20),
    0xffffff,
    0.12,
  )

// Charged particles of a solar storm, shown streaming past the spacecraft.
const STORM_BOX = 2.5
const makeStorm = () =>
  makePoints(
    400,
    () =>
      new THREE.Vector3(
        (Math.random() * 2 - 1) * STORM_BOX,
        (Math.random() * 2 - 1) * STORM_BOX,
        (Math.random() * 2 - 1) * STORM_BOX,
      ),
    0xffd24a,
    0.035,
  )

// The spacecraft grows and changes with the player's choices.
// Returns the model and a list of its parts, so each part can glow on its own.
function makeSpacecraft(design, instruments) {
  const group = new THREE.Group()
  const parts = {}
  const add = (key, mesh) => {
    ;(parts[key] ||= []).push(mesh)
    mesh.userData.baseColor = mesh.material.color.getHex()
    group.add(mesh)
    return mesh
  }
  const size = BUS_SIZE[design.busId]
  if (!size) return { group, parts, dish: null }

  add(
    'bus',
    new THREE.Mesh(
      new THREE.BoxGeometry(size, size * 1.2, size),
      new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.6, roughness: 0.4 }),
    ),
  )

  const panelLength = PANEL_LENGTH[design.powerId]
  if (panelLength) {
    const grey = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.3, roughness: 0.5 })
    for (const side of [-1, 1]) {
      const panel = add(
        'power',
        new THREE.Mesh(
          new THREE.BoxGeometry(panelLength, size * 0.7, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x1b3a8a, metalness: 0.5, roughness: 0.3 }),
        ),
      )
      panel.position.x = side * (size / 2 + panelLength / 2 + 0.08)
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1), grey)
      arm.rotation.z = Math.PI / 2
      arm.position.x = side * (size / 2 + 0.04)
      group.add(arm)
    }
  }

  // The dish opens along its own +Z axis, so lookAt() can aim it at Earth.
  let dish = null
  const dishRadius = DISH_RADIUS[design.antennaId]
  if (dishRadius) {
    const geometry = new THREE.ConeGeometry(dishRadius, dishRadius * 0.5, 32, 1, true)
    geometry.rotateX(-Math.PI / 2)
    dish = add(
      'antenna',
      new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }),
      ),
    )
    dish.position.y = size * 0.6 + dishRadius * 0.3
    dish.rotation.x = -Math.PI / 2 // points up until the flight starts
  }

  // Instruments sit in a row on the side that faces the target.
  instruments.forEach((instrument, i) => {
    const r = 0.04 + Math.min(instrument.mass, 70) / 700
    const mesh = add(
      `inst:${instrument.id}`,
      new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 0.22, 16),
        new THREE.MeshStandardMaterial({ color: CATEGORY_COLORS[instrument.category] ?? 0xffffff }),
      ),
    )
    const spread = instruments.length > 1 ? i / (instruments.length - 1) - 0.5 : 0
    mesh.position.set(spread * size * 0.8, -size * 0.6 - 0.11, size * 0.2 * (i % 2 ? 1 : -1))
  })
  return { group, parts, dish }
}

// Semi-transparent cones from each instrument down to the surface.
function makeScanCones(model, instruments, gap) {
  const cones = {}
  const length = gap / CRAFT_SCALE
  instruments.forEach((instrument, i) => {
    if (instrument.category === 'sample') return
    const source = model.parts[`inst:${instrument.id}`][0]
    const geometry = new THREE.ConeGeometry(1.0 + i * 0.45, length, 24, 1, true)
    geometry.translate(0, -length / 2, 0) // tip at the instrument, base at the surface
    const cone = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: CATEGORY_COLORS[instrument.category],
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    cone.position.copy(source.position)
    model.group.add(cone)
    cones[instrument.id] = cone
  })
  return cones
}

// A thin beam from the dish towards Earth: the data link.
function makeBeam(dish) {
  const length = 220
  const geometry = new THREE.CylinderGeometry(0.03, 0.03, length, 6)
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, 0, length / 2)
  const beam = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0x7fd0ff, transparent: true, opacity: 0.5 }),
  )
  dish.add(beam)
  return beam
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

const glow = (meshes, color, strength) =>
  meshes?.forEach((mesh) => {
    mesh.material.emissive.setHex(color)
    mesh.material.emissiveIntensity = strength
  })

export default function MissionScene({
  result,
  mode = 'preview',
  height = 280,
  highlight = null,
  effect = null,
  effectTarget = null,
  lostIds = [],
  damaged = false,
}) {
  const mountRef = useRef(null)
  const stateRef = useRef({})
  const liveRef = useRef({})

  // Things that change often are read by the animation loop from here,
  // so the 3D model does not have to be rebuilt for them.
  useEffect(() => {
    liveRef.current = {
      highlight,
      effect,
      effectTarget,
      lostIds,
      damaged,
      warn: {
        power: Boolean(result.powerSys) && result.powerGen < result.powerUse,
        antenna: Boolean(result.antenna) && result.dataReturned < 1,
        bus: Boolean(result.bus) && result.payloadMass > result.bus.payloadLimit,
      },
    }
  })

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
    const storm = makeStorm()
    storm.visible = false
    scene.add(storm)

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
    Object.assign(state, { scene, camera, controls, storm, home: new THREE.Vector3() })

    const clock = new THREE.Clock()
    const wanted = new THREE.Vector3()
    let frame
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.1)
      const t = clock.elapsedTime
      const live = liveRef.current
      const { craft, inner, parts, body, dish } = state
      const flying = state.mode !== 'preview'
      const pulse = 0.5 + 0.5 * Math.sin(t * 7)

      if (body) body.rotation.y += dt * 0.05

      // Where the spacecraft is.
      if (craft && !flying) {
        craft.rotation.y += dt * 0.4
      } else if (craft) {
        // In cruise the spacecraft spirals in from far away to its orbit.
        state.progress = Math.min(1, state.progress + dt / 8)
        const eased = 1 - Math.pow(1 - state.progress, 3)
        const radius =
          state.mode === 'cruise' ? 7 - (7 - state.orbitRadius) * eased : state.orbitRadius
        state.angle += dt * (state.mode === 'cruise' ? 0.5 : 0.3)
        craft.position.set(
          Math.cos(state.angle) * radius,
          Math.sin(state.angle * 0.5) * 0.15,
          Math.sin(state.angle) * radius,
        )
        craft.lookAt(0, 0, 0)
        if (dish) dish.lookAt(EARTH)
      }

      // How the parts look: warnings, events and the hovered part.
      if (parts) {
        for (const meshes of Object.values(parts)) {
          for (const mesh of meshes) {
            mesh.material.emissiveIntensity = 0
            mesh.material.color.setHex(mesh.userData.baseColor)
          }
        }
        if (live.warn.power) glow(parts.power, RED, pulse)
        if (live.warn.antenna) glow(parts.antenna, ORANGE, pulse)
        if (live.warn.bus) glow(parts.bus, RED, pulse * 0.8)
        if (live.effect === 'storm') glow(parts.power, RED, Math.random())
        if (live.effect === 'antenna') glow(parts.antenna, ORANGE, pulse)
        if (live.effect === 'safemode') glow(parts.bus, ORANGE, pulse)
        if (live.effect === 'instrument') glow(parts[`inst:${live.effectTarget}`], RED, pulse)
        if (live.highlight) glow(parts[live.highlight], GREEN, 0.9)
        if (live.damaged) parts.power?.[0].material.color.setHex(0x3a2a35)
        for (const id of live.lostIds) {
          parts[`inst:${id}`]?.forEach((mesh) => mesh.material.color.setHex(DEAD))
        }
      }

      // Event motion: a storm shakes the spacecraft, safe mode makes it tumble.
      if (inner) {
        const shake = live.effect === 'storm' ? 0.12 : 0
        inner.position.set(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
        )
        if (live.effect === 'safemode') inner.rotation.z += dt * 1.2
        else inner.rotation.z *= 0.9
      }
      storm.visible = flying && live.effect === 'storm'
      if (storm.visible && craft) {
        storm.position.copy(craft.position)
        const pos = storm.geometry.attributes.position
        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i) + dt * 5
          if (x > STORM_BOX) x -= STORM_BOX * 2
          pos.setX(i, x)
        }
        pos.needsUpdate = true
      }

      // Science phase: scan cones pulse, the beam carries data to Earth.
      if (state.cones) {
        Object.entries(state.cones).forEach(([id, cone], i) => {
          cone.visible = !live.lostIds.includes(id)
          cone.material.opacity = 0.08 + 0.07 * Math.sin(t * 2 + i * 1.7)
        })
      }
      if (state.beam) {
        const broken = live.effect === 'antenna'
        state.beam.material.color.setHex(broken ? ORANGE : 0x7fd0ff)
        state.beam.visible = broken ? Math.sin(t * 12) > 0 : true
        state.beam.material.opacity = 0.3 + 0.25 * Math.sin(t * 5)
      }

      // During an event the camera flies close to the spacecraft. In the science
      // phase it follows from a little farther, so the scan cones stay in view.
      const eventOn = live.effect && live.effect !== 'budget'
      const follow = flying && craft && (eventOn || state.mode === 'science')
      if (follow) {
        wanted.copy(craft.position).normalize().multiplyScalar(eventOn ? 1.1 : 2.0).add(craft.position)
        wanted.y += eventOn ? 0.5 : 0.9
        camera.position.lerp(wanted, 0.06)
        camera.lookAt(craft.position)
        state.wasFollowing = true
      } else {
        if (state.wasFollowing) {
          camera.position.copy(state.home)
          state.wasFollowing = false
        }
        controls.update()
      }
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
    const model = makeSpacecraft(design, result.instruments)
    // "craft" is moved along the orbit; "inner" holds the model and is turned
    // so that the instruments face the target and the dish faces away.
    const craft = new THREE.Group()
    craft.add(model.group)
    content.add(craft)
    Object.assign(state, {
      craft,
      inner: model.group,
      parts: model.parts,
      dish: mode === 'preview' ? null : model.dish,
      body: null,
      cones: null,
      beam: null,
      mode,
      orbitRadius: ORBIT_RADIUS[design.orbitId],
      progress: 0,
      angle: state.angle ?? 0,
      wasFollowing: false,
    })

    if (mode === 'preview') {
      state.home.set(2.6, 1.6, 3.2)
    } else {
      craft.scale.setScalar(CRAFT_SCALE)
      model.group.rotation.x = -Math.PI / 2
      const body = makeBody(targetId)
      content.add(body)
      state.body = body
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(state.orbitRadius, 0.006, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0x4f6fb5 }),
      )
      ring.rotation.x = Math.PI / 2
      content.add(ring)
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 24, 16),
        new THREE.MeshBasicMaterial({ color: 0x3b7bd6 }),
      )
      earth.position.copy(EARTH)
      content.add(earth)
      if (mode === 'science') {
        const surface = targetId === 'asteroid' ? 0.8 : 1
        state.cones = makeScanCones(model, result.instruments, state.orbitRadius - surface)
        if (model.dish) state.beam = makeBeam(model.dish)
      }
      state.home.set(0, mode === 'science' ? 1.6 : 2.6, { cruise: 9, orbit: 5.5, science: 4.4 }[mode])
    }
    state.camera.position.copy(state.home)
    state.controls.target.set(0, 0, 0)
    state.scene.add(content)
    state.content = content
    // The design object changes on every click; these keys are what the 3D view depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, targetId, design.busId, design.powerId, design.antennaId, design.orbitId, instrumentKey])

  return <div ref={mountRef} className="scene" style={{ height }} />
}
