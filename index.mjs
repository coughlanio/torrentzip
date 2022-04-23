import { fstat, readFileSync, writeFileSync } from "fs";
import pako from "pako";
import crc from "crc-32";
import { assert } from "console";

class LocalFileHeader {
  constructor(
    crc32,
    compressedSize,
    uncompressedSize,
    filenameLength,
    filename
  ) {
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
    this.filenameLength = filenameLength;
    this.filename = filename;
  }

  getJSON() {
    return JSON.stringify(Object(this), null, 2);
  }

  getBytes() {
    const DEFAULT_LENGTH = 30;
    const FILENAME_LENGTH = Buffer.byteLength(this.filename);

    const buf = Buffer.allocUnsafe(DEFAULT_LENGTH + FILENAME_LENGTH);
    console.log(DEFAULT_LENGTH + FILENAME_LENGTH);
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

class CentralDirectoryFile {
  constructor(
    crc32,
    compressedSize,
    uncompressedSize,
    filenameLength,
    relativeOffsetOfLocalHeader,
    filename
  ) {
    this.centralFileHeaderSignature = 0x02014b50;
    this.versionMadeBy = 0;
    this.versionNeededToExtract = 20;
    this.generalPurposeBitFlag = 2;
    this.compressionMethod = 8;
    this.lastModifiedFileTime = 48128;
    this.lastModifiedFileDate = 8600;

    this.crc32 = crc32;
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.filenameLength = filenameLength;

    this.extraFieldLength = 0;
    this.fileCommentLength = 0;
    this.diskNumberStart = 0;
    this.internalFileAttributes = 0;
    this.externalFileAttributes = 0;
    this.relativeOffsetOfLocalHeader = relativeOffsetOfLocalHeader;
    this.filename = filename;
  }

  getJSON() {
    return JSON.stringify(Object(this), null, 2);
  }

  getBytes() {
    const DEFAULT_LENGTH = 46;
    const FILENAME_LENGTH = Buffer.byteLength(this.filename);

    const buf = Buffer.allocUnsafe(DEFAULT_LENGTH + FILENAME_LENGTH);
    buf.writeUInt32LE(this.centralFileHeaderSignature);
    buf.writeUint16LE(this.versionMadeBy, 4);
    buf.writeUint16LE(this.versionNeededToExtract, 6);
    buf.writeUint16LE(this.generalPurposeBitFlag, 8);
    buf.writeUint16LE(this.compressionMethod, 10);
    buf.writeUint16LE(this.lastModifiedFileTime, 12);
    buf.writeUint16LE(this.lastModifiedFileDate, 14);
    buf.writeUint32LE(this.crc32, 16);
    buf.writeUint32LE(this.compressedSize, 20);
    buf.writeUint32LE(this.uncompressedSize, 24);
    buf.writeUint16LE(this.filenameLength, 28);
    buf.writeUint16LE(this.extraFieldLength, 30);
    buf.writeUint16LE(this.fileCommentLength, 32);
    buf.writeUint16LE(this.diskNumberStart, 34);
    buf.writeUint16LE(this.internalFileAttributes, 36);
    buf.writeUint32LE(this.externalFileAttributes, 38);
    buf.writeUint32LE(this.relativeOffsetOfLocalHeader, 42);
    buf.write(this.filename, 46);
    return buf;
  }
}

class EndOfCentralDirectory {
  constructor(
    totalFiles,
    sizeOfCentralDirectory,
    startOfCentralDirectory,
    crc32digest
  ) {
    this.endOfCentralDirectorySignature = 0x06054b50;
    this.diskNumber = 0;
    this.diskNumberStart = 0;
    this.totalNumEntriesOnDisk = totalFiles;
    this.totalNumEntries = totalFiles;
    this.sizeOfCentralDirectory = sizeOfCentralDirectory;
    this.startOfCentralDirectory = startOfCentralDirectory;
    this.commentLength = 22;
    this.comment = `TORRENTZIPPED-${crc32digest.toUpperCase()}`;
  }

  getJSON() {
    return JSON.stringify(Object(this), null, 2);
  }

  getBytes() {
    const DEFAULT_LENGTH = 44;

    const buf = Buffer.allocUnsafe(DEFAULT_LENGTH);
    buf.writeUInt32LE(this.endOfCentralDirectorySignature);
    buf.writeUInt16LE(this.diskNumber, 4);
    buf.writeUInt16LE(this.diskNumberStart, 6);
    buf.writeUInt16LE(this.totalNumEntriesOnDisk, 8);
    buf.writeUInt16LE(this.totalNumEntries, 10);
    buf.writeUInt32LE(this.sizeOfCentralDirectory, 12);
    buf.writeUInt32LE(this.startOfCentralDirectory, 16);
    buf.writeUInt16LE(this.commentLength, 20);
    buf.write(this.comment, 22);

    return buf;
  }
}
(async () => {
  const filename = "Super Mario Bros. (World).nes";
  const source = readFileSync(filename);
  const compressed = pako.deflateRaw(source, { level: 9 });

  const crc32 = crc.buf(source);

  /**
   * local file header
   * file data
   * central directory file
   * end of central directory
   */



  const localFileHeader = new LocalFileHeader(
    crc32,
    Buffer.byteLength(compressed),
    Buffer.byteLength(source),
    Buffer.byteLength(filename),
    filename,
  );

  const centralDirectoryFile = new CentralDirectoryFile(
      crc32,
      Buffer.byteLength(compressed),
      Buffer.byteLength(source),
      Buffer.byteLength(filename),
      0,
      filename,
  )

  const cdCrc32 = crc.buf(centralDirectoryFile.getBytes());

  const endOfCentralDirectory = new EndOfCentralDirectory(
      1,
      Buffer.byteLength(centralDirectoryFile.getBytes()),
      Buffer.byteLength(localFileHeader.getBytes()) + Buffer.byteLength(compressed),
      (cdCrc32 >>> 0).toString(16)
  )

  const output = Buffer.concat([localFileHeader.getBytes(), compressed, centralDirectoryFile.getBytes(), endOfCentralDirectory.getBytes()])

  writeFileSync('output.zip', output)


  const compressedSource = readFileSync("Super Mario Bros. (World).zip");

  const testBuffer = Buffer.allocUnsafe(59);
  compressedSource.copy(testBuffer, 0, 0, 59);
  console.log(testBuffer);

  assert(Buffer.compare(localFileHeader.getBytes(), testBuffer) === 0);
})();
