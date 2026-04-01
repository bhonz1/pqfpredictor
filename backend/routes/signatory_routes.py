"""
Signatory management routes for PQF Certificate generation
"""
from flask import Blueprint, request, jsonify
from models.database_models import Signatory, db
from routes.auth_routes import token_required, admin_required

signatory_bp = Blueprint('signatory', __name__, url_prefix='/api/signatories')


@signatory_bp.route('/', methods=['GET'])
@token_required
def get_signatories(current_user):
    """Get all active signatories ordered by display order"""
    signatories = Signatory.query.filter_by(is_active=True).order_by(Signatory.display_order).all()
    return jsonify({
        'success': True,
        'data': [s.to_dict() for s in signatories]
    })


@signatory_bp.route('/all/', methods=['GET'])
@token_required
@admin_required
def get_all_signatories(current_user):
    """Get all signatories including inactive (admin only)"""
    signatories = Signatory.query.order_by(Signatory.display_order).all()
    return jsonify({
        'success': True,
        'data': [s.to_dict() for s in signatories]
    })


@signatory_bp.route('/', methods=['POST'])
@token_required
@admin_required
def create_signatory(current_user):
    """Create a new signatory (admin only)"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('position') or not data.get('office'):
        return jsonify({
            'success': False,
            'error': 'Name, position, and office are required'
        }), 400
    
    # Get the next display order if not provided
    display_order = data.get('display_order')
    if display_order is None:
        last_signatory = Signatory.query.order_by(Signatory.display_order.desc()).first()
        display_order = (last_signatory.display_order + 1) if last_signatory else 1
    
    new_signatory = Signatory(
        name=data['name'],
        position=data['position'],
        office=data['office'],
        signature_path=data.get('signature_path'),
        display_order=display_order,
        is_active=data.get('is_active', True)
    )
    
    db.session.add(new_signatory)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Signatory created successfully',
        'data': new_signatory.to_dict()
    }), 201


@signatory_bp.route('/<int:signatory_id>/', methods=['PUT'])
@token_required
@admin_required
def update_signatory(current_user, signatory_id):
    """Update a signatory (admin only)"""
    signatory = Signatory.query.get_or_404(signatory_id)
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'error': 'No data provided'
        }), 400
    
    # Update fields if provided
    if 'name' in data:
        signatory.name = data['name']
    if 'position' in data:
        signatory.position = data['position']
    if 'office' in data:
        signatory.office = data['office']
    if 'signature_path' in data:
        signatory.signature_path = data['signature_path']
    if 'display_order' in data:
        signatory.display_order = data['display_order']
    if 'is_active' in data:
        signatory.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Signatory updated successfully',
        'data': signatory.to_dict()
    })


@signatory_bp.route('/<int:signatory_id>/', methods=['DELETE'])
@token_required
@admin_required
def delete_signatory(current_user, signatory_id):
    """Delete a signatory (admin only)"""
    signatory = Signatory.query.get_or_404(signatory_id)
    
    db.session.delete(signatory)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Signatory deleted successfully'
    })


@signatory_bp.route('/<int:signatory_id>/toggle/', methods=['POST'])
@token_required
@admin_required
def toggle_signatory_status(current_user, signatory_id):
    """Toggle signatory active status (admin only)"""
    signatory = Signatory.query.get_or_404(signatory_id)
    
    signatory.is_active = not signatory.is_active
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Signatory {"activated" if signatory.is_active else "deactivated"} successfully',
        'data': signatory.to_dict()
    })
