// Repackage the pinned GPL-3.0 eSpeak NG engine for file:// pages, retaining
// the Hindi and English dictionaries and embedding data to avoid file CORS.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..'),vendor=path.join(__dirname,'speech_vendor/package');
const archive=fs.readFileSync(path.join(__dirname,'speech_vendor/espeak-ng-0.3.5.tgz'));
assert.equal(crypto.createHash('sha512').update(archive).digest('base64'),'Izbkm7NWccwb//RKgOp1/0k21StKN1DFIn+K7GU1XN7n6pmSi4bsk/0tYUsgQbysC4GVyrVompNmLInU/BFE+A==');
let engine=fs.readFileSync(path.join(vendor,'espeak-ng.js'),'utf8');
const original=engine.match(/loadPackage\((\{files:\[[\s\S]*?remote_package_size:\d+\})\)/)[1];
const metadata=JSON.parse(original.replace(/([{,])(\w+):/g,'$1"$2":'));
const bytes=fs.readFileSync(path.join(vendor,'espeak-ng.data')),buffers=[];let offset=0;
metadata.files=metadata.files.filter(f=>!f.filename.endsWith('_dict')||/\/(hi|en)_dict$/.test(f.filename)).map(f=>{const data=bytes.subarray(f.start,f.end);buffers.push(data);const entry={filename:f.filename,start:offset,end:offset+data.length};offset=entry.end;return entry;});metadata.remote_package_size=offset;
engine=engine.replace(original,JSON.stringify(metadata)).replaceAll('import.meta.url','_hindiAssetUrl').replace('export default Module;','');
const payload=Buffer.concat(buffers).toString('base64');
const wrapper=`/* eSpeak NG / Echogarden Emscripten port 0.3.5, GPL-3.0. See hindi-voice-NOTICE.txt. */
(()=>{'use strict';const _hindiAssetUrl=document.currentScript.src;
${engine}
let instancePromise;
window.HindiOfflineSpeech={async initialize(){
 if(!instancePromise)instancePromise=(async()=>{const binary=atob('${payload}'),data=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)data[i]=binary.charCodeAt(i);const module=await Module({getPreloadedPackage:()=>data.buffer});const worker=new module.eSpeakNGWorker();worker.set_voice('','hi');worker.set_rate(155);worker.set_volume(100);return {module,worker};})();
 return instancePromise;
},async synthesize(text){const {worker}=await this.initialize(),parts=[];let length=0;worker.synthesize(text,samples=>{const copy=Float32Array.from(samples,s=>s/32768);parts.push(copy);length+=copy.length;return false;});const samples=new Float32Array(length);let at=0;for(const part of parts){samples.set(part,at);at+=part.length;}return {samples,sampleRate:22050};}};
})();`;
const notice=`Hindi voice fallback: eSpeak NG, compiled by the Echogarden project.\nPackage: @echogarden/espeak-ng-emscripten 0.3.5\nLicense: GNU GPL version 3 (COPYING-espeak.txt).\nSource and build instructions: https://github.com/echogarden-project/espeak-ng-emscripten\nUnderlying engine source: https://github.com/echogarden-project/espeak-ng/tree/fork\nOriginal package: https://registry.npmjs.org/@echogarden/espeak-ng-emscripten/-/espeak-ng-emscripten-0.3.5.tgz\nLocal modifications: trimmed dictionaries to Hindi and English; embedded data; classic-script factory; PCM wrapper.\nThe reproducible packaging script and original npm archive are included in speech-source/.\n`;
for(const name of ['premchand_library','premchand']){
 const target=path.join(root,name,'assets');fs.mkdirSync(path.join(target,'speech-source'),{recursive:true});
 fs.writeFileSync(path.join(target,'hindi-voice.js'),wrapper);fs.writeFileSync(path.join(target,'hindi-voice-NOTICE.txt'),notice);
 fs.copyFileSync(path.join(vendor,'COPYING'),path.join(target,'COPYING-espeak.txt'));
 fs.copyFileSync(__filename,path.join(target,'speech-source/build_speech_fallback.cjs'));
 fs.copyFileSync(path.join(__dirname,'speech_vendor/espeak-ng-0.3.5.tgz'),path.join(target,'speech-source/espeak-ng-0.3.5.tgz'));
}
console.log(JSON.stringify({engineBytes:Buffer.byteLength(wrapper),dictionaryBytes:offset}));
