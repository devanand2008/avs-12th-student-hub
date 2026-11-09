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
  if (model === "coaxial-cable" || model === "optical-fibre") {
    // Stepped shells expose the layer below. Shells are hollow, not overlapping solid rods.
    const layers: [string, number, number, number, number][] =
      model === "coaxial-cable"
        ? [
            ["conductor", 0.15, 4.6, 0, 0xf59e0b],
            ["dielectric", 0.48, 3.5, -0.55, 0xe2e8f0],
            ["shield", 0.62, 2.5, -1.05, 0x94a3b8],
            ["jacket", 0.79, 1.5, -1.55, 0x334155],
          ]
        : [
            ["core", 0.22, 4.6, 0, 0x38bdf8],
            ["cladding", 0.52, 3.3, -0.65, 0xa78bfa],
            ["coating", 0.78, 1.9, -1.35, 0xf97316],
          ];
    layers.forEach(([part, radius, height, y, colour], i) => {
      add(
        new THREE.CylinderGeometry(radius, radius, height, 32, 1, i > 0),
        colour,
        part,
        v(0, y),
      );
      if (i > 0) {
        // Annular ends make the thickness clear without capping the inner layer.
        const inner = layers[i - 1][1];
        for (const end of [-1, 1]) {
          const ring = add(
            new THREE.RingGeometry(inner, radius, 32),
            colour,
            part,
            v(0, y + (end * height) / 2),
          );
          ring.rotation.x = Math.PI / 2;
        }
      }
    });
    return;
  }
  if (model === "ethernet-plug") {
    add(new THREE.BoxGeometry(3.4, 0.18, 2.4), 0x93c5fd, "housing", v(0, -0.4));
    add(
      new THREE.BoxGeometry(3.4, 0.9, 0.18),
      0x93c5fd,
      "housing",
      v(0, 0, -1.1),
    );
    for (let i = 0; i < 8; i++)
      add(
        new THREE.BoxGeometry(0.2, 0.13, 1.65),
        0xfbbf24,
        "contacts",
        v(-1.26 + i * 0.36, 0.12, 0.18),
      );
    const latch = add(
      new THREE.BoxGeometry(0.65, 0.13, 1.55),
      0x60a5fa,
      "latch",
      v(0, -0.82, 0.15),
    );
    latch.rotation.x = -0.2;
    return;
  }
  if (model === "ethernet-card") {
    add(new THREE.BoxGeometry(3.8, 2.4, 0.12), 0x16a34a, "board", v());
    add(
      new THREE.BoxGeometry(2.5, 0.35, 0.13),
      0xfbbf24,
      "connector",
      v(-0.35, -1.32),
    );
    // A hollow socket: four walls leave a visible opening facing the viewer.
    for (const x of [1.1, 2])
      add(
        new THREE.BoxGeometry(0.12, 0.85, 0.8),
        0x94a3b8,
        "port",
        v(x, 0, 0.45),
      );
    for (const y of [-0.42, 0.42])
      add(
        new THREE.BoxGeometry(1.02, 0.12, 0.8),
        0x94a3b8,
        "port",
        v(1.55, y, 0.45),
      );
    add(
      new THREE.BoxGeometry(0.8, 0.7, 0.04),
      0x334155,
      "port",
      v(1.55, 0, 0.08),
    );
    return;
  }
  if (model === "twisted-pair") {
    const pairs = [
      ["orange", 0xf97316, 0xffedd5],
      ["green", 0x22c55e, 0xdcfce7],
      ["blue", 0x3b82f6, 0xdbeafe],
      ["brown", 0xa16207, 0xfef3c7],
    ] as const;
    pairs.forEach(([part, colour, partner], index) => {
      const cx = index % 2 === 0 ? -0.55 : 0.55;
      const cz = index < 2 ? -0.55 : 0.55;
      for (let wire = 0; wire < 2; wire++) {
        const points = Array.from({ length: 121 }, (_, i) => {
          const phase = (i / 120) * Math.PI * 8 + wire * Math.PI;
          return v(
            0.19 * Math.cos(phase),
            -2.2 + (i / 120) * 4.4,
            0.19 * Math.sin(phase),
          );
        });
        add(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            120,
            0.075,
            8,
            false,
          ),
          wire ? partner : colour,
          part,
          v(cx, 0, cz),
        );
      }
    });
    // Open-ended partial cylinder exposes the conductors without hiding their separation.
    add(
      new THREE.CylinderGeometry(
        1.15,
        1.15,
        4.7,
        32,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      0x94a3b8,
      "jacket",
      v(),
    );
    return;
  }
  if (model === "sperm") {
    // Centre the long head-to-tail silhouette in the camera's default framing.
    group.position.y = 0.8;
    sphere(v(0, 1.6), v(0.48, 0.65, 0.3), 0xa78bfa, "nucleus");
    const cap = add(
      new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      0xfb7185,
      "acrosome",
      v(0, 1.72),
    );
    cap.scale.set(0.51, 0.57, 0.33);
    link(v(0, 0.95), v(0, 0.65), 0xfbbf24, "neck", 0.13);
    link(v(0, 0.65), v(0, -0.6), 0x34d399, "middle", 0.09);
    for (let i = 0; i < 30; i++) {
      const a = i * 0.75;
      ball(
        v(0.2 * Math.cos(a), 0.6 - i * 0.04, 0.2 * Math.sin(a)),
        0.105,
        0x34d399,
        "middle",
      );
    }
    const points = Array.from({ length: 30 }, (_, i) =>
      v(0.28 * Math.sin(i * 0.14), -0.6 - i * 0.115, 0.08 * Math.sin(i * 0.2)),
    );
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        48,
        0.045,
        8,
        false,
      ),
      0x60a5fa,
      "tail",
      v(),
    );
  } else if (model === "embryo-sac") {
    sphere(v(), v(1.25, 2.65, 0.8), 0xfbbf24, "central", 0.13);
    const cell = (x: number, y: number, color: number, part: string) => {
      sphere(v(x, y), v(0.32, 0.42, 0.3), color, part, 0.5);
      const nucleus = ball(v(x, y, 0.12), 0.12, color, part);
      nucleus.userData.nucleus = true;
    };
    cell(0, 1.65, 0xfb7185, "egg");
    cell(-0.62, 1.9, 0x38bdf8, "synergids");
    cell(0.62, 1.9, 0x38bdf8, "synergids");
    for (const x of [-0.55, 0, 0.55]) cell(x, -1.9, 0x34d399, "antipodals");
    for (const x of [-0.22, 0.22]) {
      const n = ball(v(x, 0, 0.1), 0.17, 0xa78bfa, "polar");
      n.userData.nucleus = true;
    }
  } else if (model === "bcc") {
    const corners: THREE.Vector3[] = [];
    for (const x of [-1.5, 1.5])
      for (const y of [-1.5, 1.5])
        for (const z of [-1.5, 1.5]) {
          const p = v(x, y, z);
          corners.push(p);
          ball(p, 0.33, 0x34d399, "corners");
          link(v(), p, 0xfbbf24, "neighbours", 0.025);
        }
    ball(v(), 0.43, 0xfb7185, "centre");
    for (let i = 0; i < corners.length; i++)
      for (let j = i + 1; j < corners.length; j++)
        if (Math.abs(corners[i].distanceTo(corners[j]) - 3) < 0.001)
          link(corners[i], corners[j], 0x60a5fa, "edges", 0.035);
  } else if (model === "pn-junction") {
    for (const y of [-0.85, 0, 0.85])
      for (const z of [-0.35, 0.35]) {
        const hole = add(
          new THREE.TorusGeometry(0.16, 0.045, 8, 20),
          0xfb7185,
          "holes",
          v(-2, y, z),
        );
        hole.userData.charge = 1;
        const electron = ball(v(2, y, z), 0.12, 0x38bdf8, "electrons");
        electron.userData.charge = -1;
        for (const [x, part, color, charge] of [
          [-0.6, "acceptors", 0xa78bfa, -1],
          [0.6, "donors", 0xfbbf24, 1],
        ] as const) {
          const ion = ball(v(x, y, z), 0.2, color, part);
          ion.userData.charge = charge;
          link(
            v(x - 0.1, y, z + 0.21),
            v(x + 0.1, y, z + 0.21),
            0x172554,
            part,
            0.025,
          );
          if (charge === 1)
            link(
              v(x, y - 0.1, z + 0.21),
              v(x, y + 0.1, z + 0.21),
              0x172554,
              part,
              0.025,
            );
        }
      }
    for (const y of [-1.4, 1.4]) {
      arrow(v(0.9, y, 0.55), v(-0.9, y, 0.55), 0x34d399, "field");
    }
  } else if (model === "ovum") {
    sphere(v(), v(1.1, 1.1, 1.1), 0xfbbf24, "egg", 0.45);
    ball(v(0, 0, 0.4), 0.3, 0xf59e0b, "egg");
    const coat = add(
      new THREE.SphereGeometry(1.4, 28, 20, 0, Math.PI * 1.35),
      0xa78bfa,
      "zona",
      v(),
    );
    const coatMaterial = coat.material as THREE.MeshStandardMaterial;
    coatMaterial.transparent = true;
    coatMaterial.opacity = 0.35;
    coatMaterial.depthWrite = false;
    for (let ring = 0; ring < 5; ring++)
      for (let i = 0; i < 16; i++) {
        const phi = ((ring + 1) * Math.PI) / 6,
          theta = (i * Math.PI * 2) / 16;
        // Leave a frontal window for the cutaway.
        if (Math.cos(theta) > 0.65 && ring > 0 && ring < 4) continue;
        ball(
          v(
            1.8 * Math.sin(phi) * Math.sin(theta),
            1.8 * Math.cos(phi),
            1.8 * Math.sin(phi) * Math.cos(theta),
          ),
          0.17,
          0xfb7185,
          "corona",
        );
      }
  } else if (model === "nacl") {
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const sodium = (x + y + z) % 2 === 0;
          ball(
            v(x * 1.25, y * 1.25, z * 1.25),
            sodium ? 0.23 : 0.34,
            sodium ? 0xa78bfa : 0x34d399,
            sodium ? "sodium" : "chloride",
          );
        }
    for (const end of [
      v(1.25),
      v(-1.25),
      v(0, 1.25),
      v(0, -1.25),
      v(0, 0, 1.25),
      v(0, 0, -1.25),
    ])
      link(v(), end, 0x94a3b8, "neighbours", 0.025);
    group.rotation.set(0.3, -0.45, 0);
  } else if (model === "octahedral") {
    ball(v(), 0.4, 0x2563eb, "metal");
    for (const end of [
      v(0, 1.8),
      v(0, -1.8),
      v(1.8),
      v(-1.8),
      v(0, 0, 1.8),
      v(0, 0, -1.8),
    ]) {
      const axial = end.y !== 0,
        part = axial ? "axial" : "equatorial",
        color = axial ? 0xfbbf24 : 0x34d399;
      ball(end, 0.27, color, part);
      link(v(), end, color, part, 0.055);
    }
    group.rotation.set(0.2, -0.4, 0);
  } else if (model === "chromosome") {
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
