import os
import mysql.connector
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv()

def init_database():
    # 1. Connect to MySQL (without DB first to create it)
    try:
        conn = mysql.connector.connect(
            user=os.getenv('MYSQL_USER'),
            password=os.getenv('MYSQL_PASSWORD'),
            host=os.getenv('MYSQL_HOST')
        )
        cursor = conn.cursor()
        
        db_name = os.getenv('MYSQL_DB')
        
        # 2. Create Database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")
        print(f"Database '{db_name}' initialized.")
        
        # 3. Execute SQL files from database folder
        db_folder = 'database'
        if os.path.exists(db_folder):
            for filename in os.listdir(db_folder):
                if filename.endswith('.sql'):
                    with open(os.path.join(db_folder, filename), 'r') as f:
                        sql_script = f.read()
                        for command in sql_script.split(';'):
                            if command.strip():
                                cursor.execute(command)
                    print(f"Executed SQL script: {filename}")

        # 4. Create default tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cry_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path VARCHAR(255),
                cause VARCHAR(100),
                severity FLOAT,
                confidence FLOAT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dataset_features (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Cry_Audio_File TEXT,
                Cry_Reason INT,
                RMS_Mean FLOAT,
                ZCR_Mean FLOAT,
                SC_Mean FLOAT
            )
        """)
        
        conn.commit()
        
        # 5. Seed Data from dataset folder
        seed_dataset(cursor, conn)
        
        cursor.close()
        conn.close()
        print("Database initialization complete.")
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")

def seed_dataset(cursor, conn):
    dataset_path = os.getenv('DATASET_PATH')
    csv_file = os.path.join(dataset_path, 'donateacry-corpus_features_final.csv')
    
    if os.path.exists(csv_file):
        print(f"Seeding dataset from {csv_file}...")
        df = pd.read_csv(csv_file)
        
        # We only take a subset of columns for the simple DB table
        # or we could dynamically create columns. Let's stick to core ones for now.
        for index, row in df.iterrows():
            cursor.execute("""
                INSERT INTO dataset_features (Cry_Audio_File, Cry_Reason, RMS_Mean, ZCR_Mean, SC_Mean)
                VALUES (%s, %s, %s, %s, %s)
            """, (row['Cry_Audio_File'], row['Cry_Reason'], row['RMS_Mean'], row['ZCR_Mean'], row['SC_Mean']))
        
        conn.commit()
        print(f"Inserted {len(df)} records into dataset_features.")

if __name__ == "__main__":
    init_database()
