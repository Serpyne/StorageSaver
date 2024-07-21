window.addEventListener("load", (event) => {

    let body = document.getElementsByClassName("hero-body")[0];
    let uploadQueue = document.getElementById("upload-queue");
    body.appendChild(uploadQueue);

    let uploadButton = document.getElementById("upload-button");
    uploadButton.addEventListener("change", (event) => {

        let url = uploadButton.value;
        let ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (uploadButton.files && uploadButton.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg")) {
            var reader = new FileReader();
    
            let fileName = uploadButton.files[0].name;
            
            reader.onload = function (e) {
                fetch("/uploadImage", {
                    method: "POST",
                    body: JSON.stringify({
                        name: fileName,
                        value: e.target.result
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                  })
                // Expect json in response {id, name, size, dims}

                // Reload page to show uploaded image(s)
                location.reload()
            }
    
            reader.readAsDataURL(uploadButton.files[0]);

            let uploadItem = document.createElement("h1");
            uploadItem.className = "upload-item";
            uploadItem.innerHTML = fileName;

            uploadQueue.appendChild(uploadItem);

        }

    });

});

function destroyLoadingScreen() {
    let screens = document.getElementsByClassName("overlay-content");
    for (let i = 0; i < screens.length; i++) {
        screens[i].remove()
    }
}