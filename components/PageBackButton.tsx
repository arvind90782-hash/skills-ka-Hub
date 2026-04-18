import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageBackButtonProps {
  label?: string;
  fallbackTo?: string;
  className?: string;
}

const PageBackButton: React.FC<PageBackButtonProps> = ({ label = 'Back', fallbackTo = '/', className }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex items-center gap-2 text-sm font-semibold text-brand-text-secondary transition-colors hover:text-brand-accent ${className || ''}`}
    >
      <span className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
        <ArrowLeft size={18} />
      </span>
      <span>{label}</span>
    </button>
  );
};

export default PageBackButton;
