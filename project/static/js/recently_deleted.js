
// DEPRECATED
// function deprecatedPreviewFile() {
//     /*
//     Shows the file preview.
//     If the file is an image, then an <img> element is populated with the source data and shown.
//     However, if the file is not an image, then it says that this file format is not supported.
//     */
//     // Show previewFrame and remove all previous elements shown
    
//     previewFrame.style.display = "flex";
//     previewFrame.innerHTML = ""
    
//     let file, nameSplit, extension;

//     file = selected[0];
//     nameSplit = file.name.split(".");
//     extension = nameSplit[nameSplit.length - 1].toUpperCase();

//     if (["JPG", "JPEG", "PNG"].includes(extension)) {
//         let image = document.createElement("img");
//         image.src = file.src;
//         previewFrame.appendChild(image);

//         // Get original resolution image
//         fetch("/getImage", {
//                 method: "POST",
//                 body: JSON.stringify({
//                     name: file.name,
//                 }),
//                 headers: {
//                     "Content-type": "application/json; charset=UTF-8"
//                 }
//             })
//             .then(response => response.json())
//             .then(data => {
//                 image.src = data.base64;
//             })
//             .catch(error => {
//                 console.log(error);
//                 previewFrame.appendChild(document.createTextNode("Error retrieving image from server."));
//             });

//     } else {
//         // Non-image format
//         let label = document.createElement("h1")
//         label.textContent = "Cannot be displayed as this file is not in the format .JPG, .JPEG, or .PNG.";
//         previewFrame.appendChild(label);
//     }
// }

function handleSelection(/*json*/file, /*PointerEvent*/event) {
    /*
    Shows file options if one file is selected.
    If more items are selected, show options for multiple file selection. 
    */
    let row = getElementFromFileName(file.name);
    
    previewButton.style.display = "none";

    // Normal mouse click
    if (!event.shiftKey && !event.ctrlKey) {
        // If selected items is more than one, then perform 'ctrl' action.
        let sameFile = false;
        if (selected.length <= 1) {
            if (selected.length === 1) {
                if (selected[0].name == file.name)
                    sameFile = true;
            }
            deselectAll();
            previewButton.style.display = "flex";

        } else {
            handleSelection(file, {shiftKey: false, ctrlKey: true});
            return;
        }

        if (fileIsSelected(file))
            selected = [];
        else {
            if (!sameFile) {
                selected.push(file);
                row.style.backgroundColor = "#c9c9c9";

                // To save time, a setting allows the user to preview files on one click.
                if (oneClickPreview) {
                    previewButton.style = "";
                    previewFile();
                }

            // Edge case where one file is selected (first-case) and the same file is clicked. File should be unselected.
            } else {
                previewButton.style = "";
                row.style = "";
                closePreview();
            }
        }

        return;

    // Click + ctrl - select individual files
    } else if (!event.shiftKey && event.ctrlKey) {
        if (fileIsSelected(file)) {
            // Handle edge case where one file is selected then is selected again with 'ctrl' key.
            if (selected.length <= 1 && getElementFromFileName(file.name).style.backgroundColor !== 'rgb(125, 178, 227)') {
                selected = [];
                handleSelection(file, {shiftKey: false, ctrlKey: true});
                return;
            }
            // Deselect file if already selected
            else {
                removeFile(file);
                getElementFromFileName(file.name).style = "";
            }
        }
        else
            selected.push(file);
    
    // Click + shift - selected all files between previously selected file and current file
    } else if (event.shiftKey && !event.ctrlKey) {
        previous = getElementFromFileName(selected[selected.length - 1].name);
        current = row;

        let rows = Array.from(fileManagerBody.children);
        previousIndex = rows.indexOf(previous);
        currentIndex = rows.indexOf(current);

        // If both previous and selected elements are equal, then run the 'ctrl' routine
        if (previousIndex === currentIndex) {
            if (selected.length <= 1)
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
            let _row = rows[i];
            let data = JSON.parse(_row.getAttribute("data-content"));
            if (!fileIsSelected(data)) {
                selected.push(data);
            }
        }

        selected.push(file);
    // Does not support ctrl + shift + click action
    } else
        return;

    checkSelected();
}

function sendRestoreRequest(/*array*/images) {
    // Sends a restore image request to the backend, and deletes the images on the site.

    for (let item of images)
        getElementFromFileName(item).remove();

    fetch("/restoreFiles", {
            method: "POST",
            body: JSON.stringify(images),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => console.log(error))
}

function restoreFiles() {
    let images = [];
    for (let item of selected)
        images.push(item.name);

    let buttons = createNotification(`<b>Are you sure you want to restore these images?</b><br> ${images.join("<br>")}`,
        {
            confirm: 'Confirm',
            cancel: 'Cancel' 
        }
    );
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendRestoreRequest(images);
        clearNotifications();
        selected = [];
        fileOptions.style = "";
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;
}

function sendDeleteRequest(/*array*/images) {
    // Sends a delete image request to the backend, and deletes the images on the site.
    for (let item of images)
        getElementFromFileName(item).remove();

    fetch("/deleteFiles", {
            method: "POST",
            body: JSON.stringify(images),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => console.log(error))
}

function deleteFiles() {
    let images = [];
    for (let item of selected)
        images.push(item.name);

    let buttons = createNotification(`<i>Permanently deleted images cannot be restored.</i><br><b>Are you sure you want to delete these images?</b><br> ${images.join("<br>")}`,
        {
            confirm: 'Confirm',
            cancel: 'Cancel' 
        }
    );
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendDeleteRequest(images);
        clearNotifications();
        selected = [];
        fileOptions.style = "";
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;
}

function deleteEvent() {
    if (!contextItem)
        return;

    if (selected.length === 0) {
        let fileData = JSON.parse(contextItem.getAttribute("data-content"));
        selected.push(fileData);
    }
    deleteFiles();
}

window.addEventListener("load", () => {
    body = document.getElementsByClassName("hero-body")[0]; 
    navbar = document.getElementsByClassName("navbar")[0];
    
    fileOptions = document.getElementById("file-options");
    previewButton = document.getElementById("preview-button");
    closePreviewButton = document.getElementById("close-preview");
    navbar.appendChild(fileOptions);
    navbar.appendChild(previewButton);

    previewFrame = document.getElementById("preview");
    previewContainer = document.getElementById("preview-container");
    body.appendChild(previewContainer);

    fileManager = document.getElementById("file-manager");
    fileManagerBody = fileManager.getElementsByTagName("tbody")[0];
    fileCount = document.getElementById("file-count");

    sortName = document.getElementById("sort-name");
    sortDate = document.getElementById("sort-date");
    sortType = document.getElementById("sort-type");
    sortSize = document.getElementById("sort-size");

    arrow = document.createElement("img");
    arrow.className = "sort-arrow";
    arrow.src = upArrowImg;
    sortName.firstElementChild.append(arrow.cloneNode());
    sortDate.firstElementChild.append(arrow.cloneNode());
    sortType.firstElementChild.append(arrow.cloneNode());
    sortSize.firstElementChild.append(arrow.cloneNode());

    sortArrows = document.getElementsByClassName("sort-arrow");
    
    update(NAME);
});