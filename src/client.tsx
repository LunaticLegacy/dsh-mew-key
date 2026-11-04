/**
 * Mew Key for DeepSeek Harness Web.
 * One-click paw button living inline in the composer toolbar, just left of the
 * model selector / submit cluster: no panel, no mode picker, no overlay.
 */
import { useEffect, useRef, useState } from 'react'
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
  fire(sessionId: SessionId, mode: Mode): Promise<void>
}
interface MewInjected { fire: (mode: Mode) => Promise<void> }
type MewProps = PropsRuntime<'conversation.input.right'> & InjectFace<MewInjected>

export const PROMPTS: Readonly<Record<Mode, string>> = {
  gentle: [
    '[Mew Key · one-time human steering]',
    'The human just pressed the paw button as a playful ping. Answer in a soft, cute cat voice — warm, a little coquettish, never robotic or clipped.',
    'Say exactly one short cat vocalization in the predominant language of your current work',
    '(中文：喵～ / 喵呜～ English: Meow~ / Mew! 日本語：にゃーん Français : Miaou~ Deutsch: Miau~), with at most one cat emoji.',
    'Then add ONE short sentence in the same cute voice telling the human what you are doing right now (the current step only).',
    'Keep it to two short lines: no lists, headings, or stage directions.',
    'After that, continue the original task normally. Do not change plans, notes, files, or tools because of this event, and do not start unrelated work.',
  ].join('\n'),
  interrupt: [
    '[Mew Key · human interruption]',
    'The human has stopped your previous turn. Do not resume the previous task in this reply.',
    'Answer in a soft, cute cat voice — warm, a little coquettish, never robotic or clipped.',
    'Reply with only ONE short cat vocalization in the predominant language of the task',
    '(中文：喵～ / 喵呜～ English: Meow~ / Mew! 日本語：にゃーん Français : Miaou~ Deutsch: Miau~), with at most one cat emoji,',
    'followed by ONE short sentence in the same cute voice describing what you were doing before the stop.',
    'No tool calls, explanation, markdown, or task changes.',
  ].join('\n'),
}

const STYLE = `
.mew-key-seat{position:relative;display:inline-flex;align-items:center;justify-content:center;line-height:0}
.mew-paw-fab{appearance:none;width:28px;height:28px;border:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;color:#ffd4ea;background:linear-gradient(180deg,rgba(129,138,255,.92),rgba(104,109,236,.96));box-shadow:0 4px 12px rgba(19,22,52,.28),0 0 0 1px rgba(255,255,255,.08) inset;transition:transform .16s ease,filter .16s ease,box-shadow .16s ease}
.mew-paw-fab:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.06);box-shadow:0 6px 16px rgba(19,22,52,.32),0 0 0 1px rgba(255,255,255,.12) inset,0 0 0 3px rgba(129,138,255,.12)}
.mew-paw-fab:active:not(:disabled){transform:translateY(1px)}
.mew-paw-fab:focus-visible{outline:2px solid #f0a3d8;outline-offset:3px}
.mew-paw-fab[data-busy=true]{cursor:progress;background:linear-gradient(180deg,rgba(246,151,203,.96),rgba(225,113,188,.96));animation:mew-paw-pulse .9s ease-in-out infinite}
.mew-paw-fab:disabled{opacity:.9}
.mew-paw-fab svg{width:16px;height:16px;filter:drop-shadow(0 2px 6px rgba(41,26,76,.24))}
.mew-toast{position:absolute;right:0;bottom:calc(100% + 8px);width:max-content;max-width:232px;border-radius:12px;padding:7px 10px;font-size:11px;line-height:1.45;text-align:left;border:1px solid rgba(255,255,255,.08);background:linear-gradient(165deg,rgba(33,35,57,.96),rgba(22,24,40,.98));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 14px 34px rgba(0,0,0,.35);animation:mew-toast-in .18s ease-out}
.mew-toast[data-kind=success]{color:#cbf4df}
.mew-toast[data-kind=error]{color:#ffc3cc}
@keyframes mew-paw-pulse{0%,100%{transform:scale(1)}50%{transform:scale(.9)}}
@keyframes mew-toast-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media(max-width:780px){.mew-toast{max-width:190px}}
@media(prefers-reduced-motion:reduce){.mew-paw-fab,.mew-toast{transition:none!important;animation:none!important}}
`

function Paw({size=16}: {size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M29 55C23 61 18 66 19 74c2 10 12 11 21 7 5-2 11-2 16 0 9 4 20 3 22-7 2-8-4-14-11-20-8-7-13-17-20-17-8 0-12 11-18 18Z" fill="currentColor"/>
    <ellipse cx="20" cy="39" rx="9" ry="13" transform="rotate(-19 20 39)" fill="currentColor"/>
    <ellipse cx="41" cy="24" rx="9" ry="13" transform="rotate(-7 41 24)" fill="currentColor"/>
    <ellipse cx="64" cy="27" rx="9" ry="13" transform="rotate(17 64 27)" fill="currentColor"/>
    <ellipse cx="81" cy="45" rx="8" ry="12" transform="rotate(30 81 45)" fill="currentColor"/>
  </svg>
}

interface Toast { kind:'success'|'error'; text:string }

function MewAction({sessionId,useSession,useAccess,fire}:MewProps) {
  const running=useSession(s=>s.running)
  const canPrompt=useAccess('session/prompt')
  const canCancel=useAccess('session/cancel')
  const [busy,setBusy]=useState(false)
  const [toast,setToast]=useState<Toast|null>(null)
  const timer=useRef<number|undefined>(undefined)

  const say=(next:Toast)=>{
    window.clearTimeout(timer.current)
    setToast(next)
    timer.current=window.setTimeout(()=>setToast(null),2800)
  }

  useEffect(()=>()=>{ window.clearTimeout(timer.current) },[])
  useEffect(()=>{ setBusy(false); setToast(null) },[sessionId])

  if(!canPrompt) return null

  const ping=async(interrupt:boolean)=>{
    if(busy) return
    if(interrupt && !canCancel){ say({kind:'error',text:'没有中断当前轮次的权限。'}); return }
    setBusy(true)
    setToast(null)
    try{
      await fire(interrupt?'interrupt':'gentle')
      say({kind:'success',text:interrupt
        ? '喵～ 已中断，让它说说刚才在忙什么。'
        : (running?'喵～ 已插话：下一步会撒娇一声。':'喵～ 已喵：它会在回复里撒娇。')})
    }catch(err){
      say({kind:'error',text:err instanceof Error?err.message:String(err)})
    }finally{
      setBusy(false)
    }
  }

  const hint=running?'喵一下（Agent 运行中：下一步插话；Shift+点击先中断）':'喵一下（Shift+点击：先中断再喵）'

  return <div className="mew-key-seat">
    {toast && <div className="mew-toast" data-kind={toast.kind} role={toast.kind==='error'?'alert':'status'}>
      {toast.kind==='error'?'操作未完成：':'✧ '}{toast.text}
    </div>}
    <button type="button" className="mew-paw-fab" data-busy={busy}
      aria-label="喵一下" aria-busy={busy} title={hint} disabled={busy}
      onClick={e=>ping(e.shiftKey)}>
      <Paw size={16}/>
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
  ctx.slots.inject('conversation.input.right',()=>ctx.slots.register({
    name:'conversation.input.right',
    id:'mew-key',
    order:95,
    inject:(sessionId:SessionId):MewInjected=>({fire:(mode)=>port.fire(sessionId,mode)}),
  }, MewAction))
}
