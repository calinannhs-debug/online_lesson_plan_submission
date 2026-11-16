(() => {
  const $ = id => document.getElementById(id);
  const form = $("assignmentForm");
  const today = new Date();
  const isoToday = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  $("assignmentDate").value = isoToday;
  let teachers = [];
  let assignments = [];
  let demo = !window.CNHS_CONFIG?.SCRIPT_URL;
  const endpoint = window.CNHS_CONFIG?.SCRIPT_URL || "";
  const localKey = "cnhs-substitution-demo-v1";

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const jsonp = (params) => new Promise((resolve,reject) => {
    const callback = "cnhs_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timer = setTimeout(() => { cleanup(); reject(new Error("Request timed out")); }, 15000);
    function cleanup(){clearTimeout(timer);delete window[callback];script.remove();}
    window[callback] = data => {cleanup();resolve(data);};
    script.onerror = () => {cleanup();reject(new Error("Could not reach Google Sheet. Check the Web App URL and deployment access."));};
    script.src = endpoint + "?" + new URLSearchParams({...params,callback}).toString();
    document.body.appendChild(script);
  });
  async function api(action,payload={}) {
    if (demo) return demoApi(action,payload);
    if (action === "bootstrap") return jsonp({action});
    // Apps Script accepts form-encoded POST. no-cors intentionally makes the
    // response unreadable; the app refreshes from the sheet after the write.
    await fetch(endpoint,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...payload})});
    await new Promise(r=>setTimeout(r,900));
    return {ok:true};
  }
  function demoApi(action,payload){
    const db=JSON.parse(localStorage.getItem(localKey)||'{"teachers":[],"assignments":[]}');
    if(action==="bootstrap") return Promise.resolve(db);
    if(action==="addTeacher") db.teachers.push({id:crypto.randomUUID(),name:payload.name,department:payload.department});
    if(action==="deleteTeacher") db.teachers=db.teachers.filter(t=>t.id!==payload.id);
    if(action==="addAssignment") db.assignments.unshift({...payload,id:crypto.randomUUID(),createdAt:new Date().toISOString()});
    if(action==="deleteAssignment") db.assignments=db.assignments.filter(a=>a.id!==payload.id);
    localStorage.setItem(localKey,JSON.stringify(db));return Promise.resolve({ok:true});
  }
  function setConnection(online,message){
    const el=$("connectionStatus");el.textContent=message;el.className="status-pill "+(online?"online":"offline");
  }
  async function load(){
    try{
      const data=await api("bootstrap");
      teachers=data.teachers||[];assignments=data.assignments||[];
      setConnection(true,demo?"Demo mode":"Google Sheet connected");
      render();
    }catch(err){setConnection(false,"Connection error");$("formMessage").textContent=err.message;}
  }
  function renderTeacherOptions(){
    const opts=teachers.map(t=>`<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join("");
    ["absentTeacher","substituteTeacher"].forEach(id=>$(id).innerHTML='<option value="">Select teacher</option>'+opts);
    $("teacherDirectory").innerHTML=teachers.length?teachers.map(t=>`<span class="teacher-chip">${escapeHtml(t.name)}${t.department?" · "+escapeHtml(t.department):""}<button type="button" data-delete-teacher="${escapeHtml(t.id)}" aria-label="Remove ${escapeHtml(t.name)}">×</button></span>`).join(""):'<span class="muted">No teachers added yet.</span>';
  }
  function render(){
    renderTeacherOptions();
    const dateFilter=$("filterDate").value, query=$("filterText").value.toLowerCase(), status=$("filterStatus").value;
    const filtered=assignments.filter(a=>(!dateFilter||a.date===dateFilter)&&(!status||a.status===status)&&(!query||[a.absentTeacher,a.substituteTeacher,a.section,a.subject,a.period,a.room].join(" ").toLowerCase().includes(query)));
    $("assignmentRows").innerHTML=filtered.length?filtered.map(a=>`<tr>
      <td>${escapeHtml(a.date)}</td><td>${escapeHtml(a.absentTeacher)}</td><td><strong>${escapeHtml(a.substituteTeacher)}</strong></td>
      <td>${escapeHtml(a.section)}</td><td>${escapeHtml(a.subject)}</td><td>${escapeHtml(a.period)}</td><td>${escapeHtml(a.room||"—")}</td>
      <td><span class="tag ${String(a.status||"").toLowerCase()}">${escapeHtml(a.status||"Assigned")}</span></td>
      <td class="no-print"><button class="small-action" data-delete-assignment="${escapeHtml(a.id)}">Delete</button></td></tr>`).join(""):'<tr><td colspan="9" class="empty-state">No substitution assignments match your filters.</td></tr>';
    $("teacherCount").textContent=teachers.length;
    $("todayCount").textContent=assignments.filter(a=>a.date===isoToday&&a.status!=="Cancelled").length;
    $("attentionCount").textContent=assignments.filter(a=>a.status==="Pending").length;
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());
    if(data.absentTeacher===data.substituteTeacher){$("formMessage").textContent="The absent teacher and substitute must be different.";return;}
    try{$("formMessage").textContent="Saving…";await api("addAssignment",data);form.reset();$("assignmentDate").value=isoToday;$("formMessage").textContent="Assignment saved.";await load();}
    catch(err){$("formMessage").textContent=err.message;}
  });
  $("teacherForm").addEventListener("submit",async e=>{
    e.preventDefault();const name=$("teacherName").value.trim(),department=$("teacherDepartment").value.trim();
    if(!name)return;if(teachers.some(t=>t.name.toLowerCase()===name.toLowerCase())){$("formMessage").textContent="That teacher is already in the directory.";return;}
    try{await api("addTeacher",{name,department});$("teacherName").value="";$("teacherDepartment").value="";await load();}
    catch(err){$("formMessage").textContent=err.message;}
  });
  document.addEventListener("click",async e=>{
    const teacher=e.target.closest("[data-delete-teacher]"), assignment=e.target.closest("[data-delete-assignment]");
    try{if(teacher&&confirm("Remove this teacher from the directory?")){await api("deleteTeacher",{id:teacher.dataset.deleteTeacher});await load();}
      if(assignment&&confirm("Delete this substitution assignment?")){await api("deleteAssignment",{id:assignment.dataset.deleteAssignment});await load();}}
    catch(err){$("formMessage").textContent=err.message;}
  });
  ["filterDate","filterText","filterStatus"].forEach(id=>$(id).addEventListener("input",render));
  $("refreshBtn").addEventListener("click",load);$("printBtn").addEventListener("click",()=>window.print());
  load();
})();