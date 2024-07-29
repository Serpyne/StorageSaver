
'Storage Saver' SAT project for VCE Software Development 3/4.

# Usage

- Download the git repo.
- Make sure Python 3.11 and PIP are installed.
- Install dependencies from **requirements.txt**
    - `pip install -r requirements.txt`
- Once all of the packages have been installed, you must set up the SQL database.
    - Create a file named **db.sqlite** in the */instance* directory.
    - Create two tables in the database, one named ***user*** and one named ***image***.

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

- You can run the program with `python -m flask run`.
- Access the site at **localhost:5000**.