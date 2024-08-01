"""
Routes handling file management
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from .models import File
from . import db

import json

files = Blueprint('files', __name__)

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