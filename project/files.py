"""
Routes handling file management
    - Uploading
    - Get the file data as a base64 representation
    - Create a duplicate of an existing file
    - Renaming
    - Archiving
    - Restoration of archived files
    - Permanent deletion
    = Retrieving total file storage that is taken up, in bytes.
    = Retrieving all valid file extensions
"""

from flask import Blueprint, request, jsonify, Response
from flask_login import login_required, current_user

from .modules.fileloader import FileLoader, timer
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
    """
    '/uploadFile' route, uploads a given file to the database, with its date uploaded as a file property.

    Takes in 'name'<string>, 'value'(base64)<string>, 'overwrite'<bool> and 'allowImages'<bool'.

    Response code 201: File with the same name exists
    Response code 300: Parameter allowImages is false but the file's type is an image.
    Response code 200: Returns the file thumbnail as a base64 string of its 32x32 image thumbnail.
    """
    data = json.loads(request.data)
    name = data["name"]
    value = data["value"]
    user = current_user.username

    overwrite = bool("overwrite" in data)

    allow_images = bool("allowImages" in data)

    fileloader = FileLoader()
    same_file = fileloader.search(name=name, user=current_user)
    # same_file = File.query.filter_by(name=name, user=user).first()
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
    if new_file.extension in [".JPEG", ".JPG", ".PNG", ".GIF"] and not allow_images:
        return jsonify({"response": 300})

    # db.session.add(new_file)
    current_user.files.append(new_file)
    db.session.commit()

    images = FileLoader()
    file_data = images.load_thumbnail(new_file)

    return jsonify({"response": 200, "file": file_data})


@files.route('/getFile', methods=['POST'])
@login_required
def get_file():
    """
    '/getFile' route, returns the base64 representation of the image for web usage, along with its file type.

    Takes in 'name'<string> and 'whole'<data>;
    if whole is true, then the route with respond with the entire base64 encoded representation of the file data.

    Response code 204: File name is not given
    Response code 202: File does not exist in database
    Response code 200:
        Returns the file data as a string in base64 or just plain text
        Also returns the file type: [gif, image, text, code]
    """
    data = json.loads(request.data)
    if "name" not in data:
        return jsonify({"response": 204})

    fileloader = FileLoader()
    file = fileloader.search(name=data["name"], user=current_user)
    if not file:
        return jsonify({"response": 202})

    whole = bool("whole" in data)

    extension = file.extension
    if file.is_image:
        file_data = {"value": file.base64}
        if extension == ".GIF":
            file_data["type"] = "gif"
        else:
            file_data["type"] = "image"
        return jsonify({"response": 200, "file": file_data})
    
    # If 'whole' parameter is true, return the base64 encoded entire string
    if whole:
        value = base64.b64encode(file.value)
    else:
        value = file.text

    file_data = {
        "value": value,
        "type": ["text", "code"][int(file.is_code)]
    }
    if file.is_code:
        file_data["language"] = extension[1:]

    return jsonify({"response": 200, "file": file_data})

@files.route('/copyFile', methods=['POST'])
@login_required
def copy_file():
    """
    '/copyFile' route, creates a duplicate of a given file.
    If overwrite parameter is enabled, ignores the file query conditions.

    Takes in 'name'<string> of file to duplicate and 'overwrite'<bool>.

    Response code 204: File name not given
    Response code 202: File does not exist in database
    Response code 300: File with name of copied item exists, returns the name of the duplicate file.
    Response code 200: File duplication successfull, returns the name of the duplicate file.
    """
    data = json.loads(request.data)
    if "name" not in data:
        return jsonify({"response": 204})

    overwrite = bool("overwrite" in data)

    fileloader = FileLoader()
    file = fileloader.search(name=data["name"], user=current_user)
    if not file:
        return jsonify({"response": 202})

    split_name = data["name"].split(".")
    new_name = ".".join(split_name[:-1]) + " - Copy." + split_name[-1]

    same_file = fileloader.search(name=new_name, user=current_user)
    if same_file:
        if not overwrite:
            return jsonify({"response": 300, "name": new_name})
        else:
            db.session.delete(same_file)

    table = file.__table__
    non_pk_columns = [k for k in table.columns.keys() if k not in table.primary_key]

    file_info = {c: getattr(file, c) for c in non_pk_columns}
    new_file = File(**file_info)

    new_file.name = new_name

    db.session.add(new_file)
    db.session.commit()

    return jsonify({"response": 200, "name": new_name})

@files.route('/archiveFiles', methods=['POST'])
@login_required
def archive_files():
    """
    '/archiveFiles' route, archives a list of given files.

    Takes in a list of file names as strings.

    Response code 200: Successful archival.
    """
    data = json.loads(request.data)

    fileloader = FileLoader()
    for filename in data["images"]:
        file = fileloader.search(name=filename, user=current_user)
        file.set_property("archived", 1)
    db.session.commit()

    return jsonify({"response": 200})

@files.route('/restoreFiles', methods=['POST'])
@login_required
def restore_files():
    """
    '/restoreFiles' route, restores/unarchives a list of given files.

    Takes in a list of file names as strings.

    Response code 200: Successful restoration.
    """
    files = json.loads(request.data)

    fileloader = FileLoader()
    for filename in files:
        file = fileloader.search(name=filename, user=current_user)
        file.remove_property("archived")
    db.session.commit()

    return jsonify({"response": 200})

@files.route('/deleteFiles', methods=['POST'])
@login_required
def delete_files():
    """
    '/deleteFiles' route, permanently deletes a list of given files.

    Takes in a list of file names as strings.

    Response code 200: Successful deletion.
    """
    files = json.loads(request.data)

    fileloader = FileLoader()
    for filename in files:
        file = fileloader.search(name=filename, user=current_user)
        db.session.delete(file)
    db.session.commit()

    return jsonify({"response": 200})

@files.route('/downloadFiles', methods=['POST'])
@login_required
def download_files():
    """
    '/downloadFiles' route, creates a zipped folder with given files and returns the path of the folder to the user.
    Thus redirecting the user to the download page.

    Takes in either a list of file names to be downloaded
    Or if 'path' is a key of the request data, then it will delete the zip file, suggesting that the downloading process is complete.

    First download request:
        Response code 304: One or more request files does not exist.
        Response code 200: Responds with the path of the zipped folder.

    Upon download completion:
        Response code 401: Invalid zip
        Response code 200: Zip file has been deleted.
    """
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
    fileloader = FileLoader()
    for name in data:
        file = fileloader.search(name=name, user=current_user)
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
    print(5)

    log(f"Zip file downloaded, number of files: {len(files)}")

    return jsonify({"response": 200, "path": zip_path})

@files.route('/getFileStorage', methods=['POST'])
@login_required
def get_file_storage():
    """
    '/getFileStorage' route, returns the total file storage in bytes.

    Response code 200:
        Returns the total file storage taken up in bytes.
    """

    files = current_user.files
    size = sum([file.size for file in files])

    return jsonify({"response": 200, "size": size})

@files.route('/getExtensions', methods=['POST'])
@login_required
def get_valid_extensions():
    """
    '/getExtensions' route, returns the list of valid extensions
    For e.g. ["PNG", "JPEG", ..., "TXT", "DOCX"]
    """
    with open(join(dirname(__file__), "modules/types.json")) as f:
        data = json.load(f)
        extensions = list(data.keys())
        extensions.remove("other")
        f.close()
    return jsonify({"extensions": extensions})


@files.route('/renameFile', methods=['POST'])
@login_required
def rename_file():
    """
    '/renameFile' route

    Takes in request body data
        'originalName'<string>
        'newName'<string>

    Response code 200:
        Request was made succesfully
    Response code 300:
        File not found error.
    """
    data = json.loads(request.data)

    original_name = data["originalName"]
    new_name = data["newName"]

    fileloader = FileLoader()
    file = fileloader.search(name=original_name, user=current_user)
    if not file:
        return jsonify({"response": 300})
    
    file.name = new_name

    db.session.commit()

    return jsonify({"response": 200})
