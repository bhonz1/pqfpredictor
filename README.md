# PQF Predictive Model Web Application

A complete web application system for Philippine Qualifications Framework (PQF) Level Classification of On-the-Job Training (OJT) Tasks.

## Project Structure

```
PredictiveModel/
├── backend/                 # Flask REST API
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── models/             # Database models
│   │   └── database_models.py
│   ├── routes/             # API endpoints
│   │   ├── student_routes.py
│   │   ├── accomplishment_routes.py
│   │   ├── prediction_routes.py
│   │   └── model_routes.py
│   ├── services/           # Business logic
│   │   └── classifier_service.py
│   └── uploaded_models/    # Model storage folder
├── frontend/               # React Web Application
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── Students.js
│   │   │   ├── Accomplishments.js
│   │   │   ├── Predictions.js
│   │   │   └── ModelManagement.js
│   │   ├── services/
│   │   │   └── api.js    # API client
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Features

### Backend (Flask API)

- **Student Management**: CRUD operations for student records
- **Accomplishment Tracking**: Record weekly OJT accomplishments
  - Week Number
  - Activities Performed
  - Skills Developed
  - Number of Hours
- **PQF Prediction**: AI-powered PQF level classification
- **Model Management**: Upload and manage PQF classifier models
  - Supports scikit-learn (.pkl, .joblib)
  - Supports TensorFlow/Keras (.h5, .keras)
  - Supports PyTorch (.pth, .pt)

### Frontend (React)

- **Dashboard**: Overview of system statistics and recent predictions
- **Students**: Manage student records
- **Accomplishments**: Input and manage OJT accomplishment data
- **PQF Predictions**: Run PQF level predictions with visual results
- **Model Management**: Upload, load, and manage classification models

## Quick Start

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database and run
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `GET /api/students/<id>` - Get student
- `PUT /api/students/<id>` - Update student
- `DELETE /api/students/<id>` - Delete student

### Accomplishments
- `GET /api/accomplishments` - List accomplishments
- `POST /api/accomplishments` - Add accomplishment
- `POST /api/accomplishments/batch` - Add multiple
- `PUT /api/accomplishments/<id>` - Update
- `DELETE /api/accomplishments/<id>` - Delete

### Predictions
- `POST /api/predictions/predict` - Predict PQF level for student
- `POST /api/predictions/quick-predict` - Quick prediction (no save)
- `GET /api/predictions` - List predictions

### Models
- `GET /api/models` - List uploaded models
- `POST /api/models/upload` - Upload model file
- `POST /api/models/<id>/load` - Load model
- `POST /api/models/<name>/unload` - Unload model
- `DELETE /api/models/<id>` - Delete model

## Model Requirements

Your PQF Classifier model should:
1. Accept feature vectors for prediction
2. Return PQF levels (1-7) as output
3. Optionally provide predict_proba for confidence scores

### Feature Extraction

The system extracts these features from accomplishments:
- `total_hours`: Total training hours
- `num_weeks`: Number of weeks recorded
- `avg_hours_per_week`: Average hours per week
- `activity_complexity`: Diversity of activities
- `skill_diversity`: Diversity of skills

## PQF Levels Reference

| Level | Description |
|-------|-------------|
| 1 | Routine, repetitive, predictable activities |
| 2 | Range of familiar and non-familiar contexts |
| 3 | Diverse, unfamiliar, changing activities |
| 4 | Complex, non-routine, unfamiliar contexts |
| 5 | Specialized, complex, professional work |
| 6 | Advanced professional, highly specialized |
| 7 | Highly advanced, specialized, complex |

## License

MIT License
# pqfpredictor
