/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Empleado {
  id: string;
  nombre: string;
  puesto: string;
  rol: 'empleado' | 'administrador' | 'dueña';
  activo: boolean;
  telefono: string;
}

export interface TurnoSemanal {
  [dia: string]: string;
}

export interface Tarea {
  id: string;
  asignadoANombre: string;
  descripcion: string;
  fechaLimite?: string;
  completada: boolean;
  creadaEn: string;
}

export interface Aviso {
  id: string;
  titulo?: string;
  texto: string;
  fecha: string;
}

export interface SolicitudFranco {
  id: string;
  empleado: string;
  dia: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export const INITIAL_EMPLEADOS: Empleado[] = [
  { id: 'emp_1', nombre: 'Abraham Gallo', puesto: 'Dueño / Dirección', rol: 'dueña', activo: true, telefono: '+54 11 4455-6677' },
  { id: 'emp_2', nombre: 'Laura Benítez', puesto: 'Encargada General', rol: 'administrador', activo: true, telefono: '+54 11 5566-7788' },
  { id: 'emp_3', nombre: 'Juan Pérez', puesto: 'Jefe de Cocina / Fritura', rol: 'empleado', activo: true, telefono: '+54 11 6677-8899' },
  { id: 'emp_4', nombre: 'Nico Rossi', puesto: 'Ayudante de Cocina & Armado', rol: 'empleado', activo: true, telefono: '+54 11 7788-9900' },
  { id: 'emp_5', nombre: 'Sofía Gómez', puesto: 'Cajera & Atención', rol: 'empleado', activo: true, telefono: '+54 11 8899-0011' },
  { id: 'emp_6', nombre: 'Valentina Díaz', puesto: 'Armado & Empaque', rol: 'empleado', activo: true, telefono: '+54 11 9900-1122' }
];

export const INITIAL_HORARIOS: Record<string, Record<string, TurnoSemanal>> = {
  sem1: {
    'Abraham Gallo': { lunes: 'Dirección', martes: 'Dirección', miercoles: 'Dirección', jueves: 'Dirección', viernes: 'Dirección', sabado: 'FRANCO', domingo: 'FRANCO' },
    'Laura Benítez': { lunes: '10:00 - 18:00', martes: '10:00 - 18:00', miercoles: '10:00 - 18:00', jueves: '10:00 - 18:00', viernes: '10:00 - 18:00', sabado: 'FRANCO', domingo: 'FRANCO' },
    'Juan Pérez': { lunes: '09:00 - 16:00', martes: '09:00 - 16:00', miercoles: '09:00 - 16:00', jueves: '09:00 - 16:00', viernes: '16:00 - 23:30', sabado: 'FRANCO', domingo: 'FRANCO' },
    'Nico Rossi': { lunes: '16:00 - 23:30', martes: '16:00 - 23:30', miercoles: 'FRANCO', jueves: 'FRANCO', viernes: '09:00 - 16:00', sabado: '10:00 - 18:00', domingo: '16:00 - 23:30' },
    'Sofía Gómez': { lunes: '11:00 - 19:00', martes: '11:00 - 19:00', miercoles: '11:00 - 19:00', jueves: 'FRANCO', viernes: '11:00 - 19:00', sabado: '11:00 - 19:00', domingo: 'FRANCO' },
    'Valentina Díaz': { lunes: 'FRANCO', martes: '16:00 - 23:30', miercoles: '16:00 - 23:30', jueves: '16:00 - 23:30', viernes: '16:00 - 23:30', sabado: '16:00 - 23:30', domingo: 'FRANCO' }
  }
};

export const INITIAL_TAREAS: Tarea[] = [
  { id: 'tar_1', asignadoANombre: 'Juan Pérez', descripcion: 'Controlar stock de pan rallado y pechugas para el fin de semana', fechaLimite: 'Viernes 14:00', completada: false, creadaEn: 'Hoy 10:15' },
  { id: 'tar_2', asignadoANombre: 'Sofía Gómez', descripcion: 'Revisar rollos térmicos de las comandas y posnet', fechaLimite: 'Hoy 18:00', completada: true, creadaEn: 'Ayer 15:30' }
];

export const INITIAL_AVISOS: Aviso[] = [
  { id: 'av_1', titulo: 'Recordatorio Bromatología', texto: 'Este miércoles a las 11 hs pasa inspección de rutina. Mantener planillas de frío al día.', fecha: 'Lunes 09:00' },
  { id: 'av_2', titulo: 'Llegada de Mercadería', texto: 'El proveedor de papas pasa martes 08:30 puntual. Recibe Nico.', fecha: 'Ayer' }
];

export const INITIAL_MEMORIA: Record<string, string> = {
  franco_preferido_juan: 'Juan prefiere francos domingos por compromisos familiares.',
  proveedor_aceite: 'Aceite de fritura entrega los jueves antes de las 12 hs.',
  cambio_guardia_viernes: 'Los viernes reforzar freidoras a partir de las 20:30 hs.'
};

export const INITIAL_SOLICITUDES: SolicitudFranco[] = [
  { id: 'sol_1', empleado: 'Nico Rossi', dia: 'Viernes próximo', motivo: 'Turno médico especialista a las 11:30', estado: 'pendiente' }
];

/**
 * Ejecutor local simulado de las 12 herramientas del portal de Milanga & Co.
 */
export function executeMockTool(
  toolName: string,
  args: any,
  contextoUsuario: any,
  dbState: {
    empleados: Empleado[];
    horarios: Record<string, Record<string, TurnoSemanal>>;
    tareas: Tarea[];
    avisos: Aviso[];
    memoria: Record<string, string>;
    solicitudes: SolicitudFranco[];
  },
  updateDb: (updater: (prev: any) => any) => void
): { resultado: any; error?: string } {
  try {
    switch (toolName) {
      case 'obtener_datos_portal': {
        return {
          resultado: {
            local: 'Milanga & Co. - Sucursal Central',
            estado: 'Operando normalmente',
            empleadosActivos: dbState.empleados.filter(e => e.activo).length,
            tareasPendientes: dbState.tareas.filter(t => !t.completada).length,
            avisosVigentes: dbState.avisos.length,
            solicitudesPendientes: dbState.solicitudes.filter(s => s.estado === 'pendiente').length
          }
        };
      }

      case 'consultar_mis_horarios': {
        const semana = args.semana || 'sem1';
        const nombre = contextoUsuario.nombreUsuario || 'Abraham Gallo';
        const semanaData = dbState.horarios[semana] || dbState.horarios['sem1'];
        
        // Buscamos coincidencia flexible
        const key = Object.keys(semanaData).find(k => k.toLowerCase().includes(nombre.toLowerCase())) || nombre;
        const turnos = semanaData[key] || semanaData['Abraham Gallo'] || { nota: 'Sin turnos cargados para esta semana' };

        return {
          resultado: {
            empleado: nombre,
            semana,
            turnos
          }
        };
      }

      case 'obtener_horarios': {
        const semana = args.semana || 'sem1';
        const nombres: string[] = Array.isArray(args.nombres) ? args.nombres : [];
        const semanaData = dbState.horarios[semana] || dbState.horarios['sem1'];

        if (!contextoUsuario.puedeOperar && !contextoUsuario.puedeModificarTodo) {
          return {
            resultado: {
              alerta: 'Permisos insuficientes para ver grilla completa de otros compañeros. Solo podés consultar tus propios horarios.',
              turnos: {}
            }
          };
        }

        let resultadoHorarios: Record<string, any> = {};
        if (nombres.length === 0) {
          resultadoHorarios = semanaData;
        } else {
          for (const nom of nombres) {
            const match = Object.keys(semanaData).find(k => k.toLowerCase().includes(nom.toLowerCase()));
            if (match) {
              resultadoHorarios[match] = semanaData[match];
            } else {
              resultadoHorarios[nom] = 'No encontrado en la grilla';
            }
          }
        }

        return {
          resultado: {
            semana,
            horarios: resultadoHorarios
          }
        };
      }

      case 'obtener_nomina': {
        const filtro = (args.filtroRol || '').toLowerCase();
        let lista = dbState.empleados;
        if (filtro) {
          lista = lista.filter(e => e.puesto.toLowerCase().includes(filtro) || e.rol.toLowerCase().includes(filtro));
        }
        return {
          resultado: {
            total: lista.length,
            empleados: lista.map(e => ({
              nombre: e.nombre,
              puesto: e.puesto,
              rol: e.rol,
              activo: e.activo
            }))
          }
        };
      }

      case 'obtener_memoria': {
        const cat = args.categoria;
        return {
          resultado: {
            notasGuardadas: dbState.memoria,
            total: Object.keys(dbState.memoria).length
          }
        };
      }

      case 'guardar_memoria': {
        if (!contextoUsuario.puedeModificarTodo && !contextoUsuario.puedeOperar) {
          return {
            resultado: { error: 'No tenés permisos para guardar en la memoria compartida del portal.' }
          };
        }
        const { clave, valor } = args;
        updateDb(prev => ({
          ...prev,
          memoria: { ...prev.memoria, [clave]: valor }
        }));
        return {
          resultado: {
            guardado: true,
            clave,
            valor,
            mensaje: 'Memoria registrada en Milanga & Co.'
          }
        };
      }

      case 'proponer_horarios': {
        return {
          resultado: {
            propuestaGenerada: true,
            semana: args.semana,
            motivo: args.motivo || 'Reorganización de turnos',
            cambios: args.horarios,
            estado: 'Lista para confirmación en el portal'
          }
        };
      }

      case 'crear_tarea': {
        const { asignadoANombre, descripcion, fechaLimite } = args;
        const nuevaTarea: Tarea = {
          id: `tar_${Date.now()}`,
          asignadoANombre,
          descripcion,
          fechaLimite: fechaLimite || 'Sin límite',
          completada: false,
          creadaEn: 'Recién'
        };
        updateDb(prev => ({
          ...prev,
          tareas: [nuevaTarea, ...prev.tareas]
        }));
        return {
          resultado: {
            creada: true,
            tarea: nuevaTarea
          }
        };
      }

      case 'listar_tareas': {
        let items = dbState.tareas;
        if (args.soloMisTareas && contextoUsuario.nombreUsuario) {
          items = items.filter(t => t.asignadoANombre.toLowerCase().includes(contextoUsuario.nombreUsuario.toLowerCase()));
        }
        return {
          resultado: {
            total: items.length,
            tareas: items
          }
        };
      }

      case 'completar_tarea': {
        const { tareaId } = args;
        let encontrada = false;
        updateDb(prev => ({
          ...prev,
          tareas: prev.tareas.map((t: Tarea) => {
            if (t.id === tareaId) {
              encontrada = true;
              return { ...t, completada: true };
            }
            return t;
          })
        }));
        return {
          resultado: {
            completada: true,
            tareaId,
            status: encontrada ? 'Tarea actualizada a finalizada' : 'Tarea no encontrada pero procesada'
          }
        };
      }

      case 'publicar_aviso': {
        if (!contextoUsuario.puedeModificarTodo) {
          return {
            resultado: { error: 'Permisos insuficientes. Solo encargados o dueños pueden publicar avisos globales.' }
          };
        }
        const nuevoAviso: Aviso = {
          id: `av_${Date.now()}`,
          titulo: args.titulo || 'Comunicado General',
          texto: args.texto,
          fecha: 'Hoy'
        };
        updateDb(prev => ({
          ...prev,
          avisos: [nuevoAviso, ...prev.avisos]
        }));
        return {
          resultado: {
            publicado: true,
            aviso: nuevoAviso
          }
        };
      }

      case 'gestionar_solicitud': {
        if (!contextoUsuario.puedeModificarTodo) {
          return {
            resultado: { error: 'Solo la dirección o encargados pueden aprobar o rechazar francos.' }
          };
        }
        const { solicitudId, estado } = args;
        updateDb(prev => ({
          ...prev,
          solicitudes: prev.solicitudes.map((s: SolicitudFranco) => {
            if (s.id === solicitudId) {
              return { ...s, estado: estado as any };
            }
            return s;
          })
        }));
        return {
          resultado: {
            procesada: true,
            solicitudId,
            nuevoEstado: estado
          }
        };
      }

      default:
        return {
          resultado: { error: `Herramienta desconocida: ${toolName}` }
        };
    }
  } catch (err: any) {
    return {
      resultado: null,
      error: err.message || 'Error ejecutando herramienta local.'
    };
  }
}
