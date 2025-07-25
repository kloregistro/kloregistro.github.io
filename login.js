document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn = this.querySelector('.login-btn');
  const icon = btn.querySelector('.fa-play');
  btn.disabled = true;
  icon.classList.add('spin');

  if (!usuario || !password) {
    document.getElementById('loginError').textContent = 'Por favor complete todos los campos.';
    btn.disabled = false;
    icon.classList.remove('spin');
    return;
  }
  
  try {
    const result = await callBackend('login', { usuario, password });
    
    if (result.status === 'success') {
      localStorage.setItem('usuario', usuario);
      if (result.tipo === 'vigilante') {
        window.location.href = 'vigilante.html';
      } else if (result.tipo === 'cliente') {
        window.location.href = `cliente.html?logo=${encodeURIComponent(result.logo || '')}`;
      } else {
        document.getElementById('loginError').textContent = 'Tipo de usuario no reconocido.';
      }
    } else {
      document.getElementById('loginError').textContent = result.message || 'Error en el login.';
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    document.getElementById('loginError').textContent = 'Error de conexión. Verifique su conexión a internet.';
  } finally {
    btn.disabled = false;
    icon.classList.remove('spin');
  }
}); 