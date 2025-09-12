
import React from 'react';

interface ActionButtonProps {
  onClick?: () => void;
  text: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, text, type = 'button', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 disabled:bg-slate-600 disabled:cursor-not-allowed"
    >
      {text}
    </button>
  );
};

export default ActionButton;
