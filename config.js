
// Configuración centralizada del sistema
const CONFIG = {
  // URL del Apps Script desplegado
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzvaGwTskLt8AWY9E8-91cHj1Yz18Fprf2xkr_u0C6QcN4JoeS4CvKtFR9Zo3MPoaq_/exec',
  
  // Configuración de Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: 'dcxezyakl',
    UPLOAD_PRESET: 'KLO_GOES'
  },
  
  // Configuración del Google Sheet
  SPREADSHEET_ID: '1gFdBeXJIS6A9IjvoQCD47QlVus7r6SUsPLcDNWuO7vI'
};

// Función para hacer peticiones al backend
async function callBackend(action, params = {}) {
  const requestBody = new URLSearchParams({
    action,
    ...params
  });
  
  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: requestBody
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
} 
