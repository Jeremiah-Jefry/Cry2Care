import os
from dotenv import load_dotenv

# Load .env file from the root directory
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(basedir), '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MODEL_PATH = os.environ.get('MODEL_PATH') or os.path.join(os.path.dirname(basedir), 'model')
    
class DevConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_PASSWORD')}@{os.environ.get('MYSQL_HOST')}/{os.environ.get('MYSQL_DB')}"

class ProdConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_PASSWORD')}@{os.environ.get('MYSQL_HOST')}/{os.environ.get('MYSQL_DB')}"

config = {
    'development': DevConfig,
    'production': ProdConfig,
    'default': DevConfig
}
