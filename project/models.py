"""
SQLAlchemy models which represent records within the database.

Current models being:
    User(id, email, password, name)
    ByteChunk(id, value<bytes>)
"""

from flask_login import UserMixin
from . import db
from PIL import Image as PILImage
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
    name = db.Column(db.String(1000))

class Image(db.Model):
    name = db.Column(db.String, primary_key=True)
    value = db.Column(db.String)

    @property
    def extension(self):
        """
        Returns .png or .jpg for extensions. Returns False if neither match.
        """

        if self.value[:4] == PNG_SEQUENCE[0] and self.value[-4:] == PNG_SEQUENCE[1]:
            return ".png"
        elif self.value[:2] == JPG_SEQUENCE:
            return ".jpg"
        
        return False
        
    @property
    def bytes(self):
        return BytesIO(self.value)

    @property
    def image(self):
        return PILImage.open(self.bytes)

    @property
    def size(self):
        return len(self.value)
    
    @property
    def dims(self):
        return self.image.size
    
    @property
    def base64(self):
        if self.extension == ".png":
            return PNG_START + b64encode(self.value).decode("utf-8")
        elif self.extension == ".jpg":
            return JPG_START + b64encode(self.value).decode("utf-8")
        
        return False
    