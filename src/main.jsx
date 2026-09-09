import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {supabase} from "./supabase";
import "./styles.css";

const demoWeek = {
  id:"demo-week-1", number:1, status:"open", deadline:"",
  matchQuestions:Array.from({length:10},(_,i)=>({id:`m${i}`,text:`Domanda partita ${i+1}`,options:["A","B","C","D"],correct:""})),
  playerQuestions:Array.from({length:10},(_,i)=>({id:`p${i}`,text:`Domanda giocatore ${i+1}`,options:["A","B","C","D"],correct:""})),
  rigoriCells:12,multiplierBase:1,multiplierStep:.0375
};

function localGet(key,fallback){
  try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}
}
function localSet(key,val){localStorage.setItem(key,JSON.stringify(val))}
function uid(){return crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}

async function dbUsers(){
  if(!supabase) return localGet("fl_users",[
    {username:"admin",password:"admin123",role:"admin",name:"Organizzatore"},
    {username:"giocatore1",password:"start1",role:"participant",name:"Giocatore 1"}
  ]);
  const {data,error}=await supabase.from("users").select("*").order("username");
  if(error) throw error;
  return data;
}
async function saveUsers(users){
  if(!supabase){localSet("fl_users",users);return}
  const {error}=await supabase.from("users").upsert(users,{onConflict:"username"});
  if(error) throw error;
}
async function dbWeeks(){
  if(!supabase) return localGet("fl_weeks",[demoWeek]);
  const {data,error}=await supabase.from("weeks").select("*").order("number",{ascending:false});
  if(error) throw error;
  return data?.length?data:[demoWeek];
}
async function saveWeek(week){
  if(!supabase){const all=localGet("fl_weeks",[]).filter(w=>w.id!==week.id);localSet("fl_weeks",[...all,week]);return}
  const {error}=await supabase.from("weeks").upsert(week);
  if(error) throw error;
}
async function dbAttempts(weekId){
  if(!supabase)return localGet(`fl_attempts_${weekId}`,[]);
  const {data,error}=await supabase.from("attempts").select("*").eq("week_id",weekId);
  if(error) throw error;
  return data||[];
}
async function saveAttempt(a){
  if(!supabase){const all=localGet(`fl_attempts_${a.week_id}`,[]).filter(x=>x.username!==a.username);localSet(`fl_attempts_${a.week_id}`,[...all,a]);return}
  const {error}=await supabase.from("attempts").upsert(a,{onConflict:"week_id,username"});
  if(error) throw error;
}

function scoreQuiz(week,answers){
  const qs=[...week.matchQuestions,...week.playerQuestions];
  let correct=0;
  qs.forEach((q,i)=>{if(q.correct && answers[i]===q.correct)correct++});
  return {correct,baseScore:correct*10};
}

function Login({users,onLogin}){
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState("");
  const go=e=>{e.preventDefault();const x=users.find(a=>a.username===u.trim()&&a.password===p);if(!x)setErr("Credenziali non valide");else onLogin(x)};
  return <main className="login"><div className="loginCard"><div className="logo">🍀 FANTALUCK</div><p className="tag">LA SFIDA SETTIMANALE</p>
    <form onSubmit={go}><input placeholder="Username" value={u} onChange={e=>setU(e.target.value)}/><input placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)}/><button>ENTRA</button></form>
    {err&&<div className="error">{err}</div>}
  </div></main>
}

function Nav({setPage,page,user,onLogout}){
 return <nav><button className={page==="home"?"active":""} onClick={()=>setPage("home")}>⌂<span>Home</span></button>
 <button className={page==="quiz"?"active":""} onClick={()=>setPage("quiz")}>⚽<span>Gioca</span></button>
 <button className={page==="rank"?"active":""} onClick={()=>setPage("rank")}>🏆<span>Classifica</span></button>
 {user.role==="admin"&&<button className={page==="admin"?"active":""} onClick={()=>setPage("admin")}>⚙<span>Admin</span></button>}
 <button onClick={onLogout}>↪<span>Esci</span></button></nav>
}

function Home({week,user,setPage}){
 return <div className="wrap"><section className="hero"><div className="badge">🍀 FANTALUCK</div><h1>La sfida<br/><em>settimanale.</em></h1><p>Conosci il calcio. Indovina. Segna.</p><button onClick={()=>setPage("quiz")}>GIOCA ORA →</button></section>
 <div className="grid2"><div className="card"><small>SETTIMANA</small><strong>#{week?.number??"-"}</strong><span>{week?.status==="open"?"APERta".toUpperCase():"NON DISPONIBILE"}</span></div>
 <div className="card"><small>IL TUO PROFILO</small><strong>{user.name}</strong><span>@{user.username}</span></div></div>
 </div>
}

function Quiz({week,user,onDone}){
 const qs=useMemo(()=>[...(week?.matchQuestions||[]),...(week?.playerQuestions||[])],[week]);
 const [i,setI]=useState(0),[answers,setAnswers]=useState({}),[msg,setMsg]=useState("");
 if(!week||week.status!=="open")return <div className="empty">Nessuna settimana aperta al momento.</div>;
 const q=qs[i];
 const choose=v=>{setAnswers({...answers,[i]:v});setMsg("")};
 const next=()=>{if(answers[i]==null){setMsg("Scegli una risposta.");return} if(i===qs.length-1){onDone(answers);return}setI(i+1)};
 return <div className="wrap"><div className="progress">DOMANDA {i+1} / {qs.length}<div><i style={{width:`${((i+1)/qs.length)*100}%`}}/></div></div>
 <div className="quizCard"><div className="qtype">{i<10?"PARTITA":"GIOCATORE"}</div><h2>{q?.text||"Domanda non ancora inserita"}</h2>
 <div className="answers">{(q?.options||["A","B","C","D"]).map((x,k)=><button className={answers[i]===x?"selected":""} key={k} onClick={()=>choose(x)}>{String.fromCharCode(65+k)} <span>{x}</span></button>)}</div>
 {msg&&<div className="error">{msg}</div>}<button className="next" onClick={next}>{i===qs.length-1?"VAI AI RIGORI":"AVANTI →"}</button></div></div>
}

function Rigori({week,onDone}){
 const n=week.rigoriCells||12; const [shot,setShot]=useState(0); const [mult,setMult]=useState(week.multiplierBase||1); const [goals,setGoals]=useState(0); const [history,setHistory]=useState([]);
 const shoot=cell=>{const isGoal=Math.random()<Math.max(.25,.62-(Math.floor(shot/2)*.045));const nm=+(mult+(isGoal?(week.multiplierStep||.0375):0)).toFixed(4);setShot(x=>x+1);setGoals(g=>g+(isGoal?1:0));setMult(nm);setHistory(h=>[...h,{cell,goal:isGoal,mult:nm}]); if(shot>=9){onDone({goals:goals+(isGoal?1:0),multiplier:nm,history:[...history,{cell,goal:isGoal,mult:nm}]})}};
 return <div className="wrap"><div className="penalty"><div className="keeper">🥅<span>PORTA</span></div><h1>RIGORI</h1><p>Ogni gol aumenta il moltiplicatore.</p><div className="goalGrid">{Array.from({length:n},(_,x)=><button key={x} onClick={()=>shoot(x)} className={history.find(h=>h.cell===x)?"used":""}>{history.find(h=>h.cell===x)?.goal?"⚽":"·"}</button>)}</div>
 <div className="mult"><small>MOLTIPLICATORE</small><strong>x{mult.toFixed(4)}</strong><span>Rigore #{shot+1}</span></div></div></div>
}

function Rank({attempts}){
 const rows=[...attempts].sort((a,b)=>b.final_score-a.final_score);
 return <div className="wrap"><div className="title"><small>FANTALUCK</small><h1>Classifica</h1></div><div className="table">{rows.map((a,i)=><div className="row" key={a.username}><b>{i+1}</b><span>{a.name||a.username}</span><strong>{a.final_score}</strong></div>)}{!rows.length&&<div className="empty">La classifica sarà disponibile dopo le prime partite.</div>}</div></div>
}

function Admin({users,weeks,setUsers,setWeeks}){
 const [tab,setTab]=useState("users"); const [form,setForm]=useState({username:"",password:"",name:""});
 const add=async e=>{e.preventDefault();if(!form.username||!form.password)return;const u={...form,role:"participant"};const next=[...users,u];await saveUsers(next);setUsers(next);setForm({username:"",password:"",name:""})};
 const remove=async username=>{const next=users.filter(u=>u.username!==username);await saveUsers(next);setUsers(next)};
 const close=async w=>{const x={...w,status:w.status==="open"?"closed":"open"};await saveWeek(x);setWeeks(weeks.map(a=>a.id===x.id?x:a))};
 return <div className="wrap"><div className="title"><small>CONTROL ROOM</small><h1>Admin</h1></div><div className="tabs"><button className={tab==="users"?"on":""} onClick={()=>setTab("users")}>Utenti</button><button className={tab==="weeks"?"on":""} onClick={()=>setTab("weeks")}>Settimane</button></div>
 {tab==="users"&&<><form className="adminForm" onSubmit={add}><input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/><input placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button>AGGIUNGI</button></form><div className="table">{users.map(u=><div className="row" key={u.username}><span><b>{u.name}</b><small>@{u.username} · {u.role}</small></span>{u.role!=="admin"&&<button className="danger" onClick={()=>remove(u.username)}>ELIMINA</button>}</div>)}</div></>}
 {tab==="weeks"&&<div className="table">{weeks.map(w=><div className="row" key={w.id}><span><b>Settimana #{w.number}</b><small>{w.status}</small></span><button onClick={()=>close(w)}>{w.status==="open"?"CHIUDI":"APRI"}</button></div>)}</div>}
 </div>
}

function App(){
 const [loading,setLoading]=useState(true),[users,setUsers]=useState([]),[weeks,setWeeks]=useState([]),[user,setUser]=useState(()=>localGet("fl_session",null)),[page,setPage]=useState("home"),[attempts,setAttempts]=useState([]);
 useEffect(()=>{(async()=>{try{const [u,w]=await Promise.all([dbUsers(),dbWeeks()]);setUsers(u);setWeeks(w)}catch(e){console.error(e)}finally{setLoading(false)}})()},[]);
 const week=weeks.find(w=>w.status==="open")||weeks[0];
 useEffect(()=>{if(week)dbAttempts(week.id).then(setAttempts).catch(console.error)},[week?.id]);
 const finishQuiz=answers=>{setPage("rigori");window.__answers=answers};
 const finishRigori=async r=>{const s=scoreQuiz(week,window.__answers||{});const a={id:uid(),week_id:week.id,username:user.username,name:user.name,base_score:s.baseScore,correct_answers:s.correct,goals:r.goals,multiplier:r.multiplier,final_score:Math.round(s.baseScore*r.multiplier),created_at:new Date().toISOString()};await saveAttempt(a);setAttempts(await dbAttempts(week.id));setPage("rank")};
 if(loading)return <div className="loading">🍀</div>;
 if(!user)return <Login users={users} onLogin={x=>{setUser(x);localSet("fl_session",x)}}/>;
 return <><header><div className="brand">🍀 FANTALUCK</div><span>{user.name}</span></header>
 {page==="home"&&<Home week={week} user={user} setPage={setPage}/>}
 {page==="quiz"&&<Quiz week={week} user={user} onDone={finishQuiz}/>}
 {page==="rigori"&&<Rigori week={week} onDone={finishRigori}/>}
 {page==="rank"&&<Rank attempts={attempts}/>}
 {page==="admin"&&user.role==="admin"&&<Admin users={users} weeks={weeks} setUsers={setUsers} setWeeks={setWeeks}/>}
 <Nav page={page} setPage={setPage} user={user} onLogout={()=>{localStorage.removeItem("fl_session");setUser(null)}}/>
 </>;
}
createRoot(document.getElementById("root")).render(<App/>);
