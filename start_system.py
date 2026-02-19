import os
import subprocess
import time
import sys

def run_command(command, cwd=None):
    print(f"Executing: {command} in {cwd or 'current directory'}")
    return subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    print("="*40)
    print(" CRY2CARE CLINICAL SYSTEM LAUNCHER ")
    print("="*40)
    
    # 1. Install Backend Dependencies
    print("\n[1/4] checking dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    except subprocess.CalledProcessError:
        print("❌ Dependency installation failed. Please check your internet connection.")
        return

    # 2. Initialize Database
    print("\n[2/4] Initializing Database...")
    subprocess.run([sys.executable, "init_db.py"])
    
    # 3. Start Backend
    print("\n[3/4] Starting Flask Backend...")
    # Using 'python run.py' explicitly with current interpreter
    backend_proc = run_command(f"{sys.executable} run.py", cwd="backend")
    
    # 4. Start Frontend
    print("\n[4/4] Starting React Dashboard...")
    if os.path.exists("frontend/node_modules"):
        frontend_proc = run_command("npm run dev", cwd="frontend")
    else:
        print("⚠️ node_modules not found, installing...")
        subprocess.run(["npm", "install"], cwd="frontend", shell=True)
        frontend_proc = run_command("npm run dev", cwd="frontend")
    
    print("\n" + "✨" * 20)
    print("  SYSTEM READY & OPERATIONAL")
    print("  DASHBOARD: http://localhost:5173")
    print("  API HUB:   http://localhost:5000/api")
    print("✨" * 20 + "\n")
    print("Monitoring services... (Press Ctrl+C to stop everything)\n")
    
    try:
        while True:
            # Check if processes are still running
            if backend_proc.poll() is not None:
                print("🛑 Backend process died! Restarting or exiting...")
                break
            if frontend_proc.poll() is not None:
                print("🛑 Frontend process died! Restarting or exiting...")
                break
            time.sleep(2)
    except KeyboardInterrupt:
        print("\n[Stopping System] Shutting down processes safely...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()
        print("👋 Goodbye.")

if __name__ == "__main__":
    main()
