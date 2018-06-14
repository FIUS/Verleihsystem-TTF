"""
TTF Module
"""
from os import environ, path
from logging import Formatter
from logging.handlers import RotatingFileHandler

from flask import Flask, logging
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_webpack import Webpack
from flask_cors import CORS, cross_origin


WEBPACK = Webpack()  # type: Webpack


# Setup Config

APP = Flask(__name__, instance_relative_config=True)  # type: Flask
APP.config['MODE'] = environ['MODE'].upper()
if APP.config['MODE'] == 'PRODUCTION':
    APP.config.from_object('total_tolles_ferleihsystem.config.ProductionConfig')
elif APP.config['MODE'] == 'DEBUG':
    APP.config.from_object('total_tolles_ferleihsystem.config.DebugConfig')
elif APP.config['MODE'] == 'TEST':
    APP.config.from_object('total_tolles_ferleihsystem.config.TestingConfig')


APP.config.from_pyfile('/etc/total-tolles-ferleihsystem.conf', silent=True)
APP.config.from_pyfile('total-tolles-ferleihsystem.conf', silent=True)
if ('CONFIG_FILE' in environ):
    APP.config.from_pyfile(environ.get('CONFIG_FILE', 'total-tolles-ferleihsystem.conf'), silent=True)


CONFIG_KEYS = ('SQLALCHEMY_DATABASE_URI', 'CELERY_BROKER_URL', 'CELERY_RESULT_BACKEND', 'JWT_SECRET_KEY', 'LOG_PATH')
for env_var in CONFIG_KEYS:
    APP.config[env_var] = environ.get(env_var, APP.config.get(env_var))


FORMATTER = Formatter(fmt=APP.config['LOG_FORMAT'])

FH = RotatingFileHandler(path.join(APP.config['LOG_PATH'], 'ttf.log'),
                         maxBytes=104857600, backupCount=10)

FH.setFormatter(FORMATTER)

APP.logger.addHandler(FH)

APP.logger.info('Connecting to database %s.', APP.config['SQLALCHEMY_DATABASE_URI'])


# Setup DB and bcrypt
DB = SQLAlchemy(APP)  # type: SQLAlchemy
BCRYPT = Bcrypt(APP)  # type: Bcrypt

# Setup JWT
JWT = JWTManager(APP)  # type: JWTManager

# Setup Headers
CORS(APP)


WEBPACK.init_app(APP)

# Setup Celery
from .tasks import make_celery
celery = make_celery(APP)

# pylint: disable=C0413
from . import db_models
# pylint: disable=C0413
from . import routes
