from flask import Flask, redirect, url_for, jsonify
from flask_cors import CORS
from config import config
from .extensions import db

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    @app.route('/')
    def root():
        return redirect('/api/')

    # Register blueprints
    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
