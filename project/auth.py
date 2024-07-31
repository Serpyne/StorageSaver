"""
Routes handling authentication of login and sign up of account, and logging out.
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify, Response
from flask_login import login_user, logout_user, login_required, current_user

from .models import User, Image
from .models import JPG_START, PNG_START, DATE_FORMAT
from . import db
from .modules.functions import bitshift_hash, log

from string import ascii_uppercase, digits
import json
import base64
from datetime import datetime

auth = Blueprint('auth', __name__)

def contains_chars(chars: str, string: str) -> bool:
    for char in chars:
        if char in string:
            return True
    return False

MIN_CHARS = 8
MAX_CHARS = 25
SPECIAL_CHARS = "!@#$%^&*_-+=/?"
def verify_password(password: str) -> bool | list[str]:
    """
    Password length must be between 3 and 25 chars long.
    Password must contain one uppercase char, a number, and one special char.
    """
    messages = []
    if len(password) < MIN_CHARS:
        messages.append(f"Password must be at least {MIN_CHARS} characters long.")

    if len(password) > MAX_CHARS:
        messages.append(f"Password must be less than {MAX_CHARS} characters long.")

    if not contains_chars(ascii_uppercase, password):
        messages.append("Password must contain one capital letter.")

    if not contains_chars(digits, password):
        messages.append("Password must contain a number.")

    if not contains_chars(SPECIAL_CHARS, password):
        messages.append("Password must contain one special character.")

    if not messages:
        return True
    return messages

def verify_email(email: str) -> bool | list[str]:
    ...

@auth.route('/login')
def login():
    return render_template('login.html')

@auth.route('/login', methods=['POST'])
def login_post():
    email = request.form.get('email')
    password = request.form.get('password')
    remember_me = True if request.form.get('remember') else False

    user = User.query.filter_by(email=email).first()

    def prompt():
        flash('Please check your login details and try again.')
        return redirect(url_for('auth.login'))

    if not user:
        return prompt()
    elif user.password != bitshift_hash(password):
        return prompt()
    
    login_user(user, remember=remember_me)
    
    return redirect(url_for('main.profile'))

@auth.route('/signup')
def signup():
    return render_template('signup.html')

@auth.route('/signup', methods=['POST'])
def signup_post():
    email = request.form.get('email')
    name = request.form.get('name')
    password = request.form.get('password')

    # If user is returned, then the email already exists
    user = User.query.filter_by(email=email).first()

    if user:
        flash('Email address already exists')
        return redirect(url_for('auth.signup'))

    password_check = verify_password(password)
    if type(password_check) == list:
        for notif in password_check:
            flash(notif)
        return redirect(url_for('auth.signup'))

    new_user = User(email=email, username=name, password=bitshift_hash(password))

    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for('auth.login'))

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@auth.route('/changeEmail', methods=['POST'])
@login_required
def change_email():
    data = request.form.to_dict()

    old_email = data["old-email"]
    new_email = data["new-email"]

    if not (old_email and new_email):
        flash("Email must not be empty.")
        return redirect(url_for("main.profile"))
    
    if old_email == new_email:
        flash("Email must be different to your previous email.")
        return redirect(url_for("main.profile"))
    
    # If password does not match then throw error
    user = User.query.filter_by(email=old_email).first()
    if not user:
        flash("Please check your email details and try again.")
        return redirect(url_for("main.profile"))

    email_check = verify_email(new_email)
    if type(email_check) == list:
        for notif in email_check:
            flash(notif)
        return redirect(url_for('main.profile'))
    
    user.email = new_email
    db.session.commit()

    log(f"Updated {user.username}'s email from {old_email} to {new_email}.")

    return redirect(url_for("main.profile"))

@auth.route('/changePassword', methods=['POST'])
@login_required
def change_password():
    data = request.form.to_dict()

    old_password = data["old-password"]
    new_password = data["new-password"]

    if not (old_password and new_password):
        flash("Password must not be empty.")
        return redirect(url_for("main.profile"))
    
    if old_password == new_password:
        flash("Password must be different to your previous password.")
        return redirect(url_for("main.profile"))
    
    # If password does not match then throw error
    user = User.query.filter_by(password=bitshift_hash(old_password)).first()
    if not user:
        flash("Please check your password details and try again.")
        return redirect(url_for("main.profile"))

    password_check = verify_password(new_password)
    if type(password_check) == list:
        for notif in password_check:
            flash(notif)
        return redirect(url_for('main.profile'))
    
    user.password = bitshift_hash(new_password)
    db.session.commit()

    log(f"Updated {user.username}'s password from {old_password} to {new_password}.")

    return redirect(url_for("main.profile"))

@auth.route('/uploadImage', methods=['POST'])
@login_required
def upload_image():
    if request.method != "POST":
        return

    data = json.loads(request.data)

    overwrite = bool("overwrite" in data.keys())
    user = current_user.username

    images = data["images"]

    image_objects = []

    existing_files = []
    for image in images:
        img = image["value"]
        filename: str = image["name"]

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

        image_object = Image.query.filter_by(name=filename, user=user).first()
        if image_object:
            if not overwrite:
                # Check if the filename already exists, only if the overwrite option is False
                existing_files.append(image_object)
            else:
                # Replace image data
                db.session.delete(image_object)
                image_object = Image(name=filename, user=user, value=img_bytes)
                image_object.set_property("date_uploaded", datetime.now().strftime(DATE_FORMAT))
                
        else:
            image_object = Image(name=filename, user=user, value=img_bytes)
            image_object.set_property("date_uploaded", datetime.now().strftime(DATE_FORMAT))
            
        # Base64 Image is sometimes rotated 90 degrees clockwise.
        # Rotate it back if the orientation is that.
        if image_object.orientation == 8:
            print("rotated")
            image_object.value = image_object.rotate_left()

        image_objects.append(image_object)

    if existing_files:
        files = [file.name for file in existing_files]
        log(f"File(s) already exists: {', '.join(files)}")
        return { "response": 201, "files": files}

    # Send response back with image information
    return_images = []
    for image_obj in image_objects:
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

@auth.route('/getImage', methods=['POST'])
@login_required
def get_image():
    data = json.loads(request.data)
    filename = data["name"]
    username = current_user.username

    img = Image.query.filter_by(name=filename, user=username).first()

    max_height = min(1280, img.dims[1]//2)
    return jsonify({"base64": img.base64, "downsized": img.resize(max_height), "metadata": img.get_metadata()})


@auth.route('/archiveImages', methods=['POST'])
@login_required
def archive_images():
    data = json.loads(request.data)

    user = current_user.username
    for filename in data["images"]:
        img = Image.query.filter_by(name=filename, user=user).first()
        img.set_property("archived", 1)
    db.session.commit()

    return jsonify({"response": 200})