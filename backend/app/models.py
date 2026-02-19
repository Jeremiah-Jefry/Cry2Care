from .extensions import db
from datetime import datetime

class CryRecord(db.Model):
    __tablename__ = 'cry_records'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    cause = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float)
    severity = db.Column(db.Float)
    rms = db.Column(db.Float)
    zcr = db.Column(db.Float)
    spectral_centroid = db.Column(db.Float)
    file_path = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": f"EVT-{self.id:03d}",
            "time": self.timestamp.strftime("%H:%M:%S"),
            "date": self.timestamp.strftime("%Y-%m-%d"),
            "cause": self.cause,
            "confidence": self.confidence,
            "severity": self.severity,
            "rms": self.rms,
            "zcr": self.zcr,
            "sc": self.spectral_centroid,
            "status": "Processed"
        }
