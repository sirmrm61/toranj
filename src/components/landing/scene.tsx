"use client";
/* eslint-disable react-hooks/immutability, react-hooks/purity -- three.js uniforms/materials are mutable GPU state updated per frame */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { landing, TRANSITION_DURATION } from "./config";
import {
  backgroundFrag,
  brideFrag,
  fullscreenVert,
  groomFrag,
  particlesFrag,
  particlesVert,
  TRANSITIONS,
} from "./shaders";

export type PointerState = { x: number; y: number; px: number; py: number; active: boolean };

type SceneProps = {
  index: number;
  pointer: React.RefObject<PointerState>;
  onReady?: () => void;
};

const G = landing.gowns;
const IMG_ASPECT = landing.imageSize.w / landing.imageSize.h;

function layout(w: number, h: number) {
  const wide = w / h > 1.05;
  const bh = h * (wide ? 0.9 : 0.8);
  const bw = bh * IMG_ASPECT;
  const bx = wide ? -w * 0.16 : 0;
  const by = -h / 2 + bh / 2 + h * 0.01;
  const gh = bh * 0.66;
  const gw = gh * IMG_ASPECT;
  const gx = bx - bw * (wide ? 0.48 : 0.38);
  const gy = -h / 2 + gh / 2 + h * 0.13;
  return { bw, bh, bx, by, gw, gh, gx, gy };
}

function damp(cur: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(cur, target, lambda, dt);
}

function Stage({ index, pointer, onReady }: SceneProps) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const brides = useTexture(G.map((g) => g.image));
  const depths = useTexture(G.map((g) => g.depth));
  const [bg, groom] = useTexture([landing.background, landing.groom]);
  const L = layout(size.width, size.height);

  const brideRef = useRef<THREE.Mesh>(null);
  const groomRef = useRef<THREE.Mesh>(null);
  const bgRef = useRef<THREE.Mesh>(null);
  const state = useRef({ from: index, to: index, progress: 1, look: new THREE.Vector2(), p: new THREE.Vector2() });

  const { W, H } = { W: landing.imageSize.w, H: landing.imageSize.h };
  const brideUniforms = useMemo(
    () => ({
      uFrom: { value: brides[index] },
      uTo: { value: brides[index] },
      uDepthFrom: { value: depths[index] },
      uDepthTo: { value: depths[index] },
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uLook: { value: new THREE.Vector2() },
      uPointer: { value: new THREE.Vector2() },
      uLight: { value: new THREE.Vector2(0.5, 0.7) },
      uImageSize: { value: new THREE.Vector2(W, H) },
      uEye0: { value: new THREE.Vector2(landing.eyes[0].u * W, landing.eyes[0].v * H) },
      uEye1: { value: new THREE.Vector2(landing.eyes[1].u * W, landing.eyes[1].v * H) },
      uEyeSize: { value: new THREE.Vector2(landing.eyeSize.rx * W, landing.eyeSize.ry * H) },
      uIrisR: { value: landing.irisRadius * W },
      uEyeTravel: { value: landing.eyeTravel * W },
      uHead: { value: new THREE.Vector3(landing.head.u * W, landing.head.v * H, landing.head.radius * W) },
      uParallax: { value: 0.014 },
      uEyesOn: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniforms are created once and mutated per frame
    [brides, depths],
  );

  // One compiled program per transition; all share the same uniforms object.
  const materials = useMemo(
    () =>
      Object.fromEntries(
        TRANSITIONS.map((t) => [
          t,
          new THREE.ShaderMaterial({ uniforms: brideUniforms, vertexShader: fullscreenVert, fragmentShader: brideFrag(t), transparent: true, depthWrite: false }),
        ]),
      ),
    [brideUniforms],
  );

  const groomMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: groom }, uBlur: { value: 1.6 / landing.imageSize.w } },
        vertexShader: fullscreenVert,
        fragmentShader: groomFrag,
        transparent: true,
        depthWrite: false,
      }),
    [groom],
  );

  const bgMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTex: { value: bg },
          uCover: { value: new THREE.Vector2(1, 1) },
          uPointer: { value: new THREE.Vector2() },
          uLight: { value: new THREE.Vector2(0.5, 0.5) },
          uTime: { value: 0 },
        },
        vertexShader: fullscreenVert,
        fragmentShader: backgroundFrag,
        depthWrite: false,
      }),
    [bg],
  );

  const particles = useMemo(() => {
    const n = 260;
    const seeds = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) seeds[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2() },
        uPixelRatio: { value: 1 },
      },
      vertexShader: particlesVert,
      fragmentShader: particlesFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, []);

  useEffect(() => {
    const s = state.current;
    if (index === s.to) return;
    s.from = s.to;
    s.to = index;
    s.progress = 0;
    brideUniforms.uFrom.value = brides[s.from];
    brideUniforms.uDepthFrom.value = depths[s.from];
    brideUniforms.uTo.value = brides[s.to];
    brideUniforms.uDepthTo.value = depths[s.to];
    if (brideRef.current) brideRef.current.material = materials[G[s.to].transition] ?? materials.liquid;
  }, [index, brides, depths, brideUniforms, materials]);

  useEffect(() => {
    onReady?.();
    return () => {
      Object.values(materials).forEach((m) => m.dispose());
      groomMat.dispose();
      bgMat.dispose();
      particles.mat.dispose();
      particles.geo.dispose();
    };
  }, [materials, groomMat, bgMat, particles, onReady]);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const t = clock.elapsedTime;
    const ptr = pointer.current;
    // idle "breathing" motion when there is no pointer input
    const tx = ptr.active ? ptr.x : Math.sin(t * 0.35) * 0.25;
    const ty = ptr.active ? ptr.y : Math.cos(t * 0.27) * 0.12;
    s.p.set(damp(s.p.x, tx, 4, dt), damp(s.p.y, ty, 4, dt));

    // gaze: vector from the eyes (screen px, y up) to the pointer
    const eyeX = L.bx + ((landing.eyes[0].u + landing.eyes[1].u) / 2 - 0.5) * L.bw;
    const eyeY = L.by + (0.5 - landing.eyes[0].v) * L.bh;
    const px = (s.p.x * size.width) / 2;
    const py = (s.p.y * size.height) / 2;
    const dir = new THREE.Vector2(px - eyeX, py - eyeY);
    const len = dir.length();
    dir.normalize().multiplyScalar(Math.min(1, len / 260));
    s.look.set(damp(s.look.x, dir.x, 6, dt), damp(s.look.y, dir.y, 6, dt));

    if (s.progress < 1) s.progress = Math.min(1, s.progress + dt / TRANSITION_DURATION);

    const u = brideUniforms;
    u.uTime.value = t;
    u.uProgress.value = s.progress;
    u.uPointer.value.copy(s.p);
    u.uLook.value.copy(s.look);
    u.uLight.value.set((px - L.bx) / L.bw + 0.5, (py - L.by) / L.bh + 0.5);

    bgMat.uniforms.uPointer.value.copy(s.p);
    bgMat.uniforms.uLight.value.set(s.p.x * 0.5 + 0.5, s.p.y * 0.5 + 0.5);
    const bgAspect = 1.6;
    const vAspect = size.width / size.height;
    bgMat.uniforms.uCover.value.set(vAspect > bgAspect ? 1 : vAspect / bgAspect, vAspect > bgAspect ? bgAspect / vAspect : 1).multiplyScalar(0.96);

    particles.mat.uniforms.uTime.value = t;
    particles.mat.uniforms.uSize.value.set(size.width, size.height);
    particles.mat.uniforms.uPointer.value.copy(s.p);
    particles.mat.uniforms.uPixelRatio.value = dpr;

    if (brideRef.current) brideRef.current.position.set(L.bx - s.p.x * 6, L.by - s.p.y * 3, 0);
    if (groomRef.current) groomRef.current.position.set(L.gx + s.p.x * 14, L.gy + s.p.y * 6, -2);
    if (bgRef.current) bgRef.current.position.set(0, 0, -5);
  });

  return (
    <>
      <mesh ref={bgRef} material={bgMat} renderOrder={0}>
        <planeGeometry args={[size.width, size.height]} />
      </mesh>
      <points geometry={particles.geo} material={particles.mat} renderOrder={1} position={[0, 0, -3]} />
      <mesh ref={groomRef} material={groomMat} renderOrder={2} position={[L.gx, L.gy, -2]}>
        <planeGeometry args={[L.gw, L.gh]} />
      </mesh>
      <mesh ref={brideRef} material={materials[G[index].transition] ?? materials.liquid} renderOrder={3} position={[L.bx, L.by, 0]}>
        <planeGeometry args={[L.bw, L.bh]} />
      </mesh>
      <points geometry={particles.geo} material={particles.mat} renderOrder={4} position={[0, 0, 1]} scale={[1.1, 1.1, 1]} />
    </>
  );
}

export default function HeroScene({ index, pointer, onReady, running }: SceneProps & { running: boolean }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
      dpr={[1, 1.75]}
      flat
      frameloop={running ? "always" : "never"}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      aria-hidden
    >
      <Stage index={index} pointer={pointer} onReady={onReady} />
    </Canvas>
  );
}
