from project import db, create_app, models
from os.path import join, dirname

app = create_app()

print("Creating database.")
with app.app_context():
    db.create_all()

print("Done")