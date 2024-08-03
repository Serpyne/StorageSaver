
// Define user settings
var darkMode;

const widgetColor = "rgb(33 63 58)"
const backgroundColor = "#0b312b";

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

function handleScroll(/*Event*/event) {
    scrollToTopButton = document.getElementById("scroll-to-top");
    scrollToTopButton.style = ""
    if (window.scrollY >= 100) {
        scrollToTopButton.style.visibility = "visible";
        scrollToTopButton.style.opacity = 1;
    }
}

function setDark(/*PointerEvent*/event) {
    event.target.style.backgroundColor = widgetColor;
}

function setDarkFiles() {
    // Setting color of rows in File manager
    preRecursionDepth = 20;
    updateDark();
}

let preRecursionDepth;
function updateDark() {
    for (let row of document.getElementsByTagName("tr")) {
        let filename = row.getAttribute("filename");
        if (selected.filter(item => item.name === filename).length > 0)
            row.style.backgroundColor = "rgb(39 57 79)";
        else
            row.style.backgroundColor = "rgb(18 26 21)";
        row.style.color = "#869388";
    }
    for (let img of document.getElementsByClassName("preview-image")) {
        img.style.backgroundColor = "#111211";
    }

    let color = "rgb(35 49 39)";
    let preElements = document.getElementsByTagName("pre");
    for (let pre of preElements) {
        pre.style.backgroundColor = color;
        pre.addEventListener("load", () => {
            pre.style.backgroundColor = color;
        });
    }
    for (let operatorToken of document.getElementsByClassName("token operator"))
        operatorToken.style.backgroundColor = color

    if (preRecursionDepth <= 0)
        return;

    preRecursionDepth--;

    setTimeout("updateDark();", 50);
}

function baseLoadSettings(/*json*/settings) {
    if (!settings)
        return;

    darkMode = settings["darkMode-switch"];

    if (!darkMode)
        return;

    let topLevel = document.getElementById("top-level");
    topLevel.style.backgroundColor = backgroundColor;

    for (let box of document.getElementsByClassName("box"))
        box.style.backgroundColor = widgetColor;
    for (let button of document.getElementsByClassName("menu-button"))
        button.style.backgroundColor = widgetColor;
    for (let button of document.getElementsByClassName("sidebar-button"))
        button.style.backgroundColor = "rgb(60 111 102)";
    document.getElementById("about-link").style.color = "rgb(130 239 196)";

    let menuButton = document.getElementById("menu-button");
    let sideMenu = document.getElementById("sidebar-menu");
    menuButton.style.backgroundColor = widgetColor;
    sideMenu.style.backgroundColor = widgetColor;
    menuButton.addEventListener("click", setDark);
    sideMenu.addEventListener("change", setDark);

    window.addEventListener("load", setDarkFiles);
    window.addEventListener("click", setDarkFiles);
    
    let fileManager = document.getElementById("file-manager");
    if (fileManager) {
        let fileManagerBody = fileManager.firstElementChild;
        fileManagerBody.addEventListener("change", setDarkFiles);
    }
    let uploadQueue = document.getElementById("upload-queue");
    if (uploadQueue)
        uploadQueue.addEventListener("change", setDarkFiles);
}

window.onscroll = handleScroll;
var scrollToTopButton;

window.addEventListener("load", (event) => {
    scrollToTopButton = document.getElementById("scroll-to-top");
    scrollToTopButton.addEventListener("click", () => {window.scrollTo({top: 0, behavior: 'smooth'});})

    sideMenu = document.getElementById("sidebar-menu");
    menuButton = document.getElementById("menu-button");
    menuContainer = document.getElementById("menu-container");
    
    menuContainer.style.maxHeight = "5rem";

    // Scroll to top of page on load
    setTimeout("window.scrollTo(0,0);", 200);
});