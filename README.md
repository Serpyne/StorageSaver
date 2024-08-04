
'Storage Saver' SAT project for VCE Software Development 3/4.

# Installation

- Download the git repo.
- Make sure Python 3.11 and PIP are installed.
- Install dependencies from **requirements.txt**
    - `pip install -r requirements.txt`
- Once all of the packages have been installed, you must set up the SQL database.
    - Create a file named **db.sqlite** in the */instance* directory.
    - Create two tables in the database, one named ***user*** and one named ***image***.

    - This is the format of the models within the respective tables:
```
User:
    id: integer (primary key)
    email: string (unique)
    password: string
    username: string (unique)
    settings: string-json

File:
    id: integer (primary key)
    name: string
    user: string
    value: bytes
    exif: string-json
    properties: string-json
```
- Create a file named **.env** in the root directory with three variables:
```
FLASK_APP=project
FLASK_ENV=development
secret=<your secret>
```
- Note that the secret can be anything, as it is used to secure your database.

# Usage
- You can run the program with `python -m flask run`.
- Access the site at **localhost:5000**.