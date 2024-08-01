
// Declare HTML elements on load

var body;

var viewer;
var viewerImage;
var viewerMenu;
var viewerResult;

var sidemenu;

var selectionButtons;
var selectionFrame;

var infoButton;
var infoPanel;

var uploadContainer;
var uploadItem;

var galleryBox;

var labelNothing;

function destroyLoadingScreen() {
    /*
    Destroys the spinner loading screen which is displayed when the images are loading.
    */
    let screens = document.getElementsByClassName("overlay-content");
    for (let i = 0; i < screens.length; i++) {
        screens[i].remove()
    }
}

function setState(selectButton, state) {
    if (state == "true") {
        selectButton.setAttribute("state", "true");
        selectButton.src = "static/icons/selected.png";
        selectButton.style.opacity = 1;
        selectButton.parentElement.style.opacity = 1;

    } else if (state == "false") {
        selectButton.setAttribute("state", "false");
        selectButton.src = "static/icons/unselected.png";
        selectButton.style = "";
        selectButton.parentElement.style = "";
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
    // // If there are any selected items, then display the select button on all items.
    // let selectButtons = document.getElementsByClassName("select-button");
    // selected = [];
    // let button;
    // for (let i = 0; i < selectButtons.length; i++) {
    //     button = selectButtons[i];
    //     if (button.getAttribute("state") == "true")
    //         selected.push(button);
    // }

    // if (selected.length > 0) {
    //     for (let i = 0; i < selectButtons.length; i++)
    //         selectButtons[i].style.opacity = 1;
    // } else {
    //     for (let i = 0; i < selectButtons.length; i++)
    //         selectButtons[i].style = "";
    // }

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

function fileIsSelected(file) {
    let filenames = [];
    for (let item of selected)
        filenames.push(item.name);
    return filenames.includes(file.name);
}

function removeFile(file) {
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

let selected = [];

let galleryItems;
function handleSelection(/*json*/file, /*PointerEvent*/event) {
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

let metadata;
let downsizedImage;
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
    viewerImage.src = item.firstElementChild.src;
    viewerResult.style.backgroundImage = `url('${viewerImage.src}')`
    downsizedImage = viewerImage.src;

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

    viewerMenu.style.display = "flex";
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

function toggleDetails() {
    if (infoPanel.style.display == "none") {
        infoPanel.style.maxWidth = '0';
        infoPanel.style.display = "flex";
        setTimeout("infoPanel.style.maxWidth = '100%';", 1);
    } else {
        infoPanel.style.maxWidth = '0';
        setTimeout("infoPanel.style.display = 'none';", 500);
    }
}

function mouseInElement(/*HTMLElement*/element, /*PointerEvent*/event) {
    let mouseX = event.x;
    let mouseY = event.y;
    let rect = element.getBoundingClientRect();
    if ((rect.left < mouseX && rect.right > mouseX) && (rect.top < mouseY && rect.bottom > mouseY)) {
        return true;
    }
    return false;
}

let viewerActive = false;
let lensWidth, lensHeight;
function imageZoom() {
    let cx, cy;
    let viewerImage, lens, viewerResult;

    viewerImage = document.getElementById("viewer-img");
    viewerResult = document.getElementById("viewer-zoom");

    lens = document.createElement("div");
    lens.setAttribute("class", "viewer-lens");
    lens.setAttribute("zoom", "1");

    viewerImage.parentElement.insertBefore(lens, viewerImage);

    for (let event of ["mousemove", "touchmove", "click"]) {
        viewerImage.addEventListener(event, moveLens);
        lens.addEventListener(event, moveLens);
    }

    viewerImage.addEventListener("wheel", changeSize);
    lens.addEventListener("wheel", changeSize);

    function changeSize(/*PointerEvent*/event) {
        if (viewer.style.display !== "flex")
            return;

        // Smooth logarithmic zoom
        let zoom, logZoom;
        zoom = parseFloat(lens.getAttribute("zoom"));
        logZoom = Math.log(zoom) + event.deltaY * 0.0005 // Increments of +-0.05
        logZoom = Math.max(-2, Math.min(1.4, logZoom));
        
        zoom = Math.exp(logZoom);
        lens.setAttribute("zoom", zoom);
        
        // If zoomed in enough, make the result the original quality.
        if (logZoom < -0.6)
            viewerResult.style.backgroundImage = `url('${viewerImage.src}')`;
        else
            viewerResult.style.backgroundImage = `url('${downsizedImage}')`;

        let rect = lens.getBoundingClientRect();
        lens.style.width = `${300 * zoom}px`;
        lens.style.height = `${300 * zoom}px`;

        moveLens(event, force=true);
    }

    function moveLens(/*PointerEvent*/event, /*bool*/force=false) {
        if (!force) {
            // If mouse is not clicked or once mouse is released, return
            if (event.buttons == 0 && event.type !== "click") {
                lens.style.opacity = 0;
                viewerResult.style.opacity = 1;
                return;
            }

            // If pointer is not within the bounds of the image, return
            if (!mouseInElement(viewerImage, event)) {
                lens.style.opacity = 0;
                return;
            }
        }

        // Remove "Click to zoom" overlay on click
        let overlays = viewerResult.children;
        for (let overlay of overlays)
            overlay.remove();

        lens.style.opacity = 1;
        viewerResult.style.opacity = 1;
        viewerActive = true;
        
        event.preventDefault();
        
        // Position of zoomed image
        let x, y;
        
        x = event.x - (lens.offsetWidth / 2);
        y = event.y - (lens.offsetHeight / 2);

        lens.style.left = x + "px";
        lens.style.top = y + "px";

        let rect = viewerImage.getBoundingClientRect();
        let rel_mouse = { 
            x: x - rect.left,
            y: y - rect.top
        };

        cx = viewerResult.offsetHeight / lens.offsetWidth;
        cy = viewerResult.offsetHeight / lens.offsetHeight;

        viewerResult.style.backgroundSize = (viewerImage.width * cx) + "px " + (viewerImage.height * cy) + "px";
        viewerResult.style.backgroundPosition = `${-rel_mouse.x * cx}px ${-rel_mouse.y * cy}px`;
    }
}

function closeViewer(/*PointerEvent*/event, /*bool*/force = false) {
    if (!force) {
        // Only close if mouse click was on the background
        if (mouseInElement(viewerImage, event))
            return;
        // if (event.target !== viewer && event.target !== viewerImage.parentElement)
        //     return;

        // If viewer is active, don't close
        if (viewerActive)
            return;
        // Close the item viewer if it is already open.
        if (viewerImage.style.display == "none")
            return;
    }

    viewer.style.display = "none";
    viewerImage.src = "";
    viewerMenu.style.display = "none";
    
    infoButton.style.display = "none";
    uploadContainer.style.display = "flex";
}

function onItemRightClick(/*PointerEvent*/event, /*HTMLElement*/item) {
    /*
    When an item is right clicked, prevent the normal browser right
    click popup from displaying, then show the solution's popup which
    has selection tools and other.
    */
    event.preventDefault();
    
    let menu = document.getElementById("contextMenu");
    menu.style.display = "block";
    menu.style.left = event.pageX + "px";
    menu.style.top = event.pageY + "px";
}

function hideContextMenu() {
    let menu = document.getElementById("contextMenu");
    menu.style.display = "none";
}

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

    itemOverlay.addEventListener("click", (event) => onItemClick(event, itemOverlay));
    // On right click
    itemOverlay.addEventListener("contextmenu", (event) => onItemRightClick(event, itemOverlay));

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

function removeUploadItem(/*HTMLElement*/uploadItem) {
    uploadItem.style.transition = "opacity 1.5s";
    uploadItem.style.setProperty("-webkit-transition", "opacity 1.5s");
    uploadItem.style.opacity = 0;
    setTimeout("uploadItem.remove();", 1500);
}

function createUploadItem(/*string*/fileName) {
    /*
    Creates and appends an upload text display to the upload queue called "upload-queue"
    */
    uploadItem = document.createElement("div");
    uploadItem.className = "upload-item";

    let loading = document.createElement("img");
    loading.className = "loading-image";
    loading.src = "static/icons/loading.gif";
    let uploadText = document.createElement("h1");
    uploadText.innerHTML = `Uploading '${fileName}'...`;
    uploadItem.appendChild(loading);
    uploadItem.appendChild(uploadText);

    let uploadQueue = document.getElementById("upload-queue");
    uploadQueue.appendChild(uploadItem);

    return uploadItem;
}

function sendUploadRequest(/*array*/images, /*bool*/overwrite) {
    // Make request to backend to upload images to database
    let data = {images: images};
    let uploads = [];
    let uploadsFormatted;
    for (let image of data.images) {
        uploads.push(image.name)
    }
    uploadsFormatted = uploads.join(", ");
    if (overwrite)
        data.overwrite = 1;
    else
        createUploadItem(uploadsFormatted);

    fetch("/uploadImage", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
        // On response
        })
        .then(response => response.json())
        // Expect data from response {response<int>, id, name, size, dims}
        .then(data => {
            // If response code is not 200, raise
            if (data.response == 201) {
                // Display overwrite notifcation
                let ending = ''; if (data.files.length > 1) {ending = "s"}
                let buttons = createNotification(`<b>File${ending} with same name as existing file:</b><br> ${data.files.join("<br>")}`, {
                    "overwrite": "Overwrite",
                    "cancel": "Cancel",
                });
                buttons.overwrite.id = "confirm-button";
                buttons.overwrite.addEventListener("click", () => {
                    sendUploadRequest(images, overwrite=true);
                    clearNotifications();
                });
                buttons.cancel.id = "cancel-button";
                buttons.cancel.onclick = clearNotifications;
                return;
            }

            uploadItem.innerHTML = `Uploaded ${uploadsFormatted}.`;
            setTimeout("", 1000 * 15); // After 15 seconds, delete upload item

            for (let item of galleryBox.getElementsByClassName("item-overlay")) {
                let name = item.getAttribute("data-content");
                for (let upload of uploads) {
                    if (name.toLowerCase() === upload.toLowerCase())
                        item.remove();
                    break;
                }
            }

            for (let image of data.images) {
                // Append uploaded image(s) to gallery box, plus exclude any with the same filename
                galleryItem = createGalleryItem(image.name, image.downsized);
            }
        })
        .catch((error) => console.log(error));
}

function uploadEvent() {
    // Callback for the upload button
    let uploadButton = document.getElementById("upload-button");
    let url = uploadButton.value;
    let ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
    if (uploadButton.files && uploadButton.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg")) {
        let images = [];

        let uploadCount = 0;

        let reader;
        let fileJson;
        let imageB64;
        for (let i = 0; i < uploadButton.files.length; i++) {
            reader = new FileReader();
            let file = uploadButton.files[i];
            reader.onload = function (e) {
                imageB64 = e.target.result;
                fileJson = {
                    name: file.name,
                    value: imageB64
                };
                images.push(fileJson);
                
                uploadCount++;

                // Once last file is read, make upload request to backend
                if (uploadCount === uploadButton.files.length)
                    sendUploadRequest(images);
            };
            reader.readAsDataURL(file);
        }
    }
}

function deleteImages() {
    let removedItems = [];
    for (let item of selected) {
        removedItems.push(item.name);
    }

    buttons = createNotification(`<b>Are you sure you want to delete these images?</b><br> ${removedItems.join("<br>")}`, {
        "confirm": "Yes",
        "cancel": "No"
    });
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        for (let item of removedItems) {
            console.log(item)
            getElementFromFileName(item).remove();
        }
        // Add images to recently deleted
        fetch("/archiveFiles", {
            method: "POST",
            body: JSON.stringify({
                images: removedItems
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
            })
            .then(response => response.json())
            .then(data => {})

        selectionFrame.style.display = "none";
        if (galleryBox.getElementsByClassName("gallery-item").length === 0)
            labelNothing.style.display = "";
        clearNotifications();
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;

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

    // Context menu
    document.onclick = hideContextMenu;

    selectionFrame = document.getElementById("selection-buttons");
    selectionButtons = document.getElementsByClassName("selection-button");
    for (let i = 0; i < selectionButtons.length; i++)
        selectionButtons[i].style.display = "none";
            
    // Reset viewer on mouse down
    document.addEventListener("mousedown", () => {viewerActive = false;});
    
    body = document.getElementsByClassName("hero-body")[0];
    let menu = document.getElementById("contextMenu");
    body.appendChild(menu);

    // More declaration
    galleryBox = document.getElementById("gallery-box");

    let navbar = document.getElementsByClassName("navbar")[0];
    let galleryNav = document.getElementById("gallery-container");
    navbar.appendChild(galleryNav);
    
    sidemenu = document.getElementById("sidebar-menu");
    menuButton = document.getElementById("menu-button");
    
    menuButton.addEventListener("click", (event) => {
        if (sidemenu.getAttribute("state") === "closed")
            return;

        // When menu opened, if viewer is open, close viewer
        if (viewer.style.display === "flex")
            closeViewer(event, force=true);
    });

    labelNothing = document.getElementById("label-nothing");

    // Viewer declaration
    viewer = document.getElementById("viewer");
    viewerImage = document.getElementById("viewer-img");
    viewerMenu = document.getElementById("viewer-menu");
    viewerResult = document.getElementById("viewer-zoom");
    infoButton = document.getElementById("info-button");
    infoPanel = document.getElementById("info-panel")

    viewer.addEventListener("click", (event) => closeViewer(event))
    body.appendChild(viewer);
    viewerImage.parentElement.addEventListener("click", (event) => closeViewer(event));

    imageZoom();

    // Add upload queue to body element
    let uploadQueue = document.getElementById("upload-queue");
    body.appendChild(uploadQueue);

    // Add callback function to upload button
    let uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", () => uploadEvent());
    uploadContainer = document.getElementById("upload");
});
