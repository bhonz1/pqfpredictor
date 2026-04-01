from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')  # 'admin' or 'student'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Student-specific fields (nullable for admins)
    student_profile_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'student_profile_id': self.student_profile_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100))
    institution = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    accomplishments = db.relationship('Accomplishment', backref='student', lazy=True, cascade='all, delete-orphan')
    predictions = db.relationship('PQFPrediction', backref='student', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'course': self.course,
            'institution': self.institution,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'accomplishments_count': len(self.accomplishments),
            'predictions_count': len(self.predictions)
        }

class Accomplishment(db.Model):
    __tablename__ = 'accomplishments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    activities_performed = db.Column(db.Text, nullable=False)
    skills = db.Column(db.Text, nullable=False)
    number_of_hours = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'week_number': self.week_number,
            'activities_performed': self.activities_performed,
            'skills': self.skills,
            'number_of_hours': self.number_of_hours,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PQFPrediction(db.Model):
    __tablename__ = 'pqf_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    model_used = db.Column(db.String(100), nullable=False)
    predicted_level = db.Column(db.Integer, nullable=False)
    confidence_score = db.Column(db.Float)
    features_used = db.Column(db.JSON)
    prediction_details = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'model_used': self.model_used,
            'predicted_level': self.predicted_level,
            'confidence_score': self.confidence_score,
            'features_used': self.features_used,
            'prediction_details': self.prediction_details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UploadedModel(db.Model):
    __tablename__ = 'uploaded_models'
    
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    model_type = db.Column(db.String(50))  # e.g., 'sklearn', 'tensorflow', 'pytorch'
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'model_name': self.model_name,
            'filename': self.filename,
            'model_type': self.model_type,
            'description': self.description,
            'is_active': self.is_active,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class Signatory(db.Model):
    __tablename__ = 'signatories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    office = db.Column(db.String(100), nullable=False)
    signature_path = db.Column(db.String(200))  # Path to signature image
    display_order = db.Column(db.Integer, default=0)  # Order for certificate display
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'position': self.position,
            'office': self.office,
            'signature_path': self.signature_path,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
