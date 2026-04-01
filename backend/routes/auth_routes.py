from flask import Blueprint, request, jsonify, current_app
from models.database_models import db, User, Student
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# JWT Secret key (should be in environment variable in production)
JWT_SECRET = 'your-secret-key-change-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def generate_token(user_id, role):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def token_required(f):
    """Decorator to protect routes with JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'success': False, 'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register/', methods=['POST'])
def register():
    """Register a new user (student) with student profile"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({
            'success': False,
            'error': 'Username and password are required'
        }), 400
    
    # Check required email
    if not data.get('email'):
        return jsonify({
            'success': False,
            'error': 'Email is required'
        }), 400
    
    # Validate email domain
    email = data['email'].lower().strip()
    if not email.endswith('@nvsu.edu.ph'):
        return jsonify({
            'success': False,
            'error': 'Email must be a valid @nvsu.edu.ph address'
        }), 400
    
    # Check required student fields
    if not data.get('student_id') or not data.get('name'):
        return jsonify({
            'success': False,
            'error': 'Student ID and Full Name are required'
        }), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({
            'success': False,
            'error': 'Username already exists'
        }), 409
    
    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({
            'success': False,
            'error': 'Email already exists'
        }), 409
    
    # Check if student_id already exists
    if Student.query.filter_by(student_id=data['student_id']).first():
        return jsonify({
            'success': False,
            'error': 'Student ID already exists'
        }), 409
    
    # Create student profile first
    new_student = Student(
        student_id=data['student_id'],
        name=data['name'],
        course=data.get('course', 'BS Information Technology'),
        institution=data.get('institution', '')
    )
    db.session.add(new_student)
    db.session.flush()  # Get the student ID without committing
    
    # Create new user linked to student profile
    new_user = User(
        username=data['username'],
        email=email,
        role='student',
        student_profile_id=new_student.id
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    # Generate token
    token = generate_token(new_user.id, new_user.role)
    
    return jsonify({
        'success': True,
        'message': 'Student registered successfully',
        'data': {
            'token': token,
            'user': new_user.to_dict(),
            'student': new_student.to_dict()
        }
    }), 201

@auth_bp.route('/login/', methods=['POST'])
def login():
    """Login user and return JWT token"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({
            'success': False,
            'error': 'Username and password are required'
        }), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    if not user:
        return jsonify({
            'success': False,
            'error': 'Invalid username or password'
        }), 401
    
    # Check password
    if not user.check_password(data['password']):
        return jsonify({
            'success': False,
            'error': 'Invalid username or password'
        }), 401
    
    # Check if user is active
    if not user.is_active:
        return jsonify({
            'success': False,
            'error': 'Account is disabled'
        }), 403
    
    # Generate token
    token = generate_token(user.id, user.role)
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'token': token,
            'user': user.to_dict()
        }
    })

@auth_bp.route('/me/', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current logged-in user info"""
    return jsonify({
        'success': True,
        'data': {
            'user': current_user.to_dict()
        }
    })

@auth_bp.route('/admin/users/', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    """Get all users (admin only)"""
    users = User.query.all()
    return jsonify({
        'success': True,
        'data': [user.to_dict() for user in users]
    })

@auth_bp.route('/admin/users/', methods=['POST'])
@token_required
@admin_required
def create_admin_user(current_user):
    """Create a new admin user (admin only)"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({
            'success': False,
            'error': 'Username and password are required'
        }), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({
            'success': False,
            'error': 'Username already exists'
        }), 409
    
    # Create new admin user
    new_user = User(
        username=data['username'],
        email=data.get('email'),
        role='admin'
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Admin user created successfully',
        'data': new_user.to_dict()
    }), 201

@auth_bp.route('/admin/users/<int:user_id>/', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update user details (admin only)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    # Update username if provided and different
    if data.get('username') and data['username'] != user.username:
        # Check if new username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'success': False,
                'error': 'Username already exists'
            }), 409
        user.username = data['username']
    
    # Update email if provided and different
    if data.get('email') and data['email'] != user.email:
        # Check if new email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'error': 'Email already exists'
            }), 409
        user.email = data['email']
    
    # Update password if provided
    if data.get('password'):
        user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'User updated successfully',
        'data': user.to_dict()
    })

@auth_bp.route('/admin/users/<int:user_id>/toggle/', methods=['POST'])
@token_required
@admin_required
def toggle_user_status(current_user, user_id):
    """Toggle user active status (admin only)"""
    user = User.query.get_or_404(user_id)
    
    # Prevent admin from disabling themselves
    if user.id == current_user.id:
        return jsonify({
            'success': False,
            'error': 'Cannot disable your own account'
        }), 400
    
    user.is_active = not user.is_active
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
        'data': user.to_dict()
    })

@auth_bp.route('/admin/users/<int:user_id>/', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Delete a user (admin only)"""
    user = User.query.get_or_404(user_id)
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        return jsonify({
            'success': False,
            'error': 'Cannot delete your own account'
        }), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'User deleted successfully'
    })
