
// Declare elements
let sideMenu;
let menuButton;
let menuContainer;

function toggleMenu() {
    if (sideMenu.getAttribute("state") == "closed") {
        sideMenu.style.maxWidth = "20rem";
        menuContainer.style.maxHeight = "";
        sideMenu.style.paddingInline = '1rem';
        sideMenu.setAttribute("state", "open");
        menuButton.style.backgroundColor = "#00b89c";
    } else {
        sideMenu.style.maxWidth = "0";
        menuContainer.style.maxHeight = "5rem";
        sideMenu.setAttribute("state", "closed");
        setTimeout("sideMenu.style.paddingInline = '0';", 400);
        menuButton.style.backgroundColor = "";
    }
}

window.addEventListener("load", (event) => {
    sideMenu = document.getElementById("sidebar-menu");
    menuButton = document.getElementById("menu-button");
    menuContainer = document.getElementById("menu-container");
    
    menuContainer.style.maxHeight = "5rem";
});