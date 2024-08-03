/*
Functions involved with previewing files and closing the file preview.
*/


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
