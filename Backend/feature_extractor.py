import librosa
import numpy as np

def extract_live_features(audio_path):
    try:
        # Load audio file (3-5 seconds is best for hackathon demos)
        y, sr = librosa.load(audio_path, duration=5)

        # 1. Calculate RMS (Volume/Energy)
        rms = np.mean(librosa.feature.rms(y=y))
        
        # 2. Calculate ZCR (Pitch/Shrillness)
        zcr = np.mean(librosa.feature.zero_crossing_rate(y=y))
        
        # 3. Calculate Spectral Centroid (Sharpness)
        sc = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        
        # 4. Calculate MFCCs (Vocal Fold Pattern)
        # We take the 13th coefficient mean as used in your dataset
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_13_mean = np.mean(mfccs[12]) 

        return {
            "RMS_Mean": round(float(rms), 4),
            "ZCR_Mean": round(float(zcr), 4),
            "SC_Mean": round(float(sc), 2),
            "MFCCs13Mean": round(float(mfcc_13_mean), 4)
        }

    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

# Example usage for the demo:
# features = extract_live_features("live_baby_recording.wav")
# print(features)