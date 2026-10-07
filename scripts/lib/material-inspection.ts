import { createHash } from "node:crypto";

export function materialId(kind: "note" | "video", sourceFile: string) {
  return `${kind}-import-${createHash("sha256").update(sourceFile.replaceAll("\\", "/")).digest("hex").slice(0, 24)}`;
}

// Read mvhd inside moov; supports both 32-bit and 64-bit ISO BMFF boxes.
export function mp4Duration(buffer: Buffer): number {
  function scan(start: number, end: number): number | null {
    for (let offset = start; offset + 8 <= end;) {
      let size = buffer.readUInt32BE(offset);
      const type = buffer.toString("ascii", offset + 4, offset + 8);
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) throw new Error("Truncated MP4 box.");
        size = Number(buffer.readBigUInt64BE(offset + 8));
        header = 16;
      } else if (size === 0) size = end - offset;
      if (!Number.isSafeInteger(size) || size < header || offset + size > end)
        throw new Error("Invalid MP4 box size.");
      const payload = offset + header;
      if (type === "moov") {
        const duration = scan(payload, offset + size);
        if (duration !== null) return duration;
      }
      if (type === "mvhd") {
        const version = buffer[payload];
        if (version !== 0 && version !== 1)
          throw new Error("Unsupported MP4 movie header.");
        const scaleOffset = payload + (version === 1 ? 20 : 12);
        const needed = version === 1 ? 12 : 8;
        if (scaleOffset + needed > offset + size)
          throw new Error("Truncated MP4 movie header.");
        const scale = buffer.readUInt32BE(scaleOffset);
        const ticks =
          version === 1
            ? Number(buffer.readBigUInt64BE(scaleOffset + 4))
            : buffer.readUInt32BE(scaleOffset + 4);
        if (!scale || !Number.isFinite(ticks / scale) || ticks <= 0)
          throw new Error("Invalid MP4 duration.");
        return ticks / scale;
      }
      offset += size;
    }
    return null;
  }
  const duration = scan(0, buffer.length);
  if (duration === null) throw new Error("MP4 movie duration was not found.");
  return Math.ceil(duration);
}
