"""
Provides web routes for the root, profile and gallery pages. 

devlog:
    13/07 17:00 - Initalised the full file structure for a flask
    web server. Virtual environment is added which allows
    environmental variables to be set. Some pages initialised (base,
    index, login, profile, sign-up).

    16/07 19:52 - Added functionality which updates SQL database with
    user sign-in details upon form completion. The user is given by a
    user Model object which stores the id<int>, email, password (hashed
    for security), and name. Next functionality to add is when a user
    provides a password during sign-in, it is hashed and then compared
    with the stored password to verify sign-in. 

    18/07 12:30 - Completed login and sign-up pages with authorisation
    capabilites. If a user is logged in, the profile navigation button
    is shown. However, if the user is not loggin in, the login and
    sign-up buttons are shown instead. 

    19/07 20:30 - Created verify_password function which returns a list
    of errors[str] if the given password does not fit the criteria, or
    returns True if all criteria are fulfilled.

    20/07 20:30 - Created a gallery and started a menu bar with upload
    button.

    21/07 3:51 - Added a file picker with functionality of sending the
    image to the backend in base64, which is then decoded and converted
    to the preferred image format of bytes.

    21/07 22:59 - Added file uploading and gallery which loads photos
    stored in the database as bytes, which are then converted to base64
    for the website to display. This required creating the Image model
    which has many properties for returning the file extension, size,
    dimensions, and base64 web format. Currently only supports .png
    and .jpg image formats.
    Should implement:
        - Media storage for multiple users at a time.
        - Store media in chunks of bytes?
        - Caching images in session such that load times increase.
        - Image selection and modification tools [select, delete,
        rename, etc.]
"""

from flask import Blueprint, render_template
from flask_login import login_required, current_user
from . import db
from .models import Image

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/profile')
@login_required
def profile():
    return render_template('profile.html', name=current_user.name)

@main.route('/gallery')
def gallery():
    image_json = {}
    
    for image in Image.query.all():
        image_json[image.name] = image.base64

    # print([f"{key}: {value[:16]}..." for key, value in image_json.items()])

    return render_template('gallery.html', images=image_json)
