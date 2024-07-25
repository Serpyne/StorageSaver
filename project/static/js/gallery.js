
function destroyLoadingScreen() {
    /*
    Destroys the spinner loading screen which is displayed when the images are loading.
    */
    let screens = document.getElementsByClassName("overlay-content");
    for (let i = 0; i < screens.length; i++) {
        screens[i].remove()
    }
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

    let selectButton = document.createElement("img");
    selectButton.className = "select-button";
    selectButton.src = "static/icons/unselected.png";
    selectButton.setAttribute("state", "false");
    selectButton.addEventListener("click", (event) => {
        let state = selectButton.getAttribute("state");
        if (state == "false") {
            selectButton.setAttribute("state", "true");
            selectButton.src = "static/icons/selected.png";
        } else if (state == "true") {
            selectButton.setAttribute("state", "false");
            selectButton.src = "static/icons/unselected.png";
        }

        let selectButtons = document.getElementsByClassName("select-button");
        let selected = [];
        let button;
        for (let i = 0; i < selectButtons.length; i++) {
            button = selectButtons[i];
            if (button.getAttribute("state") == "true")
                selected.push(button);
        }

        if (selected.length > 0) {
            console.log(selectButtons);
            for (let i = 0; i < selectButtons.length; i++)
                selectButtons[i].style.opacity = 1;
        } else {
            for (let i = 0; i < selectButtons.length; i++)
                selectButtons[i].style = "";
        }
    });
    
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

window.addEventListener("load", (event) => {
    /*
    Once the webpage has loaded:
        - the upload queue is added as a child to the body element
        - callback is added to the upload button which:
            => reads the image data as base64
            => sends a POST request to the backend to add the image data to database
            => an 'uploading..' notification is displayed
            => the image is shown in the gallery
            => notification updated to 'uploaded.'
            => deletes the label "There's nothing here" in gallery if it exists.
    */

    // Add upload queue to body element
    let body = document.getElementsByClassName("hero-body")[0];
    let uploadQueue = document.getElementById("upload-queue");
    body.appendChild(uploadQueue);

    // Add callback function to upload button
    let uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", (event) => {

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
                  .catch(error => console.log('fetch failed.'));

                // If "There's nothing here.. Add something?" label is still there (must be zero images), then it is deleted.
                let labelNothing = document.getElementById("label-nothing");
                if (labelNothing)
                    labelNothing.remove();
            }
    
            reader.readAsDataURL(uploadButton.files[0]);

            // Show user that image has been uploaded
            let uploadItem = createUploadItem(fileName);

        }

    });
});
