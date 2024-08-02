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
        - File manager        *
        - Albums              *
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
        - add sorting by date uploaded, date of image (TICK)
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
    Size in file manager (recently delete) is formatted to be bytes, KB, MB, or GB.

    31/07 23:25 - Fixed scrolling and elements moving around, changed scrollbar.
    
    01/08 15:49 - getElementFromFileName is currently linear search, could
    implement binary search instead.

    01/08 18:00 - Adding multiple file selecting in the recently deleted section.
    Restoring files works now.
    Looking to implement this into the gallery as well.
    Also revamped the Image model to be named File. Hopefully will help with
    the file manager later on.

    01/08 22:30 - Added a preview and other buttons to recently deleted page.
    Moved a bunch of files around to be more organised. Multiple image selection
    added to gallery page. Confirmation prompts are now bolded and with line breaks
    to be more readable.
    Files can be permanently deleted in recently deleted.
        - Looking to start work on file manager
        - Calculate total file storage
        - Overwriting does not rely on archived files
            - Either overwrite file in recently deleted (what is being done now)
            - Or allow both versions to work but put overwrite prompt if file with same name is being restored.
        - Start all files
        * Do about us if getting very tired.

    02/08 1:43 - Broke through on the file manager. File uploads are now done with
    multiple requests (one per file) so that we can collect errors if there are
    duplicate files or if any of the files are not in the correct format (They
    must not be image files). Therefore the system is very modular and hopefully
    can implement back into the gallery system.
    Overwrite works a lot better too. It stops image files first, then overwrite
    has another option named 'skip' which you can use to not overwrite the duplicate
    files, but still upload the rest of the files.
    - Next to work on display the uploaded items *
    - Plus an upload notification per file on the bottom left *
    - Must add right clicking to file manager and recently deleted which parallel the file options.

    02/08 11:45 - File manager and recently deleted now share inheritance with 'file_bare.js'.
    This is because they have similar utilities like preview and file selection,
    however some things will differ like restoration and uploading.
    Fixed retrieving archived or non-archived files in ImageLoader.load_thumbnails(archived<bool>)
    Added code blocks to file previews where the file supports it.
    Uploading works well except changed the 'skip' option to just skip over duplicate files and the first
    upload request will upload all of the files that it can.
    Fixed conflict between bulma.js and prism.js where they conflicted with named classes.
    This was done by taking in a parameter 'ignore_highlighting' when rendering the HTML template,
    and if this boolean value is true, then some of the classes and inheritance is individuallised
    such that the two packages can work in tandem.
        - Displays files now.
        -> should work on upload notification for file manager. *
        -> After that do file storage calculation.
        -> Then context menu

    Ever just put a semicolon after the initilaisation of a for loop. Yeah it doesnt throw an error so youre searching and searching and theres just nothing there

    02/08 14:44 - The user can now download files within zip files. This is done from the backend,
    the name of the zip file is a 5-character long random string with the hash function applied.
    Therefore the chance of two zips having the same name is one in 52^5 (Both upper and lowercase chars).
    The list of file names are parsed in and the values are retrieved. As such, these names and values
    are written as bytes into a zipped folder using the Python module 'zipfile'.
        * However, the date modified of the downloaded files are not retained.
    Also an upload notification shows up for every file that is uploaded now.

    02/08 16:18 - Copying files added, problem was that you couldn't directly copy a File object. You
    would have to save its information without the primary key, being the id. Then you can save
    that as a File object and make changes to it.
        - Now to do multiple file copying and deletion

    I HATE JAVACSRIPT, WHY ARE FOR LOOPS USING "OF" INSTEAD OF "IN" THATS SO WEIRD
    02/08 16:56 - Implemented overwrite protection when copying files. Now to do multiple file deletion.

    02/08 18:25 - I did not start file deletion, i spent the last hour just fixing the copy code.
    Oh well
"""

from flask import Blueprint, render_template, url_for, request
from flask_login import login_required

from .models import File
from .modules.fileloader import FileLoader
from .modules.fileloader import FILES, IMAGES

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
        img = File.query.get(int(parameters["id"]))
        return render_template('viewer.html', data=img)

    images = FileLoader()
    image_json = images.load(archived=None)
    # print([f"{key}: {value[:16]}..." for key, value in image_json.items()])

    return render_template('gallery.html', images=image_json)

@main.route('/file_manager', methods=["GET"])
@login_required
def file_manager():
    images = FileLoader()
    files = images.load_thumbnails(_type=FILES)
    return render_template("file_manager.html", files=files, ignore_highlighting=True)


@main.route('/albums', methods=["GET"])
@login_required
def albums():
    ...

@main.route('/recently_deleted', methods=["GET"])
@login_required
def recently_deleted():
    images = FileLoader()
    files = images.load_thumbnails(archived=True)
    return render_template("recently_deleted.html", files=files, ignore_highlighting=True)

@main.route('/about_us', methods=["GET"])
@login_required
def about_us():
    ...

@main.route('/test', methods=["GET"])
def test():
    return render_template("test.html", ignore_highlighting=True)