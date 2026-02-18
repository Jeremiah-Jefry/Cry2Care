import librosa
import numpy as np
import os
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

DATASET_PATH = "Baby Cry Dataset"
data = []

def extract_features(file_path):
    audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast') 
    
    # 1. MFCCs
    mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
    mfccs_scaled = np.mean(mfccs.T, axis=0)
    
    # 2. Chroma (Pitch classes)
    chroma = np.mean(librosa.feature.chroma_stft(y=audio, sr=sample_rate).T, axis=0)
    
    # 3. Spectral Contrast
    contrast = np.mean(librosa.feature.spectral_contrast(y=audio, sr=sample_rate).T, axis=0)
    
    # Combine all features into one long array
    return np.hstack([mfccs_scaled, chroma, contrast])

# --- INTEGRATED STEP 2 (With Safety Net) ---
print("Starting feature extraction... skipping unsupported files.")

for label in os.listdir(DATASET_PATH):
    folder_path = os.path.join(DATASET_PATH, label)
    if os.path.isdir(folder_path):
        print(f"Processing folder: {label}")
        for file in os.listdir(folder_path):
            file_path = os.path.join(folder_path, file)
            
            # This 'try' block catches the .3gp error and keeps the script running
            try:
                features = extract_features(file_path)
                if features is not None:
                    data.append([features, label])
            except Exception as e:
                # This line triggers when it hits bp-17.3gp
                print(f"  > Skipping {file}: Format not supported.")
                continue

# --- STEP 3: PREPARATION ---
print(f"\nSuccessfully processed {len(data)} files.")
df = pd.DataFrame(data, columns=['feature', 'label'])

X = np.array(df['feature'].tolist())
y = np.array(df['label'].tolist())

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

print("Data is ready for the model!")

# --- STEP 4: TRAINING & EVALUATION ---
print("Training the Core ML Model...")
# class_weight='balanced' automatically adjusts for the small sample sizes
rf_model = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)

print(f"\n DONE! Model Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print("\nDetailed Performance Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# Save files so you can give them to your teammates
joblib.dump(rf_model, 'cry_model.pkl')
joblib.dump(label_encoder, 'label_encoder.pkl')
print("\nSuccess! 'cry_model.pkl' has been created in your folder.")