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
            (Note: Solved by photo downsizing on 22/07)
        - Image selection and modification tools [select, delete,
        rename, etc.]

    22/07 13:48 - Noticed that page loading took upwards of 1.0 second
    just to load six images. This was because the base64 images were
    sent to the client in original resolution which meant load times
    were extremely high.
    Implemented a resize function to the Image model which returns a
    resized base64 string representation of the image based on a given height. 

    23/07 13:01 - Added threading to gallery loading so that load times
    are reduced from ~5 secs to only 1 second.
    Ideas:
        - Add sorting (alphbetical, revrerse, date uploaded)
        - Add filtering
        - Add grouping
        - Media details
        - Add searching
        - Append photos in alphabetical order

    25/07 2:59 - Instructions to configure AWS RDS MySQL Database:
        - In cmd, enter `ssh -i "ec2-key-pair.pem" <ec2-host>`, where the host is in .env
        - As default user 'ubuntu', run `mysql -h <host> -P 3306 -u <user> -p`
        - There you have access to the SQL.
        I already did `CREATE DATABASE storagesaver`

    25/07 23:40 - Added an overlay to gallery items which shows its file name
    and a select button which will show all select buttons when add least one
    item is selected.
        - Next to add image close up, details, sharing and editing tools.

    26/07 00:53 - Added right click context menu for images, and selecting items
    will show a selection panel at the top of the screen with options for selecting
    all and deselecting all.
        - Could implement a 'select all in current group: with dropdown'.

    26/07 10:53 - Fixed an issue where images uploaded in base64 lose their orientation
    metadata, so I added a correction which would rotate the images back if the
    orientation was wrong. 

    29/07 14:54 - Gallery items on click will show a preview with a half-opacity black
    background. Images are first shown as the low quality version and then once the 
    full quality image is taken from the database, it is shown.

    29/07 22:31 - Image zooming complete with a lens to zoom into a specific area of
    the image.

    29/07 10:48 - Optimised the zooming by lowering image quality a factor of 4, and
    fixed some issues with the viewer closing when it wasn't supposed to, like when
    zoomed image was clicked and then the viewer closed.

    30/07 1:56-2:23 - Converted the old top navigation menu into a foldable side bar
    menu which smoothly opens and closes. Also closes the image viewer when opened,
    and when an item is viewed, the menu is closed.
    What navigation to add next?
        - All files
        - File manager
        - Albums
        - Settings
        - About Us

    30/07 18:12 - Added ability to change the lens size with mouse scroll-wheel.
    Optimised by increasing the quality of the image when it is zoomed in enough.

    30/07 20:33 - Added info panel to display information about the image.

    30/07 22:46 - Added the ability to overwrite files with a confirmation prompt 

    30/07 23:24 - Created the last routes that I want on the website:
    [All files, file manager, albums, settings, about us].
    About halfway there now, only 6 days left!
    Looking to complete the image archiving and deletion system, and maybe I will
    start work on the About Us page just to wrap up the day.

    31/07 3:21 - Started worked on a recently deleted section (the beginnings of
    the file manager system) complete with sorting by name, type, and file
    size. It also shows a little 32x32 thumbnail (which I added a method [Image.thumbnail]
    to the Image model to crop it to a square).
    Looking forward, I want to:
        - add sorting by date uploaded, date of image
        - display date and size in the appropriate format.
        - Find a way to make a distinction between files and images,
            while maintaining the same model for the DB structure.

    31/07 18:34 - Reading files out of sync so not all files were being added
    before the upload request was sent. 

    31/07 21:15 - Added content fit for the image viewer and the user can now
    upload several images at a time. I have also implemented a loading icon when
    an image is being uploaded.
    I would like to optimise load times of the gallery as it takes upwards of
    six seconds to load 20+ images. Also revamping uploading and overwriting to
    fit the several files thing.

    31/07 22:46 - Fixed some style issues, added fading out to the upload queue
    notifications, and fixed the overwriting not deleting the previous image.
"""

from flask import Blueprint, render_template, url_for, request
from flask_login import login_required, current_user

from . import db
from .models import Image

from time import perf_counter
from threading import Thread

main = Blueprint('main', __name__)

@main.route('/favicon.ico')
def favicon():
    return url_for("static", filename="icons/favicon.ico")

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

class ImageLoader:
    def __init__(self):
        self.images = {}

    def load(self, **keys):
        threads = []

        user_images = Image.query.filter(Image.user == current_user.username)
        for image in user_images:
            for key in keys:
                if image.get_property(key) != keys[key]:
                    break
            else:
                threads.append(Thread(target=self.load_image, args=(image,)))

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join()

        return self.images

    def load_image(self, image: Image):
        self.images[f"{image.id}:{image.name}"] = image.resize(height=240)

@main.route('/all_files', methods=["GET"])
@login_required
def all_files():
    ...

@main.route('/gallery', methods=["GET"])
@login_required
def gallery():
    # Gallery page

    # Viewing single files
    parameters = request.args
    if "id" in parameters:
        img = Image.query.get(int(parameters["id"]))
        return render_template('viewer.html', data=img)

    images = ImageLoader()
    image_json = images.load(archived=None)

    # print([f"{key}: {value[:16]}..." for key, value in image_json.items()])

    return render_template('gallery.html', images=image_json)

@main.route('/file_manager', methods=["GET"])
@login_required
def file_manager():
    ...

@main.route('/albums', methods=["GET"])
@login_required
def albums():
    ...

@main.route('/recently_deleted', methods=["GET"])
@login_required
def recently_deleted():
    files = Image.query.filter_by(user=current_user.username).all()
    files = [file for file in files if file.get_property("archived")]
    files = [{
        "name": file.name,
        "date_taken": file.date,
        "date_uploaded": file.get_property("date_uploaded"),
        "type": file.type,
        "size": file.size,
        "src": file.thumbnail
    } for file in files]

    return render_template("recently_deleted.html", files=files)

@main.route('/about_us', methods=["GET"])
@login_required
def about_us():
    ...