document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('.message-form');
    const textarea = form.querySelector('textarea[name="message"]');
    const messagesContainer = document.querySelector('.messages');
    let conversationIdInput = form.querySelector('input[name="conversation_id"]');

    if (!form || !textarea || !messagesContainer) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const userText = textarea.value.trim();
        if (!userText) return;

        let conversationId = conversationIdInput?.value || null;

        // 1. Enviar mensaje del usuario al backend y mostrarlo de inmediato
        const response = await fetch("/chat/save_user_message/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                message: userText,
                conversation_id: conversationId
            })
        });
        const data = await response.json();
        if (!data.message) return;

        // Si es el primer mensaje, actualiza el conversation_id y el historial por AJAX
        if (!conversationId && data.message.conversation_id) {
            // Crear input hidden si no existe
            if (!conversationIdInput) {
                conversationIdInput = document.createElement('input');
                conversationIdInput.type = 'hidden';
                conversationIdInput.name = 'conversation_id';
                form.appendChild(conversationIdInput);
            }
            conversationIdInput.value = data.message.conversation_id;
            conversationId = data.message.conversation_id;

            // Oculta el mensaje de bienvenida si existe
            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) chatHeader.style.display = 'none';

            // Actualiza el historial por AJAX usando la misma vista
            const newUrl = window.location.pathname + '?conversation_id=' + data.message.conversation_id;
            fetch(newUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(resp => resp.json())
                .then(data => {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) {
                        sidebar.outerHTML = data.html;
                    }
                });
        }
        
        // Mostrar mensaje del usuario en la interfaz
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.textContent = userText;
        messagesContainer.appendChild(userMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Limpiar textarea
        textarea.value = '';
        textarea.style.height = 'auto';

        // Recargar la barra lateral para actualizar el historial
        reloadSidebar();

        // 2. Mostrar mensaje vacío del bot y la animación de "pensando"
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Inicia la animación de "pensando"
        const thinkingInterval = startThinkingAnimation(botMsg);

        // 3. Iniciar streaming de la respuesta de la IA
        const streamResponse = await fetch("/chat/stream_bot_response/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                message: userText,
                conversation_id: conversationId
            })
        });

        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullMessage = "";

        // Cuando empiece a llegar datos, detén la animación
        clearInterval(thinkingInterval);
        botMsg.textContent = "";  // Limpia el mensaje y reemplázalo con la respuesta

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop();
            for (const part of parts) {
                if (part.startsWith("data: ")) {
                    const chunkData = JSON.parse(part.slice(6));
                    fullMessage += chunkData.chunk;
                    // Se usa innerHTML para que se interprete el HTML generado por formatMessage
                    botMsg.innerHTML = formatMessage(fullMessage);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                // Llama a Prism para resaltar el código dentro del mensaje del bot
                if (window.Prism) {
                    Prism.highlightAllUnder(botMsg);
                }
            }
        }
        return false;
    });

    // Función para recargar el sidebar tras enviar mensaje
    function reloadSidebar() {
        fetch(window.location.pathname, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && data.html) {
                sidebar.outerHTML = data.html;
            }
        });
    }

    // Agrega esta función para la animación de "pensando"
    function startThinkingAnimation(element) {
        let dots = 0;
        const interval = setInterval(() => {
            dots = (dots % 3) + 1;
            element.textContent = 'Pensando' + '.'.repeat(dots);
        }, 500);
        return interval;
    }

    // Función para escapar caracteres HTML peligrosos.
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // Función para "desescapar" HTML (convierte entidades en caracteres originales)
    function unescapeHtml(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Función para formatear el mensaje y reemplazar bloques de código delimitados
    // por triple backticks por un contenedor con estilo y resaltado de sintaxis
    function formatMessage(text) {
        // Regex para detectar bloques de código: ```lenguaje\n ... \n```
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        return text.replace(codeRegex, (match, lang, code) => {
            const languageClass = lang ? `language-${lang}` : '';
            return `<div class="code-block"><pre><code class="${languageClass}">${escapeHtml(code)}</code></pre></div>`;
        });
    }

    // Al cargar la página, formatea los mensajes del bot ya renderizados
    // Desescapa el HTML y luego aplica el formateo para los bloques de código.
    document.querySelectorAll('.message.bot').forEach(function(msg) {
        msg.innerHTML = formatMessage(unescapeHtml(msg.innerHTML));
    });
    // Llama a Prism para resaltar el código
    if (window.Prism) {
        Prism.highlightAll();
    }
});

