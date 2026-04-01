from flask import Blueprint, request, jsonify, current_app
from models.database_models import db, Accomplishment, Student

accomplishment_bp = Blueprint('accomplishments', __name__)

@accomplishment_bp.route('/', methods=['GET'])
def get_all_accomplishments():
    """Get all accomplishments (optionally filter by student)"""
    student_id = request.args.get('student_id', type=int)
    
    query = Accomplishment.query
    if student_id:
        query = query.filter_by(student_id=student_id)
    
    accomplishments = query.order_by(Accomplishment.week_number).all()
    
    return jsonify({
        'success': True,
        'data': [acc.to_dict() for acc in accomplishments]
    })

@accomplishment_bp.route('/', methods=['POST'])
def create_accomplishment():
    """Create a new accomplishment entry"""
    data = request.get_json()
    
    required_fields = ['student_id', 'week_number', 'activities_performed', 'skills', 'number_of_hours']
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({
            'success': False,
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }), 400
    
    # Verify student exists
    student = Student.query.get(data['student_id'])
    if not student:
        return jsonify({
            'success': False,
            'error': 'Student not found'
        }), 404
    
    accomplishment = Accomplishment(
        student_id=data['student_id'],
        week_number=data['week_number'],
        activities_performed=data['activities_performed'],
        skills=data['skills'],
        number_of_hours=float(data['number_of_hours'])
    )
    
    db.session.add(accomplishment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': accomplishment.to_dict(),
        'message': 'Accomplishment recorded successfully'
    }), 201

@accomplishment_bp.route('/batch', methods=['POST'])
def create_accomplishments_batch():
    """Create multiple accomplishment entries at once"""
    data = request.get_json()
    
    if not isinstance(data, list):
        return jsonify({
            'success': False,
            'error': 'Expected array of accomplishments'
        }), 400
    
    required_fields = ['student_id', 'week_number', 'activities_performed', 'skills', 'number_of_hours']
    accomplishments = []
    
    for item in data:
        missing_fields = [field for field in required_fields if field not in item]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing fields in item: {", ".join(missing_fields)}'
            }), 400
        
        # Verify student exists
        student = Student.query.get(item['student_id'])
        if not student:
            return jsonify({
                'success': False,
                'error': f'Student not found: {item["student_id"]}'
            }), 404
        
        acc = Accomplishment(
            student_id=item['student_id'],
            week_number=item['week_number'],
            activities_performed=item['activities_performed'],
            skills=item['skills'],
            number_of_hours=float(item['number_of_hours'])
        )
        accomplishments.append(acc)
        db.session.add(acc)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': [acc.to_dict() for acc in accomplishments],
        'message': f'{len(accomplishments)} accomplishments recorded successfully'
    }), 201

@accomplishment_bp.route('/<int:accomplishment_id>', methods=['GET'])
def get_accomplishment(accomplishment_id):
    """Get a specific accomplishment"""
    accomplishment = Accomplishment.query.get_or_404(accomplishment_id)
    
    return jsonify({
        'success': True,
        'data': accomplishment.to_dict()
    })

@accomplishment_bp.route('/<int:accomplishment_id>', methods=['PUT'])
def update_accomplishment(accomplishment_id):
    """Update an accomplishment"""
    accomplishment = Accomplishment.query.get_or_404(accomplishment_id)
    data = request.get_json()
    
    if 'week_number' in data:
        accomplishment.week_number = data['week_number']
    if 'activities_performed' in data:
        accomplishment.activities_performed = data['activities_performed']
    if 'skills' in data:
        accomplishment.skills = data['skills']
    if 'number_of_hours' in data:
        accomplishment.number_of_hours = float(data['number_of_hours'])
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': accomplishment.to_dict(),
        'message': 'Accomplishment updated successfully'
    })

@accomplishment_bp.route('/<int:accomplishment_id>', methods=['DELETE'])
def delete_accomplishment(accomplishment_id):
    """Delete an accomplishment"""
    accomplishment = Accomplishment.query.get_or_404(accomplishment_id)
    
    db.session.delete(accomplishment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Accomplishment deleted successfully'
    })
