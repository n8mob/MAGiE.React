import { FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  backPath: string;
}

const BackButton: FC<BackButtonProps> = ({ backPath }) => {
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
