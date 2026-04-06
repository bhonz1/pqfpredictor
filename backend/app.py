from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
import os

app = Flask(__name__)

# Database Configuration - Supports both SQLite (local) and PostgreSQL (Supabase/Production)
def get_database_url():
    """Get database URL, converting postgres:// to postgresql:// for SQLAlchemy compatibility"""
    database_url = os.getenv('DATABASE_URL', 'sqlite:///pqf_system.db')
    
    # SQLAlchemy requires postgresql:// not postgres://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    return database_url

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'models', 'uploaded')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# SQLAlchemy engine options for PostgreSQL (pooling settings)
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgresql://'):
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'max_overflow': 20,
        'pool_recycle': 1800,
        'pool_pre_ping': True
    }

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import db from models and initialize with app
from models.database_models import db
db.init_app(app)

migrate = Migrate(app, db)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
from routes.student_routes import student_bp
from routes.prediction_routes import prediction_bp
from routes.model_routes import model_bp
from routes.accomplishment_routes import accomplishment_bp
from routes.auth_routes import auth_bp
from routes.signatory_routes import signatory_bp

app.register_blueprint(student_bp, url_prefix='/api/students')
app.register_blueprint(accomplishment_bp, url_prefix='/api/accomplishments')
app.register_blueprint(prediction_bp, url_prefix='/api/predictions')
app.register_blueprint(model_bp, url_prefix='/api/models')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(signatory_bp)

@app.route('/')
def index():
    return {"message": "PQF Predictive Model API", "status": "running"}

@app.route('/api/health')
def health_check():
    return {"status": "healthy"}

def seed_default_admin():
    """Seed default admin user if not exists"""
    from models.database_models import User
    admin_username = 'Beast'
    admin_password = 'Beast123'
    
    existing_admin = User.query.filter_by(username=admin_username).first()
    if not existing_admin:
        admin_user = User(
            username=admin_username,
            email='admin@pqf-system.local',
            role='admin',
            is_active=True
        )
        admin_user.set_password(admin_password)
        db.session.add(admin_user)
        db.session.commit()
        print(f"[INFO] Default admin user created: {admin_username}")
    else:
        print(f"[INFO] Default admin user already exists: {admin_username}")

def auto_load_model():
    """Auto-load PQF-OJTActivities.model if it exists"""
    from services.classifier_service import init_classifier_service, get_classifier_service
    init_classifier_service(app.config['UPLOAD_FOLDER'])
    
    model_file = 'PQF-OJTActivities.model'
    model_path = os.path.join(app.config['UPLOAD_FOLDER'], model_file)
    
    if os.path.exists(model_path):
        # Check if already in database
        from models.database_models import UploadedModel
        existing = UploadedModel.query.filter_by(filename=model_file).first()
        if not existing:
            # Add to database
            new_model = UploadedModel(
                model_name='PQF-OJTActivities',
                filename=model_file,
                file_path=model_file,
                model_type='sklearn',
                description='Auto-loaded PQF OJT Activities Classifier',
                is_active=True
            )
            db.session.add(new_model)
            db.session.commit()
            print(f"[INFO] Registered model: {model_file}")
        
        # Load the model
        try:
            classifier = get_classifier_service()
            success = classifier.load_model(model_file, 'PQF-OJTActivities')
            if success:
                print(f"[INFO] Successfully loaded model: PQF-OJTActivities")
            else:
                print(f"[ERROR] Failed to load model: {model_file}")
        except Exception as e:
            print(f"[ERROR] Cannot load model (incompatible format): {e}")
            print(f"[INFO] The .model file appears to be Weka/Java format, not Python pickle.")
            print(f"[INFO] Please convert to Python format (.pkl or .joblib) or use the API without model loading.")
    else:
        print(f"[WARNING] Model file not found: {model_path}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_default_admin()
        auto_load_model()
    
    app.run(debug=True, port=5001)
