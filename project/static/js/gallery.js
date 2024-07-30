
// Declare HTML elements on load

let body;
let notification;

let viewer;
let viewerImage;
let viewerMenu;
let viewerResult;

let sidemenu;

let infoButton;
let infoPanel;

let uploadContainer;
let uploadItem;

let galleryBox;

function destroyLoadingScreen() {
    /*
    Destroys the spinner loading screen which is displayed when the images are loading.
    */
    let screens = document.getElementsByClassName("overlay-content");
    for (let i = 0; i < screens.length; i++) {
        screens[i].remove()
    }
}

function selectEvent(selectButton) {
    /* On select button click, its state is toggled and then decides if other
    buttons should appear in conjunction to one button being selected.*/
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
let selected = [];
function checkSelected() {
    // If there are any selected items, then display the select button on all items.
    let selectButtons = document.getElementsByClassName("select-button");
    selected = [];
    let button;
    for (let i = 0; i < selectButtons.length; i++) {
        button = selectButtons[i];
        if (button.getAttribute("state") == "true")
            selected.push(button);
    }

    if (selected.length > 0) {
        for (let i = 0; i < selectButtons.length; i++)
            selectButtons[i].style.opacity = 1;
    } else {
        for (let i = 0; i < selectButtons.length; i++)
            selectButtons[i].style = "";
    }

    // Show bar with deselect all, select all
    let buttonsMenu = document.getElementById("buttons-menu");
    let uploadFrame = document.getElementById("upload");
    let selectionFrame = document.getElementById("selection-buttons");
    if (selected.length > 0) {
        buttonsMenu.style.backgroundColor = "white";
        uploadFrame.style.display = "none";
        selectionFrame.style.display = "flex";

        let selectionButtons = document.getElementById("selection-buttons").children;
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
        button.src = "/static/icons/unselected.png";
        button.setAttribute("state", "false");
    }

    checkSelected();
}

function selectAll() {
    let selectButtons = document.getElementsByClassName("select-button");
    let button;
    for (let i = 0; i < selectButtons.length; i++) {
        button = selectButtons[i];
        button.src = "/static/icons/selected.png";
        button.setAttribute("state", "true");
    }

    checkSelected();
}

let metadata;
let downsizedImage;
function onItemClick(/*PointerEvent*/event, /*HTMLElement*/item) {
    /*
    Logic performed when a gallery item is clicked.
    - Close the subroutine if the element clicked
        is not the picture
    - A shift click will select the item
    - Clicking it normally will focus on the image.
    - If any amount of items are selected, then just
        clicking on the item will select it too.
    */

   let selectButton = item.lastElementChild;
   
   if (event.target === selectButton)
    return;

    // If item is shift-clicked, perform select logic.
    if (event.shiftKey) {
        selectEvent(selectButton);
        return;
    }

    if (selected.length > 0) {
        selectEvent(selectButton)
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
        if (event.target !== viewer)
            return;

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

    selectButton.addEventListener("click", (event) => selectEvent(selectButton));
    
    // Append gallery item to HTML
    let galleryItem = document.createElement("img");
    galleryItem.className = "gallery-item";
    galleryItem.alt = alt;
    galleryItem.src = src;
    galleryItem.style.marginInline = ".25rem"

    itemOverlay.appendChild(galleryItem);
    itemOverlay.appendChild(selectButton);

    galleryBox.appendChild(itemOverlay);

    return galleryItem;
}

function createUploadItem(/*string*/fileName) {
    /*
    Creates and appends an upload text display to the upload queue called "upload-queue"
    */
    uploadItem = document.createElement("h1");
    uploadItem.className = "upload-item";
    uploadItem.innerHTML = `Uploading '${fileName}'...`;

    let uploadQueue = document.getElementById("upload-queue");
    uploadQueue.appendChild(uploadItem);

    return uploadItem;
}

function overwriteFile(/*string*/filename, /*string*/value) {
    fetch("/uploadImage", {
        method: "POST",
        body: JSON.stringify({
            name: filename,
            value: value,
            overwrite: true
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
        })
        .then(response => response.json())
        .then(data => {
            uploadItem.innerHTML = `Overwrote ${filename}.`;
            
            let image_downsized = data.downsized;
            // Replace image with overwritten file
            for (let item of galleryBox.children) 
                if (item.getAttribute("data-content") === filename)
                    item.firstElementChild.src = image_downsized;
        })
        .catch((error) => console.log(error));

    clearNotifications();
}

function clearNotifications() {
    let notifications = document.getElementsByClassName("notification-overlay");
    for (let _notification of notifications)
        _notification.remove();
}

function createNotification(/*string*/text, /*json*/options) {

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

function uploadEvent() {
    // Callback for the upload button
    let uploadButton = document.getElementById("upload-button");
    let url = uploadButton.value;
    let ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
    if (uploadButton.files && uploadButton.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg")) {
        var reader = new FileReader();

        let fileName = uploadButton.files[0].name;
        
        reader.onload = function (e) {
            let imageB64 = e.target.result;

            // Make request to backend to upload image to database
            fetch("/uploadImage", {
                method: "POST",
                body: JSON.stringify({
                    name: fileName,
                    value: imageB64
                }),
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
                        let buttons = createNotification("File has the same name as an existing file.", {
                            "overwrite": "Overwrite",
                            "cancel": "Cancel",
                        });
                        buttons.overwrite.id = "confirm-button";
                        buttons.overwrite.addEventListener("click", () => overwriteFile(fileName, imageB64));
                        buttons.cancel.id = "cancel-button";
                        buttons.cancel.onclick = clearNotifications;
                        return;
                    }
                    let image_dimensions = data.dims;
                    let image_downsized = data.downsized;
                    let image_size = data.size;
                    uploadItem.innerHTML = `Uploaded ${fileName}.`;

                    // Append uploaded image(s) to gallery box
                    let galleryItem = createGalleryItem(fileName, image_downsized);
                })
                .catch((error) => console.log(error));

            // If "There's nothing here.. Add something?" label is still there (must be zero images), then it is deleted.
            let labelNothing = document.getElementById("label-nothing");
            if (labelNothing)
                labelNothing.remove();
        }

        reader.readAsDataURL(uploadButton.files[0]);

        // Show user that image has been uploaded
        let uploadItem = createUploadItem(fileName);

    }
}

function deleteImages() {
    buttons = createNotification("Are you sure?", {
        "confirm": "Yes",
        "cancel": "No"
    });
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        let removedItems = [];
        let item;
        for (let _select of selected) {
            item = _select.parentElement;
            removedItems.push(item.getAttribute("data-content"));
            item.remove();
        }

        // Add images to recently deleted
        fetch("/archiveImages", {
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

    // Viewer declaration
    viewer = document.getElementById("viewer");
    viewerImage = document.getElementById("viewer-img");
    viewerMenu = document.getElementById("viewer-menu");
    viewerResult = document.getElementById("viewer-zoom");
    infoButton = document.getElementById("info-button");
    infoPanel = document.getElementById("info-panel")

    viewer.addEventListener("click", (event) => closeViewer(event))
    body.appendChild(viewer);

    imageZoom();

    let selectionButtons = document.getElementsByClassName("selection-button");
    for (let i = 0; i < selectionButtons.length; i++)
        selectionButtons[i].style.display = "none";
            
    // Add upload queue to body element
    let uploadQueue = document.getElementById("upload-queue");
    body.appendChild(uploadQueue);

    // Add callback function to upload button
    let uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", () => uploadEvent());
    uploadContainer = document.getElementById("upload");
});
