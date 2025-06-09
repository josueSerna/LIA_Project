// Ejecutar cuando se carga la página
document.addEventListener("DOMContentLoaded", function () {
    const isAltTheme = localStorage.getItem("isAltTheme") === 'true';
    const pathname = window.location.pathname;
    const isHome = pathname === '/' || pathname.endsWith('index.html') || pathname.endsWith('home.html');

    if (isAltTheme) {
        const checkbox = document.getElementById("checkbox");
        if (checkbox) checkbox.checked = true;

        if (isHome) {
            applySpecificHomePalette();
            document.body.style.background = '#AFC1D9';
        } else {
            document.body.style.background = 'linear-gradient(to bottom right, #27759D 5%, #A9C5EE 50%, #974D98 100%)';
        }

        document.body.style.color = "#19283E";
    }

    // Evento para cambiar tema
    document.querySelector('.switch-btn')?.addEventListener('click', function () {
        this.classList.toggle('active');
        changeButtonColor();
    });
});

function changeButtonColor() {
    const checkbox = document.getElementById("checkbox");
    const pathname = window.location.pathname;
    const isHome = pathname === '/' || pathname.endsWith('index.html') || pathname.endsWith('home.html');

    localStorage.setItem("isAltTheme", checkbox.checked);

    if (checkbox.checked) {
        if (isHome) {
            applySpecificHomePalette();
            document.body.style.background = '#AFC1D9'; // Sólido en home
        } else {
            resetHomeColorPalette(); // por si venimos del home
            document.body.style.background = 'linear-gradient(to bottom right, #27759D 5%, #A9C5EE 50%, #974D98 100%)';
        }
        document.body.style.color = "#19283E";
    } else {
        if (isHome) {
            resetHomeColorPalette();
            document.body.style.background = '#031227';
        } else {
            document.body.style.background = 'linear-gradient(to bottom right, #27759D 5%, #031227 50%, #974D98 100%)';
        }
        document.body.style.color = "#FFFFFF";
    }
}

// Tema claro sólido SOLO para home.html
function applySpecificHomePalette() {
    const root = document.documentElement;

    root.style.setProperty('--color-bg-general', '#AFC1D9');
    root.style.setProperty('--color-bg-sidebar', '#256F96');
    root.style.setProperty('--color-chat-input-bg', '#C0CBD9');
    root.style.setProperty('--color-texto', '#19283E');
    root.style.setProperty('--borde-chat-input', '#19283E');
    root.style.setProperty('--color-sidebar-item', '#C0CBD9');
    root.style.setProperty('--color-sidebar-item-hover', '#B0C0D0');
    root.style.setProperty('--color-sidebar-item-active', '#A0B0C0');
    root.style.setProperty('--color-mensaje-user', '#C0CBD9');
    root.style.setProperty('--color-mensaje-bot', '#B5C7D8');
    root.style.setProperty('--borde-mensaje-bot', '#19283E');

    // Mensajes de usuario
    document.querySelectorAll('.message.user').forEach(el => {
        el.style.color = '#19283E';
        el.style.borderColor = '#19283E';
        el.style.backgroundColor = '#C0CBD9';
    });

    // Mensajes del bot
    document.querySelectorAll('.message.bot').forEach(el => {
        el.style.color = '#19283E';
        el.style.borderColor = '#19283E';
        el.style.backgroundColor = '#B5C7D8';
    });

    // Botón enviar
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.style.backgroundColor = '#256F96';
        sendBtn.style.color = '#ffffff';
    }
}

function resetHomeColorPalette() {
    const root = document.documentElement;

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

    // Restaurar mensajes usuario y botón
    document.querySelectorAll('.message.user').forEach(el => {
        el.style.color = '#0EFBAF';
        el.style.borderColor = '#0EFBAF';
        el.style.backgroundColor = '';
    });

    document.querySelectorAll('.message.bot').forEach(el => {
        el.style.color = '';
        el.style.borderColor = '';
        el.style.backgroundColor = '';
    });

    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.style.backgroundColor = '#0EFBAF';
        sendBtn.style.color = '';
    }
}
