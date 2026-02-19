# Cry2Care Clinical Suite v3.0


**Cry2Care** is a premium, hospital-grade acoustic monitoring system designed for neonatal and pediatric care. By utilizing advanced signal processing and machine learning, it identifies the causation of infant distress (crying) with precision, providing clinical staff with real-time severity alerts and diagnostic metadata.

---

## Key Features

-   ** AI Classification Engine**: Real-time identification of cry causes (Hunger, Pain, Discomfort, etc.) using MFCC-based neural mapping.
-   ** Vital Signal Analytics**: Deep tracking of RMS Power, Zero-Crossing Rate (ZCR), and Spectral Centroids for objective distress assessment.
-   ** Protocol-Driven Notifications**: A high-severity alert system that bounces critical events to the dashboard immediately.
-   ** Dusk Protocol UI**: A "Soft-Dark" user interface designed for 24/7 monitoring without eye strain, featuring high-end Glassmorphism.
-   ** Real-time Visualization**: Dynamic acoustic timelines and classification splits powered by Recharts and Framer Motion.

---

##  Tech Stack

### **Frontend**
-   **Core**: React 18 + Vite
-   **Styling**: Tailwind CSS (v4) with Custom Design Tokens
-   **Motion**: Framer Motion 11 for organic transitions
-   **Charts**: Recharts (Acoustic Spectral Mapping)
-   **Icons**: Lucide-React

### **Backend**
-   **Server**: Flask (Python 3.11)
-   **Analysis**: Librosa (Spectral Engineering), NumPy
-   **Intelligence**: Scikit-learn / Joblib (Pre-trained Models)
-   **Database**: MySQL with SQLAlchemy ORM
-   **Protocol**: RESTful JSON API

---

##  Getting Started

### **Prerequisites**
-   Python 3.11+
-   Node.js 18+
-   MySQL Server (XAMPP / Workbench)

### **One-Click Launch**
I have included a dedicated orchestration script to boot the entire clinical environment safely.

```powershell
# 1. Clone the repository
git clone https://github.com/Jeremiah-Jefry/Cry2Care.git
cd Cry2Care

# 2. Run the system launcher
python start_system.py
```

*The launcher will automatically verify dependencies, initialize the database, and start both the Flask API (Port 5000) and the Vite Dashboard (Port 5173).*

---

##  Design Philosophy: "Dusk Protocol"

Unlike traditional medical software that is often harsh and clinical-white, **Cry2Care v3.0** implements the **Dusk Protocol**.

-   **Soft Slate Palette**: Uses `#1e293b` as a base to mimic the night sky, reducing blue-light exposure for nocturnal staff.
-   **Matte Surfaces**: Cards use 40% opacity slates with complex backdrop-blurs (20px) to create a sense of depth and focus.
-   **Diffuse Glows**: Safe status indicators use soft teal pulses (`#2dd4bf`), while alerts utilize coral ripples to ensure visibility without inducing panic.

---

##  Project Structure

```text
Cry2Care/
├── backend/            # Flask API & AI Architecture
│   ├── app/
│   │   ├── api/        # REST Endpoints
│   │   ├── models/     # SQL Schemas
│   │   └── services/   # AI Signal Processing (AIService)
│   └── model/          # Pre-trained .pkl Models
├── frontend/           # React Dashboard
│   ├── src/
│   │   ├── components/ # Glassmorphism Elements
│   │   └── App.jsx     # Main Clinical Controller
│   └── index.css       # Dusk Protocol Logic
├── start_system.py      # Master Orchestrator
└── init_db.py           # Database Provisioning
```

---

##  License
This project is for clinical research and educational purposes.  
**Built with ❤️ for better neonatal care.**