/* ===== Utilidades ===== */
const $ = (id) => document.getElementById(id);

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getSimboloMoneda() {
  return $('moneda').value === 'NIO' ? 'C$' : '$';
}

let avisoTimer = null;
function mostrarAviso(msg) {
  const el = $('aviso');
  el.textContent = msg;
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => { el.hidden = true; }, 6000);
}

/* ===== Formulario ===== */
function cambiarOpcionIva() {
  const opcion = $('iva_opcion').value;
  const inputIva = $('iva_porcentaje');

  if (opcion === '0') {
    inputIva.value = '0';
    inputIva.disabled = true;
  } else if (opcion === '15') {
    inputIva.value = '15';
    inputIva.disabled = true;
  } else {
    inputIva.disabled = false;
    inputIva.value = '';
    inputIva.placeholder = 'Ej: 15';
    inputIva.focus();
  }
  calcular();
}

function actualizarEtiquetaPrecio() {
  const unidad = $('unidad_area').value;
  const sim = getSimboloMoneda();
  $('lbl-precio').innerText =
    unidad === 'nulo' ? `Monto Global (${sim}):` : `Precio por ${unidad} (${sim}):`;
}

function toggleUnidad() {
  const unidad = $('unidad_area').value;
  const inputArea = $('area');

  if (unidad === 'nulo') {
    inputArea.value = '';
    inputArea.disabled = true;
    inputArea.placeholder = 'Cotización Global';
  } else {
    inputArea.disabled = false;
    inputArea.placeholder = 'Ej: 150';
  }
  actualizarEtiquetaPrecio();
  calcular();
}

function cambiarMoneda() {
  actualizarEtiquetaPrecio();
  calcular();
}

function leerNumeros() {
  const unidad = $('unidad_area').value;
  const area = parseFloat($('area').value) || 0;
  const precio = parseFloat($('precio').value) || 0;
  const ivaPct = Math.min(Math.max(parseFloat($('iva_porcentaje').value) || 0, 0), 100);

  const subtotal = unidad === 'nulo' ? precio : area * precio;
  const iva = subtotal * (ivaPct / 100);
  return { unidad, area, precio, ivaPct, subtotal, iva, total: subtotal + iva };
}

function calcular() {
  const { ivaPct, subtotal, iva, total } = leerNumeros();
  const sim = getSimboloMoneda();
  const iso = $('moneda').value;

  $('lblIvaTexto').innerText = `IVA (${ivaPct}%):`;
  $('lblSubtotal').innerText = `${sim} ${fmt(subtotal)} ${iso}`;
  $('lblIva').innerText = `${sim} ${fmt(iva)} ${iso}`;
  $('lblTotal').innerText = `${sim} ${fmt(total)} ${iso}`;
}


/* ===== PDF =====
   Se dibuja directo con jsPDF (texto y líneas vectoriales).
   No usa capturas de pantalla, así que no depende del tamaño de la ventana,
   del scroll ni del navegador: siempre sale igual y el logo siempre aparece. */

const CDN_JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

const PDF = { PW: 215.9, PH: 279.4, M: 15 };
PDF.CW = PDF.PW - 2 * PDF.M;     // ancho útil
PDF.BOTTOM = PDF.PH - 20;        // límite inferior (deja lugar al pie de página)

const COL = {
  navy:  [11, 42, 85],
  blue:  [30, 95, 168],
  red:   [229, 57, 53],
  text:  [15, 23, 42],
  muted: [71, 85, 105],
  box:   [241, 246, 253],
  line:  [195, 212, 234],
  white: [255, 255, 255]
};

/* La fuente estándar del PDF solo soporta Latin-1: se limpian emojis y símbolos raros */
function limpiar(s) {
  return String(s == null ? '' : s)
    .replace(/\r/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/…/g, '...')
    .replace(/€/g, 'EUR')
    .replace(/[^\n -~ -ÿ]/g, '');
}

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar el generador de PDF. Revisa tu conexión a internet.'));
    document.head.appendChild(s);
  });
}

async function asegurarJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return;
  await cargarScript(CDN_JSPDF);
  if (!(window.jspdf && window.jspdf.jsPDF)) {
    throw new Error('El generador de PDF no se cargó correctamente.');
  }
}

function estilo(doc, st, size, color) {
  doc.setFont('helvetica', st);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

function asegurar(doc, y, alto) {
  if (y + alto > PDF.BOTTOM) {
    doc.addPage();
    return PDF.M;
  }
  return y;
}

/* "Etiqueta: valor" con etiqueta en negrita y valor que se ajusta a varias líneas.
   Devuelve el alto usado. Con dibujar=false solo mide. */
function campo(doc, label, valor, x, y, w, dibujar, size) {
  size = size || 9;
  const lh = size * 0.5;
  estilo(doc, 'bold', size, COL.text);
  const lw = doc.getTextWidth(label) + 1.6;
  estilo(doc, 'normal', size, COL.text);
  const lineas = doc.splitTextToSize(valor || '-', Math.max(w - lw, 20));
  if (dibujar) {
    estilo(doc, 'bold', size, COL.text);
    doc.text(label, x, y);
    estilo(doc, 'normal', size, COL.text);
    lineas.forEach((l, i) => doc.text(l, x + lw, y + i * lh));
  }
  return lineas.length * lh;
}

function dibujarEncabezado(doc, d) {
  const M = PDF.M;
  const altoLogo = 22;
  const anchoLogo = altoLogo * (window.LOGO_PDF_RATIO || 1.16);

  if (window.LOGO_PDF_JPG) {
    try {
      doc.addImage(window.LOGO_PDF_JPG, 'JPEG', M, 11, anchoLogo, altoLogo);
    } catch (e) { console.warn('No se pudo insertar el logo', e); }
  }

  const tx = M + anchoLogo + 4;
  estilo(doc, 'bold', 17, COL.navy);
  doc.text('PINTURAS Y SERVICIOS', tx, 20);
  estilo(doc, 'bold', 9.5, COL.red);
  doc.text('Calidad & Protección Industrial', tx, 26);
  estilo(doc, 'normal', 8.5, COL.muted);
  doc.text('Managua, Nicaragua - Cobertura Nacional', tx, 31);

  const xr = M + PDF.CW;
  estilo(doc, 'bold', 12, COL.blue);
  doc.text('COTIZACIÓN DE SERVICIOS', xr, 18, { align: 'right' });
  estilo(doc, 'normal', 8.5, COL.muted);
  doc.text(`Fecha: ${d.fecha}`, xr, 24, { align: 'right' });
  doc.text(`Código: ${d.codigo}`, xr, 29, { align: 'right' });

  doc.setDrawColor(COL.blue[0], COL.blue[1], COL.blue[2]);
  doc.setLineWidth(0.9);
  doc.line(M, 37, M + PDF.CW, 37);
  return 44;
}

function dibujarInfo(doc, d, y) {
  const x0 = PDF.M, w = PDF.CW, pad = 4, gap = 8;
  const colW = (w - 2 * pad - gap) / 2;
  const xl = x0 + pad, xr = x0 + pad + colW + gap;

  const hL = campo(doc, 'Cliente / Empresa:', d.cliente, xl, 0, colW, false)
           + campo(doc, 'Atención a:', d.contacto, xl, 0, colW, false);
  const hR = campo(doc, 'Ubicación:', d.ubicacion, xr, 0, colW, false)
           + campo(doc, 'Teléfono / Email:', d.telefono, xr, 0, colW, false);
  const boxH = 16.5 + Math.max(hL, hR) - 4.5;

  doc.setFillColor(COL.box[0], COL.box[1], COL.box[2]);
  doc.setDrawColor(COL.line[0], COL.line[1], COL.line[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(x0, y, w, boxH, 2, 2, 'FD');

  estilo(doc, 'bold', 8, COL.blue);
  doc.text('DATOS DEL CLIENTE', xl, y + 6.5);
  doc.text('UBICACIÓN Y CONTACTO', xr, y + 6.5);

  let yl = y + 12, yr = y + 12;
  yl += campo(doc, 'Cliente / Empresa:', d.cliente, xl, yl, colW, true);
  campo(doc, 'Atención a:', d.contacto, xl, yl, colW, true);
  yr += campo(doc, 'Ubicación:', d.ubicacion, xr, yr, colW, true);
  campo(doc, 'Teléfono / Email:', d.telefono, xr, yr, colW, true);

  return y + boxH + 7;
}

function dibujarTabla(doc, d, y) {
  const x0 = PDF.M, pad = 3, headH = 8;
  const W = [0.46, 0.16, 0.19, 0.19].map((p) => p * PDF.CW);
  const xs = [x0, x0 + W[0], x0 + W[0] + W[1], x0 + W[0] + W[1] + W[2]];

  const cabecera = (yy) => {
    doc.setFillColor(COL.navy[0], COL.navy[1], COL.navy[2]);
    doc.rect(x0, yy, PDF.CW, headH, 'F');
    estilo(doc, 'bold', 8.5, COL.white);
    doc.text('Descripción del Servicio y Alcance Técnico', xs[0] + pad, yy + 5.3);
    doc.text('Medida', xs[1] + W[1] / 2, yy + 5.3, { align: 'center' });
    doc.text('Precio Unitario', xs[2] + W[2] - pad, yy + 5.3, { align: 'right' });
    doc.text('Subtotal', xs[3] + W[3] - pad, yy + 5.3, { align: 'right' });
    return yy + headH;
  };

  // Líneas de la columna de descripción (se pueden repartir en varias páginas)
  const items = [];
  estilo(doc, 'bold', 9.5, COL.navy);
  doc.splitTextToSize(d.servicio, W[0] - 2 * pad)
    .forEach((t) => items.push({ t, st: 'bold', size: 9.5, color: COL.navy, lh: 4.8 }));
  items.push({ t: null, lh: 1.5 });
  estilo(doc, 'normal', 8.5, COL.muted);
  doc.splitTextToSize(d.alcance, W[0] - 2 * pad)
    .forEach((t) => items.push({ t, st: 'normal', size: 8.5, color: COL.muted, lh: 4.3 }));

  // Celdas numéricas (pueden ocupar 2 líneas si el monto es muy grande)
  estilo(doc, 'normal', 9, COL.text);
  const numLineas = [
    doc.splitTextToSize(d.areaTexto, W[1] - 2 * pad),
    doc.splitTextToSize(d.precioTexto, W[2] - 2 * pad),
    doc.splitTextToSize(d.subtotalItemTxt, W[3] - 2 * pad)
  ];
  const numH = Math.max(...numLineas.map((l) => l.length)) * 4.5;

  y = cabecera(y);
  let i = 0, primera = true;

  while (i < items.length) {
    const disp = PDF.BOTTOM - y - 2 * pad;
    if (disp < items[i].lh + (primera ? 0 : 0) || (primera && disp < numH)) {
      doc.addPage();
      y = cabecera(PDF.M);
      continue;
    }
    let h = 0, j = i;
    while (j < items.length && (j === i || h + items[j].lh <= disp)) {
      h += items[j].lh;
      j++;
    }
    const contenidoH = primera ? Math.max(h, numH) : h;
    const rowH = contenidoH + 2 * pad;

    doc.setDrawColor(COL.line[0], COL.line[1], COL.line[2]);
    doc.setLineWidth(0.3);
    for (let k = 0; k < 4; k++) doc.rect(xs[k], y, W[k], rowH, 'S');

    let top = y + pad;
    for (let m = i; m < j; m++) {
      const it = items[m];
      if (it.t !== null) {
        estilo(doc, it.st, it.size, it.color);
        doc.text(it.t, xs[0] + pad, top + it.lh * 0.78);
      }
      top += it.lh;
    }

    if (primera) {
      estilo(doc, 'normal', 9, COL.text);
      numLineas[0].forEach((l, n) => doc.text(l, xs[1] + W[1] / 2, y + pad + 3.4 + n * 4.5, { align: 'center' }));
      numLineas[1].forEach((l, n) => doc.text(l, xs[2] + W[2] - pad, y + pad + 3.4 + n * 4.5, { align: 'right' }));
      numLineas[2].forEach((l, n) => doc.text(l, xs[3] + W[3] - pad, y + pad + 3.4 + n * 4.5, { align: 'right' }));
    }

    y += rowH;
    i = j;
    primera = false;
    if (i < items.length) {
      doc.addPage();
      y = cabecera(PDF.M);
    }
  }
  return y + 8;
}

function dibujarTotales(doc, d, y) {
  y = asegurar(doc, y, 34);
  const xr = PDF.M + PDF.CW, xl = xr - 85;

  estilo(doc, 'normal', 9.5, COL.text);
  doc.text('Subtotal:', xl, y + 4);
  estilo(doc, 'bold', 9.5, COL.text);
  doc.text(d.subtotalTxt, xr, y + 4, { align: 'right' });
  y += 6.5;

  if (d.ivaPct > 0) {
    estilo(doc, 'normal', 9.5, COL.text);
    doc.text(`IVA (${d.ivaPct}%):`, xl, y + 4);
    estilo(doc, 'bold', 9.5, COL.text);
    doc.text(d.ivaTxt, xr, y + 4, { align: 'right' });
    y += 6.5;
  }

  doc.setDrawColor(COL.navy[0], COL.navy[1], COL.navy[2]);
  doc.setLineWidth(0.7);
  doc.line(xl, y + 0.5, xr, y + 0.5);
  y += 7;

  estilo(doc, 'bold', 11, COL.navy);
  doc.text('TOTAL:', xl, y + 1);
  estilo(doc, 'bold', 12, COL.navy);
  doc.text(d.totalTxt, xr, y + 1, { align: 'right' });
  return y + 14;
}

function dibujarTerminos(doc, d, y) {
  const filas = [
    ['Tiempo estimado de ejecución:', d.tiempo],
    ['Validez de la propuesta:', d.validez],
    ['Modalidad de Pago:', '50% anticipo al iniciar y 50% contra entrega a satisfacción.'],
    ['Garantía Técnica:', 'Respaldo integral directo en materiales y mano de obra especializados por Pinturas y Servicios.']
  ];
  const x0 = PDF.M, pad = 4, sangria = 4;
  const ancho = PDF.CW - 2 * pad - sangria;
  const size = 8.8;

  let H = 0;
  filas.forEach(([l, v]) => { H += campo(doc, l, v, 0, 0, ancho, false, size) + 1.2; });
  const boxH = 10.9 + H;

  y = asegurar(doc, y, boxH);

  doc.setFillColor(COL.box[0], COL.box[1], COL.box[2]);
  doc.setDrawColor(COL.line[0], COL.line[1], COL.line[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(x0, y, PDF.CW, boxH, 2, 2, 'FD');

  estilo(doc, 'bold', 8.5, COL.blue);
  doc.text('CONDICIONES COMERCIALES Y DE GARANTÍA', x0 + pad, y + 6.5);

  let yy = y + 12;
  doc.setFillColor(COL.text[0], COL.text[1], COL.text[2]);
  filas.forEach(([l, v]) => {
    doc.circle(x0 + pad + 0.8, yy - 1.1, 0.6, 'F');
    yy += campo(doc, l, v, x0 + pad + sangria, yy, ancho, true, size) + 1.2;
  });
  return y + boxH + 6;
}

function dibujarFirmas(doc, y) {
  y = asegurar(doc, y, 40);
  y += 20;
  const cx = [PDF.M + PDF.CW * 0.25, PDF.M + PDF.CW * 0.75];
  const bloques = [
    { t: 'PINTURAS Y SERVICIOS', l: ['Claro: (+505) 8353-4865 | Tigo: (+505) 8252-5385', 'pinturasyserviciosweb@gmail.com'] },
    { t: 'ACEPTADO POR EL CLIENTE', l: ['Firma y Sello de Conformidad', 'Fecha: ____/____/________'] }
  ];
  doc.setDrawColor(COL.muted[0], COL.muted[1], COL.muted[2]);
  doc.setLineWidth(0.3);
  bloques.forEach((b, n) => {
    doc.line(cx[n] - 38, y, cx[n] + 38, y);
    estilo(doc, 'bold', 9, COL.text);
    doc.text(b.t, cx[n], y + 5.5, { align: 'center' });
    estilo(doc, 'normal', 8.5, COL.muted);
    b.l.forEach((l, k) => doc.text(l, cx[n], y + 10.5 + k * 4.5, { align: 'center' }));
  });
  return y + 22;
}

function dibujarPies(doc) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(COL.line[0], COL.line[1], COL.line[2]);
    doc.setLineWidth(0.3);
    doc.line(PDF.M, PDF.PH - 14, PDF.M + PDF.CW, PDF.PH - 14);
    estilo(doc, 'normal', 7.5, COL.muted);
    doc.text('Pinturas y Servicios  |  Managua, Nicaragua', PDF.M, PDF.PH - 9.5);
    doc.text(`Página ${p} de ${total}`, PDF.M + PDF.CW, PDF.PH - 9.5, { align: 'right' });
  }
}

/* Reúne los datos del formulario ya listos para escribir en el PDF */
function reunirDatos() {
  const { unidad, area, precio, ivaPct, subtotal, iva, total } = leerNumeros();
  const sim = getSimboloMoneda();
  const iso = $('moneda').value;

  const clienteRaw = $('cliente').value.trim() || 'Cliente General';
  const hoy = new Date();
  const dd = dosDigitos(hoy.getDate()), mm = dosDigitos(hoy.getMonth() + 1), yyyy = hoy.getFullYear();
  const fecha = `${dd}/${mm}/${yyyy}`;

  let areaTexto, precioTexto;
  if (unidad === 'nulo') {
    areaTexto = 'Global';
    precioTexto = `${sim} ${fmt(precio)}`;
  } else {
    areaTexto = `${area.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unidad}`;
    precioTexto = `${sim} ${fmt(precio)} / ${unidad}`;
  }

  return {
    clienteRaw,
    fileName: `Cotizacion_${clienteRaw.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dd}-${mm}-${yyyy}.pdf`,
    fecha,
    codigo: `PyS-${yyyy}${mm}${dd}-${dosDigitos(hoy.getHours())}${dosDigitos(hoy.getMinutes())}`,
    cliente: limpiar(clienteRaw),
    contacto: limpiar($('contacto').value.trim() || 'N/A'),
    ubicacion: limpiar($('ubicacion').value.trim() || 'Managua, Nicaragua'),
    telefono: limpiar($('telefono').value.trim() || 'N/A'),
    servicio: limpiar($('servicio').value),
    alcance: limpiar($('alcance').value.trim() || 'Aplicación de sistema de recubrimiento especializado por Pinturas y Servicios.'),
    tiempo: limpiar($('tiempo').value.trim() || '5 a 7 días hábiles'),
    validez: limpiar($('validez').value.trim() || '15 días calendario'),
    areaTexto: limpiar(areaTexto),
    precioTexto: limpiar(precioTexto),
    subtotalItemTxt: `${sim} ${fmt(subtotal)}`,
    subtotalTxt: `${sim} ${fmt(subtotal)} ${iso}`,
    ivaPct,
    ivaTxt: `${sim} ${fmt(iva)} ${iso}`,
    totalTxt: `${sim} ${fmt(total)} ${iso}`
  };
}

function dosDigitos(n) {
  return String(n).padStart(2, '0');
}

function construirPdf() {
  const d = reunirDatos();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

  let y = dibujarEncabezado(doc, d);
  y = dibujarInfo(doc, d, y);
  y = dibujarTabla(doc, d, y);
  y = dibujarTotales(doc, d, y);
  y = dibujarTerminos(doc, d, y);
  dibujarFirmas(doc, y);
  dibujarPies(doc);

  return { doc, d };
}

/* Respaldo para celulares sin "compartir archivos": botón con un toque real del usuario.
   No se usan enlaces "data:" porque el descargador de webintoapp se cierra con ellos. */
function entregarPdfEnMovil(doc, fileName) {
  const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const enlace = $('pdf-enlace');
  if (enlace.dataset.url) URL.revokeObjectURL(enlace.dataset.url);
  enlace.dataset.url = url;
  enlace.href = url;
  enlace.download = fileName;
  $('pdf-listo').hidden = false;
  $('pdf-listo').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function generarPDF() {
  const { unidad, precio } = leerNumeros();

  if (unidad !== 'nulo' && !(parseFloat($('area').value) > 0)) {
    mostrarAviso("Ingresa una cantidad válida o selecciona 'Sin especificar / Cotización Global'.");
    return;
  }
  if (!(precio > 0)) {
    mostrarAviso('Ingresa un precio o monto válido.');
    return;
  }

  const btn = $('btnGenerarPdf');
  btn.disabled = true;
  btn.innerText = '⏳ GENERANDO...';
  $('pdf-listo').hidden = true;

  try {
    await asegurarJsPDF();
    const { doc, d } = construirPdf();

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], d.fileName, { type: 'application/pdf' });
    const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (esMovil && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: d.fileName,
        text: `Cotización de Pinturas y Servicios - ${d.clienteRaw}`
      });
    } else if (esMovil) {
      entregarPdfEnMovil(doc, d.fileName);
    } else {
      doc.save(d.fileName);
    }
  } catch (err) {
    if (!err || err.name !== 'AbortError') {      // AbortError = el usuario cerró el menú de compartir
      console.error(err);
      mostrarAviso('Error al exportar el PDF: ' + ((err && err.message) || 'inténtalo de nuevo.'));
    }
  } finally {
    btn.disabled = false;
    btn.innerText = '📄 GENERAR PDF';
  }
}

/* ===== Inicio ===== */
toggleUnidad();
calcular();

/* Permite instalarla desde Chrome ("Instalar aplicación") y abrirla sin internet */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
