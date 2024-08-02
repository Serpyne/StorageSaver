
// Declare elements
let sideMenu;
let menuButton;
let menuContainer;

function clearNotifications() {
    let notifications = document.getElementsByClassName("notification-overlay");
    for (let _notification of notifications)
        _notification.remove();
}

let notification;
function createNotification(/*string*/text, /*json*/options) {
    /*
    Create a notification: 'text' being the notification title
    and options in the format:
    {title: text, title2: text2, ...}
    */

    notification = document.createElement("div");

    notification.className = "notification-overlay";
    let prompt = document.createElement("div");
    notification.appendChild(prompt);
    prompt.className = "notification";
    prompt.innerHTML = `<h1 style='color: black;'>${text}</h1>`;

    let buttonsDiv = document.createElement("div");
    buttonsDiv.className = "row";

    let buttons = {};

    for (let option in options) {
        let button = document.createElement("h1");
        button.className = "notification-button";
        button.innerHTML = options[option];
        buttons[option] = button;
        buttonsDiv.appendChild(button);
    }
    prompt.appendChild(buttonsDiv);

    document.getElementById("top-level").appendChild(notification);

    return buttons;
}

function toggleMenu() {
    if (sideMenu.getAttribute("state") == "closed") {
        sideMenu.style.maxWidth = "20rem";
        menuContainer.style.maxHeight = "";
        sideMenu.style.paddingInline = '1rem';
        sideMenu.setAttribute("state", "open");
        menuButton.style.backgroundColor = "#00b89c";
    } else {
        sideMenu.style.maxWidth = "0";
        sideMenu.setAttribute("state", "closed");
        setTimeout("sideMenu.style.paddingInline = '0'; menuContainer.style.maxHeight = '5rem';", 400);
        menuButton.style.backgroundColor = "";
    }
}

window.addEventListener("load", (event) => {
    sideMenu = document.getElementById("sidebar-menu");
    menuButton = document.getElementById("menu-button");
    menuContainer = document.getElementById("menu-container");
    
    menuContainer.style.maxHeight = "5rem";

    // Scroll to top of page on load
    setTimeout("window.scrollTo(0,0);", 200);
});