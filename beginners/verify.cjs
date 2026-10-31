const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/srama/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const stories=JSON.parse(fs.readFileSync(path.join(__dirname,'stories.json'),'utf8'));
 assert.equal(stories.length,20);
 const source=fs.readFileSync('C:/Users/srama/OneDrive/sankar/languages/hindi/absolute_beginner/short_stories.txt','utf8');
 const original=source.split(/\r?\n/).filter(l=>l.startsWith('•')).map(l=>l.slice(2).replace(/ \(.*$/,'')).join('').replace(/\s/g,'');
 if(/^1\. /m.test(source))assert.equal(stories.flatMap(s=>s.sentences.map(l=>l.hi)).join('').replace(/\s/g,''),original,'Hindi must be preserved');
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const s of stories){await page.goto(pathToFileURL(path.join(__dirname,s.file)).href);assert.equal(await page.locator('.sentence').count(),s.sentences.length);assert.deepEqual(await page.locator('.sentence .hindi').allTextContents(),s.sentences.map(l=>l.hi));assert.equal(await page.locator('th').allTextContents().then(x=>x.join('|')),'Word|Pronunciation|Meaning|Context|Context meaning');assert.equal(await page.locator('[data-toggle]').count(),4);assert.equal(await page.locator('.story-picture img').count(),1);const image=await page.locator('.story-picture img').getAttribute('src');if(!process.argv.includes('--audio-only')){assert(fs.existsSync(path.join(__dirname,image)),image);await page.waitForFunction(()=>document.querySelector('.story-picture img').naturalWidth>0);}assert.equal(await page.locator('text=Hide Phrases tables').count(),0);for(const href of await page.locator('a[href]').evaluateAll(a=>a.map(x=>x.getAttribute('href')))){if(href.startsWith('mailto:')||href.startsWith('#'))continue;assert(fs.existsSync(path.resolve(__dirname,href.split('#')[0])),href);}}
  await page.goto(pathToFileURL(path.join(__dirname,stories[0].file)).href);
  for(const key of ['words','hindi','translation']){await page.locator(`[data-toggle=${key}]`).click();assert(await page.locator('.'+key).first().isHidden());assert(await page.locator('.pronunciation').first().isVisible());await page.locator(`[data-toggle=${key}]`).click();assert(await page.locator('.'+key).first().isVisible());}
  assert.deepEqual(await page.locator('[data-toggle]').evaluateAll(bs=>bs.map(b=>b.dataset.toggle)),['hindi','pronunciation','translation','words']);
  await page.locator('[data-toggle=pronunciation]').click();
  for(const selector of ['.pronunciation','.context-pronunciation','[data-pronunciation]']){assert(await page.locator(selector).evaluateAll(es=>es.every(el=>el.hidden)));}
  assert(await page.locator('.context-text').first().isVisible());
  await page.locator('[data-toggle=pronunciation]').click();assert(await page.locator('.pronunciation').first().isVisible());assert(await page.locator('.context-pronunciation').first().isVisible());
  // Decode every local recording and verify service word timings against its duration.
  const recordings=await page.evaluate(async stories=>{
   const context=new AudioContext(),results=[];
   for(const story of stories)for(let i=1;i<=story.sentences.length;i++){
    const stem=String(story.number).padStart(2,'0')+'-'+String(i).padStart(2,'0');
    const media=new Audio('audio/'+stem+'.mp3');
    const duration=await new Promise((resolve,reject)=>{media.onloadedmetadata=()=>resolve(media.duration);media.onerror=()=>reject(Error(stem));});
    results.push({stem,duration});
   }
   await context.close();return results;
  },stories);
  assert.equal(recordings.length,176);assert(recordings.every(r=>r.duration>0&&Number.isFinite(r.duration)));
  for(const recording of recordings){const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'audio',recording.stem+'.json'),'utf8'));assert.equal(metadata.voice,'hi-IN-SwaraNeural');assert(metadata.words.every(w=>w.start>=0&&w.start+w.duration<=recording.duration+.15));}
  await page.evaluate(()=>{window.highlightLog=[];let previous='';window.watch=setInterval(()=>{const text=document.querySelector('.word.active')?.textContent;if(text&&text!==previous){highlightLog.push(text);previous=text;}},10);});
  await page.locator('.listen').first().click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Sentence complete.',{},{timeout:15000});
  const log=await page.evaluate(()=>{clearInterval(watch);return highlightLog;});assert.deepEqual(log,['एक','शेर','सो','रहा','था']);assert.equal(await page.locator('.active').count(),0);
  await page.locator('.listen').first().click();await page.waitForFunction(()=>document.querySelector('.word.active'));await page.locator('.listen').nth(1).click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Sentence complete.',{},{timeout:30000});assert.equal(await page.locator('.active').count(),0);
  await page.locator('.listen').first().click();await page.locator('.listen').first().click();assert.equal(await page.locator('.active').count(),0);assert.equal(await page.locator('[aria-pressed=true]').count(),0);
  // Regression: hiding the audio column must not squeeze the remaining text.
  for(const width of [1200,390]){
   await page.setViewportSize({width,height:900});
   await page.locator('[data-toggle=hindi]').click();
   const layout=await page.locator('.sentence').first().evaluate(row=>({row:row.clientWidth,text:row.querySelector('.pronunciation').clientWidth}));
   assert(layout.text>=layout.row-2,'Pronunciation must use the full sentence width');
   assert.equal(await page.locator('[data-toggle=hindi]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-toggle=hindi]').click();
   const colors=await page.locator('[data-toggle=hindi]').evaluate(b=>({color:getComputedStyle(b).color,background:getComputedStyle(b).backgroundColor}));
   assert.equal(colors.background,'rgb(39, 91, 75)');assert.equal(colors.color,'rgb(255, 255, 255)');
  }
  await page.setViewportSize({width:1200,height:900});await page.evaluate(()=>scrollTo(0,0));
  assert(await page.locator('.script-reference').isHidden());
  await page.locator('section[aria-label="Story sentences"]').evaluate(el=>el.scrollIntoView());
  await page.waitForFunction(()=>!document.querySelector('.script-reference').hidden);
  assert.equal(await page.locator('#script-reference-toggle').getAttribute('aria-expanded'),'true');
  const characterCount=await page.locator('.script-sound').count();assert(characterCount>60);
  const verifyFullChart=async()=>{await page.waitForTimeout(100);const chart=await page.locator('.script-reference').evaluate(el=>{const body=el.querySelector('#script-reference-body'),r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,right:r.right,groups:[...el.querySelectorAll('details')].every(d=>d.open===(d.querySelector('summary').textContent!=='Compound characters')),overflow:getComputedStyle(body).overflowY,visible:[...el.querySelectorAll('details[open] .script-sound')].every(b=>{const r=b.getBoundingClientRect();return r.height>0&&r.top>=0&&r.bottom<=innerHeight;})};});assert(chart.groups);assert.equal(chart.overflow,'visible');assert(chart.top>=0&&chart.bottom<=await page.evaluate(()=>innerHeight)&&chart.visible);};
  await verifyFullChart();
  for(const src of await page.locator('.script-sound').evaluateAll(buttons=>buttons.map(b=>b.dataset.characterAudio)))assert(fs.existsSync(path.resolve(__dirname,src)),src);
  await page.locator('.listen').first().click();await page.waitForFunction(()=>document.querySelector('.word.active'));
  await page.locator('.script-sound').first().click();assert.equal(await page.locator('.listen[aria-pressed=true]').count(),0);assert.equal(await page.locator('.word.active').count(),0);
  await page.waitForFunction(()=>document.querySelector('#script-audio-status').textContent.startsWith('Finished:'),{},{timeout:10000});
  await page.screenshot({path:path.join(__dirname,'script-reference-desktop.png')});
  await page.locator('#script-reference-toggle').click();assert(await page.locator('#script-reference-body').isHidden());
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('.script-reference').hidden);
  await page.locator('section[aria-label="Story sentences"]').evaluate(el=>el.scrollIntoView());await page.waitForFunction(()=>!document.querySelector('.script-reference').hidden);
  assert(await page.locator('#script-reference-body').isHidden(),'Manual collapse must survive scrolling');
  await page.locator('#script-reference-toggle').click();
  await page.setViewportSize({width:390,height:844});await page.locator('section[aria-label="Story sentences"]').evaluate(el=>el.scrollIntoView());
  await verifyFullChart();await page.screenshot({path:path.join(__dirname,'script-reference-mobile.png')});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1200,height:900});
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'desktop-preview.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'mobile-preview.png'),fullPage:false});
  await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);assert.equal(await page.locator('.card-picture').count(),20);assert.equal(await page.locator('.card').count(),20);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(!process.argv.includes('--audio-only')){await page.evaluate(async()=>{for(const img of document.querySelectorAll('.card-picture')){img.loading='eager';await img.decode();}});await page.screenshot({path:path.join(__dirname,'index-preview.png'),fullPage:true});}
  await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);const nav=await page.locator('nav').first().locator('a').allTextContents();assert.deepEqual(nav,['Devanagari, sounds & numbers','Beginners','About','Feedback','Credit']);
  const existing=await page.locator('.card a').first().getAttribute('href');await page.goto(pathToFileURL(path.resolve(__dirname,'..',decodeURIComponent(existing))).href);assert(await page.locator('h1').isVisible());assert(await page.locator('.hindi').count()>0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({stories:20,sentences:stories.reduce((n,s)=>n+s.sentences.length,0),naturalAudioRecordings:recordings.length,highlightedSampleWords:log.length,characterButtons:characterCount,checks:'source preservation, all links, table columns, toggles, real audio, synchronized highlights, switching, stopping, mobile overflow, navigation, existing story smoke check',errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
