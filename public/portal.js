import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, getDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzu6PLIxa4Lye_FKGkT7ZHPvBSCs2ifQA",
    authDomain: "horarios-corrientes.firebaseapp.com",
    projectId: "horarios-corrientes",
    storageBucket: "horarios-corrientes.firebasestorage.app",
    messagingSenderId: "413601544478",
    appId: "1:413601544478:web:8cd5dd6129223cc527710f",
    measurementId: "G-W1TNHFM6PT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let empleados = [];
let encargados = [];
let solicitudes = [];
let muralPosts = [];
let empSeleccionadoHorarioSec = null;
let semanaAdminSecSeleccionada = 'sem1';
let semanaEmpleadoSeleccionada = 'sem1';
let usuarioSesion = null;
let claveAdminActual = "admin1234";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const diasSemanaUI = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const seccionesClaves = ['cambioHorarios', 'reforzar', 'vestimenta', 'lanzamientos'];

// Utilidades UI
window.toggleDarkMode = function() {
    const html = document.documentElement;
    const icon = document.getElementById('iconDarkMode');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if(icon) icon.className = "fa-solid fa-moon text-base";
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if(icon) icon.className = "fa-solid fa-sun text-base text-amber-400";
    }
};

if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    const icon = document.getElementById('iconDarkMode');
    if(icon) icon.className = "fa-solid fa-sun text-base text-amber-400";
}

window.mostrarToast = function(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    const bg = tipo === 'success' ? 'bg-emerald-600' : (tipo === 'error' ? 'bg-brand-red' : 'bg-blue-600');
    toast.className = `${bg} text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold pointer-events-auto flex items-center gap-2 transition-all transform translate-y-2 opacity-0`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${mensaje}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

window.abrirVisorImagen = src => { document.getElementById('imgVisorCompleta').src = src; document.getElementById('modalVisorImg').classList.remove('hidden'); };
window.cerrarVisorImagen = () => document.getElementById('modalVisorImg').classList.add('hidden');

window.mostrarTab = function(tab) {
    document.getElementById('authError').classList.add('hidden');
    if (tab === 'login') {
        document.getElementById('formLogin').classList.remove('hidden');
        document.getElementById('formRegister').classList.add('hidden');
        document.getElementById('tabBtnLogin').className = "w-1/2 py-2 border-b-2 border-brand-red text-brand-red font-bold";
        document.getElementById('tabBtnRegister').className = "w-1/2 py-2 text-gray-400 font-bold";
    } else {
        document.getElementById('formLogin').classList.add('hidden');
        document.getElementById('formRegister').classList.remove('hidden');
        document.getElementById('tabBtnRegister').className = "w-1/2 py-2 border-b-2 border-brand-red text-brand-red font-bold";
        document.getElementById('tabBtnLogin').className = "w-1/2 py-2 text-gray-400 font-bold";
    }
};

window.cambiarPestanaEmpleado = function(pestana) {
    ['mural', 'horarios', 'cambioHorarios', 'capacitacion', 'reforzar', 'vestimenta', 'lanzamientos'].forEach(p => {
        const vista = document.getElementById(`vistaEmp${p.charAt(0).toUpperCase() + p.slice(1)}`);
        const tab = document.getElementById(`tabEmp${p.charAt(0).toUpperCase() + p.slice(1)}`);
        if(p === pestana) {
            vista?.classList.remove('hidden');
            if(tab) tab.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-brand-red text-white whitespace-nowrap shadow-sm";
        } else {
            vista?.classList.add('hidden');
            if(tab) tab.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap";
        }
    });
};

// Autenticación
document.getElementById('formLogin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('authError');

    if (u === "admin@milanga.com" && p === claveAdminActual) {
        usuarioSesion = { rol: 'admin_principal', nombre: "Luciana" };
        document.getElementById('secAuth').classList.add('hidden');
        document.getElementById('secAdminPrincipal').classList.remove('hidden');
        document.getElementById('adminPrincipalNombreSesion').textContent = "Luciana";
        document.getElementById('widgetSammy').classList.remove('hidden');
        renderSupervisionGlobal();
        renderTareasDelegadas();
        mostrarToast("¡Bienvenida Luciana!");
        return;
    }

    const enc = encargados.find(x => x.user === u && x.pass === p && x.registrado);
    if (enc) {
        usuarioSesion = enc; 
        document.getElementById('widgetSammy').classList.remove('hidden');
        if(enc.rolSistema === 'segundo_admin') {
            usuarioSesion.rol = 'admin_secundario';
            document.getElementById('secAuth').classList.add('hidden');
            document.getElementById('secAdminSecundario').classList.remove('hidden');
            document.getElementById('adminSecNombreSesion').textContent = enc.nombre;
            prepararJornadaAdministrador(enc);
            renderMisTareas();
        } else {
            usuarioSesion.rol = 'empleado';
            document.getElementById('secAuth').classList.add('hidden');
            document.getElementById('secEmpleado').classList.remove('hidden');
            document.getElementById('empNombreSesion').textContent = enc.nombre;
            document.getElementById('txtRolPerfilEmp').textContent = "Encargado Operativo";
            renderHorariosExcel();
            renderMisTareas();
        }
        mostrarToast(`¡Hola ${enc.nombre}!`);
        return;
    }

    const emp = empleados.find(x => x.user === u && x.pass === p && x.registrado);
    if (emp) {
        usuarioSesion = emp; usuarioSesion.rol = 'empleado';
        document.getElementById('secAuth').classList.add('hidden');
        document.getElementById('secEmpleado').classList.remove('hidden');
        document.getElementById('widgetSammy').classList.remove('hidden');
        document.getElementById('empNombreSesion').textContent = emp.nombre;
        document.getElementById('txtRolPerfilEmp').textContent = "Portal del Empleado";
        if(emp.foto) {
            document.getElementById('empFotoImg').src = emp.foto;
            document.getElementById('empFotoImg').classList.remove('hidden');
            document.getElementById('empFotoDefault').classList.add('hidden');
        }
        renderHorariosExcel();
        renderMisTareas();
        mostrarToast(`¡Bienvenido/a ${emp.nombre}!`);
        return;
    }

    err.textContent = "Usuario o contraseña incorrectos.";
    err.classList.remove('hidden');
});

document.getElementById('formRegister')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('regSelectNomina').value;
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const file = document.getElementById('regFotoFile').files[0];
    let foto = "";
    if(file) {
        foto = await new Promise(r => { const reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(file); });
    }
    const col = encargados.some(x => x.id === id) ? "encargados" : "empleados";
    await updateDoc(doc(db, col, id), { user, pass, foto, registrado: true });
    mostrarToast("¡Registrado con éxito! Ya podés iniciar sesión.");
    mostrarTab('login');
});

// Panel Dueña
function mostrarPanelDuena(panel){
    if(!usuarioSesion || usuarioSesion.rol !== 'admin_principal') return;
    document.getElementById('secAdminPrincipal').classList.toggle('hidden', panel!=='principal');
    document.getElementById('secDelegacionTareas').classList.toggle('hidden', panel!=='tareas');
    document.getElementById('secGestionHorariosDuena').classList.toggle('hidden', panel!=='horarios');
    document.getElementById('secVistaPortales').classList.toggle('hidden', panel!=='portales');
    if(panel==='tareas'){ renderBloquesDelegacion(); renderTareasDelegadas(); }
    if(panel==='horarios'){ poblarSelectorHorariosDuena(); nuevoHorarioDuena(); }
}
window.mostrarPanelDuena=mostrarPanelDuena;

function opcionesDestinatarios(){
    const personas=[...encargados, ...empleados];
    return '<option value="">-- Elegí destinatario --</option>'+personas.map(p=>`<option value="${p.id}">${String(p.nombre).replace(/</g,'&lt;')} · ${p.rolSistema==='segundo_admin'?'Administrador':(p.rolSistema==='encargado'?'Encargado':'Empleado')}${p.registrado?'':' (Pendiente registro)'}</option>`).join('');
}

function renderBloquesDelegacion(){
    const cont=document.getElementById('bloquesDelegacion'); if(!cont)return;
    cont.innerHTML=Array.from({length:5},(_,i)=>`
        <div class="border rounded-2xl p-4 bg-gray-50 dark:bg-gray-900/30">
            <div class="flex justify-between items-center mb-3"><b class="text-xs">Bloque ${i+1}</b><span class="text-[10px] text-gray-400">Tarea libre</span></div>
            <textarea id="tareaDesc${i}" rows="3" placeholder="Escribí la tarea o función que quieras delegar..." class="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-xs dark:text-white"></textarea>
            <div class="grid sm:grid-cols-2 gap-2 mt-2">
                <select id="tareaDest${i}" class="p-3 rounded-xl border bg-white dark:bg-gray-800 text-xs dark:text-white">${opcionesDestinatarios()}</select>
                <input id="tareaFecha${i}" type="date" class="p-3 rounded-xl border bg-white dark:bg-gray-800 text-xs dark:text-white">
            </div>
            <div class="grid sm:grid-cols-2 gap-2 mt-2">
                <label class="p-3 rounded-xl border bg-white dark:bg-gray-800 text-xs font-bold cursor-pointer text-center hover:border-brand-red transition"><i class="fa-solid fa-camera text-brand-red"></i> Fotos<input id="tareaFotos${i}" type="file" accept="image/*" multiple class="hidden"></label>
                <label class="p-3 rounded-xl border bg-white dark:bg-gray-800 text-xs font-bold cursor-pointer text-center hover:border-brand-red transition"><i class="fa-solid fa-paperclip text-brand-red"></i> Archivos<input id="tareaArchivos${i}" type="file" multiple class="hidden"></label>
            </div>
            <div id="tareaArchivosNombres${i}" class="text-[10px] text-emerald-600 font-bold mt-2"></div>
            <button onclick="delegarTareaBloque(${i})" class="w-full mt-3 bg-brand-red hover:bg-brand-redHover text-white py-3 rounded-xl text-xs font-bold transition shadow-sm">🚀 Delegar tarea</button>
        </div>`).join('');
    for(let i=0;i<5;i++){
        ['tareaFotos','tareaArchivos'].forEach(pre=>{
            document.getElementById(pre+i)?.addEventListener('change',e=>{
                const files = [...e.target.files];
                document.getElementById('tareaArchivosNombres'+i).textContent = files.length > 0 ? `📎 ${files.map(f=>f.name).join(' · ')}` : '';
            });
        });
    }
}

window.delegarTareaBloque=async function(i){
    if(!usuarioSesion || usuarioSesion.rol!=='admin_principal') return;
    const descEl = document.getElementById('tareaDesc'+i);
    const destEl = document.getElementById('tareaDest'+i);
    const fechaEl = document.getElementById('tareaFecha'+i);
    const fotosInput = document.getElementById('tareaFotos'+i);
    const archivosInput = document.getElementById('tareaArchivos'+i);

    const descripcion = descEl?.value.trim();
    const destId = destEl?.value;
    const fecha = fechaEl?.value || '';

    if(!descripcion) return mostrarToast('Escribí la tarea antes de delegarla.','error');
    if(!destId) return mostrarToast('Elegí a quién delegarla.','error');

    const persona = [...encargados,...empleados].find(x=>x.id===destId);
    if(!persona) return mostrarToast('No encontré a esa persona.','error');

    mostrarToast('Subiendo tarea y adjuntos...', 'info');

    const allFiles = [...(fotosInput?.files || []), ...(archivosInput?.files || [])];
    const adjuntos = [];

    for (const f of allFiles) {
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(f);
            });
            adjuntos.push({
                nombre: f.name,
                tipo: f.type || 'image/jpeg',
                url: dataUrl
            });
        } catch(err) {
            console.warn('Error leyendo archivo:', f.name, err);
        }
    }

    try{
        await addDoc(collection(db,'tareas'),{
            asignadoAId: persona.id,
            asignadoANombre: persona.nombre,
            asignadoARol: persona.rolSistema || 'empleado',
            descripcion,
            fechaLimite: fecha,
            estado: 'Pendiente',
            creadoPorId: usuarioSesion.id || 'admin_principal',
            creadoPorNombre: usuarioSesion.nombre || 'Luciana',
            creadoEn: Date.now(),
            adjuntos
        });

        descEl.value = '';
        destEl.value = '';
        if(fechaEl) fechaEl.value = '';
        if(fotosInput) fotosInput.value = '';
        if(archivosInput) archivosInput.value = '';
        const nombresEl = document.getElementById('tareaArchivosNombres'+i);
        if(nombresEl) nombresEl.textContent = '';

        mostrarToast(`Tarea y ${adjuntos.length} foto(s)/adjunto(s) enviados a ${persona.nombre}.`,'success');
        renderTareasDelegadas();
    }catch(e){
        mostrarToast('No pude delegar la tarea: '+e.message,'error');
    }
};

function renderTareaHTML(t,duena=false){
    const adjuntos = Array.isArray(t.adjuntos) ? t.adjuntos : [];
    const fotos = adjuntos.filter(a => a.tipo?.startsWith('image/') || a.url?.startsWith('data:image'));
    const documentos = adjuntos.filter(a => !a.tipo?.startsWith('image/') && !a.url?.startsWith('data:image'));

    let fotosHtml = '';
    if (fotos.length > 0) {
        fotosHtml = `
            <div class="mt-2.5 space-y-1.5 border-t border-gray-100 dark:border-gray-700/60 pt-2">
                <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 block flex items-center gap-1">
                    <i class="fa-solid fa-camera text-brand-red"></i> Fotos adjuntas (${fotos.length}):
                </span>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    ${fotos.map(f => `
                        <div class="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-black/5" onclick="abrirVisorImagen('${f.url}')">
                            <img src="${f.url}" alt="${escaparHTMLSammy(f.nombre || 'Foto')}" class="w-full h-28 object-cover transition transform group-hover:scale-105">
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                <i class="fa-solid fa-magnifying-glass-plus"></i> Ver foto
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let docsHtml = '';
    if (documentos.length > 0) {
        docsHtml = `
            <div class="mt-2 flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-700/60 pt-2">
                ${documentos.map(d => `
                    <a href="${d.url}" download="${escaparHTMLSammy(d.nombre || 'archivo')}" class="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition">
                        <i class="fa-solid fa-file-arrow-down text-brand-red"></i> <span>${escaparHTMLSammy(d.nombre || 'Descargar archivo')}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    const esCompletada = t.estado === 'Completada';
    return `
        <div class="border rounded-2xl p-4 ${esCompletada ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm space-y-2'}">
            <div class="flex items-start justify-between gap-2">
                <div>
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${esCompletada ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}">
                        ${esCompletada ? '✓ Completada' : '⏳ Pendiente'}
                    </span>
                    <p class="text-xs font-bold text-gray-900 dark:text-white mt-1.5 whitespace-pre-wrap leading-relaxed">${escaparHTMLSammy(t.descripcion || '')}</p>
                </div>
            </div>

            <div class="text-[10px] text-gray-500 dark:text-gray-400 pt-1 flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 dark:border-gray-700/50">
                <span>👤 <b>Asignada a:</b> ${escaparHTMLSammy(t.asignadoANombre || '')}</span>
                ${t.fechaLimite ? `<span>📅 <b>Límite:</b> ${escaparHTMLSammy(t.fechaLimite)}</span>` : ''}
                <span>✍️ <b>Por:</b> ${escaparHTMLSammy(t.creadoPorNombre || 'Luciana')}</span>
            </div>

            ${fotosHtml}
            ${docsHtml}

            ${!duena && !esCompletada ? `
                <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button onclick="completarTareaPortal('${t.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
                        <i class="fa-solid fa-check"></i> Marcar como realizada
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

async function renderTareasDelegadas(){
    const el=document.getElementById('listaTareasDelegadas');if(!el)return;
    const snap=await getDocs(collection(db,'tareas'));const tareas=[];snap.forEach(d=>tareas.push({id:d.id,...d.data()}));
    el.innerHTML=tareas.sort((a,b)=>(b.creadoEn||0)-(a.creadoEn||0)).map(t=>renderTareaHTML(t,true)).join('')||'<p class="text-xs text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">Todavía no hay tareas delegadas.</p>';
}
window.renderTareasDelegadas=renderTareasDelegadas;

async function renderMisTareas(){
    const el=document.getElementById('listaMisTareas');
    const elAdminSec=document.getElementById('listaMisTareasAdminSec');
    if(!usuarioSesion)return;

    const snap=await getDocs(collection(db,'tareas'));
    const tareas=[];
    snap.forEach(d=>{
        const t={id:d.id,...d.data()};
        const coincideId = t.asignadoAId && (t.asignadoAId === usuarioSesion.id);
        const coincideNombre = t.asignadoANombre && usuarioSesion.nombre && 
            t.asignadoANombre.trim().toLowerCase() === usuarioSesion.nombre.trim().toLowerCase();
        if(coincideId || coincideNombre) tareas.push(t);
    });

    tareas.sort((a,b)=>(b.creadoEn||0)-(a.creadoEn||0));
    const html = tareas.length > 0 
        ? tareas.map(t=>renderTareaHTML(t,false)).join('')
        : '<p class="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">No tenés tareas pendientes asignadas.</p>';

    if(el) el.innerHTML = html;
    if(elAdminSec) elAdminSec.innerHTML = html;
}
window.renderMisTareas=renderMisTareas;

window.completarTareaPortal=async function(id){
    try{await updateDoc(doc(db,'tareas',id),{estado:'Completada',completadaEn:Date.now(),completadaPor:usuarioSesion?.nombre||''});renderMisTareas();mostrarToast('Tarea marcada como completada.','success');}catch(e){mostrarToast('No pude completar la tarea: '+e.message,'error');}
};

function poblarSelectorHorariosDuena(){
    const sel=document.getElementById('duenaHorarioEmpleado');if(!sel)return;
    sel.innerHTML='<option value="">-- Seleccioná una persona --</option>'+[...empleados,...encargados].filter(x=>x.registrado).map(x=>`<option value="${x.id}">${String(x.nombre).replace(/</g,'&lt;')}</option>`).join('');
}

function renderGridHorarioDuena(map){
    const el=document.getElementById('gridHorariosDuena');if(!el)return;
    el.innerHTML=diasSemanaUI.map(d=>`<label class="text-xs font-bold">${d}<input data-dia-horario="${d}" value="${String(map?.[d]||'Franco').replace(/"/g,'&quot;')}" placeholder="09:00 - 17:00" class="w-full mt-1 p-3 rounded-xl border bg-gray-50 dark:bg-gray-700 dark:text-white text-xs"></label>`).join('');
}

window.cargarHorarioDuena=async function(){
    const id=document.getElementById('duenaHorarioEmpleado').value;if(!id)return mostrarToast('Elegí una persona.','error');
    const semana=document.getElementById('duenaHorarioSemana').value,clave='horarios'+semana.charAt(0).toUpperCase()+semana.slice(1);
    const p=[...empleados,...encargados].find(x=>x.id===id);renderGridHorarioDuena(p?.[clave]||{});
};
window.nuevoHorarioDuena=function(){renderGridHorarioDuena(Object.fromEntries(diasSemanaUI.map(d=>[d,'Franco'])));};

window.guardarHorarioDuena=async function(){
    const id=document.getElementById('duenaHorarioEmpleado').value;if(!id)return mostrarToast('Elegí una persona.','error');
    const semana=document.getElementById('duenaHorarioSemana').value,clave='horarios'+semana.charAt(0).toUpperCase()+semana.slice(1),map={};
    document.querySelectorAll('[data-dia-horario]').forEach(x=>map[x.dataset.diaHorario]=x.value.trim()||'Franco');
    try{await updateDoc(doc(db, empleados.some(x=>x.id===id)?'empleados':'encargados',id),{[clave]:map});mostrarToast('Horario guardado y publicado.','success');}catch(e){mostrarToast('No pude guardar el horario: '+e.message,'error');}
};

// Supervisión global absoluta
window.renderSupervisionGlobal = function() {
    const el = document.getElementById('detalleJornadas');
    if(!el) return;
    el.innerHTML = `
        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
            <div class="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <i class="fa-solid fa-circle-check"></i> <span>Sistema operativo en línea</span>
            </div>
            <p class="text-[11px] text-emerald-700 dark:text-emerald-400">
                ${empleados.length} personas en nómina · ${encargados.length} administradores y encargados activos.
            </p>
        </div>
    `;
};

// Vista de portales por usuario para la Dueña
let vistaPortalRol = 'empleado';
let usuarioAntesDeVista = null;
let vistaPortalActiva = false;

function personasParaVistaPortal() {
    if(vistaPortalRol === 'admin') return encargados.filter(x => x.registrado && x.rolSistema === 'segundo_admin');
    if(vistaPortalRol === 'encargado') return encargados.filter(x => x.registrado && x.rolSistema !== 'segundo_admin');
    return empleados.filter(x => x.registrado);
}

window.mostrarPanelPortales = function() {
    if(!usuarioSesion || usuarioSesion.rol !== 'admin_principal') return;
    mostrarPanelDuena('portales');
    window.seleccionarRolVistaPortal(vistaPortalRol);
};

window.seleccionarRolVistaPortal = function(rol) {
    vistaPortalRol = rol;
    ['empleado', 'encargado', 'admin'].forEach(r => {
        const b = document.getElementById('portalRol' + r.charAt(0).toUpperCase() + r.slice(1));
        if(b) b.className = r === rol ? 'py-3 rounded-xl text-xs font-bold bg-brand-red text-white' : 'py-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
    });
    const personas = personasParaVistaPortal();
    const el = document.getElementById('listaPersonasVistaPortal');
    if(!el) return;
    if(!personas.length) {
        el.innerHTML = '<div class="col-span-full p-4 rounded-xl border bg-gray-50 dark:bg-gray-700/40 text-xs text-gray-500">No hay usuarios registrados de este tipo todavía.</div>';
        return;
    }
    el.innerHTML = personas.map(p => `
        <button type="button" onclick="abrirVistaPreviaPortal('${p.id}')" class="text-left p-4 rounded-xl border bg-gray-50 dark:bg-gray-700/40 hover:border-brand-red transition flex items-center justify-between gap-3">
            <span>
                <b class="block text-xs">${String(p.nombre || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</b>
                <span class="text-[10px] text-gray-500">${vistaPortalRol === 'admin' ? 'Administrativo' : vistaPortalRol === 'encargado' ? 'Encargado' : 'Empleado'}</span>
            </span>
            <i class="fa-solid fa-chevron-right text-brand-red"></i>
        </button>
    `).join('');
};

window.abrirVistaPreviaPortal = function(id) {
    if(!usuarioSesion || usuarioSesion.rol !== 'admin_principal') return;
    const lista = personasParaVistaPortal();
    const persona = lista.find(x => x.id === id);
    if(!persona) return mostrarToast('No encontré a esa persona.', 'error');

    usuarioAntesDeVista = usuarioSesion;
    vistaPortalActiva = true;
    usuarioSesion = { ...persona, rol: vistaPortalRol === 'admin' ? 'admin_secundario' : 'empleado', __vistaPrevia: true };

    document.getElementById('secAdminPrincipal')?.classList.add('hidden');
    document.getElementById('secDelegacionTareas')?.classList.add('hidden');
    document.getElementById('secGestionHorariosDuena')?.classList.add('hidden');
    document.getElementById('secVistaPortales')?.classList.add('hidden');
    document.getElementById('barraVistaPreviaPortal')?.classList.remove('hidden');
    const txtPreview = document.getElementById('textoVistaPreviaPortal');
    if(txtPreview) txtPreview.textContent = `${persona.nombre} · ${vistaPortalRol === 'admin' ? 'Administrativo' : vistaPortalRol === 'encargado' ? 'Encargado' : 'Empleado'}`;

    if(vistaPortalRol === 'admin') {
        document.getElementById('secAdminSecundario')?.classList.remove('hidden');
        const secNom = document.getElementById('adminSecNombreSesion');
        if(secNom) secNom.textContent = persona.nombre;
        document.getElementById('adminJornadaGate')?.classList.add('hidden');
        document.getElementById('adminSecContenido')?.classList.remove('hidden');
    } else {
        document.getElementById('secEmpleado')?.classList.remove('hidden');
        const empNom = document.getElementById('empNombreSesion');
        if(empNom) empNom.textContent = persona.nombre;
        const rolEl = document.getElementById('txtRolPerfilEmp');
        if(rolEl) rolEl.textContent = vistaPortalRol === 'encargado' ? 'Portal del Encargado' : 'Portal del Empleado';
        const img = document.getElementById('empFotoImg'), def = document.getElementById('empFotoDefault');
        if(persona.foto) { if(img) { img.src = persona.foto; img.classList.remove('hidden'); } def?.classList.add('hidden'); }
        else { img?.classList.add('hidden'); def?.classList.remove('hidden'); }
        window.cambiarPestanaEmpleado('horarios');
        renderHorariosExcel();
        renderMisTareas();
    }
};

window.salirVistaPreviaPortal = function() {
    if(!vistaPortalActiva) return;
    document.getElementById('secEmpleado')?.classList.add('hidden');
    document.getElementById('secAdminSecundario')?.classList.add('hidden');
    document.getElementById('barraVistaPreviaPortal')?.classList.add('hidden');
    usuarioSesion = usuarioAntesDeVista;
    usuarioAntesDeVista = null;
    vistaPortalActiva = false;
    document.getElementById('secAdminPrincipal')?.classList.remove('hidden');
    mostrarPanelDuena('principal');
};

// Operaciones auxiliares
window.eliminarRolSistema = async function(id) {
    if(!confirm("¿Eliminar este usuario?")) return;
    try { await deleteDoc(doc(db, "encargados", id)); mostrarToast("Usuario eliminado.", "error"); } catch(e){ alert(e.message); }
};

window.eliminarEmpleadoNomina = async function(id) {
    if(!confirm("¿Deseas dar de baja a este empleado?")) return;
    try { await deleteDoc(doc(db, "empleados", id)); mostrarToast("Empleado dado de baja.", "error"); } catch(e){ alert(e.message); }
};

window.guardarAvisoGlobal = async function() {
    const titulo = document.getElementById('inputTituloAvisoGlobal')?.value.trim() || "Aviso Importante";
    const texto = document.getElementById('inputTextoAvisoGlobal')?.value.trim();
    if(!texto) return mostrarToast("Escribí el texto del aviso.", "error");
    await setDoc(doc(db, "configuracion", "avisoGlobal"), { titulo, texto });
    mostrarToast("¡Cartel de aviso publicado en vivo!");
};

window.borrarAvisoGlobal = async function() {
    await setDoc(doc(db, "configuracion", "avisoGlobal"), { titulo: "", texto: "" });
    mostrarToast("Aviso retirado.", "info");
};

window.cambiarEstadoSolicitud = async function(id, nuevoEstado) {
    try {
        await updateDoc(doc(db, "solicitudes", id), { estado: nuevoEstado });
        mostrarToast(`Solicitud cambiada a: ${nuevoEstado}`);
    } catch(e) {
        alert("Error al actualizar estado: " + e.message);
    }
};

window.iniciarJornada = async function() {
    const enc = usuarioSesion;
    if(!enc) return;
    try {
        const ahora = new Date();
        await setDoc(doc(db, 'jornadas', enc.id), {
            nombre: enc.nombre,
            activa: true,
            inicio: Date.now(),
            inicioTexto: ahora.toLocaleString('es-AR'),
            actualizadoEn: Date.now()
        });
        document.getElementById('adminJornadaGate')?.classList.add('hidden');
        document.getElementById('adminSecContenido')?.classList.remove('hidden');
        const estado = document.getElementById('estadoJornadaAdmin');
        if(estado) estado.textContent = 'Jornada activa.';
        mostrarToast('¡Jornada iniciada con éxito!');
    } catch(e) {
        alert('No se pudo iniciar la jornada: ' + e.message);
    }
};

window.finalizarJornada = async function() {
    const enc = usuarioSesion;
    if(!enc?.id) return;
    try {
        await updateDoc(doc(db, 'jornadas', enc.id), {
            activa: false,
            fin: Date.now(),
            finTexto: new Date().toLocaleString('es-AR')
        });
    } catch(e) {}
    document.getElementById('adminSecContenido')?.classList.add('hidden');
    document.getElementById('adminJornadaGate')?.classList.remove('hidden');
    mostrarToast('Jornada finalizada.');
};

window.cambiarSemanaAdminSec = function(semana) {
    semanaAdminSecSeleccionada = semana;
    ['sem1', 'sem2', 'sem3', 'sem4'].forEach(s => {
        const num = s.replace('sem', '');
        const btn = document.getElementById(`btnAdminSecSem${num}`);
        if(btn) btn.className = s === semana ? "py-2 rounded-xl text-xs font-bold bg-brand-red text-white" : "py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600";
    });
    const empId = document.getElementById('selectEmpHorarioSec')?.value;
    if(empId) window.seleccionarEmpleadoHorariosSec(empId);
};

window.seleccionarEmpleadoHorariosSec = function(id) {
    empSeleccionadoHorarioSec = empleados.find(e => e.id === id);
    const grid = document.getElementById('gridHorariosAdminSec');
    if(!grid) return;
    grid.innerHTML = '';
    if(!empSeleccionadoHorarioSec) return;
    const claveSemana = `horarios${semanaAdminSecSeleccionada.charAt(0).toUpperCase() + semanaAdminSecSeleccionada.slice(1)}`;
    const mapa = empSeleccionadoHorarioSec[claveSemana] || {};

    diasSemana.forEach(dia => {
        grid.innerHTML += `<div class="bg-gray-50 dark:bg-gray-700 p-2 border rounded-xl space-y-1"><label class="block text-[11px] font-bold">${dia}:</label><input type="text" id="horarioSec_${dia}" value="${mapa[dia] || '09:00 - 17:00'}" class="w-full p-1.5 border rounded-lg text-xs bg-white dark:bg-gray-800 dark:text-white"></div>`;
    });
};

window.filtrarSolicitudesAdmin = function() {
    const input = document.getElementById('buscadorSolicitudes');
    const filtro = (input?.value || '').toLowerCase();
    const filtradas = solicitudes.filter(s => (s.nombre || '').toLowerCase().includes(filtro) || (s.motivo || '').toLowerCase().includes(filtro));
    renderizarTablaSolicitudes(filtradas);
};

window.cambiarSemanaEmpleado = function(sem) {
    semanaEmpleadoSeleccionada = sem;
    ['1','2','3','4'].forEach(n => {
        const b = document.getElementById(`btnEmpSem${n}`);
        if(b) b.className = `px-3 py-1.5 rounded-xl text-xs font-bold ${sem === 'sem' + n ? 'bg-brand-red text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`;
    });
    renderHorariosExcel();
};

window.descargarCapturaHorario = async function() {
    const cont = document.getElementById('contenedorGrillaEmpleado');
    if(!cont || typeof html2canvas === 'undefined') return mostrarToast('No se pudo generar la captura.', 'error');
    try {
        const canvas = await html2canvas(cont);
        const link = document.createElement('a');
        link.download = `Horarios_${usuarioSesion?.nombre || 'Empleado'}_${semanaEmpleadoSeleccionada}.png`;
        link.href = canvas.toDataURL();
        link.click();
        mostrarToast('Captura descargada con éxito.', 'success');
    } catch(e) {
        mostrarToast('Error al capturar: ' + e.message, 'error');
    }
};

// Monitor CPU y Banca
window.actualizarEstadoSistema = function() {
    const cpuRandom = Math.floor(Math.random() * (22 - 8 + 1)) + 8;
    const ramRandom = Math.floor(Math.random() * (210 - 165 + 1)) + 165;
    const latenciaRandom = Math.floor(Math.random() * (65 - 32 + 1)) + 32;

    const elCpu = document.getElementById('metricCpu');
    const elRam = document.getElementById('metricRam');
    const elLat = document.getElementById('metricLatency');
    if(elCpu) elCpu.textContent = cpuRandom + '%';
    if(elRam) elRam.textContent = ramRandom + ' MB';
    if(elLat) elLat.textContent = latenciaRandom + ' ms';
    mostrarToast("Métricas de rendimiento actualizadas.", "info");
};

window.registrarMovimientoBanca = async function() {
    const input = document.getElementById('inputMontoBanca');
    const select = document.getElementById('selectTipoMovimiento');
    const monto = parseFloat(input?.value);
    const tipo = select?.value || 'ingreso';

    if(!monto || isNaN(monto) || monto <= 0) return mostrarToast("Ingresá un monto válido.", "error");

    try {
        await addDoc(collection(db, "banca"), {
            monto,
            tipo,
            fecha: new Date().toLocaleString('es-AR'),
            creadoPor: usuarioSesion?.nombre || 'Luciana',
            creadoEn: Date.now()
        });
        if(input) input.value = "";
        mostrarToast("Movimiento de caja registrado con éxito.", "success");
    } catch(e) {
        mostrarToast("Error al registrar en banca: " + e.message, "error");
    }
};

// ==========================================
// ASISTENTE INTELIGENTE OPERATIVO SAMMY
// ==========================================
let sammyPendingProposal = null;
let sammyAttachedFile = null;
let sammyPreviousResponseId = null;
let sammyUltimoAdjuntoCargado = null;

window.toggleSammyChat = function(){
    document.getElementById('sammyVentana')?.classList.toggle('hidden');
};

function escaparHTMLSammy(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function sammyRol(){ return usuarioSesion?.rol || 'invitado'; }
function sammyOperador(){ return ['admin_principal','admin_secundario'].includes(sammyRol()); }
function sammyDuena(){ return sammyRol() === 'admin_principal'; }

window.seleccionarArchivoSammy = function(input) {
    sammyAttachedFile = input.files?.[0] || null;
    const b = document.getElementById('sammyAdjuntoNombre');
    const t = document.getElementById('sammyAdjuntoTexto');
    if(b && t) {
        if(sammyAttachedFile) {
            t.textContent = '📎 ' + sammyAttachedFile.name;
            b.classList.remove('hidden');
            mostrarToast(`Archivo adjunto: ${sammyAttachedFile.name}`, 'info');
        } else {
            b.classList.add('hidden');
        }
    }
};

window.removerAdjuntoSammy = function() {
    sammyAttachedFile = null;
    const input = document.getElementById('sammyFileInput');
    if(input) input.value = '';
    document.getElementById('sammyAdjuntoNombre')?.classList.add('hidden');
};

async function sammyLeerAdjunto() {
    if(!sammyAttachedFile) return null;
    try {
        // Leemos como base64 para que Gemini multimodal analice la imagen directamente
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(sammyAttachedFile);
        });

        return {
            nombre: sammyAttachedFile.name,
            mimeType: sammyAttachedFile.type || 'image/jpeg',
            data: base64Data
        };
    } catch(e) {
        console.warn('Error leyendo adjunto:', e);
        return null;
    }
}

// Ejecución de herramientas locales en Firebase
async function ejecutarHerramientaSammy(name, args) {
    const operador = sammyOperador();
    if(['crear_tarea','guardar_memoria','proponer_horarios','publicar_aviso','gestionar_solicitud','completar_tarea'].includes(name) && !operador) {
        return { ok: false, error: 'No tenés permisos para esa operación.' };
    }

    if(name === 'obtener_datos_portal') {
        return {
            ok: true,
            rol: sammyRol(),
            nombre: usuarioSesion?.nombre,
            empleados: empleados.length,
            administradores: encargados.length,
            solicitudes: solicitudes.length
        };
    }

    if(name === 'obtener_nomina') {
        return {
            ok: true,
            empleados: empleados.map(e => ({ id: e.id, nombre: e.nombre, registrado: e.registrado })),
            encargados: encargados.map(e => ({ id: e.id, nombre: e.nombre, registrado: e.registrado, rolSistema: e.rolSistema }))
        };
    }

    if(name === 'obtener_horarios') {
        const semana = args.semana || 'sem1';
        const clave = 'horarios' + semana.charAt(0).toUpperCase() + semana.slice(1);
        let lista = empleados;
        if(Array.isArray(args.nombres) && args.nombres.length) {
            lista = empleados.filter(e => args.nombres.some(n => e.nombre.toLowerCase().includes(String(n).toLowerCase())));
        }
        return {
            ok: true,
            semana,
            empleados: lista.map(e => ({ id: e.id, nombre: e.nombre, horarios: e[clave] || {} }))
        };
    }

    if(name === 'consultar_mis_horarios') {
        const semana = args.semana || 'sem1';
        const clave = 'horarios' + semana.charAt(0).toUpperCase() + semana.slice(1);
        const nombre = usuarioSesion?.nombre;
        const p = empleados.find(e => e.id === usuarioSesion?.id) || empleados.find(e => e.nombre === nombre) || encargados.find(e => e.nombre === nombre);
        return { ok: true, nombre, semana, horarios: p?.[clave] || {} };
    }

    if(name === 'obtener_memoria') {
        const d = await getDoc(doc(db, 'sammy_memoria', 'principal'));
        return { ok: true, memoria: d.exists() ? d.data() : {} };
    }

    if(name === 'guardar_memoria') {
        await setDoc(doc(db, 'sammy_memoria', 'principal'), {
            [String(args.clave)]: {
                valor: String(args.valor),
                categoria: args.categoria || 'negocio',
                actualizadoEn: Date.now(),
                actualizadoPor: usuarioSesion?.nombre || ''
            }
        }, { merge: true });
        return { ok: true, guardado: true };
    }

    if(name === 'proponer_horarios') {
        sammyPendingProposal = {
            semana: args.semana || 'sem1',
            motivo: args.motivo || '',
            horarios: args.horarios || {}
        };
        mostrarPropuestaSammy(sammyPendingProposal);
        return { ok: true, requiereConfirmacion: true };
    }

    if(name === 'crear_tarea') {
        const n = String(args.asignadoANombre || '').toLowerCase();
        const t = [...encargados, ...empleados].find(x => x.nombre.toLowerCase() === n) || [...encargados, ...empleados].find(x => x.nombre.toLowerCase().includes(n));
        if(!t) return { ok: false, error: 'No encontré esa persona en la nómina.' };

        const adjuntos = [];
        if (sammyUltimoAdjuntoCargado && sammyUltimoAdjuntoCargado.data) {
            adjuntos.push({
                nombre: sammyUltimoAdjuntoCargado.nombre || 'foto_tarea.jpg',
                tipo: sammyUltimoAdjuntoCargado.mimeType || 'image/jpeg',
                url: sammyUltimoAdjuntoCargado.data
            });
        }

        await addDoc(collection(db, 'tareas'), {
            asignadoAId: t.id,
            asignadoANombre: t.nombre,
            asignadoARol: t.rolSistema || 'empleado',
            descripcion: String(args.descripcion || ''),
            fechaLimite: String(args.fechaLimite || ''),
            estado: 'Pendiente',
            creadoPorId: usuarioSesion?.id || 'admin_principal',
            creadoPorNombre: usuarioSesion?.nombre || 'Luciana',
            creadoEn: Date.now(),
            adjuntos
        });

        renderTareasDelegadas();
        renderMisTareas();
        return { ok: true, creada: true, asignadoA: t.nombre, fotosAdjuntas: adjuntos.length };
    }

    if(name === 'listar_tareas') {
        const s = await getDocs(collection(db, 'tareas'));
        let a = [];
        s.forEach(d => a.push({ id: d.id, ...d.data() }));
        if(!sammyDuena()) {
            a = a.filter(t => t.asignadoAId === usuarioSesion?.id || t.asignadoANombre === usuarioSesion?.nombre);
        }
        return { ok: true, tareas: a };
    }

    if(name === 'completar_tarea') {
        const id = String(args.tareaId || '');
        const d = await getDoc(doc(db, 'tareas', id));
        if(!d.exists()) return { ok: false, error: 'Tarea inexistente.' };
        const t = d.data();
        if(!sammyDuena() && t.asignadoAId !== usuarioSesion?.id) return { ok: false, error: 'No tenés permiso.' };
        await updateDoc(doc(db, 'tareas', id), {
            estado: 'Completada',
            completadaEn: Date.now(),
            completadaPor: usuarioSesion?.nombre || ''
        });
        return { ok: true };
    }

    if(name === 'publicar_aviso') {
        await setDoc(doc(db, 'configuracion', 'avisoGlobal'), {
            titulo: String(args.titulo || 'Aviso importante'),
            texto: String(args.texto || ''),
            actualizadoEn: Date.now(),
            actualizadoPor: usuarioSesion?.nombre || ''
        });
        return { ok: true };
    }

    if(name === 'gestionar_solicitud') {
        await updateDoc(doc(db, 'solicitudes', String(args.solicitudId)), {
            estado: args.estado,
            gestionadoEn: Date.now(),
            gestionadoPor: usuarioSesion?.nombre || ''
        });
        return { ok: true, estado: args.estado };
    }

    return { ok: false, error: 'Herramienta no implementada.' };
}

function mostrarPropuestaSammy(p) {
    const chat = document.getElementById('sammyChatMensajes');
    if(!chat) return;
    const filas = Object.entries(p.horarios || {}).map(([n, h]) => `
        <div class="border-t pt-2">
            <b>${escaparHTMLSammy(n)}</b>
            <div class="mt-1 flex flex-wrap gap-1">
                ${diasSemana.map(d => `<span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">${escaparHTMLSammy(d.slice(0,3))}: ${escaparHTMLSammy(h?.[d] || 'Franco')}</span>`).join('')}
            </div>
        </div>
    `).join('');

    chat.innerHTML += `
        <div class="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-300 dark:border-amber-700 space-y-2">
            <b class="text-amber-900 dark:text-amber-200">📋 Propuesta de horarios</b>
            <p class="text-[10px] text-amber-800 dark:text-amber-300">${escaparHTMLSammy(p.motivo || 'Modificación propuesta por Sammy')}</p>
            <div class="max-h-48 overflow-y-auto space-y-1">${filas}</div>
            <div class="flex gap-2 pt-2">
                <button onclick="confirmarPropuestaSammy()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition">Confirmar</button>
                <button onclick="cancelarPropuestaSammy()" class="flex-1 bg-gray-200 dark:bg-gray-700 font-bold py-2 rounded-xl text-xs transition">Cancelar</button>
            </div>
        </div>
    `;
    chat.scrollTop = chat.scrollHeight;
}

window.confirmarPropuestaSammy = async function() {
    if(!sammyPendingProposal || !sammyOperador()) return;
    const p = sammyPendingProposal;
    const clave = 'horarios' + p.semana.charAt(0).toUpperCase() + p.semana.slice(1);
    let count = 0;
    try {
        for(const [n, h] of Object.entries(p.horarios || {})) {
            const e = empleados.find(x => x.nombre.toLowerCase() === n.toLowerCase()) || empleados.find(x => x.nombre.toLowerCase().includes(n.toLowerCase()));
            if(!e) continue;
            await updateDoc(doc(db, 'empleados', e.id), { [clave]: h });
            count++;
        }
        sammyPendingProposal = null;
        mostrarToast(`¡Listo! Se guardaron ${count} horarios en ${p.semana}.`, 'success');
    } catch(e) {
        mostrarToast('Error al guardar horarios: ' + e.message, 'error');
    }
};

window.cancelarPropuestaSammy = function() {
    sammyPendingProposal = null;
    mostrarToast('Propuesta cancelada sin cambios.', 'info');
};

async function sammyCall(payload) {
    const contexto = {
        nombreUsuario: usuarioSesion?.nombre || 'Usuario',
        usuarioId: usuarioSesion?.id || '',
        rol: sammyRol(),
        puedeOperar: sammyOperador(),
        puedeModificarTodo: sammyDuena(),
        empleadosActivos: empleados.length,
        administradores: encargados.length
    };
    const r = await fetch('/api/sammy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, contexto })
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error || 'Error al comunicarse con Sammy');
    return d;
}

window.enviarMensajeSammy = async function(textoForzado = null) {
    const input = document.getElementById('sammyInput');
    const texto = String(textoForzado || input.value || '').trim();
    if(!texto && !sammyAttachedFile) return;

    if(sammyPendingProposal && /^(confirmar|confirmo|sí|si|dale|ok|hacerlo)$/i.test(texto)) {
        if(!textoForzado) input.value = '';
        await confirmarPropuestaSammy();
        return;
    }
    if(sammyPendingProposal && /^(no|cancelar|no confirmar)$/i.test(texto)) {
        if(!textoForzado) input.value = '';
        cancelarPropuestaSammy();
        return;
    }

    const chat = document.getElementById('sammyChatMensajes');
    const userBubble = document.createElement('div');
    userBubble.className = "bg-brand-mint/30 dark:bg-brand-mint/20 p-2.5 rounded-2xl border ml-auto max-w-[90%] text-right";
    userBubble.innerHTML = `<b>${escaparHTMLSammy(usuarioSesion?.nombre || 'Vos')}</b><p class="mt-0.5">${escaparHTMLSammy(texto)}</p>${sammyAttachedFile ? `<span class="inline-block mt-1 text-[10px] bg-white/60 dark:bg-gray-800 px-2 py-0.5 rounded font-bold">📎 ${escaparHTMLSammy(sammyAttachedFile.name)}</span>` : ''}`;
    chat.appendChild(userBubble);

    if(!textoForzado) input.value = '';

    const idTyping = 'typing_' + Date.now();
    const typingBubble = document.createElement('div');
    typingBubble.id = idTyping;
    typingBubble.className = "bg-white dark:bg-gray-800 p-2.5 rounded-2xl border max-w-[90%] text-gray-400 italic flex items-center gap-2";
    typingBubble.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-brand-red"></i> <span>Sammy está pensando...</span>`;
    chat.appendChild(typingBubble);
    chat.scrollTop = chat.scrollHeight;

    try {
        const adj = await sammyLeerAdjunto();
        sammyUltimoAdjuntoCargado = adj;
        const archivosPayload = adj ? [adj] : [];
        window.removerAdjuntoSammy();

        let d = await sammyCall({
            mensaje: texto,
            archivos: archivosPayload,
            previousResponseId: sammyPreviousResponseId,
            toolOutputs: []
        });

        // Bucle de resolución de herramientas
        while(d.toolCalls?.length) {
            const outputs = [];
            for(const c of d.toolCalls) {
                let a = {};
                try { a = typeof c.arguments === 'string' ? JSON.parse(c.arguments) : c.arguments; } catch(e) {}
                outputs.push({
                    type: 'function_call_output',
                    call_id: c.call_id,
                    name: c.name,
                    output: JSON.stringify(await ejecutarHerramientaSammy(c.name, a))
                });
            }
            d = await sammyCall({
                mensaje: '',
                archivos: [],
                previousResponseId: d.responseId,
                toolOutputs: outputs
            });
        }

        sammyPreviousResponseId = d.responseId;
        document.getElementById(idTyping)?.remove();

        const respuestaFinal = d.respuesta || d.text || 'Listo.';
        const sammyBubble = document.createElement('div');
        sammyBubble.className = "bg-white dark:bg-gray-800 p-3 rounded-2xl border max-w-[92%] shadow-sm space-y-1.5";
        sammyBubble.innerHTML = `
            <div class="flex items-center justify-between">
                <p class="font-bold text-brand-red flex items-center gap-1.5">Sammy 🤖</p>
                <button onclick="hablarTextoSammy(this)" data-texto="${encodeURIComponent(respuestaFinal)}" class="text-gray-400 hover:text-brand-red p-1" title="Escuchar en voz alta">
                    <i class="fa-solid fa-volume-high"></i>
                </button>
            </div>
            <p class="leading-relaxed whitespace-pre-wrap">${escaparHTMLSammy(respuestaFinal)}</p>
        `;
        chat.appendChild(sammyBubble);
        chat.scrollTop = chat.scrollHeight;
    } catch(e) {
        document.getElementById(idTyping)?.remove();
        const errBubble = document.createElement('div');
        errBubble.className = "bg-red-50 dark:bg-red-950/40 p-3 rounded-2xl border border-red-200 dark:border-red-900 text-brand-red text-xs";
        errBubble.innerHTML = `<b>Sammy:</b> ${escaparHTMLSammy(e.message || 'No pude procesar tu mensaje.')}`;
        chat.appendChild(errBubble);
    }
};

// Reconocimiento de voz (Micrófono)
window.activarMicrofonoSammy = function() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return mostrarToast('Tu navegador no soporta reconocimiento de voz.', 'error');

    const recognition = new SR();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const icon = document.getElementById('iconMicSammy');
    if(icon) icon.className = "fa-solid fa-microphone-lines text-brand-red animate-pulse";
    mostrarToast('🎙️ Te escucho...', 'info');

    recognition.start();

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        const input = document.getElementById('sammyInput');
        if(input) input.value = transcript;
        if(icon) icon.className = "fa-solid fa-microphone";
        window.enviarMensajeSammy(transcript);
    };

    recognition.onerror = () => {
        if(icon) icon.className = "fa-solid fa-microphone";
        mostrarToast('No pude captar bien tu voz, probá de nuevo.', 'error');
    };

    recognition.onend = () => {
        if(icon) icon.className = "fa-solid fa-microphone";
    };
};

// Síntesis de voz (Hablar en voz alta)
window.hablarTextoSammy = function(btn) {
    const texto = decodeURIComponent(btn.getAttribute('data-texto') || '');
    if(!('speechSynthesis' in window)) return mostrarToast('Síntesis de voz no disponible.', 'error');

    window.speechSynthesis.cancel();
    const cleanText = texto.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-AR';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
};

window.cerrarSesion = () => location.reload();

// Inicialización de escuchadores en tiempo real
function iniciarEscuchadores() {
    onSnapshot(collection(db, "empleados"), snap => {
        empleados = [];
        snap.forEach(d => empleados.push({ id: d.id, ...d.data() }));
        const selH = document.getElementById('selectEmpHorarioSec');
        if(selH) {
            const valActual = selH.value;
            selH.innerHTML = '<option value="">-- Seleccionar empleado --</option>';
            empleados.forEach(e => selH.innerHTML += `<option value="${e.id}">${e.nombre}</option>`);
            selH.value = valActual;
        }
        const tbodyNomina = document.getElementById('tablaNominaAdminSec');
        if(tbodyNomina) {
            tbodyNomina.innerHTML = "";
            empleados.forEach(e => {
                const estadoHtml = e.registrado ? '<span class="text-emerald-600 font-bold">Activo</span>' : '<span class="text-amber-600 font-bold">Pendiente</span>';
                tbodyNomina.innerHTML += `
                    <tr class="border-t">
                        <td class="p-2 font-semibold">${e.nombre}</td>
                        <td class="p-2">${estadoHtml}</td>
                        <td class="p-2 text-right"><button onclick="eliminarEmpleadoNomina('${e.id}')" class="text-brand-red font-bold text-[10px]">Baja</button></td>
                    </tr>`;
            });
        }
        if(usuarioSesion && usuarioSesion.rol === 'empleado') renderHorariosExcel();
    });

    onSnapshot(collection(db, "encargados"), snap => {
        encargados = [];
        snap.forEach(d => encargados.push({ id: d.id, ...d.data() }));
        const selectReg = document.getElementById('regSelectNomina');
        if(selectReg) {
            selectReg.innerHTML = '<option value="">-- Seleccioná tu nombre --</option>';
            encargados.filter(e => !e.registrado).forEach(e => selectReg.innerHTML += `<option value="${e.id}">${e.nombre} (${e.rolSistema === 'segundo_admin' ? 'Segundo Admin' : 'Encargado'})</option>`);
            empleados.filter(e => !e.registrado).forEach(e => selectReg.innerHTML += `<option value="${e.id}">${e.nombre} (Empleado)</option>`);
        }
        const tbody = document.getElementById('listaRolesAdminPrincipal');
        if(tbody) {
            tbody.innerHTML = "";
            encargados.forEach(e => {
                const rolTexto = e.rolSistema === 'segundo_admin' ? '<span class="text-brand-red font-bold">Segundo Admin</span>' : '<span class="text-emerald-600 font-bold">Encargado</span>';
                tbody.innerHTML += `<tr class="border-t"><td class="p-2">${e.nombre}</td><td class="p-2">${rolTexto}</td><td class="p-2">${e.registrado ? 'Activo' : 'Pendiente'}</td><td class="p-2 text-right"><button onclick="eliminarRolSistema('${e.id}')" class="text-brand-red font-bold text-[10px]">Borrar</button></td></tr>`;
            });
        }
    });

    onSnapshot(collection(db, "solicitudes"), snap => {
        solicitudes = [];
        snap.forEach(d => solicitudes.push({ id: d.id, ...d.data() }));
        renderizarTablaSolicitudes(solicitudes);
    });

    onSnapshot(collection(db, "banca"), snap => {
        const tbody = document.getElementById('tablaBancaAdmin');
        if(!tbody) return;
        let lista = [];
        snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
        lista.sort((a,b) => b.creadoEn - a.creadoEn);
        if(!lista.length) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-2 text-gray-400 text-center">Sin movimientos registrados hoy.</td></tr>`;
            return;
        }
        tbody.innerHTML = lista.slice(0, 10).map(m => `
            <tr class="border-t">
                <td class="p-2 text-gray-500">${m.fecha}</td>
                <td class="p-2 font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-brand-red'}">${m.tipo.toUpperCase()}</td>
                <td class="p-2 text-right font-black">$${m.monto.toLocaleString('es-AR')}</td>
            </tr>
        `).join('');
    });

    onSnapshot(collection(db, "mural"), snap => {
        muralPosts = [];
        snap.forEach(d => muralPosts.push({ id: d.id, ...d.data() }));
        muralPosts.sort((a,b) => b.creadoEn - a.creadoEn);
        renderMuralFeed();
    });

    onSnapshot(collection(db, "tareas"), () => {
        renderTareasDelegadas();
        renderMisTareas();
    });
}

function renderMuralFeed() {
    const feed = document.getElementById('feedMuralEmp');
    if(!feed) return;
    feed.innerHTML = muralPosts.map(p => `
        <div class="bg-gray-50 dark:bg-gray-700/40 rounded-2xl border p-3.5 space-y-2">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs">${p.autorNombre?.charAt(0) || 'U'}</div>
                <h4 class="font-bold text-xs">${p.autorNombre}</h4>
            </div>
            <p class="text-xs">${p.texto}</p>
            ${p.foto ? `<img src="${p.foto}" class="w-full h-40 object-cover rounded-xl cursor-pointer" onclick="abrirVisorImagen('${p.foto}')">` : ''}
        </div>
    `).join('') || '<p class="text-xs text-gray-400">Sin publicaciones en el mural todavía.</p>';
}

function renderizarTablaSolicitudes(lista) {
    const tbody = document.getElementById('listaSolicitudesAdminSec');
    if(!tbody) return;
    tbody.innerHTML = lista.map(s => `
        <tr class="border-t">
            <td class="p-2 font-semibold">${s.nombre}</td>
            <td class="p-2">${s.fecha}</td>
            <td class="p-2 text-gray-500">${s.motivo}</td>
            <td class="p-2 font-bold">${s.estado || 'Pendiente'}</td>
            <td class="p-2 text-right space-x-1">
                <button onclick="cambiarEstadoSolicitud('${s.id}', 'Aprobada')" class="bg-emerald-600 text-white p-1.5 rounded-lg text-[10px]"><i class="fa-solid fa-check"></i></button>
                <button onclick="cambiarEstadoSolicitud('${s.id}', 'Rechazada')" class="bg-brand-red text-white p-1.5 rounded-lg text-[10px]"><i class="fa-solid fa-xmark"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderHorariosExcel() {
    if(!usuarioSesion || usuarioSesion.rol !== 'empleado') return;
    const reg = empleados.find(e => e.id === usuarioSesion.id) || encargados.find(e => e.id === usuarioSesion.id) || usuarioSesion;
    const clave = `horarios${semanaEmpleadoSeleccionada.charAt(0).toUpperCase() + semanaEmpleadoSeleccionada.slice(1)}`;
    const map = reg[clave] || {};
    let html = "<tr>";
    diasSemana.forEach(d => {
        const h = map[d] || 'Franco';
        const esFranco = h.toLowerCase().includes('franco');
        html += `<td class="p-3 border-r ${esFranco ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 font-bold' : ''}">${h}</td>`;
    });
    html += "</tr>";
    const tbody = document.getElementById('tablaHorariosExcel');
    if(tbody) tbody.innerHTML = html;
}

iniciarEscuchadores();
