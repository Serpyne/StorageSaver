
let allFiles;

// Declare sorting constants
const NAME = "name";
const DATE_TAKEN = "date_taken";
const DATE_UPLOADED = "date_uploaded";
const TYPE = "type";
const SIZE = "size";

const ASCENDING = 0x8c;
const DESCENDING = 0x19;

// Declare HTML Elements
let fileManager;
let fileManagerBody;
let fileCount;

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
    if (sortBy === SIZE)
        sorted = files.sort(function(a, b) {return a.size - b.size});

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
    
    if (sortDirection === DESCENDING) {
        sorted.reverse(); console.log(sortDirection);
    }

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

let selected = [];

let previous, current, previousIndex, currentIndex;
function showFileOptions(/*json*/file, /*PointerEvent*/event) {
    /*
    Shows file options if one file is selected. If more items are selected, show options for multifile selection. 
    */
    let row = getElementFromFileName(file.name);
    
    // Normal mouse click
    if (!event.shiftKey && !event.ctrlKey) {
        // If selected items is more than one, then perform 'ctrl' action.
        if (selected.length === 1)
            deselectAll();
        else {
            showFileOptions(file, {shiftKey: false, ctrlKey: true});
            return;
        }

        if (fileIsSelected(file))
            selected = [];
        else {
            selected.push(file);
            row.style.backgroundColor = "#c9c9c9";
        }

        return;

    // Click + ctrl - select individual files
    } else if (!event.shiftKey && event.ctrlKey) {
        if (fileIsSelected(file)) {
            // Handle edge case where one file is selected then is selected again with 'ctrl' key.
            if (selected.length === 1 && getElementFromFileName(file.name).style.backgroundColor !== 'rgb(125, 178, 227)') {
                selected = [];
                showFileOptions(file, {shiftKey: false, ctrlKey: true});
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
            if (selected.length === 1)
                selected = [];
            showFileOptions(file, {shiftKey: false, ctrlKey: true});
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
    }

    for (let row of fileManagerBody.children) {
        row.style = "";
    }
    for (let item of selected)
        getElementFromFileName(item.name).style.backgroundColor = "#7db2e3";

    if (selected.length > 0) {
        disableUserSelecting();
        
        let ending = ""; if (selected.length > 1) {ending = "s";}
        fileCount.firstElementChild.innerHTML = `File${ending} Selected: ${selected.length}`;
        fileOptions.style.display = "flex";
    } else
        fileOptions.style.display = "none";
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
        newFile.addEventListener("click", (event) => showFileOptions(file, event));
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
    
}

function formatSize(/*int*/size) {
    /*
    Takes a file size in bytes as an integer,
    and returns the formatted size as a string.
    */
   let mult;
   let suffix;
    if (size < 1_000) {
        mult = 10;
        suffix = "bytes";
    } else if (size < 1_000_000) {
        mult = .01;
        suffix = "KB";
    } else if (size < 1_000_000_000) {
        mult = .00001;
        suffix = "MB";
    } else if (size < 1_000_000_000_000) {
        mult = .00000001;
        suffix = "GB";
    }
    return `${(Math.trunc(size * mult) * .1).toFixed(1)} ${suffix}`;
}

function formatDate(/*string*/dateString) {
    // Parses a datetime string and returns a string version of the date
    let formattedDate = new Date(Date.parse(dateString));
    return formattedDate.toDateString();
}

function formatTime(/*string*/dateString) {
    // Parses a datetime string and returns a string version of the time
    let formattedDate = new Date(Date.parse(dateString));
    return formattedDate.toTimeString();
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

function update(type) {
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
        if (state === "ascending") {
            sortArrows[index].setAttribute("state", "descending");
            sortArrows[index].src = downArrowImg;
            direction = DESCENDING;
        } else {
            sortArrows[index].setAttribute("state", "ascending");
            sortArrows[index].src = upArrowImg;

            if (index === 1) { // AKA if type === 'date'
                let label = sortDate.getElementsByTagName("h1")[0];
                if (label.innerHTML === "Date Taken") {
                    label.innerHTML = "Date Uploaded";
                    type = DATE_UPLOADED;
                } else {
                    label.innerHTML = "Date Taken";
                    type = DATE_TAKEN;
                }
            }
        }
    }

    displayFiles(sortFiles(allFiles, type, direction));
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

    let buttons = createNotification(`Are you sure you want to restore these images? ${images}`,
        {
            confirm: 'Yes',
            cancel: 'No' 
        }
    );
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendRestoreRequest(images);
        clearNotifications();
        selected = [];
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;
}

var navbar;
var fileOptions;
window.addEventListener("load", () => {
    navbar = document.getElementsByClassName("navbar")[0];
    
    fileOptions = document.getElementById("file-options");
    navbar.appendChild(fileOptions);
    
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