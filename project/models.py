"""
SQLAlchemy models which represent records within the database.

Current models being:
    User(id, email, password, name)
    ByteChunk(id, value<bytes>)
"""

from flask_login import UserMixin
from . import db

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(1000))

class ByteChunk(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.String)