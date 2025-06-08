// Obtiene el token CSRF para usarlo en peticiones AJAX
function getCSRFToken() {
    const name = "csrftoken";
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith(name + "="));
    return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : "";
}
