// Cargar logo cliente y usuario
window.addEventListener('DOMContentLoaded', async () => {
  // Logo cliente por query string
  const params = new URLSearchParams(window.location.search);
  const logo = params.get('logo');
  if (logo) {
    document.getElementById('logoCliente').src = logo;
  } else {
    document.getElementById('logoCliente').style.display = 'none';
  }
  // Usuario
  const usuario = localStorage.getItem('usuario') || '';
  document.getElementById('sidebarUsuario').textContent = usuario;

  // Switch y carga de registros
  const tipoSwitch = document.getElementById('tipoSwitch');
  let registros = [];

  // Filtros
  const filtroTipoRegistro = document.getElementById('filtroTipoRegistro');
  const filtroEmpresa = document.getElementById('filtroEmpresa');
  const filtroNombres = document.getElementById('filtroNombres');
  const filtroDocumento = document.getElementById('filtroDocumento');
  const filtroMotivo = document.getElementById('filtroMotivo');
  const filtroFechaDesde = document.getElementById('filtroFechaDesde');
  const filtroFechaHasta = document.getElementById('filtroFechaHasta');
  const limpiarFiltros = document.getElementById('limpiarFiltros');

  async function cargarRegistros() {
    try {
      const result = await callBackend('getRegistros');
      if (result.status === 'success' && Array.isArray(result.registros)) {
        registros = result.registros;
        llenarEmpresas();
        renderTabla();
      } else {
        document.getElementById('tablaBody').innerHTML = '<tr><td colspan="10">No se pudieron cargar los registros</td></tr>';
      }
    } catch (error) {
      document.getElementById('tablaBody').innerHTML = '<tr><td colspan="10">Error de conexión</td></tr>';
    }
  }

  function llenarEmpresas() {
    const empresas = Array.from(new Set(registros.map(r => r.Empresa).filter(e => e && e.trim() !== '')));
    filtroEmpresa.innerHTML = '<option value="">Empresa</option>' + empresas.map(e => `<option value="${e}">${e}</option>`).join('');
  }

  function aplicarFiltros(regs) {
    let filtrados = regs;
    // Switch peatonal/vehicular
    const vehicular = tipoSwitch.checked;
    filtrados = filtrados.filter(r => vehicular ? r.Acceso === 'vehicular' : r.Acceso === 'peatonal');
    // Tipo de registro
    if (filtroTipoRegistro.value) filtrados = filtrados.filter(r => r.TipoRegistro === filtroTipoRegistro.value);
    // Empresa
    if (filtroEmpresa.value) filtrados = filtrados.filter(r => r.Empresa === filtroEmpresa.value);
    // Nombres
    if (filtroNombres.value) filtrados = filtrados.filter(r => (r.Nombres || '').toLowerCase().includes(filtroNombres.value.toLowerCase()));
    // Documento
    if (filtroDocumento.value) filtrados = filtrados.filter(r => (r.Documento || '').toLowerCase().includes(filtroDocumento.value.toLowerCase()));
    // Motivo (texto)
    if (filtroMotivo.value) filtrados = filtrados.filter(r => (r.Motivo || '').toLowerCase().includes(filtroMotivo.value.toLowerCase()));
    // Rango de fechas
    if (filtroFechaDesde.value) {
      filtrados = filtrados.filter(r => {
        const fecha = parseFecha(r.FechaHora);
        return fecha && fecha >= filtroFechaDesde.value;
      });
    }
    if (filtroFechaHasta.value) {
      filtrados = filtrados.filter(r => {
        const fecha = parseFecha(r.FechaHora);
        return fecha && fecha <= filtroFechaHasta.value;
      });
    }
    return filtrados;
  }

  function parseFecha(fechaHora) {
    // Espera formato DD/MM/YYYY HH:mm o similar
    if (!fechaHora) return null;
    const partes = fechaHora.split(' ')[0].split('/');
    if (partes.length !== 3) return null;
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }

  function renderResumen(filtrados) {
    const ingresos = filtrados.filter(r => r.TipoRegistro === 'Ingreso').length;
    const salidas = filtrados.filter(r => r.TipoRegistro === 'Salida').length;
    document.getElementById('cantidadIngresos').textContent = ingresos;
    document.getElementById('cantidadSalidas').textContent = salidas;
  }

  function renderTabla() {
    const filtrados = aplicarFiltros(registros);
    renderResumen(filtrados);
    const vehicular = tipoSwitch.checked;
    // Definir columnas
    const columnasPeatonal = [
      'FechaHora', 'Usuario', 'TipoRegistro', 'Empresa', 'Nombres', 'Documento', 'Motivo', 'FotoDni'
    ];
    const columnasVehicular = [
      'FechaHora', 'Usuario', 'TipoRegistro', 'Empresa', 'Nombres', 'Documento', 'PlacaTracto', 'PlacaCarreta', 'Motivo', 'FotoDni', 'FotoVehiculo', 'FotoPosterior'
    ];
    const columnas = vehicular ? columnasVehicular : columnasPeatonal;
    // Render header
    document.getElementById('tablaHeader').innerHTML = columnas.map(col => `<th>${col.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('');
    // Render body
    if (filtrados.length === 0) {
      document.getElementById('tablaBody').innerHTML = '<tr><td colspan="'+columnas.length+'">No hay registros</td></tr>';
      return;
    }
    document.getElementById('tablaBody').innerHTML = filtrados.map((r, idx) => {
      return '<tr>' + columnas.map(col => {
        if (col.startsWith('Foto') && r[col]) {
          return `<td><a href="#" class="ver-imagen" data-img="${r[col]}" title="Ver imagen"><i class="fa-regular fa-image"></i></a></td>`;
        }
        return `<td>${r[col] || ''}</td>`;
      }).join('') + '</tr>';
    }).join('');
    // Asignar eventos a los links de imagen
    document.querySelectorAll('.ver-imagen').forEach(link => {
      link.onclick = function(e) {
        e.preventDefault();
        mostrarModalImagen(this.dataset.img);
      };
    });
  }

  function mostrarModalImagen(url) {
    const modal = document.getElementById('modalImagen');
    const img = document.getElementById('modalImg');
    img.src = url;
    modal.style.display = 'flex';
  }
  document.getElementById('cerrarModalImagen').onclick = function() {
    document.getElementById('modalImagen').style.display = 'none';
    document.getElementById('modalImg').src = '';
  };
  document.getElementById('modalImagen').onclick = function(e) {
    if (e.target === this) {
      this.style.display = 'none';
      document.getElementById('modalImg').src = '';
    }
  };

  function actualizarSwitchLabels() {
    const vehicular = tipoSwitch.checked;
    document.getElementById('labelPeatonal').classList.toggle('active', !vehicular);
    document.getElementById('labelVehicular').classList.toggle('active', vehicular);
  }
  tipoSwitch.addEventListener('change', actualizarSwitchLabels);
  window.addEventListener('DOMContentLoaded', actualizarSwitchLabels);

  // Filtros reactivos
  [tipoSwitch, filtroTipoRegistro, filtroEmpresa, filtroNombres, filtroDocumento, filtroMotivo, filtroFechaDesde, filtroFechaHasta].forEach(el => {
    el.addEventListener('input', renderTabla);
  });
  limpiarFiltros.addEventListener('click', function() {
    filtroTipoRegistro.value = '';
    filtroEmpresa.value = '';
    filtroNombres.value = '';
    filtroDocumento.value = '';
    filtroMotivo.value = '';
    filtroFechaDesde.value = '';
    filtroFechaHasta.value = '';
    renderTabla();
  });

  await cargarRegistros();
});

document.getElementById('cerrarSesionCliente').onclick = function() {
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
};

document.getElementById('descargarExcel').onclick = function() {
  const vehicular = tipoSwitch.checked;
  const columnasPeatonal = [
    'FechaHora', 'Usuario', 'TipoRegistro', 'Empresa', 'Nombres', 'Documento', 'Motivo', 'FotoDni'
  ];
  const columnasVehicular = [
    'FechaHora', 'Usuario', 'TipoRegistro', 'Empresa', 'Nombres', 'Documento', 'PlacaTracto', 'PlacaCarreta', 'Motivo', 'FotoDni', 'FotoVehiculo', 'FotoPosterior'
  ];
  const columnas = vehicular ? columnasVehicular : columnasPeatonal;
  const filtrados = aplicarFiltros(registros);
  let csv = '';
  csv += columnas.join(',') + '\n';
  filtrados.forEach(r => {
    csv += columnas.map(col => {
      if (col.startsWith('Foto') && r[col]) {
        return '"' + r[col] + '"';
      }
      let val = r[col] || '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registros_filtrados.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 