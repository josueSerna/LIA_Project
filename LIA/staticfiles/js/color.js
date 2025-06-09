// Configuración completa de paletas de colores
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
      botMessageBorder: 'rgba(255, 255, 255, 0.8)'
    },
    light: {
      background: '#AFC1D9',
      general: '#AFC1D9',
      sidebar: '#256F96',       // Ventana del historial
      chatInputBg: '#D9D9D9',   // Input para texto
      text: '#19283E',          // Color de texto principal
      sidebarText: '#FFFFFF',   // Texto e iconos en historial
      chatInputBorder: '#D9D9D9',
      sidebarItem: 'rgba(217, 217, 217, 0.3)',        // Items del historial
      sidebarItemHover: 'rgba(217, 217, 217, 0.4)',
      sidebarItemActive: 'rgba(217, 217, 217, 0.5)',
      userMessage: 'rgba(217, 217, 217, 0.5)',
      botMessage: 'rgba(217, 217, 217, 0.3)',
      botMessageBorder: '#19283E',
      historyChat: 'rgba(217, 217, 217, 0.2)'  // Chat en historial más transparente
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
  },
  neutralPages: {
    dark: {
      background: '#031227',
      text: '#FFFFFF'
    },
    light: {
      background: '#AFC1D9',
      text: '#19283E'
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
  
  return 'neutralPages';
}

// Aplica la paleta de colores correcta
function applyColorPalette(palette) {
  const root = document.documentElement;
  const pageType = getPageType();
  
  // Aplicar fondo y color de texto base
  document.body.style.background = palette.background;
  document.body.style.color = palette.text;
  
  // Solo aplicar variables CSS para home
  if (pageType === 'home') {
    Object.keys(palette).forEach(key => {
      if (key !== 'background' && key !== 'text') {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, palette[key]);
      }
    });
  }
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
  switch(pageType) {
    case 'home':
      palette = isLightMode ? colorPalettes.home.light : colorPalettes.home.dark;
      break;
    case 'gradientPages':
      palette = isLightMode ? colorPalettes.gradientPages.light : colorPalettes.gradientPages.dark;
      break;
    default:
      palette = isLightMode ? colorPalettes.neutralPages.light : colorPalettes.neutralPages.dark;
  }
  
  applyColorPalette(palette);
  
  // Guardar preferencias
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
  localStorage.setItem("backgroundColor", document.body.style.background);
}

// Configura los event listeners
function setupEventListeners() {
  // Checkbox change
  document.getElementById("checkbox").addEventListener('change', function() {
    applyCurrentTheme();
    
    // Actualizar estado visual del botón si existe
    const toggleBtn = document.querySelector('.switch-btn');
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', this.checked);
    }
  });
  
  // Botón visual (si existe)
  const toggleBtn = document.querySelector('.switch-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const checkbox = document.getElementById("checkbox");
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
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