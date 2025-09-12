import React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { PlayerStats } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface PlayerStatsProps {
  stats: PlayerStats;
  isDefending: boolean;
  language: 'en' | 'hu';
}

const HealthBar: React.FC<{ health: number }> = ({ health }) => {
  const [isDamaged, setIsDamaged] = useState(false);
  const prevHealthRef = useRef(health);

  useEffect(() => {
    if (health < prevHealthRef.current) {
      setIsDamaged(true);
      const timer = setTimeout(() => setIsDamaged(false), 500); // Duration of the flash
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = health;
  }, [health]);

  const healthColor = health > 60 ? 'bg-green-500' : health > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const pulseClass = health < 30 ? 'animate-pulse' : '';
  const damageFlashClass = isDamaged ? 'animate-health-flash' : '';

  return (
    <div className="w-full bg-slate-700 rounded-full h-4 shadow-inner">
      <div
        className={`${healthColor} ${pulseClass} ${damageFlashClass} h-4 rounded-full transition-all duration-500 ease-in-out`}
        style={{ width: `${health}%` }}
      ></div>
    </div>
  );
};

const PlayerStatsDisplay: React.FC<PlayerStatsProps> = ({ stats, isDefending, language }) => {
  const t = useTranslations(language);
  return (
    <div className="border-b border-slate-700 pb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cyan-400">{t.health}</h3>
            {isDefending && (
                <div className="flex items-center gap-1.5 bg-slate-700 text-cyan-300 text-xs font-bold px-2 py-1 rounded-full animate-shield-pulse border border-cyan-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{t.defending}</span>
                </div>
            )}
        </div>
        <span className="font-bold text-white">{stats.health} / 100</span>
      </div>
      <HealthBar health={stats.health} />
      
      <h3 className="text-lg font-bold text-cyan-400 mt-4 mb-2">{t.inventory}</h3>
      <div className="flex flex-wrap gap-2">
        {stats.inventory.length > 0 ? (
          stats.inventory.map((item, index) => (
            <span key={index} className="bg-slate-700 text-slate-300 text-sm font-medium px-2.5 py-1 rounded">
              {item}
            </span>
          ))
        ) : (
          <p className="text-slate-400 italic text-sm">{t.emptyPockets}</p>
        )}
      </div>
    </div>
  );
};

export default PlayerStatsDisplay;