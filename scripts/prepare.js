const fs = require('fs');
const exec = require('child_process');

try {
    fs.unlinkSync('dist');
} catch {}

exec.execFile("babel", ["--extensions", ".tsx", "../src/map/*", "--out-dir", "../dist", "--copy-files"], (error, stdout, stderr) => {
    console.log(stdout + "\n\n\n" + stderr);
});
