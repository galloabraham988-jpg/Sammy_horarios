/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Code, 
  Check, 
  Copy, 
  Wrench, 
  Database, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Bell, 
  BookOpen, 
  RefreshCw, 
  Zap, 
  ArrowRight, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  FileText, 
  Radio
} from 'lucide-react';

import { 
  INITIAL_EMPLEADOS, 
  INITIAL_HORARIOS, 
  INITIAL_TAREAS, 
  INITIAL_AVISOS, 
  INITIAL_MEMORIA, 
  INITIAL_SOLICITUDES,
  executeMockTool
} from './mockPortal.ts';

import { 
  SAMPLE_FACTURA_POLLO, 
  SAMPLE_PIZARRON_HORARIOS, 
  SAMPLE_BROMATOLOGIA 
} from './sampleImages.ts';

import { SAMMY_V2_COMMONJS_CODE } from './exports/sammy-export-code.ts';

interface AttachedFile {
  nombre: string;
  mimeType: string;
  data: string; // base64 o data URL
  previewUrl?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'sammy' | 'tool';
  text: string;
  timestamp: string;
  attachedFiles?: AttachedFile[];
  toolCalls?: Array<{ name: string; args: any }>;
  toolResults?: Array<{ name: string; output: any }>;
  rawDebug?: any;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'improvements' | 'portal'>('chat');

  // Perfiles de usuario según la jerarquía escalable de Milanga & Co.
  const userProfiles = [
    {
      id: 'owner',
      nombreUsuario: 'Luciana',
      usuarioId: 'admin_principal',
      rol: 'dueña',
      rolSistema: 'dueña',
      rolNombre: 'Dueña',
      nivelJerarquico: 100,
      puedeOperar: true,
      puedeModificarTodo: true,
      badge: 'Dueña (Nivel 100)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      id: 'admin_gen',
      nombreUsuario: 'Abraham Gallo',
      usuarioId: 'emp_1',
      rol: 'admin_secundario',
      rolSistema: 'segundo_admin',
      rolNombre: 'Administrador General',
      nivelJerarquico: 90,
      puedeOperar: true,
      puedeModificarTodo: true,
      badge: 'Admin General (Nivel 90)',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      id: 'dir_op',
      nombreUsuario: 'Laura Benítez',
      usuarioId: 'emp_2',
      rol: 'admin_secundario',
      rolSistema: 'director_operativo',
      rolNombre: 'Director/a Operativo/a',
      nivelJerarquico: 80,
      puedeOperar: true,
      puedeModificarTodo: true,
      badge: 'Dirección Operativa (80)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'supervisor',
      nombreUsuario: 'Martín Cabrera',
      usuarioId: 'emp_3',
      rol: 'supervisor',
      rolSistema: 'supervisor',
      rolNombre: 'Supervisor de Turno',
      nivelJerarquico: 60,
      puedeOperar: true,
      puedeModificarTodo: false,
      badge: 'Supervisor (Nivel 60)',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    {
      id: 'encargado',
      nombreUsuario: 'Juan Pérez',
      usuarioId: 'emp_4',
      rol: 'encargado',
      rolSistema: 'encargado',
      rolNombre: 'Encargado de Cocina',
      nivelJerarquico: 50,
      puedeOperar: true,
      puedeModificarTodo: false,
      badge: 'Encargado (Nivel 50)',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      id: 'lider',
      nombreUsuario: 'Valentina Díaz',
      usuarioId: 'emp_5',
      rol: 'lider_turno',
      rolSistema: 'lider_turno',
      rolNombre: 'Líder de Turno',
      nivelJerarquico: 40,
      puedeOperar: true,
      puedeModificarTodo: false,
      badge: 'Líder de Turno (Nivel 40)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 'cook',
      nombreUsuario: 'Nico Rossi',
      usuarioId: 'emp_6',
      rol: 'empleado',
      rolSistema: 'empleado',
      rolNombre: 'Ayudante de Cocina',
      nivelJerarquico: 10,
      puedeOperar: false,
      puedeModificarTodo: false,
      badge: 'Empleado (Nivel 10)',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

  const [selectedProfile, setSelectedProfile] = useState(userProfiles[0]);

  // Estado del Portal simulado de Milanga & Co.
  const [dbState, setDbState] = useState({
    empleados: INITIAL_EMPLEADOS,
    horarios: INITIAL_HORARIOS,
    tareas: INITIAL_TAREAS,
    avisos: INITIAL_AVISOS,
    memoria: INITIAL_MEMORIA,
    solicitudes: INITIAL_SOLICITUDES
  });

  // Estado de la conversación
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'sammy',
      text: '¡Qué hacés Abraham! Acá estoy lista para darte una mano en Milanga & Co. Ahora podés hablarme por voz usando el micrófono, mandarme fotos de facturas, comandas o pizarras de cocina, o consultarme sobre el local.',
      timestamp: 'Ahora'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState<string | undefined>(undefined);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Archivos adjuntos en borrador
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Voz y Audio
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, attachedFiles]);

  // Inicializar Web Speech Recognition si está disponible en el navegador
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-AR';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue(prev => transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Función para reproducir la voz de Sammy (instantánea, natural en español y sin consumir cuota de API)
  const speakText = async (text: string) => {
    // Si ya está reproduciendo, lo cancelamos
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);
    fallbackWebSpeech(text);
  };

  const fallbackWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-AR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Buscamos voz en español
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es-AR') || v.lang.includes('es-419') || v.lang.includes('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta entrada de voz directa. Podés usar Chrome, Edge o Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  // Manejo de carga de archivos (desde el dispositivo del usuario)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        setAttachedFiles(prev => [
          ...prev,
          {
            nombre: file.name,
            mimeType: file.type || 'image/jpeg',
            data: base64Data,
            previewUrl: file.type.startsWith('image/') ? base64Data : undefined
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addSampleFile = (sample: typeof SAMPLE_FACTURA_POLLO) => {
    setAttachedFiles(prev => [
      ...prev,
      {
        nombre: sample.nombre,
        mimeType: sample.mimeType,
        data: sample.data,
        previewUrl: sample.data
      }
    ]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Envío del mensaje y archivos adjuntos
  const handleSendMessage = async (textToSend?: string, filesToSend?: AttachedFile[]) => {
    const text = (textToSend !== undefined ? textToSend : inputValue).trim();
    const files = filesToSend || attachedFiles;

    if ((!text && files.length === 0) || isLoading) return;

    setInputValue('');
    setAttachedFiles([]);

    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || 'Analizá este archivo adjunto:',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFiles: files.length > 0 ? [...files] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const contextoPayload = {
        nombreUsuario: selectedProfile.nombreUsuario,
        usuarioId: selectedProfile.usuarioId,
        rol: selectedProfile.rol,
        rolSistema: selectedProfile.rolSistema,
        rolNombre: selectedProfile.rolNombre,
        nivelJerarquico: selectedProfile.nivelJerarquico,
        puedeOperar: selectedProfile.puedeOperar,
        puedeModificarTodo: selectedProfile.puedeModificarTodo,
        empleadosActivos: dbState.empleados.filter(e => e.activo).length,
        administradores: dbState.empleados.filter(e => e.rol !== 'empleado').length
      };

      // Turno 1: enviar mensaje + archivos a Sammy
      const res = await fetch('/api/sammy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: text,
          archivos: files.map(f => ({
            nombre: f.nombre,
            mimeType: f.mimeType,
            data: f.data
          })),
          contexto: contextoPayload,
          previousResponseId: previousResponseId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al comunicarse con Sammy');
      }

      let currentResponseId = data.responseId;
      setPreviousResponseId(currentResponseId);

      // Si Sammy llamó a herramientas, las ejecutamos en el portal simulado
      if (Array.isArray(data.toolCalls) && data.toolCalls.length > 0) {
        const toolCallsInfo = data.toolCalls.map((tc: any) => {
          let parsedArgs = {};
          try { parsedArgs = JSON.parse(tc.arguments); } catch {}
          return { name: tc.name, args: parsedArgs };
        });

        const toolOutputs = toolCallsInfo.map((tc: { name: string; args: any }) => {
          const run = executeMockTool(tc.name, tc.args, contextoPayload, dbState, setDbState);
          return {
            name: tc.name,
            output: run.resultado || { error: run.error }
          };
        });

        setMessages(prev => [
          ...prev,
          {
            id: `tool_${Date.now()}`,
            sender: 'tool',
            text: `Sammy ejecutó ${toolCallsInfo.map((t: { name: string; args: any }) => `${t.name}()`).join(', ')} en el portal.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            toolCalls: toolCallsInfo,
            toolResults: toolOutputs
          }
        ]);

        // Turno 2: Enviamos los toolOutputs de vuelta a Sammy
        const followUpRes = await fetch('/api/sammy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contexto: contextoPayload,
            previousResponseId: currentResponseId,
            toolOutputs: toolOutputs
          })
        });

        const followUpData = await followUpRes.json();
        if (!followUpRes.ok || !followUpData.ok) {
          throw new Error(followUpData.error || 'Error procesando respuesta de herramientas');
        }

        setPreviousResponseId(followUpData.responseId);

        const finalText = followUpData.text || 'Listo, acá tenés la información actualizada.';
        setMessages(prev => [
          ...prev,
          {
            id: `sammy_${Date.now()}`,
            sender: 'sammy',
            text: finalText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawDebug: followUpData
          }
        ]);

        if (autoVoice) {
          speakText(finalText);
        }
      } else {
        // Respuesta directa de texto
        const finalText = data.text || 'Acá estoy.';
        setMessages(prev => [
          ...prev,
          {
            id: `sammy_${Date.now()}`,
            sender: 'sammy',
            text: finalText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawDebug: data
          }
        ]);

        if (autoVoice) {
          speakText(finalText);
        }
      }
    } catch (err: any) {
      console.error(err);
      let humanMsg = `Che, hubo un problema al procesar la consulta: ${err.message || 'Error de conexión'}.`;
      if (err.message?.includes("503") || err.message?.includes("UNAVAILABLE")) {
        humanMsg = "Che, los servidores de IA están con un pico de alta demanda momentáneo (503). Esperá unos segunditos y dale de nuevo al botón de enviar.";
      } else if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        humanMsg = "Che, alcanzamos el límite de consultas por minuto de la cuota de prueba. Esperá un momento y volvé a probar.";
      }
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'sammy',
          text: humanMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SAMMY_V2_COMMONJS_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleResetChat = () => {
    setPreviousResponseId(undefined);
    setAttachedFiles([]);
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'sammy',
        text: `¡Qué hacés ${selectedProfile.nombreUsuario.split(' ')[0]}! Acá estoy lista. Mandame fotos, notas de voz o consultame sobre el local.`,
        timestamp: 'Ahora'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Bot className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">MILANGA & CO.</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded">MULTIMODAL V2</span>
              </div>
              <p className="text-xs text-slate-400">Voz en Vivo + Análisis de Fotos & Facturas</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Simulador Multimodal
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Código con Fotos & Voz
            </button>
            <button
              onClick={() => setActiveTab('improvements')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'improvements'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Mejoras & Diagnóstico
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'portal'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Datos del Local
            </button>
            <a
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-red-500/20"
              title="Abrir la plataforma completa de Portal RR.HH. en una pestaña nueva"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Portal RR.HH. ↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col">
        {/* ======================= TAB: CHAT MULTIMODAL EN VIVO ======================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-6.5rem)]">
            {/* Columna Izquierda: Configuración, Fotos de Muestra y Roles */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Selector de Rol */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Usuario del Portal
                  </label>
                  <div className="space-y-2">
                    {userProfiles.map(p => {
                      const isSel = selectedProfile.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProfile(p);
                            setPreviousResponseId(undefined);
                            setMessages([
                              {
                                id: `welcome_${Date.now()}`,
                                sender: 'sammy',
                                text: `¡Qué hacés ${p.nombreUsuario.split(' ')[0]}! Has ingresado como ${p.rolNombre}. Mandame fotos, notas de voz o consultame sobre el local.`,
                                timestamp: 'Ahora'
                              }
                            ]);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                            isSel
                              ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/30'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-semibold text-slate-200">{p.nombreUsuario}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{p.rolNombre}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.badgeColor}`}>
                              {p.badge}
                            </span>
                            <span className="text-[10px] text-slate-500">Nivel {p.nivelJerarquico}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Controles de Voz en Vivo */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      Voz de Sammy en Vivo
                    </span>
                    <button
                      onClick={() => setAutoVoice(!autoVoice)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                        autoVoice 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {autoVoice ? 'Auto-Hablar: ON' : 'Auto-Hablar: OFF'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Al activar Auto-Hablar, Sammy lee sus respuestas en voz alta con acento rioplatense.
                  </p>
                  {isSpeaking && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 animate-pulse">
                      <Radio className="w-3.5 h-3.5 animate-spin" />
                      <span>Sammy está hablando en voz alta...</span>
                    </div>
                  )}
                </div>

                {/* Fotos de Muestra para Probar en 1 Click */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Probar con Fotos de Ejemplo
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => addSampleFile(SAMPLE_FACTURA_POLLO)}
                      className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors flex items-center gap-2 group"
                    >
                      <span className="text-base">🧾</span>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 group-hover:text-amber-400">Factura de Carnicería</div>
                        <div className="text-[10px] text-slate-500">80kg pechugas + 40kg nalga</div>
                      </div>
                    </button>

                    <button
                      onClick={() => addSampleFile(SAMPLE_PIZARRON_HORARIOS)}
                      className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors flex items-center gap-2 group"
                    >
                      <span className="text-base">📋</span>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 group-hover:text-amber-400">Pizarrón de Cocina</div>
                        <div className="text-[10px] text-slate-500">Relevo jueves + 200 milas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => addSampleFile(SAMPLE_BROMATOLOGIA)}
                      className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors flex items-center gap-2 group"
                    >
                      <span className="text-base">🌡️</span>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 group-hover:text-amber-400">Planilla de Temperaturas</div>
                        <div className="text-[10px] text-slate-500">Alerta 6.8°C en Heladera 2</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones inferiores */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={handleResetChat}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar chat
                </button>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                    showDebug ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Debug JSON
                </button>
              </div>
            </div>

            {/* Columna Derecha: Chat Interactivo Multimodal */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
              {/* Sub-header */}
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-white">Canal Operativo & Multimodal con Sammy</span>
                  <span className="text-xs text-amber-400/90 font-mono">gemini-3.8-flash (Vision + TTS)</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="text-slate-500">Hablando como:</span>
                  <span className="font-semibold text-slate-200">{selectedProfile.nombreUsuario}</span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  if (msg.sender === 'tool') {
                    return (
                      <div key={msg.id} className="my-2 bg-slate-950/80 border border-amber-500/20 rounded-xl p-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Herramientas ejecutadas en el portal</span>
                        </div>
                        {msg.toolCalls?.map((tc, i) => (
                          <div key={i} className="font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800 mb-1">
                            <span className="text-amber-300">{tc.name}</span>
                            <span className="text-slate-400">({JSON.stringify(tc.args)})</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950'
                        }`}
                      >
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1 max-w-[85%]">
                        {/* Imágenes adjuntas si el usuario las envió */}
                        {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-1.5">
                            {msg.attachedFiles.map((att, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-w-xs shadow-md">
                                {att.previewUrl ? (
                                  <img 
                                    src={att.previewUrl} 
                                    alt={att.nombre} 
                                    className="max-h-48 object-contain w-full bg-white/5"
                                  />
                                ) : (
                                  <div className="p-3 flex items-center gap-2 text-xs text-slate-300">
                                    <FileText className="w-5 h-5 text-amber-400" />
                                    <span className="truncate">{att.nombre}</span>
                                  </div>
                                )}
                                <div className="p-1.5 bg-slate-900/90 text-[10px] text-slate-300 truncate border-t border-slate-800">
                                  {att.nombre}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Botón de escuchar mensaje con voz de Sammy */}
                        {!isUser && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => speakText(msg.text)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-medium transition-colors border border-slate-700/60"
                              title="Escuchar a Sammy en voz alta"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Escuchar voz</span>
                            </button>
                            <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                          </div>
                        )}

                        {isUser && (
                          <div className="text-[10px] text-slate-500 px-1 text-right">
                            {msg.timestamp}
                          </div>
                        )}

                        {/* Debug payload */}
                        {showDebug && msg.rawDebug && (
                          <pre className="text-[10px] bg-slate-950 p-2 rounded text-slate-400 overflow-x-auto max-h-40 border border-slate-800">
                            {JSON.stringify(msg.rawDebug, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-2xl text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      Sammy está analizando la imagen y consultando las herramientas...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bandeja de Archivos Adjuntos pendientes de envío */}
              {attachedFiles.length > 0 && (
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] text-amber-400 font-semibold px-2 shrink-0 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Adjuntos ({attachedFiles.length}):
                  </span>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 pr-2 shrink-0">
                      {file.previewUrl && (
                        <img src={file.previewUrl} alt={file.nombre} className="w-7 h-7 object-cover rounded bg-white/5" />
                      )}
                      <span className="text-xs text-slate-200 max-w-[120px] truncate">{file.nombre}</span>
                      <button
                        onClick={() => removeAttachedFile(idx)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input Bar con Micrófono y Subida de Archivos */}
              <div className="p-3 bg-slate-900/80 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Input de archivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Botón de adjuntar foto o archivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors border border-slate-700/60 shrink-0"
                    title="Mandar foto de factura, ticket, comanda o planilla"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Botón de Micrófono (Hablar en tiempo real) */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={`p-2.5 rounded-xl transition-all shrink-0 border ${
                      isRecording
                        ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse ring-2 ring-red-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border-slate-700/60'
                    }`}
                    title={isRecording ? 'Detener micrófono' : 'Hablar en tiempo real por micrófono'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Input de texto */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      isRecording
                        ? '🎙️ Escuchándote en tiempo real, hablá tranquilo...'
                        : attachedFiles.length > 0
                        ? 'Agregá una consulta o dale Enter para que Sammy analice la foto...'
                        : `Hablá con Sammy como ${selectedProfile.nombreUsuario.split(' ')[0]}...`
                    }
                    disabled={isLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  />

                  {/* Botón Enviar */}
                  <button
                    type="submit"
                    disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-500/20 shrink-0"
                  >
                    <span>Enviar</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: CÓDIGO DE PRODUCCIÓN ======================= */}
        {activeTab === 'code' && (
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-amber-400" />
                  Código de Producción con Soporte Multimodal (Fotos, Archivos & Voz)
                </h2>
                <p className="text-xs text-slate-400">
                  Listo para reemplazar tu archivo en Vercel Serverless / Node.js Express.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? '¡Copiado al portapapeles!' : 'Copiar Código Completo'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-slate-300 flex items-start gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5">Cómo enviar fotos desde tu frontend:</strong>
                  Envía en el body: <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">archivos: [&#123; data: "base64...", mimeType: "image/jpeg" &#125;]</code>. Gemini procesará la imagen automáticamente.
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-slate-300 flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300 block mb-0.5">Cómo hacer hablar a Sammy en el frontend:</strong>
                  Podés usar <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">window.speechSynthesis</code> nativo o llamar al endpoint <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">/api/sammy/tts</code> con Gemini TTS.
                </div>
              </div>
            </div>

            <div className="flex-1 relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-auto h-[600px] leading-relaxed">
                {SAMMY_V2_COMMONJS_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* ======================= TAB: MEJORAS & DIAGNÓSTICO ======================= */}
        {activeTab === 'improvements' && (
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white mb-1">
                    Ahora Sammy ve fotos, escucha por micrófono y habla en tiempo real
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Hemos desbloqueado las capacidades multimodales completas de Gemini 3.8. Sammy ya no es solo un chat de texto: ahora es un asistente operativo presencial para la cocina y el mostrador de Milanga & Co.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <ImageIcon className="w-4 h-4" /> 1. Análisis de Fotos y Facturas
                </div>
                <p className="text-slate-400">
                  Podés sacarle una foto a la factura del repartidor de papas, carne o pollo. Sammy extrae los kilos, el precio unitario, el total y puede verificar si coincide con lo pactado o crear una tarea para pagar.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Mic className="w-4 h-4" /> 2. Entrada por Voz en Tiempo Real
                </div>
                <p className="text-slate-400">
                  Ideal para la cocina cuando tienen las manos ocupadas o con harina. Apretás el botón de micrófono, hablás naturalmente y Sammy transcribe y resuelve tu consulta de inmediato.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Volume2 className="w-4 h-4" /> 3. Voz Neural Rioplatense
                </div>
                <p className="text-slate-400">
                  Sammy te responde hablándote con pronunciación y tono argentino. Podés escuchar cualquier mensaje con el botón de parlantito o activar el modo "Auto-Hablar" para que lea todo automáticamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: DATOS DEL LOCAL ======================= */}
        {activeTab === 'portal' && (
          <div className="flex-1 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  Base de Datos Viva de Milanga & Co. (Simulador)
                </h2>
                <p className="text-xs text-slate-400">
                  Estos son los registros que Sammy lee y modifica en tiempo real al interactuar con el chat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Nómina */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" /> Nómina del Personal ({dbState.empleados.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Herramienta: obtener_nomina</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {dbState.empleados.map(e => (
                    <div key={e.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200">{e.nombre}</div>
                        <div className="text-[11px] text-slate-400">{e.puesto}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                        {e.rol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tareas */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tareas Operativas ({dbState.tareas.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">crear_tarea / listar_tareas</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {dbState.tareas.map(t => (
                    <div key={t.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{t.asignadoANombre}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${t.completada ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                          {t.completada ? 'Completada' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{t.descripcion}</p>
                      <div className="text-[10px] text-slate-500">Límite: {t.fechaLimite}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avisos */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" /> Pizarra de Avisos ({dbState.avisos.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">publicar_aviso</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {dbState.avisos.map(a => (
                    <div key={a.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">{a.titulo}</span>
                        <span className="text-[10px] text-slate-500">{a.fecha}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{a.texto}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memoria */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-400" /> Memoria Persistente de Sammy
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">guardar_memoria / obtener_memoria</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(dbState.memoria).map(([clave, valor]) => (
                    <div key={clave} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="font-mono text-[10px] text-violet-400 block">{clave}</span>
                      <p className="text-[11px] text-slate-300">{valor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
