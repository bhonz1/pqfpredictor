import pickle
import joblib
import os
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RuleBasedPQFClassifier:
    """Rule-based classifier for PQF levels when ML model is unavailable"""
    
    def predict(self, features: List[List[float]]) -> List[int]:
        """Predict PQF level based on rule-based logic"""
        results = []
        for feature_vector in features:
            total_hours = feature_vector[0]
            num_weeks = feature_vector[1]
            avg_hours = feature_vector[2]
            activity_complexity = feature_vector[3]
            skill_diversity = feature_vector[4]
            
            # Rule-based scoring
            level = self._calculate_level(total_hours, num_weeks, avg_hours, 
                                          activity_complexity, skill_diversity)
            results.append(level)
        return results
    
    def predict_proba(self, features: List[List[float]]) -> List[List[float]]:
        """Return probability distribution (simulated)"""
        results = []
        for feature_vector in features:
            level = self.predict([feature_vector])[0]
            # Create probability distribution centered on predicted level
            probs = [0.05] * 7
            probs[level - 1] = 0.65  # 85% confidence in predicted level
            # Distribute remaining probability to adjacent levels
            if level > 1:
                probs[level - 2] = 0.15
            if level < 7:
                probs[level] = 0.15
            results.append(probs)
        return results
    
    def _calculate_level(self, total_hours: float, num_weeks: int, avg_hours: float,
                         activity_complexity: int, skill_diversity: int) -> int:
        """Calculate PQF level based on OJT metrics"""
        # Base score from hours (max 1000 hours typical for OJT)
        hour_score = min(total_hours / 200, 5)  # 200 hours per level roughly
        
        # Complexity bonus
        complexity_bonus = min(activity_complexity / 50, 2)
        
        # Skills bonus  
        skills_bonus = min(skill_diversity / 30, 2)
        
        # Duration bonus (more weeks = more experience)
        duration_bonus = min(num_weeks / 10, 2)
        
        # Calculate final score (1-7 scale)
        total_score = hour_score + complexity_bonus + skills_bonus + duration_bonus
        level = max(1, min(7, int(total_score)))
        
        # Adjust based on average hours per week (intensity)
        if avg_hours > 40:  # Full-time equivalent
            level = min(7, level + 1)
        elif avg_hours < 20 and level > 1:  # Part-time
            level = max(1, level - 1)
            
        return level
    
    @property
    def classes_(self):
        return np.array([1, 2, 3, 4, 5, 6, 7])


class PQFClassifierService:
    """Service for loading and managing PQF classification models"""
    
    def __init__(self, models_folder: str):
        self.models_folder = models_folder
        self.loaded_models: Dict[str, Any] = {}
        self.model_metadata: Dict[str, Dict] = {}
        self._fallback_classifier = RuleBasedPQFClassifier()
    
    def load_model(self, model_path: str, model_name: str) -> bool:
        """Load a model from file path"""
        try:
            full_path = os.path.join(self.models_folder, model_path)
            
            if not os.path.exists(full_path):
                logger.error(f"Model file not found: {full_path}")
                # Use fallback classifier
                self.loaded_models[model_name] = self._fallback_classifier
                logger.info(f"Using rule-based fallback for: {model_name}")
                return True
            
            # Try different loading methods based on file extension
            try:
                if full_path.endswith('.pkl') or full_path.endswith('.pickle'):
                    with open(full_path, 'rb') as f:
                        model = pickle.load(f)
                elif full_path.endswith('.joblib'):
                    model = joblib.load(full_path)
                elif full_path.endswith('.h5') or full_path.endswith('.keras'):
                    import tensorflow as tf
                    model = tf.keras.models.load_model(full_path)
                elif full_path.endswith('.pth') or full_path.endswith('.pt'):
                    import torch
                    model = torch.load(full_path, map_location='cpu')
                else:
                    # Try pickle as default
                    with open(full_path, 'rb') as f:
                        model = pickle.load(f)
                
                self.loaded_models[model_name] = model
            except Exception as load_error:
                logger.warning(f"Could not load model file ({load_error}), using rule-based fallback")
                self.loaded_models[model_name] = self._fallback_classifier
            
            self.model_metadata[model_name] = {
                'path': full_path,
                'loaded_at': str(np.datetime64('now'))
            }
            
            logger.info(f"Successfully loaded model: {model_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            # Still provide fallback
            self.loaded_models[model_name] = self._fallback_classifier
            return True  # Return True because fallback is available
    
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
            # Prepare feature vector
            feature_vector = self._prepare_feature_vector(features)
            
            # Make prediction
            if hasattr(model, 'predict'):
                prediction = model.predict([feature_vector])[0]
                
                # Get prediction probabilities if available
                confidence = None
                prob_dict = None
                if hasattr(model, 'predict_proba'):
                    probabilities = model.predict_proba([feature_vector])[0]
                    confidence = float(max(probabilities))
                    classes = model.classes_ if hasattr(model, 'classes_') else range(1, len(probabilities) + 1)
                    prob_dict = {str(int(c)): float(p) for c, p in zip(classes, probabilities)}
                
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
        numeric_features = [
            features.get('total_hours', 0),
            features.get('num_weeks', 0),
            features.get('avg_hours_per_week', 0),
            features.get('activity_complexity', 0),
            features.get('skill_diversity', 0)
        ]
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
