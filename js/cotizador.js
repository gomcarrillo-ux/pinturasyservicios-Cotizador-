// Cotizador Lógico para Pinturas y Servicios

function getSimboloMoneda() {
  const moneda = document.getElementById('moneda').value;
  return moneda === 'NIO' ? 'C$' : '$';
}

function toggleUnidad() {
  const unidad = document.getElementById('unidad_area').value;
  const inputArea = document.getElementById('area');
  const lblPrecio = document.getElementById('lbl-precio');

  if (unidad === 'nulo') {
    inputArea.value = '';
    inputArea.disabled = true;
    inputArea.placeholder = "Cotización Global";
    lblPrecio.innerText = `Monto Global (${getSimboloMoneda()}):`;
  } else {
    inputArea.disabled = false;
    inputArea.placeholder = "Ej: 150";
    lblPrecio.innerText = `Precio por ${unidad} (${getSimboloMoneda()}):`;
  }
  calcular();
}

function cambiarMoneda() {
  const unidad = document.getElementById('unidad_area').value;
  const lblPrecio = document.getElementById('lbl-precio');
  const sim = getSimboloMoneda();

  if (unidad === 'nulo') {
    lblPrecio.innerText = `Monto Global (${sim}):`;
  } else {
    lblPrecio.innerText = `Precio por ${unidad} (${sim}):`;
  }
  calcular();
}

function calcular() {
  const unidad = document.getElementById('unidad_area').value;
  const areaVal = parseFloat(document.getElementById('area').value) || 0;
  const precioVal = parseFloat(document.getElementById('precio').value) || 0;
  const sim = getSimboloMoneda();
  const isoMoneda = document.getElementById('moneda').value;

  let subtotal = 0;
  if (unidad === 'nulo') {
    subtotal = precioVal;
  } else {
    subtotal = areaVal * precioVal;
  }

  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  document.getElementById('lblSubtotal').innerText = `${sim} ${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${isoMoneda}`;
  document.getElementById('lblIva').innerText = `${sim} ${iva.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${isoMoneda}`;
  document.getElementById('lblTotal').innerText = `${sim} ${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${isoMoneda}`;
}

function generarPDF() {
  const unidad = document.getElementById('unidad_area').value;
  const areaVal = parseFloat(document.getElementById('area').value);
  const precioVal = parseFloat(document.getElementById('precio').value);

  if (unidad !== 'nulo' && (isNaN(areaVal) || areaVal <= 0)) {
    alert("Por favor ingresa un área válida o selecciona la opción 'Sin especificar / Cotización Global'.");
    return;
  }

  if (isNaN(precioVal) || precioVal <= 0) {
    alert("Por favor ingresa un precio o monto válido.");
    return;
  }

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
  let areaTexto = "";
  let precioTexto = "";

  if (unidad === 'nulo') {
    subtotal = precioVal;
    areaTexto = "Global";
    precioTexto = `${sim} ${precioVal.toFixed(2)}`;
  } else {
    subtotal = areaVal * precioVal;
    areaTexto = `${areaVal.toFixed(2)} ${unidad}`;
    precioTexto = `${sim} ${precioVal.toFixed(2)} / ${unidad}`;
  }

  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString('es-ES');
  const codigoStr = `PyS-${hoy.getFullYear()}${(hoy.getMonth()+1).toString().padStart(2,'0')}${hoy.getDate().toString().padStart(2,'0')}-${hoy.getHours()}${hoy.getMinutes()}`;

  // Llenar plantilla PDF
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
  document.getElementById('pdf-subtotal-item').innerText = `${sim} ${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  document.getElementById('pdf-subtotal').innerText = `${sim} ${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})} ${isoMoneda}`;
  document.getElementById('pdf-iva').innerText = `${sim} ${iva.toLocaleString('en-US', {minimumFractionDigits: 2})} ${isoMoneda}`;
  document.getElementById('pdf-total').innerText = `${sim} ${total.toLocaleString('en-US', {minimumFractionDigits: 2})} ${isoMoneda}`;
  document.getElementById('pdf-tiempo').innerText = tiempo;
  document.getElementById('pdf-validez').innerText = validez;

  const element = document.getElementById('pdf-template');
  element.style.display = 'block';

  const opt = {
    margin:       10,
    filename:     `Cotizacion_${cliente.replace(/\s+/g, '_')}_${fechaStr.replace(/\//g, '')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.style.display = 'none';
  }).catch(err => {
    element.style.display = 'none';
    console.error(err);
    alert("Ocurrió un error al generar el documento PDF.");
  });
}