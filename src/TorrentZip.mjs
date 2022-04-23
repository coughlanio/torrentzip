import crc from "crc-32";
import { readFileSync } from "fs";
import pako from "pako";
import { join } from "path";
import { CentralDirectoryFileHeader, EOCDRecord } from "./CentralDirectory.mjs";
import FileHeader from "./FileHeader.mjs";

class TorrentZip {
  constructor(path) {
    this.files = [];
    this.cd = [];
    this.path = path;
  }

  getLastOffset() {
    return this.files.reduce((prev, current) => {
      prev += current[2];
      return prev;
    }, 0);
  }

  addFile(filename) {
    const source = readFileSync(join(this.path, filename));
    const gzip = pako.deflateRaw(source, { level: 9 });

    const crc32 = crc.buf(source, 0);

    const compressedSize = Buffer.byteLength(gzip);
    const uncompressedSize = Buffer.byteLength(source);

    const header = new FileHeader(
      crc32.toString() >>> 0,
      compressedSize,
      uncompressedSize,
      filename
    ).getBytes();

    const cdFileHeader = new CentralDirectoryFileHeader(
      crc32.toString() >>> 0,
      compressedSize,
      uncompressedSize,
      this.getLastOffset(),
      filename
    ).getBytes();

    const size = Buffer.byteLength(header) + Buffer.byteLength(gzip);
    this.files.push([header, gzip, size]);

    const recordSize = Buffer.byteLength(cdFileHeader);

    this.cd.push([cdFileHeader, recordSize]);
  }

  getCentralDirectoryCRC() {
    const crc32 = crc.buf(Buffer.concat([...this.cd.map((cd) => cd[0])]));

    return (crc32 >>> 0).toString(16);
  }

  getCentralDirectorySize() {
    return this.cd.reduce((prev, current) => {
      prev += current[1];
      return prev;
    }, 0);
  }

  getBytes() {
    const eocd = new EOCDRecord(
      this.files.length,
      this.getCentralDirectorySize(),
      this.getLastOffset(),
      this.getCentralDirectoryCRC()
    ).getBytes();

    return Buffer.concat([
      ...this.files.reduce((prev, current) => {
        prev.push(current[0], current[1]);
        return prev;
      }, []),
      ...this.cd.map((cd) => cd[0]),
      eocd,
    ]);
  }
}

export default TorrentZip;
