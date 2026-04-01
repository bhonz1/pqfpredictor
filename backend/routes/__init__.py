# Routes package
from .student_routes import student_bp
from .accomplishment_routes import accomplishment_bp
from .prediction_routes import prediction_bp
from .model_routes import model_bp
from .auth_routes import auth_bp

__all__ = ['student_bp', 'accomplishment_bp', 'prediction_bp', 'model_bp', 'auth_bp']
