let allFiles;

// User settings

var oneClickPreview = false;
var pixelated = false;

// Declare sorting constants
const NAME = "name";
const DATE_TAKEN = "date_taken";
const DATE_UPLOADED = "date_uploaded";
const TYPE = "type";
const SIZE = "size";

const ASCENDING = 0x8c;
const DESCENDING = 0x19;

var globalSortBy;
var globalSortDirection;

// How long after a file is uploaded that it will fade away.
const UPLOAD_FADE_SECONDS = 5;

// Declare HTML Elements
let fileManager;
let fileManagerBody;
let fileCount;
let previewButton;
let previewFrame;
let previewContainer;
let closePreviewButton;

var navbar;
var fileOptions;
var body;

/*
Format:
    {
        "name":          "test.png",
        "date_taken":    "04/05/2024 12:00:00",
        "date_uploaded": "31/07/2024 12:00:00",
        "type":          "PNG File",
        "size":          12400
        "src":           ...
    },
*/
function sortFiles(/*array*/files, /*string*/sortBy, /*const*/sortDirection) {
    // Takes in a list of files where each file is in the format {name<string>, date<string>, type<string>, size<int>, src<string>}
    // Returns the sorted list in the same format.
    
    /*
    Size is sorted using integer sorting.
    If the type between two files is the same, then the filename is compared instead.   
    */

    let sorted; 
    if (sortBy === SIZE) {
        sorted = files.sort(function(a, b) {
            if (a.size === b.size)
                return a.name.localeCompare(b.name)
            return a.size - b.size}
        );
    }

    else if (sortBy === DATE_TAKEN) {
        sorted = files.sort(function(a, b) {
            if (a["date_taken"] === b["date_taken"])
                return a.name.localeCompare(b.name)
            return Date.parse(a["date_taken"]) - Date.parse(b["date_taken"])
        });
    }

    else if (sortBy === DATE_UPLOADED) {
        sorted = files.sort(function(a, b) {
            if (a["date_uploaded"] === b["date_uploaded"])
                return a.name.localeCompare(b.name)
            return Date.parse(a["date_uploaded"]) - Date.parse(b["date_uploaded"])
        });
    }

    else
        sorted = files.sort(function (a, b) {
            if (a[sortBy] === b[sortBy])
                return a.name.localeCompare(b.name)
            return a[sortBy].localeCompare(b[sortBy]);
        });
    
    if (sortDirection === DESCENDING)
        sorted.reverse();

    return sorted;
}

function getElementFromFileName(/*string*/filename) {
    /*
    Finds a row in the filemanager table based on the filename.
    If it is not found, null is returned.
    */
    for (let row of fileManagerBody.children) {
        if (row.getAttribute("filename") === filename)
            return row;
    }
    return null;
}

function previewFile() {
    /*
    Shows the file preview.
    If the file is an image, then an <img> element is populated with the source data and shown.
    However, if the file is not an image, then it says that this file format is not supported.
    */
    let file, nameSplit, extension;

    // If rename entries are shown then don't preview
    if (document.getElementsByClassName("rename-input").length > 0)
        return;

    file = selected[0];
    nameSplit = file.name.split(".");
    extension = nameSplit[nameSplit.length - 1].toUpperCase();

    closePreviewButton.style.display = "flex";
    previewContainer.style.display = "flex";
    previewFrame.innerHTML = "";
    
    if (["JPG", "JPEG", "PNG"].includes(extension)) {
        let image = document.createElement("img");
        image.src = file.src;
        previewFrame.appendChild(image);
        image.className = "preview-image";

        if (pixelated)
            image.style.setProperty("image-rendering", "pixelated");
        
        // Get original resolution image
        fetch("/getImage", {
                method: "POST",
                body: JSON.stringify({
                    name: file.name,
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then(response => response.json())
            .then(data => {
                // Show previewFrame and remove all previous elements shown
                previewFrame.style.display = "flex";

                image.src = data.base64;
            })
            .catch(error => {
                console.log(error);
                previewFrame.appendChild(document.createTextNode("Error retrieving image from server."));
            });

    } else {
        // Non-image format
        fetch("/getFile", {
            method: "POST",
            body: JSON.stringify({
                name: file.name,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            let file = data.file;
            
            // Show previewFrame and remove all previous elements shown
            previewFrame.innerHTML = "";
            previewFrame.style.display = "flex";

            if (file.type === "text") {
                let label = document.createElement("h1");
                label.textContent = file.value;
                label.style.setProperty("overflow-y", "auto");
                previewFrame.appendChild(label);

            } else if (file.type === "code") {
                let pre = document.createElement("pre");
                let codeblock = document.createElement("code");
                const LANGUAGES = {
                    py: 'language-python',
                    js: 'language-js',
                    css: 'language-css',
                    html: 'language-html',
                    json: 'language-json',
                    ahk: 'language-autohotkey',
                    lua: 'language-lua',
                    vb: 'language-visual-basic',
                    vba: 'language-visual-basic',
                    c: 'language-c',
                    cpp: 'language-cpp',
                    cs: 'language-cs'
                }
                codeblock.className = LANGUAGES[file.language.toLowerCase()];
                codeblock.textContent = file.value;
                
                let codeScript = document.createElement("script");
                codeScript.src = "static/js/prism.js";

                pre.appendChild(codeblock);
                previewFrame.appendChild(codeScript);
                previewFrame.appendChild(pre);
            } else if (file.type === "gif" || file.type === "image") {
                let img = document.createElement("img");
                img.src = file.value;

                if (pixelated)
                    img.style.setProperty("image-rendering", "pixelated");

                img.className = "preview-image";
                previewFrame.appendChild(img);
            }

        })
        .catch(error => {
            console.log(error);
            previewFrame.appendChild(document.createTextNode("Error retrieving image from server."));
        });
    }
}

function closePreview() {
    previewFrame.style.display = "none";
    previewContainer.style = "";
    closePreviewButton.style = "";
}

function disableUserSelecting() {
    for (let row of fileManagerBody.children) {
        row.style.setProperty("user-select", "none");
        row.style.setProperty("-webkit-user-select", "none");
    }
}

function deselectAll() {
    // Hiding file options
    for (let row of fileManagerBody.children) {
        row.style = "";
    }
    selected = [];

    fileOptions.style = "";
}

function selectAll() {
    // Select all files
    selected = [];
    for (let row of fileManagerBody.getElementsByClassName("file-item"))
        selected.push(JSON.parse(row.getAttribute("data-content")));

    for (let item of selected)
        getElementFromFileName(item.name).style.backgroundColor = "#7db2e3";

    checkSelected()
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

function uniqueFiles(/*array*/files) {
    // Returns only the unique items of an array.
    let return_files = [];
    let filenames = [];
    for (let file of files) {
        if (!filenames.includes(file.name)) {
            return_files.push(file);
            filenames.push(file.name);
        }
    }
    return return_files;
}

function checkSelected() {
    selected = uniqueFiles(selected);

    for (let row of fileManagerBody.children) {
        row.style = "";
    }
    for (let item of selected)
        getElementFromFileName(item.name).style.backgroundColor = "#7db2e3";

    // Hiding/showing option buttons on top right when necessary
    if (selected.length > 0) {
        disableUserSelecting();
        
        let ending = ""; if (selected.length > 1) {ending = "s";}
        fileCount.firstElementChild.innerHTML = `<b>File${ending} Selected:</b> ${selected.length}`;
        fileOptions.style.display = "flex";
    } else
        fileOptions.style.display = "none";
        
    // Hide preview when more items are selected
    if (selected.length > 1) {
        closePreview();
    }
}

let selected = [];

let previous, current, previousIndex, currentIndex;

// handleSection differs from file to file


function displayFiles(/*array*/files) {
    /*
    Clears the table of the rows consisting of the file items, then populates it with the files in the given order.
    */
    let num = fileManagerBody.children.length;
    for (let i = 1; i < num; i++) {
        fileManagerBody.children[1].remove();
    }

    let label;
    let newFile;
    let textElement;
    for (let file of files) {
        newFile = fileManagerBody.insertRow();
        newFile.className = "file-item";
        newFile.addEventListener("click", (event) => handleSelection(file, event));
        newFile.setAttribute("filename", file.name);
        newFile.setAttribute("data-content", JSON.stringify(file));

        // Get the date type: taken or uploaded
        let dateLabel = sortDate.getElementsByTagName("h1")[0];
        let date_type;
        if (dateLabel.innerHTML === "Date Taken")
            date_type = DATE_TAKEN;
        else
            date_type = DATE_UPLOADED;
        
        // Append each of the file properties
        for (let text of [NAME, date_type, TYPE, SIZE]) {
            let cell = newFile.insertCell();

            cellContainer = document.createElement("div");
            cellContainer.className = "cell-container";

            cell.className = text;
            label = file[text];
            textElement = document.createElement("h1");
            textElement.textContent = label;
            textElement.className = "name-label";

            if (text === NAME) {
                img = document.createElement("img");
                img.className = "thumbnail";
                img.src = file.src;
                cellContainer.appendChild(img);
            }

            if (text === SIZE)
                label = textElement.textContent = formatSize(label);

            if (text === date_type) {
                if (label == null) 
                    label = textElement.textContent = "N/A";
                else {
                    textElement.textContent = formatDate(label);
                    label = formatTime(label);
                }
            }
            cell.title = label;

            cellContainer.appendChild(textElement);
            cell.appendChild(cellContainer);
        }
    }

    // Edge case where user could update the display while still selecting items.
    checkSelected();
}

let sortName;
let sortDate;
let sortType;
let sortSize;

let upArrowImg = "static/icons/upArrow.png";
let downArrowImg = "static/icons/downArrow.png";

let sortArrows;
function hideArrows() {
    for (let arrow of sortArrows) {
        arrow.setAttribute("state", "null")
        arrow.style.visibility = "hidden";
        arrow.src = upArrowImg;
    }
}

function update(/*string*/type) {
    /*
    Handling the sorting and updating the file display after one of the sorting headers is clicked.
    */
    let index = "name date type size".split(" ").indexOf(type);
    let vis = sortArrows[index].style.visibility;
    let direction = ASCENDING;
    if (vis === "hidden" || !vis) {
        hideArrows();
        sortArrows[index].style.visibility = "visible";
        sortArrows[index].setAttribute("state", "ascending")
    } else {
        let state = sortArrows[index].getAttribute("state");
        let dateLabel = sortDate.getElementsByTagName("h1")[0];
        if (index == 1) {
            if (dateLabel.innerHTML === "Date Taken")
                type = DATE_TAKEN;
            else
                type = DATE_UPLOADED;
        }

        if (state === "ascending") {
            sortArrows[index].setAttribute("state", "descending");
            sortArrows[index].src = downArrowImg;
            direction = DESCENDING;
        } else {
            sortArrows[index].setAttribute("state", "ascending");
            sortArrows[index].src = upArrowImg;

            if (index == 1) { // AKA if type === 'date'
                if (dateLabel.innerHTML === "Date Taken") {
                    dateLabel.innerHTML = "Date Uploaded";
                    type = DATE_UPLOADED;
                } else {
                    dateLabel.innerHTML = "Date Taken";
                    type = DATE_TAKEN;
                }
            }
        }
    }

    displayFiles(sortFiles(allFiles, type, direction));
    globalSortBy = type;
    globalSortDirection = direction;
}

// File Manipulation
// restoreFiles() is unique to 'Recently Deleted'

function sendArchiveRequest(/*array*/images) {
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
        })
        .catch(error => console.log(error))
}

function archiveFiles() {
    let images = [];
    for (let item of selected)
        images.push(item.name);

    let buttons = createNotification(`<i>They can be restored from Recently Deleted.</i><br><b>Are you sure you want to archive these images?</b><br> ${images.join("<br>")}`,
        {
            confirm: 'Confirm',
            cancel: 'Cancel' 
        }
    );
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        // Remove selected files from global files variable
        let filenames = [];
        for (let item of selected) {
            filenames.push(item.name);
        }

        let newAllFiles = [];
        for (let file of allFiles) {
            if (!filenames.includes(file.name))
                newAllFiles.push(file);
        }
        allFiles = newAllFiles;
        
        sendArchiveRequest(images);
        clearNotifications();

        selected = [];
        fileOptions.style = "";
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;
}

function confirmDownloadRequest(/*string*/zipPath) {
    // Sends a delete image request to the backend.
    fetch("/downloadFiles", {
            method: "POST",
            body: JSON.stringify({path: zipPath}),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
}

function sendDownloadRequest(/*array*/files) {
    // Sends a delete image request to the backend.
    fetch("/downloadFiles", {
            method: "POST",
            body: JSON.stringify(files),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            selected = [];
            checkSelected();

            // Automatically give the current user the download.
            window.location = data.path;
            // After ten seconds, the zip file will be deleted. [Should adjust in case of larger files?]
            setTimeout(`confirmDownloadRequest('${data.path}')`, 1000 * 10);
        })
        .catch(error => console.log(error))
}

function downloadFiles() {
    let files = [];
    for (let item of selected)
        files.push(item.name);

    let buttons = createNotification(`<b>Are you sure you want to download these files?</b><br> ${files.join("<br>")}`,
        {
            confirm: 'Confirm',
            cancel: 'Cancel' 
        }
    );
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendDownloadRequest(files);
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
    if (imageFiles.length > 0 && window.location.href.includes("file_manager")) {
        let text;
        let imageFilenames = [];
        for (file of imageFiles)
            imageFilenames.push(file.name);

        let filenames = [];
        let filesData = [];
        for (file of files) {
            if (!imageFilenames.includes(file.name)) {
                filenames.push(file.name);
                filesData.push(file);
            }
        }
        
        if (filenames.length > 0)
            text = `<i>Image files can only be uploaded in 'All Files' or the 'Gallery'</i><br><b>Only these files will be uploaded: </b><br> ${filenames.join("<br>")}`;
        else 
            text = `<i>Image files can only be uploaded in 'All Files' or the 'Gallery'</i>`
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
        if (!window.location.href.includes("file_manager"))
            file.allowImages = 1;

        let uploadNotification = uploadNotifications[file.name];

        fetch("/uploadFile", {
            method: "POST",
            body: JSON.stringify(file),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.response === 201) {
                duplicateFiles.push(file);
            } else if (data.response === 300) {
                imageFiles.push(file);
                uploadNotification.innerHTML = `${file.name} could not be uploaded.`;
                setTimeout(`removeUploadNotification('${file.name}');`, 1000 * UPLOAD_FADE_SECONDS);
            } else {
                if (overwrite) {
                    for (let item of allFiles) {
                        if (item.name === data.file.name)
                            allFiles.splice(allFiles.indexOf(item), 1);
                    }
                }
                allFiles.push(data.file);

                displayFiles(sortFiles(allFiles, globalSortBy, globalSortDirection));

                uploadNotification.innerHTML = `Uploaded ${file.name}`;

                setTimeout(`removeUploadNotification('${file.name}');`, 1000 * UPLOAD_FADE_SECONDS);
            }

            uploadCount++;
            
            if (uploadCount === files.length)
                handleUploadResponses(duplicateFiles=duplicateFiles, imageFiles=imageFiles, files=files);
        })
        .catch(error => console.log(error));
    }
}

function removeUploadNotification(/*string*/filename) {
    let uploadNotification = uploadNotifications[filename];
    uploadNotification.style.opacity = 0;
    setTimeout(`uploadNotifications['${filename}'].remove()`, 1500);
}

function notifyUpload(/*string*/filename) {
    let uploadNotification = document.createElement("div");
    uploadNotification.className = "upload-notification";
    let loading = document.createElement("img");
    loading.className = "loading-image";
    loading.src = "/static/icons/loading.gif";
    uploadNotification.appendChild(loading);
    if (filename)
        uploadNotification.appendChild(document.createTextNode(`Uploading ${filename}`));
    uploadQueue.appendChild(uploadNotification);
    return uploadNotification;
}

let uploadNotifications = {};
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

            uploadNotifications[file.name] = notifyUpload(file.name);

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

function keyLinearSearch(/*json*/searchItem, /*array*/array, /*string*/key) {
    // Searches for an item in an array based on a given key.
    
    for (let item of array) {
        if (item[key] === searchItem[key])
            return true;
    }
    return false;
}

// Context Menu

function getParentRow(/*HTMLElement*/element) {
    // Recursively searches up until the parent row is found, or null is returned.
    let parent = element.parentElement;
    if (!parent)
        return null;
    else if (parent.className === "file-item")
        return parent;
    return getParentRow(parent);
}

function hideContextMenu() {
    contextItem = null;
    contextMenu.style.display = "none";
    pasteButtonLabel.style.color = "#414141";
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

function isFile(/*string*/text) {
    let textSplit = text.split(".");
    let ext = textSplit[textSplit.length - 1];

    if (ext.length === 0 || ext.length > 4)
        return false;
    return true;
}

function checkCopied() {
    navigator.clipboard.readText()
    .then(text => {
        let hasCopied = 0;
        let names = text.split(", ")
        for (let name of names) {
            if (isFile(text)) {
                if (getElementFromFileName(name))
                    hasCopied++;
            }
        }
        if (hasCopied == names.length) {
            selectionPasteButton.style.display = "inline-block";
            pasteButtonLabel.style.color = "#ffffff";
        } else {
            selectionPasteButton.style = "";
        }
    })
    .catch(error => console.log(error));
}

function clearRenameEntries() {
    // If multiple rename events are started, it will clear the previous ones.
    for (let error of document.getElementsByClassName("rename-error"))
        error.remove();
    let renameEntries = document.getElementsByClassName("rename-input");
    for (let item of renameEntries) {
        let label = document.createElement("h1");
        let container = item.parentElement;
        label.className = "name-label";
        label.textContent = container.parentElement.title;
        container.appendChild(label);
        item.remove();
    }
}

let contextItem;
function handleContextMenu(/*PointerEvent*/event) {
    event.preventDefault();
    hideContextMenu();
    
    if (!["H1", "TD"].includes(event.target.tagName) && event.target.className !== "cell-container")
        return;
    
    contextItem = getParentRow(event.target);
    if (contextItem == null)
        return;
    
    // If multiple rename events are started, it will clear the previous ones.
    clearRenameEntries();

    showContextMenu(event);
    
    checkCopied();
}

function isValidFileName(/*string*/filename) {
    /*
    File name requirements:
        - length is at least 4
        - Contains at least one full stop
        - Length of the extension is less than 5
        - Extension is known
    */
    if (filename.length < 4)
        return false;

    let nameSplit = filename.split(".");

    if (nameSplit.length < 2)
        return false;

    let ext = nameSplit[nameSplit.length - 1];

    if (ext.length > 4)
        return false;

    if (!EXTENSIONS.includes(ext.toUpperCase()))
        return false;

    return true;
}

var EXTENSIONS;
function getValidExtensions() {
    fetch("/getExtensions", {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(response => response.json())
    .then(data => {
        EXTENSIONS = data.extensions;
        return data.extensions;
    })
    .catch(error => console.log(error));
}

function sendRenameRequest(/*string*/originalName, /*string*/newName) {
    fetch("/renameFile", {
        method: "POST",
        body: JSON.stringify({originalName: originalName, newName: newName}),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.response === 300) {
            let buttons = createNotification(`${originalName} was not renamed. Check the file name?`, options={
                confirm: "Okay"
            });
            buttons.confirm.id = "confirm-button";
            buttons.confirm.onclick = clearNotifications;
            return;
        }

        let storedFile = allFiles.filter(file => {return file.name == originalName})[0];
        storedFile.name = newName;

        displayFiles(sortFiles(allFiles, globalSortBy, globalSortDirection));
    })
    .catch(error => console.log(error));
}

function renameEvent() {
    if (!contextItem)
        return;

    closePreview();

    let filename = contextItem.getAttribute("filename");

    let nameCell = contextItem.getElementsByClassName("name")[0];
    let container = nameCell.firstElementChild;
    let nameLabel = container.lastElementChild;
    nameLabel.remove();

    let entry = document.createElement("input");
    entry.className = "rename-input";
    entry.type = "text";

    entry.value = filename;
    
    let error = document.createElement("h1");
    error.textContent = "";
    error.style.color = "red";
    error.className = "rename-error";
    error.style.setProperty("padding-left", "1rem");
    
    container.appendChild(entry);
    container.appendChild(error);

    entry.focus()

    entry.addEventListener("keyup", (event) => {
        if (event.key !== 'Enter' && event.keyCode !== 13)
            return;

        if (event.shiftKey || event.ctrlKey)
            return;

        // Verify new filename
        if (!isValidFileName(entry.value)) {
            error.textContent = "Invalid filename.";
            error.title = `Valid extensions include: .${EXTENSIONS.join(", .")}`
            return;
        }

        let nameSplit = filename.split(".");
        let nameExt = nameSplit[nameSplit.length - 1];

        let valueSplit = entry.value.split(".");
        let valueExt = valueSplit[valueSplit.length - 1];

        if (nameExt.toLowerCase() !== valueExt.toLowerCase()) {
            error.textContent = "Extension does not match original extension.";
            error.title = `Original extensions: ${nameExt}`
            return;
        }

        sendRenameRequest(filename, entry.value);
    });
    entry.addEventListener("focusout", clearRenameEntries);
}

function copyEvent() {
    if (!contextItem && selected.length == 0)
        return;

    // If only one item is copied
    if (selected.length <= 1) {
        navigator.clipboard.writeText(contextItem.getAttribute("filename"));
    
    // When multiple files are copied
    } else {
        let filenames = [];
        for (let item of selected)
            filenames.push(item.name);
        navigator.clipboard.writeText(filenames.join(", "));
    }
    checkCopied();
}

function handleCopyDuplicates(/*array*/duplicateFiles, /*array*/allFiles) {
    // Handling duplicate files
    let buttons = createNotification(`<b>Files are conflicting with existing files, do you want to overwrite them?: </b><br> ${duplicateFiles.join("<br>")}`, options={
        confirm: "Yes",
        cancel: "No"
    });
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendCopyRequest(allFiles, overwrite=true);
        clearNotifications();
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.addEventListener("click", () => {
        for (let name of allFiles) {
            let notif = uploadNotifications[name];
            if (notif) {
                notif.innerHTML = `Copy of ${name} was cancelled.`
                setTimeout(`removeUploadNotification('${name}');`, 1000 * UPLOAD_FADE_SECONDS)
            }
        }
        clearNotifications();
    });
}

function showCopiedItems(/*array*/copiedItems, /*array*/newNames) {
    for (let i in copiedItems) {
        let copiedItem = copiedItems[i];
        let newName = newNames[i];

        let original = getElementFromFileName(copiedItem);
        if (original) {
            let originalData = JSON.parse(original.getAttribute("data-content"));
            originalData.name = newName;
            allFiles.push(originalData);
        } else {
            // CBF
            window.location.reload();
        }

        let uploadNotification = uploadNotifications[copiedItem];
        uploadNotification.innerHTML = `Pasted ${copiedItem}`;

        setTimeout(`removeUploadNotification('${copiedItem}');`, 1000 * UPLOAD_FADE_SECONDS);
    }
    displayFiles(sortFiles(allFiles, globalSortBy, globalSortDirection));
}

function onRetrievedCopy(/*array*/duplicateFiles, /*array*/copiedItems, /*array*/newNames, overwrite=false) {
    if (duplicateFiles.length > 0) {
        handleCopyDuplicates(duplicateFiles, copiedItems);
    } else {
        // If overwrite is true, loop through and prune all of the duplicate names
        if (overwrite) {
            let originalFiles = allFiles.filter(file => newNames.includes(file.name));
            for (let file of originalFiles) {
                allFiles.splice(allFiles.indexOf(file), 1);
                getElementFromFileName(file.name).remove();
            }
        }
        showCopiedItems(copiedItems, newNames);
    }
}

function sendCopyRequest(/*array*/copiedItems, /*bool*/overwrite=false) {
    let allFileNames = [];
    for (let item of allFiles)
        allFileNames.push(item.name);

    let duplicateFiles = [];
    let newNames = [];
    
    let itemCount = 0;
    for (let copiedItem of copiedItems) {
        fileData = {name: copiedItem};
        if (overwrite)
            fileData.overwrite = 1;
        // If another file exists, create a copy of it.
        if (!overwrite) {
            let uploadNotification = notifyUpload("");
            uploadNotification.appendChild(document.createTextNode(`Creating a copy of ${copiedItem}`));
            uploadNotifications[copiedItem] = uploadNotification;
        }
        
        fetch("/copyFile", {
            method: "POST",
            body: JSON.stringify(fileData),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json())
        .then(data => {
            // Duplicate file
            if (data.response === 300) {
                duplicateFiles.push(data.name);
            }
            newNames.push(data.name);

            itemCount++;

            if (itemCount == copiedItems.length) {
                onRetrievedCopy(duplicateFiles, copiedItems, newNames, overwrite);
            }
        })
        .catch(error => console.log(error));
        
    }
}

function pasteEvent() {
    navigator.clipboard.readText()
    .then(text => {
        copiedItems = text.split(", ");
        let hasCopied = 0;
        for (let name of copiedItems) {
            if (isFile(text)) {
                if (getElementFromFileName(name))
                    hasCopied++;
            }
        }
        if (hasCopied == copiedItems.length)
            sendCopyRequest(copiedItems);
    })
    .catch(error => console.log(error));
}

function selectEvent() {
    if (!contextItem)
        return;

    let data = JSON.parse(contextItem.getAttribute("data-content"));
    selected.push(data);
    checkSelected();
}

function loadSettings(/*json*/settings) {
    oneClickPreview = settings["oneClickPreview-switch"];
    pixelated = settings["imageQuality-switch"];
}

var contextMenu;
var copyButton;
var pasteButton;
var pasteButtonLabel;
var deleteButton;

var selectionPasteButton;

window.addEventListener("load", () => {
    getValidExtensions();

    contextMenu = document.getElementById("contextMenu");
    document.oncontextmenu = handleContextMenu;
    document.onclick = hideContextMenu;

    copyButton = document.getElementById("context-copy");
    pasteButton = document.getElementById("context-paste");
    pasteButtonLabel = pasteButton.firstElementChild;
    deleteButton = document.getElementById("context-delete");

    selectionPasteButton = document.getElementById("paste-button");
});