const fs=require('fs'),path=require('path');
module.exports=function(esc){
 const basics=fs.readFileSync(path.join(__dirname,'../hindi-basics.html'),'utf8');
 const sections=[['vowels','Vowels'],['consonants','Consonants'],['additional','Additional sounds'],['compounds','Compound characters']];
 const groups=sections.map(([id,label],i)=>{
  const section=basics.match(new RegExp('<section id="'+id+'">([\\s\\S]*?)</section>'));
  if(!section)throw Error('Missing Devanagari section: '+id);
  const buttons=[...section[1].matchAll(/<a\b[^>]*data-audio[^>]*>[\s\S]*?<\/a>/g)].filter(([a])=>!a.includes('◌')).map(([a])=>{
   const src=a.match(/href="([^"]+)"/)[1],name=a.match(/data-label="([^"]+)"/)[1];
   const [letter,roman]=name.split(' · ');
   if(!fs.existsSync(path.join(__dirname,'..',src)))throw Error('Missing character audio: '+src);
   return `<button type="button" class="script-sound" data-character-audio="../${esc(src)}" data-label="${esc(name)}" aria-label="Listen to ${esc(name)}" aria-pressed="false"><span lang="hi">${letter}</span><span class="script-roman">${roman}</span><span class="script-speaker" aria-hidden="true">▶</span></button>`;
  }).join('');
  return `<details${id==='compounds'?'':' open'}><summary>${label}</summary><div class="script-grid" data-script-group="${id}">${buttons}</div></details>`;
 }).join('');
 return `<aside class="script-reference" aria-label="Devanagari sound reference" hidden><button type="button" id="script-reference-toggle" aria-expanded="true" aria-controls="script-reference-body">Devanagari <span class="script-toggle-label">Hide chart −</span></button><div id="script-reference-body"><p class="script-help">Tap a letter to hear it.</p>${groups}<p id="script-audio-status" role="status" aria-live="polite">Choose a character.</p><a class="script-full-link" href="../hindi-basics.html">Full script &amp; numbers →</a></div></aside>`;
};
