const path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/srama/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.played=[];window.hits=[];const Native=Audio;window.Audio=class extends Native{constructor(src){super(src);this.playbackRate=2;this.addEventListener('playing',()=>played.push({src,start:this.currentTime}));}};let previous='';setInterval(()=>{const w=document.querySelector('.word.active');if(w&&w.textContent!==previous){hits.push(w.textContent);previous=w.textContent;}if(!w)previous='';},5);});
  await page.goto(pathToFileURL(path.join(__dirname,'01-lion-and-mouse.html')).href);
  const panel=page.locator('#beginner-selection-player'),button=page.locator('#beginner-selection-speak');assert(await panel.isHidden());
  async function select(selector,first,last){await page.locator(selector).first().scrollIntoViewIfNeeded();await page.locator(selector).first().evaluate((el,{first,last})=>{const words=el.querySelectorAll('.word'),r=document.createRange();r.setStart(words[first].firstChild,0);r.setEnd(words[last].firstChild,words[last].textContent.length);getSelection().removeAllRanges();getSelection().addRange(r);},{first,last});await page.waitForFunction(()=>!document.querySelector('#beginner-selection-player').hidden);await page.evaluate(()=>{hits.length=0;played.length=0;});}
  await select('#sentence-1',1,2);await button.click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Selection complete.');let result=await page.evaluate(()=>({hits,played}));assert.deepEqual(result.hits,['शेर','सो']);assert(result.played[0].start>.4);assert.equal(await page.locator('.active').count(),0);
  await select('.context-cell',0,2);await button.click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Selection complete.');assert.deepEqual(await page.evaluate(()=>hits),['एक','शेर','सो']);
  await select('.word-cell',0,0);await button.click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Selection complete.');assert.deepEqual(await page.evaluate(()=>hits),['एक']);
  await page.locator('#sentence-1').scrollIntoViewIfNeeded();await page.evaluate(()=>{const a=document.querySelectorAll('#sentence-1 .word'),b=document.querySelectorAll('#sentence-2 .word'),r=document.createRange();r.setStart(a[3].firstChild,0);r.setEnd(b[1].firstChild,b[1].textContent.length);getSelection().removeAllRanges();getSelection().addRange(r);hits.length=0;played.length=0;});await page.waitForFunction(()=>!document.querySelector('#beginner-selection-player').hidden);await button.click();await page.waitForFunction(()=>document.querySelector('#audio-status').textContent==='Selection complete.');assert.deepEqual(await page.evaluate(()=>hits),['रहा','था','एक','छोटा']);assert.equal(await page.evaluate(()=>played.length),2);
  await select('#sentence-1',0,4);await button.click();await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await page.locator('.active').count(),0);
  await select('#sentence-1',0,4);await button.click();await page.locator('.listen').first().click();assert.equal(await button.getAttribute('aria-pressed'),'false');await page.locator('.listen').first().click();
  await page.keyboard.press('Escape');assert(await panel.isHidden());
  await page.locator('.translation').first().evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);});await page.waitForTimeout(100);assert(await panel.isHidden());
  await page.setViewportSize({width:390,height:844});await select('#sentence-1',0,2);const box=await panel.boundingBox();assert(box.x>=0&&box.x+box.width<=390);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({checks:'selected word, phrase, context, multi-line clips, word highlights, stop, switching, Escape, English exclusion, mobile placement',errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
