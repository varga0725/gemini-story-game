import type { GeminiCombatResponse } from './types';

// Helper to get a random element from an array
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// A function to get a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- ATTACK SCENARIOS ---
const attackScenarios_en = [
  {
    playerActionDescription: "You lunge forward, your weapon a flashing arc in the dim light.",
    enemyActionDescription: "The creature hisses as your blade carves a shallow gash across its flank. Enraged, it roars and counters with a clumsy but powerful swipe.",
    playerHealthChange: -getRandomInt(8, 12),
    enemyHealthChange: -getRandomInt(15, 20),
    isEnemyCriticalHit: Math.random() < 0.1,
  },
  {
    playerActionDescription: "With a fierce war cry, you bring your weapon down in a heavy, crushing blow.",
    enemyActionDescription: "A sickening crunch echoes as your blow lands. The beast staggers back, howling in agony, before it lunges forward in a desperate, furious clawing.",
    playerHealthChange: -getRandomInt(10, 15),
    enemyHealthChange: -getRandomInt(20, 25),
    isEnemyCriticalHit: Math.random() < 0.15,
  },
  {
    playerActionDescription: "You feint left, then drive your weapon into the enemy's exposed side with expert precision.",
    enemyActionDescription: "The monster shrieks in pain, black ichor weeping from the deep wound. It flails wildly in retaliation, its tail whipping around blindly to catch you hard across the chest.",
    playerHealthChange: -getRandomInt(6, 10),
    enemyHealthChange: -getRandomInt(18, 22),
    isEnemyCriticalHit: false,
  },
];

const attackScenarios_hu = [
  {
    playerActionDescription: "Előretörsz, fegyvered villanó ív a homályos fényben.",
    enemyActionDescription: "A lény sziszeg, ahogy a pengéd sekély vágást ejt az oldalán. Felbőszülve felüvölt, és egy ügyetlen, de erőteljes csapással vág vissza.",
    playerHealthChange: -getRandomInt(8, 12),
    enemyHealthChange: -getRandomInt(15, 20),
    isEnemyCriticalHit: Math.random() < 0.1,
  },
  {
    playerActionDescription: "Vad csatakiáltással egy nehéz, zúzó csapással sújtasz le fegyvereddel.",
    enemyActionDescription: "Undorító reccsenés visszhangzik, ahogy a csapásod földet ér. A szörnyeteg hátrahőköl, kínjában vonít, mielőtt kétségbeesett, dühödt karmolással előrevetné magát.",
    playerHealthChange: -getRandomInt(10, 15),
    enemyHealthChange: -getRandomInt(20, 25),
    isEnemyCriticalHit: Math.random() < 0.15,
  },
  {
    playerActionDescription: "Balra cselezel, majd szakértő pontossággal az ellenség védtelen oldalába döföd a fegyvered.",
    enemyActionDescription: "A szörnyeteg fájdalmában felsikolt, fekete váladék szivárog a mély sebből. Vadul csapkodva vág vissza, farka vakon körbecsap, keményen mellkason találva téged.",
    playerHealthChange: -getRandomInt(6, 10),
    enemyHealthChange: -getRandomInt(18, 22),
    isEnemyCriticalHit: false,
  },
];


// --- DEFEND SCENARIOS ---
const defendScenarios_en = [
  {
    playerActionDescription: "You raise your shield, bracing for the inevitable impact.",
    enemyActionDescription: "The monster's attack slams into your defense with the force of a battering ram. It grunts in frustration as the blow is deflected, unable to break your guard.",
    playerHealthChange: -getRandomInt(2, 5), // Blocked damage
    enemyHealthChange: 0,
    isEnemyCriticalHit: false,
  },
  {
    playerActionDescription: "Anticipating the attack, you duck and weave, letting the blow whistle harmlessly past your ear.",
    enemyActionDescription: "The creature overextends, leaving it momentarily off-balance. It snarls, annoyed at its own mistake, as it regains its footing.",
    playerHealthChange: 0,
    enemyHealthChange: 0,
    isEnemyCriticalHit: false,
  },
  {
    playerActionDescription: "You expertly parry the incoming strike, sparks flying as steel meets claw.",
    enemyActionDescription: "Sparks fly as you expertly parry the strike. The enemy pauses, surprised by your skill, recalculating its approach.",
    playerHealthChange: -getRandomInt(3, 7), // Glancing blow
    enemyHealthChange: 0,
    isEnemyCriticalHit: false,
  },
];

const defendScenarios_hu = [
    {
      playerActionDescription: "Felemeled a pajzsod, felkészülve az elkerülhetetlen becsapódásra.",
      enemyActionDescription: "A szörny támadása faltörő kosként csapódik a védelmedbe. Frusztráltan hördül, ahogy a csapást elhárítod, képtelen áttörni a védelmedet.",
      playerHealthChange: -getRandomInt(2, 5), // Blokkolt sebzés
      enemyHealthChange: 0,
      isEnemyCriticalHit: false,
    },
    {
      playerActionDescription: "Előre látva a támadást, lebuksz és kitérsz, hagyva, hogy a csapás ártalmatlanul süvítsen el a füled mellett.",
      enemyActionDescription: "A lény túlságosan kinyúlik, egy pillanatra kibillenve az egyensúlyából. Vicsorog, bosszankodva saját hibáján, miközben visszanyeri a talpát.",
      playerHealthChange: 0,
      enemyHealthChange: 0,
      isEnemyCriticalHit: false,
    },
    {
      playerActionDescription: "Mesterien hárítod a bejövő csapást, szikrák szállnak, ahogy az acél karommal találkozik.",
      enemyActionDescription: "Szikrák szállnak, ahogy mesterien hárítod a csapást. Az ellenség megáll, meglepődve a képességeiden, újraszámolva a következő lépését.",
      playerHealthChange: -getRandomInt(3, 7), // Súroló csapás
      enemyHealthChange: 0,
      isEnemyCriticalHit: false,
    },
  ];

const getCannedResponse = (language: 'en' | 'hu', type: 'attack' | 'defend'): GeminiCombatResponse => {
    const scenarioBank = type === 'attack'
        ? (language === 'hu' ? attackScenarios_hu : attackScenarios_en)
        : (language === 'hu' ? defendScenarios_hu : defendScenarios_en);

    const scenario = getRandom(scenarioBank);

    return {
        ...scenario,
        isCombatOver: false,
        combatConclusion: '',
        events: [],
    };
};

export const getCannedAttackResponse = (language: 'en' | 'hu') => getCannedResponse(language, 'attack');
export const getCannedDefendResponse = (language: 'en' | 'hu') => getCannedResponse(language, 'defend');