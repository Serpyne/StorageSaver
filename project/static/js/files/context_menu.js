/*
Subroutines involved with the context menu (menu that shows up when an element is right-clicked)
However, these functions are only used in the File Manager and All Files pages as the system for selecting
is different from the one in the Gallery.
This includes:
    - Copying and pasting (which has duplicate file protection and overwrite prompts to the user)
    - Renaming files
    - Selecting files (the same action as when the user clicks a file with the 'ctrl' key pressed down).
    - File deletion
    - Events for hiding and showing the context menu
    - Validating the file name (required as pasting takes the text from the user's clipboard).
*/

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
        if (!selectionPasteButton)
            return;

        if (hasCopied == names.length) {
            selectionPasteButton.style.display = "inline-block";
            pasteButtonLabel.style.color = "#ffffff";
        } else
            selectionPasteButton.style = "";
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
    /*
    Makes a POST request to the route /getExtensions.
    Sets the 'EXTENSIONS' json with the valid extensions from the backend.
    */
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
    /*
    Send a POST request to rename file with the original and new names.
    If the request returns a response of 300, then most likely the filename does not match
    an existing file and a page reload is required.
    Prompts the user.
    */
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

        displayFiles(quickSortFiles(allFiles, globalSortBy, globalSortDirection));
    })
    .catch(error => console.log(error));
}

function renameEvent() {
    /*
    Called by the rename button in the context menu.
    Replaces the focused file name with a HTML textinput element.
    Once the enter key is pressed, it will validate the input and prompt the user with any errors.
    Else, a request is sent with subroutine 'sendRenameRequest'.
    */
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
    /*
    Populates user's clipboard with selected items, separated by commas if multiple files are selected.
    */
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
    /*
    Handling duplicate files with the 'sendCopyRequest' subroutine.
    A yes/no notification is shown to the user.
    If yes, then it will perform 'sendCopyRequest' again but with the overwrite parameter enabled.
    If no, the notification in the upload queue is updated to say that the upload has been cancelled.
    */
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
    /*
    Appends the new copied files into the file manager.
    Is called by 'onRetrievedCopy' on the condition that there are no duplicate files,
    or the user has chosen to overwrite files.
    */
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
    displayFiles(quickSortFiles(allFiles, globalSortBy, globalSortDirection));
}

function onRetrievedCopy(/*array*/duplicateFiles, /*array*/copiedItems, /*array*/newNames, overwrite=false) {
    /*
    Is called once all of the copy requests have been made (refer to 'sendCopyRequest')
    If there are duplicate files, then handleCopyDuplicates is called.
    * If the overwrite parameter is enabled, then the original files are deleted from the window.
    Lastly, the copied items are shown with 'showCopiedItems'.
    */
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
    /*
    For each file in the list of copied items, it sends an individual file copy request to the backend.
    If overwrite is true, then the same parameters are parsed into the backend to be overwritten.
    Once all of the copy requests are sent and responses recevied, then 'onRetrievedCopy' is called.
    */
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
    /*
    Reads the text from the user's clipboard.
    If the separated files from the copied text are all valid, then it will call 'sendCopyRequest'.
    */
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
    /*
    Called when the select button is clicked on the context menu.
    Select a singular file that is focused.
    */
    if (!contextItem)
        return;

    let data = JSON.parse(contextItem.getAttribute("data-content"));
    selected.push(data);
    checkSelected();
}

// Declaring HTML elements within the context menu.

var contextMenu;
var copyButton;
var pasteButton;
var pasteButtonLabel;
var deleteButton;

var selectionPasteButton;

window.addEventListener("load", () => {
    contextMenu = document.getElementById("contextMenu");
    document.oncontextmenu = handleContextMenu;
    document.onclick = hideContextMenu;

    copyButton = document.getElementById("context-copy");
    pasteButton = document.getElementById("context-paste");
    pasteButtonLabel = pasteButton.firstElementChild;
    deleteButton = document.getElementById("context-delete");

    selectionPasteButton = document.getElementById("paste-button");

    // If route is not in recently deleted?
    if (!window.location.href.includes("recently_deleted"))
        deleteButton.firstElementChild.textContent = "Archive";
        return;

    copyButton.remove();
    pasteButton.remove();
    document.getElementById("context-rename").remove();
    if (selectionPasteButton)
        selectionPasteButton.remove();
});