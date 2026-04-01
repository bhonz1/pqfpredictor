from flask import Blueprint, request, jsonify
from models.database_models import db, Student

student_bp = Blueprint('students', __name__)

@student_bp.route('/', methods=['GET'])
def get_students():
    """Get all students"""
    students = Student.query.all()
    return jsonify({
        'success': True,
        'data': [student.to_dict() for student in students]
    })

@student_bp.route('/<int:student_id>/', methods=['GET'])
def get_student(student_id):
    """Get a specific student by ID"""
    student = Student.query.get_or_404(student_id)
    return jsonify({
        'success': True,
        'data': student.to_dict()
    })

@student_bp.route('/', methods=['POST'])
def create_student():
    """Create a new student"""
    data = request.get_json()
    
    if not data or 'student_id' not in data or 'name' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing required fields: student_id, name'
        }), 400
    
    # Check if student_id already exists
    existing = Student.query.filter_by(student_id=data['student_id']).first()
    if existing:
        return jsonify({
            'success': False,
            'error': 'Student ID already exists'
        }), 409
    
    student = Student(
        student_id=data['student_id'],
        name=data['name'],
        course=data.get('course'),
        institution=data.get('institution')
    )
    
    db.session.add(student)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': student.to_dict(),
        'message': 'Student created successfully'
    }), 201

@student_bp.route('/<int:student_id>/', methods=['PUT'])
def update_student(student_id):
    """Update a student"""
    student = Student.query.get_or_404(student_id)
    data = request.get_json()
    
    # Check if student_id is being changed and if it already exists
    if 'student_id' in data and data['student_id'] != student.student_id:
        existing = Student.query.filter_by(student_id=data['student_id']).first()
        if existing:
            return jsonify({
                'success': False,
                'error': 'Student ID already exists'
            }), 409
        student.student_id = data['student_id']
    
    if 'name' in data:
        student.name = data['name']
    if 'course' in data:
        student.course = data['course']
    if 'institution' in data:
        student.institution = data['institution']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': student.to_dict(),
        'message': 'Student updated successfully'
    })

@student_bp.route('/<int:student_id>/', methods=['DELETE'])
def delete_student(student_id):
    """Delete a student"""
    student = Student.query.get_or_404(student_id)
    
    db.session.delete(student)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Student deleted successfully'
    })

@student_bp.route('/<int:student_id>/accomplishments/', methods=['GET'])
def get_student_accomplishments(student_id):
    """Get all accomplishments for a student"""
    student = Student.query.get_or_404(student_id)
    
    return jsonify({
        'success': True,
        'data': [acc.to_dict() for acc in student.accomplishments]
    })
