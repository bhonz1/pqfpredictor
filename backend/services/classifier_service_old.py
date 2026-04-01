import pickle
import joblib
import os
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PQFClassifierService:
    """Service for loading and managing PQF classification models"""
    
    def __init__(self, models_folder: str):
        self.models_folder = models_folder
        self.loaded_models: Dict[str, Any] = {}
        self.model_metadata: Dict[str, Dict] = {}
    
    def load_model(self, model_path: str, model_name: str) -> bool:
        """Load a model from file path"""
        try:
            full_path = os.path.join(self.models_folder, model_path)
            
            if not os.path.exists(full_path):
                logger.error(f"Model file not found: {full_path}")
                return False
            
            # Try different loading methods based on file extension
            if full_path.endswith('.pkl') or full_path.endswith('.pickle'):
                with open(full_path, 'rb') as f:
                    model = pickle.load(f)
            elif full_path.endswith('.joblib'):
                model = joblib.load(full_path)
            elif full_path.endswith('.h5') or full_path.endswith('.keras'):
                # TensorFlow/Keras model
                try:
                    import tensorflow as tf
                    model = tf.keras.models.load_model(full_path)
                except ImportError:
                    logger.error("TensorFlow not installed for .h5 model loading")
                    return False
            elif full_path.endswith('.pth') or full_path.endswith('.pt'):
                # PyTorch model
                try:
                    import torch
                    model = torch.load(full_path, map_location='cpu')
                except ImportError:
                    logger.error("PyTorch not installed for .pth model loading")
                    return False
            else:
                # Try pickle as default
                with open(full_path, 'rb') as f:
                    model = pickle.load(f)
            
            self.loaded_models[model_name] = model
            self.model_metadata[model_name] = {
                'path': full_path,
                'loaded_at': str(np.datetime64('now'))
            }
            
            logger.info(f"Successfully loaded model: {model_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            return False
    
    def unload_model(self, model_name: str) -> bool:
        """Unload a model from memory"""
        if model_name in self.loaded_models:
            del self.loaded_models[model_name]
            del self.model_metadata[model_name]
            logger.info(f"Unloaded model: {model_name}")
            return True
        return False
    
    def list_loaded_models(self) -> List[str]:
        """List all currently loaded models"""
        return list(self.loaded_models.keys())
    
    def extract_features(self, accomplishments: List[Dict]) -> Dict[str, Any]:
        """Extract features from student accomplishments for PQF classification"""
        if not accomplishments:
            return {}
        
        # Aggregate features
        total_hours = sum(acc.get('number_of_hours', 0) for acc in accomplishments)
        num_weeks = len(set(acc.get('week_number', 0) for acc in accomplishments))
        
        # Combine all activities and skills
        all_activities = ' '.join(acc.get('activities_performed', '') for acc in accomplishments)
        all_skills = ' '.join(acc.get('skills', '') for acc in accomplishments)
        
        # Calculate complexity metrics
        activity_complexity = len(set(all_activities.lower().split()))
        skill_diversity = len(set(all_skills.lower().split()))
        
        # Average hours per week
        avg_hours_per_week = total_hours / num_weeks if num_weeks > 0 else 0
        
        features = {
            'total_hours': total_hours,
            'num_weeks': num_weeks,
            'avg_hours_per_week': avg_hours_per_week,
            'activity_complexity': activity_complexity,
            'skill_diversity': skill_diversity,
            'activities_text': all_activities,
            'skills_text': all_skills
        }
        
        return features
    
    def predict_pqf_level(self, model_name: str, features: Dict[str, Any]) -> Tuple[Optional[int], Optional[float], Optional[Dict]]:
        """Predict PQF level using specified model"""
        if model_name not in self.loaded_models:
            logger.error(f"Model {model_name} not loaded")
            return None, None, None
        
        model = self.loaded_models[model_name]
        
        try:
            # Prepare feature vector (customize based on your model's expected input)
            feature_vector = self._prepare_feature_vector(features)
            
            # Make prediction based on model type
            if hasattr(model, 'predict'):
                # Scikit-learn style model
                prediction = model.predict([feature_vector])[0]
                
                # Get prediction probabilities if available
                confidence = None
                if hasattr(model, 'predict_proba'):
                    probabilities = model.predict_proba([feature_vector])[0]
                    confidence = float(max(probabilities))
                    
                    # Get all class probabilities
                    classes = model.classes_ if hasattr(model, 'classes_') else range(len(probabilities))
                    prob_dict = {str(int(c)): float(p) for c, p in zip(classes, probabilities)}
                else:
                    prob_dict = None
                
                details = {
                    'feature_vector': feature_vector.tolist() if isinstance(feature_vector, np.ndarray) else feature_vector,
                    'probabilities': prob_dict
                }
                
                return int(prediction), confidence, details
                
            elif hasattr(model, 'forward'):
                # PyTorch model
                import torch
                with torch.no_grad():
                    if isinstance(feature_vector, np.ndarray):
                        feature_vector = torch.tensor(feature_vector, dtype=torch.float32)
                    if feature_vector.dim() == 1:
                        feature_vector = feature_vector.unsqueeze(0)
                    
                    output = model(feature_vector)
                    prediction = torch.argmax(output, dim=1).item()
                    probabilities = torch.softmax(output, dim=1).squeeze().tolist()
                    confidence = max(probabilities)
                    
                    details = {
                        'feature_vector': feature_vector.tolist(),
                        'probabilities': {str(i): p for i, p in enumerate(probabilities)}
                    }
                    
                    return int(prediction), float(confidence), details
            else:
                logger.error(f"Unknown model type for {model_name}")
                return None, None, None
                
        except Exception as e:
            logger.error(f"Error making prediction with model {model_name}: {str(e)}")
            return None, None, None
    
    def _prepare_feature_vector(self, features: Dict[str, Any]) -> np.ndarray:
        """Prepare feature vector from extracted features"""
        # Default feature preparation - customize based on your model
        numeric_features = [
            features.get('total_hours', 0),
            features.get('num_weeks', 0),
            features.get('avg_hours_per_week', 0),
            features.get('activity_complexity', 0),
            features.get('skill_diversity', 0)
        ]
        
        # Note: For text features (activities_text, skills_text), 
        # you may need to use vectorizers that were saved with the model
        return np.array(numeric_features)
    
    def get_pqf_level_description(self, level: int) -> str:
        """Get description for PQF level"""
        descriptions = {
            1: "Knowledge and skills that are applied in activities that are routine, repetitive, and predictable.",
            2: "Knowledge and skills that are applied in activities that are set in a range of familiar and non-familiar contexts.",
            3: "Knowledge and skills that are applied in activities that are diverse, unfamiliar, and changing.",
            4: "Knowledge and skills that are applied in activities that are complex, non-routine, and involve unfamiliar contexts.",
            5: "Knowledge and skills that involve specialized, complex, and professional work activities.",
            6: "Knowledge and skills that involve advanced professional or highly specialized work activities.",
            7: "Knowledge and skills that involve highly advanced, specialized, and complex professional work activities."
        }
        return descriptions.get(level, "Unknown PQF Level")

# Global service instance
classifier_service = None

def init_classifier_service(models_folder: str):
    """Initialize the global classifier service"""
    global classifier_service
    classifier_service = PQFClassifierService(models_folder)
    return classifier_service

def get_classifier_service() -> PQFClassifierService:
    """Get the global classifier service instance"""
    global classifier_service
    if classifier_service is None:
        raise RuntimeError("Classifier service not initialized")
    return classifier_service
