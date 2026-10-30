const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/srama/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const stories=JSON.parse(fs.readFileSync(path.join(__dirname,'stories.json')));
 for(const s of stories)assert(fs.readFileSync(path.join(__dirname,s.file),'utf8').includes('id="play-all-lines"'));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const Native=Audio;window.played=[];window.highlighted=new Set();window.Audio=class extends Native{constructor(src){super(src);this.playbackRate=4;const play=this.play.bind(this);this.play=()=>{played.push(src);return play();};}};setInterval(()=>{const active=document.querySelector('.sentence .word.active');if(active)highlighted.add(active.closest('.sentence').id);},5);});
  await page.goto(pathToFileURL(path.join(__dirname,stories[0].file)).href);
  await page.locator('#play-all-lines').click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='All lines complete.',{},{timeout:45000});
  const result=await page.evaluate(()=>({played,highlighted:[...highlighted]}));
  assert.deepEqual(result.played,stories[0].sentences.map((_,i)=>`audio/01-${String(i+1).padStart(2,'0')}.mp3`));assert.equal(result.highlighted.length,stories[0].sentences.length);assert.equal(await page.locator('.active').count(),0);assert.equal(await page.locator('#play-all-lines').getAttribute('aria-pressed'),'false');
  await page.locator('#play-all-lines').click();await page.locator('#play-all-lines').click();const stopped=await page.evaluate(()=>played.length);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>played.length),stopped);assert.equal(await page.locator('.active').count(),0);
  await page.locator('[data-toggle=hindi]').click();await page.locator('#play-all-lines').click();assert(await page.locator('.hindi').first().isVisible());
  await page.locator('.context-listen').first().click();assert.equal(await page.locator('#play-all-lines').getAttribute('aria-pressed'),'false');await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Sentence complete.');
  await page.locator('#play-all-lines').click();await page.locator('.listen[aria-pressed=true]').click();assert.equal(await page.locator('#play-all-lines').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('.active').count(),0);
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));assert(await page.locator('#play-all-lines').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pages:20,queuedSentences:result.played.length,highlightedSentences:result.highlighted.length,checks:'ordered full playback, word highlights per sentence, stop queue, individual/context interruption, automatic Hindi reveal, mobile layout',errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
