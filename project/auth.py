"""
Routes handling authentication of login and sign up of account, and logging out.
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required
from .models import User
from . import db
from .modules.functions import bitshift_hash

from string import ascii_uppercase, digits
import json
import base64

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

    new_user = User(email=email, name=name, password=bitshift_hash(password))

    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for('auth.login'))

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

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

    print(f"Updated {user.name}'s password from {old_password} to {new_password}.")

    return redirect(url_for("main.profile"))

JPG_B64_START = "data:image/jpeg;base64"
@auth.route('/uploadImage', methods=['POST'])
@login_required
def upload_image():
    data = json.loads(request.data)
    img = data["value"]
    
    img = img[len(JPG_B64_START):]

    # g = open("out.jpg", "wb")
    # g.write(base64.b64decode(img))
    # g.close()
    img_bytes = base64.b64decode(img)

    return redirect(url_for("main.gallery"))