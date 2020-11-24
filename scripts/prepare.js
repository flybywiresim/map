const fs = require('fs');
const exec = require('child_process');

fs.unlinkSync('dist');

exec.spawnSync("babel", ["--extensions", ".tsx", "src/map/*", "--out-dir dist", "--copy-files"]);
