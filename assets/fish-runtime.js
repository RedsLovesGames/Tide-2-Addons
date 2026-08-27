(()=>{
'use strict';

const DATA_BASE='../assets/';
const SCOPE_URL='./render-data/modpack-scope.json';
const conditionBonus={normal:0,parasite:15,parasite_ridden:15,scarred:25,albino:175,iridescent:325,perfect_specimen:350};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const number=value=>{const n=Number(value);return Number.isFinite(n)?n:null};
const namespace=id=>{const value=String(id||'');const split=value.indexOf(':');return split<0?'minecraft':value.slice(0,split)};
const slug=id=>String(id||'').replace(':','__');
const unslug=value=>String(value||'').replace('__',':');

async function loadGzipJson(path){
  const response=await fetch(path);
  if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
  if(!('DecompressionStream' in window))throw new Error('gzip decompression unsupported');
  return JSON.parse(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text());
}

async function loadJson(path,fallback){
  try{
    const response=await fetch(path);
    if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
    return await response.json();
  }catch(error){
    if(fallback!==undefined){console.warn(`Fish runtime fallback for ${path}`,error);return fallback;}
    throw error;
  }
}

function percentileFloor(condition){return condition==='perfect_specimen'?95:0;}

function envelope(record){
  const low=number(record?.typicalLow),high=number(record?.typicalHigh),recordHigh=number(record?.recordHigh);
  const normalLow=low??1;
  const typicalHigh=high??recordHigh??normalLow;
  const normalHigh=recordHigh??high??normalLow;
  return {
    normalLow,
    typicalHigh,
    normalHigh,
    dwarfLow:low===null?normalLow:low*.55,
    traitLow:low===null?normalLow:low*.55*.90,
    giantHigh:recordHigh===null?(high===null?normalHigh:high*1.30):recordHigh*1.30
  };
}

function bodyBounds(record,body='normal'){
  const e=envelope(record);
  let min=e.normalLow,max=e.normalHigh;
  if(body==='dwarf'){min=e.dwarfLow;max=e.normalLow;}
  else if(body==='giant'){min=e.normalHigh;max=e.giantHigh;}
  if(!(max>min))max=min+Math.max(1,min*.1);
  return {min,max};
}

function speciesScaleMaxCm(record){return Math.max(1,envelope(record).giantHigh);}
function speciesScaleBlocks(record){return Math.max(1,Math.ceil(speciesScaleMaxCm(record)/100));}

function lengthFromPercent(record,body='normal',condition='normal',percentile=50){
  const {min,max}=bodyBounds(record,body);
  const p=clamp(Number(percentile)||0,percentileFloor(condition),100);
  return min+(max-min)*(p/100);
}

function percentFromLength(record,body='normal',length=0){
  const {min,max}=bodyBounds(record,body);
  return clamp(((Number(length)-min)/(max-min))*100,0,100);
}

function scoreBreakdown(record,percentile=100,condition='normal',body='normal',length=Number(record?.recordHigh)||0){
  const p=clamp(Math.max(percentileFloor(condition),Number(percentile)||0),0,100);
  const recordHigh=Number(record?.recordHigh)||0;
  const stars=Math.max(1,Number(record?.stars)||1);
  const percentilePoints=p*5;
  const rarity=(stars-1)*62.5;
  const recordBonus=recordHigh>0?Math.min(300,75*Math.sqrt(recordHigh/100)):0;
  const physical=Number(length)>0?Math.min(150,15*(Number(length)/100)):0;
  let bodyBonus=0;
  if(body==='giant'){
    const ratio=recordHigh>0?Number(length)/recordHigh:1;
    bodyBonus=80+140*clamp((ratio-1)/.3,0,1)+80*clamp((p-97)/3,0,1);
  }else if(body==='dwarf'){
    bodyBonus=80+220*clamp((3-p)/3,0,1);
  }
  const conditionPoints=conditionBonus[condition]||0;
  const subtotal=percentilePoints+rarity+recordBonus+physical+bodyBonus+conditionPoints;
  const multiplier=condition==='perfect_specimen'?1.2:1;
  return {percentile:p,percentilePoints,rarity,recordBonus,physical,bodyBonus,conditionPoints,multiplier,total:subtotal*multiplier};
}

function score(record,percentile=100,condition='normal',body='normal',length=Number(record?.recordHigh)||0){
  return scoreBreakdown(record,percentile,condition,body,length).total;
}

function cardRanges(record){
  const e=envelope(record);
  return {
    baseMin:e.normalLow,
    baseMax:e.normalHigh,
    traitMin:e.traitLow,
    traitMax:e.giantHigh,
    scoreMin:score(record,0,'normal','normal',e.normalLow),
    scoreMax:score(record,100,'perfect_specimen','giant',e.giantHigh)
  };
}

function variantForManifest(manifest,id,condition='normal',body='normal'){
  const variants=manifest?.fish?.[id]?.variants||{};
  const candidates=[];
  if(condition&&condition!=='normal'&&condition!=='perfect_specimen'){
    if(condition==='parasite_ridden')candidates.push('parasite_ridden','parasite-ridden','parasite');
    else candidates.push(condition);
  }
  if(body&&body!=='normal')candidates.push(body);
  candidates.push('normal');
  for(const key of candidates){
    const variant=variants[key];
    if(variant?.file&&variant.status!=='unavailable'){
      const exactCondition=condition!=='normal'&&condition!=='perfect_specimen'&&key===condition;
      const exactBody=condition==='normal'&&body!=='normal'&&key===body;
      return {key,file:`../${String(variant.file).replace(/^\.\//,'').replace(/^\//,'')}`,exact:condition==='normal'&&body==='normal'?key==='normal':exactCondition||exactBody};
    }
  }
  return null;
}

const ready=(async()=>{
  const [first,second,renderManifest,scope]=await Promise.all([
    loadGzipJson(`${DATA_BASE}fish-wiki-data-0.json.gz`),
    loadGzipJson(`${DATA_BASE}fish-wiki-data-1.json.gz`),
    loadJson(`${DATA_BASE}fish-render-manifest.json`,{fish:{},counts:{}}),
    loadJson(SCOPE_URL,{mod_ids:[],include_minecraft:true})
  ]);
  const allRecords=[...(first.records||[]),...(second.records||[])];
  const allowedMods=new Set(scope.mod_ids||[]);
  if(scope.include_minecraft!==false)allowedMods.add('minecraft');
  const records=allRecords.filter(record=>allowedMods.has(namespace(record.id)));
  const recordMap=new Map(records.map(record=>[record.id,record]));
  const allowedIds=new Set(recordMap.keys());
  const api={
    meta:first.meta||{},scope,renderManifest,allRecords,records,recordMap,allowedIds,allowedMods,
    namespace,slug,unslug,percentileFloor,envelope,bodyBounds,speciesScaleMaxCm,speciesScaleBlocks,lengthFromPercent,percentFromLength,scoreBreakdown,score,cardRanges,
    variantFor:(id,condition='normal',body='normal')=>variantForManifest(renderManifest,id,condition,body),
    runtimeFile:id=>variantForManifest(renderManifest,id,'normal','normal')?.file||null
  };
  window.TideFishModpackScope={scope,allowedIds,allowedMods,records};
  document.body.dataset.fishScope='modpack';
  return api;
})();

window.TideFishRuntime={ready,namespace,slug,unslug,percentileFloor,envelope,bodyBounds,speciesScaleMaxCm,speciesScaleBlocks,lengthFromPercent,percentFromLength,scoreBreakdown,score,cardRanges};
})();
