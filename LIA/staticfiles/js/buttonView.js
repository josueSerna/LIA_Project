
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        let errorMessages = document.querySelectorAll(".error-message");
        errorMessages.forEach(function (msg) {
            msg.style.display = "none";
        });
    }, 5000); 
});


function togglePassword(button) {
    let passwordField = button.previousElementSibling;
    let icon = button.querySelector("img");

    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.src = "/static/images/lia-visible-btn.png"; 
    } else {
        passwordField.type = "password";
        icon.src = "/static/images/lia-invisible-btn.png"; 
    }
}