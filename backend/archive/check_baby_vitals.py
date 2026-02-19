import librosa
import numpy as np
import sys

# Ensure terminal handles special characters
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def get_cry_vitals(file_path):
    try:
        # 1. Load the audio
        y, sr = librosa.load(file_path, duration=5)

        # 2. Calculate the "Big Four" Features
        rms = np.mean(librosa.feature.rms(y=y))
        zcr = np.mean(librosa.feature.zero_crossing_rate(y=y))
        sc = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_val = np.mean(mfccs[0]) # Using the first coefficient for vocal shape

        # 3. Print the Results for the Terminal
        print("\n" + "="*40)
        print(" BABY CRY ACOUSTIC VITALS")
        print("="*40)
        print(f" RMS (Energy/Volume):    {rms:.4f}")
        print(f" ZCR (Pitch/Shrillness): {zcr:.4f}")
        print(f" SC (Sharpness/Texture): {sc:.2f} Hz")
        print(f" MFCC (Vocal Quality):   {mfcc_val:.4f}")
        print("-" * 40)
        
        # Simple Interpretation for the Hackathon
        if zcr > 0.1:
            print("AI INSIGHT: High frequency detected. Possible distress/pain.")
        else:
            print("AI INSIGHT: Low frequency detected. Pattern looks like a standard cry.")
        print("="*40 + "\n")

    except Exception as e:
        print(f" Error processing file: {e}")

# REPLACE THIS with the path to one of your baby cry files
test_file = "Baby_Cry_Dataset/hungry/hu-1.wav" 
get_cry_vitals(test_file) 