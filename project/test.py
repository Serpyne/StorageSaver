from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

dialect = "postgresql"
user = "serpyne"
password = ...
host = "storage-saver.cluster-cnk0kagqe046.ap-southeast-2.rds.amazonaws.com"
port = 5432
db_name = "mydatabase"

app.config['SQLALCHEMY_DATABASE_URI'] = '{dialect}://{user}:{password}@{host}:{port}/{db_name}'
db = SQLAlchemy(app)