"""
Routes handling image transfer for the gallery
"""

from flask import Blueprint, request, jsonify, Response
from flask_login import login_required, current_user

from .models import User, File
from .models import JPG_START, PNG_START, DATE_FORMAT
from . import db
from .modules.functions import log

import json
import base64
from datetime import datetime

images = Blueprint('images', __name__)

def contains_chars(chars: str, string: str) -> bool:
    for char in chars:
        if char in string:
            return True
    return False

@images.route('/uploadImage', methods=['POST'])
@login_required
def upload_image():
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
            return Response("Filename must be .PNG, .JPG or .JPEG", status=201, mimetype='application/json')
        
        if extension in ["JPG", "JPEG"]:
            img = img[len(JPG_START):]

        elif extension == "PNG":
            img = img[len(PNG_START):]

        img_bytes = base64.b64decode(img)

        image_object = File.query.filter_by(name=filename, user=user).first()
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
        # Rotate it back if the orientation is that.
        if image_object.orientation == 8:
            print("rotated")
            image_object.value = image_object.rotate_left()

        file_objects.append(image_object)

    if existing_files:
        files = [file.name for file in existing_files]
        log(f"File(s) already exists: {', '.join(files)}")
        return { "response": 201, "files": files}

    # Send response back with image information
    return_images = []
    for image_obj in file_objects:
        return_images.append(
            {
                "name": image_obj.name,
                "size": image_obj.size,
                "dims": image_obj.dims,
                "downsized": image_obj.resize(240)
            } 
        )
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
    data = json.loads(request.data)
    filename = data["name"]
    username = current_user.username

    img = File.query.filter_by(name=filename, user=username).first()

    max_height = min(1280, img.dims[1]//2)
    return jsonify({"base64": img.base64, "downsized": img.resize(max_height), "metadata": img.get_metadata()})

