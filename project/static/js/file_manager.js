
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
                console.log(selected[0].name, file.name)
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

function sendDeleteRequest(/*array*/images) {
    // Sends a delete image request to the backend, and deletes the images on the site.
    for (let item of images)
        getElementFromFileName(item).remove();

    fetch("/archiveFiles", {
            method: "POST",
            body: JSON.stringify({
                images: images
            }),
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

    let buttons = createNotification(`<i>They can be restored from Recently Deleted.</i><br><b>Are you sure you want to delete these images?</b><br> ${images.join("<br>")}`,
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

let filenames;
function handleDuplicates(/*array*/duplicateFiles, /*array*/allFiles) {
    // Handling duplicate files
    filenames = [];
    for (let file of duplicateFiles)
        filenames.push(file.name);

    let buttons = createNotification(`<b>Files are conflicting with existing files, do you want to overwrite them?: </b><br> ${filenames.join("<br>")}`, options={
        confirm: "Yes",
        skip: "Skip these files",
        cancel: "No"
    });
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendUploadRequest(allFiles, overwrite=true);
        clearNotifications();
    });
    buttons.skip.id = "confirm-button";
    buttons.skip.addEventListener("click", () => {
        // for (let file in duplicateFiles) {
        //     let index = allFiles.indexOf(file);
        //     allFiles.splice(index, 1);
        // }
        // sendUploadRequest(allFiles);
        clearNotifications();
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;
    
}

function handleUploadResponses(duplicateFiles, imageFiles, files) {
    // Callback function handling responses involving duplicate files and if the files contain images.
    // Can only be called after all of the fetches have been called.
    if (imageFiles.length > 0) {
        let imageFilenames = [];
        for (file of imageFiles);
            imageFilenames.push(file.name);

        filenames = [];
        let filesData = [];
        for (file in files) {
            if (!imageFilenames.includes(file.name)) {
                filenames.push(file.name);
                filesData.push(file)
            }
        }
        
        let text = `<i>Image files can only be uploaded in 'All Files' or the 'Gallery'</i><br><b>Only these files will be uploaded: </b><br> ${filenames.join("<br>")}`;
        let buttons = createNotification(text, options={confirm: "Okay"});

        buttons.confirm.id = "confirm-button";
        buttons.confirm.addEventListener("click", () => {
            sendUploadRequest(filesData);
            clearNotifications();
        });

    } else {
        if (duplicateFiles.length > 0)
            handleDuplicates(duplicateFiles, files);
    }
}

let duplicateFiles;
let imageFiles;
let file;
function sendUploadRequest(/*array*/files, /*bool*/overwrite = false) {
    /*
    Send an upload request to backend file by file.
    Therefore the path '/uploadFile' will receive a request for each file in the list.
    */
    duplicateFiles = [];
    imageFiles = [];

    let uploadCount = 0;
    for (let file of files) {
        // Overwrite option
        if (overwrite)
            file.overwrite = 1;

        fetch("/uploadFile", {
            method: "POST",
            body: JSON.stringify(file),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.response === 201)
                duplicateFiles.push(file);
            else if (data.response === 300)
                imageFiles.push(file);
            
            allFiles.push(data.file);
            displayFiles(sortFiles(allFiles, globalSortBy, globalSortDirection));

            uploadCount++;

            if (uploadCount === files.length)
                handleUploadResponses(duplicateFiles=duplicateFiles, imageFiles=imageFiles, files=files);
        })
        .catch(error => console.log(error));
    }
}

function uploadEvent() {
    let files = uploadButton.files;
    
    let filesData = [];
    let value;
    let uploadCount = 0;
    for (let file of files) {
        reader = new FileReader();
        reader.onload = function (/*ProgressEvent*/event) {
            value = event.target.result;
            filesData.push({
                name: file.name,
                value: value
            });

            uploadCount++;

            if (uploadCount === uploadButton.files.length) {
                sendUploadRequest(filesData);

                // Reset upload buttons files
                uploadButton.value = '';
            }
        };
        reader.readAsDataURL(file);
    }
}

var uploadButton;

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
    
    uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", () => uploadEvent());

    update(NAME);
});