/**
 * The .ico format browsers and Google Search fetch from /favicon.ico, holding PNG images (every
 * browser since IE Vista reads PNG inside .ico): a 6-byte header, a 16-byte entry per image, the PNGs.
 */
export function ico(images: Array<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + i * 16;
    // Width and height take one byte each: 0 stands for 256.
    header.writeUInt8(size % 256, at);
    header.writeUInt8(size % 256, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

/** The images in an .ico file, as its entries list them. */
export function icoEntries(file: Buffer): Array<{ size: number; png: Buffer }> {
  return Array.from({ length: file.readUInt16LE(4) }, (_, i) => {
    const at = 6 + i * 16;
    const start = file.readUInt32LE(at + 12);
    return { size: file.readUInt8(at) || 256, png: file.subarray(start, start + file.readUInt32LE(at + 8)) };
  });
}
