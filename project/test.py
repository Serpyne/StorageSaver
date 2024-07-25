from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import pymysql

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://serpyne:suspiciousMammal?!3572@storage-saver.cnk0kagqe046.ap-southeast-2.rds.amazonaws.com/countpool?charset=utf8mb4'
db = SQLAlchemy(app)