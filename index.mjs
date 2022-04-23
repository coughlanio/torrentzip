import { writeFileSync } from "fs";
import TorrentZip from "./src/TorrentZip.mjs";

(async () => {
  const filename = "Super Mario Bros. (World).nes";

  const tz = new TorrentZip();
  tz.addFile(filename);

  writeFileSync("output.zip", tz.getBytes());
})();
