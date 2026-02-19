import os
from flask import request, jsonify
from . import api_bp
from ..extensions import db
from ..models import CryRecord
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
            
            if result.get("status") == "success":
                # Save to Database
                record = CryRecord(
                    cause=result["cause"],
                    confidence=result["confidence"],
                    severity=result["severity"],
                    rms=result["vitals"]["rms"],
                    zcr=result["vitals"]["zcr"],
                    spectral_centroid=result["vitals"]["sc"],
                    file_path=file_path
                )
                db.session.add(record)
                db.session.commit()
                result["id"] = f"EVT-{record.id:03d}"
                print(f"DEBUG: Saved record {record.id} to DB")

            print(f"DEBUG: Prediction result: {result}")
            return jsonify(result)
        except Exception as e:
            db.session.rollback()
            print(f"DEBUG: Exception during prediction: {str(e)}")
            return jsonify({"error": str(e), "status": "error"}), 500

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    try:
        records = CryRecord.query.order_by(CryRecord.timestamp.desc()).limit(50).all()
        return jsonify([r.to_dict() for r in records])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
