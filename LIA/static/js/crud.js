// Esta función debe estar en el scope global
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
                if (selectedId === convoId.toString()) {
                    window.location.href = "/chat/";
                } else {
                    location.reload();
                }
            }
        });
    }
}

// Esto sí puede ir dentro del DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('textarea[name="message"]');
    const form = document.querySelector('.message-form');

    if (textarea && form) {
        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    const messageContainer = document.querySelector('.messages');
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
});
