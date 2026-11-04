/**
 * Mew Key for DeepSeek Harness Web.
 * Floating paw button near the composer submit area.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionRequestId } from '@deepseek-ai/dsh-api-session-controller/remote'
import type { PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/remote'

export const name = 'dsh-mew-key-client'
export const inject = ['slots', 'remote', 'remote.session']

export type Mode = 'gentle' | 'interrupt'

export interface MewPort {
  fire(sessionId: SessionId, mode: Mode, signal?: AbortSignal): Promise<void>
}
interface MewInjected { fire: (mode: Mode) => Promise<void> }
type MewProps = PropsRuntime<'conversation.input.overlay'> & InjectFace<MewInjected>

export const PROMPTS: Readonly<Record<Mode, string>> = {
  gentle: [
    '[Mew Key · one-time human steering]',
    'At your next safe model step, briefly acknowledge this playful human interruption.',
    'Say exactly one short cat vocalization in the predominant language of your current work',
    '(中文：喵。 English: Meow. 日本語：にゃー。 Français : Miaou. Deutsch: Miau.).',
    'Then continue the original task normally. Do not change plans, notes, files, or tools because of this event.',
    'Do not interpret the event as abandoning the task. Do not start unrelated work.',
  ].join('\n'),
  interrupt: [
    '[Mew Key · human interruption]',
    'The human has stopped your previous turn. Do not resume the previous task in this reply.',
    'Reply with only ONE short cat vocalization in the predominant language of the task',
    '(中文：喵。 English: Meow. 日本語：にゃー。 Français : Miaou. Deutsch: Miau.).',
    'No tool calls, explanation, markdown, task changes, or extra words.',
  ].join('\n'),
}

const STYLE = `
.mew-key-seat{position:absolute;right:14px;bottom:62px;z-index:5;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.mew-key-seat > *{pointer-events:auto}
.mew-paw-fab{appearance:none;width:40px;height:40px;border:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;color:#ffd4ea;background:linear-gradient(180deg,rgba(129,138,255,.92),rgba(104,109,236,.96));box-shadow:0 10px 26px rgba(19,22,52,.35),0 0 0 1px rgba(255,255,255,.08) inset;transition:transform .16s ease,filter .16s ease,box-shadow .16s ease}
.mew-paw-fab:hover{transform:translateY(-1px);filter:brightness(1.06);box-shadow:0 12px 28px rgba(19,22,52,.38),0 0 0 1px rgba(255,255,255,.12) inset,0 0 0 4px rgba(129,138,255,.12)}
.mew-paw-fab:active{transform:translateY(1px)}
.mew-paw-fab:focus-visible,.mew-pop button:focus-visible{outline:2px solid #f0a3d8;outline-offset:3px}
.mew-paw-fab[data-open=true]{background:linear-gradient(180deg,rgba(246,151,203,.96),rgba(225,113,188,.96));box-shadow:0 12px 28px rgba(84,21,74,.35),0 0 0 1px rgba(255,255,255,.12) inset,0 0 0 4px rgba(251,173,214,.12)}
.mew-paw-fab svg{width:20px;height:20px;filter:drop-shadow(0 2px 6px rgba(41,26,76,.24))}
.mew-pop{width:min(288px,calc(100vw - 32px));border-radius:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(165deg,rgba(33,35,57,.96),rgba(22,24,40,.98));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 24px 60px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.03) inset;padding:12px}
.mew-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 2px 10px 2px}
.mew-pop-title{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f6d5e7}
.mew-pop-sub{font-size:11px;color:#a6abc8}
.mew-status{display:flex;align-items:center;gap:6px;font-size:11px;color:#9ca3be}.mew-status-dot{width:6px;height:6px;border-radius:50%;background:#85d6bd;box-shadow:0 0 8px #85d6bd77}
.mew-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mew-mode{min-height:72px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(255,255,255,.035);padding:10px 10px 9px;text-align:left;color:#eceff9;cursor:pointer;transition:transform .14s ease,border-color .14s ease,background .14s ease}
.mew-mode:hover{background:rgba(255,255,255,.06);transform:translateY(-1px)}
.mew-mode[data-active=true]{border-color:rgba(249,163,215,.62);background:linear-gradient(165deg,rgba(247,144,201,.13),rgba(126,136,255,.13))}
.mew-mode-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:760;color:#fff6fb}
.mew-mode-copy{margin-top:6px;font-size:10.5px;line-height:1.45;color:#b3b7cd}
.mew-pop-note{margin-top:10px;border-radius:12px;padding:9px 10px;font-size:10.5px;line-height:1.55;color:#cbd0e4;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.045)}
.mew-pop-note strong{color:#ffe3f0}
.mew-action{margin-top:10px;width:100%;min-height:40px;border:0;border-radius:12px;background:linear-gradient(105deg,#ffbddf,#eeccff 60%,#cbd0ff);color:#2f2d4b;font-size:13px;font-weight:850;cursor:pointer;box-shadow:0 8px 24px rgba(203,124,209,.16);transition:transform .14s ease,filter .14s ease}
.mew-action:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.04)}
.mew-action:active:not(:disabled){transform:translateY(1px)}
.mew-action:disabled{opacity:.68;cursor:wait}
.mew-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:9px;padding:0 2px;font-size:10px;color:#939ab7}
.mew-feedback{margin-top:8px;font-size:11px;line-height:1.45}
.mew-feedback[data-kind=success]{color:#cbf4df}.mew-feedback[data-kind=error]{color:#ffc3cc}
@media(max-width:780px){.mew-key-seat{right:10px;bottom:58px}.mew-paw-fab{width:38px;height:38px}.mew-pop{width:min(266px,calc(100vw - 24px))}}
@media(prefers-reduced-motion:reduce){.mew-paw-fab,.mew-mode,.mew-action{transition:none!important}}
`

function Paw({size=20}: {size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M29 55C23 61 18 66 19 74c2 10 12 11 21 7 5-2 11-2 16 0 9 4 20 3 22-7 2-8-4-14-11-20-8-7-13-17-20-17-8 0-12 11-18 18Z" fill="currentColor"/>
    <ellipse cx="20" cy="39" rx="9" ry="13" transform="rotate(-19 20 39)" fill="currentColor"/>
    <ellipse cx="41" cy="24" rx="9" ry="13" transform="rotate(-7 41 24)" fill="currentColor"/>
    <ellipse cx="64" cy="27" rx="9" ry="13" transform="rotate(17 64 27)" fill="currentColor"/>
    <ellipse cx="81" cy="45" rx="8" ry="12" transform="rotate(30 81 45)" fill="currentColor"/>
  </svg>
}

function MewAction({sessionId,useSession,useAccess,fire}:MewProps) {
  const running=useSession(s=>s.running)
  const canPrompt=useAccess('session/prompt')
  const canCancel=useAccess('session/cancel')
  const [open,setOpen]=useState(false)
  const [mode,setMode]=useState<Mode>('gentle')
  const [busy,setBusy]=useState(false)
  const [failure,setFailure]=useState('')
  const [success,setSuccess]=useState('')
  const rootRef=useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    if(!open)return
    const onPointer=(e:PointerEvent)=>{
      if(rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape'){ setOpen(false) } }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return()=>{ document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  },[open])

  useEffect(()=>{
    setOpen(false); setBusy(false); setFailure(''); setSuccess('')
  },[sessionId])

  if(!canPrompt) return null

  const submit = async () => {
    if(busy || (mode==='interrupt' && !canCancel)) return
    setBusy(true)
    setFailure('')
    setSuccess('')
    try {
      await fire(mode)
      setSuccess(mode==='interrupt' ? '已请求中断，并投递新的喵叫轮次。' : '已投递：会在下一次模型步骤喵一下。')
    } catch (err) {
      setFailure(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const seatStyle = { position:'absolute', right:14, bottom:62 } as CSSProperties

  return <div ref={rootRef} className="mew-key-seat" style={seatStyle}>
    {open && <section className="mew-pop" role="dialog" aria-label="Mew Key">
      <div className="mew-pop-head">
        <div>
          <div className="mew-pop-title">Mew Key</div>
          <div className="mew-pop-sub">给 Agent 一次轻量喵叫。</div>
        </div>
        <div className="mew-status"><i className="mew-status-dot"/>{running?'Agent 运行中':'Agent 空闲'}</div>
      </div>
      <div className="mew-modes" role="group" aria-label="喵键模式">
        <button type="button" className="mew-mode" data-active={mode==='gentle'} aria-pressed={mode==='gentle'} disabled={busy} onClick={()=>{setMode('gentle');setFailure('');setSuccess('')}}>
          <span className="mew-mode-title">✦ 温和插话</span>
          <div className="mew-mode-copy">下一次模型步骤喵一下，然后继续原任务。</div>
        </button>
        <button type="button" className="mew-mode" data-active={mode==='interrupt'} aria-pressed={mode==='interrupt'} disabled={busy||!canCancel} onClick={()=>{setMode('interrupt');setFailure('');setSuccess('')}} title={!canCancel?'无取消权限':undefined}>
          <span className="mew-mode-title">⌁ 立即中断</span>
          <div className="mew-mode-copy">取消当前轮次，再启动只说一声喵的新轮次。</div>
        </button>
      </div>
      <div className="mew-pop-note">
        {mode==='gentle'
          ? <><strong>安全模式</strong>：不取消当前工具；只在下一步模型处理时插入一次性喵叫。</>
          : <><strong>中断模式</strong>：不会自动恢复刚才的工作；如果长工具尚未终止，等待可能延迟。</>}
      </div>
      <button type="button" className="mew-action" onClick={submit} disabled={busy || (mode==='interrupt'&&!canCancel)}>
        {busy ? '正在投递喵叫…' : '按下喵键'}
      </button>
      {!!success && <div className="mew-feedback" data-kind="success" role="status">✧ {success}</div>}
      {!!failure && <div className="mew-feedback" data-kind="error" role="alert">操作未完成：{failure}</div>}
      <div className="mew-meta"><span>当前 Session 专属</span><span>{mode==='gentle'?'Steer':'Cancel → Steer'}</span></div>
    </section>}
    <button type="button" className="mew-paw-fab" data-open={open} aria-label="Mew Key" title="Mew Key" onClick={()=>{setOpen(v=>!v); setFailure(''); setSuccess('')}}>
      <Paw size={20}/>
    </button>
  </div>
}

function makePort(ctx:Context): MewPort {
  return {
    async fire(sessionId,mode) {
      if(mode==='interrupt'){
        const cancelled=await ctx.remote.session.cancel({sessionId})
        if(!cancelled.ok) throw new Error(cancelled.error.message)
        if(!cancelled.value.accepted) throw new Error('中断请求未被接受')
        const waited=await ctx.remote.session.wait({sessionId,timeoutMs:12000,maxMessages:1})
        if(!waited.ok) throw new Error(waited.error.message)
        if(waited.value.reason!=='idle') {
          throw new Error('中断尚未完成：为避免与原轮次竞争，未发送喵叫。请稍后重试。')
        }
      }
      const response=await ctx.remote.session.prompt({
        sessionId,
        requestId: crypto.randomUUID() as SessionRequestId,
        mode: 'steer',
        content: [{type:'text',text:PROMPTS[mode]}],
      })
      if(!response.ok)throw new Error(response.error.message)
      if(!response.value.accepted)throw new Error('喵叫投递未被接受')
    },
  }
}

export function apply(ctx:Context):void {
  ctx.effect(()=>{
    const style=document.createElement('style')
    style.dataset.dshMewKey='true'
    style.textContent=STYLE
    document.head.appendChild(style)
    return()=>style.remove()
  })
  const port=makePort(ctx)
  ctx.slots.inject('conversation.input.overlay',()=>ctx.slots.register({
    name:'conversation.input.overlay',
    id:'mew-key',
    order:95,
    inject:(sessionId:SessionId):MewInjected=>({fire:(mode)=>port.fire(sessionId,mode)}),
  }, MewAction))
}
