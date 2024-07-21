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
    
            reader.onload = function (e) {
                fetch("/uploadImage", {
                    method: "POST",
                    body: JSON.stringify({
                        value: e.target.result
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                  })
            }
    
            reader.readAsDataURL(uploadButton.files[0]);

            let fileName = uploadButton.files[0].name;
            
            let uploadItem = document.createElement("h1");
            uploadItem.className = "upload-item";
            uploadItem.innerHTML = fileName;

            uploadQueue.appendChild(uploadItem);
        }

    });

});