export function circuit(voltage: number, resistance: number) {
  if (
    !Number.isFinite(voltage) ||
    !Number.isFinite(resistance) ||
    resistance <= 0
  )
    throw new Error("Use finite voltage and positive resistance.");
  const current = voltage / resistance;
  return { current, power: voltage * current };
}
export function thinLens(objectDistance: number, focalLength = 1) {
  if (
    !Number.isFinite(objectDistance) ||
    !Number.isFinite(focalLength) ||
    focalLength <= 0 ||
    objectDistance <= focalLength
  )
    throw new Error(
      "Real-image lesson requires an object outside a positive focal length.",
    );
  const imageDistance =
    (focalLength * objectDistance) / (objectDistance - focalLength);
  return { imageDistance, magnification: -imageDistance / objectDistance };
}
export const sineVoltage = (peak: number, frequency: number, time: number) =>
  peak * Math.sin(2 * Math.PI * frequency * time);
export const tangent = (a: number, x: number) => a * a + 2 * a * (x - a);
export const secantSlope = (a: number, h: number) => {
  if (!h) throw new Error("h must be nonzero");
  return 2 * a + h;
};
export function trophicEnergy(initial: number, efficiency: number) {
  if (
    initial < 0 ||
    efficiency < 0 ||
    efficiency > 1 ||
    !Number.isFinite(initial + efficiency)
  )
    throw new Error("Invalid energy or efficiency");
  return Array.from({ length: 4 }, (_, i) => initial * efficiency ** i);
}
export function transformerVoltage(primary: number, ratio: number) {
  if (!Number.isFinite(primary + ratio) || ratio <= 0)
    throw new Error("Positive finite turns ratio required");
  return primary * ratio;
}
export interface AlgorithmFrame {
  values: number[];
  active: number[];
  message: string;
  key?: number;
  low?: number;
  high?: number;
  found?: number;
}
export function parseLabArray(value: string) {
  const tokens = value.trim().split(/[\s,]+/);
  if (
    !value.trim() ||
    tokens.length > 12 ||
    tokens.some((t) => !/^[-+]?\d+$/.test(t))
  )
    throw new Error("Enter 1–12 integers separated by commas or spaces.");
  const numbers = tokens.map(Number);
  if (numbers.some((n) => !Number.isSafeInteger(n) || Math.abs(n) > 999))
    throw new Error("Use integers from −999 to 999.");
  return numbers;
}
export function binarySearchFrames(
  input: number[],
  target: number,
): AlgorithmFrame[] {
  const values = [...input].sort((a, b) => a - b),
    frames: AlgorithmFrame[] = [
      {
        values: [...values],
        active: [],
        message: "Input sorted ascending; indices start at zero.",
      },
    ];
  let low = 0,
    high = values.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    frames.push({
      values: [...values],
      active: [mid],
      low,
      high,
      message: `Compare target ${target} with index ${mid}: ${values[mid]}.`,
    });
    if (values[mid] === target) {
      frames.push({
        values: [...values],
        active: [mid],
        found: mid,
        message: `Found ${target} at index ${mid}.`,
      });
      return frames;
    }
    if (values[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  frames.push({
    values: [...values],
    active: [],
    message: `${target} is not present.`,
  });
  return frames;
}
export function insertionSortFrames(input: number[]): AlgorithmFrame[] {
  const a = [...input],
    frames: AlgorithmFrame[] = [
      {
        values: [...a],
        active: [],
        message: "The first item is the initial sorted prefix.",
      },
    ];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    frames.push({
      values: [...a],
      active: [i],
      key,
      message: `Hold key ${key} from index ${i}.`,
    });
    while (j >= 0) {
      frames.push({
        values: [...a],
        active: [j],
        key,
        message: `Compare ${a[j]} with held key ${key}.`,
      });
      if (a[j] <= key) break;
      a[j + 1] = a[j];
      frames.push({
        values: [...a],
        active: [j, j + 1],
        key,
        message: `Shift ${a[j]} from index ${j} to ${j + 1}; key remains held.`,
      });
      j--;
    }
    a[j + 1] = key;
    frames.push({
      values: [...a],
      active: [j + 1],
      message: `Insert ${key} at index ${j + 1}; prefix through index ${i} is sorted.`,
    });
  }
  frames.push({
    values: [...a],
    active: [],
    message: "Sorted ascending. All keys have been inserted.",
  });
  return frames;
}
