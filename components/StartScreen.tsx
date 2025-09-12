import React, { useState } from 'react';
import ActionButton from './ActionButton';
import { useTranslations } from '../hooks/useTranslations';

interface StartScreenProps {
  onStartNewGame: (storyIdea: string) => void;
  onContinue: () => void;
  saveExists: boolean;
  language: 'en' | 'hu';
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartNewGame, onContinue, saveExists, language }) => {
  const t = useTranslations(language);
  const [storyIdea, setStoryIdea] = useState('');

  const handleStart = () => {
    const prompt = storyIdea.trim() === '' ? t.storyIdeaPlaceholder : storyIdea.trim();
    onStartNewGame(prompt);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4 animate-fadeIn">
      <h1 className="text-6xl md:text-8xl font-bold text-cyan-300 mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
        {t.title}
      </h1>
      <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl">
        {t.subtitle}
      </p>
      
      <div className="w-full max-w-lg mb-6">
        <label htmlFor="story-idea" className="block text-lg text-cyan-200 mb-2">{t.storyIdeaLabel}</label>
        <textarea
          id="story-idea"
          value={storyIdea}
          onChange={(e) => setStoryIdea(e.target.value)}
          placeholder={t.storyIdeaPlaceholder}
          rows={3}
          className="w-full bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow duration-300 shadow-inner"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {saveExists && (
          <ActionButton onClick={onContinue} text={t.continueJourney} />
        )}
        <ActionButton onClick={handleStart} text={saveExists ? t.startNewJourney : t.beginJourney} />
      </div>
    </div>
  );
};

export default StartScreen;