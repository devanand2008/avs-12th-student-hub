import * as THREE from "three";

export function scienceGeometry(
  model: string,
  group: THREE.Group,
  meshes: THREE.Mesh[],
  sphere: (
    pos: THREE.Vector3,
    scale: THREE.Vector3,
    color: number,
    part: string,
    opacity?: number,
  ) => THREE.Mesh,
  link: (
    a: THREE.Vector3,
    b: THREE.Vector3,
    color: number,
    part: string,
    radius?: number,
  ) => void,
) {
  const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const ball = (
    pos: THREE.Vector3,
    size: number,
    color: number,
    part: string,
  ) => sphere(pos, v(size, size, size), color, part);
  const add = (
    geometry: THREE.BufferGeometry,
    color: number,
    part: string,
    pos: THREE.Vector3,
  ) => {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.copy(pos);
    mesh.userData.part = part;
    group.add(mesh);
    meshes.push(mesh);
    return mesh;
  };
  const arrow = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    color: number,
    part: string,
  ) => {
    const direction = b.clone().sub(a).normalize();
    link(a, b.clone().addScaledVector(direction, -0.2), color, part, 0.04);
    const head = add(
      new THREE.ConeGeometry(0.13, 0.3, 12),
      color,
      part,
      b.clone().addScaledVector(direction, -0.15),
    );
    head.quaternion.setFromUnitVectors(v(0, 1, 0), direction);
  };
  if (model === "chromosome") {
    for (const sign of [-1, 1]) {
      link(v(sign * 0.9, 1.7), v(sign * 0.12, 0), 0xa78bfa, "chromatids", 0.22);
      link(v(sign * 0.12, 0), v(sign * 1.1, -2), 0xa78bfa, "chromatids", 0.22);
    }
    sphere(v(), v(0.4, 0.25, 0.3), 0xfbbf24, "centromere");
  } else if (model === "bacterium") {
    sphere(v(-0.3), v(1.8, 0.85, 0.8), 0x34d399, "envelope", 0.22);
    const dna = Array.from({ length: 101 }, (_, i) => {
      const t = (i / 100) * Math.PI * 6;
      return v(-1.3 + (i / 100) * 2, 0.25 * Math.sin(t), 0.3 * Math.cos(t));
    });
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(dna),
        100,
        0.055,
        8,
        false,
      ),
      0xa78bfa,
      "nucleoid",
      v(),
    );
    const tail = Array.from({ length: 101 }, (_, i) =>
      v(1.4 + (i / 100) * 1.6, 0.25 * Math.sin((i / 100) * Math.PI * 5), 0),
    );
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(tail),
        100,
        0.045,
        8,
        false,
      ),
      0xfbbf24,
      "flagellum",
      v(),
    );
  } else if (model === "dipole") {
    ball(v(-1.6), 0.4, 0x60a5fa, "negative");
    ball(v(1.6), 0.4, 0xfb7185, "positive");
    link(v(-1.8, 0, 0.42), v(-1.4, 0, 0.42), 0xffffff, "negative", 0.04);
    link(v(1.4, 0, 0.42), v(1.8, 0, 0.42), 0xffffff, "positive", 0.04);
    link(v(1.6, -0.2, 0.42), v(1.6, 0.2, 0.42), 0xffffff, "positive", 0.04);
    arrow(v(-1.6, -0.9), v(1.6, -0.9), 0xfbbf24, "moment");
  } else if (model === "ammonia") {
    ball(v(0, 0.5), 0.5, 0x2563eb, "nitrogen");
    const c = Math.sqrt((Math.cos(THREE.MathUtils.degToRad(107)) + 0.5) / 1.5);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const p = v(
        Math.cos(a) * Math.sqrt(1 - c * c) * 1.8,
        0.5 - c * 1.8,
        Math.sin(a) * Math.sqrt(1 - c * c) * 1.8,
      );
      ball(p, 0.3, 0xcbd5e1, "hydrogen");
      link(v(0, 0.5), p, 0x60a5fa, "bond", 0.09);
    }
  } else if (model === "carbon-dioxide") {
    ball(v(), 0.45, 0x475569, "carbon");
    for (const x of [-1.8, 1.8]) {
      ball(v(x), 0.5, 0xf43f5e, "oxygen");
      for (const y of [-0.12, 0.12])
        link(v(0, y), v(x, y), 0x60a5fa, "bond", 0.06);
    }
  } else if (model === "water" || model === "methane") {
    const water = model === "water";
    ball(v(), 0.55, water ? 0xf43f5e : 0x475569, water ? "oxygen" : "carbon");
    const angle = THREE.MathUtils.degToRad(104.5 / 2);
    const positions = water
      ? [
          v(-Math.sin(angle), Math.cos(angle), 0),
          v(Math.sin(angle), Math.cos(angle), 0),
        ].map((p) => p.multiplyScalar(1.8))
      : [v(1, 1, 1), v(-1, -1, 1), v(-1, 1, -1), v(1, -1, -1)].map((p) =>
          p.normalize().multiplyScalar(1.8),
        );
    for (const pos of positions) {
      ball(pos, 0.32, 0xcbd5e1, "hydrogen");
      link(v(), pos, 0x60a5fa, "bond", 0.1);
    }
  } else if (model === "capacitor") {
    for (const [x, part, color] of [
      [-1.5, "positive", 0xfb7185],
      [1.5, "negative", 0x60a5fa],
    ] as const) {
      add(new THREE.BoxGeometry(0.12, 3.2, 2.6), color, part, v(x));
      // Charge symbols on the upper edge remain visible from the initial view.
      link(v(x - 0.2, 1.9), v(x + 0.2, 1.9), color, part, 0.06);
      if (part === "positive") link(v(x, 1.7), v(x, 2.1), color, part, 0.06);
    }
    for (const y of [-0.8, 0, 0.8])
      for (const z of [-0.7, 0.7])
        arrow(v(-1.35, y, z), v(1.35, y, z), 0xfbbf24, "field");
    group.rotation.y = -0.35;
  } else if (model === "solenoid") {
    const points = Array.from({ length: 401 }, (_, i) => {
      const t = i / 400;
      return v(
        (t - 0.5) * 4.5,
        Math.cos(t * Math.PI * 16),
        Math.sin(t * Math.PI * 16),
      );
    });
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        400,
        0.065,
        8,
        false,
      ),
      0xfb923c,
      "coil",
      v(),
    );
    arrow(v(-2.6), v(2.6), 0x60a5fa, "axis");
    group.rotation.y = -0.3;
  } else if (model === "animal-cell") {
    const shell = add(
      new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 1.3),
      0xf472b6,
      "membrane",
      v(),
    );
    shell.scale.set(2.2, 1.8, 1.4);
    const material = shell.material as THREE.MeshStandardMaterial;
    material.transparent = true;
    material.opacity = 0.25;
    material.depthWrite = false;
    ball(v(-0.6, 0.3, 0.3), 0.65, 0xa78bfa, "nucleus");
    for (const p of [v(0.9, 0.8, 0.4), v(1, -0.7, 0.6), v(-1, -0.8, 0.5)]) {
      const m = sphere(p, v(0.48, 0.22, 0.22), 0xfb923c, "mitochondria");
      m.rotation.z = 0.5;
    }
    group.rotation.y = -0.4;
  } else if (model === "neuron") {
    ball(v(-1.2, 0), 0.6, 0xa78bfa, "soma");
    for (const y of [-1.1, -0.5, 0.5, 1.1]) {
      link(v(-1.5, y * 0.2), v(-2.3, y), 0x34d399, "dendrites", 0.07);
      link(v(-2.3, y), v(-2.8, y + 0.25, 0.3), 0x34d399, "dendrites");
      link(v(-2.3, y), v(-2.8, y - 0.2, -0.3), 0x34d399, "dendrites");
    }
    link(v(-0.6), v(2.2), 0xfbbf24, "axon", 0.07);
    for (const x of [-0.15, 0.55, 1.25])
      link(v(x - 0.22), v(x + 0.22), 0x60a5fa, "myelin", 0.18);
    for (const y of [-0.6, 0, 0.6]) {
      link(v(2.2), v(2.8, y, 0.15), 0xfbbf24, "axon");
      ball(v(2.8, y, 0.15), 0.11, 0xfbbf24, "axon");
    }
  }
}
