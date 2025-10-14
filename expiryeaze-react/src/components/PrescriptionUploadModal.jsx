import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { config } from '../lib/config';

const PrescriptionUploadModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: '',
    reasonForPurchase: '',
    medicalCondition: '',
    doctorName: '',
    doctorPhone: '',
    hospitalClinicName: '',
    contactNumber: '',
    emergencyContact: '',
  });

  const [prescriptionFiles, setPrescriptionFiles] = useState([]);
  const [medicalReportFiles, setMedicalReportFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'prescription') {
      setPrescriptionFiles([...prescriptionFiles, ...files]);
    } else {
      setMedicalReportFiles([...medicalReportFiles, ...files]);
    }
  };

  const removeFile = (index, type) => {
    if (type === 'prescription') {
      setPrescriptionFiles(prescriptionFiles.filter((_, i) => i !== index));
    } else {
      setMedicalReportFiles(medicalReportFiles.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      formDataToSend.append('product', product._id);
      
      // Add prescription files
      prescriptionFiles.forEach((file) => {
        formDataToSend.append('prescriptionDocuments', file);
      });
      
      // Add medical report files
      medicalReportFiles.forEach((file) => {
        formDataToSend.append('medicalReports', file);
      });

      const response = await axios.post(
        `${config.API_URL}/prescriptions`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        }
      );

      if (response.data.success) {
        onSuccess(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <FileText size={24} />
              Prescription Upload Required
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <div className="alert alert-info mb-4">
              <AlertCircle size={20} className="me-2" />
              <strong>Note:</strong> This medicine requires a valid prescription. Please provide your medical information and upload relevant documents. A doctor may contact you if additional clarification is needed.
            </div>

            {error && (
              <div className="alert alert-danger mb-4">
                {error}
              </div>
            )}

            <div className="card mb-3 border-primary">
              <div className="card-body">
                <h6 className="fw-bold text-primary">Medicine Details</h6>
                <p className="mb-1"><strong>Product:</strong> {product?.name}</p>
                <p className="mb-0"><strong>Category:</strong> {product?.category}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Patient Information */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Patient Information</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Patient Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Age *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="patientAge"
                      value={formData.patientAge}
                      onChange={handleInputChange}
                      min="0"
                      max="150"
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Gender *</label>
                    <select
                      className="form-select"
                      name="patientGender"
                      value={formData.patientGender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Medical Information</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Medical Condition *</label>
                    <textarea
                      className="form-control"
                      name="medicalCondition"
                      value={formData.medicalCondition}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Please describe the medical condition being treated"
                      required
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Reason for Purchase *</label>
                    <textarea
                      className="form-control"
                      name="reasonForPurchase"
                      value={formData.reasonForPurchase}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Why do you need this medicine?"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Doctor Information (Optional)</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Doctor Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="doctorName"
                      value={formData.doctorName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Doctor Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="doctorPhone"
                      value={formData.doctorPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Hospital/Clinic Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="hospitalClinicName"
                      value={formData.hospitalClinicName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Contact Information</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Emergency Contact</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Upload Documents *</h6>
                
                {/* Prescription Upload */}
                <div className="mb-3">
                  <label className="form-label">Prescription Documents *</label>
                  <div className="border rounded p-3 bg-light">
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, 'prescription')}
                      accept="image/*,.pdf"
                      multiple
                    />
                    <small className="text-muted d-block mt-2">
                      Upload prescription images or PDF (Max 5MB per file)
                    </small>
                    
                    {prescriptionFiles.length > 0 && (
                      <div className="mt-3">
                        {prescriptionFiles.map((file, index) => (
                          <div key={index} className="d-flex justify-content-between align-items-center bg-white p-2 mb-2 rounded">
                            <span className="small">{file.name}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFile(index, 'prescription')}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Reports Upload */}
                <div className="mb-3">
                  <label className="form-label">Medical Reports (Optional)</label>
                  <div className="border rounded p-3 bg-light">
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => handleFileChange(e, 'report')}
                      accept="image/*,.pdf"
                      multiple
                    />
                    <small className="text-muted d-block mt-2">
                      Upload any relevant medical reports or test results
                    </small>
                    
                    {medicalReportFiles.length > 0 && (
                      <div className="mt-3">
                        {medicalReportFiles.map((file, index) => (
                          <div key={index} className="d-flex justify-content-between align-items-center bg-white p-2 mb-2 rounded">
                            <span className="small">{file.name}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFile(index, 'report')}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-3">
                  <div className="progress">
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      {uploadProgress}%
                    </div>
                  </div>
                </div>
              )}

              <div className="alert alert-warning">
                <AlertCircle size={20} className="me-2" />
                <strong>Important:</strong> A qualified medical professional may review your prescription and contact you if any information appears misleading or requires clarification. Please ensure all information is accurate.
              </div>

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isSubmitting || prescriptionFiles.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="me-2" />
                      Submit Prescription
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUploadModal;

