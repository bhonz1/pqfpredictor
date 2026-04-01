from flask import Blueprint, request, jsonify, current_app
from models.database_models import db, PQFPrediction, Student, Accomplishment
from services.classifier_service import get_classifier_service

prediction_bp = Blueprint('predictions', __name__)

@prediction_bp.route('/', methods=['GET'])
def get_all_predictions():
    """Get all PQF predictions (optionally filter by student)"""
    student_id = request.args.get('student_id', type=int)
    
    query = PQFPrediction.query
    if student_id:
        query = query.filter_by(student_id=student_id)
    
    predictions = query.order_by(PQFPrediction.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'data': [pred.to_dict() for pred in predictions]
    })

@prediction_bp.route('/<int:prediction_id>', methods=['GET'])
def get_prediction(prediction_id):
    """Get a specific prediction"""
    prediction = PQFPrediction.query.get_or_404(prediction_id)
    
    return jsonify({
        'success': True,
        'data': prediction.to_dict()
    })

@prediction_bp.route('/predict', methods=['POST'])
def predict_pqf_level():
    """Make a PQF level prediction for a student"""
    data = request.get_json()
    
    if 'student_id' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing required field: student_id'
        }), 400
    
    student_id = data['student_id']
    model_name = data.get('model_name', 'default')
    
    # Get student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({
            'success': False,
            'error': 'Student not found'
        }), 404
    
    # Get student's accomplishments
    accomplishments = Accomplishment.query.filter_by(student_id=student_id).all()
    if not accomplishments:
        return jsonify({
            'success': False,
            'error': 'No accomplishments found for this student. Please add accomplishments first.'
        }), 400
    
    # Get classifier service
    try:
        classifier = get_classifier_service()
    except RuntimeError as e:
        return jsonify({
            'success': False,
            'error': 'Classifier service not initialized'
        }), 500
    
    # Check if model is loaded
    if model_name not in classifier.list_loaded_models():
        return jsonify({
            'success': False,
            'error': f'Model "{model_name}" not loaded. Please load the model first.',
            'available_models': classifier.list_loaded_models()
        }), 400
    
    # Extract features
    acc_data = [acc.to_dict() for acc in accomplishments]
    features = classifier.extract_features(acc_data)
    
    # Make prediction
    predicted_level, confidence, details = classifier.predict_pqf_level(model_name, features)
    
    if predicted_level is None:
        return jsonify({
            'success': False,
            'error': 'Prediction failed. Check server logs for details.'
        }), 500
    
    # Get PQF level description
    level_description = classifier.get_pqf_level_description(predicted_level)
    
    # Save prediction to database
    prediction = PQFPrediction(
        student_id=student_id,
        model_used=model_name,
        predicted_level=predicted_level,
        confidence_score=confidence,
        features_used=features,
        prediction_details=details
    )
    
    db.session.add(prediction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': {
            'prediction_id': prediction.id,
            'student_id': student_id,
            'student_name': student.name,
            'predicted_level': predicted_level,
            'level_description': level_description,
            'confidence_score': confidence,
            'model_used': model_name,
            'features_used': features,
            'prediction_details': details
        },
        'message': 'PQF Level prediction completed successfully'
    })

@prediction_bp.route('/quick-predict', methods=['POST'])
def quick_predict():
    """Quick prediction using provided accomplishments data without saving to database"""
    data = request.get_json()
    
    if 'accomplishments' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing required field: accomplishments'
        }), 400
    
    accomplishments = data['accomplishments']
    model_name = data.get('model_name', 'default')
    
    if not isinstance(accomplishments, list) or len(accomplishments) == 0:
        return jsonify({
            'success': False,
            'error': 'Accomplishments must be a non-empty array'
        }), 400
    
    # Validate required fields in accomplishments
    required_fields = ['week_number', 'activities_performed', 'skills', 'number_of_hours']
    for i, acc in enumerate(accomplishments):
        missing = [f for f in required_fields if f not in acc]
        if missing:
            return jsonify({
                'success': False,
                'error': f'Accomplishment {i+1} missing fields: {", ".join(missing)}'
            }), 400
    
    # Get classifier service
    try:
        classifier = get_classifier_service()
    except RuntimeError as e:
        return jsonify({
            'success': False,
            'error': 'Classifier service not initialized'
        }), 500
    
    # Check if model is loaded
    if model_name not in classifier.list_loaded_models():
        return jsonify({
            'success': False,
            'error': f'Model "{model_name}" not loaded. Please load the model first.',
            'available_models': classifier.list_loaded_models()
        }), 400
    
    # Extract features
    features = classifier.extract_features(accomplishments)
    
    # Make prediction
    predicted_level, confidence, details = classifier.predict_pqf_level(model_name, features)
    
    if predicted_level is None:
        return jsonify({
            'success': False,
            'error': 'Prediction failed. Check server logs for details.'
        }), 500
    
    # Get PQF level description
    level_description = classifier.get_pqf_level_description(predicted_level)
    
    return jsonify({
        'success': True,
        'data': {
            'predicted_level': predicted_level,
            'level_description': level_description,
            'confidence_score': confidence,
            'model_used': model_name,
            'features_used': features,
            'prediction_details': details
        },
        'message': 'Quick PQF Level prediction completed successfully'
    })

@prediction_bp.route('/<int:prediction_id>/', methods=['DELETE'])
def delete_prediction(prediction_id):
    """Delete a prediction record"""
    prediction = PQFPrediction.query.get_or_404(prediction_id)
    
    db.session.delete(prediction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Prediction deleted successfully'
    })

@prediction_bp.route('/reset/', methods=['DELETE'])
def reset_predictions():
    """Delete all prediction records"""
    try:
        count = PQFPrediction.query.count()
        PQFPrediction.query.delete()
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'All {count} predictions cleared successfully',
            'deleted_count': count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
