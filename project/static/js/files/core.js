/*
The core functions for the file manager. Involves file sorting, selection, and displaying on the user's webpage.
Note that handleSelection is different between the file manager and recently deleted pages.
This is because the selection systems are different so that they need their individual select handling methods.
*/

// User settings
var oneClickPreview = false;
var pixelated = false;

// Constants for sorting, string literals are used when checking parameters parsed into 'quickSortFiles'
const NAME = "name";
const DATE_TAKEN = "date_taken";
const DATE_UPLOADED = "date_uploaded";
const TYPE = "type";
const SIZE = "size";
const ASCENDING = 0x8c;
const DESCENDING = 0x19;

// Track the sort type and direction for displaying files in.
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

let allFiles;

let selected = [];
let previous, current, previousIndex, currentIndex;
// handleSelection differs between file manager and recently deleted

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

function disableUserSelecting() {
    // Prevents the user from selecting text while selecting files.
    for (let row of fileManagerBody.children) {
        row.style.setProperty("user-select", "none");
        row.style.setProperty("-webkit-user-select", "none");
    }
}

function deselectAll() {
    // Hiding file options and clear out the list of selected files
    for (let row of fileManagerBody.children) {
        row.style = "";
    }
    selected = [];

    fileOptions.style = "";
}

function selectAll() {
    // Select all files in the file manager table
    selected = [];
    for (let row of fileManagerBody.getElementsByClassName("file-item"))
        selected.push(JSON.parse(row.getAttribute("data-content")));

    for (let item of selected)
        getElementFromFileName(item.name).style.backgroundColor = "#7db2e3";

    checkSelected()
}

function fileIsSelected(/*json*/file) {
    let filenames = [];
    for (let item of selected)
        filenames.push(item.name);
    return filenames.includes(file.name);
}

function removeFile(/*json*/file) {
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

    let dateLabel = sortDate.getElementsByTagName("h1")[0];
    if (index == 1) {
        if (dateLabel.innerHTML === "Date Taken")
            type = DATE_TAKEN;
        else
            type = DATE_UPLOADED;
    }

    let vis = sortArrows[index].style.visibility;
    let direction = ASCENDING;
    if (vis === "hidden" || !vis) {
        hideArrows();
        sortArrows[index].style.visibility = "visible";
        sortArrows[index].setAttribute("state", "ascending")
    } else {
        let state = sortArrows[index].getAttribute("state");

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

    displayFiles(quickSortFiles(allFiles, type, direction));
    globalSortBy = type;
    globalSortDirection = direction;
}

// File Manipulation
// 'restoreFiles' is unique to 'Recently Deleted'

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
    /*
    Called by the archive button.
    Makes a request with 'sendArchiveRequest'.
    */
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
    /*
    Once the user has received the downloaded files,
    a request is sent to the backend to delete the zip file.
    Takes in the path of the zip file.
    */
    fetch("/downloadFiles", {
            method: "POST",
            body: JSON.stringify({path: zipPath}),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
}

function sendDownloadRequest(/*array*/files) {
    /*
    Sends a delete image request to the backend at /downloadFiles
    Redirects the user to the download location which downloads the zip file.
    After 10 seconds, it will call 'confirmDownloadRequest' which deletes the zip file from the system.
    */
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
    /*
    Called by the download files button/
    Once user has confirmed, it will call 'sendDownloadRequest'
    and clear the 'selected' array.
    */
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

function keyLinearSearch(/*json*/searchItem, /*array*/array, /*string*/key) {
    /*
    Searches for an item in an array sequentially based on a given key.
    Returns true once the first occurance of the item has been found.
    Else, returns false.
    */
    
    for (let item of array) {
        if (item[key] === searchItem[key])
            return true;
    }
    return false;
}

function loadSettings(/*json*/settings) {
    /*
    For the file manager, only the following settings are required:
        - Preview shown in one click
        - Pixelated images 
    */
    oneClickPreview = settings["oneClickPreview-switch"];
    pixelated = settings["imageQuality-switch"];
}

window.addEventListener("load", () => {
    /*
    Populate the extensions json with the valid extensions.
    Makes a POST request to the route /getExtensions.
    */
    getValidExtensions();

    // Declare HTML elements and push them to top level
    body = document.getElementsByClassName("hero-body")[0]; 
    navbar = document.getElementsByClassName("navbar")[0];
    fileManager = document.getElementById("file-manager");
    fileManagerBody = fileManager.getElementsByTagName("tbody")[0];
    fileCount = document.getElementById("file-count");
    
    fileOptions = document.getElementById("file-options");
    previewButton = document.getElementById("preview-button");
    closePreviewButton = document.getElementById("close-preview");
    navbar.appendChild(fileOptions);
    navbar.appendChild(previewButton);

    previewFrame = document.getElementById("preview");
    previewContainer = document.getElementById("preview-container");
    body.appendChild(previewContainer);

    // Sort file headers at the top of the file manager table.
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
    
    // Show the files with type 'name' and order 'ascending'.
    update(NAME);
});