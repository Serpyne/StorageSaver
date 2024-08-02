"""
Routes handling file management
"""

from flask import Blueprint, request, jsonify, Response
from flask_login import login_required, current_user

from .modules.fileloader import FileLoader
from .modules.functions import bitshift_hash, random_name, log

from .models import File, DATE_FORMAT
from . import db

import json
import base64
from datetime import datetime

import os
from os.path import join, dirname
import zipfile

files = Blueprint('files', __name__)

@files.route('/uploadFile', methods=['POST'])
@login_required
def upload_file():
    data = json.loads(request.data)

    name = data["name"]
    value = data["value"]
    user = current_user.username

    overwrite = bool("overwrite" in data)

    same_file = File.query.filter_by(name=name, user=user).first()
    if same_file:
        if not overwrite:
            # Send back overwrite requests
            return jsonify({"response": 201})
        else:
            # Replace original file
            db.session.delete(same_file)

    file_bytes = base64.b64decode(value.split("base64")[-1])

    new_file = File(name=name, value=file_bytes, user=user)
    new_file.set_property("date_uploaded", datetime.now().strftime(DATE_FORMAT))
    
    # If file is an image file, reject it.
    if new_file.extension in [".JPEG", ".JPG", ".PNG"]:
        return jsonify({"response": 300})

    db.session.add(new_file)
    db.session.commit()

    images = FileLoader()
    file_data = images.load_thumbnail(new_file)

    return jsonify({"response": 200, "file": file_data})


@files.route('/getFile', methods=['POST'])
@login_required
def get_file():
    data = json.loads(request.data)
    if "name" not in data:
        return jsonify({"response": 204})

    file = File.query.filter_by(name=data["name"], user=current_user.username).first()
    if not file:
        return jsonify({"response": 202})

    file_data = {
        "value": file.text,
        "type": ["text", "code"][int(file.is_code)]
    }
    if file.is_code:
        file_data["language"] = file.extension[1:]

    return jsonify({"response": 200, "file": file_data})

@files.route('/archiveFiles', methods=['POST'])
@login_required
def archive_files():
    data = json.loads(request.data)

    user = current_user.username
    for filename in data["images"]:
        file = File.query.filter_by(name=filename, user=user).first()
        file.set_property("archived", 1)
    db.session.commit()

    return jsonify({"response": 200})

@files.route('/restoreFiles', methods=['POST'])
@login_required
def restore_files():
    files = json.loads(request.data)
    user = current_user.username

    for filename in files:
        file = File.query.filter_by(name=filename, user=user).first()
        file.remove_property("archived")
    db.session.commit()

    return jsonify({"response": 200})

@files.route('/deleteFiles', methods=['POST'])
@login_required
def delete_files():
    files = json.loads(request.data)
    user = current_user.username

    for filename in files:
        file = File.query.filter_by(name=filename, user=user).first()
        db.session.delete(file)
    db.session.commit()

    return jsonify({"response": 200})

@files.route('/downloadFiles', methods=['POST'])
@login_required
def download_files():
    data = json.loads(request.data)
    
    if "path" in data:
        zip_path = data["path"]

        # In case of malicious POST requests, check the send path laboriously.
        # Start and end of string must match, and the length of the string must be between 35 and 37.
        if zip_path[:18] != "static/temp/files-" or zip_path[-4:] != ".zip" or len(zip_path) not in [35, 36, 37]:
            return Response("Invalid zip path name.", status=401, mimetype='application/json')
        
        zip_whole_path = join(dirname(__file__), zip_path)
        os.remove(zip_whole_path);
        
        log(f"Zip file deleted, name: {zip_path}")
        return Response("File deleted.", status=200, mimetype='application/json')

    files = {}
    for name in data:
        file = File.query.filter_by(name=name, user=current_user.username).first()
        if file:
            files[name] = file.value
        else:
            return jsonify({"response": 304})

    # Zip up the files into a temporary folder
    zip_path = f"files-{bitshift_hash(random_name(5))}.zip"
    zip_path = "static/temp/" + zip_path
    zip_whole_path = join(dirname(__file__), zip_path)

    with zipfile.ZipFile(zip_whole_path, 'a') as zf:
        for name in files:
            with zf.open(name, 'w') as f:
                f.write(files[name])
                f.close()
        zf.close()

    log(f"Zip file downloaded, number of files: {len(files)}")

    return jsonify({"response": 200, "path": zip_path})