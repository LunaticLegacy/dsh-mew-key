import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function boot(mocks = {}) {
  const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let pluginExports = {}
  let registration, clean
  const calls = []
  const remote = {
    cancel: async req => { calls.push(['cancel',req]); return mocks.cancel ?? {ok:true,value:{accepted:true}} },
    wait: async req => { calls.push(['wait',req]); return mocks.wait ?? {ok:true,value:{reason:'idle',state:{running:false},output:{records:[],truncated:false}}} },
    prompt: async req => { calls.push(['prompt',req]); return mocks.prompt ?? {ok:true,value:{accepted:true}} },
  }
  const head={appendChild() {}}
  const ctx = {
    remote:{session:remote},
    effect: (cb)=>{clean=cb()},
    slots:{inject:(key,cb)=>{assert.equal(key,'conversation.input.overlay');cb()},register:(desc,component)=>{registration=desc;assert.equal(desc.id,'mew-key');return()=>{}}},
  }
  runInNewContext(code, {
    window: {__ModuleLoader__: {load: ({id,factory}) => { assert.equal(id,'dsh-mew-key'); pluginExports=factory(name=>{if (name==='react/jsx-runtime') return {jsx(){},jsxs(){}}; return {}}) }}},
    require(name) { if (name==='react/jsx-runtime')return {jsx(){},jsxs(){}};return {} },
    crypto:{randomUUID:()=> '11111111-2222-4333-8444-555555555555'},
    document:{createElement:()=>({dataset:{},remove(){}}),head},
    console,
  })
  pluginExports.apply(ctx)
  return {calls, fire:registration.inject('session-xyz').fire, clean, modeText:pluginExports.PROMPTS}
}

test('gentle: one prompt, no cancellation, Session-scoped', async()=>{
  const app=boot()
  await app.fire('gentle')
  assert.equal(app.calls.length,1)
  assert.equal(app.calls[0][0],'prompt')
  assert.equal(app.calls[0][1].sessionId,'session-xyz')
  assert.equal(app.calls[0][1].mode,'steer')
  assert.match(app.calls[0][1].content[0].text,/continue the original task/)
})

test('interrupt: cancel, wait for idle, then prompt', async()=>{
  const app=boot()
  await app.fire('interrupt')
  assert.deepEqual(app.calls.map(c=>c[0]),['cancel','wait','prompt'])
  assert.equal(app.calls[1][1].timeoutMs,12000)
  assert.match(app.calls[2][1].content[0].text,/Do not resume/)
})

test('interrupt timeout does not send new prompt', async()=>{
  const app=boot({wait:{ok:true,value:{reason:'timeout',state:{running:true},output:{records:[],truncated:false}}}})
  await assert.rejects(()=>app.fire('interrupt'),/尚未完成/)
  assert.deepEqual(app.calls.map(c=>c[0]),['cancel','wait'])
})

test('cancel refusal blocks submission', async()=>{
  const app=boot({cancel:{ok:false,error:{message:'not permitted'}}})
  await assert.rejects(()=>app.fire('interrupt'),/not permitted/)
  assert.deepEqual(app.calls.map(c=>c[0]),['cancel'])
})

test('prompt refusal propagates error', async()=>{
  const app=boot({prompt:{ok:false,error:{message:'not writable'}}})
  await assert.rejects(()=>app.fire('gentle'),/not writable/)
})

test('declares both parent remote service and remote.session nested service', ()=>{
  const app=boot()
  assert.equal(typeof app.fire,'function')
  const source = readFileSync(new URL('../src/client.tsx', import.meta.url), 'utf8')
  assert.match(source, /inject\s*=\s*\[\s*'slots'\s*,\s*'remote'\s*,\s*'remote\.session'\s*\]/)
})

test('browser manifest loads remote service provider', ()=>{
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-api-remotes'))
})

test('Cordis-style remote dependency guard accepts declared parent remote', async()=>{
  const source = readFileSync(new URL('../src/client.tsx', import.meta.url), 'utf8')
  const decl = source.match(/export const inject\s*=\s*\[([^\]]+)\]/)
  assert.ok(decl, 'plugin must declare Cordis dependencies')
  const names = Array.from(decl[1].matchAll(/'([^']+)'/g), match => match[1])
  const allowed = new Set(names)
  const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let exports
  runInNewContext(code, {
    window: { __ModuleLoader__: { load: ({factory})=>{
      exports = factory((name) => name==='react/jsx-runtime'?{jsx(){},jsxs(){}}:{})
    }}},
    document:{createElement:()=>({dataset:{},remove(){}}),head:{appendChild(){}}},
    crypto:{randomUUID:()=>'123e4567-e89b-42d3-a456-426614174000'},
  })
  let registered
  const session={prompt:async()=>({ok:true,value:{accepted:true}})}
  const ctx=new Proxy({
    slots:{inject:(_name,create)=>create(),register:(meta)=>{registered=meta}},
    remote:{session},
    effect:(callback)=>callback(),
  },{
    get(target,key){
      if(key==='remote'&&!allowed.has('remote'))throw new Error('cannot get property "remote" without inject')
      return target[key]
    },
  })
  exports.apply(ctx)
  await registered.inject('test-session-id').fire('gentle')
})
