import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../lib/config';
import { Edit, Save, UserCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from "../hooks/use-toast.js";

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'location', 'aadhar']; // profileImage is now optional

const VendorProfileSidebar = ({ isOpen, onOpenChange, onProfileUpdated }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [profileExists, setProfileExists] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  // Autofill name/email from user if profile is empty
  useEffect(() => {
    if (user && (!form.name && !form.email)) {
      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user, form.name, form.email]);

  // Calculate profile completion percentage
  useEffect(() => {
    const filled = REQUIRED_FIELDS.filter(field => form[field] && form[field].toString().trim() !== '').length;
    setProgress(Math.round((filled / REQUIRED_FIELDS.length) * 100));
  }, [form]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${config.API_URL}/vendors/profile`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setProfile(res.data.profile);
      setForm(res.data.profile);
      setProfileExists(true);
    } catch (err) {
      // If profile does not exist, allow creation
      setProfile(null);
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        location: '',
        aadhar: '',
        profileImage: '',
      });
      setProfileExists(false);
      setError(''); // Don't show error, allow creation
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileImage' && files && files[0]) {
      setForm((prev) => ({ ...prev, profileImage: URL.createObjectURL(files[0]) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = { ...form };
      if (!payload.profileImage) delete payload.profileImage;
      let res;
      if (profileExists) {
        res = await axios.put(`${config.API_URL}/vendors/profile`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await axios.post(`${config.API_URL}/vendors/profile`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      console.log('Profile save response:', res.data);
      if (res.data && res.data.profile) {
        setProfile(res.data.profile);
        setForm(res.data.profile);
        setProfileExists(true);
        setEditMode(false);
        toast({ title: "Profile updated successfully!", description: "Your profile has been saved.", });
        if (onProfileUpdated) onProfileUpdated();
      } else {
        setError('Profile save failed: No profile returned');
        toast({ title: "Profile save failed", description: "No profile returned from server.", });
      }
    } catch (err) {
      console.error('Profile save error:', err);
      setError('Failed to save profile');
      toast({ title: "Profile save failed", description: "An error occurred while saving your profile.", });
    } finally {
      setLoading(false);
    }
  };

  const isComplete = REQUIRED_FIELDS.every((field) => form[field] && form[field].toString().trim() !== '');

  if (!isOpen) return null;

  // Professional UI: banner, avatar, two-column layout in expanded mode
  const ProfileContent = () => (
    <div className="profile-card-container">
      {/* Banner */}
      <div className="profile-banner" />
      <div className="profile-card shadow-lg rounded-4 p-4 bg-white">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <UserCircle size={36} />
            <span className="fw-bold fs-4">Vendor Profile</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-link p-1" 
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Minimize profile" : "Expand profile"}
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            </button>
            <button 
              className="btn btn-link p-0" 
              onClick={() => onOpenChange(false)}
              aria-label="Close profile"
            >
              <X size={26} />
            </button>
          </div>
        </div>
        {/* Avatar and Info */}
        <div className="text-center mb-4">
          <label htmlFor="profileImage" className="cursor-pointer">
            <img
              src={form.profileImage || '/placeholder-user.jpg'}
              alt="Profile"
              className="rounded-circle border border-3"
              style={{ width: '110px', height: '110px', objectFit: 'cover', boxShadow: '0 2px 12px #0001' }}
            />
            {editMode && (
              <input 
                type="file" 
                id="profileImage" 
                name="profileImage" 
                accept="image/*" 
                className="d-none" 
                onChange={handleChange} 
              />
            )}
          </label>
          <div className="fw-semibold fs-5 mt-2">{form.name || 'Your Name'}</div>
          <div className="text-muted small">{form.email || 'Email'}</div>
        </div>
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="progress" style={{ height: '8px', background: '#e9ecef' }}>
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="small text-muted mt-1">Profile Completion: {progress}%</div>
        </div>
        {/* Form Section */}
        <form className="row g-3 mt-2">
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="name">Full Name <span className="text-muted">(First + Last)</span></label>
            <input
              type="text"
              className="form-control"
              name="name"
              id="name"
              value={form.name || ''}
              onChange={handleChange}
              onBlur={(e) => {
                const trimmed = e.target.value.trim();
                handleChange({ target: { name: 'name', value: trimmed } });
              }}
              disabled={!editMode}
              required
              minLength="5"
              pattern="^[A-Za-z]{2,}(\s+[A-Za-z]{2,})+$"
              title="Please enter your full name with first name and last name (e.g., 'John Doe'). Each name must be at least 2 letters."
              placeholder="e.g., John Doe"
              style={{ background: !editMode ? '#f1f3f6' : undefined }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="email">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              id="email"
              value={form.email || ''}
              onChange={handleChange}
              disabled={!editMode}
              required
              pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
              title="Please enter a valid email address with proper domain (e.g., user@example.com). Domain must have a top-level domain like .com, .org, etc."
              style={{ background: !editMode ? '#f1f3f6' : undefined }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="phone">Phone</label>
            <input
              type="tel"
              className="form-control"
              name="phone"
              id="phone"
              value={form.phone || ''}
              onChange={handleChange}
              disabled={!editMode}
              required
              style={{ background: !editMode ? '#f1f3f6' : undefined }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="location">Location</label>
            <input
              type="text"
              className="form-control"
              name="location"
              id="location"
              value={form.location || ''}
              onChange={handleChange}
              disabled={!editMode}
              required
              style={{ background: !editMode ? '#f1f3f6' : undefined }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="aadhar">Aadhar Number</label>
            <input
              type="text"
              className="form-control"
              name="aadhar"
              id="aadhar"
              value={form.aadhar || ''}
              onChange={handleChange}
              disabled={!editMode}
              required
              style={{ background: !editMode ? '#f1f3f6' : undefined }}
            />
          </div>
        </form>
        <div className="mt-4">
          {editMode ? (
            <button 
              className="btn btn-success w-100 py-2 fs-5" 
              onClick={handleSave} 
              disabled={loading || !isComplete}
              type="button"
            >
              <Save className="me-2" size={18} /> Save Profile
            </button>
          ) : (
            <button 
              className="btn btn-outline-primary w-100 py-2 fs-5" 
              onClick={() => setEditMode(true)}
              type="button"
            >
              <Edit className="me-2" size={18} /> Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" 
        style={{ zIndex: 1040 }}
        onClick={() => onOpenChange(false)}
      />
      {/* Sidebar/Modal */}
      <div 
        className={`position-fixed top-0 start-0 h-100 bg-transparent ${isExpanded ? 'w-100' : ''}`}
        style={{ 
          width: isExpanded ? '100%' : '420px', 
          zIndex: 1050, 
          overflowY: 'auto',
          transition: 'width 0.3s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'center' : 'flex-start',
        }}
      >
        <ProfileContent />
      </div>
      <style>{`
        .profile-banner {
          height: 120px;
          background: linear-gradient(90deg, #4f8cff 0%, #38cfa6 100%);
          border-top-left-radius: 1.5rem;
          border-top-right-radius: 1.5rem;
        }
        .profile-card-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .profile-card {
          margin-top: -60px;
          min-width: 320px;
          max-width: 600px;
          width: 100%;
        }
        @media (max-width: 600px) {
          .profile-card {
            min-width: 0;
            max-width: 100vw;
            padding: 1rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default VendorProfileSidebar;
