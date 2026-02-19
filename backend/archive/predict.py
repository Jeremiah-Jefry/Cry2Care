import joblib
import librosa
import numpy as np

# Load the brain you built
model = joblib.load('cry_model.pkl')
label_encoder = joblib.load('label_encoder.pkl')

def predict_new_cry(file_path):
    # 1. Extract features (Use the SAME logic as your training script)
    audio, sr = librosa.load(file_path, res_type='kaiser_fast')
    mfccs = np.mean(librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40).T, axis=0)
    
    # 2. Predict
    prediction = model.predict([mfccs])
    
    # 3. Turn the number back into a word
    cause = label_encoder.inverse_transform(prediction)
    return cause[0]

# Test it with a random file
# result = predict_new_cry("path_to_a_test_file.wav")
# print(f"The baby is crying because of: {result}")