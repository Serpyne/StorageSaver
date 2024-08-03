/*
Functions called in base.js (The base web template) to enable dark mode.
The appropriate HTML elements are set to a different colour to match teh dark mode theme.
The functions are called if darkMode-switch is on in user settings.
*/

const widgetColor = "rgb(33 63 58)"
const backgroundColor = "#0b312b";

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
