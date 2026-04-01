from flask import Blueprint, request, jsonify, current_app
from models.database_models import db, UploadedModel
from services.classifier_service import get_classifier_service
import os
import uuid

model_bp = Blueprint('models', __name__)

ALLOWED_EXTENSIONS = {'pkl', 'pickle', 'joblib', 'h5', 'keras', 'pth', 'pt', 'model'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@model_bp.route('/', methods=['GET'])
def list_models():
    """List all uploaded models"""
    models = UploadedModel.query.order_by(UploadedModel.uploaded_at.desc()).all()
    
    # Also get currently loaded models from classifier service
    try:
        classifier = get_classifier_service()
        loaded_models = classifier.list_loaded_models()
    except:
        loaded_models = []
    
    return jsonify({
        'success': True,
        'data': {
            'uploaded_models': [model.to_dict() for model in models],
            'loaded_models': loaded_models
        }
    })

@model_bp.route('/upload', methods=['POST'])
def upload_model():
    """Upload a new PQF classification model"""
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided'
        }), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    # Get form data
    model_name = request.form.get('model_name', file.filename)
    model_type = request.form.get('model_type', 'sklearn')
    description = request.form.get('description', '')
    auto_load = request.form.get('auto_load', 'true').lower() == 'true'
    
    # Generate unique filename
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Save file
    file.save(file_path)
    
    # Create database record
    uploaded_model = UploadedModel(
        model_name=model_name,
        filename=file.filename,
        file_path=unique_filename,
        model_type=model_type,
        description=description,
        is_active=True
    )
    
    db.session.add(uploaded_model)
    db.session.commit()
    
    # Auto-load model if requested
    load_status = None
    if auto_load:
        try:
            classifier = get_classifier_service()
            success = classifier.load_model(unique_filename, model_name)
            load_status = 'loaded' if success else 'failed'
        except Exception as e:
            load_status = f'error: {str(e)}'
    
    return jsonify({
        'success': True,
        'data': {
            'model': uploaded_model.to_dict(),
            'load_status': load_status
        },
        'message': 'Model uploaded successfully'
    }), 201

@model_bp.route('/<int:model_id>/load', methods=['POST'])
def load_model(model_id):
    """Load an uploaded model into memory"""
    model = UploadedModel.query.get_or_404(model_id)
    
    model_name = request.json.get('model_name', model.model_name) if request.json else model.model_name
    
    try:
        classifier = get_classifier_service()
        success = classifier.load_model(model.file_path, model_name)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Model "{model_name}" loaded successfully',
                'loaded_models': classifier.list_loaded_models()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to load model'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@model_bp.route('/<string:model_name>/unload', methods=['POST'])
def unload_model(model_name):
    """Unload a model from memory"""
    try:
        classifier = get_classifier_service()
        
        if model_name not in classifier.list_loaded_models():
            return jsonify({
                'success': False,
                'error': f'Model "{model_name}" is not loaded'
            }), 400
        
        success = classifier.unload_model(model_name)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Model "{model_name}" unloaded successfully',
                'loaded_models': classifier.list_loaded_models()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to unload model'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@model_bp.route('/<int:model_id>/', methods=['DELETE'])
def delete_model(model_id):
    """Delete an uploaded model"""
    model = UploadedModel.query.get_or_404(model_id)
    
    # Try to unload first if loaded
    try:
        classifier = get_classifier_service()
        if model.model_name in classifier.list_loaded_models():
            classifier.unload_model(model.model_name)
    except:
        pass
    
    # Delete file
    full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], model.file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
    
    # Delete database record
    db.session.delete(model)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Model deleted successfully'
    })

@model_bp.route('/loaded', methods=['GET'])
def get_loaded_models():
    """Get list of currently loaded models"""
    try:
        classifier = get_classifier_service()
        loaded_models = classifier.list_loaded_models()
        
        return jsonify({
            'success': True,
            'data': {
                'loaded_models': loaded_models
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
