"use client";

import type { ModelId } from "@/lib/models";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { scienceGeometry } from "./science-geometry";

interface Props {
  model: ModelId;
  selected: string;
  rotating: boolean;
  resetKey: number;
  onSelect: (part: string) => void;
  vectorScale?: number;
  hiddenPart?: string;
  exploded?: boolean;
}

export default function ModelCanvas({
  model,
  selected,
  rotating,
  resetKey,
  onSelect,
  vectorScale = 1,
  hiddenPart = "",
  exploded = false,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const sceneKey = `${model}:${resetKey}`;
  const [focus, setFocus] = useState({ key: "", enabled: false });
  const focusSelected = focus.key === sceneKey && focus.enabled;
  const [readyKey, setReadyKey] = useState("");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [meshView, setMeshView] = useState({ key: "", enabled: false });
  const wireframe = meshView.key === sceneKey && meshView.enabled;
  const cameraCommand = useRef<((command: string) => void) | null>(null);
  const preferences = useRef({
    selected,
    rotating,
    onSelect,
    vectorScale,
    hiddenPart,
    exploded,
    focusSelected,
    wireframe,
  });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    preferences.current = {
      selected,
      rotating,
      onSelect,
      vectorScale,
      hiddenPart,
      exploded,
      focusSelected,
      wireframe,
    };
  }, [
    selected,
    rotating,
    onSelect,
    vectorScale,
    hiddenPart,
    exploded,
    focusSelected,
    wireframe,
  ]);

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
    queueMicrotask(() => setFailed(false));
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
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("role", "img");
    const keyboard = (event: KeyboardEvent) => {
      const angle = 0.12;
      if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
        camera.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          event.key === "ArrowLeft" ? -angle : angle,
        );
      } else if (["ArrowUp", "ArrowDown"].includes(event.key)) {
        camera.position.y = THREE.MathUtils.clamp(
          camera.position.y + (event.key === "ArrowUp" ? 0.5 : -0.5),
          -8,
          8,
        );
      } else if (["+", "=", "-"].includes(event.key)) {
        camera.position.multiplyScalar(event.key === "-" ? 1.1 : 0.9);
        camera.position.clampLength(controls.minDistance, controls.maxDistance);
      } else if (event.key === "Home") {
        cameraCommand.current?.("reset-camera");
      } else return;
      event.preventDefault();
      controls.update();
    };
    renderer.domElement.addEventListener("keydown", keyboard);
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
    cameraCommand.current = (command) => {
      if (command === "reset-camera") {
        controls.target.set(0, 0, 0);
        camera.position.set(0, 1.1, 11);
        group.rotation.set(0, 0, 0);
      } else if (command === "in" || command === "out") {
        camera.position
          .sub(controls.target)
          .multiplyScalar(command === "in" ? 0.85 : 1.18)
          .clampLength(controls.minDistance, controls.maxDistance)
          .add(controls.target);
      } else {
        // Presets restore object orientation so front/top/side stay meaningful after dragging.
        group.rotation.set(0, 0, 0);
        controls.target.set(0, 0, 0);
        camera.position.set(
          ...((command === "top"
            ? [0, 11, 0.001]
            : command === "side"
              ? [11, 0, 0]
              : [0, 0, 11]) as [number, number, number]),
        );
      }
      controls.update();
    };
    queueMicrotask(() => setReadyKey(`${model}:${resetKey}`));
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
    if (model === "vectors") {
      const origin = new THREE.Vector3(-1, -1, 0);
      for (const [part, end, color] of [
        ["x", new THREE.Vector3(3, 0, 0), 0xef4444],
        ["y", new THREE.Vector3(0, 3, 0), 0x22c55e],
        ["z", new THREE.Vector3(0, 0, 3), 0x3b82f6],
        ["vector", new THREE.Vector3(2, 2, 1), 0xa855f7],
      ] as const) {
        const endpoint = origin.clone().add(end);
        link(origin, endpoint, color, part, 0.045);
        if (part === "vector") meshes.at(-1)!.userData.vectorShaft = true;
        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.13, 0.35, 16),
          new THREE.MeshStandardMaterial({ color }),
        );
        tip.position.copy(endpoint);
        tip.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          end.clone().normalize(),
        );
        tip.userData.part = part;
        tip.userData.vectorTip = part === "vector";
        group.add(tip);
        meshes.push(tip);
      }
    } else if (model === "dna") {
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
    } else if (model === "tree") {
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
          sprite.userData.part = node.p;
          group.add(sprite);
        }
      });
    }
    if (!["dna", "cell", "tree", "vectors"].includes(model))
      scienceGeometry(model, group, meshes, sphere, link);
    meshes.forEach((mesh) => {
      mesh.userData.basePosition = mesh.position.clone();
    });
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
      const hit = raycaster.intersectObjects(
        meshes.filter((m) => m.visible),
      )[0];
      if (hit) preferences.current.onSelect(hit.object.userData.part);
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", pick);
    let dirty = true;
    let previousPreferences = "";
    const changed = () => {
      dirty = true;
    };
    controls.addEventListener("change", changed);
    const contextLost = () => {
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const resize = new ResizeObserver(() => {
      dirty = true;
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
      const fingerprint = JSON.stringify([
        preferences.current.selected,
        preferences.current.vectorScale,
        preferences.current.hiddenPart,
        preferences.current.exploded,
        preferences.current.focusSelected,
        preferences.current.wireframe,
      ]);
      if (fingerprint !== previousPreferences) {
        dirty = true;
        previousPreferences = fingerprint;
      }
      if (!dirty) return;
      dirty = false;
      meshes.forEach((mesh) => {
        mesh.visible =
          mesh.userData.part !== preferences.current.hiddenPart &&
          (!preferences.current.focusSelected ||
            mesh.userData.part === preferences.current.selected);
        if (
          [
            "ovum",
            "nacl",
            "octahedral",
            "sperm",
            "embryo-sac",
            "bcc",
            "pn-junction",
            "ethernet-card",
            "twisted-pair",
            "coaxial-cable",
            "optical-fibre",
            "ethernet-plug",
          ].includes(model)
        ) {
          mesh.position
            .copy(mesh.userData.basePosition)
            .multiplyScalar(preferences.current.exploded ? 1.4 : 1);
        }
        if (mesh.userData.vectorShaft || mesh.userData.vectorTip) {
          const t = preferences.current.vectorScale;
          mesh.visible = mesh.visible && t > 0;
          const endpoint = new THREE.Vector3(2, 2, 1).multiplyScalar(t);
          mesh.position.copy(
            new THREE.Vector3(-1, -1, 0).add(
              endpoint.multiplyScalar(mesh.userData.vectorShaft ? 0.5 : 1),
            ),
          );
          if (mesh.userData.vectorShaft) mesh.scale.y = t;
        }
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.wireframe = preferences.current.wireframe;
        material.emissive.set(
          mesh.userData.part === preferences.current.selected
            ? 0x1e40af
            : 0x000000,
        );
        material.emissiveIntensity = 0.28;
      });
      group.children.forEach((object) => {
        if (object instanceof THREE.Sprite)
          object.visible =
            object.userData.part !== preferences.current.hiddenPart &&
            (!preferences.current.focusSelected ||
              object.userData.part === preferences.current.selected);
      });
      renderer.domElement.dataset.visibleParts = [
        ...new Set(meshes.filter((m) => m.visible).map((m) => m.userData.part)),
      ].join(",");
      renderer.domElement.dataset.cameraDistance = camera.position
        .distanceTo(controls.target)
        .toFixed(3);
      renderer.domElement.dataset.surfaceMesh = String(
        preferences.current.wireframe,
      );
      renderer.domElement.dataset.cameraPosition = camera.position
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      renderer.render(scene, camera);
    });
    return () => {
      cameraCommand.current = null;
      renderer.setAnimationLoop(null);
      resize.disconnect();
      observer.disconnect();
      controls.dispose();
      controls.removeEventListener("change", changed);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", pick);
      renderer.domElement.removeEventListener("keydown", keyboard);
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
    <>
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
      {!failed && (
        <div className="absolute right-3 top-3 z-10 max-w-[260px] text-right">
          <button
            type="button"
            aria-expanded={controlsOpen}
            aria-controls={`${model}-camera-controls`}
            onClick={() => setControlsOpen((v) => !v)}
            className="min-h-10 rounded-lg border border-slate-200 bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600 sm:hidden"
          >
            {controlsOpen ? "Hide view controls" : "View controls"}
          </button>
          <div
            id={`${model}-camera-controls`}
            role="group"
            aria-label="3D camera and focus controls"
            className={`${controlsOpen ? "flex" : "hidden"} mt-2 flex-wrap justify-end gap-1.5 sm:mt-0 sm:flex`}
          >
            {[
              ["front", "Front view"],
              ["top", "Top view"],
              ["side", "Side view"],
              ["in", "Zoom in"],
              ["out", "Zoom out"],
              ["reset-camera", "Reset camera"],
            ].map(([command, label]) => (
              <button
                key={command}
                type="button"
                disabled={readyKey !== sceneKey}
                onClick={() => cameraCommand.current?.(command)}
                className="min-h-10 rounded-lg border border-slate-200 bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              disabled={readyKey !== sceneKey}
              aria-pressed={wireframe}
              title="Show the rendering mesh; these lines are not physical structures"
              onClick={() =>
                setMeshView({ key: sceneKey, enabled: !wireframe })
              }
              className="min-h-10 rounded-lg border border-slate-200 bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {wireframe ? "Solid surfaces" : "Surface mesh"}
            </button>
            <button
              type="button"
              disabled={
                readyKey !== sceneKey ||
                (!focusSelected && hiddenPart === selected)
              }
              aria-pressed={focusSelected}
              onClick={() =>
                setFocus({ key: sceneKey, enabled: !focusSelected })
              }
              className="min-h-10 rounded-lg border border-slate-200 bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {focusSelected ? "Show whole model" : "Focus selected component"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
