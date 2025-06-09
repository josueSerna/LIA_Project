// Abre o cierra el menú de opciones "⋯"
function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    const isOpen = menu.style.display === "block";

    // Cierra todos los menús primero
    document.querySelectorAll('.dropdown-menu').forEach(el => el.style.display = 'none');

    // Abre el menú seleccionado si estaba cerrado
    if (!isOpen) {
        menu.style.display = "block";
    }
}

// Cierra cualquier menú si se hace clic afuera
document.addEventListener('click', function (event) {
    if (!event.target.matches('.options-btn')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});
