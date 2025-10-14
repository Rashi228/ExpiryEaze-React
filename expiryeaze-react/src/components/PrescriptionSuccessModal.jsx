import React from 'react';
import { CheckCircle, Phone, Mail, FileText } from 'lucide-react';

const PrescriptionSuccessModal = ({ isOpen, onClose, onContinueShopping }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body p-5 text-center">
            <div className="text-success mb-4">
              <CheckCircle size={80} />
            </div>
            
            <h3 className="fw-bold text-success mb-3">Prescription Submitted Successfully!</h3>
            
            <p className="text-muted mb-4">
              Your prescription has been received and is pending review by our medical team.
            </p>

            <div className="alert alert-info text-start mb-4">
              <div className="d-flex align-items-start gap-2 mb-3">
                <FileText size={20} className="mt-1 flex-shrink-0" />
                <div>
                  <strong>What happens next?</strong>
                  <ul className="mb-0 mt-2 ps-3">
                    <li>Our medical professionals will review your prescription and documents</li>
                    <li>This usually takes 24-48 hours</li>
                    <li>You'll receive an email notification once approved</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="alert alert-warning text-start mb-4">
              <div className="d-flex align-items-start gap-2">
                <Phone size={20} className="mt-1 flex-shrink-0" />
                <div>
                  <strong>Doctor May Contact You</strong>
                  <p className="mb-0 mt-2">
                    If our medical team finds anything unclear or misleading in your reports or prescription, 
                    a qualified doctor may contact you for clarification. Please ensure your contact information is accurate.
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-light mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Need Help?</h6>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Mail size={18} className="text-primary" />
                  <span className="small">support@expiryeaze.com</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Phone size={18} className="text-primary" />
                  <span className="small">1-800-EXPIRY (397479)</span>
                </div>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button
                className="btn btn-success btn-lg"
                onClick={onContinueShopping}
              >
                Continue Shopping
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionSuccessModal;

