"""
Routes handling image transfer for the gallery
    - Uploading images
    - Getting the image as a base64 representation of its data..
"""

from flask import Blueprint, request, jsonify, Response
from flask_login import login_required, current_user

from .models import User, File
from .models import JPG_START, PNG_START, DATE_FORMAT, GIF_START
from . import db
from .modules.functions import log
from .modules.fileloader import FileLoader

import json
import base64
from datetime import datetime

images = Blueprint('images', __name__)

@images.route('/uploadImage', methods=['POST'])
@login_required
def upload_image():
    """
    '/uploadImage' route

    Takes in request data 'images'<list> and 'overwrite'<bool>

    Response code 200:
        returns images as a dict/json.
    Reponse code 201:
        File(s) already exists (conflicting file names), returns the list of conflicting file names
    Response code 202:
        Wrong file format, must be .PNG, .JPEG, or .GIF.
    """
    if request.method != "POST":
        return

    data = json.loads(request.data)

    overwrite = bool("overwrite" in data.keys())
    user = current_user.username

    files = data["images"]

    file_objects = []

    existing_files = []
    for file in files:
        img = file["value"]
        filename: str = file["name"]

        extension = filename.split(".")[-1].upper()
        filename = filename[:-len(extension)] + extension

        if not extension:
            log("Wrong file format.")
            return Response("Filename must be .PNG, .JPEG, or .GIF", status=202, mimetype='application/json')
        
        if extension in ["JPG", "JPEG"]:
            img = img[len(JPG_START):]

        elif extension == "PNG":
            img = img[len(PNG_START):]

        elif extension == "GIF":
            img = img[len(GIF_START):]

        img_bytes = base64.b64decode(img)

        fileloader = FileLoader()
        image_object = fileloader.search(name=filename, user=current_user)
        if image_object:
            if not overwrite:
                # Check if the filename already exists, only if the overwrite option is False
                existing_files.append(image_object)
            else:
                # Replace file data
                db.session.delete(image_object)
                image_object = File(name=filename, user=user, value=img_bytes)
                image_object.set_property("date_uploaded", datetime.now().strftime(DATE_FORMAT))
                
        else:
            image_object = File(name=filename, user=user, value=img_bytes)
            image_object.set_property("date_uploaded", datetime.now().strftime(DATE_FORMAT))
            
        # Base64 File is sometimes rotated 90 degrees clockwise.
        # Rotate it back if the orientation is 8.
        if image_object.orientation == 8:
            image_object.value = image_object.rotate_left()

        file_objects.append(image_object)

    if existing_files:
        files = [file.name for file in existing_files]
        log(f"File(s) already exists: {', '.join(files)}")
        return { "response": 201, "files": files}

    # Send response back with image information
    return_images = []
    for image_obj in file_objects:
        image_data = {
                "name": image_obj.name,
                "size": image_obj.size,
                "dims": image_obj.dims,
            }
        if image_obj.extension == ".GIF":
            image_data["downsized"] = image_obj.first_frame
        else:
            image_data["downsized"] = image_obj.resize(240)
        return_images.append(image_data)
        db.session.add(image_obj)
    db.session.commit()

    return_data = {
        "response": 200,
        "images": return_images
    }

    return jsonify(return_data)

@images.route('/getImage', methods=['POST'])
@login_required
def get_image():
    """
    '/getImage' route which responds with:
        base64<string>, downsized<string>, metadata<string>
    """
    data = json.loads(request.data)
    filename = data["name"]
    username = current_user.username

    img = File.query.filter_by(name=filename, user=username).first()

    max_height = min(1280, img.dims[1]//2)
    return jsonify({"base64": img.base64, "downsized": img.resize(max_height), "metadata": img.get_metadata()})

