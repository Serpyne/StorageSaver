"""
SQLAlchemy models which represent records within the database.

The database models being:
    User(id, email<str>, password<str>, username<str>, settings<str>) -> relationship User.files to File model
        - Represents a registered user and has their own index of files
    File(id, name<str>, user<str>, value<bytes>, exif<str>, properties<str>)
        - Stores the bytes representation of a file.
        - Has methods for image preview and returning its base64 representation.
"""

from flask_login import UserMixin
from . import db
from io import BytesIO
from base64 import b64encode
from datetime import datetime
from .modules.functions import decrypt, encrypt

import json
import PIL
import PIL.Image
from os.path import join, dirname
from PIL import TiffImagePlugin
from PIL.Image import Exif
from PIL.ExifTags import TAGS

with open(join(dirname(__file__), "modules/types.json"), "r") as f:
    TYPES = json.load(f)
    f.close()

FILE_SRC = "static/icons/file64.png"

JPG_START = "data:image/jpeg;base64,"
PNG_START = "data:image/png;base64,"
GIF_START = "data:image/gif;base64,"

PNG_SEQUENCE = b"\x89PNG", b"\xaeB`\x82"
JPG_SEQUENCE = b"\xff\xd8"

DATE_FORMAT = "%Y/%m/%d %H:%M:%S"

with open(join(dirname(__file__), "modules/settings.json"), "r") as f:
    SETTINGS = json.load(f)
    f.close()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(32), unique=True)
    password = db.Column(db.String(32))
    username = db.Column(db.String, unique=True)
    settings = db.Column(db.String)

    files = db.relationship("File", order_by="File.name") # Sort by user.name to perform binary search

    def change_setting(self, setting: str, value: str | int | bool | None) -> None:
        """
        Change setting to a value
        """
        if not self.settings:
            settings = {}
        else:
            settings = json.loads(decrypt(self.settings))

        settings[setting] = value

        self.settings = encrypt(json.dumps(settings))

    def get_setting(self, setting: str) -> str | int | bool | None:
        if not self.settings:
            return None

        settings = json.loads(decrypt(self.settings))

        if setting not in settings:
            return None
        
        return settings[setting]
    
    def get_all_settings(self) -> dict:
        user_settings = {}

        for key in SETTINGS.keys():
            value = self.get_setting(key)
            if value:
                user_settings[key] = value

        return user_settings
    
class File(db.Model):
    __tablename__ = 'file'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    user = db.Column(db.String, db.ForeignKey('user.username')) # ForeignKey defines the connection between User.files and a File object.
    value = db.Column(db.String)
    exif = db.Column(db.String)
    properties = db.Column(db.String)

    def set_property(self, key: str, value: str) -> None:
        if not self.properties:
            self.properties = "{}"

        self.properties = json.loads(self.properties)
        self.properties[key] = value
        self.properties = json.dumps(self.properties)

        db.session.commit()

    def get_property(self, key: str) -> str | None:
        if not self.properties:
            return None
        
        properties = json.loads(self.properties)

        if key not in properties:
            return None
        
        return properties[key]

    def remove_property(self, key: str) -> None:
        if not self.properties:
            return
        
        properties = json.loads(self.properties)

        if key not in properties:
            return
        
        del properties[key]
        self.properties = json.dumps(properties)

        db.session.commit()

    @property
    def extension(self) -> str | bool:
        """
        Returns .PNG or .JPEG for extensions. Returns the filename extension otherwise, Returns None if nothing matches.
        """

        if self.value[:4] == PNG_SEQUENCE[0] and self.value[-4:] == PNG_SEQUENCE[1]:
            return ".PNG"
        elif self.value[:2] == JPG_SEQUENCE:
            return ".JPEG"
        
        extension = self.name.split(".")[-1]
        extension = "".join(extension.split())
        extension = extension.upper()
        if extension in TYPES:
            return "." + extension

        return None

    @property
    def size(self) -> int:
        return len(self.value)
    
    @property
    def date(self) -> tuple[int]:
        md = self.get_metadata()
        if "DateTime" in md:
            date_obj = datetime.strptime(md["DateTime"], "%Y:%m:%d %H:%M:%S")
            return date_obj.strftime(DATE_FORMAT)
        else:
            return None
    
    @property
    def type(self) -> str:
        ext = self.extension
        if ext == None:
            return TYPES["other"]
        elif ext[1:] in TYPES:
            return TYPES[ext[1:]]
        else:
            return TYPES["other"]

    @property
    def thumbnail(self):
        # Returns a 32x32 cropped version of the image.
        # If it is not an image file, then it returns a file icon.
        if not self.is_image:
            return FILE_SRC

        extension = self.extension
        im = self.image
        
        # GIF returns the first frame but downsized
        if extension == ".GIF":
            im.seek(1)
            extension = ".PNG"

        dims = self.dims

        # Portrait
        if dims[1] > dims[0]:
            height = int(dims[1] * 32 // dims[0])
            # Images are downsized and cropped to 32x32
            im_downsized = im.resize((32, height), PIL.Image.Resampling.BICUBIC)
            top = height // 2 - 16
            bottom = top + 32
            im_cropped = im_downsized.crop((0, top, 32, bottom))

        # Landscape
        else:
            width = int(dims[0] * 32 // dims[1])
            im_downsized = im.resize((width, 32), PIL.Image.Resampling.BICUBIC)
            left = width // 2 - 16
            right = left + 32
            im_cropped = im_downsized.crop((left, 0, right, 32))

        buffered = BytesIO()
        im_cropped.save(buffered, format=extension[1:]) # Stripping the period off of the file extension
        img_str = b64encode(buffered.getvalue())

        if extension == ".PNG":
            return PNG_START + img_str.decode("utf-8")
        elif extension == ".JPEG":
            return JPG_START + img_str.decode("utf-8")
        
    @property
    def is_image(self):
        return self.extension in [".PNG", ".JPEG", ".JPG", ".GIF"]

    @property
    def is_code(self):
        return self.extension in [".PY", ".JS", ".CSS", ".HTML", ".AHK", ".C", ".CPP", ".CS", ".LUA", ".VB", ".VBA", ".JSON"]

    @property
    def text(self):
        if self.is_image:
            return self.base64
        
        try:
            data = self.value.decode('utf-8')
        except UnicodeDecodeError:
            return "File format is not supported for preview."

        return data

    # Image methods

    @property
    def bytesio(self) -> BytesIO:
        if not self.extension:
            self.value = JPG_SEQUENCE + self.value
        return BytesIO(self.value)

    @property
    def image(self) -> PIL.Image.Image:
        return PIL.Image.open(self.bytesio)

    @property
    def dims(self) -> tuple[int]:
        return self.image.size
    
    @property
    def base64(self) -> str | bool:
        if self.extension == ".PNG":
            return PNG_START + b64encode(self.value).decode("utf-8")
        elif self.extension in [".JPEG", ".JPG"]:
            return JPG_START + b64encode(self.value).decode("utf-8")
        elif self.extension == ".GIF":
            return GIF_START + b64encode(self.value).decode("utf-8")
        
        return False

    @property
    def first_frame(self) -> str:
        if self.extension != ".GIF":
            return None
        
        im = self.image
        im.seek(1)

        buffered = BytesIO()
        im.save(buffered, format="PNG") # Stripping the period off of the file extension
        img_str = b64encode(buffered.getvalue())

        return PNG_START + img_str.decode("utf-8")

    @property
    def frame_count(self) -> int:
        if self.extension != ".GIF":
            return None
        
        return self.image.n_frames

    def resize(self, height: int, sampling = PIL.Image.Resampling.BICUBIC) -> str:
        """
        Resize the image to a specified height.
        Returns a base64 string
        """
        # Scale width to same aspect ratio with changed height
        dims = self.dims
        width = int(dims[0] * height // dims[1])
        im_downsized = self.image.resize((width, height), sampling)

        extension = self.extension

        buffered = BytesIO()
        im_downsized.save(buffered, format=extension[1:]) # Stripping the period off of the file extension
        img_str = b64encode(buffered.getvalue())

        if extension == ".PNG":
            return PNG_START + img_str.decode("utf-8")
        elif extension == ".JPEG":
            return JPG_START + img_str.decode("utf-8")
        
        return FILE_SRC
    
    def rotate_left(self) -> bytes:
        original = self.image
        original = original.rotate(90, expand=True)

        extension = self.extension

        buffered = BytesIO()
        original.save(buffered, format=extension[1:]) # Stripping the period off of the file extension
        return buffered.getvalue()

    def deprecated_rotate_left(self) -> bytes:
        """
        Deprecated as the nested for loops was too slow.
        Rotates the image 90 degrees anti-clockwise. Returns a Byte array
        """
        w, h = self.dims

        original = self.image
        original_pixels = original.load()

        new = PIL.Image.new('RGB', (h, w))
        new_pixels = new.load()

        for y in range(h):
            for x in range(w):
                new_pixels[y, w-x-1] = original_pixels[x, y]
        
        extension = self.extension

        buffered = BytesIO()
        new.save(buffered, format=extension[1:]) # Stripping the period off of the file extension

        return buffered.getvalue()
        
    def get_metadata(self) -> Exif:
        """
        Get image metadata using python's Exif module.
        """
        # self.exif = self.image.getexif()
        # self._metadata = self.exif
        # <class 'PIL.Image.Exif'>

        if self.exif != None:
            return json.loads(self.exif)

        img_exif = self.image.getexif()
        data = {TAGS[key]: float(val) if isinstance(val, TiffImagePlugin.IFDRational) else val for key, val in img_exif.items() if key in TAGS}
        self.exif = json.dumps(data)

        return data
    
    @property
    def orientation(self) -> int:
        return self.get_metadata().get("Orientation")