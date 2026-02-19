import os
import joblib
import librosa
import numpy as np
from flask import current_app

class AIService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.label_encoder = None
            cls._instance.anomaly_model = None
        return cls._instance

    def load_models(self):
        """Load models only once (Singleton pattern)."""
        if self.model is None:
            model_dir = current_app.config['MODEL_PATH']
            print(f"DEBUG: AIService loading models from {model_dir}")
            
            model_path = os.path.join(model_dir, 'cry_model.pkl')
            label_encoder_path = os.path.join(model_dir, 'label_encoder.pkl')
            anomaly_model_path = os.path.join(model_dir, 'cry_anomaly_model.joblib')

            if os.path.exists(model_path):
                print(f"DEBUG: Loading {model_path}")
                self.model = joblib.load(model_path)
            else:
                print(f"DEBUG: ERROR - {model_path} NOT FOUND")
            
            if os.path.exists(label_encoder_path):
                print(f"DEBUG: Loading {label_encoder_path}")
                self.label_encoder = joblib.load(label_encoder_path)
            else:
                print(f"DEBUG: ERROR - {label_encoder_path} NOT FOUND")
                
            if os.path.exists(anomaly_model_path):
                print(f"DEBUG: Loading {anomaly_model_path}")
                self.anomaly_model = joblib.load(anomaly_model_path)
            
            print(f"DEBUG: Models loaded status: Model={self.model is not None}, Encoder={self.label_encoder is not None}")

    def predict(self, audio_file_path):
        """Extract features and predict cause."""
        self.load_models()
        
        if self.model is None or self.label_encoder is None:
            return {"error": "Models not loaded correctly"}

        try:
            # 1. Load audio and extract features (matching backend-old/predict.py)
            audio, sr = librosa.load(audio_file_path, res_type='kaiser_fast')
            mfccs = np.mean(librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40).T, axis=0)
            
            # 2. Predict Classification
            prediction = self.model.predict([mfccs])
            cause = self.label_encoder.inverse_transform(prediction)[0]
            
            # 3. Predict Anomaly/Severity (if needed)
            # This is placeholders for now based on the existence of cry_anomaly_model.joblib
            severity = 0.5 # Default
            if self.anomaly_model:
                # Assuming anomaly model takes similar features or subset
                # Replace with actual anomaly detection logic if known
                pass

            return {
                "cause": cause,
                "confidence": 0.95, # Placeholder
                "severity": severity,
                "status": "success"
            }
        except Exception as e:
            return {"error": str(e), "status": "error"}

ai_service = AIService()
