import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../lib/config';

const MedicineVendorVerification = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    licenseNumber: '',
    pharmacyLicense: '',
    businessAddress: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    businessType: '',
    yearsInBusiness: '',
    certifications: '',
    storageFacility: '',
    temperatureControl: '',
    securityMeasures: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    complianceOfficer: '',
    emergencyContact: '',
    termsAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const checked = e.target.checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    const required = [
      'businessName','licenseNumber','pharmacyLicense','businessAddress',
      'contactPerson','phoneNumber','email','businessType','yearsInBusiness',
      'certifications','storageFacility','temperatureControl','securityMeasures',
      'insuranceProvider','insurancePolicyNumber','complianceOfficer','emergencyContact'
    ];
    for (const key of required) {
      if (!String(formData[key] || '').trim()) {
        setError('Please fill all required fields marked with *');
        setIsSubmitting(false);
        return;
      }
    }
    if (!formData.termsAccepted) {
      setError('You must accept the Terms and Privacy Policy');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/vendors/verify`, formData);
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/medicines-dashboard'), 2000);
      } else {
        setError(res.data?.error || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-success">
              <div className="card-body p-5 text-center">
                <div className="text-success mb-4">
                  <i className="fas fa-check-circle" style={{ fontSize: '4rem' }}></i>
                </div>
                <h2 className="fw-bold text-success mb-3">Verification Submitted Successfully!</h2>
                <p className="text-muted mb-4">
                  Thank you for submitting your verification documents. Our team will review your application 
                  within 2-3 business days. You will receive an email notification once your account is verified.
                </p>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  You will be redirected to the medicines dashboard shortly...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h1 className="h3 mb-0 fw-bold">
                <i className="fas fa-shield-alt me-2"></i>
                Medicine Vendor Verification
              </h1>
            </div>
            <div className="card-body p-4">
              {/* Testing banner removed */}
              
              <div className="alert alert-warning mb-4">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Important:</strong> Medicine vendors require additional verification for safety compliance. 
                Please provide all required information accurately.
              </div>

              {error && (
                <div className="alert alert-danger mb-4">
                  <i className="fas fa-times-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Business Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="fw-bold text-success mb-3">
                      <i className="fas fa-building me-2"></i>
                      Business Information
                    </h4>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Business Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Business Type *</label>
                    <select
                      className="form-select"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Business Type</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="drugstore">Drug Store</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="distributor">Distributor</option>
                      <option value="manufacturer">Manufacturer</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">License Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Pharmacy License *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="pharmacyLicense"
                      value={formData.pharmacyLicense}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Business Address *</label>
                    <textarea
                      className="form-control"
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      rows={3}
                      required
                    ></textarea>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="fw-bold text-success mb-3">
                      <i className="fas fa-address-book me-2"></i>
                      Contact Information
                    </h4>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Contact Person *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
                      title="Please enter a valid email address with proper domain (e.g., user@example.com). Domain must have a top-level domain like .com, .org, etc."
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Years in Business *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="yearsInBusiness"
                      value={formData.yearsInBusiness}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Certifications and Compliance */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="fw-bold text-success mb-3">
                      <i className="fas fa-certificate me-2"></i>
                      Certifications and Compliance
                    </h4>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Certifications *</label>
                    <textarea
                      className="form-control"
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="List all relevant certifications (e.g., FDA, GMP, ISO)"
                      required
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Storage Facility *</label>
                    <select
                      className="form-select"
                      name="storageFacility"
                      value={formData.storageFacility}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Storage Type</option>
                      <option value="temperature-controlled">Temperature Controlled</option>
                      <option value="refrigerated">Refrigerated</option>
                      <option value="dry-storage">Dry Storage</option>
                      <option value="secure-facility">Secure Facility</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Temperature Control *</label>
                    <select
                      className="form-select"
                      name="temperatureControl"
                      value={formData.temperatureControl}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Temperature Control</option>
                      <option value="2-8-celsius">2-8°C (Refrigerated)</option>
                      <option value="15-25-celsius">15-25°C (Room Temperature)</option>
                      <option value="below-20-celsius">Below -20°C (Frozen)</option>
                      <option value="controlled-humidity">Controlled Humidity</option>
                    </select>
                  </div>
                </div>

                {/* Security and Insurance */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="fw-bold text-success mb-3">
                      <i className="fas fa-shield-alt me-2"></i>
                      Security and Insurance
                    </h4>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Security Measures *</label>
                    <textarea
                      className="form-control"
                      name="securityMeasures"
                      value={formData.securityMeasures}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe security measures (e.g., CCTV, access control, alarm systems)"
                      required
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Insurance Provider *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Insurance Policy Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insurancePolicyNumber"
                      value={formData.insurancePolicyNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Compliance and Emergency Contacts */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h4 className="fw-bold text-success mb-3">
                      <i className="fas fa-user-shield me-2"></i>
                      Compliance and Emergency Contacts
                    </h4>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Compliance Officer *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="complianceOfficer"
                      value={formData.complianceOfficer}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Emergency Contact *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        required
                      />
                      <label className="form-check-label">
                        I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> and 
                        <a href="/privacy" target="_blank"> Privacy Policy</a> *
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="row">
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting Verification...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Submit Verification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineVendorVerification;
