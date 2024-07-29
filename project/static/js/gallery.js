
let viewer;
let viewerImage;

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

        let selectionButtons = document.getElementsByClassName("selection-button");
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

let cx, cy;
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

    // First show a low quality version
    viewer.style.display = "flex";
    viewerImage.src = item.firstElementChild.src;
    let img = document.getElementById("viewer-img");
    let result = document.getElementById("viewer-zoom");
    result.style.backgroundImage = `url('${viewerImage.src}')`

    let lens = document.getElementsByClassName("viewer-lens")[0];
    cx = result.offsetWidth / lens.offsetWidth;
    cy = result.offsetHeight / lens.offsetHeight;

    result.style.backgroundSize = (img.width * cx) + "px " + (img.height * cy) + "px";

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
            result.style.backgroundImage = `url('${data.downsized}')`
        })
        .catch((error) => {
            console.log(error);
            viewer.style.display = "none";
        });
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
function imageZoom() {
    let img, lens, result;

    img = document.getElementById("viewer-img");
    result = document.getElementById("viewer-zoom");

    lens = document.createElement("div");
    lens.setAttribute("class", "viewer-lens");

    img.parentElement.insertBefore(lens, img);

    lens.addEventListener("mousemove", moveLens);
    img.addEventListener("mousemove", moveLens);

    lens.addEventListener("touchmove", moveLens);
    img.addEventListener("touchmove", moveLens);

    function moveLens(/*PointerEvent*/event) {
        // If mouse is not clicked, return
        if (event.buttons == 0) {
            lens.style.opacity = 0;
            return;
        }

        // If pointer is not within the bounds of the image, return
        if (!mouseInElement(img, event)) {
            lens.style.opacity = 0;
            return;
        }

        lens.style.opacity = 1;
        viewerActive = true;
        
        // Position of zoomed image
        let x, y;
        
        event.preventDefault();
        
        x = event.x - (lens.offsetWidth / 2);
        y = event.y - (lens.offsetHeight / 2);

        let rect = img.getBoundingClientRect();
        let rel_mouse = { 
            x: x - rect.left,
            y: y - rect.top
        };

        lens.style.left = x + "px";
        lens.style.top = y + "px";

        result.style.backgroundPosition = `${-rel_mouse.x * cx}px ${-rel_mouse.y * cy}px`;
    }
}

function closeViewer(/*PointerEvent*/event) {
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
    else {
        viewer.style.display = "none";
        viewerImage.src = "";
    }
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

    let galleryBox = document.getElementById("gallery-box");

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
    let uploadItem = document.createElement("h1");
    uploadItem.className = "upload-item";
    uploadItem.innerHTML = `Uploading '${fileName}'...`;

    let uploadQueue = document.getElementById("upload-queue");
    uploadQueue.appendChild(uploadItem);

    return uploadItem;
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
                // Expect data from response {id, name, size, dims}
                .then(data => {
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
    
    let body = document.getElementsByClassName("hero-body")[0];
    let menu = document.getElementById("contextMenu");
    body.appendChild(menu);
    
    viewer = document.getElementById("viewer");
    viewer.addEventListener("click", (event) => closeViewer(event))
    viewerImage = document.getElementById("viewer-img");
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
});
