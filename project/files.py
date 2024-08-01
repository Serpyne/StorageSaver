"""
Routes handling file management
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from .models import File, DATE_FORMAT
from . import db

import json
import base64
from datetime import datetime

files = Blueprint('files', __name__)

@files.route('/uploadFile', methods=['POST'])
@login_required
def upload_files():
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
    if new_file.extension in [".JPEG", ".JPG", "PNG"]:
        return jsonify({"response": 300})

    db.session.add(new_file)
    db.session.commit()

    return jsonify({"response": 200})

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