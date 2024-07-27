import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  backPath: string;
}

const BackButton: React.FC<BackButtonProps> = ({ backPath }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(backPath);
  };

  return (
    <button onClick={handleBackClick}>
      &lt;&nbsp;Back
    </button>
  );
};

export default BackButton;
