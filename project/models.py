"""
SQLAlchemy models which represent records within the database.

Current models being:
    User(id, email, password, name)
    ByteChunk(id, value<bytes>)
"""

import PIL.Image
from flask_login import UserMixin
from . import db
import PIL
from io import BytesIO
from base64 import b64encode

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
    value = db.Column(db.String)

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
    def bytes(self) -> BytesIO:
        return BytesIO(self.value)

    @property
    def image(self) -> PIL.Image.Image:
        return PIL.Image.open(self.bytes)

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