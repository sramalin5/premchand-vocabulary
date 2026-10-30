const fs = require('fs');
const path = require('path');
const source = process.argv[2] || 'C:/Users/srama/OneDrive/sankar/languages/hindi/absolute_beginner/short_stories.txt';
const text = fs.readFileSync(source, 'utf8');
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const split = s => (s.match(/[^।.!?]+[।.!?]+["”]?|[^।.!?]+$/g)||[]).map(x=>x.trim()).filter(Boolean);
const stories=[];
for(const chunk of text.split(/\r?\n(?=\d+\. )/).slice(1)){
 const lines=chunk.split(/\r?\n/).filter(x=>x.trim());
 const title=lines[0].match(/^(\d+)\. (.*?)(?: \(https?:[^ ]+\))? \(([^)]+)\)$/);
 if(!title)throw Error(lines[0]);
 const story={number:+title[1],title:title[2],english:title[3],sentences:[]};
 for(let i=1;i<lines.length;i++){
  if(!lines[i].startsWith('•'))continue;
  let hi,pron,en;
  if(lines[i].includes('सीख:')){
   const m=lines[i].match(/^• (.*?) \((.*?)\) \/ (.*)$/);if(!m)throw Error(lines[i]);
   hi=m[1];pron='Seekh: '+m[2];en='Moral: '+m[3];
  }else {hi=lines[i].slice(2);pron=lines[++i].replace(/^\(|\)$/g,'');en=lines[++i];}
  // Punctuation in the supplied pronunciation occasionally places the closing quote before the full stop.
  pron=pron.replace(/"\)\./g,'".');
  let hs=split(hi),ps=split(pron),es=split(en);
  if(hs.length!==ps.length||hs.length!==es.length)throw Error(JSON.stringify({story:story.number,hs,ps,es}));
  hs.forEach((h,j)=>story.sentences.push({hi:h,pron:ps[j],en:es[j]}));
 }
 stories.push(story);
}
if(stories.length!==20)throw Error('Expected 20 stories');
// Reviewed title translations follow the supplied Hindi names, including their number.
const titleTranslations=JSON.parse(fs.readFileSync(path.join(__dirname,'title-translations.json'),'utf8'));
for(const story of stories){
 if(!titleTranslations[story.title])throw Error('Missing reviewed title translation: '+story.title);
 story.english=titleTranslations[story.title];
}
fs.writeFileSync(path.join(__dirname,'stories.json'),JSON.stringify(stories,null,2)+'\n');
console.log(`Parsed ${stories.length} stories`);
const vocab=new Map(fs.readFileSync(path.join(__dirname,'vocabulary.txt'),'utf8').trim().split(/\r?\n/).map(l=>{const [w,p,m]=l.split('|');return [w,{p,m}]}));
const tokens=s=>s.match(/[\u0900-\u0963\u0970-\u097f]+(?:-[\u0900-\u0963\u0970-\u097f]+)*/g)||[];
const slugs=['lion-and-mouse','greedy-dog','fox-and-crow','strength-in-unity','monkey-and-cap-seller','monkey-and-crocodile','shepherd-and-wolf','ant-and-grasshopper','honest-woodcutter','two-foolish-goats','two-wise-goats','golden-egg-hen','elephant-and-tailor','thirsty-pigeon','sour-grapes','birds-and-net','lion-and-hare','too-big-too-small','lazy-donkey','two-mice'];
const titlePronunciations=['Sher aur chooha','Laalchi kutta','Chaalaak lomdi aur kauwa','Ekta mein shakti','Bandar aur topiwaala','Bandar aur magarmachh','Charvaaha aur bhediya','Cheenti aur tidda','Saccha sona','Do moorkh bakriyaan','Do samajhdaar bakriyaan','Sone ka anda dene waali murgi','Haathi aur darzi','Pyaasa kabootar','Angoor khatte hain','Chidiya aur jaal','Sher aur khargosh','Bada ya chhota','Aalsi gadha','Do choohe'];
stories.forEach((s,i)=>{s.file=`${String(i+1).padStart(2,'0')}-${slugs[i]}.html`;s.titlePronunciation=titlePronunciations[i];});
// Correct typographical errors in the supplied romanization; retain Hindi verbatim.
for(const s of stories)for(const line of s.sentences){line.pron=line.pron.replace(/lakdarhaara/ig,'lakadhaara').replace(/lakdarhaare/ig,'lakadhaare').replace(/baahra/ig,'baahar').replace(/thak gaye/ig,'thak gayi').replace(/shookha/ig,'sookha').replace(/ek kuan/ig,'ek kuen').replace(/vah kuan/ig,'vah kuen');line.en=line.en.replace('The crocodile sat the monkey on his back.','The crocodile seated the monkey on his back.');}
const head=title=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Beginners</title><link rel="stylesheet" href="beginners.css"><script src="beginners.js" defer></script></head><body><main><nav aria-label="Site navigation"><a href="../index.html">Main stories</a><a href="../hindi-basics.html">Devanagari, sounds &amp; numbers</a><a href="index.html">Beginners</a><a href="../about.html">About</a><a href="mailto:sramalin5@gmail.com">Feedback</a><a href="../index.html#credits">Credit</a></nav>`;
const end='</main></body></html>';
const illustrations = JSON.parse(fs.readFileSync(path.join(__dirname,'illustrations.json'),'utf8'));
const scriptReference=require('./script-reference.cjs')(esc);
let sentenceCount=0,wordCount=0;
for(const [i,s] of stories.entries()){
 let rows='',seen=new Set();
 const sentences=s.sentences.map((l,j)=>{
  const words=tokens(l.hi);
  let k=0;const hindi=l.hi.replace(/[\u0900-\u0963\u0970-\u097f]+(?:-[\u0900-\u0963\u0970-\u097f]+)*/g,w=>`<span class="word" data-word="${k++}">${esc(w)}</span>`);
  const stem=String(s.number).padStart(2,'0')+'-'+String(j+1).padStart(2,'0');
  const recording=JSON.parse(fs.readFileSync(path.join(__dirname,'audio',stem+'.json'),'utf8'));
  const expected=tokens(l.hi),spoken=recording.words.flatMap(w=>tokens(w.text));
  if(JSON.stringify(expected)!==JSON.stringify(spoken))throw Error('Audio word mismatch: '+stem);
  if(recording.words.length!==expected.length)throw Error('Audio boundary count mismatch: '+stem);
  const timings=recording.words.map(w=>({start:w.start,end:w.start+w.duration}));
  const media=' data-audio="audio/'+stem+'.mp3" data-timings="'+esc(JSON.stringify(timings))+'"';
  for(const w of words){
   if(!vocab.has(w))throw Error('Missing vocabulary: '+w);if(seen.has(w))continue;seen.add(w);
   const v=vocab.get(w),position=words.indexOf(w),timing=timings[position];
   const wordMedia=' data-audio="audio/'+stem+'.mp3" data-clip-start="'+timing.start+'" data-clip-end="'+timing.end+'" data-timings="'+esc(JSON.stringify([timing]))+'"';
   rows+=`<tr><td class="word-cell" lang="hi"><div class="table-audio-line"><button type="button" class="table-listen word-listen"${wordMedia} aria-label="Listen to ${esc(w)}" aria-pressed="false">▶</button><a href="#sentence-${j+1}"><span class="word">${esc(w)}</span></a></div></td><td data-pronunciation>${esc(v.p)}</td><td>${esc(v.m)}</td><td class="context-cell" lang="hi"><div class="table-audio-line"><button type="button" class="table-listen context-listen"${media} aria-label="Listen to context for ${esc(w)}" aria-pressed="false">▶</button><span class="context-copy"><span class="context-text">${hindi}</span> <span class="context-pronunciation" lang="en">${esc(l.pron)}</span></span></div></td><td>${esc(l.en)}</td></tr>`;
  }
  return `<article class="sentence" id="sentence-${j+1}"><button type="button" class="listen"${media} aria-label="Listen to sentence ${j+1}" aria-pressed="false">▶</button><div><p class="hindi" lang="hi">${hindi}</p><p class="pronunciation">${esc(l.pron)}</p><p class="translation">${esc(l.en)}</p></div></article>`;
 }).join('\n');
 const pagination=`<nav class="story-nav" aria-label="Story navigation">${i?`<a href="${stories[i-1].file}">← Previous story</a>`:''}<a href="index.html">All 20 stories</a>${i<19?`<a href="${stories[i+1].file}">Next story →</a>`:''}</nav>`;
 fs.writeFileSync(path.join(__dirname,s.file),head(s.english)+`<header><p class="eyebrow">Beginner Hindi · Story ${i+1} of 20</p><h1 lang="hi">${esc(s.title)}</h1><p class="pronunciation title-pronunciation">${esc(s.titlePronunciation)}</p><p class="subtitle">${esc(s.english)}</p><p class="intro">Listen one word at a time. Read the pronunciation below each Hindi sentence, then check its English meaning.</p></header><figure class="story-picture"><img src="${illustrations[i].file}" alt="${esc(illustrations[i].alt)}" width="1536" height="1024"></figure>${pagination}<div class="toolbar" aria-label="Reading controls"><button data-toggle="hindi" aria-pressed="false">Hide Original Hindi</button><button data-toggle="pronunciation" aria-pressed="false">Hide pronunciation</button><button data-toggle="translation" aria-pressed="false">Hide English translation</button><button data-toggle="words" aria-pressed="false">Hide Words tables</button></div><p id="audio-status" role="status" aria-live="polite">Select ▶ beside a sentence to listen.</p><div class="play-all-controls"><button type="button" id="play-all-lines" aria-pressed="false">▶ Play all lines</button></div><section aria-label="Story sentences">${sentences}</section><section class="words"><h2>Words</h2><p>Words appear in story order. Meanings describe their use here; changed forms are included to help you read.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Story vocabulary"><table><thead><tr>${['Word','Pronunciation','Meaning','Context','Context meaning'].map(h=>`<th scope="col"${h==='Pronunciation'?' data-pronunciation':''}>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>${pagination}<footer>Pronunciation is a reading aid. Audio: natural Hindi narration (Swara neural voice). Highlights follow the recording’s word timings.</footer>${scriptReference}`+end);
 sentenceCount+=s.sentences.length;wordCount+=seen.size;
}
fs.writeFileSync(path.join(__dirname,'index.html'),head('Short Hindi stories')+`<header><p class="eyebrow">A gentle start to Hindi reading</p><h1>Beginners<span lang="hi">छोटी हिंदी कहानियाँ</span></h1><p class="pronunciation title-pronunciation">Chhoti Hindi kahaaniyaan</p><p class="intro">20 short stories with sentence-by-sentence pronunciation, English translation, word audio, and a beginner vocabulary table.</p></header><div class="cards">${stories.map(s=>`<article class="card"><a href="${s.file}"><img class="card-picture" src="${illustrations[s.number-1].file}" alt="${esc(illustrations[s.number-1].alt)}" width="1536" height="1024" loading="lazy"><span class="eyebrow">Story ${s.number} · ${s.sentences.length} sentences</span><h2 lang="hi">${esc(s.title)}</h2><p class="pronunciation title-pronunciation">${esc(s.titlePronunciation)}</p><p>${esc(s.english)}</p><span>Read story →</span></a></article>`).join('')}</div><footer>Adapted for learning from your supplied short-story collection.</footer>`+end);
fs.writeFileSync(path.join(__dirname,'stories.json'),JSON.stringify(stories,null,2)+'\n');
console.log(`Built 20 pages, ${sentenceCount} sentences and ${wordCount} vocabulary rows.`);
