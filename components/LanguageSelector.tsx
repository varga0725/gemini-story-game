import React from 'react';

interface LanguageSelectorProps {
  language: 'en' | 'hu';
  onLanguageChange: (language: 'en' | 'hu') => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onLanguageChange }) => {
  return (
    <div className="absolute top-4 right-4 z-10">
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as 'en' | 'hu')}
        className="bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="hu">Magyar</option>
      </select>
    </div>
  );
};

export default LanguageSelector;