// --- Configuración inicial ---
const usuario = localStorage.getItem('usuario') || '';
document.getElementById('usuario').value = usuario;
document.getElementById('footerUsuario').textContent = usuario;

// Fecha y hora actual
function actualizarFechaHora() {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-PE');
  const hora = now.toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  document.getElementById('fechaHora').value = `${fecha} ${hora}`;
}
actualizarFechaHora();
setInterval(actualizarFechaHora, 30000);

// Alternar campos peatonal/vehicular
const radioAcceso = document.getElementsByName('acceso');
function alternarCampos() {
  const tipo = Array.from(radioAcceso).find(r => r.checked)?.value;
  
  // Campos peatonal
  const camposPeatonal = document.querySelector('.peatonal-fields');
  const inputsPeatonal = camposPeatonal.querySelectorAll('input, select');
  
  // Campos vehicular
  const camposVehicular = document.querySelector('.vehicular-fields');
  const inputsVehicular = camposVehicular.querySelectorAll('input, select');
  
  if (tipo === 'peatonal') {
    camposPeatonal.style.display = 'block';
    camposVehicular.style.display = 'none';
    
    // Habilitar required en campos peatonal (excepto foto de documentación)
    inputsPeatonal.forEach(input => {
      if (input.id !== 'empresaPeatonal' && input.id !== 'nombresPeatonal' && input.id !== 'documentoPeatonal' && input.id !== 'btnFotoDocumentacionPeatonal') {
        input.required = true;
      }
    });
    
    // Deshabilitar required en campos vehicular
    inputsVehicular.forEach(input => {
      input.required = false;
    });
    
  } else if (tipo === 'vehicular') {
    camposPeatonal.style.display = 'none';
    camposVehicular.style.display = 'block';
    
    // Deshabilitar required en campos peatonal
    inputsPeatonal.forEach(input => {
      input.required = false;
    });
    
    // Habilitar required en campos vehicular
    inputsVehicular.forEach(input => {
      if (input.id !== 'empresaVehicular' && input.id !== 'nombresVehicular' && input.id !== 'documentoVehicular' && input.id !== 'placaTracto' && input.id !== 'placaCarreta') {
        input.required = true;
      }
    });
  } else {
    // Si no hay tipo seleccionado, ocultar ambos y deshabilitar required
    camposPeatonal.style.display = 'none';
    camposVehicular.style.display = 'none';
    
    inputsPeatonal.forEach(input => {
      input.required = false;
    });
    
    inputsVehicular.forEach(input => {
      input.required = false;
    });
  }
}
radioAcceso.forEach(r => r.addEventListener('change', alternarCampos));

// Cargar motivos desde backend
async function cargarMotivos() {
  try {
    const data = await callBackend('getMotivos');
    let opciones = '<option value="">Seleccione...</option>';
    if (data.status === 'success' && Array.isArray(data.motivos)) {
      opciones += data.motivos.map(m => `<option value="${m}">${m}</option>`).join('');
    }
    opciones += '<option value="Otros">Otros</option>';
    document.getElementById('motivoPeatonal').innerHTML = opciones;
    document.getElementById('motivoVehicular').innerHTML = opciones;
  } catch (error) {
    console.error('Error cargando motivos:', error);
    let opciones = '<option value="">Error cargando motivos</option><option value="Otros">Otros</option>';
    document.getElementById('motivoPeatonal').innerHTML = opciones;
    document.getElementById('motivoVehicular').innerHTML = opciones;
  }
}
cargarMotivos();

// Mostrar input de "Detalles" siempre que se seleccione un motivo
function toggleMotivoOtro(selectId, inputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  
  // Cambiar placeholder a "Detalles"
  input.placeholder = 'Detalles';
  
  select.addEventListener('change', function() {
    if (this.value && this.value !== '') {
      input.style.display = 'block';
      input.required = true;
    } else {
      input.style.display = 'none';
      input.required = false;
    }
  });
}
toggleMotivoOtro('motivoPeatonal', 'motivoPeatonalOtro');
toggleMotivoOtro('motivoVehicular', 'motivoVehicularOtro');

// --- Cloudinary (configurado) ---
async function subirFotoCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`;
  const preset = CONFIG.CLOUDINARY.UPLOAD_PRESET;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  const res = await fetch(url, { method: 'POST', body: formData });
  const data = await res.json();
  return data.secure_url;
}

// --- Manejo de fotos ---
// --- Tomar foto: siempre abrir cámara ---
function tomarFoto(callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment'; // Prioriza cámara trasera
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await subirFotoCloudinary(file);
      callback(url);
    }
    document.body.removeChild(input);
  };
  input.click();
}
document.getElementById('btnFotoDni').onclick = () => tomarFoto(url => {
  document.getElementById('previewFotoDni').innerHTML = `<img src="${url}">`;
  document.getElementById('btnFotoDni').dataset.url = url;
});
// Manejo de fotos para vehicular (DNI)
document.getElementById('btnFotoDniVehicular').onclick = () => tomarFoto(url => {
  document.getElementById('previewFotoDniVehicular').innerHTML = `<img src="${url}">`;
  document.getElementById('btnFotoDniVehicular').dataset.url = url;
});
document.getElementById('btnFotoVehiculo').onclick = () => tomarFoto(url => {
  document.getElementById('previewFotoVehiculo').innerHTML = `<img src="${url}">`;
  document.getElementById('btnFotoVehiculo').dataset.url = url;
});
document.getElementById('btnFotoPosterior').onclick = () => tomarFoto(url => {
  document.getElementById('previewFotoPosterior').innerHTML = `<img src="${url}">`;
  document.getElementById('btnFotoPosterior').dataset.url = url;
});
// Manejo de fotos de documentación
document.getElementById('btnFotoDocumentacionPeatonal').onclick = () => tomarFoto(url => {
  document.getElementById('previewFotoDocumentacionPeatonal').innerHTML = `<img src="${url}">`;
  document.getElementById('btnFotoDocumentacionPeatonal').dataset.url = url;
});
document.getElementById('btnFotoDocumentacionVehicular').onclick = () => tomarFoto(url => {
  document.getElementById('previewFotoDocumentacionVehicular').innerHTML = `<img src="${url}">`;
  document.getElementById('btnFotoDocumentacionVehicular').dataset.url = url;
});

// --- Validación y envío del formulario ---
document.getElementById('registroForm').onsubmit = async function(e) {
  e.preventDefault();
  const btn = this.querySelector('.btn-principal');
  const originalBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Registrando...';

  const tipoRegistro = document.getElementById('tipoRegistro').value;
  const acceso = Array.from(radioAcceso).find(r => r.checked)?.value;
  if (!tipoRegistro || !acceso) {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
    return alert('Complete todos los campos obligatorios.');
  }
  
  // Validar fotos según tipo de acceso
  if (acceso === 'peatonal') {
    // Para peatonal: solo foto de DNI es obligatoria
    const fotoDni = document.getElementById('btnFotoDni').dataset.url || '';
    if (!fotoDni) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
      return alert('Debe tomar la Foto de DNI.');
    }
  } else if (acceso === 'vehicular') {
    // Para vehicular: foto de documentación es obligatoria
    const fotoDocumentacion = document.getElementById('btnFotoDocumentacionVehicular').dataset.url || '';
    if (!fotoDocumentacion) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
      return alert('Debe tomar la Foto de Documentación.');
    }
  }
  let payload = {
    usuario,
    fechaHora: document.getElementById('fechaHora').value,
    tipoRegistro,
    acceso
  };
  if (acceso === 'peatonal') {
    payload.empresa = document.getElementById('empresaPeatonal').value;
    payload.nombres = document.getElementById('nombresPeatonal').value;
    payload.documento = document.getElementById('documentoPeatonal').value;
    payload.fotoDni = document.getElementById('btnFotoDni').dataset.url || '';
    payload.fotoDocumentacion = document.getElementById('btnFotoDocumentacionPeatonal').dataset.url || '';
    const motivoSel = document.getElementById('motivoPeatonal').value;
    const detalles = document.getElementById('motivoPeatonalOtro').value;
    payload.motivo = detalles ? `${motivoSel} - ${detalles}` : motivoSel;
  } else if (acceso === 'vehicular') {
    payload.empresa = document.getElementById('empresaVehicular').value;
    payload.nombres = document.getElementById('nombresVehicular').value;
    payload.documento = document.getElementById('documentoVehicular').value;
    payload.fotoDni = document.getElementById('btnFotoDniVehicular').dataset.url || '';
    payload.placaTracto = document.getElementById('placaTracto').value;
    payload.placaCarreta = document.getElementById('placaCarreta').value || 'No Aplica';
    payload.fotoVehiculo = document.getElementById('btnFotoVehiculo').dataset.url || '';
    payload.fotoPosterior = document.getElementById('btnFotoPosterior').dataset.url || '';
    payload.fotoDocumentacion = document.getElementById('btnFotoDocumentacionVehicular').dataset.url || '';
    const motivoSel = document.getElementById('motivoVehicular').value;
    const detalles = document.getElementById('motivoVehicularOtro').value;
    payload.motivo = detalles ? `${motivoSel} - ${detalles}` : motivoSel;
  }
  // Validaciones extra
  if (acceso === 'vehicular') {
    const placaRegex = /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}$/;
    if (!placaRegex.test(payload.placaTracto)) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
      return alert('Placa Tracto debe tener el formato ABC-123');
    }
    if (payload.placaCarreta !== 'No Aplica' && !placaRegex.test(payload.placaCarreta)) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
      return alert('Placa Carreta debe tener el formato ABC-123 o "No Aplica"');
    }
  }
  // Debug: Log para ver qué se está enviando
  console.log('Payload a enviar:', JSON.stringify(payload));
  console.log('FotoDocumentacion en payload:', payload.fotoDocumentacion);
  
  // Enviar al backend
  try {
    const result = await callBackend('registrarVisita', { data: JSON.stringify(payload) });
    if (result.status === 'success') {
      alert('Registro exitoso');
      this.reset();
      // Restaurar usuario y fecha/hora
      document.getElementById('usuario').value = usuario;
      actualizarFechaHora();
      document.querySelector('.peatonal-fields').style.display = 'none';
      document.querySelector('.vehicular-fields').style.display = 'none';
      document.getElementById('previewFotoDni').innerHTML = '';
      document.getElementById('previewFotoVehiculo').innerHTML = '';
      document.getElementById('previewFotoPosterior').innerHTML = '';
      document.getElementById('previewFotoDniVehicular').innerHTML = '';
      document.getElementById('previewFotoDocumentacionPeatonal').innerHTML = '';
      document.getElementById('previewFotoDocumentacionVehicular').innerHTML = '';
    } else {
      alert('Error: ' + (result.message || 'No se pudo registrar.'));
    }
  } catch (error) {
    console.error('Error enviando registro:', error);
    alert('Error de conexión. Intente nuevamente.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }
};

// --- Cerrar sesión ---
document.getElementById('cerrarSesion').onclick = function() {
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
};

// --- Guardar usuario en localStorage si no existe (por compatibilidad) ---
if (!usuario) {
  // Si llegaste aquí sin usuario, regresa al login
  window.location.href = 'index.html';
} 
