import os
from flask import request, jsonify
from . import api_bp
from ..services.ai_service import ai_service
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@api_bp.route('/', methods=['GET'])
def index():
    return jsonify({
        "name": "Cry2Care Clinical API",
        "version": "2.4.0",
        "status": "online",
        "endpoints": {
            "health": "/api/health",
            "predict": "/api/predict",
            "logs": "/api/logs"
        }
    })

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"})

@api_bp.route('/predict', methods=['POST'])
def predict():
    print("DEBUG: /api/predict called")
    if 'file' not in request.files:
        print("DEBUG: No file part in request")
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        print("DEBUG: No selected file")
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        print(f"DEBUG: File saved to {file_path}")
        
        # Call AI Service
        try:
            print("DEBUG: Calling ai_service.predict")
            result = ai_service.predict(file_path)
            print(f"DEBUG: Prediction result: {result}")
            return jsonify(result)
        except Exception as e:
            print(f"DEBUG: Exception during prediction: {str(e)}")
            return jsonify({"error": str(e), "status": "error"}), 500

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    # Mock logs for now, will connect to DB in Phase 3
    return jsonify([
        {"id": "EVT-001", "time": "10:00:00", "type": "Analysis", "desc": "Hunger detected", "sev": "Normal"},
        {"id": "EVT-002", "time": "10:15:00", "type": "Alert", "desc": "High distress", "sev": "High"}
    ])
