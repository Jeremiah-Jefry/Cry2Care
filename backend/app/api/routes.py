import os
from flask import request, jsonify
from . import api_bp
from ..services.ai_service import ai_service
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"})

@api_bp.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Call AI Service
        result = ai_service.predict(file_path)
        
        # Cleanup file after prediction (optional, but good practice)
        # os.remove(file_path)
        
        return jsonify(result)

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    # Mock logs for now, will connect to DB in Phase 3
    return jsonify([
        {"id": "EVT-001", "time": "10:00:00", "type": "Analysis", "desc": "Hunger detected", "sev": "Normal"},
        {"id": "EVT-002", "time": "10:15:00", "type": "Alert", "desc": "High distress", "sev": "High"}
    ])
