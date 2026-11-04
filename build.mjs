import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// No dependency downloader: requires TypeScript available from the project's toolchain.
let ts
try { ts = require('typescript') } catch {
  console.error('Install TypeScript or run the included precompiled lib/client.js.')
  process.exit(1)
}
const source = fs.readFileSync('src/client.tsx', 'utf8')
const result=ts.transpileModule(source,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},
  fileName:'src/client.tsx',reportDiagnostics:true,
})
const failures=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error)
if(failures.length){for(const f of failures)console.error(ts.flattenDiagnosticMessageText(f.messageText,'\n'));process.exit(1)}
fs.mkdirSync('lib',{recursive:true})
// Match DSH's official browser ModuleLoader contract (client/tsdown.client.ts).
// The browser does NOT directly execute a plain CommonJS module.
const client = `window.__ModuleLoader__.load({ id: 'dsh-mew-key', factory: (require) => {\n` +
  `var module = { exports: {} }; var exports = module.exports;\n` +
  result.outputText + `\nreturn module.exports; } });\n`
fs.writeFileSync('lib/client.js',client)
console.log('Built lib/client.js')
