import fs from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve('work/portable');
let html=await fs.readFile(path.join(dir,'index.html'),'utf8');
const script=html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if(!script) throw new Error('Missing compiled script');
const banks={ms700:JSON.parse(await fs.readFile('public/data/ms700.es.json','utf8')),ab900:JSON.parse(await fs.readFile('public/data/questions.json','utf8'))};
const figures={};
for(const name of await fs.readdir('public/ms700')) {
 if(name.endsWith('.webp')) figures['/ms700/'+name]='data:image/webp;base64,'+(await fs.readFile('public/ms700/'+name)).toString('base64');
}
const safe=text=>text.replace(/<\/script/gi,'<\\/script');
const data=`<script>window.__CERTLAB_BANKS__=${safe(JSON.stringify(banks))};window.__CERTLAB_FIGURES__=${JSON.stringify(figures)};</script>`;
const js=await fs.readFile(path.join(dir,script[1]),'utf8');
html=html.replace(script[0],()=>data+'<script type="module">'+safe(js)+'</script>');
const style=html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(style) {
 const css=await fs.readFile(path.join(dir,style[1]),'utf8');
 html=html.replace(style[0],()=>'<style>'+css+'</style>');
}
html=html.replace(/<link rel="icon"[^>]*>/,'');
await fs.mkdir('outputs',{recursive:true});
await fs.writeFile('outputs/Simulador-MS-700-Espanol.html',html);
console.log('Portable HTML created: '+(Buffer.byteLength(html)/1024/1024).toFixed(1)+' MB');
