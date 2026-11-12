function getSimboloMoneda() {
  return document.getElementById('moneda').value === 'NIO' ? 'C$' : '$';
}

function cambiarOpcionIva() {
  const opcion = document.getElementById('iva_opcion').value;
  const inputIva = document.getElementById('iva_porcentaje');

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

function toggleUnidad() {
  const unidad = document.getElementById('unidad_area').value;
  const inputArea = document.getElementById('area');
  const lblPrecio = document.getElementById('lbl-precio');

  if (unidad === 'nulo') {
    inputArea.value = '';
    inputArea.disabled = true;
    inputArea.placeholder = 'Cotización Global';
    lblPrecio.innerText = `Monto Global (${getSimboloMoneda()}):`;
  } else {
    inputArea.disabled = false;
    inputArea.placeholder = 'Ej: 150';
    lblPrecio.innerText = `Precio por ${unidad} (${getSimboloMoneda()}):`;
  }
  calcular();
}

function cambiarMoneda() {
  const unidad = document.getElementById('unidad_area').value;
  const lblPrecio = document.getElementById('lbl-precio');
  const sim = getSimboloMoneda();

  lblPrecio.innerText = unidad === 'nulo'
    ? `Monto Global (${sim}):`
    : `Precio por ${unidad} (${sim}):`;
  calcular();
}

function calcular() {
  const unidad = document.getElementById('unidad_area').value;
  const areaVal = parseFloat(document.getElementById('area').value) || 0;
  const precioVal = parseFloat(document.getElementById('precio').value) || 0;
  const ivaPct = parseFloat(document.getElementById('iva_porcentaje').value) || 0;

  const sim = getSimboloMoneda();
  const isoMoneda = document.getElementById('moneda').value;

  const subtotal = unidad === 'nulo' ? precioVal : (areaVal * precioVal);
  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;

  document.getElementById('lblIvaTexto').innerText = `IVA (${ivaPct}%):`;
  document.getElementById('lblSubtotal').innerText = `${sim} ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isoMoneda}`;
  document.getElementById('lblIva').innerText = `${sim} ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isoMoneda}`;
  document.getElementById('lblTotal').innerText = `${sim} ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isoMoneda}`;
}

function cargarLogoEnPdf() {
  return new Promise((resolve) => {
    const headerLogo = document.getElementById('header-logo');
    const pdfLogo = document.getElementById('pdf-logo');
    
    if (headerLogo && headerLogo.complete && headerLogo.naturalWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = headerLogo.naturalWidth;
        canvas.height = headerLogo.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(headerLogo, 0, 0);
        pdfLogo.src = canvas.toDataURL('image/png');
      } catch (e) {
        pdfLogo.src = headerLogo.src;
      }
    }
    resolve();
  });
}

async function generarPDF() {
  const unidad = document.getElementById('unidad_area').value;
  const areaVal = parseFloat(document.getElementById('area').value);
  const precioVal = parseFloat(document.getElementById('precio').value);
  const ivaPct = parseFloat(document.getElementById('iva_porcentaje').value) || 0;

  if (unidad !== 'nulo' && (isNaN(areaVal) || areaVal <= 0)) {
    alert("Por favor ingresa un área válida o selecciona 'Sin especificar / Cotización Global'.");
    return;
  }

  if (isNaN(precioVal) || precioVal <= 0) {
    alert("Por favor ingresa un precio o monto válido.");
    return;
  }

  const btn = document.getElementById('btnGenerarPdf');
  btn.disabled = true;
  btn.innerText = "⏳ GENERANDO PDF...";

  const cliente = document.getElementById('cliente').value.trim() || 'Cliente General';
  const contacto = document.getElementById('contacto').value.trim() || 'N/A';
  const ubicacion = document.getElementById('ubicacion').value.trim() || 'Managua, Nicaragua';
  const telefono = document.getElementById('telefono').value.trim() || 'N/A';
  const servicio = document.getElementById('servicio').value;
  const alcance = document.getElementById('alcance').value.trim() || 'Aplicación de sistema de recubrimiento especializado por Pinturas y Servicios.';
  const tiempo = document.getElementById('tiempo').value.trim() || '5 a 7 días hábiles';
  const validez = document.getElementById('validez').value.trim() || '15 días calendario';

  const sim = getSimboloMoneda();
  const isoMoneda = document.getElementById('moneda').value;

  let subtotal = 0;
  let areaTexto = '';
  let precioTexto = '';

  if (unidad === 'nulo') {
    subtotal = precioVal;
    areaTexto = 'Global';
    precioTexto = `${sim} ${precioVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  } else {
    subtotal = areaVal * precioVal;
    areaTexto = `${areaVal.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unidad}`;
    precioTexto = `${sim} ${precioVal.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${unidad}`;
  }

  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;

  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString('es-ES');
  const codigoStr = `PyS-${hoy.getFullYear()}${(hoy.getMonth() + 1).toString().padStart(2, '0')}${hoy.getDate().toString().padStart(2, '0')}-${hoy.getHours().toString().padStart(2, '0')}${hoy.getMinutes().toString().padStart(2, '0')}`;

  document.getElementById('pdf-fecha').innerText = `Fecha: ${fechaStr}`;
  document.getElementById('pdf-codigo').innerText = `Código: ${codigoStr}`;
  document.getElementById('pdf-cliente').innerText = cliente;
  document.getElementById('pdf-contacto').innerText = contacto;
  document.getElementById('pdf-ubicacion').innerText = ubicacion;
  document.getElementById('pdf-telefono').innerText = telefono;
  document.getElementById('pdf-servicio').innerText = servicio;
  document.getElementById('pdf-alcance').innerText = alcance;
  document.getElementById('pdf-area').innerText = areaTexto;
  document.getElementById('pdf-precio').innerText = precioTexto;
  document.getElementById('pdf-subtotal-item').innerText = `${sim} ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  document.getElementById('pdf-subtotal').innerText = `${sim} ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${isoMoneda}`;

  const filaIva = document.getElementById('pdf-fila-iva');
  if (ivaPct > 0) {
    filaIva.style.display = 'flex';
    document.getElementById('pdf-iva-label').innerText = `IVA (${ivaPct}%):`;
    document.getElementById('pdf-iva').innerText = `${sim} ${iva.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${isoMoneda}`;
  } else {
    filaIva.style.display = 'none';
  }

  document.getElementById('pdf-total').innerText = `${sim} ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${isoMoneda}`;
  document.getElementById('pdf-tiempo').innerText = tiempo;
  document.getElementById('pdf-validez').innerText = validez;

  await cargarLogoEnPdf();

  const element = document.getElementById('pdf-template');
  const fileName = `Cotizacion_${cliente.replace(/[^a-zA-Z0-9_-]/g, '_')}_${fechaStr.replace(/\//g, '-')}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
  };

  try {
    const pdf = await html2pdf().set(opt).from(element).toPdf().get('pdf');
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: fileName,
        text: `Cotización de Pinturas y Servicios - ${cliente}`
      });
    } else if (isMobile) {
      const dataUri = pdf.output('datauristring');
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      pdf.save(fileName);
    }
  } catch (err) {
    if (err && err.name !== 'AbortError') {
      console.error(err);
      alert("Error al exportar PDF: " + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.innerText = "📄 GENERAR PDF";
  }
}