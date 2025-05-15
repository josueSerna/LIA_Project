// Renombra una conversación usando prompt() y fetch
function renameConversation(convoId) {
    const newTitle = prompt("Nuevo nombre para la conversación:");
    if (newTitle) {
        fetch(`/chat/rename/${convoId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify({ summary: newTitle })
        }).then(response => {
            if (response.ok) {
                window.location.href = "/chat/?conversation_id=" + convoId;
            }
        });
    }
}

// Elimina una conversación y redirige si era la activa
function deleteConversation(convoId) {
    if (confirm("¿Estás seguro de que quieres eliminar esta conversación?")) {
        fetch(`/chat/delete/${convoId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            }
        }).then(response => {
            if (response.ok) {
                const currentUrl = new URL(window.location.href);
                const selectedId = currentUrl.searchParams.get("conversation_id");

                // Si se elimina la conversación activa, redirige al home sin ID
                if (selectedId === convoId.toString()) {
                    window.location.href = "/chat/";
                } else {
                    location.reload();
                }
            }
        });
    }
}

// funcion para autoajustar el tamaño de un textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}


// Enviar con Enter, Shift+Enter para salto de línea
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('textarea[name="message"]');
    const form = document.querySelector('.message-form');

     // Enviar con Enter
        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.submit();
            }
        });

        // Scroll al fondo al cargar
        const messageContainer = document.querySelector('.messages');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
});

