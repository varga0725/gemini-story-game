import React from 'react';
import type { StorySegment } from '../types';
import ActionButton from './ActionButton';
import { useTranslations } from '../hooks/useTranslations';

interface GameOverScreenProps {
  story: StorySegment[];
  onRestart: () => void;
  language: 'en' | 'hu';
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ story, onRestart, language }) => {
  const t = useTranslations(language);
  const finalMessage = story.length > 0 ? story[story.length - 1].text : "Your journey has ended.";

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4 animate-fadeIn">
      <h1 className="text-5xl md:text-7xl font-bold text-red-500 mb-4">{t.theEnd}</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-3xl mb-8">
        <p className="text-lg text-slate-300 italic">
          {finalMessage}
        </p>
      </div>
      <ActionButton onClick={onRestart} text={t.beginNewAdventure} />
    </div>
  );
};

export default GameOverScreen;