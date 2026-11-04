// Arma la versión protegida del sitio en ./dist: copia todo y ofusca los <script> en línea
// de index.html y admin.html. No toca main: el resultado se publica en la rama "publicar".
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import JavaScriptObfuscator from "javascript-obfuscator";

const SKIP = new Set([".git", ".github", "scripts", "node_modules", "dist", "package.json", "package-lock.json"]);
const OPCIONES = {
  compact: true,
  target: "browser",
  renameGlobals: false,          // los nombres globales se mantienen: los scripts se hablan entre sí y con el HTML
  renameProperties: false,
  controlFlowFlattening: false,  // más seguro: no cambia la estructura del código
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  shuffleStringArray: true,
  splitStrings: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  identifierNamesGenerator: "hexadecimal",
};

function copiar(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const n of fs.readdirSync(src)) {
    if (SKIP.has(n)) continue;
    const s = path.join(src, n), d = path.join(dst, n);
    if (fs.statSync(s).isDirectory()) copiar(s, d); else fs.copyFileSync(s, d);
  }
}

fs.rmSync("dist", { recursive: true, force: true });
copiar(".", "dist");
fs.writeFileSync("dist/.nojekyll", "");

let total = 0;
for (const f of ["index.html", "admin.html"]) {
  const p = path.join("dist", f);
  let n = 0;
  const html = fs.readFileSync(p, "utf8").replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => {
    n++;
    new vm.Script(js, { filename: `${f}#${n} (original)` });              // el original debe ser válido
    const out = JavaScriptObfuscator.obfuscate(js, { ...OPCIONES, identifiersPrefix: `g${n}` }).getObfuscatedCode();
    new vm.Script(out, { filename: `${f}#${n} (ofuscado)` });             // y el ofuscado también
    return `<script>${out}</script>`;
  });
  fs.writeFileSync(p, html);
  console.log(`${f}: ${n} scripts ofuscados`);
  total += n;
}
if (!total) throw new Error("No se ofuscó ningún script");
console.log("Listo: ./dist");
