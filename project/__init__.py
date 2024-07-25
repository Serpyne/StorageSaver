"""
Used to mark the /project directory as a python Package directory,
such that the child files can refer to one another using relative
parent imports.
The create_app function initalises the SQL database. 
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from .modules.functions import bitshift_hash

from os import getenv
from dotenv import load_dotenv
load_dotenv()

LOCAL = 0xfa
RDS = 0xfb

MODE = LOCAL

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    if MODE == RDS:
        dialect = "mysql+pymysql"
        user = getenv("serpyne")
        password = getenv("password")
        host = getenv("host")
        port = 3306
        db_name = "storagesaver"

        app.config['SQLALCHEMY_DATABASE_URI'] = f'{dialect}://{user}:{password}@{host}:{port}/{db_name}'
    elif MODE == LOCAL:
        app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db.sqlite"

    app.config['SECRET_KEY'] = bitshift_hash(getenv("secret"))

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app