from flask_sqlalchemy import SQLAlchemy
from flask import Flask

db = SQLAlchemy()

app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret-key-goes-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

db.init_app(app)

meta = db.metadata

students = db.Table(
    'image', meta, 
    db.Column('name', db.String, primary_key = True), 
    db.Column('value', db.String), 
)

with app.app_context():
    db.create_all()