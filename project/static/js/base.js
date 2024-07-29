
// Declare elements
let sideMenu;
let menuButton;

function toggleMenu() {
    if (sideMenu.getAttribute("state") == "closed") {
        sideMenu.style.maxWidth = "20rem";
        sideMenu.style.maxHeight = "50rem";
        sideMenu.style.padding = "1rem";

        sideMenu.setAttribute("state", "open")
    } else {
        sideMenu.style.maxWidth = "0";
        sideMenu.style.maxHeight = "0";
        sideMenu.style.padding = "0";
        
        sideMenu.setAttribute("state", "closed")
    }
}


window.addEventListener("load", (event) => {
    sideMenu = document.getElementById("sidebar-menu")
    menuButton = document.getElementById("menu-button");
});