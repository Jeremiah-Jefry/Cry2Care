import os
import subprocess
import time
import sys

def run_command(command, cwd=None):
    print(f"Executing: {command} in {cwd or 'current directory'}")
    return subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    print(" Initializing Cry2Care Clinical Suite...")
    
    # 1. Install Backend Dependencies
    print(" Installing backend dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # 2. Initialize Database
    print(" Initializing MySQL Database...")
    subprocess.run([sys.executable, "init_db.py"])
    
    # 3. Start Backend
    print(" Starting Flask Backend (Port 5000)...")
    backend_proc = run_command(f"{sys.executable} run.py", cwd="backend")
    
    # 4. Start Frontend
    print(" Starting Frontend Dashboard...")
    if os.path.exists("frontend/node_modules"):
        frontend_proc = run_command("npm run dev", cwd="frontend")
    else:
        print(" node_modules not found, attempting npm install...")
        subprocess.run(["npm", "install"], cwd="frontend")
        frontend_proc = run_command("npm run dev", cwd="frontend")
    
    print("\n" + "="*40)
    print(" SYSTEM IS LIVE")
    print("Frontend: http://localhost:5173")
    print("Backend API: http://localhost:5000/api")
    print("="*40 + "\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n Shutting down system...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
