import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const STORAGE_KEY = "bm-dashboard-v7";
const USERS = [
  { id: 0, initials: "IC", name: "Isabella C.", color: "#c8a96e", pin: "1234", role: "admin" },
  { id: 1, initials: "AA", name: "Adrielle A.", color: "#9a7ae0", pin: "0000", role: "staff" },
];
const TEAM = USERS;

const DEFAULT_DATA = {
  tasks: [], tickets: [],
  clients: [
    { id:0, name:"Grateful Day Enterprises",  type:"Demolition",           sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:1, name:"New Concept Cleaning",       type:"Cleaning",             sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:2, name:"IMS Woodworking Inc.",        type:"Carpentry",            sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:3, name:"AKM Painting Corp",           type:"Painting",             sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:4, name:"Excel Building Group",        type:"General Construction", sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:5, name:"Innova Pro Construction",     type:"General Construction", sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:6, name:"James McGuiness",             type:"General Construction", sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
    { id:7, name:"Backland Construction LLC",   type:"General Construction", sops:[], accesses:[], financeiro:{ ap:[], recibos:[], statements:[], fechamentos:[], contas:[], cartoes:[] } },
  ],
  sops: [
    { id:20, title:"Onboarding de Novo Cliente",   category:"ops",    icon:"🤝", updated:"Mar 2026" },
    { id:21, title:"Checklist de Entrega de Obra", category:"ops",    icon:"✅", updated:"Mar 2026" },
    { id:22, title:"Processo de Cotação",          category:"client", icon:"💰", updated:"Fev 2026" },
    { id:23, title:"Comunicação com Cliente",      category:"client", icon:"💬", updated:"Mar 2026" },
    { id:24, title:"Conciliação Financeira",       category:"fin",    icon:"📊", updated:"Jan 2026" },
    { id:25, title:"Emissão de NF",                category:"fin",    icon:"🧾", updated:"Fev 2026" },
    { id:26, title:"Contratação de Funcionário",   category:"rh",     icon:"👤", updated:"Mar 2026" },
    { id:27, title:"Avaliação de Desempenho",      category:"rh",     icon:"⭐", updated:"Jan 2026" },
  ],
  privateTickets: [], nextId: 50,
};

const fmtDate = (d) => { if (!d) return "—"; return new Date(d+"T00:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); };
const isOverdue = (d,s) => d && s !== "concluido" && new Date(d+"T00:00:00") < new Date();
const pColors = { alta:"#e05a5a", media:"#e0904a", baixa:"#5ab87a" };
const sCfg = {
  pendente:  { label:"Pendente",     color:"#e0904a", bg:"rgba(224,144,74,0.1)"  },
  andamento: { label:"Em Andamento", color:"#5a9ae0", bg:"rgba(90,154,224,0.1)"  },
  concluido: { label:"Concluído",    color:"#5ab87a", bg:"rgba(90,184,122,0.1)"  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0f0f0f;color:#f0ece4;font-size:14px}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:4px}
input,select,textarea{font-family:'DM Sans',sans-serif}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.fu{animation:fadeUp 0.25s ease both}
.mobile-nav{display:none}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
@media(max-width:768px){
  .sidebar{display:none!important}
  .main-content{margin-left:0!important;padding-bottom:72px!important}
  .top-bar{padding:0 14px!important}
  .page-content{padding:14px!important}
  .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;background:#171717;border-top:1px solid #2a2a2a;z-index:200;padding:6px 0 env(safe-area-inset-bottom,6px)}
  .mobile-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 2px;cursor:pointer;gap:2px;min-width:0}
  .mobile-nav-icon{font-size:19px}
  .mobile-nav-label{font-size:9px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;padding:0 2px}
  .grid-2col{grid-template-columns:1fr!important}
  .grid-3col{grid-template-columns:1fr!important}
  .grid-4col{grid-template-columns:1fr 1fr!important}
  .sec-body{overflow-x:auto;-webkit-overflow-scrolling:touch}
  table{min-width:520px}
  .top-bar input{width:130px!important}
}
`;

const iS = { width:"100%", background:"#1f1f1f", border:"1px solid #2a2a2a", borderRadius:8, padding:"9px 12px", color:"#f0ece4", fontSize:13.5, outline:"none" };

const Av = ({idx,size=24}) => <div style={{width:size,height:size,borderRadius:"50%",background:TEAM[idx]?.color||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:600,color:"#000",flexShrink:0}}>{TEAM[idx]?.initials||"?"}</div>;
const PDot = ({p}) => <span style={{width:7,height:7,borderRadius:"50%",display:"inline-block",background:pColors[p]||"#888",flexShrink:0,boxShadow:p==="alta"?`0 0 6px ${pColors.alta}88`:"none"}} />;
const SBadge = ({s}) => { const c=sCfg[s]||{}; return <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:500,background:c.bg,color:c.color,border:`1px solid ${c.color}33`}}>● {c.label}</span>; };
const Tag = ({label,v="client"}) => { const m={client:{bg:"rgba(90,154,224,0.1)",c:"#5a9ae0",b:"rgba(90,154,224,0.2)"},internal:{bg:"rgba(200,169,110,0.1)",c:"#c8a96e",b:"rgba(200,169,110,0.2)"},type:{bg:"rgba(200,169,110,0.06)",c:"#c8a96e",b:"rgba(200,169,110,0.15)"}}; const x=m[v]||m.client; return <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontWeight:500,background:x.bg,color:x.c,border:`1px solid ${x.b}`}}>{label}</span>; };
const Btn = ({children,onClick,variant="ghost",style:s={},disabled}) => { const m={primary:{background:"#c8a96e",color:"#000",border:"none"},ghost:{background:"transparent",color:"#888",border:"1px solid #2a2a2a"},danger:{background:"rgba(224,90,90,0.12)",color:"#e05a5a",border:"1px solid rgba(224,90,90,0.2)"}}; return <button onClick={onClick} disabled={disabled} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,transition:"all 0.15s",opacity:disabled?0.5:1,...m[variant],...s}}>{children}</button>; };
const Sec = ({title,action,children,style:s={}}) => <div style={{background:"#171717",border:"1px solid #2a2a2a",borderRadius:12,overflow:"hidden",...s}}><div style={{padding:"14px 18px",borderBottom:"1px solid #2a2a2a",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontWeight:600,color:"#f0ece4",flex:1}}>{title}</span>{action}</div><div className="sec-body">{children}</div></div>;
const Modal = ({open,onClose,children}) => { if(!open) return null; return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}><div className="fu" style={{background:"#171717",border:"1px solid #2a2a2a",borderRadius:14,width:500,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto",padding:28,position:"relative"}}><button onClick={onClose} style={{position:"absolute",right:18,top:18,background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,padding:4}}>✕</button>{children}</div></div>; };
const Toast = ({msg,visible}) => <div style={{position:"fixed",bottom:24,right:24,background:"#171717",border:"1px solid #2a2a2a",borderRadius:10,padding:"12px 18px",display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#f0ece4",boxShadow:"0 8px 24px rgba(0,0,0,0.5)",transform:visible?"translateY(0)":"translateY(80px)",opacity:visible?1:0,transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",zIndex:9999,minWidth:200,pointerEvents:"none"}}>{msg}</div>;
const StatCard = ({label,value,sub,accent}) => <div style={{background:"#171717",border:"1px solid #2a2a2a",borderRadius:12,padding:"18px 20px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accent}} /><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"#888",marginBottom:8}}>{label}</div><div style={{fontSize:34,fontFamily:"'DM Serif Display',serif",color:"#f0ece4",lineHeight:1}}>{value}</div><div style={{fontSize:11,color:"#555",marginTop:6}}>{sub}</div></div>;

const TaskCard = ({item,isTicket,clientName,onOpen}) => {
  const over = isOverdue(item.due,item.status);
  return <div onClick={()=>onOpen(item,isTicket)} className="fu" style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,padding:"11px 12px",marginBottom:7,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#3a3a3a";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.35)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a2a2a";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}><PDot p={item.priority} /><span style={{fontSize:13,fontWeight:500,color:"#f0ece4",flex:1,lineHeight:1.4}}>{item.title}</span><Av idx={item.assignee} size={20} /></div>
    <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><Tag label={isTicket?clientName:"Interno"} v={isTicket?"client":"internal"} />{(item.attachments||[]).length>0&&<span style={{fontSize:10,color:"#666"}}>📎 {item.attachments.length}</span>}<span style={{marginLeft:"auto",fontSize:10,color:over?"#e05a5a":"#555"}}>📅 {fmtDate(item.due)}{over?" ⚠️":""}</span></div>
  </div>;
};

const Kanban = ({items,isTicket,getClientName,onOpen}) => {
  const cols=[{key:"pendente",label:"Pendente",color:"#e0904a"},{key:"andamento",label:"Em Andamento",color:"#5a9ae0"},{key:"concluido",label:"Concluído",color:"#5ab87a"}];
  return <div style={{display:"flex",overflowX:"auto"}}>{cols.map(col=>{const ci=items.filter(t=>t.status===col.key);return <div key={col.key} style={{minWidth:220,flex:1,padding:14,borderRight:"1px solid #2a2a2a"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}><span style={{width:7,height:7,borderRadius:"50%",background:col.color,display:"inline-block"}} /><span style={{color:col.color}}>{col.label}</span><span style={{marginLeft:"auto",fontSize:11,color:"#555",fontWeight:400,textTransform:"none"}}>{ci.length}</span></div>{ci.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"#444",fontSize:12}}>Vazio</div>:ci.map(t=><TaskCard key={t.id} item={t} isTicket={isTicket} clientName={getClientName(t.client)} onOpen={onOpen} />)}</div>;})}</div>;
};

export default function App() {
  const [db,setDb]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [currentUser,setCurrentUser]=useState(null);
  const [loginForm,setLoginForm]=useState({userId:0,pin:""});
  const [loginError,setLoginError]=useState("");
  const [page,setPage]=useState("overview");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [toast,setToast]=useState({msg:"",visible:false});
  const [clientView,setClientView]=useState(null);
  const [clientTab,setClientTab]=useState("tickets");
  const [finTab,setFinTab]=useState("ap");
  const [finModal,setFinModal]=useState(null);
  const [finForm,setFinForm]=useState({});
  const [selMonth,setSelMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [accessModal,setAccessModal]=useState(null);
  const [ccModal,setCcModal]=useState(null); // {type:'conta'|'cartao', clientId, item?}
  const [ccForm,setCcForm]=useState({});
  const [selConta,setSelConta]=useState(null); // selected account id for statements filter
  const [showCcNum,setShowCcNum]=useState({});
  const [accessForm,setAccessForm]=useState({});
  const [showPw,setShowPw]=useState({});
  const [internalView,setInternalView]=useState("kanban");
  const [ticketFilter,setTicketFilter]=useState("all");
  const [searchQ,setSearchQ]=useState("");

  const load=useCallback(async()=>{
    try{
      const {data,error}=await supabase.from("app_data").select("value").eq("key",STORAGE_KEY).maybeSingle();
      if(error||!data)setDb(DEFAULT_DATA);
      else setDb(data.value);
    }catch{setDb(DEFAULT_DATA);}
    setLoading(false);
  },[]);
  const save=useCallback(async(nd)=>{
    setSaving(true);
    try{await supabase.from("app_data").upsert({key:STORAGE_KEY,value:nd,updated_at:new Date().toISOString()});}
    catch(e){console.error(e);}
    setSaving(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const i=setInterval(load,15000);return()=>clearInterval(i);},[load]);
  const update=(nd)=>{setDb(nd);save(nd);};
  const showToast=(msg)=>{setToast({msg,visible:true});setTimeout(()=>setToast(t=>({...t,visible:false})),2800);};

  const isAdmin=currentUser?.role==="admin";
  const handleLogin=()=>{
    const user=USERS.find(u=>u.id===parseInt(loginForm.userId));
    if(!user){setLoginError("Usuário não encontrado.");return;}
    if(user.pin!==loginForm.pin){setLoginError("PIN incorreto.");return;}
    setCurrentUser(user);setLoginError("");setPage(user.role==="admin"?"overview":"tickets");
  };
  const handleLogout=()=>{setCurrentUser(null);setLoginForm({userId:0,pin:""});setPage("overview");};
  const getClientName=(id)=>db?.clients.find(c=>c.id===id)?.name||"—";

  const openModal=(type,item=null,extra=null)=>{
    if(!currentUser){showToast("⚠️ Faça login primeiro");return;}
    if(!isAdmin&&["task","client","sop","privateTicket"].includes(type)){showToast("⚠️ Sem permissão");return;}
    const defs={task:{title:"",priority:"media",status:"pendente",assignee:0,due:"",notes:""},ticket:{title:"",client:db.clients[0]?.id??0,priority:"media",status:"pendente",assignee:0,due:"",notes:""},client:{name:"",type:"General Construction"},sop:{title:"",category:"ops",icon:"📄"}};
    setForm(item?{...item}:{...defs[type]});setModal({type,item,extra});
  };
  const closeModal=()=>setModal(null);

  const saveTask=()=>{
    if(!form.title?.trim()){showToast("⚠️ Preencha o título");return;}
    let nd;
    if(modal.item){nd={...db,tasks:db.tasks.map(t=>t.id===modal.item.id?{...t,...form}:t)};showToast("✓ Tarefa atualizada!");}
    else{nd={...db,tasks:[...db.tasks,{...form,id:db.nextId,type:"internal"}],nextId:db.nextId+1};showToast("✓ Tarefa criada!");}
    update(nd);closeModal();
  };
  const saveTicket=()=>{
    if(!form.title?.trim()){showToast("⚠️ Preencha o título");return;}
    let nd;
    if(modal.item){nd={...db,tickets:db.tickets.map(t=>t.id===modal.item.id?{...t,...form}:t)};showToast("✓ Ticket atualizado!");}
    else{nd={...db,tickets:[...db.tickets,{...form,id:db.nextId,client:parseInt(form.client)}],nextId:db.nextId+1};showToast("✓ Ticket criado!");}
    update(nd);closeModal();
  };
  const savePrivateTicket=()=>{
    if(!form.title?.trim()){showToast("⚠️ Preencha o título");return;}
    let nd;
    if(modal.item){nd={...db,privateTickets:(db.privateTickets||[]).map(t=>t.id===modal.item.id?{...t,...form}:t)};showToast("✓ Ticket privado atualizado!");}
    else{nd={...db,privateTickets:[...(db.privateTickets||[]),{...form,id:db.nextId,client:parseInt(form.client)}],nextId:db.nextId+1};showToast("✓ Ticket privado criado!");}
    update(nd);closeModal();
  };
  const saveClient=()=>{
    if(!form.name?.trim()){showToast("⚠️ Preencha o nome");return;}
    const nc={...form,id:db.nextId,sops:[],accesses:[],financeiro:{ap:[],recibos:[],statements:[],fechamentos:[],contas:[],cartoes:[]}};
    update({...db,clients:[...db.clients,nc],nextId:db.nextId+1});closeModal();showToast("✓ Cliente adicionado!");
  };
  const saveSOP=()=>{
    if(!form.title?.trim()){showToast("⚠️ Preencha o título");return;}
    if(modal.extra?.clientId!==undefined){const cid=modal.extra.clientId;update({...db,clients:db.clients.map(c=>c.id===cid?{...c,sops:[...c.sops,form.title]}:c)});showToast("✓ SOP adicionado!");}
    else{const ns={...form,id:db.nextId,updated:new Date().toLocaleDateString("pt-BR",{month:"short",year:"numeric"})};update({...db,sops:[...db.sops,ns],nextId:db.nextId+1});showToast("✓ SOP criado!");}
    closeModal();
  };
  const deleteItem=(id,type)=>{
    if(!window.confirm("Excluir?"))return;
    let nd;
    if(type==="task")nd={...db,tasks:db.tasks.filter(t=>t.id!==id)};
    if(type==="ticket")nd={...db,tickets:db.tickets.filter(t=>t.id!==id)};
    if(type==="privateTicket")nd={...db,privateTickets:(db.privateTickets||[]).filter(t=>t.id!==id)};
    if(type==="sop")nd={...db,sops:db.sops.filter(s=>s.id!==id)};
    update(nd);closeModal();showToast("🗑 Excluído");
  };
  const deleteClientSOP=(cid,title)=>{update({...db,clients:db.clients.map(c=>c.id===cid?{...c,sops:c.sops.filter(s=>s!==title)}:c)});showToast("🗑 SOP removido");};

  const saveAccess=()=>{
    if(!accessForm.label?.trim()){showToast("⚠️ Preencha o nome");return;}
    const cid=accessModal.clientId;let nd;
    if(accessModal.item){nd={...db,clients:db.clients.map(c=>c.id===cid?{...c,accesses:(c.accesses||[]).map(a=>a.id===accessModal.item.id?{...a,...accessForm}:a)}:c)};showToast("✓ Acesso atualizado!");}
    else{nd={...db,clients:db.clients.map(c=>c.id===cid?{...c,accesses:[...(c.accesses||[]),{...accessForm,id:db.nextId}]}:c),nextId:db.nextId+1};showToast("✓ Acesso salvo!");}
    update(nd);setAccessModal(null);
  };
  const deleteAccess=(cid,aid)=>{if(!window.confirm("Excluir?"))return;update({...db,clients:db.clients.map(c=>c.id===cid?{...c,accesses:(c.accesses||[]).filter(a=>a.id!==aid)}:c)});showToast("🗑 Acesso removido");};

  const updFin=(cid,key,val)=>update({...db,clients:db.clients.map(c=>c.id===cid?{...c,financeiro:{...c.financeiro,[key]:val}}:c)});
  const saveFinItem=(cid,key)=>{
    if(!finForm.description&&!finForm.vendor){showToast("⚠️ Preencha os campos");return;}
    const client=db.clients.find(c=>c.id===cid);const arr=client?.financeiro?.[key]||[];let na;
    if(finModal?.item){na=arr.map(x=>x.id===finModal.item.id?{...x,...finForm}:x);showToast("✓ Atualizado!");}
    else{na=[...arr,{...finForm,id:db.nextId}];const nd={...db,clients:db.clients.map(c=>c.id===cid?{...c,financeiro:{...c.financeiro,[key]:na}}:c),nextId:db.nextId+1};update(nd);setFinModal(null);showToast("✓ Salvo!");return;}
    updFin(cid,key,na);setFinModal(null);
  };
  const deleteFinItem=(cid,key,id)=>{if(!window.confirm("Excluir?"))return;const c=db.clients.find(x=>x.id===cid);updFin(cid,key,(c?.financeiro?.[key]||[]).filter(x=>x.id!==id));showToast("🗑 Removido");};
  const saveFechamento=(cid)=>{
    const c=db.clients.find(x=>x.id===cid);const arr=c?.financeiro?.fechamentos||[];
    const na=arr.find(f=>f.month===finForm.month)?arr.map(f=>f.month===finForm.month?{...finForm}:f):[...arr,{...finForm}];
    updFin(cid,"fechamentos",na);setFinModal(null);showToast("✓ Fechamento salvo!");
  };
  const saveCcItem=()=>{
    if(!ccForm.name?.trim()){showToast("⚠️ Preencha o nome");return;}
    const cid=ccModal.clientId;const key=ccModal.type==="conta"?"contas":"cartoes";
    const client=db.clients.find(c=>c.id===cid);const arr=client?.financeiro?.[key]||[];let na;
    if(ccModal.item){na=arr.map(x=>x.id===ccModal.item.id?{...x,...ccForm}:x);showToast("✓ Atualizado!");}
    else{na=[...arr,{...ccForm,id:db.nextId}];const nd={...db,clients:db.clients.map(c=>c.id===cid?{...c,financeiro:{...c.financeiro,[key]:na}}:c),nextId:db.nextId+1};update(nd);setCcModal(null);showToast("✓ Salvo!");return;}
    updFin(cid,key,na);setCcModal(null);
  };
  const deleteCcItem=(cid,key,id)=>{if(!window.confirm("Excluir?"))return;const c=db.clients.find(x=>x.id===cid);updFin(cid,key,(c?.financeiro?.[key]||[]).filter(x=>x.id!==id));showToast("🗑 Removido");};

  const openItemDetail=(item,isTicket)=>openModal(isTicket?"ticket":"task",item);

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f0f0f",flexDirection:"column",gap:16}}><style>{CSS}</style><div style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:"#c8a96e",animation:"pulse 1.5s infinite"}}>Central de Demandas</div><div style={{fontSize:12,color:"#555"}}>Carregando...</div></div>;

  if(!currentUser) return <>
    <style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f0f0f"}}>
      <div className="fu" style={{background:"#171717",border:"1px solid #2a2a2a",borderRadius:16,padding:"40px 36px",width:360,maxWidth:"95vw"}}>
        <div style={{textAlign:"center",marginBottom:32}}><div style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:"#c8a96e",lineHeight:1.1}}>Central<br/>de Demandas</div><div style={{fontSize:11,color:"#555",marginTop:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Be Magnus · Gestão</div></div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Usuário</label><select style={{...iS,width:"100%"}} value={loginForm.userId} onChange={e=>setLoginForm(f=>({...f,userId:parseInt(e.target.value)}))}>  {USERS.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        <div style={{marginBottom:22}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>PIN</label><input type="password" maxLength={6} style={{...iS,width:"100%",letterSpacing:"0.3em",fontSize:18,textAlign:"center"}} value={loginForm.pin} onChange={e=>setLoginForm(f=>({...f,pin:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="• • • •" /></div>
        {loginError&&<div style={{fontSize:12,color:"#e05a5a",marginBottom:14,textAlign:"center"}}>{loginError}</div>}
        <button onClick={handleLogin} style={{width:"100%",padding:"11px",borderRadius:9,border:"none",background:"#c8a96e",color:"#000",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#e8c98e"} onMouseLeave={e=>e.currentTarget.style.background="#c8a96e"}>Entrar</button>
        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:"#444"}}>Entre em contato com Isabella para obter seu PIN</div>
      </div>
    </div>
  </>;

  const allItems=[...db.tasks,...db.tickets];
  const openItems=allItems.filter(t=>t.status!=="concluido");

  const navAdmin=[
    {id:"overview",icon:"⬡",label:"Dashboard",badge:null},
    {id:"deadlines",icon:"◷",label:"Prazos",badge:openItems.filter(t=>t.due).length},
    {id:"internal",icon:"◈",label:"Tarefas Internas",badge:db.tasks.filter(t=>t.status!=="concluido").length},
    {id:"sop",icon:"◉",label:"SOPs",badge:db.sops.length},
    {id:"clients",icon:"◯",label:"Clientes",badge:db.clients.length},
    {id:"tickets",icon:"◻",label:"Tickets",badge:db.tickets.filter(t=>t.status!=="concluido").length},
    {id:"privateTickets",icon:"🔒",label:"Tickets Privados",badge:(db.privateTickets||[]).filter(t=>t.status!=="concluido").length},
  ];
  const navStaff=[
    {id:"tickets",icon:"◻",label:"Tickets",badge:db.tickets.filter(t=>t.status!=="concluido").length},
    {id:"deadlines",icon:"◷",label:"Prazos",badge:db.tickets.filter(t=>t.due&&t.status!=="concluido").length},
    {id:"clients",icon:"◯",label:"Clientes",badge:db.clients.length},
  ];
  const navItems=isAdmin?navAdmin:navStaff;
  const sections=isAdmin
    ?[{title:"VISÃO GERAL",items:navAdmin.slice(0,2)},{title:"EMPRESA",items:navAdmin.slice(2,4)},{title:"CLIENTES",items:navAdmin.slice(4,6)},{title:"PRIVADO",items:navAdmin.slice(6)}]
    :[{title:"DEMANDAS",items:navStaff.slice(0,2)},{title:"CLIENTES",items:navStaff.slice(2)}];

  // ── PAGES ──
  const PageOverview=()=>{
    const alta=openItems.filter(t=>t.priority==="alta");
    const andamento=openItems.filter(t=>t.status==="andamento");
    const today=new Date().toISOString().split("T")[0];
    const done=allItems.filter(t=>t.status==="concluido"&&t.due===today);
    const upcoming=allItems.filter(t=>t.due&&t.status!=="concluido").sort((a,b)=>a.due>b.due?1:-1).slice(0,6);
    return <div className="fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>Visão Geral</h2><span style={{fontSize:11,color:"#666"}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</span>{saving&&<span style={{fontSize:11,color:"#c8a96e",animation:"pulse 1s infinite"}}>💾 Salvando...</span>}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}><StatCard label="Total Demandas" value={openItems.length} sub="Abertas" accent="#c8a96e" /><StatCard label="Alta Prioridade" value={alta.length} sub="Requerem atenção" accent="#e05a5a" /><StatCard label="Em Andamento" value={andamento.length} sub="Sendo trabalhadas" accent="#5a9ae0" /><StatCard label="Concluídas Hoje" value={done.length} sub="Finalizadas hoje" accent="#5ab87a" /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <Sec title="🔥 Alta Prioridade" action={<Btn onClick={()=>setPage("internal")} style={{fontSize:11,padding:"4px 10px"}}>Ver todas</Btn>}><div style={{padding:12}}>{alta.length===0?<div style={{textAlign:"center",padding:24,color:"#555",fontSize:12}}>✓ Nenhuma tarefa urgente</div>:alta.slice(0,4).map(t=>{const it=t.client!==undefined;return <TaskCard key={t.id} item={t} isTicket={it} clientName={getClientName(t.client)} onOpen={(i,x)=>openItemDetail(i,x)} />;})}</div></Sec>
        <Sec title="📅 Próximos Prazos">{upcoming.map(t=>{const over=isOverdue(t.due,t.status);const it=t.client!==undefined;return <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 18px",borderBottom:"1px solid rgba(42,42,42,0.5)"}}><span style={{width:55,textAlign:"right",fontSize:11,fontWeight:600,color:over?"#e05a5a":"#888",flexShrink:0}}>{fmtDate(t.due)}</span><span style={{width:8,height:8,borderRadius:"50%",background:pColors[t.priority],flexShrink:0}} /><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{t.title}</div><div style={{fontSize:11,color:"#666",marginTop:1}}>{it?getClientName(t.client):"Interno"}</div></div></div>;})} {upcoming.length===0&&<div style={{textAlign:"center",padding:24,color:"#555",fontSize:12}}>Nenhum prazo próximo</div>}</Sec>
      </div>
      <Sec title="📋 Tickets Recentes" action={<Btn onClick={()=>setPage("tickets")} style={{fontSize:11,padding:"4px 10px"}}>Ver todos</Btn>}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Título","Cliente","Prioridade","Status","Prazo"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",borderBottom:"1px solid #2a2a2a",fontWeight:500}}>{h}</th>)}</tr></thead><tbody>{db.tickets.slice(0,4).map(t=><tr key={t.id} onClick={()=>openItemDetail(t,true)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><td style={{padding:"11px 16px",fontWeight:500}}>{t.title}</td><td style={{padding:"11px 16px",color:"#888"}}>{getClientName(t.client)}</td><td style={{padding:"11px 16px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><PDot p={t.priority} />{t.priority.charAt(0).toUpperCase()+t.priority.slice(1)}</div></td><td style={{padding:"11px 16px"}}><SBadge s={t.status} /></td><td style={{padding:"11px 16px",fontSize:12,color:isOverdue(t.due,t.status)?"#e05a5a":"#666"}}>{fmtDate(t.due)}</td></tr>)}</tbody></table></Sec>
    </div>;
  };

  const PageInternal=()=><div className="fu">
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>Tarefas Internas</h2><div style={{display:"flex",background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,padding:3,gap:3}}>{["kanban","lista"].map(v=><button key={v} onClick={()=>setInternalView(v)} style={{padding:"5px 12px",borderRadius:6,border:internalView===v?"1px solid #2a2a2a":"none",background:internalView===v?"#171717":"transparent",color:internalView===v?"#f0ece4":"#666",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>)}</div>{isAdmin&&<Btn variant="primary" onClick={()=>openModal("task")}>+ Nova Tarefa</Btn>}</div>
    <Sec title="">{internalView==="kanban"?<Kanban items={db.tasks} isTicket={false} getClientName={()=>""} onOpen={(i)=>openItemDetail(i,false)} />:<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Tarefa","Responsável","Prioridade","Status","Prazo",""].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",borderBottom:"1px solid #2a2a2a",fontWeight:500}}>{h}</th>)}</tr></thead><tbody>{db.tasks.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><td style={{padding:"11px 16px",fontWeight:500}}>{t.title}</td><td style={{padding:"11px 16px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><Av idx={t.assignee} /><span style={{color:"#888",fontSize:12}}>{TEAM[t.assignee]?.name}</span></div></td><td style={{padding:"11px 16px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><PDot p={t.priority} />{t.priority.charAt(0).toUpperCase()+t.priority.slice(1)}</div></td><td style={{padding:"11px 16px"}}><SBadge s={t.status} /></td><td style={{padding:"11px 16px",fontSize:12,color:isOverdue(t.due,t.status)?"#e05a5a":"#666"}}>{fmtDate(t.due)}</td><td style={{padding:"11px 16px"}}>{isAdmin&&<Btn onClick={()=>openItemDetail(t,false)} style={{fontSize:11,padding:"4px 8px"}}>Editar</Btn>}</td></tr>)}</tbody></table>}</Sec>
  </div>;

  const PageClients=()=>{
    if(clientView!==null){
      const client=db.clients.find(c=>c.id===clientView);
      if(!client)return null;
      const cTickets=db.tickets.filter(t=>t.client===clientView);
      const TABS=[{id:"tickets",label:"📁 Tickets"},{id:"sops",label:"📖 SOPs"},{id:"accesses",label:"🔑 Acessos"},{id:"financeiro",label:"💰 Financeiro"}];
      const fin=client.financeiro||{ap:[],recibos:[],statements:[],fechamentos:[]};
      const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const fmtC=v=>v?`$${parseFloat(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—";
      const mStr=(m)=>{if(!m)return "";const[y,mo]=m.split("-");return `${MONTHS[parseInt(mo)-1]} ${y}`;};
      return <div className="fu">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          <Btn onClick={()=>{setClientView(null);setClientTab("tickets");}}>← Voltar</Btn>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",flex:1}}>{client.name}</h2>
          <Tag label={client.type} v="type" />
          {clientTab==="tickets"&&currentUser&&<Btn variant="primary" onClick={()=>openModal("ticket",null,{clientId:client.id})}>+ Novo Ticket</Btn>}
          {clientTab==="sops"&&isAdmin&&<Btn variant="primary" onClick={()=>openModal("sop",null,{clientId:client.id})}>+ Novo SOP</Btn>}
          {clientTab==="accesses"&&currentUser&&<Btn variant="primary" onClick={()=>{setAccessForm({label:"",url:"",username:"",password:"",notes:""});setAccessModal({clientId:client.id});}}>+ Novo Acesso</Btn>}
          {clientTab==="financeiro"&&finTab==="ap"&&isAdmin&&<Btn variant="primary" onClick={()=>{setFinForm({vendor:"",amount:"",dueDay:"",recorrente:false,category:"",status:"pendente",notes:""});setFinModal({type:"ap",clientId:client.id});}}>+ Nova Conta</Btn>}
          {clientTab==="financeiro"&&finTab==="recibos"&&<Btn variant="primary" onClick={()=>{setFinForm({description:"",amount:"",date:new Date().toISOString().split("T")[0],notes:"",file:null});setFinModal({type:"recibo",clientId:client.id});}}>+ Novo Recibo</Btn>}
          {clientTab==="financeiro"&&finTab==="contas"&&currentUser&&<>
            <Btn variant="ghost" style={{fontSize:12}} onClick={()=>{setCcForm({name:"",bank:"",type:"checking",accountNumber:"",routing:"",balance:"",notes:""});setCcModal({type:"conta",clientId:client.id});}}>+ Conta Bancária</Btn>
            <Btn variant="primary" onClick={()=>{setCcForm({name:"",issuer:"",lastFour:"",limit:"",balance:"",dueDay:"",storeCard:false,store:"",notes:""});setCcModal({type:"cartao",clientId:client.id});}}>+ Cartão</Btn>
          </>}
          {clientTab==="financeiro"&&finTab==="statements"&&isAdmin&&<Btn variant="primary" onClick={()=>{setFinForm({month:selMonth,file:null,balance:"",reconciled:false,notes:"",contaId:selConta||""});setFinModal({type:"statement",clientId:client.id});}}>+ Statement</Btn>}
          {clientTab==="financeiro"&&finTab==="fechamento"&&isAdmin&&<Btn variant="primary" onClick={()=>{setFinForm({month:selMonth,receitas:"",salario:"",outras_saidas:"",retirada:"",caixa_anterior:"",notes:""});setFinModal({type:"fechamento",clientId:client.id});}}>+ Fechamento</Btn>}
        </div>
        {/* MAIN TABS */}
        <div style={{display:"flex",gap:2,marginBottom:18,background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:4,width:"fit-content",flexWrap:"wrap"}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setClientTab(t.id)} style={{padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,transition:"all 0.15s",background:clientTab===t.id?"#171717":"transparent",color:clientTab===t.id?"#f0ece4":"#666",boxShadow:clientTab===t.id?"0 1px 4px rgba(0,0,0,0.3)":"none"}}>{t.label}</button>)}
        </div>

        {/* TICKETS TAB */}
        {clientTab==="tickets"&&<Sec title="">{cTickets.length===0?<div style={{padding:32,textAlign:"center",color:"#555",fontSize:12}}>Nenhum ticket. Crie um com o botão acima.</div>:<Kanban items={cTickets} isTicket getClientName={getClientName} onOpen={(i)=>openItemDetail(i,true)} />}</Sec>}

        {/* SOPs TAB */}
        {clientTab==="sops"&&<Sec title=""><div style={{padding:14}}>{(client.sops||[]).length===0?<div style={{textAlign:"center",padding:28,color:"#555",fontSize:12}}>Nenhum SOP cadastrado</div>:(client.sops||[]).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,padding:"12px 14px",marginBottom:8}}><div style={{width:32,height:32,borderRadius:7,background:"rgba(154,122,224,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📄</div><span style={{flex:1,fontSize:13,fontWeight:500}}>{s}</span>{isAdmin&&<button onClick={()=>deleteClientSOP(client.id,s)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>×</button>}</div>)}</div></Sec>}

        {/* ACESSOS TAB */}
        {clientTab==="accesses"&&<Sec title=""><div style={{padding:14}}>{(client.accesses||[]).length===0?<div style={{textAlign:"center",padding:28,color:"#555",fontSize:12}}>🔑 Nenhum acesso cadastrado</div>:(client.accesses||[]).map(a=><div key={a.id} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:34,height:34,borderRadius:8,background:"rgba(200,169,110,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔑</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#f0ece4"}}>{a.label}</div>{a.url&&<a href={a.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#5a9ae0",textDecoration:"none"}}>{a.url}</a>}</div><button onClick={()=>{setAccessForm({...a});setAccessModal({clientId:client.id,item:a});}} style={{background:"none",border:"1px solid #2a2a2a",borderRadius:6,color:"#888",cursor:"pointer",padding:"4px 10px",fontSize:12}}>✏️ Editar</button><button onClick={()=>deleteAccess(client.id,a.id)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"#171717",borderRadius:7,padding:"8px 12px"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",marginBottom:3}}>Usuário / Email</div><div style={{fontSize:13,color:"#f0ece4",wordBreak:"break-all"}}>{a.username||"—"}</div></div>
            <div style={{background:"#171717",borderRadius:7,padding:"8px 12px"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",marginBottom:3}}>Senha</div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,color:"#f0ece4",flex:1,letterSpacing:showPw[a.id]?"normal":"0.15em"}}>{showPw[a.id]?(a.password||"—"):(a.password?"••••••••":"—")}</span>{a.password&&<button onClick={()=>setShowPw(s=>({...s,[a.id]:!s[a.id]}))} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13}}>{showPw[a.id]?"🙈":"👁"}</button>}{a.password&&<button onClick={()=>{navigator.clipboard.writeText(a.password);showToast("📋 Senha copiada!");}} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13}}>📋</button>}</div></div>
          </div>
          {a.notes&&<div style={{marginTop:8,fontSize:12,color:"#666",padding:"6px 10px",background:"#171717",borderRadius:6}}>{a.notes}</div>}
        </div>)}</div></Sec>}

        {/* FINANCEIRO TAB */}
        {clientTab==="financeiro"&&<div>
          <div style={{display:"flex",gap:2,marginBottom:18,background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:4,width:"fit-content",flexWrap:"wrap"}}>
            {[{id:"ap",label:"📋 Accounts Payable"},{id:"contas",label:"🏦 Contas & Cartões"},{id:"fechamento",label:"📊 Fechamento"},{id:"recibos",label:"🧾 Recibos"},{id:"statements",label:"📄 Statements"}].map(t=><button key={t.id} onClick={()=>setFinTab(t.id)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12.5,fontWeight:500,transition:"all 0.15s",background:finTab===t.id?"#2a2a2a":"transparent",color:finTab===t.id?"#c8a96e":"#666"}}>{t.label}</button>)}
          </div>

          {/* CONTAS & CARTÕES */}
          {finTab==="contas"&&(()=>{
            const contas=fin.contas||[];const cartoes=fin.cartoes||[];
            const fmtNum=(n)=>n?`••••${n.slice(-4)}`:null;
            const ccColors={visa:"#1a1f71",mastercard:"#eb001b",amex:"#007bc1",discover:"#ff6600",store:"#5ab87a",other:"#888"};
            const getIssuerColor=(c)=>c.storeCard?"#5ab87a":ccColors[c.issuer?.toLowerCase()]||ccColors.other;
            return <div>
              {/* CONTAS BANCÁRIAS */}
              <div style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><h3 style={{fontSize:14,fontWeight:600,color:"#f0ece4",flex:1}}>🏦 Contas Bancárias</h3><span style={{fontSize:11,color:"#666"}}>{contas.length} conta(s)</span></div>
                {contas.length===0?<div style={{textAlign:"center",padding:28,color:"#555",fontSize:12,background:"#1f1f1f",borderRadius:10,border:"1px solid #2a2a2a"}}>Nenhuma conta bancária cadastrada</div>:
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>{contas.map(c=><div key={c.id} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:12,padding:18,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#5a9ae0,#9a7ae0)"}} />
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
                    <div style={{width:40,height:40,borderRadius:9,background:"rgba(90,154,224,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏦</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#f0ece4"}}>{c.name}</div>
                      <div style={{fontSize:11,color:"#888",marginTop:2}}>{c.bank||"—"} · {c.type==="checking"?"Checking":"Savings"}</div>
                    </div>
                    {currentUser&&<div style={{display:"flex",gap:6}}><button onClick={()=>{setCcForm({...c});setCcModal({type:"conta",clientId:client.id,item:c});}} style={{background:"none",border:"1px solid #2a2a2a",borderRadius:6,color:"#888",cursor:"pointer",padding:"3px 8px",fontSize:11}}>✏️</button><button onClick={()=>deleteCcItem(client.id,"contas",c.id)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>×</button></div>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {c.accountNumber&&<div style={{background:"#171717",borderRadius:7,padding:"8px 10px"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",marginBottom:3}}>Account #</div><div style={{fontSize:12,color:"#f0ece4",letterSpacing:"0.1em"}}>{showCcNum[c.id]?c.accountNumber:fmtNum(c.accountNumber)||"—"}<button onClick={()=>setShowCcNum(s=>({...s,[c.id]:!s[c.id]}))} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:11,marginLeft:6}}>{showCcNum[c.id]?"🙈":"👁"}</button></div></div>}
                    {c.routing&&<div style={{background:"#171717",borderRadius:7,padding:"8px 10px"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",marginBottom:3}}>Routing #</div><div style={{fontSize:12,color:"#f0ece4"}}>{showCcNum[`r${c.id}`]?c.routing:"••••"+c.routing.slice(-4)}<button onClick={()=>setShowCcNum(s=>({...s,[`r${c.id}`]:!s[`r${c.id}`]}))} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:11,marginLeft:6}}>{showCcNum[`r${c.id}`]?"🙈":"👁"}</button></div></div>}
                    {c.balance&&<div style={{background:"#171717",borderRadius:7,padding:"8px 10px"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",marginBottom:3}}>Saldo</div><div style={{fontSize:13,color:"#5ab87a",fontWeight:600}}>${parseFloat(c.balance).toLocaleString("en-US",{minimumFractionDigits:2})}</div></div>}
                  </div>
                  {c.notes&&<div style={{marginTop:10,fontSize:11,color:"#666",padding:"6px 10px",background:"#171717",borderRadius:6}}>{c.notes}</div>}
                  <button onClick={()=>{setSelConta(c.id);setFinTab("statements");}} style={{marginTop:12,width:"100%",padding:"6px",borderRadius:7,border:"1px solid #2a2a2a",background:"transparent",color:"#666",cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>📄 Ver Statements</button>
                </div>)}</div>}
              </div>

              {/* CARTÕES */}
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><h3 style={{fontSize:14,fontWeight:600,color:"#f0ece4",flex:1}}>💳 Cartões de Crédito</h3><span style={{fontSize:11,color:"#666"}}>{cartoes.length} cartão(ões)</span></div>
                {cartoes.length===0?<div style={{textAlign:"center",padding:28,color:"#555",fontSize:12,background:"#1f1f1f",borderRadius:10,border:"1px solid #2a2a2a"}}>Nenhum cartão cadastrado</div>:
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>{cartoes.map(cc=>{const accentColor=getIssuerColor(cc);return <div key={cc.id} style={{borderRadius:14,padding:20,position:"relative",overflow:"hidden",background:`linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,border:`1px solid ${accentColor}33`,boxShadow:`0 4px 20px rgba(0,0,0,0.4)`}}>
                  <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:`${accentColor}15`}} />
                  <div style={{position:"absolute",top:30,right:40,width:80,height:80,borderRadius:"50%",background:`${accentColor}08`}} />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,position:"relative"}}>
                    <div><div style={{fontSize:13,fontWeight:600,color:"#f0ece4"}}>{cc.name||cc.store||cc.issuer}</div><div style={{fontSize:11,color:"#aaa",marginTop:2}}>{cc.storeCard?`🏪 ${cc.store||"Store Card"}`:`💳 ${cc.issuer||"Credit Card"}`}</div></div>
                    {currentUser&&<div style={{display:"flex",gap:6}}><button onClick={()=>{setCcForm({...cc});setCcModal({type:"cartao",clientId:client.id,item:cc});}} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:"#aaa",cursor:"pointer",padding:"3px 8px",fontSize:11}}>✏️</button><button onClick={()=>deleteCcItem(client.id,"cartoes",cc.id)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:16}}>×</button></div>}
                  </div>
                  <div style={{fontSize:16,letterSpacing:"0.2em",color:"#ddd",marginBottom:16,fontFamily:"monospace",position:"relative"}}>{showCcNum[`cc${cc.id}`]?(cc.lastFour||"—"):`•••• •••• •••• ${cc.lastFour||"••••"}`}<button onClick={()=>setShowCcNum(s=>({...s,[`cc${cc.id}`]:!s[`cc${cc.id}`]}))} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:11,marginLeft:8}}>{showCcNum[`cc${cc.id}`]?"🙈":"👁"}</button></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,position:"relative"}}>
                    {cc.limit&&<div><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",color:"#888",marginBottom:3}}>Limite</div><div style={{fontSize:12,color:"#f0ece4",fontWeight:600}}>${parseFloat(cc.limit).toLocaleString("en-US",{minimumFractionDigits:0})}</div></div>}
                    {cc.balance&&<div><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",color:"#888",marginBottom:3}}>Saldo Atual</div><div style={{fontSize:12,color:"#e05a5a",fontWeight:600}}>${parseFloat(cc.balance).toLocaleString("en-US",{minimumFractionDigits:0})}</div></div>}
                    {cc.dueDay&&<div><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",color:"#888",marginBottom:3}}>Vence dia</div><div style={{fontSize:12,color:parseInt(cc.dueDay)<new Date().getDate()?"#e05a5a":"#c8a96e",fontWeight:600}}>{cc.dueDay}º</div></div>}
                  </div>
                  {cc.notes&&<div style={{marginTop:12,fontSize:11,color:"#777",padding:"6px 10px",background:"rgba(0,0,0,0.3)",borderRadius:6}}>{cc.notes}</div>}
                </div>;})}
                </div>}
              </div>
            </div>;
          })()}

          {/* AP */}
          {finTab==="ap"&&(()=>{
            const now=new Date();const ap=fin.ap||[];
            const sorted=[...ap].sort((a,b)=>(parseInt(a.dueDay)||99)-(parseInt(b.dueDay)||99));
            const totPend=ap.filter(x=>x.status==="pendente").reduce((s,x)=>s+parseFloat(x.amount||0),0);
            const totPaid=ap.filter(x=>x.status==="pago").reduce((s,x)=>s+parseFloat(x.amount||0),0);
            return <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}}>{[["Total Contas",ap.length,"#c8a96e"],["Pendente",fmtC(totPend),"#e05a5a"],["Pago este mês",fmtC(totPaid),"#5ab87a"]].map(([l,v,c])=><div key={l} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#666",marginBottom:6}}>{l}</div><div style={{fontSize:22,fontFamily:"'DM Serif Display',serif",color:c}}>{v}</div></div>)}</div>
              {sorted.length===0?<div style={{textAlign:"center",padding:40,color:"#555"}}>Nenhuma conta cadastrada. Clique em "+ Nova Conta"</div>:<Sec title=""><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Dia","Vendor / Conta","Valor","Tipo","Status",""].map(h=><th key={h} style={{padding:"9px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",borderBottom:"1px solid #2a2a2a",fontWeight:500}}>{h}</th>)}</tr></thead><tbody>{sorted.map(row=>{const late=row.status==="pendente"&&row.dueDay&&parseInt(row.dueDay)<now.getDate();return <tr key={row.id} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><td style={{padding:"11px 16px",fontFamily:"'DM Serif Display',serif",fontSize:18,color:late?"#e05a5a":"#c8a96e"}}>{row.dueDay?`${row.dueDay}º`:"—"}</td><td style={{padding:"11px 16px"}}><div style={{fontWeight:500,fontSize:13}}>{row.vendor}</div>{row.category&&<div style={{fontSize:11,color:"#666"}}>{row.category}</div>}</td><td style={{padding:"11px 16px",fontWeight:600,color:"#f0ece4"}}>{fmtC(row.amount)}</td><td style={{padding:"11px 16px"}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:row.recorrente?"rgba(200,169,110,0.1)":"transparent",color:row.recorrente?"#c8a96e":"#555",border:`1px solid ${row.recorrente?"rgba(200,169,110,0.2)":"#2a2a2a"}`}}>{row.recorrente?"🔄 Recorrente":"Avulsa"}</span></td><td style={{padding:"11px 16px"}}>{isAdmin?<select value={row.status} onChange={e=>{const na=(fin.ap||[]).map(x=>x.id===row.id?{...x,status:e.target.value}:x);updFin(client.id,"ap",na);}} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:6,color:row.status==="pago"?"#5ab87a":late?"#e05a5a":"#e0904a",padding:"4px 8px",fontSize:12,cursor:"pointer"}}><option value="pendente">Pendente</option><option value="pago">Pago ✓</option><option value="atrasado">Atrasado</option></select>:<span style={{fontSize:12,color:row.status==="pago"?"#5ab87a":late?"#e05a5a":"#e0904a"}}>{row.status}</span>}</td><td style={{padding:"11px 16px"}}>{isAdmin&&<button onClick={()=>{setFinForm({...row});setFinModal({type:"ap",clientId:client.id,item:row});}} style={{background:"none",border:"1px solid #2a2a2a",borderRadius:6,color:"#888",cursor:"pointer",padding:"4px 10px",fontSize:12}}>✏️</button>}</td></tr>;})}</tbody></table></Sec>}
            </div>;
          })()}

          {/* FECHAMENTO */}
          {finTab==="fechamento"&&(()=>{
            const fechamentos=fin.fechamentos||[];const fec=fechamentos.find(f=>f.month===selMonth)||{};
            const rec=parseFloat(fec.receitas||0);const sal=parseFloat(fec.salario||0);const out=parseFloat(fec.outras_saidas||0);const ret=parseFloat(fec.retirada||0);
            const totS=sal+out+ret;const lucro=rec-sal-out;const caixa=rec-totS+parseFloat(fec.caixa_anterior||0);const bMax=Math.max(rec,totS,1);
            return <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,color:"#f0ece4",padding:"7px 12px",fontSize:13}}>
                  {Array.from({length:12},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);const val=d.toISOString().slice(0,7);return <option key={val} value={val}>{mStr(val)}</option>;})}
                </select>
                <span style={{fontSize:12,color:"#666"}}>{fechamentos.length} fechamento(s)</span>
              </div>
              {!fec.receitas?<div style={{textAlign:"center",padding:40,color:"#555"}}>Nenhum fechamento para {mStr(selMonth)}.<br/>Clique em "+ Fechamento" para criar.</div>:<div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>{[["Receitas",fmtC(rec),"#5ab87a"],["Total Saídas",fmtC(totS),"#e05a5a"],["Lucro Líquido",fmtC(lucro),lucro>=0?"#c8a96e":"#e05a5a"],["Caixa Final",fmtC(caixa),"#5a9ae0"]].map(([l,v,c])=><div key={l} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#666",marginBottom:6}}>{l}</div><div style={{fontSize:20,fontFamily:"'DM Serif Display',serif",color:c}}>{v}</div></div>)}</div>
                <Sec title="📊 Resumo Visual"><div style={{padding:"20px 24px"}}>{[["Receitas",rec,"#5ab87a"],["Salário",sal,"#e05a5a"],["Outras Saídas",out,"#e0904a"],["Retirada de Lucro",ret,"#9a7ae0"]].map(([l,v,c])=><div key={l} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:"#888"}}>{l}</span><span style={{fontSize:12,fontWeight:600,color:c}}>{fmtC(v)}</span></div><div style={{height:8,background:"#2a2a2a",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round((v/bMax)*100)}%`,background:c,borderRadius:4,transition:"width 0.6s ease"}} /></div></div>)}</div></Sec>
                {fec.notes&&<div style={{marginTop:14,background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,padding:"12px 16px",fontSize:13,color:"#888"}}>📝 {fec.notes}</div>}
                {isAdmin&&<div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}><Btn onClick={()=>{setFinForm({...fec});setFinModal({type:"fechamento",clientId:client.id});}}>✏️ Editar</Btn></div>}
              </div>}
            </div>;
          })()}

          {/* RECIBOS */}
          {finTab==="recibos"&&(()=>{
            const recibos=(fin.recibos||[]).sort((a,b)=>b.date>a.date?1:-1);
            const totR=recibos.reduce((s,r)=>s+parseFloat(r.amount||0),0);
            const pendQB=recibos.filter(r=>!r.lancado);
            return <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}}>{[["Total Recibos",recibos.length,"#c8a96e"],["Valor Total",fmtC(totR),"#f0ece4"],["Pendente QuickBooks",pendQB.length,"#e0904a"]].map(([l,v,c])=><div key={l} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#666",marginBottom:6}}>{l}</div><div style={{fontSize:22,fontFamily:"'DM Serif Display',serif",color:c}}>{v}</div></div>)}</div>
              {recibos.length===0?<div style={{textAlign:"center",padding:40,color:"#555"}}>Nenhum recibo. Adrielle pode adicionar com o botão acima.</div>:<Sec title=""><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Data","Descrição","Valor","Lançado QB","Arquivo",""].map(h=><th key={h} style={{padding:"9px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",borderBottom:"1px solid #2a2a2a",fontWeight:500}}>{h}</th>)}</tr></thead><tbody>{recibos.map(r=><tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><td style={{padding:"11px 16px",fontSize:12,color:"#888"}}>{fmtDate(r.date)}</td><td style={{padding:"11px 16px",fontWeight:500}}>{r.description}</td><td style={{padding:"11px 16px",color:"#5ab87a",fontWeight:600}}>{fmtC(r.amount)}</td><td style={{padding:"11px 16px"}}>{isAdmin?<button onClick={()=>{const na=(fin.recibos||[]).map(x=>x.id===r.id?{...x,lancado:!x.lancado}:x);updFin(client.id,"recibos",na);}} style={{background:"none",border:`1px solid ${r.lancado?"#5ab87a":"#2a2a2a"}`,borderRadius:6,color:r.lancado?"#5ab87a":"#555",cursor:"pointer",padding:"3px 10px",fontSize:11}}>{r.lancado?"✓ Lançado":"Pendente"}</button>:<span style={{fontSize:11,color:r.lancado?"#5ab87a":"#e0904a"}}>{r.lancado?"✓ Lançado":"Pendente"}</span>}</td><td style={{padding:"11px 16px"}}>{r.file?<a href={r.file.data} download={r.file.name} style={{fontSize:11,color:"#5a9ae0",textDecoration:"none"}}>📎 {r.file.name}</a>:<span style={{color:"#444",fontSize:11}}>—</span>}</td><td style={{padding:"11px 16px",display:"flex",gap:6}}><button onClick={()=>{setFinForm({...r});setFinModal({type:"recibo",clientId:client.id,item:r});}} style={{background:"none",border:"1px solid #2a2a2a",borderRadius:6,color:"#888",cursor:"pointer",padding:"4px 8px",fontSize:11}}>✏️</button><button onClick={()=>deleteFinItem(client.id,"recibos",r.id)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>×</button></td></tr>)}</tbody></table></Sec>}
            </div>;
          })()}

          {/* BANK STATEMENTS */}
          {finTab==="statements"&&(()=>{
            const allContas=fin.contas||[];const allCartoes=fin.cartoes||[];
            const allAccounts=[...allContas.map(c=>({...c,kind:"conta"})),...allCartoes.map(c=>({...c,kind:"cartao"}))];
            const filteredStmts=(fin.statements||[]).filter(s=>selConta?s.contaId===selConta:true).sort((a,b)=>b.month>a.month?1:-1);
            return <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <select value={selConta||""} onChange={e=>setSelConta(e.target.value||null)} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,color:"#f0ece4",padding:"7px 12px",fontSize:12}}>
                  <option value="">Todas as Contas</option>
                  {allAccounts.map(a=><option key={a.id} value={a.id}>{a.kind==="conta"?"🏦":"💳"} {a.name||a.store||a.issuer}</option>)}
                </select>
                <span style={{fontSize:11,color:"#666"}}>{filteredStmts.length} statement(s)</span>
              </div>
              {filteredStmts.length===0?<div style={{textAlign:"center",padding:40,color:"#555"}}>Nenhum statement cadastrado</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{filteredStmts.map(s=>{
                const acct=allAccounts.find(a=>a.id===s.contaId);
                return (
                  <div key={s.id} style={{background:"#1f1f1f",border:`1px solid ${s.reconciled?"rgba(90,184,122,0.3)":"#2a2a2a"}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:46,height:46,borderRadius:9,background:"rgba(90,154,224,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏦</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#f0ece4"}}>{mStr(s.month)}</div>
                      {acct&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{acct.kind==="conta"?"🏦":"💳"} {acct.name||acct.store||acct.issuer}</div>}
                      {s.balance&&<div style={{fontSize:12,color:"#5ab87a",marginTop:2}}>Saldo: {s.balance.startsWith("$")?s.balance:"$"+s.balance}</div>}
                      {s.notes&&<div style={{fontSize:11,color:"#666",marginTop:3}}>{s.notes}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {s.file&&<a href={s.file.data} download={s.file.name} style={{fontSize:12,color:"#5a9ae0",textDecoration:"none",border:"1px solid rgba(90,154,224,0.3)",borderRadius:6,padding:"4px 10px"}}>📄 PDF</a>}
                      <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:s.reconciled?"rgba(90,184,122,0.1)":"rgba(224,144,74,0.1)",color:s.reconciled?"#5ab87a":"#e0904a",border:`1px solid ${s.reconciled?"rgba(90,184,122,0.2)":"rgba(224,144,74,0.2)"}`}}>{s.reconciled?"✓ Reconciliado":"Pendente"}</span>
                      {isAdmin&&<>
                        <button onClick={()=>{setFinForm({...s});setFinModal({type:"statement",clientId:client.id,item:s});}} style={{background:"none",border:"1px solid #2a2a2a",borderRadius:6,color:"#888",cursor:"pointer",padding:"4px 8px",fontSize:12}}>✏️</button>
                        <button onClick={()=>deleteFinItem(client.id,"statements",s.id)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18}}>×</button>
                      </>}
                    </div>
                  </div>
                );
              })}
            </div>}
          </div>;
          })()}
        </div>}
      </div>;
    }

    const tByC={};db.tickets.forEach(t=>{if(!tByC[t.client])tByC[t.client]={total:0,open:0};tByC[t.client].total++;if(t.status!=="concluido")tByC[t.client].open++;});
    return <div className="fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>Clientes</h2>{isAdmin&&<Btn variant="primary" onClick={()=>openModal("client")}>+ Novo Cliente</Btn>}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>{db.clients.map(c=>{const st=tByC[c.id]||{total:0,open:0};const done=st.total-st.open;const pct=st.total?Math.round((done/st.total)*100):0;return <div key={c.id} onClick={()=>setClientView(c.id)} style={{background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:10,padding:18,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c8a96e";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a2a2a";e.currentTarget.style.transform="";}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><div style={{width:38,height:38,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,#c8a96e,rgba(200,169,110,0.3))",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Serif Display',serif",fontSize:16,color:"#000",fontWeight:700}}>{c.name[0]}</div><div><div style={{fontSize:14,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:"#888"}}>{c.type}</div></div></div>
        <div style={{display:"flex",gap:14,marginBottom:12}}>{[["Total",st.total,"#f0ece4"],["Abertos",st.open,"#e0904a"],["Concluídos",done,"#5ab87a"],["SOPs",c.sops.length,"#9a7ae0"]].map(([l,v,col])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:18,fontFamily:"'DM Serif Display',serif",color:col}}>{v}</div><div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div></div>)}</div>
        <div style={{height:3,background:"#2a2a2a",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#c8a96e,#e8c98e)",borderRadius:2,transition:"width 0.5s"}} /></div>
      </div>;})}
      </div>
    </div>;
  };

  const PageTickets=()=>{
    const filtered=ticketFilter==="all"?db.tickets:db.tickets.filter(t=>t.status===ticketFilter);
    const q=searchQ.toLowerCase();
    const shown=q?filtered.filter(t=>t.title.toLowerCase().includes(q)||getClientName(t.client).toLowerCase().includes(q)):filtered;
    return <div className="fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>Tickets / Solicitações</h2><select value={ticketFilter} onChange={e=>setTicketFilter(e.target.value)} style={{...iS,width:170,padding:"7px 10px"}}><option value="all">Todos os Status</option><option value="pendente">Pendente</option><option value="andamento">Em Andamento</option><option value="concluido">Concluído</option></select>{currentUser&&<Btn variant="primary" onClick={()=>openModal("ticket")}>+ Novo Ticket</Btn>}</div>
      <Sec title=""><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Título","Cliente","Responsável","Prioridade","Status","Prazo",""].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",borderBottom:"1px solid #2a2a2a",fontWeight:500}}>{h}</th>)}</tr></thead><tbody>{shown.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><td style={{padding:"11px 16px",color:"#555",fontSize:12}}>#{String(t.id).padStart(3,"0")}</td><td style={{padding:"11px 16px",fontWeight:500}}>{t.title}</td><td style={{padding:"11px 16px"}}><Tag label={getClientName(t.client)} v="client" /></td><td style={{padding:"11px 16px"}}><Av idx={t.assignee} /></td><td style={{padding:"11px 16px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><PDot p={t.priority} />{t.priority.charAt(0).toUpperCase()+t.priority.slice(1)}</div></td><td style={{padding:"11px 16px"}}><SBadge s={t.status} /></td><td style={{padding:"11px 16px",fontSize:12,color:isOverdue(t.due,t.status)?"#e05a5a":"#666"}}>{fmtDate(t.due)}</td><td style={{padding:"11px 16px"}}>{currentUser&&<Btn onClick={()=>openItemDetail(t,true)} style={{fontSize:11,padding:"4px 8px"}}>Editar</Btn>}</td></tr>)}{shown.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:32,color:"#555"}}>Nenhum ticket encontrado</td></tr>}</tbody></table></Sec>
    </div>;
  };

  const PageSOP=()=>{
    const cats=[{key:"ops",label:"📁 Operações"},{key:"client",label:"📁 Clientes"},{key:"fin",label:"📁 Financeiro"},{key:"rh",label:"📁 RH & Equipe"}];
    return <div className="fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>SOPs da Empresa</h2>{isAdmin&&<Btn variant="primary" onClick={()=>openModal("sop")}>+ Novo SOP</Btn>}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>{cats.map(cat=>{const items=db.sops.filter(s=>s.category===cat.key);return <Sec key={cat.key} title={cat.label}><div style={{padding:14}}>{items.length===0?<div style={{textAlign:"center",padding:20,color:"#555",fontSize:12}}>Nenhum SOP</div>:items.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:12,background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:8,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"border-color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(154,122,224,0.4)"} onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2a2a"}><div style={{width:34,height:34,borderRadius:7,background:"rgba(154,122,224,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{s.icon}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{s.title}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>Atualizado: {s.updated}</div></div>{isAdmin&&<button onClick={()=>deleteItem(s.id,"sop")} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>}</div>)}</div></Sec>;})}
      </div>
    </div>;
  };

  const PageDeadlines=()=>{
    const all=allItems.filter(t=>t.due&&t.status!=="concluido").sort((a,b)=>a.due>b.due?1:-1);
    return <div className="fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>Prazos & Entregas</h2></div>
      <Sec title="📅 Todos os Prazos em Aberto">{all.map(t=>{const over=isOverdue(t.due,t.status);const it=t.client!==undefined;return <div key={t.id} onClick={()=>openItemDetail(t,it)} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 18px",borderBottom:"1px solid rgba(42,42,42,0.5)",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><span style={{width:60,textAlign:"right",fontSize:11,fontWeight:600,color:over?"#e05a5a":"#888",flexShrink:0}}>{fmtDate(t.due)}</span><span style={{width:8,height:8,borderRadius:"50%",background:pColors[t.priority],flexShrink:0}} /><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{t.title}</div><div style={{fontSize:11,color:"#666",marginTop:1}}>{it?getClientName(t.client):"Interno"} · {TEAM[t.assignee]?.name}</div></div><SBadge s={t.status} />{over&&<span style={{fontSize:10,color:"#e05a5a",fontWeight:700}}>ATRASADO</span>}</div>;})} {all.length===0&&<div style={{textAlign:"center",padding:40,color:"#555"}}>📅 Nenhum prazo cadastrado</div>}</Sec>
    </div>;
  };

  const PagePrivateTickets=()=>{
    const items=db.privateTickets||[];
    return <div className="fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#f0ece4",flex:1}}>🔒 Tickets Privados</h2><span style={{fontSize:11,color:"#666",background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:20,padding:"4px 12px"}}>Visível só para você</span><Btn variant="primary" onClick={()=>openModal("privateTicket")}>+ Novo</Btn></div>
      <Sec title="">{items.length===0?<div style={{textAlign:"center",padding:48,color:"#555"}}>🔒 Nenhum ticket privado</div>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Título","Cliente","Prioridade","Status","Prazo",""].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#555",borderBottom:"1px solid #2a2a2a",fontWeight:500}}>{h}</th>)}</tr></thead><tbody>{items.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}><td style={{padding:"11px 16px",color:"#555",fontSize:12}}>#{String(t.id).padStart(3,"0")}</td><td style={{padding:"11px 16px",fontWeight:500}}>{t.title}</td><td style={{padding:"11px 16px"}}><Tag label={getClientName(t.client)} v="client" /></td><td style={{padding:"11px 16px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><PDot p={t.priority} />{t.priority.charAt(0).toUpperCase()+t.priority.slice(1)}</div></td><td style={{padding:"11px 16px"}}><SBadge s={t.status} /></td><td style={{padding:"11px 16px",fontSize:12,color:isOverdue(t.due,t.status)?"#e05a5a":"#666"}}>{fmtDate(t.due)}</td><td style={{padding:"11px 16px"}}><Btn onClick={()=>openModal("privateTicket",t)} style={{fontSize:11,padding:"4px 8px"}}>Editar</Btn></td></tr>)}</tbody></table>}</Sec>
    </div>;
  };

  const pages={overview:PageOverview,internal:PageInternal,clients:PageClients,tickets:PageTickets,sop:PageSOP,deadlines:PageDeadlines,privateTickets:PagePrivateTickets};
  const allowed=isAdmin?Object.keys(pages):["tickets","deadlines","clients"];
  const safePage=allowed.includes(page)?page:"tickets";
  const CurrentPage=pages[safePage]||PageOverview;

  // MODAL CONTENT
  const renderModal=()=>{
    if(!modal)return null;
    const {type,item}=modal;const isEdit=!!item;
    const QT=[{label:"Invoice",icon:"🧾"},{label:"Estimate",icon:"📋"},{label:"Contrato",icon:"📝"},{label:"Email/Msg",icon:"✉️"}];
    const hQP=(q)=>{const isA=form._quickType===q.label;const bare=(form.title||"").replace(/^(Invoice|Estimate|Contrato|Email\/Msg) — /,"");setForm(f=>({...f,_quickType:isA?null:q.label,title:isA?bare:`${q.label} — ${bare}`}));};

    if(type==="task"||type==="ticket"){const it=type==="ticket";const canEdit=isAdmin||it;return <>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{isEdit?"Editar":"Novo"} {it?"Ticket":"Tarefa Interna"}</h2>
      <div style={{marginBottom:15}}>
        <label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:8}}>Tipo</label>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>{QT.map(q=>{const a=form._quickType===q.label;return <button key={q.label} type="button" onClick={()=>hQP(q)} disabled={!canEdit} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 13px",borderRadius:20,cursor:!canEdit?"default":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12.5,fontWeight:500,transition:"all 0.15s",background:a?"rgba(200,169,110,0.15)":"#1f1f1f",border:`1px solid ${a?"#c8a96e":"#2a2a2a"}`,color:a?"#c8a96e":"#888"}}>{q.icon} {q.label}{a&&" ✓"}</button>;})}</div>
        <label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>{form._quickType?`Detalhes — ${form._quickType} *`:"Ou escreva o título *"}</label>
        <div style={{position:"relative",display:"flex",alignItems:"center"}}>{form._quickType&&<span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#c8a96e",fontWeight:600,pointerEvents:"none",whiteSpace:"nowrap"}}>{form._quickType}&nbsp;—&nbsp;</span>}<input style={{...iS,paddingLeft:form._quickType?`${(form._quickType.length+4)*8.2}px`:"12px"}} value={form._quickType?(form.title||"").replace(`${form._quickType} — `,""):(form.title||"")} onChange={e=>{const v=e.target.value;setForm(f=>({...f,title:f._quickType?`${f._quickType} — ${v}`:v}));}} placeholder={form._quickType?"Detalhes adicionais...":"Escreva o título..."} disabled={!canEdit} /></div>
      </div>
      {it&&<div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Cliente *</label><select style={iS} value={form.client??""} onChange={e=>setForm(f=>({...f,client:parseInt(e.target.value)}))} disabled={!canEdit}>{db.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Prioridade</label><select style={iS} value={form.priority||"media"} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} disabled={!canEdit}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></div>
        <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Status</label><select style={iS} value={form.status||"pendente"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} disabled={!canEdit}><option value="pendente">Pendente</option><option value="andamento">Em Andamento</option><option value="concluido">Concluído</option></select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Responsável</label><select style={iS} value={form.assignee??0} onChange={e=>setForm(f=>({...f,assignee:parseInt(e.target.value)}))} disabled={!canEdit}>{TEAM.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select></div>
        <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Prazo</label><input type="date" style={iS} value={form.due||""} onChange={e=>setForm(f=>({...f,due:e.target.value}))} disabled={!canEdit} /></div>
      </div>
      <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:70}} value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." disabled={!canEdit} /></div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:8}}>Anexos</label>
        <div style={{border:"1px dashed #2a2a2a",borderRadius:8,padding:14,textAlign:"center",marginBottom:8}}><input type="file" multiple id="fa" style={{display:"none"}} onChange={e=>{const files=Array.from(e.target.files);const rs=files.map(f=>new Promise(res=>{const r=new FileReader();r.onload=()=>res({name:f.name,size:f.size,type:f.type,data:r.result});r.readAsDataURL(f);}));Promise.all(rs).then(res=>setForm(f=>({...f,attachments:[...(f.attachments||[]),...res]})));e.target.value="";}} /><label htmlFor="fa" style={{cursor:"pointer",color:"#666",fontSize:12}}>📎 Clique para anexar arquivos</label></div>
        {(form.attachments||[]).length>0&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{(form.attachments||[]).map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#1f1f1f",border:"1px solid #2a2a2a",borderRadius:7,padding:"7px 12px"}}><span style={{fontSize:14}}>{f.type?.startsWith("image")?"🖼️":f.type?.includes("pdf")?"📄":"📎"}</span><a href={f.data} download={f.name} style={{flex:1,fontSize:12,color:"#5a9ae0",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</a><span style={{fontSize:11,color:"#555"}}>{(f.size/1024).toFixed(0)}kb</span><button onClick={()=>setForm(fm=>({...fm,attachments:fm.attachments.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>×</button></div>)}</div>}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>{isEdit&&canEdit&&<Btn variant="danger" onClick={()=>deleteItem(item.id,it?"ticket":"task")}>Excluir</Btn>}<Btn onClick={closeModal}>Cancelar</Btn>{canEdit&&<Btn variant="primary" onClick={it?saveTicket:saveTask}>Salvar</Btn>}</div>
    </>;}

    if(type==="client")return <>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>Novo Cliente</h2>
      <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Nome *</label><input style={iS} value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nome do cliente..." /></div>
      <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Tipo</label><select style={iS} value={form.type||"General Construction"} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{["General Construction","Demolition","Cleaning","Carpentry","Painting","Electrical","Plumbing","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn onClick={closeModal}>Cancelar</Btn><Btn variant="primary" onClick={saveClient}>Adicionar</Btn></div>
    </>;

    if(type==="privateTicket")return <>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:6}}>{isEdit?"Editar":"Novo"} Ticket Privado</h2>
      <p style={{fontSize:12,color:"#666",marginBottom:18}}>🔒 Visível apenas para você</p>
      <TitleField />
      <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Cliente *</label><select style={iS} value={form.client??db.clients[0]?.id} onChange={e=>setForm(f=>({...f,client:parseInt(e.target.value)}))}>{db.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Prioridade</label><select style={iS} value={form.priority||"media"} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></div>
        <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Status</label><select style={iS} value={form.status||"pendente"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option value="pendente">Pendente</option><option value="andamento">Em Andamento</option><option value="concluido">Concluído</option></select></div>
      </div>
      <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Prazo</label><input type="date" style={iS} value={form.due||""} onChange={e=>setForm(f=>({...f,due:e.target.value}))} /></div>
      <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:70}} value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." /></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{isEdit&&<Btn variant="danger" onClick={()=>deleteItem(item.id,"privateTicket")}>Excluir</Btn>}<Btn onClick={closeModal}>Cancelar</Btn><Btn variant="primary" onClick={savePrivateTicket}>Salvar</Btn></div>
    </>;

    if(type==="sop")return <>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{modal.extra?.clientId!==undefined?"Novo SOP do Cliente":"Novo SOP"}</h2>
      <div style={{marginBottom:15}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Título *</label><input style={iS} value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Nome do procedimento..." /></div>
      {modal.extra?.clientId===undefined&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Categoria</label><select style={iS} value={form.category||"ops"} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option value="ops">Operações</option><option value="client">Clientes</option><option value="fin">Financeiro</option><option value="rh">RH & Equipe</option></select></div>
        <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Ícone</label><input style={iS} value={form.icon||"📄"} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} placeholder="📄" /></div>
      </div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}><Btn onClick={closeModal}>Cancelar</Btn><Btn variant="primary" onClick={saveSOP}>Salvar SOP</Btn></div>
    </>;
    return null;
  };

  return <>
    <style>{CSS}</style>
    {/* SIDEBAR */}
    <div className="sidebar" style={{position:"fixed",left:0,top:0,bottom:0,width:240,background:"#171717",borderRight:"1px solid #2a2a2a",display:"flex",flexDirection:"column",zIndex:100}}>
      <div style={{padding:"22px 20px 18px",borderBottom:"1px solid #2a2a2a"}}><div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#c8a96e",lineHeight:1.1}}>Central<br/>de Demandas</div><div style={{fontSize:11,color:"#666",marginTop:3,letterSpacing:"0.05em",textTransform:"uppercase"}}>Be Magnus · Gestão</div></div>
      <nav style={{flex:1,padding:"12px 0",overflowY:"auto"}}>{sections.map(sec=><div key={sec.title} style={{marginBottom:4}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"#444",padding:"8px 20px 4px"}}>{sec.title}</div>{sec.items.map(nav=>{const active=page===nav.id;return <div key={nav.id} onClick={()=>{setPage(nav.id);setClientView(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 20px",cursor:"pointer",color:active?"#c8a96e":"#888",background:active?"rgba(200,169,110,0.07)":"transparent",borderLeft:`2px solid ${active?"#c8a96e":"transparent"}`,transition:"all 0.15s",fontSize:13.5}} onMouseEnter={e=>{if(!active){e.currentTarget.style.background="#1f1f1f";e.currentTarget.style.color="#f0ece4";}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#888";}}}><span style={{fontSize:15,width:18,textAlign:"center"}}>{nav.icon}</span><span style={{flex:1}}>{nav.label}</span>{nav.badge!==null&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:active?"rgba(200,169,110,0.15)":"#1f1f1f",border:`1px solid ${active?"rgba(200,169,110,0.3)":"#2a2a2a"}`,color:active?"#c8a96e":"#666"}}>{nav.badge}</span>}</div>;})}</div>)}</nav>
      <div style={{padding:"14px 16px",borderTop:"1px solid #2a2a2a",display:"flex",alignItems:"center",gap:10}}><Av idx={currentUser.id} size={30} /><div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name}</div><div style={{fontSize:10,color:"#666"}}>{isAdmin?"Administrador":"Funcionário"}</div></div><button onClick={handleLogout} title="Sair" style={{fontSize:13,padding:"4px 8px",borderRadius:8,border:"1px solid #2a2a2a",background:"transparent",color:"#555",cursor:"pointer"}}>⏻</button></div>
    </div>

    {/* MAIN */}
    <div className="main-content" style={{marginLeft:240,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div className="top-bar" style={{position:"sticky",top:0,zIndex:50,background:"rgba(15,15,15,0.92)",backdropFilter:"blur(10px)",borderBottom:"1px solid #2a2a2a",padding:"0 28px",height:56,display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#f0ece4",flex:1}}>{navItems.find(n=>n.id===page)?.label||"Dashboard"}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#171717",border:"1px solid #2a2a2a",borderRadius:8,padding:"7px 12px",width:220}}><span style={{color:"#555",fontSize:13}}>⌕</span><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Buscar..." style={{background:"none",border:"none",outline:"none",color:"#f0ece4",fontSize:13,width:"100%",fontFamily:"'DM Sans',sans-serif"}} /></div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:saving?"#c8a96e":"#3a3a3a",transition:"color 0.3s"}}><span style={{width:6,height:6,borderRadius:"50%",background:saving?"#c8a96e":"#2a5a2a",animation:saving?"pulse 1s infinite":"none"}} />{saving?"Salvando...":"Sincronizado"}</div>
      </div>
      <div className="page-content" style={{padding:28,flex:1}}><CurrentPage /></div>
    </div>

    {/* MOBILE BOTTOM NAV */}
    <div className="mobile-nav">
      {navItems.map(nav=>{const active=page===nav.id;return <div key={nav.id} className="mobile-nav-item" onClick={()=>{setPage(nav.id);setClientView(null);}} style={{color:active?"#c8a96e":"#555"}}><span className="mobile-nav-icon">{nav.icon}</span><span className="mobile-nav-label">{nav.label}</span></div>;})}
      <div className="mobile-nav-item" onClick={handleLogout} style={{color:"#555"}}><span className="mobile-nav-icon">⏻</span><span className="mobile-nav-label">Sair</span></div>
    </div>

    {/* FINANCIAL MODALS */}
    <Modal open={!!finModal} onClose={()=>setFinModal(null)}>
      {finModal?.type==="ap"&&<>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{finModal.item?"Editar Conta":"Nova Conta"} 📋</h2>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Vendor / Nome da Conta *</label><input style={iS} value={finForm.vendor||""} onChange={e=>setFinForm(f=>({...f,vendor:e.target.value}))} placeholder="Ex: Seguro, Internet, Aluguel..." /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Valor ($)</label><input style={iS} type="number" value={finForm.amount||""} onChange={e=>setFinForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Dia de Vencimento</label><input style={iS} type="number" min="1" max="31" value={finForm.dueDay||""} onChange={e=>setFinForm(f=>({...f,dueDay:e.target.value}))} placeholder="Ex: 15" /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Categoria</label><select style={iS} value={finForm.category||""} onChange={e=>setFinForm(f=>({...f,category:e.target.value}))}><option value="">Selecione...</option><option>Seguro</option><option>Salário</option><option>Aluguel</option><option>Serviços</option><option>Materiais</option><option>Impostos</option><option>Outro</option></select></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Status</label><select style={iS} value={finForm.status||"pendente"} onChange={e=>setFinForm(f=>({...f,status:e.target.value}))}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option></select></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><input type="checkbox" checked={!!finForm.recorrente} onChange={e=>setFinForm(f=>({...f,recorrente:e.target.checked}))} style={{width:16,height:16,accentColor:"#c8a96e"}} /><span style={{fontSize:13,color:"#f0ece4"}}>🔄 Conta Recorrente (repete todo mês)</span></label></div>
        <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={finForm.notes||""} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." /></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{finModal.item&&<Btn variant="danger" onClick={()=>{deleteFinItem(finModal.clientId,"ap",finModal.item.id);setFinModal(null);}}>Excluir</Btn>}<Btn onClick={()=>setFinModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={()=>saveFinItem(finModal.clientId,"ap")}>Salvar</Btn></div>
      </>}
      {finModal?.type==="recibo"&&<>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{finModal.item?"Editar Recibo":"Novo Recibo"} 🧾</h2>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Descrição *</label><input style={iS} value={finForm.description||""} onChange={e=>setFinForm(f=>({...f,description:e.target.value}))} placeholder="Ex: Compra de material, gasolina..." /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Valor ($) *</label><input style={iS} type="number" value={finForm.amount||""} onChange={e=>setFinForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Data</label><input type="date" style={iS} value={finForm.date||""} onChange={e=>setFinForm(f=>({...f,date:e.target.value}))} /></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Foto / PDF do Recibo</label><div style={{border:"1px dashed #2a2a2a",borderRadius:8,padding:14,textAlign:"center"}}><input type="file" id="rf" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>setFinForm(fm=>({...fm,file:{name:f.name,type:f.type,data:r.result}}));r.readAsDataURL(f);e.target.value="";}} /><label htmlFor="rf" style={{cursor:"pointer",color:"#666",fontSize:12}}>{finForm.file?<span style={{color:"#5a9ae0"}}>📎 {finForm.file.name}</span>:"📎 Clique para anexar foto ou PDF"}</label></div></div>
        <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={finForm.notes||""} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." /></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{finModal.item&&<Btn variant="danger" onClick={()=>{deleteFinItem(finModal.clientId,"recibos",finModal.item.id);setFinModal(null);}}>Excluir</Btn>}<Btn onClick={()=>setFinModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={()=>saveFinItem(finModal.clientId,"recibos")}>Salvar Recibo</Btn></div>
      </>}
      {finModal?.type==="statement"&&<>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>Bank Statement 🏦</h2>
        {finModal?.clientId!==undefined&&(()=>{
          const cl=db.clients.find(c=>c.id===finModal.clientId);
          const fin2=cl?.financeiro||{};
          const allAcc=[...(fin2.contas||[]).map(x=>({...x,kind:"conta"})),...(fin2.cartoes||[]).map(x=>({...x,kind:"cartao"}))];
          return allAcc.length>0?<div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Conta / Cartão</label><select style={iS} value={finForm.contaId||""} onChange={e=>setFinForm(f=>({...f,contaId:e.target.value}))}><option value="">Selecionar conta...</option>{allAcc.map(a=><option key={a.id} value={a.id}>{a.kind==="conta"?"🏦":"💳"} {a.name||a.store||a.issuer}</option>)}</select></div>:null;
        })()}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Mês de Referência</label><input type="month" style={iS} value={finForm.month||selMonth} onChange={e=>setFinForm(f=>({...f,month:e.target.value}))} /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Saldo do Mês ($)</label><input style={iS} value={finForm.balance||""} onChange={e=>setFinForm(f=>({...f,balance:e.target.value}))} placeholder="0.00" /></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>PDF do Extrato</label><div style={{border:"1px dashed #2a2a2a",borderRadius:8,padding:14,textAlign:"center"}}><input type="file" id="sf" accept=".pdf,image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>setFinForm(fm=>({...fm,file:{name:f.name,type:f.type,data:r.result}}));r.readAsDataURL(f);e.target.value="";}} /><label htmlFor="sf" style={{cursor:"pointer",color:"#666",fontSize:12}}>{finForm.file?<span style={{color:"#5a9ae0"}}>📄 {finForm.file.name}</span>:"📄 Clique para anexar PDF"}</label></div></div>
        <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><input type="checkbox" checked={!!finForm.reconciled} onChange={e=>setFinForm(f=>({...f,reconciled:e.target.checked}))} style={{width:16,height:16,accentColor:"#c8a96e"}} /><span style={{fontSize:13,color:"#f0ece4"}}>✓ Reconciliado</span></label></div>
        <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={finForm.notes||""} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." /></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{finModal.item&&<Btn variant="danger" onClick={()=>{deleteFinItem(finModal.clientId,"statements",finModal.item.id);setFinModal(null);}}>Excluir</Btn>}<Btn onClick={()=>setFinModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={()=>saveFinItem(finModal.clientId,"statements")}>Salvar</Btn></div>
      </>}
      {finModal?.type==="fechamento"&&<>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>Fechamento Mensal 📊</h2>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Mês</label><input type="month" style={iS} value={finForm.month||selMonth} onChange={e=>setFinForm(f=>({...f,month:e.target.value}))} /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Total Receitas ($)</label><input style={iS} type="number" value={finForm.receitas||""} onChange={e=>setFinForm(f=>({...f,receitas:e.target.value}))} placeholder="0.00" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Caixa Anterior ($)</label><input style={iS} type="number" value={finForm.caixa_anterior||""} onChange={e=>setFinForm(f=>({...f,caixa_anterior:e.target.value}))} placeholder="0.00" /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Salário Semanal ($) × 4</label><input style={iS} type="number" value={finForm.salario||""} onChange={e=>setFinForm(f=>({...f,salario:e.target.value}))} placeholder="Ex: 4000 (1000×4)" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Outras Saídas ($)</label><input style={iS} type="number" value={finForm.outras_saidas||""} onChange={e=>setFinForm(f=>({...f,outras_saidas:e.target.value}))} placeholder="0.00" /></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Retirada de Lucro ($)</label><input style={iS} type="number" value={finForm.retirada||""} onChange={e=>setFinForm(f=>({...f,retirada:e.target.value}))} placeholder="0.00" /></div>
        <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={finForm.notes||""} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} placeholder="Observações do fechamento..." /></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn onClick={()=>setFinModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={()=>saveFechamento(finModal.clientId)}>Salvar Fechamento</Btn></div>
      </>}
    </Modal>

    {/* CONTA / CARTÃO MODAL */}
    <Modal open={!!ccModal} onClose={()=>setCcModal(null)}>
      {ccModal?.type==="conta"&&<>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{ccModal.item?"Editar Conta":"Nova Conta Bancária"} 🏦</h2>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Nome da Conta *</label><input style={iS} value={ccForm.name||""} onChange={e=>setCcForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Conta Principal, Conta Payroll..." /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Banco</label><input style={iS} value={ccForm.bank||""} onChange={e=>setCcForm(f=>({...f,bank:e.target.value}))} placeholder="Ex: Chase, Wells Fargo, BofA..." /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Tipo</label><select style={iS} value={ccForm.type||"checking"} onChange={e=>setCcForm(f=>({...f,type:e.target.value}))}><option value="checking">Checking</option><option value="savings">Savings</option><option value="business">Business Checking</option></select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Account Number</label><input style={iS} value={ccForm.accountNumber||""} onChange={e=>setCcForm(f=>({...f,accountNumber:e.target.value}))} placeholder="••••••••••" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Routing Number</label><input style={iS} value={ccForm.routing||""} onChange={e=>setCcForm(f=>({...f,routing:e.target.value}))} placeholder="•••••••••" /></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Saldo Atual ($)</label><input style={iS} type="number" value={ccForm.balance||""} onChange={e=>setCcForm(f=>({...f,balance:e.target.value}))} placeholder="0.00" /></div>
        <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={ccForm.notes||""} onChange={e=>setCcForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." /></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{ccModal.item&&<Btn variant="danger" onClick={()=>{deleteCcItem(ccModal.clientId,"contas",ccModal.item.id);setCcModal(null);}}>Excluir</Btn>}<Btn onClick={()=>setCcModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={saveCcItem}>Salvar Conta</Btn></div>
      </>}
      {ccModal?.type==="cartao"&&<>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{ccModal.item?"Editar Cartão":"Novo Cartão"} 💳</h2>
        <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><input type="checkbox" checked={!!ccForm.storeCard} onChange={e=>setCcForm(f=>({...f,storeCard:e.target.checked}))} style={{width:16,height:16,accentColor:"#c8a96e"}} /><span style={{fontSize:13,color:"#f0ece4"}}>🏪 Cartão de Loja (store card — Home Depot, Lowe's, etc.)</span></label></div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Nome do Cartão *</label><input style={iS} value={ccForm.name||""} onChange={e=>setCcForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Home Depot Card, Chase Sapphire..." /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          {ccForm.storeCard?<div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Loja</label><input style={iS} value={ccForm.store||""} onChange={e=>setCcForm(f=>({...f,store:e.target.value}))} placeholder="Ex: Home Depot, Lowe's..." /></div>:<div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Bandeira</label><select style={iS} value={ccForm.issuer||""} onChange={e=>setCcForm(f=>({...f,issuer:e.target.value}))}><option value="">Selecionar...</option><option value="Visa">Visa</option><option value="Mastercard">Mastercard</option><option value="Amex">American Express</option><option value="Discover">Discover</option></select></div>}
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>4 Últimos Dígitos</label><input style={iS} maxLength={4} value={ccForm.lastFour||""} onChange={e=>setCcForm(f=>({...f,lastFour:e.target.value.replace(/[^0-9]/g,"")}))} placeholder="1234" /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Limite ($)</label><input style={iS} type="number" value={ccForm.limit||""} onChange={e=>setCcForm(f=>({...f,limit:e.target.value}))} placeholder="0.00" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Saldo Atual ($)</label><input style={iS} type="number" value={ccForm.balance||""} onChange={e=>setCcForm(f=>({...f,balance:e.target.value}))} placeholder="0.00" /></div>
          <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Dia de Vencimento</label><input style={iS} type="number" min="1" max="31" value={ccForm.dueDay||""} onChange={e=>setCcForm(f=>({...f,dueDay:e.target.value}))} placeholder="15" /></div>
        </div>
        <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={ccForm.notes||""} onChange={e=>setCcForm(f=>({...f,notes:e.target.value}))} placeholder="Observações..." /></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{ccModal.item&&<Btn variant="danger" onClick={()=>{deleteCcItem(ccModal.clientId,"cartoes",ccModal.item.id);setCcModal(null);}}>Excluir</Btn>}<Btn onClick={()=>setCcModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={saveCcItem}>Salvar Cartão</Btn></div>
      </>}
    </Modal>

    {/* ACCESS MODAL */}
    <Modal open={!!accessModal} onClose={()=>setAccessModal(null)}>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#f0ece4",marginBottom:20}}>{accessModal?.item?"Editar Acesso":"Novo Acesso"} 🔑</h2>
      <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Nome do Acesso *</label><input style={iS} value={accessForm.label||""} onChange={e=>setAccessForm(f=>({...f,label:e.target.value}))} placeholder="Ex: QuickBooks, Portal do Banco..." /></div>
      <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>URL / Site</label><input style={iS} value={accessForm.url||""} onChange={e=>setAccessForm(f=>({...f,url:e.target.value}))} placeholder="https://..." /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Usuário / Email</label><input style={iS} value={accessForm.username||""} onChange={e=>setAccessForm(f=>({...f,username:e.target.value}))} placeholder="usuario@email.com" /></div>
        <div><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Senha</label><div style={{position:"relative"}}><input type={showPw["modal"]?"text":"password"} style={{...iS,paddingRight:40}} value={accessForm.password||""} onChange={e=>setAccessForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" /><button onClick={()=>setShowPw(s=>({...s,modal:!s.modal}))} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:14}}>{showPw["modal"]?"🙈":"👁"}</button></div></div>
      </div>
      <div style={{marginBottom:20}}><label style={{display:"block",fontSize:11,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",marginBottom:6}}>Notas</label><textarea style={{...iS,resize:"vertical",minHeight:60}} value={accessForm.notes||""} onChange={e=>setAccessForm(f=>({...f,notes:e.target.value}))} placeholder="Informações adicionais..." /></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>{accessModal?.item&&<Btn variant="danger" onClick={()=>{deleteAccess(accessModal.clientId,accessModal.item.id);setAccessModal(null);}}>Excluir</Btn>}<Btn onClick={()=>setAccessModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={saveAccess}>Salvar</Btn></div>
    </Modal>

    {/* TASK MODAL */}
    <Modal open={!!modal} onClose={closeModal}>{renderModal()}</Modal>

    <Toast msg={toast.msg} visible={toast.visible} />
  </>;
}
