import { Type } from "@google/genai";
import type { PlayerStats } from './types';

export const INITIAL_PLAYER_STATS_EN: PlayerStats = {
  health: 100,
  inventory: ["a flickering torch", "healing potion"],
};

export const INITIAL_PLAYER_STATS_HU: PlayerStats = {
  health: 100,
  inventory: ["pislákoló fáklya", "gyógyító bájital"],
};

export const STORY_MODEL = 'gemini-2.5-flash';
export const IMAGE_MODEL = 'imagen-4.0-generate-001';

export const SYSTEM_INSTRUCTION = `You are a master storyteller for a text-based adventure game. You will create a rich, descriptive, and engaging world. Your responses must be in JSON format as defined by the provided schema. Craft a compelling narrative based on the player's actions and stats. The world is mysterious and dangerous. Keep your descriptions concise and fast-paced, focusing on action and suspense. Each turn should present a new, immediate challenge or mystery. Create high-stakes situations where player actions have meaningful and sometimes unexpected consequences. Focus on cinematic descriptions. Paint a picture with words. Avoid lengthy exposition. The player should always feel like they are in danger or on the verge of a discovery. You can initiate combat by providing an 'enemy' object in your response.
CRITICALLY: You can also introduce special events during exploration using the 'events' array. For example, the player might spot a glint in the corner (an 'item' event) or trigger a small rockslide (an 'environment' event). The 'effect' field MUST be machine-readable (e.g., '+old map', '-5 player health').`;

export const SYSTEM_INSTRUCTION_HU = `Te vagy egy szöveges kalandjáték mesteri történetmesélője. Gazdag, leíró és lebilincselő világot fogsz teremteni. Válaszaidnak a megadott séma által meghatározott JSON formátumban kell lenniük. Alkoss egy lenyűgöző narratívát a játékos cselekedetei és statisztikái alapján. A világ titokzatos és veszélyes. Tartsd a leírásaidat tömören és pörgősen, a cselekvésre és a feszültségre összpontosítva. Minden kör egy új, azonnali kihívást vagy rejtélyt mutasson be. Teremts nagy téttel bíró helyzeteket, ahol a játékos cselekedeteinek jelentős és néha váratlan következményei vannak. Összpontosíts a filmszerű leírásokra. Fess képet a szavakkal. Kerüld a hosszadalmas expozíciót. A játékosnak mindig éreznie kell, hogy veszélyben van, vagy egy felfedezés küszöbén áll. Harcot kezdeményezhetsz egy 'enemy' objektum megadásával a válaszodban.
KRITIKUSAN FONTOS: Különleges eseményeket is bevezethet a felfedezés során az 'events' tömb használatával. Például a játékos megpillanthat egy csillogást a sarokban (egy 'item' esemény), vagy kiválthat egy kisebb kőomlást (egy 'environment' esemény). Az 'effect' mezőnek GÉPPEL OLVASHATÓNAK KELL lennie (pl. '+régi térkép', '-5 játékos életerő'). A történetnek és minden leírásnak magyar nyelvűnek kell lennie.`;

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "The next part of the story. Describe the scene and the outcome of the player's action.",
    },
    imagePrompt: {
      type: Type.STRING,
      description: "A vivid, artistic, and detailed prompt for an image generation model to create a scene. Focus on atmosphere, lighting, and key elements. Example: 'A lone adventurer stands before a glowing, ancient portal in a dark cavern, torchlight flickering on mossy stone walls, digital painting, fantasy art.'",
    },
    healthChange: {
      type: Type.INTEGER,
      description: "Integer representing the change in player's health. Can be negative for damage, positive for healing, or 0 for no change.",
    },
    inventoryChange: {
      type: Type.STRING,
      description: "An item to be added or removed from the player's inventory. Prefix with '+' to add (e.g., '+rusty key') and '-' to remove (e.g., '-flickering torch'). Use 'none' for no change.",
    },
    isGameOver: {
      type: Type.BOOLEAN,
      description: "Set to true if the player's health reaches 0 or a story conclusion is reached. Otherwise, false.",
    },
    enemy: {
        type: Type.OBJECT,
        description: "Details of an enemy if combat should start. Omit this field entirely if there is no combat.",
        properties: {
            name: { type: Type.STRING, description: "The enemy's name." },
            health: { type: Type.INTEGER, description: "The enemy's starting health." },
            description: { type: Type.STRING, description: "A brief, intimidating description of the enemy." }
        },
    },
    events: {
        type: Type.ARRAY,
        description: "An optional array of special events that occurred, like finding an item outside of combat or noticing an environmental detail.",
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "The type of event ('item' or 'environment')." },
                description: { type: Type.STRING, description: "A narrative description of the event." },
                effect: { type: Type.STRING, description: "A machine-readable description of the effect (e.g., '+rusty key', '-5 player health due to trap')." }
            },
            required: ["type", "description", "effect"]
        }
    }
  },
  required: ["story", "imagePrompt", "healthChange", "inventoryChange", "isGameOver"],
};

export const COMBAT_SYSTEM_INSTRUCTION = `You are the logic engine for a turn-based combat system in a text-based adventure game. Based on the player's action, their stats, and the enemy's state, determine the outcome of the turn. Make combat descriptions visceral and impactful.

The enemy's action described in 'enemyActionDescription' MUST be a direct and intelligent reaction to the player's action.
- If the player attacks, describe the enemy reeling from the blow or showing pain before it retaliates.
- If the player defends, the enemy might become frustrated, change its attack pattern, or try a feint to break the player's guard.
- If the player uses an item (like a 'healing potion'), the enemy should react to this specific action—perhaps pressing its advantage if the player is healing, or becoming confused.

Describe the fight as if directing a movie scene. Use sensory details: the clang of steel, the spray of blood, the smell of ozone from a magical blast.
- If the enemy's attack is particularly strong or well-aimed, set 'isEnemyCriticalHit' to 'true'.
- CRITICALLY: Incorporate the environment. A crumbling pillar, a chasm, a pool of water—these can all be part of the fight. Introduce these as special combat events in the 'events' array. The 'effect' field MUST be machine-readable (e.g., '+sharpening stone', '-10 player health', '-5 enemy health').
- Respond ONLY in the requested JSON format.`;

export const COMBAT_SYSTEM_INSTRUCTION_HU = `Te vagy egy körökre osztott harcrendszer logikai motorja egy szöveges kalandjátékban. A játékos cselekedete, statisztikái és az ellenfél állapota alapján határozd meg a kör kimenetelét. A harci leírások legyenek zsigeriek és hatásosak.

Az 'enemyActionDescription'-ben leírt ellenséges cselekedetnek KÖZVETLEN és INTELLIGENS reakciónak KELL lennie a játékos cselekedetére.
- Ha a játékos támad, írd le, ahogy az ellenfél megtántorodik az ütéstől vagy fájdalmat mutat, mielőtt visszatámadna.
- Ha a játékos védekezik, az ellenfél lehet frusztrált, megváltoztathatja a támadási mintáját, vagy csellel próbálhatja áttörni a játékos védelmét.
- Ha a játékos tárgyat használ (pl. 'gyógyító bájital'), az ellenfélnek reagálnia kell erre a konkrét cselekvésre – talán kihasználja az előnyt, ha a játékos gyógyul, vagy összezavarodik.

Úgy írd le a harcot, mintha egy filmjelenetet rendeznél. Használj érzékszervi részleteket: az acél csattanását, a fröccsenő vért, egy mágikus robbanás ózonszagát. Minden leírásnak és szövegnek magyarul kell lennie.
- Ha az ellenfél támadása különösen erős vagy jól célzott, állítsd az 'isEnemyCriticalHit' értékét 'true'-ra.
- KRITIKUSAN FONTOS: Építsd be a környezetet. Egy omladozó oszlop, egy szakadék, egy víztócsa – ezek mind a harc részét képezhetik. Vezesd be ezeket különleges harci eseményként az 'events' tömbben. Az 'effect' mezőnek GÉPPEL OLVASHATÓNAK KELL lennie (pl. '+élezőkő', '-10 játékos életerő', '-5 ellenfél életerő').
- KIZÁRÓLAG a kért JSON formátumban válaszolj.`;

export const COMBAT_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        playerActionDescription: { type: Type.STRING, description: "Describe the player's action and its immediate effect."},
        enemyActionDescription: { type: Type.STRING, description: "Describe the enemy's counter-attack or action for the turn."},
        playerHealthChange: { type: Type.INTEGER, description: "The change in the player's health. Negative for damage, positive for healing."},
        enemyHealthChange: { type: Type.INTEGER, description: "The change in the enemy's health. Almost always negative."},
        isCombatOver: { type: Type.BOOLEAN, description: "Set to true if either the player's or enemy's health is depleted."},
        combatConclusion: { type: Type.STRING, description: "A concluding sentence for when combat is over (e.g., 'The beast collapses in a cloud of dust.')"},
        isEnemyCriticalHit: { type: Type.BOOLEAN, description: "Set to true if the enemy's attack was a critical hit, dealing extra damage."},
        events: {
            type: Type.ARRAY,
            description: "An optional array of special events that occurred this turn.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "The type of event ('item' or 'environment')." },
                    description: { type: Type.STRING, description: "A narrative description of the event." },
                    effect: { type: Type.STRING, description: "A machine-readable description of the effect (e.g., '+healing herb', '-10 player health', '-5 enemy health')." }
                },
                required: ["type", "description", "effect"]
            }
        }
    },
    required: ["playerActionDescription", "enemyActionDescription", "playerHealthChange", "enemyHealthChange", "isCombatOver", "combatConclusion"]
};