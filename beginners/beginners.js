(()=>{'use strict';
const status=document.querySelector('#audio-status');
const playAll=document.querySelector('#play-all-lines');
let generation=0,current=null,audio=null,frame=0,characterButton=null,playingAll=false,selectionButton=null,selectionQueue=[];
function clear(){document.querySelectorAll('.word.active').forEach(w=>w.classList.remove('active'));}
function stop(){generation++;selectionQueue=[];playingAll=false;if(playAll){playAll.setAttribute('aria-pressed','false');playAll.textContent='▶ Play all lines';}cancelAnimationFrame(frame);if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}clear();if(current){current.setAttribute('aria-pressed','false');current.textContent=current===selectionButton?'▶ Listen':'▶';current=null;}if(characterButton){characterButton.setAttribute('aria-pressed','false');characterButton=null;}}
async function playLine(button,continuing=false,selectionClip=null){
 if(!continuing){const same=current===button;stop();if(same){status.textContent='Playback stopped.';return;}}
 const run=generation;current=button;button.textContent=button===selectionButton?'■ Stop':'■';button.setAttribute('aria-pressed','true');status.textContent='Preparing Hindi audio…';
 try{
  if(!selectionClip&&!button.dataset.audio)throw Error('Sentence recording missing');
  const words=selectionClip?selectionClip.words:[...button.closest('.sentence,.context-cell,.word-cell').querySelectorAll('.word')],timings=selectionClip?selectionClip.timings:JSON.parse(button.dataset.timings);
  const player=new Audio(selectionClip?selectionClip.source:button.dataset.audio);audio=player;
  const clip=!!selectionClip||button.dataset.clipStart!==undefined,clipEnd=selectionClip?selectionClip.end:Number(button.dataset.clipEnd);
  if(clip)player.currentTime=selectionClip?selectionClip.start:Number(button.dataset.clipStart);
  const finishSelection=()=>{cancelAnimationFrame(frame);player.pause();clear();if(selectionQueue.length){playLine(selectionButton,true,selectionQueue.shift());}else{stop();status.textContent='Selection complete.';}};
  const update=()=>{if(run!==generation)return;const now=player.currentTime;if(clip&&now>=clipEnd){if(selectionClip)finishSelection();else{stop();status.textContent='Word complete.';}return;}clear();let active=-1;for(let i=0;i<timings.length;i++){if(now>=timings[i].start&&now<timings[i].end){active=i;break;}}if(active>=0&&words[active]){words[active].classList.add('active');status.textContent=`Word ${active+1} of ${words.length}: ${words[active].textContent}`;}frame=requestAnimationFrame(update);};
  player.onended=()=>{if(run!==generation)return;if(selectionClip){finishSelection();return;}if(playingAll){
   const lines=[...document.querySelectorAll('.sentence .listen')],next=lines[lines.indexOf(button)+1];
   if(next){cancelAnimationFrame(frame);clear();button.setAttribute('aria-pressed','false');button.textContent='▶';next.closest('.sentence').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});playLine(next,true);return;}
   stop();status.textContent='All lines complete.';
  }else{stop();status.textContent='Sentence complete.';}};
  player.onerror=()=>{if(run===generation){stop();status.textContent='Audio could not play. Please try again.';}};
  await player.play();if(run!==generation)return;status.textContent='Playing Hindi sentence…';update();
 }catch(error){if(run===generation){stop();status.textContent='Audio could not play. Please try again.';}console.error(error);}
}
document.querySelectorAll('.listen,.table-listen').forEach(button=>button.addEventListener('click',()=>playLine(button)));
playAll?.addEventListener('click',()=>{
 if(playingAll){stop();status.textContent='Playback stopped.';return;}
 if(document.body.classList.contains('hindi-hidden'))document.querySelector('[data-toggle=hindi]').click();
 stop();const first=document.querySelector('.sentence .listen');if(!first)return;
 playingAll=true;playAll.setAttribute('aria-pressed','true');playAll.textContent='■ Stop all lines';
 first.closest('.sentence').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});playLine(first,true);
});
const labels={words:'Words tables',hindi:'Original Hindi',translation:'English translation',pronunciation:'pronunciation'};
document.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.toggle,hide=button.getAttribute('aria-pressed')!=='true';if(key==='hindi'&&hide){stop();status.textContent='Playback stopped. Hindi is hidden.';}
 if(key==='words'&&hide&&current?.closest('.words')){stop();status.textContent='Playback stopped. Words table is hidden.';}
 document.querySelectorAll(key==='pronunciation'?'.pronunciation,.context-pronunciation,[data-pronunciation]':'.'+key).forEach(el=>el.hidden=hide);if(key==='hindi')document.querySelectorAll('.listen').forEach(el=>el.hidden=hide);
 if(key==='hindi')document.body.classList.toggle('hindi-hidden',hide);
 button.setAttribute('aria-pressed',String(hide));button.textContent=(hide?'Show ':'Hide ')+labels[key];
 button.title=labels[key]+(hide?' are hidden. Click to show.':' are visible. Click to hide.');
}));
const reference=document.querySelector('.script-reference'),reading=document.querySelector('section[aria-label="Story sentences"]');
if(reference&&reading){
 document.body.classList.add('has-script-reference');
 const toggle=document.querySelector('#script-reference-toggle'),body=document.querySelector('#script-reference-body'),chartStatus=document.querySelector('#script-audio-status');
 let expanded=true,scrollFrame=0;
 function fitReference(){if(reference.hidden)return;const scale=Math.min(1,(innerHeight-24)/reference.offsetHeight);reference.style.setProperty('--reference-scale',String(scale));}
 function showReference(){scrollFrame=0;const rect=reading.getBoundingClientRect(),end=(document.querySelector('.words')||reading).getBoundingClientRect(),visible=rect.top<=Math.min(160,innerHeight*.25)&&end.bottom>80;reference.hidden=!visible;fitReference();if(!visible&&characterButton){stop();chartStatus.textContent='Choose a character.';}}
 function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(showReference);}
 toggle.addEventListener('click',()=>{expanded=!expanded;body.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));toggle.querySelector('.script-toggle-label').textContent=expanded?'Hide chart −':'Show chart +';if(!expanded&&characterButton){stop();chartStatus.textContent='Playback stopped.';}});
 reference.querySelectorAll('.script-sound').forEach(button=>button.addEventListener('click',async()=>{
  const same=characterButton===button;stop();if(same){chartStatus.textContent='Playback stopped.';return;}
  const run=generation;characterButton=button;button.setAttribute('aria-pressed','true');chartStatus.textContent='Playing '+button.dataset.label;
  if(status)status.textContent='Sentence playback stopped. Playing a character.';
  const player=new Audio(button.dataset.characterAudio);audio=player;
  player.onended=()=>{if(run===generation){stop();chartStatus.textContent='Finished: '+button.dataset.label;}};
  player.onerror=()=>{if(run===generation){stop();chartStatus.textContent='Character audio could not play. Please try again.';}};
  try{await player.play();}catch(error){if(run===generation){stop();chartStatus.textContent='Character audio could not play. Please try again.';}}
 }));
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);new ResizeObserver(schedule).observe(reading);new ResizeObserver(fitReference).observe(reference);showReference();
}
if(reading){
 const panel=document.createElement('div');panel.id='beginner-selection-player';panel.hidden=true;
 selectionButton=document.createElement('button');selectionButton.type='button';selectionButton.id='beginner-selection-speak';selectionButton.textContent='▶ Listen';selectionButton.setAttribute('aria-label','Play selected Hindi text');selectionButton.setAttribute('aria-pressed','false');panel.append(selectionButton);document.body.append(panel);
 let selectedClips=[],selectionFrame=0;
 function updateSelection(){
  selectionFrame=0;if(current===selectionButton)return;
  const selection=getSelection();if(!selection?.rangeCount||selection.isCollapsed){if(document.activeElement!==selectionButton){panel.hidden=true;selectedClips=[];}return;}
  const range=selection.getRangeAt(0);if(!/[\u0900-\u097f]/.test(selection.toString())){panel.hidden=true;selectedClips=[];return;}
  const clips=[];
  document.querySelectorAll('.sentence,.context-cell,.word-cell').forEach(block=>{
   const button=block.querySelector('.listen,.table-listen');if(!button||!block.getBoundingClientRect().height)return;
   const allWords=[...block.querySelectorAll('.word')],timings=JSON.parse(button.dataset.timings),indices=[];
   allWords.forEach((word,i)=>{if(range.intersectsNode(word)&&word.getBoundingClientRect().height)indices.push(i);});
   if(!indices.length)return;const first=indices[0],last=indices[indices.length-1];
   clips.push({source:button.dataset.audio,words:allWords.slice(first,last+1),timings:timings.slice(first,last+1),start:timings[first].start,end:timings[last].end});
  });
  if(!clips.length){panel.hidden=true;selectedClips=[];return;}selectedClips=clips;panel.hidden=false;
  const rect=range.getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight;
  panel.style.left=Math.max(8,Math.min(rect.right-width,innerWidth-width-8))+'px';
  panel.style.top=Math.max(8,Math.min(rect.bottom+8+height<innerHeight?rect.bottom+8:rect.top-height-8,innerHeight-height-8))+'px';
 }
 const scheduleSelection=()=>{if(!selectionFrame)selectionFrame=requestAnimationFrame(updateSelection);};
 selectionButton.addEventListener('mousedown',event=>event.preventDefault());
 selectionButton.addEventListener('click',()=>{if(current===selectionButton){stop();status.textContent='Playback stopped.';return;}if(!selectedClips.length)return;const clips=selectedClips.slice();stop();selectionQueue=clips.slice(1);playLine(selectionButton,true,clips[0]);});
 document.addEventListener('selectionchange',scheduleSelection);document.addEventListener('pointerup',scheduleSelection);document.addEventListener('keyup',scheduleSelection);
 window.addEventListener('scroll',scheduleSelection,{passive:true});window.addEventListener('resize',scheduleSelection);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(current===selectionButton)stop();panel.hidden=true;selectedClips=[];getSelection()?.removeAllRanges();}});
}
window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
