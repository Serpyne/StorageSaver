let allFiles;

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

    file = selected[0];
    nameSplit = file.name.split(".");
    extension = nameSplit[nameSplit.length - 1].toUpperCase();

    closePreviewButton.style.display = "flex";
    previewContainer.style.display = "flex";
    
    if (["JPG", "JPEG", "PNG"].includes(extension)) {
        let image = document.createElement("img");
        image.src = file.src;
        previewFrame.appendChild(image);

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
                previewFrame.innerHTML = "";

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
    
}

function formatSize(/*int*/size) {
    /*
    Takes a file size in bytes as an integer,
    and returns the formatted size as a string.
    */
   let mult;
   let suffix;
    if (size < 1_000) {
        return `${size} bytes`
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
    globalSortBy = type;
    globalSortDirection = direction;
}

// restoreFiles() is unique to 'Recently Deleted'
// deleteFiles() in file manager is archive while it is permanent deletion in recently deleted.
