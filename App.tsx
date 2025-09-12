import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { GameState } from './types';
import type { PlayerStats, StorySegment, Enemy, CombatEvent, GeminiCombatResponse } from './types';
import { INITIAL_PLAYER_STATS_EN, INITIAL_PLAYER_STATS_HU } from './constants';
import { fetchNextStep, fetchCombatTurn } from './services/geminiService';
import { getCannedAttackResponse, getCannedDefendResponse } from './cannedCombat';
import GameScreen from './components/GameScreen';
import StartScreen from './components/StartScreen';
import LoadingScreen from './components/LoadingScreen';
import GameOverScreen from './components/GameOverScreen';
import LanguageSelector from './components/LanguageSelector';
import { translations } from './localization/translations';

const SAVE_GAME_KEY = 'geminiAdventureSave';

const COMBAT_MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/10/18/audio_7317135b1d.mp3';
const VICTORY_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/01/18/audio_e6988a8472.mp3';
const DEFEAT_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_73ed20296c.mp3';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'hu'>('en');
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(INITIAL_PLAYER_STATS_EN);
  const [story, setStory] = useState<StorySegment[]>([]);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveExists, setSaveExists] = useState(false);
  const [currentCombatAction, setCurrentCombatAction] = useState<string | null>(null);
  const [isPlayerDefending, setIsPlayerDefending] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);

  const combatAudioRef = useRef<HTMLAudioElement>(null);
  const victoryAudioRef = useRef<HTMLAudioElement>(null);
  const defeatAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    try {
        const savedGame = localStorage.getItem(SAVE_GAME_KEY);
        if (savedGame) {
            const savedState = JSON.parse(savedGame);
            setLanguage(savedState.language || 'en');
            setSaveExists(true);
        }
    } catch (error) {
        console.error("Could not read from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
        if ((gameState === GameState.PLAYING || gameState === GameState.COMBAT) && story.length > 0) {
            const saveData = {
                language,
                gameState,
                playerStats,
                story,
                currentImage,
                enemy,
                isPlayerDefending,
            };
            localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(saveData));
            setSaveExists(true);
        }
    } catch (error) {
        console.error("Could not save to localStorage", error);
    }
  }, [language, gameState, playerStats, story, currentImage, enemy, isPlayerDefending]);

  useEffect(() => {
    const combatAudio = combatAudioRef.current;
    const defeatAudio = defeatAudioRef.current;

    if (!combatAudio || !defeatAudio) return;

    try {
      if (gameState === GameState.COMBAT) {
        combatAudio.volume = 0.3; // Subtle volume
        combatAudio.loop = true;
        combatAudio.play().catch(e => console.error("Audio play failed:", e));
      } else {
        combatAudio.pause();
        combatAudio.currentTime = 0;
      }

      if (gameState === GameState.GAME_OVER) {
        defeatAudio.volume = 0.5;
        defeatAudio.play().catch(e => console.error("Audio play failed:", e));
      }
    } catch (error) {
      console.error("Error managing audio playback:", error);
    }
  }, [gameState]);


  const startNewGame = async (storyIdea: string) => {
    try {
        localStorage.removeItem(SAVE_GAME_KEY);
        setSaveExists(false);
    } catch (error) {
        console.error("Could not clear localStorage", error);
    }
    setGameState(GameState.LOADING);
    setError(null);
    setStory([]);
    setPlayerStats(language === 'hu' ? INITIAL_PLAYER_STATS_HU : INITIAL_PLAYER_STATS_EN);
    setEnemy(null);
    setIsPlayerDefending(false);
    setIsCriticalHit(false);
    await processExplorationAction(storyIdea);
  };
  
  const continueGame = () => {
    try {
        const savedGame = localStorage.getItem(SAVE_GAME_KEY);
        if (savedGame) {
            const savedState = JSON.parse(savedGame);
            
            // Add backward compatibility for saves without segment types
            const storyWithTypes = savedState.story.map((segment: any) => ({
                ...segment,
                type: segment.type || 'story',
            }));

            setLanguage(savedState.language || 'en');
            setPlayerStats(savedState.playerStats);
            setStory(storyWithTypes);
            setCurrentImage(savedState.currentImage);
            setEnemy(savedState.enemy);
            setIsPlayerDefending(savedState.isPlayerDefending ?? false);
            setGameState(savedState.gameState); 
            setError(null);
        }
    } catch (error) {
        console.error("Failed to load game from localStorage", error);
        setError("Could not load saved game. Starting a new one.");
        setTimeout(() => startNewGame(translations[language].storyIdeaPlaceholder), 2000);
    }
  };

  const restartGame = () => {
    try {
        localStorage.removeItem(SAVE_GAME_KEY);
        setSaveExists(false);
    } catch (error) {
        console.error("Could not clear localStorage", error);
    }
    setIsPlayerDefending(false);
    setIsCriticalHit(false);
    setGameState(GameState.START);
  };

  const handleAnimationComplete = () => {
    setCurrentCombatAction(null);
    setIsCriticalHit(false);
  };

  const processCombatAction = async (action: string) => {
    if (!enemy) return;
    
    const t = translations[language];
    const lowerCaseAction = action.toLowerCase();
    
    setIsPlayerDefending(lowerCaseAction === 'defend' || lowerCaseAction === 'védekezés');
    setCurrentCombatAction(action);
    
    let result: GeminiCombatResponse | null = null;
    
    if (lowerCaseAction === 'attack' || lowerCaseAction === 'támadás') {
        result = getCannedAttackResponse(language);
    } else if (lowerCaseAction === 'defend' || lowerCaseAction === 'védekezés') {
        result = getCannedDefendResponse(language);
    } else {
        setGameState(GameState.LOADING); // Only show loading for complex actions
        result = await fetchCombatTurn(playerStats, enemy, action, language);
    }

    if (!result) {
      setError("The tides of battle are unclear. Please try again.");
      setGameState(GameState.COMBAT);
      return;
    }

    const { 
        playerActionDescription, enemyActionDescription, 
        playerHealthChange, enemyHealthChange, 
        isCombatOver, combatConclusion, events, isEnemyCriticalHit
    } = result;
    
    setIsCriticalHit(isEnemyCriticalHit ?? false);

    // Aggregate all changes before setting state
    let playerHealthDelta = playerHealthChange;
    let enemyHealthDelta = enemyHealthChange;
    const inventoryChanges: string[] = [];
    const eventStorySegments: StorySegment[] = [];

    if (events && events.length > 0) {
      events.forEach((event: CombatEvent) => {
        eventStorySegments.push({
          id: Date.now() + Math.random(),
          text: event.description,
          type: 'event',
          eventType: event.type,
        });

        const effect = event.effect.trim();
        const parts = effect.split(' ');
        const value = parseInt(parts[0], 10);

        if (!isNaN(value) && parts.length > 1) { // e.g., "-10 player health"
          if (effect.toLowerCase().includes('player health')) {
            playerHealthDelta += value;
          } else if (effect.toLowerCase().includes('enemy health')) {
            enemyHealthDelta += value;
          }
        } else if (effect.startsWith('+') || effect.startsWith('-')) { // e.g., "+sharpening stone"
          inventoryChanges.push(effect);
        }
      });
    }

    // Apply aggregated changes
    const newPlayerHealth = Math.max(0, playerStats.health + playerHealthDelta);
    const newEnemyHealth = Math.max(0, enemy.health + enemyHealthDelta);
    
    let newInventory = [...playerStats.inventory];
    inventoryChanges.forEach(change => {
        if (change.startsWith('+')) {
            const item = change.substring(1).trim();
            if (!newInventory.map(i=>i.toLowerCase()).includes(item.toLowerCase())) {
                newInventory.push(item);
            }
        } else if (change.startsWith('-')) {
            const item = change.substring(1).trim();
            newInventory = newInventory.filter(i => i.toLowerCase() !== item.toLowerCase());
        }
    });

    setPlayerStats({ health: newPlayerHealth, inventory: newInventory });
    setEnemy(prev => (prev ? { ...prev, health: newEnemyHealth } : null));

    // Update story log
    const turnLogText = [playerActionDescription, enemyActionDescription].filter(Boolean).join(' ');
    const newStorySegments: StorySegment[] = [];
    if (turnLogText) {
        newStorySegments.push({ id: Date.now() + Math.random(), text: turnLogText, type: 'combat' });
    }
    setStory(prevStory => [...prevStory, ...newStorySegments, ...eventStorySegments]);

    if (isCombatOver || newPlayerHealth <= 0 || newEnemyHealth <= 0) {
        setEnemy(null);
        setIsPlayerDefending(false);
        const finalConclusion = newPlayerHealth <= 0 ? t.defeatConclusion : newEnemyHealth <= 0 ? `${t.victoryConclusion} ${enemy.name}.` : combatConclusion;
        setStory(prevStory => [...prevStory, { id: Date.now(), text: finalConclusion, type: 'story' }]);
        
        if (newPlayerHealth <= 0) {
            setGameState(GameState.GAME_OVER);
        } else {
            if (victoryAudioRef.current) {
                victoryAudioRef.current.volume = 0.5;
                victoryAudioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
            await processExplorationAction(t.postVictoryAction);
        }
    } else {
        setGameState(GameState.COMBAT);
    }
  }

  const processExplorationAction = async (action: string) => {
    setGameState(GameState.LOADING);
    const context = story.length > 0 ? story[story.length - 1].text : "The story is just beginning.";
    
    const result = await fetchNextStep(context, playerStats, action, language);

    if (!result) {
      setError("The spirits of creation are silent. Please try again.");
      setGameState(GameState.PLAYING);
      return;
    }

    const { storyData, imageData } = result;

    // Aggregate all changes before setting state
    let healthDelta = storyData.healthChange;
    const inventoryChanges = [storyData.inventoryChange];
    const newStorySegments: StorySegment[] = [];

    // Add main story text first
    if (storyData.story) {
        newStorySegments.push({ id: Date.now() + Math.random(), text: storyData.story, type: 'story' });
    }

    // Process events from the story response
    if (storyData.events && storyData.events.length > 0) {
      storyData.events.forEach((event: CombatEvent) => {
        newStorySegments.push({
          id: Date.now() + Math.random(),
          text: event.description,
          type: 'event',
          eventType: event.type,
        });

        const effect = event.effect.trim();
        const parts = effect.split(' ');
        const value = parseInt(parts[0], 10);

        if (!isNaN(value) && parts.length > 1) { // e.g., "-10 player health"
          if (effect.toLowerCase().includes('player health')) {
            healthDelta += value;
          }
        } else if (effect.startsWith('+') || effect.startsWith('-')) { // e.g., "+rusty key"
          inventoryChanges.push(effect);
        }
      });
    }

    // Apply aggregated changes
    const newHealth = Math.max(0, playerStats.health + healthDelta);
    let newInventory = [...playerStats.inventory];
    inventoryChanges.forEach(change => {
        if (change && change !== 'none') {
            if (change.startsWith('+')) {
                const itemToAdd = change.substring(1).trim();
                if (!newInventory.map(i => i.toLowerCase()).includes(itemToAdd.toLowerCase())) {
                     newInventory.push(itemToAdd);
                }
            } else if (change.startsWith('-')) {
                const itemToRemove = change.substring(1).trim();
                newInventory = newInventory.filter(item => item.toLowerCase() !== itemToRemove.toLowerCase());
            }
        }
    });

    setPlayerStats({ health: newHealth, inventory: newInventory });
    setStory(prevStory => [...prevStory, ...newStorySegments]);
    setCurrentImage(imageData);

    if (storyData.isGameOver || newHealth <= 0) {
      setGameState(GameState.GAME_OVER);
    } else if (storyData.enemy) {
      setEnemy(storyData.enemy);
      setIsPlayerDefending(false);
      setGameState(GameState.COMBAT);
    } else {
      setGameState(GameState.PLAYING);
    }
  };


  const renderContent = () => {
    switch (gameState) {
      case GameState.START:
        return <StartScreen onStartNewGame={startNewGame} onContinue={continueGame} saveExists={saveExists} language={language} />;
      case GameState.LOADING:
        return <LoadingScreen language={language} />;
      case GameState.PLAYING:
      case GameState.COMBAT:
        return (
          <GameScreen
            gameState={gameState}
            story={story}
            image={currentImage}
            playerStats={playerStats}
            enemy={enemy}
            onExplorationAction={processExplorationAction}
            onCombatAction={processCombatAction}
            error={error}
            currentCombatAction={currentCombatAction}
            onAnimationComplete={handleAnimationComplete}
            isPlayerDefending={isPlayerDefending}
            isCriticalHit={isCriticalHit}
            language={language}
          />
        );
      case GameState.GAME_OVER:
        return <GameOverScreen story={story} onRestart={restartGame} language={language} />;
      default:
        return <StartScreen onStartNewGame={startNewGame} onContinue={continueGame} saveExists={saveExists} language={language} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-serif flex flex-col items-center justify-center p-4">
      <LanguageSelector language={language} onLanguageChange={setLanguage} />
      <main className="w-full max-w-7xl mx-auto">
        {renderContent()}
      </main>
      <audio ref={combatAudioRef} src={COMBAT_MUSIC_URL} preload="auto"></audio>
      <audio ref={victoryAudioRef} src={VICTORY_SOUND_URL} preload="auto"></audio>
      <audio ref={defeatAudioRef} src={DEFEAT_SOUND_URL} preload="auto"></audio>
    </div>
  );
};

export default App;