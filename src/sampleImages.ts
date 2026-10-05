/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Genera un SVG renderizado en Base64 para pruebas rápidas
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}

export const SAMPLE_FACTURA_POLLO = {
  nombre: 'Factura_Distribuidora_SanCayetano.svg',
  mimeType: 'image/svg+xml',
  titulo: '🧾 Factura de Proveedor (Pollo & Carne)',
  descripcion: 'Factura B por 80kg de Pechugas y 40kg de Nalga para milanesas.',
  data: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#fff;font-family:monospace;padding:20px;color:#111">
      <rect width="100%" height="100%" fill="#fafafa" stroke="#ccc" stroke-width="2"/>
      <text x="30" y="50" font-size="22" font-weight="bold" fill="#b91c1c">DISTRIBUIDORA SAN CAYETANO S.R.L.</text>
      <text x="30" y="75" font-size="13" fill="#555">Carnes &amp; Aves Seleccionadas — Av. Boedo 1240, CABA</text>
      <text x="30" y="95" font-size="13" fill="#555">CUIT: 30-71458922-4 — IVA Responsable Inscripto</text>
      <line x1="30" y1="110" x2="570" y2="110" stroke="#333" stroke-width="1.5"/>
      <text x="30" y="135" font-size="14" font-weight="bold">CLIENTE: MILANGA &amp; CO. S.A.</text>
      <text x="30" y="155" font-size="13">FECHA: Hoy | REMITO N°: 0004-00128941</text>
      <line x1="30" y1="170" x2="570" y2="170" stroke="#333" stroke-width="1"/>
      <text x="30" y="200" font-size="13" font-weight="bold">DETALLE DE MERCADERÍA:</text>
      <text x="30" y="230" font-size="13">1. Pechuga de Pollo Desosada x 80 kg @ $4.200/kg  = $336.000</text>
      <text x="30" y="260" font-size="13">2. Nalga Seleccionada p/ Milanesa x 40 kg @ $7.500/kg = $300.000</text>
      <text x="30" y="290" font-size="13">3. Huevos Blancos x 6 Maples @ $4.500/maple     = $27.000</text>
      <text x="30" y="320" font-size="13">4. Pan Rallado Especial Rebozado x 50 kg        = $65.000</text>
      <line x1="30" y1="360" x2="570" y2="360" stroke="#333" stroke-dasharray="4"/>
      <text x="30" y="400" font-size="16" font-weight="bold">SUBTOTAL: $728.000</text>
      <text x="30" y="425" font-size="14" fill="#666">IVA (10.5% / 21%): $98.280</text>
      <text x="30" y="460" font-size="20" font-weight="bold" fill="#047857">TOTAL A PAGAR: $826.280</text>
      <line x1="30" y1="490" x2="570" y2="490" stroke="#333" stroke-width="1.5"/>
      <text x="30" y="530" font-size="13" font-weight="bold">CONDICIÓN DE PAGO: Cuenta Corriente a 7 días</text>
      <text x="30" y="560" font-size="13" fill="#444">Recibió en sucursal: Nico Rossi (Cocina Milanga &amp; Co.)</text>
      <text x="30" y="585" font-size="13" fill="#888">Firma conforme y sello de recepción OK.</text>
    </svg>
  `)
};

export const SAMPLE_PIZARRON_HORARIOS = {
  nombre: 'Pizarron_Turnos_Cocina.svg',
  mimeType: 'image/svg+xml',
  titulo: '📋 Foto Pizarrón de Horarios de Cocina',
  descripcion: 'Anotaciones en la pizarra con cambios de guardia y pedidos de francos.',
  data: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500" style="background:#1e293b;font-family:sans-serif;padding:20px;color:#fff">
      <rect width="100%" height="100%" fill="#0f172a" stroke="#475569" stroke-width="4" rx="10"/>
      <text x="30" y="45" font-size="20" font-weight="bold" fill="#f59e0b">PIZARRÓN DE COCINA - MILANGA &amp; CO.</text>
      <text x="30" y="70" font-size="13" fill="#94a3b8">Semana 1 - Novedades del equipo</text>
      <line x1="30" y1="85" x2="570" y2="85" stroke="#334155" stroke-width="2"/>
      
      <rect x="30" y="105" width="540" height="60" fill="#1e293b" rx="6"/>
      <text x="45" y="130" font-size="14" font-weight="bold" fill="#38bdf8">⚠️ JUEVES NOCHE (Relevo necesario):</text>
      <text x="45" y="152" font-size="13" fill="#cbd5e1">Juan tiene médico 18 hs. Nico se ofreció a cubrirlo si entra más tarde el viernes.</text>

      <rect x="30" y="180" width="540" height="60" fill="#1e293b" rx="6"/>
      <text x="45" y="205" font-size="14" font-weight="bold" fill="#a7f3d0">🍗 PRODUCCIÓN VIERNES:</text>
      <text x="45" y="227" font-size="13" fill="#cbd5e1">Dejar marinadas 120 milanesas de suprema y 80 de carne para el turno noche.</text>

      <rect x="30" y="255" width="540" height="60" fill="#1e293b" rx="6"/>
      <text x="45" y="280" font-size="14" font-weight="bold" fill="#fbcfe8">📌 NOTA DE ABRAHAM (Dirección):</text>
      <text x="45" y="302" font-size="13" fill="#cbd5e1">Revisar temperatura de freidoras cada 2 horas y anotar en planilla.</text>
    </svg>
  `)
};

export const SAMPLE_BROMATOLOGIA = {
  nombre: 'Control_Temperatura_Frio.svg',
  mimeType: 'image/svg+xml',
  titulo: '🌡️ Planilla de Temperaturas y Bromatología',
  descripcion: 'Registro de frío de cámara frigorífica y heladeras de mostrador.',
  data: createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="520" viewBox="0 0 600 520" style="background:#fff;font-family:sans-serif;padding:20px;color:#000">
      <rect width="100%" height="100%" fill="#ffffff" stroke="#999" stroke-width="2"/>
      <text x="30" y="45" font-size="18" font-weight="bold" fill="#1e3a8a">PLANILLA DE CONTROL DE TEMPERATURAS - BROMATOLOGÍA</text>
      <text x="30" y="70" font-size="12" fill="#666">Milanga &amp; Co. — Sucursal Central | Lunes a Domingo</text>
      <line x1="30" y1="85" x2="570" y2="85" stroke="#000" stroke-width="1.5"/>

      <text x="30" y="115" font-size="13" font-weight="bold">Equipo / Sector</text>
      <text x="220" y="115" font-size="13" font-weight="bold">Turno Mañana (09:00)</text>
      <text x="420" y="115" font-size="13" font-weight="bold">Turno Noche (20:00)</text>
      <line x1="30" y1="125" x2="570" y2="125" stroke="#999" stroke-width="1"/>

      <text x="30" y="155" font-size="12">1. Cámara Frigorífica Carnes</text>
      <text x="220" y="155" font-size="12" fill="#047857" font-weight="bold">2.4 °C (ÓPTIMO)</text>
      <text x="420" y="155" font-size="12" fill="#047857" font-weight="bold">2.8 °C (ÓPTIMO)</text>

      <text x="30" y="195" font-size="12">2. Heladera 2 (Supremas listas)</text>
      <text x="220" y="195" font-size="12" fill="#047857" font-weight="bold">3.1 °C (ÓPTIMO)</text>
      <text x="420" y="195" font-size="12" fill="#b91c1c" font-weight="bold">6.8 °C ⚠️ ALERTA</text>

      <text x="30" y="235" font-size="12">3. Freezer de Papas Bastón</text>
      <text x="220" y="235" font-size="12" fill="#047857" font-weight="bold">-18.2 °C (ÓPTIMO)</text>
      <text x="420" y="235" font-size="12" fill="#047857" font-weight="bold">-17.9 °C (ÓPTIMO)</text>

      <line x1="30" y1="270" x2="570" y2="270" stroke="#000" stroke-width="1"/>
      <text x="30" y="300" font-size="12" font-weight="bold" fill="#b91c1c">OBSERVACIONES:</text>
      <text x="30" y="325" font-size="12">La Heladera 2 subió a 6.8°C en el turno noche. Se revisó el burlete inferior de la puerta.</text>
      <text x="30" y="345" font-size="12">Requiere revisión urgente del técnico de refrigeración mañana a primera hora.</text>
    </svg>
  `)
};
