
let files;

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
    console.log(files, sortBy, sortDirection);
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
        sorted = files.sort(function(a, b) {return Date.parse(a["date_taken"]) - Date.parse(b["date_taken"])});
    }
    else if (sortBy === DATE_UPLOADED) {
        sorted = files.sort(function(a, b) {return Date.parse(a["date_uploaded"]) - Date.parse(b["date_uploaded"])});
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
    let formattedDate = new Date(Date.parse(dateString));
    return formattedDate.toDateString();
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

    displayFiles(sortFiles(files, type, direction));
}

window.addEventListener("load", () => {
    
    fileManager = document.getElementById("file-manager");
    fileManagerBody = fileManager.getElementsByTagName("tbody")[0];

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