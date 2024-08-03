/*
Functions of file upload and deletion along with upload requests.,
creation and removal of the upload notifications on the bottom-left of the page.
*/

function removeUploadItem(/*HTMLElement*/uploadItem) {
    /*
    Fades out the given upload item and removes it after fading.
    */
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
    /*
    Make request to backend to upload images to database (at /uploadImage)
    If request returns response code 201, then the user is prompted with a overwrite notification.
    Gallery is populated with the items after requesting upload.
    */
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
    /*
    Callback for the upload button
    Files must be image files otherwise prompts user with this information
    Calls 'sendUploadRequest' after all of the files have been read.
    */
    let uploadButton = document.getElementById("upload-button");
    let url = uploadButton.value;
    let ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
    if (uploadButton.files && uploadButton.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "gif")) {
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
    } else {
        let buttons = createNotification("Please only upload .PNG, .JPEG, or .GIF files to the gallery.", options={
            confirm: "Okay"
        });
        buttons.confirm.id = "confirm-button";
        buttons.confirm.onclick = clearNotifications;
    }
}

function deleteImages() {
    /*
    Prompts the user with a yes/no notification to delete the images.
    If the user confirms, then an archive request at /archiveFiles is made.
    Once the request is made, it will clear out the gallery items from the page.
    */
    let removedItems = [];
    for (let item of selected) {
        removedItems.push(item.name);
    }

    buttons = createNotification(`<b>Are you sure you want to archive these images?</b><br> ${removedItems.join("<br>")}`, {
        "confirm": "Yes",
        "cancel": "No"
    });
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        for (let item of removedItems)
            getElementFromFileName(item).remove();
        
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

        selected = [];
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.addEventListener("click", () => {
        clearNotifications();
        selected = [];
    });

}
