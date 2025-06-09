// Configuración de paletas de colores
const colorPalettes = {
  home: {
    dark: {
      background: '#031227',
      general: '#031227',
      sidebar: '#020D1D',
      chatInputBg: 'rgba(217, 217, 217, 0.06)',
      text: '#fff',
      chatInputBorder: 'rgba(255, 255, 255, 0.08)',
      sidebarItem: 'rgba(217, 217, 217, 0.06)',
      sidebarItemHover: 'rgba(217, 217, 217, 0.1)',
      sidebarItemActive: 'rgba(217, 217, 217, 0.12)',
      userMessage: 'rgba(217, 217, 217, 0.12)',
      botMessage: 'rgba(217, 217, 217, 0.12)',
      botMessageBorder: 'rgba(255, 255, 255, 0.8)',
      newChatBtnBg: 'rgba(217, 217, 217, 0.06)',
      newChatBtnBorder: 'rgba(255, 255, 255, 0.08)',
      newChatBtnHover: 'rgba(217, 217, 217, 0.12)',
      sendBtnBg: '#0EFBAF',
      sendBtnActive: '#0ccf8f',
      userMessageColor: '#0EFBAF',
      userMessageBorder: '#0EFBAF',
      scrollbarThumb: 'rgba(255, 255, 255, 0.2)',
      footerNote: '#aaa',
      sendIcon: '#000'
    },
    light: {
      background: '#AFC1D9',
      general: '#AFC1D9',
      sidebar: '#256F96',
      chatInputBg: '#D9D9D9',
      text: '#19283E',
      sidebarText: '#FFFFFF',
      chatInputBorder: '#D9D9D9',
      sidebarItem: 'rgba(217, 217, 217, 0.2)',
      sidebarItemHover: 'rgba(217, 217, 217, 0.3)',
      sidebarItemActive: 'rgba(217, 217, 217, 0.4)',
      userMessage: 'rgba(217, 217, 217, 0.5)',
      botMessage: 'rgba(217, 217, 217, 0.3)',
      botMessageBorder: '#19283E',
      historyChat: 'rgba(217, 217, 217, 0.2)',
      newChatBtnBg: 'rgba(217, 217, 217, 0.3)',
      newChatBtnBorder: 'rgba(255, 255, 255, 0.3)',
      newChatBtnHover: 'rgba(217, 217, 217, 0.4)',
      sendBtnBg: '#256F96',
      sendBtnActive: '#0ccf8f',
      userMessageColor: '#256F96',
      userMessageBorder: '#256F96',
      scrollbarThumb: 'rgba(255, 255, 255, 0.3)',
      footerNote: '#19283E',
      sendIcon: '#fff'
    }
  },
  gradientPages: {
    dark: {
      background: 'linear-gradient(to bottom right, #27759D 5%, #031227 50%, #974D98 100%)',
      text: '#FFFFFF'
    },
    light: {
      background: 'linear-gradient(to bottom right, #27759D 5%, #A9C5EE 50%, #974D98 100%)',
      text: '#FFFFFF'
    }
  }
};

// Lista de páginas que deben usar gradiente
const GRADIENT_PAGES = ['login', 'register', 'password', 'profile'];

// Determina el tipo de página actual
function getPageType() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('home') || path === '/' || path.endsWith('/home/')) {
    return 'home';
  }
  
  if (GRADIENT_PAGES.some(page => path.includes(page))) {
    return 'gradientPages';
  }
  
  return 'home'; // Por defecto usa home
}

// Aplica la paleta de colores correcta
function applyColorPalette(palette) {
  const root = document.documentElement;
  
  // Aplicar estilos base
  document.body.style.background = palette.background;
  document.body.style.color = palette.text;
  
  // Aplicar todas las variables CSS
  const cssVars = {
    '--color-bg-general': palette.general,
    '--color-bg-sidebar': palette.sidebar,
    '--color-chat-input-bg': palette.chatInputBg,
    '--color-texto': palette.text,
    '--sidebar-text': palette.sidebarText || palette.text,
    '--borde-chat-input': palette.chatInputBorder,
    '--color-sidebar-item': palette.sidebarItem,
    '--color-sidebar-item-hover': palette.sidebarItemHover,
    '--color-sidebar-item-active': palette.sidebarItemActive,
    '--color-mensaje-user': palette.userMessage,
    '--color-mensaje-bot': palette.botMessage,
    '--borde-mensaje-bot': palette.botMessageBorder,
    '--history-chat': palette.historyChat || palette.sidebarItem,
    '--new-chat-btn-bg': palette.newChatBtnBg,
    '--new-chat-btn-border': palette.newChatBtnBorder,
    '--new-chat-btn-hover': palette.newChatBtnHover,
    '--send-btn-bg': palette.sendBtnBg,
    '--send-btn-active': palette.sendBtnActive,
    '--user-message-color': palette.userMessageColor,
    '--user-message-border': palette.userMessageBorder,
    '--scrollbar-thumb': palette.scrollbarThumb || 'rgba(255, 255, 255, 0.2)',
    '--footer-note': palette.footerNote,
    '--send-icon' : palette.sendIcon,
  };
  
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Carga el tema guardado
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  const checkbox = document.getElementById("checkbox");
  
  if (savedTheme) {
    checkbox.checked = savedTheme === "light";
    applyCurrentTheme();
  } else {
    // Tema por defecto (dark)
    checkbox.checked = false;
    applyCurrentTheme();
  }
  
  // Sincronizar el estado visual del botón
  const toggleBtn = document.querySelector('.switch-btn');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', checkbox.checked);
  }
}

// Aplica el tema actual basado en el checkbox
function applyCurrentTheme() {
  const checkbox = document.getElementById("checkbox");
  const isLightMode = checkbox.checked;
  const pageType = getPageType();
  
  // Seleccionar la paleta correcta
  let palette;
  if (pageType === 'home') {
    palette = isLightMode ? colorPalettes.home.light : colorPalettes.home.dark;
  } else {
    palette = isLightMode ? colorPalettes.gradientPages.light : colorPalettes.gradientPages.dark;
  }
  
  applyColorPalette(palette);
  
  // Guardar preferencias
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
  localStorage.setItem("backgroundColor", document.body.style.background);
}

// Configura los event listeners
function setupEventListeners() {
  // Checkbox change
  const checkbox = document.getElementById("checkbox");
  if (checkbox) {
    checkbox.addEventListener('change', function() {
      applyCurrentTheme();
      
      // Actualizar estado visual del botón si existe
      const toggleBtn = document.querySelector('.switch-btn');
      if (toggleBtn) {
        toggleBtn.classList.toggle('active', this.checked);
      }
    });
  }
  
  // Botón visual (si existe)
  const toggleBtn = document.querySelector('.switch-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const checkbox = document.getElementById("checkbox");
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", function() {
  // Asegurarse que el checkbox existe
  if (!document.getElementById("checkbox")) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'checkbox';
    checkbox.style.display = 'none';
    document.body.appendChild(checkbox);
  }
  
  setupEventListeners();
  loadSavedTheme();
});