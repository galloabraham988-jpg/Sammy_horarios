/**
 * MILANGA & CO. — SAMMY
 * Endpoint /api/sammy para Vercel Serverless
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return res.status(500).json({ error: 'Falta GEMINI_API_KEY en Vercel.' });

  const b = req.body || {}, c = b.contexto || {};
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  const tools = [
    { type: 'function', name: 'obtener_datos_portal', description: 'Consulta resumen del portal.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'obtener_nomina', description: 'Consulta nómina. Solo administración.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'obtener_horarios', description: 'Consulta horarios de una semana.', parameters: { type: 'object', properties: { semana: { type: 'string' }, nombres: { type: 'array', items: { type: 'string' } } }, required: ['semana'], additionalProperties: false } },
    { type: 'function', name: 'consultar_mis_horarios', description: 'Consulta los horarios del usuario conectado.', parameters: { type: 'object', properties: { semana: { type: 'string' } }, required: ['semana'], additionalProperties: false } },
    { type: 'function', name: 'obtener_memoria', description: 'Lee la memoria permanente del negocio.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'guardar_memoria', description: 'Guarda una regla permanente del negocio.', parameters: { type: 'object', properties: { clave: { type: 'string' }, valor: { type: 'string' }, categoria: { type: 'string' } }, required: ['clave', 'valor'], additionalProperties: false } },
    { type: 'function', name: 'proponer_horarios', description: 'Prepara una grilla nueva o modificada. Nunca la guarda; requiere confirmación.', parameters: { type: 'object', properties: { semana: { type: 'string' }, motivo: { type: 'string' }, horarios: { type: 'object', additionalProperties: { type: 'object', additionalProperties: { type: 'string' } } } }, required: ['semana', 'horarios'], additionalProperties: false } },
    { type: 'function', name: 'crear_tarea', description: 'Crea una tarea para una persona.', parameters: { type: 'object', properties: { asignadoANombre: { type: 'string' }, descripcion: { type: 'string' }, fechaLimite: { type: 'string' } }, required: ['asignadoANombre', 'descripcion'], additionalProperties: false } },
    { type: 'function', name: 'listar_tareas', description: 'Lista tareas permitidas al usuario.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'completar_tarea', description: 'Completa una tarea propia o cualquier tarea si es dueña.', parameters: { type: 'object', properties: { tareaId: { type: 'string' } }, required: ['tareaId'], additionalProperties: false } },
    { type: 'function', name: 'publicar_aviso', description: 'Publica un aviso global.', parameters: { type: 'object', properties: { titulo: { type: 'string' }, texto: { type: 'string' } }, required: ['texto'], additionalProperties: false } },
    { type: 'function', name: 'gestionar_solicitud', description: 'Gestiona una solicitud de franco.', parameters: { type: 'object', properties: { solicitudId: { type: 'string' }, estado: { type: 'string', enum: ['Aprobada', 'Rechazada', 'Pendiente'] } }, required: ['solicitudId', 'estado'], additionalProperties: false } }
  ];

  const nivel = Number(c.nivelJerarquico || 0);
  const rolNombre = c.rolNombre || c.rolSistema || c.rol || 'invitado';
  const instructions = `Sos Sammy, asistente operativo de MILANGA & CO. Usuario ${c.nombreUsuario || ''}. Cargo: ${rolNombre}. Nivel jerárquico: ${nivel}.
JERARQUÍA: Dueña 100; Administrador General 90; Director/a Operativo/a 80; Gerente de Sucursal 70; Coordinador/a 65; Supervisor/a 60; Encargado/a 50; Líder de Turno 40; Empleado 10.
PERMISOS: respetá siempre el nivel jerárquico informado. No inventes permisos. Empleados pueden consultar solamente su propia información. Líderes de turno pueden gestionar tareas propias y consultar horarios operativos. Encargados pueden además crear tareas y gestionar solicitudes. Supervisores y superiores pueden consultar nómina, publicar avisos y operar horarios según sus permisos. Coordinadores y superiores pueden guardar reglas permanentes del negocio. La Dueña tiene control total. Nunca reveles datos privados innecesarios de otros empleados.
MEMORIA: cuando administración autorizada indique una regla permanente del negocio, guardala. Antes de crear horarios, consultá memoria si puede afectar la grilla.
HORARIOS: podés crear desde cero o copiar una semana y cambiar solo francos. Consultá primero horarios/nómina. Toda modificación de horarios SIEMPRE usa proponer_horarios y espera confirmación; nunca la guardes directamente. Si el usuario adjunta una grilla, usá los datos del archivo.
OTRAS OPERACIONES: tareas, avisos y solicitudes pueden ejecutarse directamente si el nivel tiene permiso. Si una operación supera el nivel del usuario, explicá brevemente que necesita un cargo superior.
Hablá en español argentino, claro y directo.`;

  try {
    let input;
    if (b.previousResponseId) {
      input = b.toolOutputs || [];
    } else {
      input = String(b.mensaje || '') + (b.archivoContexto ? '\nARCHIVO:\n' + JSON.stringify(b.archivoContexto) : '');
    }

    const payload = {
      model,
      input,
      system_instruction: instructions,
      tools,
      previous_interaction_id: b.previousResponseId || undefined,
      generation_config: { temperature: 0.2 }
    };

    let r, d, usedModel = model;
    const modelsToTry = [model, ...fallbackModels.filter(m => m !== model)];
    for (const candidate of modelsToTry) {
      const attempt = { ...payload, model: candidate };
      r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(attempt)
      });
      d = await r.json();
      if (r.ok) { usedModel = candidate; break; }
      const msg = String(d?.error?.message || '').toLowerCase();
      const retryable = r.status === 429 || r.status === 503 || msg.includes('high demand') || msg.includes('temporarily') || msg.includes('resource exhausted') || msg.includes('overloaded');
      if (!retryable) return res.status(r.status).json({ error: d?.error?.message || 'Error de Gemini.' });
    }
    if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || 'Gemini está temporalmente sin capacidad disponible.' });

    const steps = Array.isArray(d.steps) ? d.steps : [];
    const toolCalls = steps.filter(x => x.type === 'function_call').map(x => ({
      call_id: x.id || x.call_id,
      name: x.name,
      arguments: typeof x.arguments === 'string' ? x.arguments : JSON.stringify(x.arguments || {})
    }));

    let respuesta = d.output_text || '';
    if (!respuesta) {
      const modelStep = steps.find(x => x.type === 'model_output');
      if (modelStep?.content) respuesta = modelStep.content.filter(x => x.type === 'text').map(x => x.text).join('');
    }

    return res.status(200).json({ ok: true, respuesta, text: respuesta, toolCalls, responseId: d.id, model: usedModel });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Error interno de Sammy.' });
  }
}
