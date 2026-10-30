const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/srama/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const stories=JSON.parse(fs.readFileSync(path.join(__dirname,'stories.json')));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));let rows=0;
  for(const s of stories){
   await page.goto(pathToFileURL(path.join(__dirname,s.file)).href);
   const result=await page.locator('.words tbody tr').evaluateAll(rows=>rows.map(row=>{
    const word=row.querySelector('.word-listen'),context=row.querySelector('.context-listen');
    const timings=JSON.parse(context.dataset.timings);
    return {buttons:row.querySelectorAll('.table-listen').length,start:+word.dataset.clipStart,end:+word.dataset.clipEnd,wordTiming:JSON.parse(word.dataset.timings)[0],words:row.querySelectorAll('.context-text .word').length,timings:timings.length,source:context.dataset.audio,wordSource:word.dataset.audio};
   }));
   for(const r of result){assert.equal(r.buttons,2);assert(r.end>r.start);assert.equal(r.words,r.timings);assert.equal(r.start,r.wordTiming.start);assert.equal(r.end,r.wordTiming.end);assert.equal(r.source,r.wordSource);assert(fs.existsSync(path.join(__dirname,r.source)));}
   rows+=result.length;
  }
  await page.goto(pathToFileURL(path.join(__dirname,stories[0].file)).href);
  await page.evaluate(()=>{
   const Native=window.Audio;window.mediaLog=[];window.highlightLog=[];
   window.Audio=class extends Native{constructor(src){super(src);const record={src,pausedAt:null,startedAt:null};mediaLog.push(record);this.addEventListener('playing',()=>record.startedAt=this.currentTime);const pause=this.pause.bind(this);this.pause=()=>{record.pausedAt=this.currentTime;return pause();};}};
   let prev='';window.watch=setInterval(()=>{const active=document.querySelector('.word.active');if(active&&active.textContent!==prev){highlightLog.push({text:active.textContent,inTable:!!active.closest('td')});prev=active.textContent;}},5);
  });
  const word=page.locator('.word-listen').nth(3),start=+(await word.getAttribute('data-clip-start')),end=+(await word.getAttribute('data-clip-end'));
  assert(start>1);await word.click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Word complete.');
  const clip=await page.evaluate(()=>({media:mediaLog[0],highlights:highlightLog}));
  assert(clip.media.startedAt>=start-.01);assert(clip.media.pausedAt>=end&&clip.media.pausedAt<end+.2);assert.deepEqual(clip.highlights,[{text:'रहा',inTable:true}]);
  await page.evaluate(()=>highlightLog.length=0);
  await page.locator('.context-listen').first().click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Sentence complete.');
  const highlights=await page.evaluate(()=>highlightLog);assert.deepEqual(highlights.map(x=>x.text),['एक','शेर','सो','रहा','था']);assert(highlights.every(x=>x.inTable));assert.equal(await page.locator('.active').count(),0);
  await page.locator('.context-listen').first().click();await page.waitForFunction(()=>document.querySelector('.context-cell .active'));
  await word.click();assert.equal(await page.locator('.context-listen[aria-pressed=true]').count(),0);await word.click();assert.equal(await page.locator('.active').count(),0);
  await page.locator('.context-listen').first().click();await page.locator('[data-toggle=words]').click();assert.equal(await page.locator('.table-listen[aria-pressed=true]').count(),0);assert.equal(await page.locator('.active').count(),0);await page.locator('[data-toggle=words]').click();
  await page.locator('[data-toggle=hindi]').click();assert(await page.locator('.context-listen').first().isVisible());
  await page.locator('.context-listen').first().click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Sentence complete.');
  await page.locator('.words h2').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'table-audio-preview.png')});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({stories:20,vocabularyRows:rows,buttons:rows*2,checked:'word clip seek/end, table context highlights, switching, stopping, hidden table, hidden original Hindi, mobile overflow',errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
