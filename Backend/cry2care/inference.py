import joblib
import librosa
import numpy as np

# 1. Load your saved 'Intelligence'
model = joblib.load('cry_model.pkl')
label_encoder = joblib.load('label_encoder.pkl')

def predict_cry_cause(audio_path):
    try:
        # 2. Extract features exactly like you did in training
        audio, sr = librosa.load(audio_path, res_type='kaiser_fast')
        
        mfccs = np.mean(librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40).T, axis=0)
        chroma = np.mean(librosa.feature.chroma_stft(y=audio, sr=sr).T, axis=0)
        contrast = np.mean(librosa.feature.spectral_contrast(y=audio, sr=sr).T, axis=0)
        
        features = np.hstack([mfccs, chroma, contrast]).reshape(1, -1)
        
        # 3. Predict
        prediction_numeric = model.predict(features)
        cause = label_encoder.inverse_transform(prediction_numeric)
        
        # 4. Get probability (Confidence Score)
        probs = model.predict_proba(features)
        confidence = np.max(probs) * 100
        
        return cause[0], confidence
    except Exception as e:
        return f"Error: {e}", 0

# TEST IT:
# result, score = predict_cry_cause("Baby Cry Dataset/hungry/hu-1.wav")
# print(f"Result: {result} ({score:.2f}% confidence)")