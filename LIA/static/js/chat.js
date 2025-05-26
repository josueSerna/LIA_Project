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
            }
            conversationIdInput.value = data.message.conversation_id;
            conversationId = data.message.conversation_id;

            // Oculta el mensaje de bienvenida si existe
            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) chatHeader.style.display = 'none';

            // Actualiza el historial por AJAX usando la misma vista
            const newUrl = window.location.pathname + '?conversation_id=' + data.message.conversation_id;
            fetch(newUrl, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
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

        // 2. Mostrar mensaje vacío del bot y hacer streaming de la respuesta
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

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
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop();
            for (const part of parts) {
                if (part.startsWith("data: ")) {
                    const chunkData = JSON.parse(part.slice(6));
                    botMsg.textContent += chunkData.chunk;
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        }
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
            if (sidebar && data.html) {
                sidebar.outerHTML = data.html;
            }
        });
    }
});

