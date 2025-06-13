document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('.message-form');
    const textarea = form.querySelector('textarea[name="message"]');
    const messagesContainer = document.querySelector('.messages');
    let conversationIdInput = form.querySelector('input[name="conversation_id"]');
    window.copyCode = copyCode;

    // --- NUEVO: Elementos para imagen ---
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');

    // --- NUEVO: Previsualización y validación de imagen ---
    imageInput.addEventListener('change', function (event) {
        clearImageError();
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            // Validar tipo
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                showImageError("Solo se permiten imágenes PNG o JPG.");
                imageInput.value = '';
                imagePreview.style.display = 'none';
                return;
            }
            // Validar tamaño
            if ((file.type === 'image/png' && file.size > 1.5 * 1024 * 1024) ||
                (file.type === 'image/jpeg' && file.size > 500 * 1024)) {
                showImageError("La imagen excede el tamaño permitido.");
                imageInput.value = '';
                imagePreview.style.display = 'none';
                return;
            }
            // Validar resolución
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    if ((file.type === 'image/png' && (img.width > 1024 || img.height > 1024)) ||
                        (file.type === 'image/jpeg' && (img.width > 672 || img.height > 672))) {
                        showImageError("La resolución máxima es 1024x1024 para PNG y 672x672 para JPG.");
                        imageInput.value = '';
                        imagePreview.style.display = 'none';
                        return;
                    }
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.style.display = 'none';
        }
    });

    if (!form || !textarea || !messagesContainer) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        clearImageError();

        const userText = textarea.value.trim();
        if (!userText) return;

        let conversationId = conversationIdInput?.value || null;

        // --- NUEVO: Leer la imagen (si hay) ---
        let imageBase64 = null;
        if (imageInput && imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            imageBase64 = await toBase64(file);
        }

        // 1. Enviar mensaje del usuario al backend y mostrarlo de inmediato
        const response = await fetch("/chat/save_user_message/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                message: userText,
                conversation_id: conversationId,
                image: imageBase64 // <-- NUEVO: enviar imagen si existe
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
        // --- NUEVO: Mostrar imagen en el mensaje si existe ---
        if (imageBase64) {
            const br = document.createElement('br');
            userMsg.appendChild(br);
            const img = document.createElement('img');
            img.src = imageBase64;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.marginTop = '5px';
            userMsg.appendChild(img);
        }
        messagesContainer.appendChild(userMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Limpiar textarea y previsualización de imagen
        textarea.value = '';
        textarea.style.height = 'auto';
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        imageInput.value = '';
        clearImageError();

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
                conversation_id: conversationId,
                image: imageBase64 
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
            return `<div class="code-block">
                        <button class="copy-btn" onclick="copyCode(this)">Copiar</button>
                        <pre><code class="${languageClass}">${escapeHtml(code)}</code></pre>
                    </div>`;
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

    // Función para copiar el código al portapapeles
    function copyCode(btn) {
        // Busca el elemento <code> dentro del contenedor .code-block
        const codeBlock = btn.parentNode;
        const codeElement = codeBlock.querySelector("pre code");
        const textToCopy = codeElement.innerText || codeElement.textContent;
        
        // Usa la API del portapapeles, requiere HTTPS o localhost
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                btn.textContent = "Copiado!";
                setTimeout(() => {
                    btn.textContent = "Copiar";
                }, 2000);
            })
            .catch(err => {
                console.error("Error al copiar el código:", err);
                btn.textContent = "Error";
            });
    }

    // --- NUEVO: Función para convertir archivo a base64 ---
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- NUEVO: Mostrar errores de imagen ---
    function showImageError(msg) {
        let errorDiv = document.getElementById('image-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'image-error';
            errorDiv.style.color = 'red';
            errorDiv.style.marginTop = '5px';
            document.querySelector('.message-form').appendChild(errorDiv);
        }
        errorDiv.textContent = msg;
    }
    function clearImageError() {
        const errorDiv = document.getElementById('image-error');
        if (errorDiv) errorDiv.textContent = '';
    }
});

