class FileHeader {
  constructor(crc32, compressedSize, uncompressedSize, filename) {
    // Static Defaults
    this.localFileHeaderSignature = 0x04034b50;
    this.versionNeededToExtract = 20;
    this.generalPurposeBitFlag = 2;
    this.compressionMethod = 8;
    this.lastModifiedFileTime = 48128;
    this.lastModifiedFileDate = 8600;
    this.extraFieldLength = 0;

    // Variable
    this.crc32 = crc32;
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.filenameLength = Buffer.byteLength(filename);
    this.filename = filename;
  }

  getJSON() {
    return JSON.stringify(Object(this), null, 2);
  }

  getBytes() {
    const DEFAULT_LENGTH = 30;
    const FILENAME_LENGTH = Buffer.byteLength(this.filename);

    const buf = Buffer.allocUnsafe(DEFAULT_LENGTH + FILENAME_LENGTH);
    buf.writeUInt32LE(this.localFileHeaderSignature);
    buf.writeUint16LE(this.versionNeededToExtract, 4);
    buf.writeUint16LE(this.generalPurposeBitFlag, 6);
    buf.writeUint16LE(this.compressionMethod, 8);
    buf.writeUint16LE(this.lastModifiedFileTime, 10);
    buf.writeUint16LE(this.lastModifiedFileDate, 12);
    buf.writeUint32LE(this.crc32, 14);
    buf.writeUint32LE(this.compressedSize, 18);
    buf.writeUint32LE(this.uncompressedSize, 22);
    buf.writeUint16LE(this.filenameLength, 26);
    buf.writeUint16LE(this.extraFieldLength, 28);
    buf.write(this.filename, 30);
    return buf;
  }
}

export default FileHeader;
