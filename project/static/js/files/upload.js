/*
Functions involved with file upload, showing the upload notification on the bottom left hand side of the page, and duplicate files.
*/

let filenames;
function handleDuplicates(/*array*/duplicateFiles, /*array*/allFiles) {
    /*
    Handling duplicate files by prompting the user with a yes/no panel.
    If the user selects yes, then the upload request is made again.
    */
    filenames = [];
    for (let file of duplicateFiles)
        filenames.push(file.name);

    let buttons = createNotification(`<b>Files are conflicting with existing files, do you want to overwrite them?: </b><br> ${filenames.join("<br>")}`, options={
        confirm: "Yes",
        cancel: "No"
    });
    buttons.confirm.id = "confirm-button";
    buttons.confirm.addEventListener("click", () => {
        sendUploadRequest(allFiles, overwrite=true);
        clearNotifications();
    });
    buttons.cancel.id = "cancel-button";
    buttons.cancel.onclick = clearNotifications;
}

function handleUploadResponses(duplicateFiles, imageFiles, files) {
    /*
    Callback function handling responses involving duplicate files and if the files contain images.
    Can only be called after all of the fetches have been called.
    */
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
    After all of the files have been sent and received, then it called 'handleUploadResponses' with the responses as a list.
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

                displayFiles(quickSortFiles(allFiles, globalSortBy, globalSortDirection));

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
    /*
    Fades out the upload notification on the bottom left and then removes it after it has faded out.
    Takes in a filename and finds the upload notification from that.
    */
    let uploadNotification = uploadNotifications[filename];
    uploadNotification.style.opacity = 0;
    setTimeout(`uploadNotifications['${filename}'].remove()`, 1500);
}

function notifyUpload(/*string*/filename) {
    /*
    Creates an upload notification from a filename.
    Returns the notification.
    */
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
    /*
    Reads the files from the user.
    Makes an upload request at 'sendUploadRequest' after all of the files have been read.
    */
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
