document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('.message-form');
    const textarea = form.querySelector('textarea[name="message"]');
    const messagesContainer = document.querySelector('.messages');
    let conversationIdInput = form.querySelector('input[name="conversation_id"]');
    const sendButton = form.querySelector('.send-btn');
    const stopButton = document.getElementById('stop-button');
    const iconSend = document.getElementById('icon-send');
    let isInterrupted = false;
    let reader;
    let currentStreamController = null;
    let thinkingInterval = null;
    window.copyCode = copyCode;

    const imageInput = document.getElementById('image-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    // Evento para eliminar la imagen
    removeImageBtn.addEventListener('click', function(e) {
        e.preventDefault();
        imageInput.value = '';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
        removeImageBtn.style.display = 'none';
        clearImageError();
    });

    imageInput.addEventListener('change', function (event) {
        clearImageError();
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                showImageError("Solo se permiten imágenes PNG o JPG.");
                imageInput.value = '';
                imagePreviewContainer.style.display = 'none';
                return;
            }
            if ((file.type === 'image/png' && file.size > 1.5 * 1024 * 1024) ||
                (file.type === 'image/jpeg' && file.size > 500 * 1024)) {
                showImageError("La imagen excede el tamaño permitido.");
                imageInput.value = '';
                imagePreviewContainer.style.display = 'none';
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    if ((file.type === 'image/png' && (img.width > 1024 || img.height > 1024)) ||
                        (file.type === 'image/jpeg' && (img.width > 672 || img.height > 672))) {
                        showImageError("La resolución máxima es 1024x1024 para PNG y 672x672 para JPG.");
                        imageInput.value = '';
                        imagePreviewContainer.style.display = 'none';
                        return;
                    }
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                    removeImageBtn.style.display = 'block';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            imagePreviewContainer.style.display = 'none';
        }
    });

    if (!form || !textarea || !messagesContainer) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Cancelar cualquier petición anterior
        if (currentStreamController) {
            currentStreamController.abort();
            currentStreamController = null;
        }
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
        
        isInterrupted = false;
        clearImageError();
        const userText = textarea.value.trim();
        if (!userText && !imageInput.files[0]) return;

        let conversationId = conversationIdInput?.value || null;

        let imageBase64 = null;
        if (imageInput && imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            imageBase64 = await toBase64(file);
        }

        const response = await fetch("/chat/save_user_message/", {
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
        const data = await response.json();
        if (!data.message) return;

        if (!conversationId && data.message.conversation_id) {
            if (!conversationIdInput) {
                conversationIdInput = document.createElement('input');
                conversationIdInput.type = 'hidden';
                conversationIdInput.name = 'conversation_id';
                form.appendChild(conversationIdInput);
            }
            conversationIdInput.value = data.message.conversation_id;
            conversationId = data.message.conversation_id;

            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) chatHeader.style.display = 'none';

            const newUrl = window.location.pathname + '?conversation_id=' + data.message.conversation_id;
            fetch(newUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(resp => resp.json())
                .then(data => {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) sidebar.outerHTML = data.html;
                });
        }

        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.textContent = userText;
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

        textarea.value = '';
        textarea.style.height = 'auto';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
        removeImageBtn.style.display = 'none';
        imageInput.value = '';
        clearImageError();

        reloadSidebar();

        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Mostrar estado de "pensando"
        thinkingInterval = startThinkingAnimation(botMsg);

        textarea.disabled = true;
        sendButton.style.display = 'none';
        stopButton.style.display = 'inline-block';

        stopButton.onclick = () => {
            isInterrupted = true;
            if (reader) {
                reader.cancel().catch(() => {});
                reader = null;
            }
            if (currentStreamController) {
                currentStreamController.abort();
                currentStreamController = null;
            }
            if (thinkingInterval) {
                clearInterval(thinkingInterval);
                thinkingInterval = null;
            }
            botMsg.textContent = "Respuesta interrumpida";
            textarea.disabled = false;
            sendButton.style.display = 'inline-block';
            stopButton.style.display = 'none';
        };

        currentStreamController = new AbortController();
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
            }),
            signal: currentStreamController.signal
        });

        // Detener animación "Pensando..." al recibir respuesta
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
        botMsg.textContent = "";

        reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullMessage = "";

        try {
            while (!isInterrupted) {
                const { done, value } = await reader.read();
                if (done || isInterrupted) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop();
                for (const part of parts) {
                    if (isInterrupted) break;
                    if (part.startsWith("data: ")) {
                        const chunkData = JSON.parse(part.slice(6));
                        fullMessage += chunkData.chunk;
                        botMsg.innerHTML = formatMessage(fullMessage);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                    if (window.Prism) Prism.highlightAllUnder(botMsg);
                }
            }
        } catch (err) {
            if (!isInterrupted) {
                botMsg.textContent = "Ocurrió un error al recibir la respuesta.";
            }
        } finally {
            if (isInterrupted) {
                reader.cancel().catch(() => {});
                reader = null;
            }
        }

        textarea.disabled = false;
        sendButton.style.display = 'inline-block';
        stopButton.style.display = 'none';
        currentStreamController = null;
        return false;
    });

    function reloadSidebar() {
        fetch(window.location.pathname, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && data.html) sidebar.outerHTML = data.html;
        });
    }

    function startThinkingAnimation(element) {
        let dots = 0;
        const interval = setInterval(() => {
            dots = (dots % 3) + 1;
            element.textContent = 'Pensando' + '.'.repeat(dots);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 500);
        return interval;
    }

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

    function unescapeHtml(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    function formatMessage(text) {
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        return text.replace(codeRegex, (match, lang, code) => {
            const languageClass = lang ? `language-${lang}` : '';
            return `<div class="code-block">
                        <button class="copy-btn" onclick="copyCode(this)">Copiar</button>
                        <pre><code class="${languageClass}">${escapeHtml(code)}</code></pre>
                    </div>`;
        });
    }

    document.querySelectorAll('.message.bot').forEach(function(msg) {
        msg.innerHTML = formatMessage(unescapeHtml(msg.innerHTML));
    });
    if (window.Prism) Prism.highlightAll();

    function copyCode(btn) {
        const codeBlock = btn.parentNode;
        const codeElement = codeBlock.querySelector("pre code");
        const textToCopy = codeElement.innerText || codeElement.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                btn.textContent = "Copiado!";
                setTimeout(() => btn.textContent = "Copiar", 2000);
            })
            .catch(err => {
                console.error("Error al copiar el código:", err);
                btn.textContent = "Error";
            });
    }

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

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