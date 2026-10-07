"use client";

import type { ModelId } from "@/lib/models";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface Props {
  model: ModelId;
  selected: string;
  rotating: boolean;
  resetKey: number;
  onSelect: (part: string) => void;
}

export default function ModelCanvas({
  model,
  selected,
  rotating,
  resetKey,
  onSelect,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const preferences = useRef({ selected, rotating, onSelect });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    preferences.current = { selected, rotating, onSelect };
  }, [selected, rotating, onSelect]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D model. Drag to rotate and pinch or scroll to zoom. Use the part buttons for keyboard navigation.",
    );
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.1, 11);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 18;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 2.8));
    const light = new THREE.DirectionalLight(0xffffff, 3.5);
    light.position.set(4, 6, 5);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0x93c5fd, 2);
    rim.position.set(-4, 0, -3);
    scene.add(rim);
    const group = new THREE.Group();
    scene.add(group);
    const meshes: THREE.Mesh[] = [];
    const textures: THREE.Texture[] = [];
    function sphere(
      pos: THREE.Vector3,
      scale: THREE.Vector3,
      color: number,
      part: string,
      opacity = 1,
    ) {
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.28,
        metalness: 0.15,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity === 1,
      });
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 16),
        material,
      );
      mesh.position.copy(pos);
      mesh.scale.copy(scale);
      mesh.userData.part = part;
      group.add(mesh);
      meshes.push(mesh);
      return mesh;
    }
    function link(
      a: THREE.Vector3,
      b: THREE.Vector3,
      color: number,
      part: string,
      radius = 0.055,
    ) {
      const delta = b.clone().sub(a);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, delta.length(), 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
      );
      mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        delta.normalize(),
      );
      mesh.userData.part = part;
      group.add(mesh);
      meshes.push(mesh);
    }
    if (model === "dna") {
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 5.5;
        const y = (i - 11.5) * 0.22;
        const a = new THREE.Vector3(
          Math.cos(angle) * 1.05,
          y,
          Math.sin(angle) * 1.05,
        );
        const b = new THREE.Vector3(-a.x, y, -a.z);
        sphere(a, new THREE.Vector3(0.12, 0.12, 0.12), 0x60a5fa, "backbone");
        sphere(b, new THREE.Vector3(0.12, 0.12, 0.12), 0x93c5fd, "backbone");
        const part = i % 2 === 0 ? "at" : "gc";
        link(a, b, i % 2 === 0 ? 0xfbbf24 : 0x34d399, part, 0.065);
        if (i > 0) {
          const pa = new THREE.Vector3(
            Math.cos(angle - Math.PI / 5.5) * 1.05,
            y - 0.22,
            Math.sin(angle - Math.PI / 5.5) * 1.05,
          );
          link(pa, a, 0x60a5fa, "backbone", 0.075);
          link(
            new THREE.Vector3(-pa.x, pa.y, -pa.z),
            b,
            0x93c5fd,
            "backbone",
            0.075,
          );
        }
      }
      group.rotation.z = -0.18;
    } else if (model === "cell") {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 1.35),
        new THREE.MeshStandardMaterial({
          color: 0x34d399,
          roughness: 0.35,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        }),
      );
      shell.scale.set(2.35, 1.85, 1.35);
      shell.userData.part = "wall";
      group.add(shell);
      meshes.push(shell);
      sphere(
        new THREE.Vector3(-0.95, 0.2, 0.5),
        new THREE.Vector3(0.65, 0.65, 0.65),
        0xa78bfa,
        "nucleus",
      );
      sphere(
        new THREE.Vector3(-0.95, 0.2, 1),
        new THREE.Vector3(0.2, 0.2, 0.2),
        0x7c3aed,
        "nucleus",
      );
      sphere(
        new THREE.Vector3(0.5, -0.2, 0),
        new THREE.Vector3(1.1, 1.25, 0.7),
        0x38bdf8,
        "vacuole",
        0.68,
      );
      for (const pos of [
        [-1.5, -0.9, 0.4],
        [1.6, 0.8, 0.3],
        [-0.4, 1.25, 0.4],
        [1.25, -1.1, 0.5],
      ]) {
        const chloroplast = sphere(
          new THREE.Vector3(...pos),
          new THREE.Vector3(0.4, 0.22, 0.23),
          0x16a34a,
          "chloroplast",
        );
        chloroplast.rotation.z = 0.5;
      }
      group.rotation.y = -0.4;
    } else {
      const nodes = [
        { v: 50, x: 0, y: 1.9, z: 0, p: "root" },
        { v: 25, x: -1.35, y: 0.25, z: 0.15, p: "left" },
        { v: 75, x: 1.35, y: 0.25, z: 0.15, p: "right" },
        { v: 10, x: -2.05, y: -1.45, z: 0.3, p: "left" },
        { v: 35, x: -0.7, y: -1.45, z: 0.3, p: "left" },
        { v: 60, x: 0.7, y: -1.45, z: 0.3, p: "right" },
        { v: 90, x: 2.05, y: -1.45, z: 0.3, p: "right" },
      ];
      nodes.forEach((node, i) => {
        const pos = new THREE.Vector3(node.x, node.y, node.z);
        sphere(
          pos,
          new THREE.Vector3(0.42, 0.42, 0.42),
          node.p === "root"
            ? 0x60a5fa
            : node.p === "left"
              ? 0x34d399
              : 0xa78bfa,
          node.p,
        );
        if (i > 0) {
          const parent = nodes[Math.floor((i - 1) / 2)];
          link(
            new THREE.Vector3(parent.x, parent.y, parent.z),
            pos,
            0x94a3b8,
            node.p,
          );
        }
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.font = "bold 58px sans-serif";
          ctx.fillStyle = "#071a3d";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(node.v), 64, 66);
          const texture = new THREE.CanvasTexture(canvas);
          textures.push(texture);
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: texture, depthTest: false }),
          );
          sprite.position.copy(pos).add(new THREE.Vector3(0, 0, 0.5));
          sprite.scale.set(0.6, 0.6, 1);
          group.add(sprite);
        }
      });
    }
    const raycaster = new THREE.Raycaster();
    let pointerStart = { x: 0, y: 0 };
    const down = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const pick = (event: PointerEvent) => {
      if (
        Math.hypot(
          event.clientX - pointerStart.x,
          event.clientY - pointerStart.y,
        ) > 8
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(meshes)[0];
      if (hit) preferences.current.onSelect(hit.object.userData.part);
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", pick);
    const resize = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    });
    resize.observe(container);
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(container);
    let previous = 0;
    renderer.setAnimationLoop((time) => {
      if (!visible || document.hidden) {
        previous = time;
        return;
      }
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      controls.autoRotate =
        preferences.current.rotating && !reducedMotion.matches;
      controls.autoRotateSpeed = 0.7;
      controls.update(delta);
      meshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissive.set(
          mesh.userData.part === preferences.current.selected
            ? 0x1e40af
            : 0x000000,
        );
        material.emissiveIntensity = 0.28;
      });
      renderer.render(scene, camera);
    });
    return () => {
      renderer.setAnimationLoop(null);
      resize.disconnect();
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", pick);
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
        if (object instanceof THREE.Sprite) object.material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [model, resetKey]);

  return (
    <div ref={host} className="absolute inset-0" data-testid="model-canvas">
      {failed && (
        <div className="flex h-full items-center justify-center p-8 text-center text-slate-600">
          <p>
            3D rendering is unavailable on this device. You can still explore
            every structure using the part buttons and descriptions.
          </p>
        </div>
      )}
    </div>
  );
}
