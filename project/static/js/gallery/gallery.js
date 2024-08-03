/*
The main script for the Gallery page.
Holds functions for image selection, the click event for a gallery item, image viewing, uploading and archiving
*/

// Define user settings
var imageZoomSpeed;

// Declare HTML elements on load
var body;
var sidemenu;

// Image selection buttons on the top right.
var selectionButtons;
var selectionFrame;

// Declare image information panel elements.
var infoButton;
var infoPanel;

// Shows the upload notifications in the bottom left.
var uploadContainer;
var uploadItem;

// Array of all currently selected images.
let selected = [];

// Label is shown if there are no images in the gallery.
var labelNothing;

// Declare viewer elements
var viewer;
var viewerImage;
var viewerResult;
let metadata;
let viewerFileName;
let downsizedImage;

// Declare gallery elements
var galleryBox;
let galleryItems;

function destroyLoadingScreen() {
    /*
    Destroys the spinner loading screen which is displayed when the images are loading.
    */
    let screens = document.getElementsByClassName("overlay-content");
    for (let i = 0; i < screens.length; i++) {
        screens[i].remove()
    }
}

function setState(/*HTMLElement*/selectButton, /*string*/state) {
    /*
    Set the state of a select button within an image.
    */
    let foreground = selectButton.parentElement.getElementsByClassName("item-foreground")[0];
    if (state == "true") {
        selectButton.setAttribute("state", "true");
        selectButton.src = "static/icons/selected.png";
        selectButton.style.opacity = 1;
        foreground.style.opacity = 0.7;

    } else if (state == "false") {
        selectButton.setAttribute("state", "false");
        selectButton.src = "static/icons/unselected.png";
        selectButton.style = "";
        foreground.style = "";
    }
}

/*
DEPRECATED SELECT FUNCTION
function selectEvent(selectButton) {
    // On select button click, its state is toggled and then decides if other
    // buttons should appear in conjunction to one button being selected.
    let state = selectButton.getAttribute("state");
    if (state == "false") {
        selectButton.setAttribute("state", "true");
        selectButton.src = "static/icons/selected.png";
    } else if (state == "true") {
        selectButton.setAttribute("state", "false");
        selectButton.src = "static/icons/unselected.png";
    }

    checkSelected();
}
*/

function checkSelected() {
    /*
    If there are any selected items, then display the select button on all items.
    Returns the list of selected items.
    */
    // Show bar with deselect all, select all
    let buttonsMenu = document.getElementById("buttons-menu");
    let uploadFrame = document.getElementById("upload");
    if (selected.length > 0) {
        buttonsMenu.style.backgroundColor = "white";
        uploadFrame.style.display = "none";
        selectionFrame.style.display = "flex";

        for (let i = 0; i < selectionButtons.length; i++)
            selectionButtons[i].style.display = "inline-flex";
                
    } else {
        buttonsMenu.style = "";
        uploadFrame.style = "";
        selectionFrame.style.display = "none";
    }

    return selected;
}

function deselectAll() {
    /*
    Deselect all currently selected images and change their states to false.
    */
    let selectButtons = document.getElementsByClassName("select-button");
    let button;
    for (let i = 0; i < selectButtons.length; i++) {
        button = selectButtons[i];
        setState(button, "false");
    }
    selected = [];

    checkSelected();
}

function selectAll() {
    /*
    Select all images in the gallery and set their state to true.
    */
    let selectButtons = document.getElementsByClassName("select-button");
    let button;
    selected = [];
    
    for (let i = 0; i < selectButtons.length; i++) {
        button = selectButtons[i];
        setState(button, "true");
        data = {name: button.parentElement.getAttribute("data-content")};
        selected.push(data);
    }

    checkSelected();
}

function fileIsSelected(/*json*/file) {
    /*
    Check if a file is selected.
    Parameter 'file' is in the format {name: ...}
    Returns a boolean value.
    */
    let filenames = [];
    for (let item of selected)
        filenames.push(item.name);
    return filenames.includes(file.name);
}

function removeFile(/*json*/file) {
    /*
    Deselect a currently selected file.
    Parameter 'file' is in the format {name: ...}
    */ 
    for (let i in selected) {
        item = selected[i];
        if (item.name === file.name) {
            selected.splice(i, 1);
            return;
        }
    }
}

function getElementFromFileName(/*string*/filename) {
    /*
    Finds a the image element in the gallery from a filename
    If it is not found, null is returned.
    */
    for (let image of galleryBox.children) {
        if (image.getAttribute("data-content") === filename)
            return image;
    }
    return null;
}

function handleSelection(/*json*/file, /*PointerEvent*/event) {
    /*
    Handles image selection within the gallery.
    All selected items are populated within the 'selected' array.
    */
    let image = getElementFromFileName(file.name);
    galleryItems = galleryBox.getElementsByClassName("item-overlay");
    
    // Normal mouse click
    if (!event.shiftKey && !event.ctrlKey) {
        // If selected items is more than one, then perform 'ctrl' action.
        handleSelection(file, {shiftKey: false, ctrlKey: true});
        return;

    // Click + ctrl - select individual files
    } else if (!event.shiftKey && event.ctrlKey) {
        if (fileIsSelected(file)) {
            // Deselect file if already selected
            removeFile(file);
            setState(getElementFromFileName(file.name).lastElementChild, "true");
        }
        else
            selected.push(file);
    
    // Click + shift - selected all files between previously selected file and current file
    } else if (event.shiftKey && !event.ctrlKey) {
        // If no items are selected at first.
        if (selected.length === 0) {
            handleSelection(file, {shiftKey: false, ctrlKey: true});
            return;
        }

        previous = getElementFromFileName(selected[selected.length - 1].name);
        current = image;

        let gallerySquares = Array.from(galleryItems);
        previousIndex = gallerySquares.indexOf(previous);
        currentIndex = gallerySquares.indexOf(current);

        // If both previous and selected elements are equal, then run the 'ctrl' routine
        if (previousIndex === currentIndex) {
            if (selected.length === 1)
                selected = [];
            handleSelection(file, {shiftKey: false, ctrlKey: true});
            return;
        }

        // If previous index is not before current index, swap the indices
        if (currentIndex < previousIndex) {
            let temp = previousIndex;
            previousIndex = currentIndex;
            currentIndex = temp;
        }

        for (let i = previousIndex + 1; i < currentIndex; i++) {
            let _row = gallerySquares[i];
            let data = {name: _row.getAttribute("data-content")}
            if (!fileIsSelected(data)) {
                selected.push(data);
            }
        }

        selected.push(file);
    // Does not support ctrl + shift + click action
    } else
        return;

    for (let file of galleryItems)
        setState(file.lastElementChild, "false");

    for (let item of selected)
        setState(getElementFromFileName(item.name).lastElementChild, "true");

    checkSelected();

}

function onItemClick(/*PointerEvent*/event, /*HTMLElement*/item) {
    /*
    Logic performed when a gallery item is clicked.
    - Close the subroutine if the element clicked
        is not the picture
    - A ctrl click will select the item individually
    - A shift click will select all of the items between the previously clicked item and the current one.
    - Clicking it normally will focus on the image.
    - If any amount of items are selected, then just
        clicking on the item will select it too.
    */

    let selectButton = item.lastElementChild;
   
    if (event.target === selectButton)
        return;

    image = {
        name: item.getAttribute("data-content")
    }

    // If item is shift-clicked, perform select logic.
    if (event.shiftKey || event.ctrlKey || selected.length > 0) {
        // selectEvent(selectButton);
        handleSelection(image, event);
        return;
    }

    if (sidemenu.getAttribute("state") == "open")
        toggleMenu();

    // Display the viewer and show the image in low quality (first)
    viewer.style.display = "flex";
    let galleryImage = item.getElementsByClassName("gallery-item")[0];
    viewerImage.src = galleryImage.src;
    viewerResult.style.backgroundImage = `url('${viewerImage.src}')`
    downsizedImage = viewerImage.src;
    viewerFileName = image.name

    let overlays = viewerResult.children;
    for (let overlay of overlays)
        overlay.remove();

    let overlay = document.createElement("div");
    overlay.className = "zoom-notif";
    overlay.innerHTML = "Click image on left to zoom";
    
    viewerResult.appendChild(overlay);

    // Show info button
    infoButton.style.display = "flex";
    infoPanel.innerHTML = "";

    // Make result viewer square
    viewerResult.style.width = `${viewerResult.getBoundingClientRect().height}px`;

    uploadContainer.style.display = "none";

    // Get image data from backend
    let fileName = item.getAttribute("data-content");
    fetch("/getImage", {
        method: "POST",
        body: JSON.stringify({
            name: fileName,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
        })
        .then(response => response.json())
        .then(data => {
            viewerImage.src = data.base64;
            viewerResult.style.backgroundImage = `url('${data.downsized}')`
            downsizedImage = data.downsized;
            viewerFileName = fileName;

            let len = viewerFileName.length;
            if (viewerFileName.slice(len - 3, len).toLowerCase() === "gif")
                viewerResult.style.backgroundImage = `url('${data.base64}')`;

            metadata = data.metadata;
            // Populate info panel / image details
            for (let key in metadata) {
                let row = document.createElement("div");
                let name = document.createElement("h1");
                let value = document.createElement("h1");

                row.appendChild(name);
                row.appendChild(value);
                row.className = "info-row";

                name.innerHTML = key;
                value.innerHTML = metadata[key];
                value.style.fontWeight = "100";
                
                infoPanel.appendChild(row);
            }
        
        })
        .catch((error) => {
            console.log(error);
            viewer.style.display = "none";
        });
}

// DEPRECATED CONTEXT MENU FUNCTION
// function onItemRightClick(/*PointerEvent*/event, /*HTMLElement*/item) {
//     /*
//     When an item is right clicked, prevent the normal browser right
//     click popup from displaying, then show the solution's popup which
//     has selection tools and other.
//     */
//     event.preventDefault();
    
//     let menu = document.getElementById("contextMenu");
//     menu.style.display = "block";
//     menu.style.left = event.pageX + "px";
//     menu.style.top = event.pageY + "px";
// }

// function hideContextMenu() {
//     let menu = document.getElementById("contextMenu");
//     menu.style.display = "none";
// }

function createGalleryItem(/*string*/alt, /*string*/src) {
    /*
    Create a web element for a gallery item within the div "gallery-box"
    Parameters:
        alt<string>, the name of the image file
        src<string>, the image in base64
    */

    galleryBox = document.getElementById("gallery-box");

    let itemOverlay = document.createElement("div");
    itemOverlay.className = "item-overlay";
    itemOverlay.setAttribute("data-content", alt);

    let grey = document.createElement("div");
    grey.id = "item-foreground";
    grey.className = "item-foreground";

    let nameSplit = alt.split(".");
    let ext = nameSplit[nameSplit.length - 1];
    if (ext.toLowerCase() === "gif") {
        let label = document.createElement("h1");
        label.innerHTML = "GIF";
        label.className = "gif-label"
        itemOverlay.appendChild(label);
    }

    itemOverlay.append(grey);

    itemOverlay.addEventListener("click", (event) => onItemClick(event, itemOverlay));
    // On right click
    // itemOverlay.addEventListener("contextmenu", (event) => onItemRightClick(event, itemOverlay));

    let selectButton = document.createElement("img");
    selectButton.className = "select-button";
    selectButton.src = "static/icons/unselected.png";
    selectButton.setAttribute("state", "false");

    selectButton.addEventListener("click", (event) => handleSelection({name: alt}, event));
    
    // Append gallery item to HTML
    let galleryItem = document.createElement("img");
    galleryItem.className = "gallery-item";
    galleryItem.alt = alt;
    galleryItem.src = src;
    galleryItem.style.marginInline = ".25rem"

    itemOverlay.appendChild(galleryItem);
    itemOverlay.appendChild(selectButton);

    galleryBox.appendChild(itemOverlay);

    // If "There's nothing here.. Add something?" label is still there (must be zero images), then it is deleted.
    labelNothing = document.getElementById("label-nothing");
    labelNothing.style.display = "none";

    return galleryItem;
}

function loadSettings(/*json*/settings) {
    /*
    In the gallery, the setting required is
    how much the image zooms in and out per each mouse scroll.
    */
    imageZoomSpeed = settings["imageZoom-slider"];
}

window.addEventListener("load", (event) => {
    /*
    Once the webpage has loaded:
        - context menu is added to body element
        - the upload queue is added as a child to the body element
        - callback is added to the upload button which:
            => reads the image data as base64
            => sends a POST request to the backend to add the image data to database
            => an 'uploading..' notification is displayed
            => the image is shown in the gallery
            => notification updated to 'uploaded.'
            => deletes the label "There's nothing here" in gallery if it exists.
    */

    // Declaring the image selection panel
    selectionFrame = document.getElementById("selection-buttons");
    selectionButtons = document.getElementsByClassName("selection-button");
    for (let i = 0; i < selectionButtons.length; i++)
        selectionButtons[i].style.display = "none";
            
    // Reset viewer on mouse down
    document.addEventListener("mousedown", () => {viewerActive = false;});
    
    // Declaration of HTML body, gallery, and menu elements 
    body = document.getElementsByClassName("hero-body")[0];
    let menu = document.getElementById("contextMenu");

    galleryBox = document.getElementById("gallery-box");

    let navbar = document.getElementsByClassName("navbar")[0];
    let galleryNav = document.getElementById("gallery-container");
    navbar.appendChild(galleryNav);
    
    sidemenu = document.getElementById("sidebar-menu");
    menuButton = document.getElementById("menu-button");
    
    // Viewer declaration
    viewer = document.getElementById("viewer");
    viewerImage = document.getElementById("viewer-img");
    viewerResult = document.getElementById("viewer-zoom");
    infoButton = document.getElementById("info-button");
    infoPanel = document.getElementById("info-panel")

    viewer.addEventListener("click", (event) => closeViewer(event))
    body.appendChild(viewer);
    viewerImage.parentElement.addEventListener("click", (event) => closeViewer(event));

    imageZoom();

    // Closes the viewer if sidebar menu button is clicked.
    menuButton.addEventListener("click", (event) => {
        if (sidemenu.getAttribute("state") === "closed")
            return;

        // When menu opened, if viewer is open, close viewer
        if (viewer.style.display === "flex")
            closeViewer(event, force=true);
    });

    labelNothing = document.getElementById("label-nothing");

    // Add upload queue to body element
    let uploadQueue = document.getElementById("upload-queue");
    body.appendChild(uploadQueue);

    // Add callback function to upload button
    let uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", () => uploadEvent());
    uploadContainer = document.getElementById("upload");
});
