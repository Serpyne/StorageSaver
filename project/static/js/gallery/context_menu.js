/*
Subroutines involved with the context menu (menu that shows up when an element is right-clicked)
Note: the way that images are selected involves compiling the HTML element for storing the gallery item,
which differs from the file manager system of storing the file data as a JSON.
Therefore, we need different systems for selection with the context menu.
This includes:
    - Copying and pasting (which has duplicate file protection and overwrite prompts to the user)
    - Renaming files
    - Selecting files (the same action as when the user clicks a file with the 'ctrl' key pressed down).
    - File deletion
    - Events for hiding and showing the context menu
    - Validating the file name (required as pasting takes the text from the user's clipboard).
*/

function hideContextMenu() {
    contextItem = null;
    contextMenu.style.display = "none";
}

function showContextMenu(/*PointerEvent*/event) {
    contextMenu.style.display = "block";
    contextMenu.style.left = event.pageX + "px";
    contextMenu.style.top = event.pageY + "px";

    navigator.clipboard.readText()
    .then(text => {
        let copiedItems = text.split(", ");
        if (copiedItems.length > 0) {
            pasteButton.style.display = "block";
        }
    });
}

let contextItem;
function handleContextMenu(/*PointerEvent*/event) {
    /*
    When an item is right clicked, prevent the normal browser right
    click popup from displaying, then show the solution's popup which
    has selection tools and other.
    */
    event.preventDefault();
    hideContextMenu();

    if (event.target.className === "item-overlay")
        contextItem = event.target;
    else if (event.target.parentElement.className === "item-overlay")
        contextItem = event.target.parentElement;
    else
        return;


    showContextMenu(event);
}

function selectEvent() {
    if (!contextItem)
        return;

    let name = contextItem.getAttribute("data-content");

    handleSelection({name: name}, {shiftKey: false, ctrlKey: true});
    
    checkSelected();
}

function renameEvent() {
    if (!contextItem)
        return;

    navigator.clipboard.writeText(contextItem.getAttribute("data-content"))
}

function copyEvent() {
    if (selected.length == 0) {
        if (!contextItem)
            return;
        let name = contextItem.getAttribute("data-content");
        navigator.clipboard.writeText(name);
    } else {
        let filenames = [];
        for (let image of selected)
            filenames.push(image.name)
        navigator.clipboard.writeText(filenames.join(', '));
    }
}

function pasteEvent() {
    navigator.clipboard.readText()
    .then(text => {
        let filenames = text.split(", ");
        
        let allFiles = galleryBox.getElementsByClassName("item-overlay");
        let allFileNames = [];
        for (let item of allFiles)
            allFileNames.push(item.getAttribute("data-content"));

        for (let name of filenames) {
            
            fetch("/copyFile", {
                method: "POST",
                body: JSON.stringify({name: name}),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then(response => response.json())
            .then(data => {
                if (allFileNames.includes(name)) {
                    let galleryItem = allFiles[allFileNames.indexOf(name)];
                    let newItem = galleryItem.cloneNode(true);
                    newItem.setAttribute("data-content", data.name);
                    newItem.alt = data.name;
                    galleryBox.appendChild(newItem);
                }
            })
            .catch(error => console.log(error));
        }
    })
    .catch(error => console.log(error));
}

function deleteEvent() {
    if (selected.length > 0) {
        deleteImages();
        return;
    }

    if (!contextItem)
        return;

    let data = {name: contextItem.getAttribute("data-content")};
    selected.push(data);
    deleteImages();
}

var contextMenu;
var copyButton;
var pasteButton;
var pasteButtonLabel;
var deleteButton;

var selectionPasteButton;

var contextMenu;

window.addEventListener("load", (event) => {
    contextMenu = document.getElementById("contextMenu");
    document.oncontextmenu = handleContextMenu;
    document.onclick = hideContextMenu;

    copyButton = document.getElementById("context-copy");
    pasteButton = document.getElementById("context-paste");
    pasteButtonLabel = pasteButton.firstElementChild;
    deleteButton = document.getElementById("context-delete");

    selectionPasteButton = document.getElementById("paste-button");

    // Rename button is not used in the gallery.
    document.getElementById("context-rename").remove();
});