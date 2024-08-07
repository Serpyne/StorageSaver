
function handleSelection(/*json*/file, /*PointerEvent*/event) {
    /*
    Shows file options if one file is selected.
    If more items are selected, show options for multiple file selection. 
    */
    let row = getElementFromFileName(file.name);
    
    previewButton.style.display = "none";
    checkCopied();

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
        if (selected.length === 0) {
            handleSelection(file, {shiftKey: false, ctrlKey: true});
            return;
        }
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

function deleteEvent() {
    if (!contextItem)
        return;

    if (selected.length === 0) {
        let fileData = JSON.parse(contextItem.getAttribute("data-content"));
        selected.push(fileData);
    }
    archiveFiles();
}

var uploadButton;
var uploadQueue;

window.addEventListener("load", () => {
    uploadQueue = document.getElementById("upload-queue");
        
    uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", () => uploadEvent());
});