
function fillRandomPassword(pass) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";

    for (let i = 0; i < pass.length; i++)
    randomString += chars.charAt(Math.floor(Math.random() * chars.length))

    let passwordText = document.getElementById("password-text");
    passwordText.innerHTML = randomString;
}

function showPasswordPrompt(hide_notifation = false) {
    let passwordPrompt = document.getElementById("change-password");
    if (passwordPrompt.style.display == "block") return

    passwordPrompt.style.display = "block";

    if (hide_notifation) {
        let passwordNotification = document.getElementById("password-notification");
        passwordNotification.style.display = "none";
    }
}