import { fdir } from "fdir";
import { writeFileSync } from "fs";
import TorrentZip from "./src/TorrentZip.mjs";

(async () => {
  const path = "/Users/chriscoughlan/Desktop/Atari 5200";
  const api = new fdir().withRelativePaths().crawl(path);

  const files = api.sync();

  const sorted = files.sort((a, b) => {
    const ax = a.toLowerCase();
    const bx = b.toLowerCase();

    return -(ax < bx) || +(ax > bx);
  });

  const tz = new TorrentZip(path);

  for (const file of sorted) {
    console.log(`Adding ${file}`);
    tz.addFile(file);
  }

  writeFileSync("output.zip", tz.getBytes());
})();
