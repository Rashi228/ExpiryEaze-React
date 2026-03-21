import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ChefFloatingButton.css';

const ChefFloatingButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show for vendors, unauthenticated users, or if already on the /my-items page
  if (!user || user.role === 'vendor' || location.pathname === '/my-items') {
    return null;
  }

  return (
    <div 
      className="chef-floating-container" 
      onClick={() => navigate('/my-items')}
    >
      <div className="chef-tooltip shadow-sm">Meet Your AI Chef!</div>
      <div className="chef-icon-wrapper shadow">
        <span className="chef-emoji">🧑‍🍳</span>
      </div>
    </div>
  );
};

export default ChefFloatingButton;
