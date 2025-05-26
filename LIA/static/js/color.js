// Ejecutar cuando se carga la página
document.addEventListener("DOMContentLoaded", function () {
    const savedColor = localStorage.getItem("backgroundColor");
    if (savedColor) {
        document.body.style.background = savedColor;
        document.body.style.color = "#FFFFFF";

        // Activar el checkbox si el fondo es el alternativo
        if (savedColor.includes("#A9C5EE") || savedColor.includes("#AFC1D9")) {
            document.getElementById("checkbox").checked = true;
            
            // Si estamos en home.html, aplicar la paleta específica
            if (window.location.pathname.includes('home')) {
                applyHomeColorPalette();
            }
        }
    }

    // Asignar evento al botón para alternar color
    document.querySelector('.switch-btn')?.addEventListener('click', function () {
        this.classList.toggle('active');
        changeButtonColor();
    });
});

// Función para aplicar la paleta de colores específica del home
function applyHomeColorPalette() {
    const root = document.documentElement;
    
    // Actualizar las variables CSS
    root.style.setProperty('--color-bg-general', '#AFC1D9');
    root.style.setProperty('--color-bg-sidebar', '#256F96');
    root.style.setProperty('--color-chat-input-bg', '#C0CBD9');
    root.style.setProperty('--color-texto', '#19283E');
    root.style.setProperty('--borde-chat-input', '#C0CBD9');
    root.style.setProperty('--color-sidebar-item', 'rgba(192, 203, 217, 0.3)');
    root.style.setProperty('--color-sidebar-item-hover', 'rgba(192, 203, 217, 0.4)');
    root.style.setProperty('--color-sidebar-item-active', 'rgba(192, 203, 217, 0.5)');
    root.style.setProperty('--color-mensaje-user', 'rgba(192, 203, 217, 0.5)');
    root.style.setProperty('--color-mensaje-bot', 'rgba(192, 203, 217, 0.3)');
    root.style.setProperty('--borde-mensaje-bot', '#19283E');
}

// Función única para cambiar color y guardar en localStorage
function changeButtonColor() {
    let color;
    const checkbox = document.getElementById("checkbox");

    if (checkbox.checked) {
        if (window.location.pathname.includes('home')) {
            color = '#AFC1D9'; // Color alternativo para home
            applyHomeColorPalette();
        } else {
            color = 'linear-gradient(to bottom right, #27759D 5%, #A9C5EE 50%, #974D98 100%)'; // Alternativo para otros
        }
    } else {
        if (window.location.pathname.includes('home')) {
            color = '#031227'; // Color original para home
            resetHomeColorPalette();
        } else {
            color = 'linear-gradient(to bottom right, #27759D 5%, #031227 50%, #974D98 100%)'; // Original para otros
        }
    }

    document.body.style.background = color;
    document.body.style.color = "#FFFFFF";
    localStorage.setItem("backgroundColor", color);
}

// Función para resetear la paleta de colores del home al estado original
function resetHomeColorPalette() {
    const root = document.documentElement;
    
    // Restaurar las variables CSS originales
    root.style.setProperty('--color-bg-general', '#031227');
    root.style.setProperty('--color-bg-sidebar', '#020D1D');
    root.style.setProperty('--color-chat-input-bg', 'rgba(217, 217, 217, 0.06)');
    root.style.setProperty('--color-texto', '#fff');
    root.style.setProperty('--borde-chat-input', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--color-sidebar-item', 'rgba(217, 217, 217, 0.06)');
    root.style.setProperty('--color-sidebar-item-hover', 'rgba(217, 217, 217, 0.1)');
    root.style.setProperty('--color-sidebar-item-active', 'rgba(217, 217, 217, 0.12)');
    root.style.setProperty('--color-mensaje-user', 'rgba(217, 217, 217, 0.12)');
    root.style.setProperty('--color-mensaje-bot', 'rgba(217, 217, 217, 0.12)');
    root.style.setProperty('--borde-mensaje-bot', 'rgba(255, 255, 255, 0.8)');
}