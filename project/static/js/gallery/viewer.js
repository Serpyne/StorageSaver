/*
Functions involved with the hiding and showing of the image viewer.
Toggling the visibility of the image information panel
Checking if the mouse is within the boundaries of a given HTML element.  
*/

function toggleDetails() {
    /*
    Toggles the visibility of the image information panel.
    */
    if (infoPanel.style.display == "none") {
        infoPanel.style.maxWidth = '0';
        infoPanel.style.display = "flex";
        setTimeout("infoPanel.style.maxWidth = '100%';", 1);
    } else {
        infoPanel.style.maxWidth = '0';
        setTimeout("infoPanel.style.display = 'none';", 500);
    }
}

function mouseInElement(/*HTMLElement*/element, /*PointerEvent*/event) {
    /*
    Returns true if the mouse is within the bounding box of a HTML element.
    Takes in a HTML element and mouse Pointer event.
    Returns a boolean value.
    */
    let mouseX = event.x;
    let mouseY = event.y;
    let rect = element.getBoundingClientRect();
    if ((rect.left < mouseX && rect.right > mouseX) && (rect.top < mouseY && rect.bottom > mouseY)) {
        return true;
    }
    return false;
}

let viewerActive = false;
let lensWidth, lensHeight;
function imageZoom() {
    /*
    Initialisation of image viewer elements and subroutines.
        - changeSize
        - moveLens
    */
    let cx, cy;
    let viewerImage, lens, viewerResult;

    viewerImage = document.getElementById("viewer-img");
    viewerResult = document.getElementById("viewer-zoom");

    lens = document.createElement("div");
    lens.setAttribute("class", "viewer-lens");
    lens.setAttribute("zoom", "1");

    viewerImage.parentElement.insertBefore(lens, viewerImage);

    for (let event of ["mousemove", "touchmove", "click"]) {
        viewerImage.addEventListener(event, moveLens);
        lens.addEventListener(event, moveLens);
    }

    viewerImage.addEventListener("wheel", changeSize);
    lens.addEventListener("wheel", changeSize);

    let speed;
    function changeSize(/*PointerEvent*/event) {
        /*
        Changes the size of the lens if the mouse wheel is scrolled above the image.
        */
        if (viewer.style.display !== "flex")
            return;

        // Smooth logarithmic zoom
        let zoom, logZoom;
        zoom = parseFloat(lens.getAttribute("zoom"));

        // Zoom speed is dependent on user settings [imageZoomSpeed: 0, 1, 2]
        speed = 5 + 25 * imageZoomSpeed;

        deltaZoom = event.deltaY * speed * 0.0001;

        logZoom = Math.log(zoom) + deltaZoom // Increments of +-0.05
        logZoom = Math.max(-2, Math.min(1.4, logZoom));
        
        zoom = Math.exp(logZoom);
        lens.setAttribute("zoom", zoom);
        
        // If zoomed in enough, make the result the original quality.
        let len = viewerFileName.length;
        if (viewerFileName.slice(len - 3, len).toLowerCase() !== "gif") {
            if (logZoom < -0.6)
                viewerResult.style.backgroundImage = `url('${viewerImage.src}')`;
            else
                viewerResult.style.backgroundImage = `url('${downsizedImage}')`;
        }

        let rect = lens.getBoundingClientRect();
        lens.style.width = `${300 * zoom}px`;
        lens.style.height = `${300 * zoom}px`;

        moveLens(event, force=true);
    }

    function moveLens(/*PointerEvent*/event, /*bool*/force=false) {
        /*
        Update the viewer zoomed result's size and position
        based on the position and size of the lens and image. 
        */
        if (!force) {
            // If mouse is not clicked or once mouse is released, return
            if (event.buttons == 0 && event.type !== "click") {
                lens.style.opacity = 0;
                viewerResult.style.opacity = 1;
                return;
            }

            // If pointer is not within the bounds of the image, return
            if (!mouseInElement(viewerImage, event)) {
                lens.style.opacity = 0;
                return;
            }
        }

        // Remove "Click to zoom" overlay on click
        let overlays = viewerResult.children;
        for (let overlay of overlays)
            overlay.remove();

        lens.style.opacity = 1;
        viewerResult.style.opacity = 1;
        viewerActive = true;
        
        event.preventDefault();
        
        // Position of zoomed image
        let x, y;
        
        x = event.x - (lens.offsetWidth / 2);
        y = event.y - (lens.offsetHeight / 2);

        lens.style.left = x + "px";
        lens.style.top = y + "px";

        let rect = viewerImage.getBoundingClientRect();
        let rel_mouse = { 
            x: x - rect.left,
            y: y - rect.top
        };

        cx = viewerResult.offsetHeight / lens.offsetWidth;
        cy = viewerResult.offsetHeight / lens.offsetHeight;

        viewerResult.style.backgroundSize = (viewerImage.width * cx) + "px " + (viewerImage.height * cy) + "px";
        viewerResult.style.backgroundPosition = `${-rel_mouse.x * cx}px ${-rel_mouse.y * cy}px`;
    }
}

function closeViewer(/*PointerEvent*/event, /*bool*/force = false) {
    /*
    Closes the image viewer if validation of the mouse being outside of the viewer bounding box occurs.
    Validation is skipped if parameter 'force' is true.
    */
    if (!force) {
        // Only close if mouse click was on the background
        if (mouseInElement(viewerImage, event))
            return;
        // if (event.target !== viewer && event.target !== viewerImage.parentElement)
        //     return;

        // If viewer is active, don't close
        if (viewerActive)
            return;
        // Close the item viewer if it is already open.
        if (viewerImage.style.display == "none")
            return;
    }

    viewer.style.display = "none";
    viewerImage.src = "";
    
    infoButton.style.display = "none";
    uploadContainer.style.display = "flex";
}
