"""
SQLAlchemy models which represent records within the database.

Current models being:
    User(id, email, password, name)
    ByteChunk(id, value<bytes>)
"""

from flask_login import UserMixin
from . import db
from io import BytesIO
from base64 import b64encode, b64decode

import PIL
import PIL.Image
from PIL.Image import Exif

ORIENTATION = 0x112 # 274

JPG_START = "data:image/jpeg;base64,"
PNG_START = "data:image/png;base64,"

PNG_SEQUENCE = b"\x89PNG", b"\xaeB`\x82"
JPG_SEQUENCE = b"\xff\xd8"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    username = db.Column(db.String(1000), unique=True)

class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    user = db.Column(db.String)
    value: bytes = db.Column(db.String)

    @property
    def extension(self) -> str | bool:
        """
        Returns .png or .jpeg for extensions. Returns False if neither match.
        """

        if self.value[:4] == PNG_SEQUENCE[0] and self.value[-4:] == PNG_SEQUENCE[1]:
            return ".png"
        elif self.value[:2] == JPG_SEQUENCE:
            return ".jpeg"
        
        return False
        
    @property
    def bytesio(self) -> BytesIO:
        return BytesIO(self.value)

    @property
    def image(self) -> PIL.Image.Image:
        return PIL.Image.open(self.bytesio)

    @property
    def size(self) -> int:
        return len(self.value)
    
    @property
    def dims(self) -> tuple[int]:
        return self.image.size
    
    @property
    def base64(self) -> str | bool:
        if self.extension == ".png":
            return PNG_START + b64encode(self.value).decode("utf-8")
        elif self.extension == ".jpeg":
            return JPG_START + b64encode(self.value).decode("utf-8")
        
        return False
    
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

        if extension == ".png":
            return PNG_START + img_str.decode("utf-8")
        elif extension == ".jpeg":
            return JPG_START + img_str.decode("utf-8")
    
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
        Rotates the image 90 degrees anti-clockwise. Returns a Byte
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
        im = PIL.Image.open(self.bytesio)
        return im.getexif()
    
    @property
    def orientation(self) -> int:
        return self.get_metadata().get(ORIENTATION)