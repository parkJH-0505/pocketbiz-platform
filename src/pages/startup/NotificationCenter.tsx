import React from 'react';
import { NotificationCenter as NotificationCenterComponent } from '../../components/notifications/NotificationCenter';
import { useNavigate } from 'react-router-dom';

const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <NotificationCenterComponent 
      onClose={() => navigate('/startup/dashboard')}
    />
  );
};

export default NotificationCenterPage;