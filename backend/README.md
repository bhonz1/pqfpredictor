# PQF Predictive Model Backend

This is the backend API for the PQF Level Classification system.

## Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## API Endpoints

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create a new student
- `GET /api/students/<id>` - Get student details
- `PUT /api/students/<id>` - Update student
- `DELETE /api/students/<id>` - Delete student

### Accomplishments
- `GET /api/accomplishments` - List accomplishments
- `POST /api/accomplishments` - Add accomplishment
- `POST /api/accomplishments/batch` - Add multiple accomplishments
- `PUT /api/accomplishments/<id>` - Update accomplishment
- `DELETE /api/accomplishments/<id>` - Delete accomplishment

### Predictions
- `POST /api/predictions/predict` - Predict PQF level for a student
- `POST /api/predictions/quick-predict` - Quick prediction without saving
- `GET /api/predictions` - List all predictions

### Models
- `GET /api/models` - List uploaded models
- `POST /api/models/upload` - Upload a model file
- `POST /api/models/<id>/load` - Load a model
- `POST /api/models/<name>/unload` - Unload a model
- `DELETE /api/models/<id>` - Delete a model

## Model Upload

Upload your trained PQF classifier models (.pkl, .joblib, .h5, .pth) to the `/api/models/upload` endpoint.
The system supports scikit-learn, TensorFlow, and PyTorch models.
