import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { GameState } from '../types';
import type { PlayerStats, StorySegment, Enemy } from '../types';
import PlayerStatsDisplay from './PlayerStats';
import ActionButton from './ActionButton';
import { useTranslations } from '../hooks/useTranslations';

interface GameScreenProps {
  gameState: GameState;
  story: StorySegment[];
  image: string;
  playerStats: PlayerStats;
  enemy: Enemy | null;
  onExplorationAction: (action: string) => void;
  onCombatAction: (action: string) => void;
  error: string | null;
  currentCombatAction: string | null;
  onAnimationComplete: () => void;
  isPlayerDefending: boolean;
  isCriticalHit: boolean;
  language: 'en' | 'hu';
}

const EnemyStatsDisplay: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const [isHit, setIsHit] = useState(false);
  const prevHealthRef = useRef(enemy.health);

  useEffect(() => {
    if (enemy.health < prevHealthRef.current) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 500); // Matches health-flash animation duration
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = enemy.health;
  }, [enemy.health]);
  
  const healthPercentage = (enemy.health / 100) * 100; // Assuming max health is 100 for simplicity
  const damageFlashClass = isHit ? 'animate-health-flash' : '';

  return (
    <div className="border-b border-slate-700 pb-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-red-400 uppercase">{enemy.name}</h3>
        <span className="font-bold text-white">{enemy.health}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-4 shadow-inner">
        <div
          className={`bg-red-500 h-4 rounded-full transition-all duration-500 ease-in-out ${damageFlashClass}`}
          style={{ width: `${healthPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};


const GameScreen: React.FC<GameScreenProps> = ({ 
    gameState, story, image, playerStats, enemy, onExplorationAction, onCombatAction, error, currentCombatAction, onAnimationComplete, isPlayerDefending, isCriticalHit, language
}) => {
  const [actionText, setActionText] = useState('');
  const storyEndRef = useRef<HTMLDivElement>(null);
  const [animations, setAnimations] = useState({ attack: false, defend: false, useItem: false, criticalHit: false, enemyAttack: false });
  const [isEnemyHitVisual, setIsEnemyHitVisual] = useState(false);
  const prevEnemyHealth = useRef(enemy?.health);
  const t = useTranslations(language);


  const lastStorySegment = story.length > 0 ? story[story.length - 1] : null;

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story]);

  useEffect(() => {
    if (enemy && prevEnemyHealth.current !== undefined && enemy.health < prevEnemyHealth.current) {
        if (!isCriticalHit) { // Critical hits have their own, bigger effects
            setIsEnemyHitVisual(true);
            const timer = setTimeout(() => setIsEnemyHitVisual(false), 400); // screen-shake is 0.4s
            return () => clearTimeout(timer);
        }
    }
    prevEnemyHealth.current = enemy?.health;
  }, [enemy?.health, isCriticalHit]);

  useEffect(() => {
    if (!currentCombatAction) return;

    const action = currentCombatAction.split(' ')[0].toLowerCase();
    const isStandardHit = !isCriticalHit;
    
    let newAnims = { 
        attack: action === 'attack' || action === 'támadás', 
        defend: action === 'defend' || action === 'védekezés',
        useItem: currentCombatAction.toLowerCase().includes('use') || currentCombatAction.toLowerCase().includes('haszná'),
        criticalHit: isCriticalHit,
        enemyAttack: isStandardHit
    };

    // A critical hit is a special event; don't show the standard hit/slash animations.
    if (isCriticalHit) {
        newAnims.enemyAttack = false;
    }
    
    setAnimations(newAnims);

    // Determine the longest animation duration needed for this turn to avoid cutting effects off
    let durations = [1000]; // Default duration for standard attacks/hits
    if (newAnims.useItem) durations.push(1500); // The enhanced particle effect can last up to 1.5s
    if (newAnims.criticalHit) durations.push(1200); // Critical hit effect is 1.2s
    if (newAnims.defend) durations.push(800); // Shield shimmer is 0.8s
    
    const animationDuration = Math.max(...durations);

    const timer = setTimeout(() => {
      setAnimations({ attack: false, defend: false, useItem: false, criticalHit: false, enemyAttack: false });
      onAnimationComplete();
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [currentCombatAction, isCriticalHit, onAnimationComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionText.trim()) {
      onExplorationAction(actionText.trim());
      setActionText('');
    }
  };

  const renderActionPanel = () => {
    if (gameState === GameState.COMBAT) {
        const hasPotion = playerStats.inventory.some(item => item.toLowerCase().includes(t.healingPotionName.toLowerCase()));
        return (
            <div className="mt-auto flex justify-center gap-2">
            <ActionButton onClick={() => onCombatAction('attack')} text={t.attack} />
            <ActionButton onClick={() => onCombatAction('defend')} text={t.defend} />
            {hasPotion && <ActionButton onClick={() => onCombatAction(t.usePotionAction)} text={t.usePotion} />}
            </div>
        );
    }

    return (
       <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-auto">
        <input
          type="text"
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          placeholder={t.whatDoYouDo}
          className="flex-grow bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <ActionButton type="submit" text={t.act} />
      </form>
    );
  }
  
  const getSegmentStyle = (segment: StorySegment) => {
    let baseStyle = "mb-4 transition-all duration-300";
    if (segment.id === lastStorySegment?.id) {
        baseStyle += " animate-fade-slide-in";
    }

    switch(segment.type) {
        case 'combat':
            return `${baseStyle} text-slate-400`;
        case 'story':
        default:
            return `${baseStyle} text-slate-300`;
    }
  };

  const renderEvent = (segment: StorySegment) => {
    let eventConfig = {
      title: t.environmentalHazard,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      containerClasses: 'bg-gradient-to-br from-amber-500/20 via-slate-800 to-slate-800 border-amber-500',
      titleColor: 'text-amber-400',
      animation: 'animate-pulse'
    };

    if (segment.eventType === 'item') {
        eventConfig = {
          title: t.itemEvent,
          icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          ),
          containerClasses: 'bg-gradient-to-br from-cyan-500/20 via-slate-800 to-slate-800 border-cyan-500',
          titleColor: 'text-cyan-400',
          animation: 'animate-fade-slide-in'
        };
    }

    return (
        <div key={segment.id} className={`mb-4 p-4 rounded-lg border shadow-lg transition-all duration-500 ${eventConfig.containerClasses} ${segment.id === lastStorySegment?.id ? eventConfig.animation : ''}`}>
            <div className={`flex items-center gap-3 mb-2 pb-2 border-b border-white/10`}>
                <div className={eventConfig.titleColor}>{eventConfig.icon}</div>
                <h4 className={`font-bold text-sm uppercase tracking-wider ${eventConfig.titleColor}`}>{eventConfig.title}</h4>
            </div>
            <p className="text-slate-300 italic">{segment.text}</p>
        </div>
    );
  }

  const imageContainerClasses = [
    "lg:col-span-3", "rounded-lg", "overflow-hidden", "shadow-2xl", "shadow-cyan-500/10", "relative",
    (isEnemyHitVisual || animations.criticalHit) && "animate-screen-shake"
  ].filter(Boolean).join(" ");

  const gridContainerClasses = [
      "grid", "grid-cols-1", "lg:grid-cols-5", "gap-8", "max-h-[90vh]", "p-2", "rounded-lg", "transition-all", "duration-500",
      gameState === GameState.COMBAT && "animate-combat-border-pulse"
  ].filter(Boolean).join(" ");

  return (
    <div className={gridContainerClasses}>
      <div className={imageContainerClasses}>
        <img key={image} src={image} alt="Current scene" className="w-full h-full object-cover animate-slow-zoom-in" />

        {/* Animation Overlays */}
        {animations.useItem && (
            <>
                {/* A brief, gentle glow pulsing from the bottom */}
                <div 
                    className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_rgba(0,255,255,0.4)_0%,_rgba(0,255,255,0)_70%)] animate-shield-shimmer"
                />
                {/* Particles emanating upwards */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute bottom-0 w-2 h-2 bg-cyan-300 rounded-full animate-healing-effect"
                            style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 0.4}s`,
                            animationDuration: `${1 + Math.random() * 0.5}s`,
                            boxShadow: '0 0 8px 2px rgba(0, 255, 255, 0.7)',
                            }}
                        />
                    ))}
                </div>
            </>
        )}
        {animations.attack && (
            <>
                <div className="absolute top-1/2 left-1/2 w-48 h-1 bg-white rounded-full shadow-[0_0_15px_cyan,0_0_5px_white] animate-slash-1" />
                <div className="absolute top-1/2 left-1/2 w-48 h-1 bg-white rounded-full shadow-[0_0_15px_cyan,0_0_5px_white] animate-slash-2" />
            </>
        )}
        {animations.enemyAttack && (
            <div className="absolute top-1/2 left-1/2 w-56 h-1 bg-red-500 rounded-full shadow-[0_0_15px_#ef4444,0_0_5px_#fca5a5] animate-enemy-slash" />
        )}
        {animations.defend && (
             <div className="absolute inset-0 flex items-center justify-center animate-shield-shimmer">
                <svg className="w-32 h-32 text-cyan-300 opacity-80" style={{filter: 'drop-shadow(0 0 10px cyan)'}} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="none">
                  <path d="M12 2.09935C12 2.09935 12.0001 2.09938 12.0001 2.09941C12.3591 2.11542 12.7132 2.17188 13.0541 2.26622C16.8901 3.33215 19.9041 6.64303 20.7333 10.682C21.036 12.162 21.036 13.638 20.7333 15.118C19.9041 19.157 16.8901 22.4678 13.0541 23.5338C12.7132 23.6281 12.3591 23.6846 12.0001 23.7006C12.0001 23.7006 12 23.7007 12 23.7007C11.641 23.6846 11.2868 23.6281 10.9459 23.5338C7.10991 22.4678 4.09591 19.157 3.26667 15.118C2.96401 13.638 2.96401 12.162 3.26667 10.682C4.09591 6.64303 7.10991 3.33215 10.9459 2.26622C11.2868 2.17188 11.641 2.11542 12 2.09935Z" />
                </svg>
             </div>
        )}
        {isEnemyHitVisual && (
            <div className="absolute inset-0 shadow-[inset_0_0_80px_40px_rgba(239,68,68,0.4)] animate-hit-flash pointer-events-none" />
        )}
        {animations.criticalHit && (
          <>
            <div className="absolute inset-0 animate-critical-flash pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-5xl md:text-7xl font-extrabold text-white text-center tracking-wider animate-critical-text"
                style={{ textShadow: '0 0 5px #000, 0 0 10px #000, 0 0 20px #ef4444' }}>
                {t.criticalHit}
              </h2>
            </div>
          </>
        )}
      </div>

      <div className="lg:col-span-2 flex flex-col bg-slate-800 rounded-lg p-6 shadow-lg max-h-[90vh]">
        <PlayerStatsDisplay stats={playerStats} isDefending={isPlayerDefending} language={language} />
        
        {enemy && <EnemyStatsDisplay enemy={enemy} />}

        <div className="flex-grow my-4 overflow-y-auto pr-2">
          {story.map((segment) => {
            if (segment.type === 'event') {
                return renderEvent(segment);
            }
            return (
                <p key={segment.id} className={getSegmentStyle(segment)}>
                  {segment.text}
                </p>
            );
          })}
          <div ref={storyEndRef} />
        </div>

        {error && <p className="text-red-400 text-center mb-2">{error}</p>}
        
        {renderActionPanel()}
      </div>
    </div>
  );
};

export default GameScreen;
