const fs = require('fs');
const exec = require('child_process');

try {
    fs.unlinkSync('dist');
} catch {}

exec.spawnSync("babel", ["--extensions", ".tsx", "src/map/*", "--out-dir dist", "--copy-files"]);
