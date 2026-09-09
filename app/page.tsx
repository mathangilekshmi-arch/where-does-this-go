'use client';
import { useEffect, useRef, useState } from 'react';
import { preparePhoto } from '@/lib/item-photo';
import { flushSync } from 'react-dom';
import { ArrowUpRight, ArrowRight, Plus, MoveUpRight, Sprout, Sofa, Lamp, Shirt, BookOpen, Box, Check, Undo2, Pencil, Heart, Gift, Recycle, Tag, CalendarDays, Camera, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type Route = 'Decide later' | 'Sell' | 'Donate' | 'Give away' | 'Recycle';
type Item = { id: string; name: string; category: string; condition: string; route: Route; gone: boolean; note: string; photo?: string };
const routes: Route[] = ['Decide later','Sell','Donate','Give away','Recycle'];
const categories = ['Furniture','Electronics','Clothing','Books','Other'];
const conditions = ['Like new','Good','Needs repair','No longer usable'];
const seeds: Item[] = [
 {id:'demo-sofa',name:'The comfy sofa',category:'Furniture',condition:'Good',route:'Sell',gone:false,note:''},
 {id:'demo-lamp',name:'Bedside lamp',category:'Electronics',condition:'Good',route:'Donate',gone:false,note:''},
 {id:'demo-books',name:'Books I’ve finished',category:'Books',condition:'Good',route:'Give away',gone:false,note:''},
];
const routeClass = (s:string) => s.toLowerCase().replaceAll(' ','-');
const iconFor = (item:Item) => item.name.toLowerCase().includes('lamp') ? Lamp : item.category==='Furniture' ? Sofa : item.category==='Clothing' ? Shirt : item.category==='Books' ? BookOpen : Box;
const routeIcons = {Sell:Tag,Donate:Heart,'Give away':Gift,Recycle:Recycle,'Decide later':Box};
const guidance: Record<Route,string> = {
 'Decide later':'Check its condition first. If someone could still use it, try selling, donating, or giving it away.',
 Sell:'Take clear photos, note any wear, and choose a realistic asking price. Agree on pickup details before handing it over.',
 Donate:'Check the organization’s current acceptance rules before making the trip. Items should be clean, usable, and complete.',
 'Give away':'Offer it to a friend or a local community group. Include its condition, dimensions, and a realistic collection window.',
 Recycle:'Check your local council’s rules for this specific item. Electronics, batteries, and bulky items may need a dedicated drop-off.',
};
function Choice({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}) {
 return <label className="field">{label}<Select value={value} onValueChange={v=>v&&onChange(v)}><SelectTrigger className="choice"><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></label>;
}
export default function Home(){
 const [items,setItems]=useState<Item[]>(seeds),[demo,setDemo]=useState(true),[ready,setReady]=useState(false),[saved,setSaved]=useState(true);
 const [open,setOpen]=useState(false),[editId,setEditId]=useState<string|null>(null),[name,setName]=useState(''),[category,setCategory]=useState('Furniture'),[condition,setCondition]=useState('Good'),[route,setRoute]=useState<Route>('Decide later'),[note,setNote]=useState('');
 const [tab,setTab]=useState('all'),[deadline,setDeadline]=useState(''),[message,setMessage]=useState(''),[help,setHelp]=useState(false);
 const [photo,setPhoto]=useState(''),[photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState('');
 const photoRequest=useRef(0);
 const state=useRef({items,demo}); state.current={items,demo};
 useEffect(()=>{try{const raw=localStorage.getItem('wdtg-plan-v1');if(raw){const x=JSON.parse(raw);if(Array.isArray(x.items)&&x.items.every((i:Item)=>typeof i.id==='string'&&typeof i.name==='string'&&categories.includes(i.category)&&conditions.includes(i.condition)&&routes.includes(i.route)&&typeof i.gone==='boolean'&&typeof i.note==='string')){setItems(x.items.map((i:Item)=>({...i,photo:typeof i.photo==='string'&&i.photo.startsWith('data:image/jpeg;base64,')?i.photo:undefined})));setDemo(false);setDeadline(typeof x.deadline==='string'?x.deadline:'');}}}catch{setSaved(false);}setReady(true);},[]);
 useEffect(()=>{if(!ready||demo)return;try{localStorage.setItem('wdtg-plan-v1',JSON.stringify({items,deadline}));setSaved(true);}catch{setSaved(false);}},[items,deadline,ready,demo]);
 useEffect(()=>{if(!message)return;const id=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(id);},[message]);
 useEffect(()=>{
  type Tool = {name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
  const context=(document as Document & {modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tools:Tool[]=[
   {name:'read_decluttering_plan',description:'Read the items in the visible decluttering plan, including whether they are demo items.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({items:state.current.items.map(({photo,...item})=>({...item,hasPhoto:!!photo})),demo:state.current.demo})},
   {name:'set_item_gone',description:'Mark an existing item as gone or restore it to pending in the visible plan. This updates the device-local plan when it is not a demo.',inputSchema:{type:'object',properties:{id:{type:'string'},gone:{type:'boolean'}},required:['id','gone'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const x=input as {id?:unknown;gone?:unknown};if(!x||typeof x.id!=='string'||typeof x.gone!=='boolean'||!state.current.items.some(i=>i.id===x.id))throw new Error('A valid existing item id and boolean gone are required.');flushSync(()=>setItems(prev=>prev.map(i=>i.id===x.id?{...i,gone:x.gone as boolean}:i)));return {id:x.id,gone:x.gone};}}
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  return()=>lifecycle.abort();
 },[]);
 const gone=items.filter(i=>i.gone).length,percent=items.length?Math.round(gone/items.length*100):0;
 function startItem(item?:Item){photoRequest.current++;setPhoto(item?.photo??'');setPhotoBusy(false);setPhotoError('');setEditId(item?.id??null);setName(item?.name??'');setCategory(item?.category??'Furniture');setCondition(item?.condition??'Good');setRoute(item?.route??'Decide later');setNote(item?.note??'');setOpen(true);}
 async function choosePhoto(file?:File){
  if(!file)return;
  const request=++photoRequest.current;setPhotoBusy(true);setPhotoError('');
  try{const result=await preparePhoto(file);if(request===photoRequest.current)setPhoto(result);}
  catch(error){if(request===photoRequest.current)setPhotoError(error instanceof Error?error.message:'Could not add this photo. Try another.');}
  finally{if(request===photoRequest.current)setPhotoBusy(false);}
 }
 function saveItem(e:React.FormEvent){
  e.preventDefault();if(!name.trim()||photoBusy)return;
  const item:Item={id:editId??crypto.randomUUID(),name:name.trim(),category,condition,route,note:note.trim(),photo:photo||undefined,gone:items.find(i=>i.id===editId)?.gone??false};
  const next=editId?items.map(i=>i.id===editId?item:i):[...(demo?[]:items),item];
  try{localStorage.setItem('wdtg-plan-v1',JSON.stringify({items:next,deadline}));}
  catch{setPhotoError('This device could not save the item. Storage may be full or disabled. Try removing its photo or enabling browser storage. Your existing plan is unchanged.');return;}
  setItems(next);setDemo(false);setSaved(true);setOpen(false);setTab('all');setMessage(editId?'Item updated.':'One item closer to a clearer space.');
 }
 function toggle(id:string){setItems(prev=>prev.map(i=>i.id===id?{...i,gone:!i.gone}:i));setMessage('Progress updated. You can undo this anytime.');}
 return <div className="site-shell">
 <header className="topbar"><a className="brand" href="/" aria-label="Where Does This Go home"><span className="brand-mark"><MoveUpRight size={25}/></span><span>where does<br/>this go<span className="orange">?</span></span></a><nav aria-label="Main"><a className="nav-current" href="#my-space">My space</a><button onClick={()=>setHelp(true)}>How it works <ArrowUpRight size={14}/></button></nav><span className="beta">A LITTLE LESS STUFF CLUB</span></header>
 <main id="my-space">
 <section className="page-heading"><div><p className="eyebrow"><span/> MAKE ROOM FOR WHAT’S NEXT</p><h1>Goodbye stuff.<br className="mobile-break"/> Hello, space<span className="orange">.</span></h1><p>A new home for your things. A fresh start for you.</p></div><button className="primary" onClick={()=>startItem()}><Plus size={19}/> Add an item</button></section>
 <div className="overview"><section className="room-panel"><div className="room-label"><span className="tiny-tag">YOUR SPACE, REIMAGINED</span><span className="room-status"><span/> {gone===items.length&&items.length?'All clear!':'A little lighter, one item at a time'}</span></div><img className="room-art" style={{opacity:1-percent/100,transition:"opacity .7s ease"}} src="/room.png" width="1536" height="1024" alt="A miniature room with a green sofa, orange lamp, blue cabinet, plant and moving boxes"/>{percent===100&&<div className="room-clear"><Sprout size={40}/><strong>Room to breathe.</strong><span>Every item has started its next chapter.</span></div>}<div className="room-caption"><span><Sprout size={17}/> Every item deserves a next chapter.</span><span className="art-label">Room illustration</span></div></section>
 <aside className="progress-panel"><span className="eyebrow">YOUR FRESH START</span><div className="progress-number">{percent}<span>%</span><ArrowUpRight size={35}/></div><h2>{percent===100?'Look at all that space.':'A little less, a little lighter.'}</h2><p>{gone} of {items.length} items have left your space.</p><Progress value={percent} aria-label="Items cleared" className="clear-progress"/><div className="progress-stats"><div><strong>{items.length-gone}</strong><span>to find a home</span></div><div><strong>{gone}</strong><span>on their next chapter</span></div></div><label className="deadline"><CalendarDays size={19}/><span>Your clear-out date<input aria-label="Your clear-out date" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></span></label></aside></div>
 <section className="inventory"><div className="section-heading"><div><h2>Your things <span>{items.length}</span></h2><p>Big, small, or “why do I still have this?”</p></div><span className="storage-note">{demo?'Try the example items below':saved?'Saved on this device':'Changes aren’t saved on this device'}</span></div>
 {demo&&<div className="demo-notice"><span>Take a little test drive. These are example items.</span><button onClick={()=>{setItems([]);setDemo(false);setDeadline('');setMessage('Your space is ready. Add your first item.');}}>Start my own space <ArrowRight size={16}/></button></div>}
 <Tabs value={tab} onValueChange={v=>setTab(String(v))}><TabsList className="filter-tabs" aria-label="Filter items"><TabsTrigger value="all">All things <span>{items.length}</span></TabsTrigger><TabsTrigger value="pending">Finding a home <span>{items.length-gone}</span></TabsTrigger><TabsTrigger value="gone">Gone to good <span>{gone}</span></TabsTrigger></TabsList>
 {['all','pending','gone'].map(t=><TabsContent key={t} value={t}><div className="item-grid">{items.filter(i=>t==='all'||(t==='gone'?i.gone:!i.gone)).map(item=>{const Icon=iconFor(item),RIcon=routeIcons[item.route];return <article key={item.id} className={`item-card ${item.gone?'is-gone':''}`}><div className={`item-visual ${routeClass(item.category)}`}>{item.photo?<img className="item-photo" src={item.photo} alt={item.name}/>:<Icon size={58} strokeWidth={1.15}/>}<span className={`route-badge ${routeClass(item.route)}`}><RIcon size={13}/>{item.route}</span>{item.gone&&<span className="gone-stamp"><Check size={15}/> Gone to good</span>}</div><div className="item-body"><div className="item-title"><h3>{item.name}</h3><button className="icon-button" onClick={()=>startItem(item)} aria-label={`Edit ${item.name}`}><Pencil size={16}/></button></div><p>{item.category} <span>·</span> {item.condition}</p><div className="item-bottom"><button className="text-link" onClick={()=>startItem(item)}>{item.route==='Decide later'?'Choose its next chapter':'View the plan'} <ArrowUpRight size={15}/></button><button className={`done-button ${item.gone?'done':''}`} onClick={()=>toggle(item.id)} aria-label={item.gone?`Undo marking ${item.name} as gone`:`Mark ${item.name} as gone`}>{item.gone?<Undo2 size={16}/>:<Check size={16}/>} {item.gone?'Undo':'Mark gone'}</button></div></div></article>})}
 {(t!=='gone')&&<button className="add-card" onClick={()=>startItem()}><span className="add-circle"><Plus size={26}/></span><strong>What else is ready to go?</strong><span>Add one thing. Start somewhere.</span></button>}
 {t==='gone'&&!gone&&<div className="empty-message"><Sprout size={30}/><h3>Fresh starts belong here.</h3><p>Mark an item as gone once it has left your space.</p></div>}
 </div></TabsContent>)}
 </Tabs></section>
 <section className="next-chapters"><div><span className="eyebrow">FOUR WAYS FORWARD</span><h2>Out of your space.<br/>Into something good.</h2></div><div className="chapter-grid">{(['Sell','Donate','Give away','Recycle'] as Route[]).map(r=>{const Icon=routeIcons[r];return <div className="chapter" key={r}><span className={`chapter-icon ${routeClass(r)}`}><Icon size={20}/></span><h3>{r}</h3><p>{r==='Sell'?'A little money back.':r==='Donate'?'Support a good cause.':r==='Give away'?'Make someone’s day.':'Recover what’s useful.'}</p></div>})}</div></section>
 </main><footer><span><Sprout size={16}/> Less stuff. More possibility.</span><span>Made for fresh starts.</span></footer>
 <Dialog open={open} onOpenChange={value=>{setOpen(value);if(!value){photoRequest.current++;setPhotoBusy(false);}}}><DialogContent className="item-dialog"><DialogTitle className="dialog-title">{editId?'Its next chapter':'One thing at a time.'}</DialogTitle><DialogDescription>{editId?'Give this item a plan, then mark it gone once it leaves.':'What’s ready to leave your space?'}</DialogDescription><form onSubmit={saveItem}>
 <div className="photo-field"><span className="photo-label">Item photo <span className="optional">(optional)</span></span>
 {photo&&<img className="photo-preview" src={photo} alt="Selected item photo"/>}
 <div className="photo-actions"><label className={`photo-upload ${photoBusy?'photo-loading':''}`}><Camera size={19}/>{photoBusy?'Preparing photo…':photo?'Replace photo':'Add a photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={e=>{void choosePhoto(e.target.files?.[0]);e.target.value='';}}/></label>
 {photo&&<button type="button" className="remove-photo" onClick={()=>{photoRequest.current++;setPhotoBusy(false);setPhoto('');setPhotoError('');}}>Remove photo</button>}</div>
 <p className="photo-hint">JPG, PNG or WebP, up to 15 MB. Saved only on this device.</p>
 {photoBusy&&<p role="status" className="photo-hint">Making your photo ready to save…</p>}
 {photoError&&<p role="alert" className="photo-error">{photoError}</p>}</div>
 <label className="field">Item name<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. The armchair by the window" autoFocus/></label><div className="form-row"><Choice label="Category" value={category} options={categories} onChange={setCategory}/><Choice label="Condition" value={condition} options={conditions} onChange={setCondition}/></div><Choice label="Its next chapter" value={route} options={routes} onChange={v=>setRoute(v as Route)}/><p className="guidance"><Sprout size={20}/>{guidance[route]}</p><label className="field">Your plan <span className="optional">(optional)</span><textarea maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Photograph on Saturday, arrange pickup next week"/></label><button className="primary form-submit" type="submit" disabled={photoBusy}>{editId?'Save changes':'Add to my space'} <ArrowRight size={18}/></button></form></DialogContent></Dialog>
 <Dialog open={help} onOpenChange={setHelp}><DialogContent className="item-dialog"><DialogTitle className="dialog-title">A clearer space in three steps.</DialogTitle><DialogDescription>Start small. There’s no perfect way to let things go.</DialogDescription><ol className="how-list"><li><strong>Add what you’re ready to part with.</strong><p>Name it, note its condition, and choose a clear-out date if you have one.</p></li><li><strong>Choose its next chapter.</strong><p>Sell, donate, give away, or recycle. Add your own collection or drop-off plan.</p></li><li><strong>Send it off. See your progress.</strong><p>Once it leaves, mark it gone. Every small step counts.</p></li></ol><p className="guidance">This first version is a personal planner. Your own items stay in this browser on this device. It doesn’t publish listings, arrange collections, or verify local services.</p></DialogContent></Dialog>
 {message&&<div className="toast-message" role="status"><Check size={18}/>{message}<button aria-label="Dismiss message" onClick={()=>setMessage('')}><X size={16}/></button></div>}
 </div>;
}
