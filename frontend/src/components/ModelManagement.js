import React, { useState, useEffect } from 'react';
import { Upload, Play, Square, Trash2, AlertCircle, CheckCircle, FileText, Cpu } from 'lucide-react';
import { modelAPI } from '../services/api';

function ModelManagement() {
  const [models, setModels] = useState([]);
  const [loadedModels, setLoadedModels] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    model_name: '',
    model_type: 'sklearn',
    description: '',
    auto_load: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await modelAPI.getAll();
      setModels(response.data.data?.uploaded_models || []);
      setLoadedModels(response.data.data?.loaded_models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadForm.model_name) {
        setUploadForm({ ...uploadForm, model_name: file.name.split('.')[0] });
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('model_name', uploadForm.model_name);
      formData.append('model_type', uploadForm.model_type);
      formData.append('description', uploadForm.description);
      formData.append('auto_load', uploadForm.auto_load);

      await modelAPI.upload(formData);
      setSelectedFile(null);
      setUploadForm({ model_name: '', model_type: 'sklearn', description: '', auto_load: true });
      fetchModels();
      alert('Model uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadModel = async (model) => {
    try {
      await modelAPI.load(model.id, model.model_name);
      fetchModels();
      alert(`Model "${model.model_name}" loaded successfully!`);
    } catch (error) {
      console.error('Load error:', error);
      alert(error.response?.data?.error || 'Failed to load model');
    }
  };

  const handleUnloadModel = async (modelName) => {
    try {
      await modelAPI.unload(modelName);
      fetchModels();
      alert(`Model "${modelName}" unloaded!`);
    } catch (error) {
      console.error('Unload error:', error);
      alert(error.response?.data?.error || 'Failed to unload model');
    }
  };

  const handleDeleteModel = async (model) => {
    if (!window.confirm(`Are you sure you want to delete "${model.model_name}"?`)) return;
    try {
      await modelAPI.delete(model.id);
      fetchModels();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete model');
    }
  };

  const isModelLoaded = (modelName) => loadedModels.includes(modelName);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Model Management</h1>
        <p className="text-gray-600 mt-2">Upload and manage PQF classification models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload New Model
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="label">Model File *</label>
              <input
                type="file"
                accept=".pkl,.pickle,.joblib,.h5,.keras,.pth,.pt,.model"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: .pkl, .pickle, .joblib, .h5, .keras, .pth, .pt, .model
              </p>
            </div>

            <div>
              <label className="label">Model Name *</label>
              <input
                type="text"
                required
                value={uploadForm.model_name}
                onChange={(e) => setUploadForm({ ...uploadForm, model_name: e.target.value })}
                className="input-field"
                placeholder="e.g., PQF Classifier v1"
              />
            </div>

            <div>
              <label className="label">Model Type</label>
              <select
                value={uploadForm.model_type}
                onChange={(e) => setUploadForm({ ...uploadForm, model_type: e.target.value })}
                className="input-field"
              >
                <option value="sklearn">Scikit-Learn</option>
                <option value="tensorflow">TensorFlow/Keras</option>
                <option value="pytorch">PyTorch</option>
                <option value="weka-j48">WEKA J48 Classifier</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                rows="2"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="input-field"
                placeholder="Brief description of the model..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_load"
                checked={uploadForm.auto_load}
                onChange={(e) => setUploadForm({ ...uploadForm, auto_load: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_load" className="ml-2 text-sm text-gray-700">
                Auto-load model after upload
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Upload Model</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loaded Models Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Cpu className="h-5 w-5 mr-2" />
            Loaded Models ({loadedModels.length})
          </h2>

          {loadedModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No models currently loaded</p>
              <p className="text-sm">Upload and load a model to start making predictions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loadedModels.map((modelName) => (
                <div key={modelName} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">{modelName}</span>
                  </div>
                  <button
                    onClick={() => handleUnloadModel(modelName)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Unload model"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Model Requirements</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Models must implement a predict() method</li>
              <li>• For scikit-learn: saved with pickle or joblib</li>
              <li>• For TensorFlow: saved as .h5 or SavedModel format</li>
              <li>• For PyTorch: saved state_dict or full model</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uploaded Models List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Uploaded Models
        </h2>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {models.map((model) => {
                  const isLoaded = isModelLoaded(model.model_name);
                  return (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{model.model_name}</p>
                          <p className="text-xs text-gray-500">{model.filename}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {model.model_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLoaded ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Loaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Loaded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(model.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isLoaded ? (
                          <button
                            onClick={() => handleUnloadModel(model.model_name)}
                            className="text-orange-600 hover:text-orange-900 mr-3"
                            title="Unload"
                          >
                            <Square className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLoadModel(model)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Load"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteModel(model)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && models.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No models uploaded yet</p>
              <p className="text-sm">Upload your first PQF classifier model above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelManagement;
