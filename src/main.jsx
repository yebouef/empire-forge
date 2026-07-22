import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, CheckCircle2, Download, FileUp, Gauge, Lightbulb,
  Minus, Plus, Redo2, RotateCcw, Save, Search, ShieldCheck,
  Sparkles, Trash2, Undo2,
} from 'lucide-react';
import './styles.css';

const CAP = 100;
const STORAGE_KEY = 'empire-forge:v2';
const sum = values => values.reduce((a, b) => a + b, 0);

const PRESETS = [
  {
    id: 'economy', name: 'Economy Boom', summary: 'Outpace opponents with sustained resource growth.',
    reason: 'Front-loads broadly useful gathering bonuses while keeping enough points for population and worker durability.',
    entries: [
      ['Civ - Economy', '20% Farming', 2], ['Civ - Economy', '15% Wood Cutting', 1],
      ['Civ - General', '15% Population Cap', 1], ['Citizens and Fishing Boats', '30% Hit Points', 2],
    ],
  },
  {
    id: 'infantry', name: 'Infantry Rush', summary: 'Win early fights with fast, durable foot armies.',
    reason: 'Attack and build-time bonuses improve immediate pressure; speed helps reinforce and disengage.',
    entries: [
      ['Infantry - Sword', '25% Attack', 3], ['Infantry - Sword', '30% Build Time Decrease', 1],
      ['Infantry - Sword', '20% Speed', 1], ['Infantry - Spear (Melee)', '25% Attack', 2],
      ['Infantry - Ranged', '20% Attack', 1],
    ],
  },
  {
    id: 'archer', name: 'Archer Command', summary: 'Control the battlefield through ranged pressure.',
    reason: 'Range compounds positioning advantages, while attack and speed improve focus fire and kiting.',
    entries: [
      ['Archers - Foot', '20% Range', 2], ['Archers - Foot', '20% Attack', 2],
      ['Archers - Foot', '20% Speed', 1], ['Archers - Foot', '25% Hit Points', 1],
    ],
  },
  {
    id: 'tanks', name: 'Tank Warfare', summary: 'Crush opponents with armored late-game power.',
    reason: 'Balances attack, range, armor, and production rather than overpaying for one extreme stack.',
    entries: [
      ['Tanks', '20% Attack', 2], ['Tanks', '20% Range', 2], ['Tanks', '10% Armor', 1],
      ['Tanks', '30% Build Time Decrease', 1],
    ],
  },
  {
    id: 'naval', name: 'Naval Supremacy', summary: 'Dominate seas with a balanced fleet.',
    reason: 'Spreads investment across capital ships and escorts so the fleet has both damage and coverage.',
    entries: [
      ['Ships - Battleships and Carriers', '20% Attack', 2], ['Ships - Battleships and Carriers', '20% Range', 2],
      ['Ships - Frigates and Cruisers', '20% Attack', 2], ['Ships - Frigates and Cruisers', '20% Speed', 1],
      ['Ships - Galleys, Transports and Subs', '25% Hit Points', 1],
    ],
  },
  {
    id: 'air', name: 'Air Power', summary: 'Strike quickly with fighters, bombers, and helicopters.',
    reason: 'Improves multiple aircraft roles so one counter does not invalidate the entire investment.',
    entries: [
      ['Aircraft - Fighters', '20% Attack', 2], ['Aircraft - Fighters', '20% Speed', 1],
      ['Aircraft - Bombers', '20% Area Damage', 2], ['Aircraft - Bombers', '20% Attack', 1],
      ['Aircraft - Helicopters', '20% Attack', 2],
    ],
  },
  {
    id: 'cyber', name: 'Cyber Future', summary: 'Build a specialized Nano-age combat force.',
    reason: 'Combat Cyber bonuses carry the damage plan while Ultra durability protects expensive units.',
    entries: [
      ['Cybers - Combat', '20% Attack', 3], ['Cybers - Combat', '20% Range', 2],
      ['Cybers - Ultra', '25% Hit Points', 2], ['Cybers - Ultra', '20% Armor', 1],
    ],
  },
  {
    id: 'dawn', name: 'Dawn Age Momentum', summary: 'Accelerate the opening economy and field swordsmen early.',
    reason: 'Combines food, wood, and durable workers with inexpensive early infantry pressure for a flexible opening.',
    entries: [
      ['Civ - Economy', '20% Farming', 1], ['Civ - Economy', '20% Hunting and Foraging', 1],
      ['Civ - Economy', '15% Wood Cutting', 1], ['Citizens and Fishing Boats', '30% Hit Points', 2],
      ['Citizens and Fishing Boats', '20% Speed', 1], ['Infantry - Sword', '25% Attack', 2],
      ['Infantry - Sword', '30% Build Time Decrease', 2],
    ],
  },
  {
    id: 'harvest', name: 'Fast Start Harvesters', summary: 'Gather opening food and wood at maximum tempo.',
    reason: 'Prioritizes the resources that decide early settlement growth, housing, farms, and first military production.',
    entries: [
      ['Civ - Economy', '20% Hunting and Foraging', 2], ['Civ - Economy', '15% Wood Cutting', 2],
      ['Citizens and Fishing Boats', '20% Speed', 1],
    ],
  },
  {
    id: 'stonewall', name: 'Stonewall Fortress', summary: 'Build cheaper walls and make them brutally hard to destroy.',
    reason: 'Triple structure durability creates the hard shell; lower cost and faster construction make the defense practical.',
    entries: [
      ['Civ - Buildings, Walls and Towers', '50% Hit Points', 3],
      ['Civ - Buildings, Walls and Towers', '15% Cost Reduction', 1],
      ['Civ - Buildings, Walls and Towers', '30% Build Time Decrease', 1],
    ],
  },
  {
    id: 'rapid_build', name: 'Rapid Construction', summary: 'Raise settlements, towers, and production lines quickly.',
    reason: 'Fast and cheaper structures shorten vulnerable build windows while worker construction speed supports expansion.',
    entries: [
      ['Civ - Buildings, Walls and Towers', '30% Build Time Decrease', 3],
      ['Civ - Buildings, Walls and Towers', '15% Cost Reduction', 2],
      ['Citizens and Fishing Boats', '10% Build Time Decrease', 1], ['Civ - Economy', '15% Wood Cutting', 1],
    ],
  },
  {
    id: 'spear_wall', name: 'Spear Wall Defense', summary: 'Stop early cavalry and hold narrow approaches.',
    reason: 'Layered armor and health create a resilient frontline, while faster training replaces losses before the defense collapses.',
    entries: [
      ['Infantry - Spear (Melee)', '20% Armor', 3], ['Infantry - Spear (Melee)', '20% Hit Points', 2],
      ['Infantry - Spear (Melee)', '30% Build Time Decrease', 2],
    ],
  },
  {
    id: 'cheap_legion', name: 'Mass Army', summary: 'Overwhelm opponents with affordable, fast-produced swordsmen.',
    reason: 'Cost and training bonuses sustain continuous production, with attack and durability keeping each unit relevant.',
    entries: [
      ['Infantry - Sword', '20% Cost Reduction', 2], ['Infantry - Sword', '30% Build Time Decrease', 2],
      ['Infantry - Sword', '25% Attack', 2], ['Infantry - Sword', '20% Hit Points', 1],
    ],
  },
  {
    id: 'siege', name: 'Siege Breaker', summary: 'Destroy packed armies and fortified positions.',
    reason: 'Area damage and rate of fire punish dense formations; attack and range let siege units work from safer ground.',
    entries: [
      ['Siege Weapons and Mobile AA', '20% Area Damage', 2], ['Siege Weapons and Mobile AA', '25% Rate of Fire', 2],
      ['Siege Weapons and Mobile AA', '25% Attack', 2], ['Siege Weapons and Mobile AA', '20% Range', 2],
    ],
  },
  {
    id: 'holy_guard', name: 'Holy Guard', summary: 'Support a defensive army with durable, mobile priests.',
    reason: 'Extra range keeps priests behind the line, while health and speed improve survival during retreats and counterattacks.',
    entries: [
      ['Religion - Priests', '20% Range', 3], ['Religion - Priests', '20% Hit Points', 3],
      ['Religion - Priests', '20% Speed', 2], ['Religion - Priests', '20% Cost Reduction', 1],
    ],
  },
  {
    id: 'mountain', name: 'Mountain Stronghold', summary: 'Turn difficult terrain into a fortified killing ground.',
    reason: 'Exceptional structure durability and range combine with the mountain combat bonus for terrain-led defense.',
    entries: [
      ['Civ - General', '20% Mountain Combat Bonus', 1],
      ['Civ - Buildings, Walls and Towers', '50% Hit Points', 3],
      ['Civ - Buildings, Walls and Towers', '20% Range', 2],
      ['Civ - Buildings, Walls and Towers', '30% Build Time Decrease', 1],
    ],
  },
  {
    id: 'militia', name: 'Citizen Militia', summary: 'Make raids costly and keep workers alive under pressure.',
    reason: 'Attack and range let citizens fight back, while extreme durability and conversion resistance protect the economy.',
    entries: [
      ['Citizens and Fishing Boats', '30% Attack', 3], ['Citizens and Fishing Boats', '35% Range', 3],
      ['Citizens and Fishing Boats', '30% Hit Points', 3], ['Civ - General', '50% Conversion Resistance', 1],
    ],
  },
];

const FR_CATEGORIES = {
  'Special Powers': 'Pouvoirs spéciaux', 'Aircraft - Bombers': 'Aviation – Bombardiers',
  'Aircraft - Fighters': 'Aviation – Chasseurs', 'Aircraft - Helicopters': 'Aviation – Hélicoptères',
  'Archers - Foot': 'Archers à pied', 'Cavalry - Ranged': 'Cavalerie à distance',
  'Cavalry - Spear (Melee)': 'Cavalerie – Lance', 'Cavalry - Sword': 'Cavalerie – Épée',
  'Citizens and Fishing Boats': 'Citoyens et bateaux de pêche',
  'Civ - Buildings, Walls and Towers': 'Civ – Bâtiments, murs et tours', 'Civ - Economy': 'Civ – Économie',
  'Civ - General': 'Civ – Général', 'Cybers - Combat': 'Cybers – Combat', 'Cybers - Ultra': 'Cybers – Ultra',
  'Field Cannon and Anti-Tank Guns': 'Canons de campagne et antichars', 'Infantry - Ranged': 'Infanterie à distance',
  'Infantry - Spear (Melee)': 'Infanterie – Lance', 'Infantry - Sword': 'Infanterie – Épée',
  'Religion - Priests': 'Religion – Prêtres', 'Religion - Prophets': 'Religion – Prophètes',
  'Ships - Battleships and Carriers': 'Navires – Cuirassés et porte-avions',
  'Ships - Frigates and Cruisers': 'Navires – Frégates et croiseurs',
  'Ships - Galleys, Transports and Subs': 'Navires – Galères, transports et sous-marins',
  'Siege Weapons and Mobile AA': 'Armes de siège et DCA mobile', 'Space Fighters': 'Chasseurs spatiaux',
  Spaceships: 'Vaisseaux spatiaux', Tanks: 'Chars',
};

const UI = {
  en: {
    editor: 'Civilization Editor', import: 'Import', undo: 'Undo', redo: 'Redo', builder: 'Builder', advisor: 'Advisor',
    autosaved: 'Autosaved', saving: 'Saving…', search: 'Search bonuses…', categories: 'Categories', exactStacking: 'Exact stacking',
    stackingHelp: 'Every selection in a category raises the next selection by that category’s surcharge.', categorySurcharge: 'Category surcharge',
    priorSelection: 'per prior selection', bonus: 'Bonus', base: 'Base', copies: 'Copies', nextCopy: 'Next copy', civDetails: 'Civilization details',
    civName: 'Civilization name', remaining: 'remaining', entries: 'bonus entries', selected: 'Selected bonuses', marginal: 'marginal costs',
    empty: 'Choose bonuses or apply an Advisor preset.', valid: 'Valid civilization', over: 'Over budget', within: 'Within the 100-point limit.',
    remove: 'Remove bonuses before export.', download: 'Download .civ', clear: 'Clear all selections', strategyPresets: 'Strategy presets',
    bonusPlan: 'Bonus plan', points: 'points', why: 'Why this works', apply: 'Apply preset to builder', analysis: 'Advisor analysis',
    efficiency: 'Efficiency analysis', smartValidation: 'Smart validation', recommendations: 'Recommendation notes', drafts: 'Named drafts',
    draftName: 'Draft name', save: 'Save', loadDraft: 'Load a saved draft…', excellent: 'Excellent', good: 'Good', expensive: 'Expensive',
    noAnalysis: 'Apply a preset or build a civilization to analyze it.', noRecommendation: 'Select a preset to see why each bonus earns its place.',
  },
  fr: {
    editor: 'Éditeur de civilisation', import: 'Importer', undo: 'Annuler', redo: 'Rétablir', builder: 'Création', advisor: 'Conseiller',
    autosaved: 'Sauvegardé', saving: 'Sauvegarde…', search: 'Rechercher des bonus…', categories: 'Catégories', exactStacking: 'Cumul exact',
    stackingHelp: 'Chaque choix dans une catégorie augmente le coût du choix suivant selon le supplément de cette catégorie.', categorySurcharge: 'Supplément de catégorie',
    priorSelection: 'par choix antérieur', bonus: 'Bonus', base: 'Base', copies: 'Copies', nextCopy: 'Prochaine copie', civDetails: 'Détails de la civilisation',
    civName: 'Nom de la civilisation', remaining: 'restants', entries: 'entrées de bonus', selected: 'Bonus sélectionnés', marginal: 'coûts marginaux',
    empty: 'Choisissez des bonus ou appliquez une stratégie du Conseiller.', valid: 'Civilisation valide', over: 'Budget dépassé', within: 'Dans la limite de 100 points.',
    remove: 'Retirez des bonus avant l’exportation.', download: 'Télécharger .civ', clear: 'Effacer tous les choix', strategyPresets: 'Stratégies prédéfinies',
    bonusPlan: 'Plan de bonus', points: 'points', why: 'Pourquoi cela fonctionne', apply: 'Appliquer au créateur', analysis: 'Analyse du conseiller',
    efficiency: 'Analyse d’efficacité', smartValidation: 'Validation intelligente', recommendations: 'Notes de recommandation', drafts: 'Brouillons nommés',
    draftName: 'Nom du brouillon', save: 'Sauvegarder', loadDraft: 'Charger un brouillon…', excellent: 'Excellent', good: 'Bon', expensive: 'Coûteux',
    noAnalysis: 'Appliquez une stratégie ou créez une civilisation pour l’analyser.', noRecommendation: 'Sélectionnez une stratégie pour comprendre chaque bonus.',
  },
};

const FR_PRESETS = {
  economy: ['Essor économique', 'Dépassez vos adversaires grâce à une croissance durable.', 'Privilégie les ressources utiles tout en conservant des points pour la population et la résistance des citoyens.'],
  infantry: ['Ruée d’infanterie', 'Remportez les premiers combats avec une armée rapide et robuste.', 'L’attaque et la production accélèrent la pression immédiate; la vitesse facilite les renforts.'],
  archer: ['Commandement des archers', 'Contrôlez le champ de bataille à distance.', 'La portée améliore le positionnement; l’attaque et la vitesse renforcent le tir concentré.'],
  tanks: ['Guerre blindée', 'Écrasez vos adversaires avec des chars puissants.', 'Équilibre attaque, portée, armure et production au lieu de surpayer un seul cumul.'],
  naval: ['Suprématie navale', 'Dominez les mers avec une flotte équilibrée.', 'Répartit les points entre navires principaux et escorte pour combiner dégâts et couverture.'],
  air: ['Puissance aérienne', 'Frappez rapidement avec chasseurs, bombardiers et hélicoptères.', 'Améliore plusieurs rôles aériens afin qu’un seul contre ne neutralise pas toute la stratégie.'],
  cyber: ['Futur cybernétique', 'Déployez une force spécialisée de l’Âge Nano.', 'Les Cybers de combat fournissent les dégâts tandis que les Ultras protègent les unités coûteuses.'],
  dawn: ['Élan de l’âge initial', 'Accélérez l’économie et déployez rapidement des épéistes.', 'Combine nourriture, bois et citoyens robustes avec une pression militaire flexible en début de partie.'],
  harvest: ['Récolteurs rapides', 'Récoltez nourriture et bois à un rythme maximal dès le départ.', 'Privilégie les ressources essentielles aux premières colonies, fermes et productions militaires.'],
  stonewall: ['Forteresse imprenable', 'Construisez des murs moins chers et extrêmement difficiles à détruire.', 'La durabilité triplée forme une coque solide; le coût et la construction améliorés la rendent pratique.'],
  rapid_build: ['Construction rapide', 'Érigez rapidement colonies, tours et centres de production.', 'Des bâtiments rapides et moins chers réduisent leur vulnérabilité pendant la construction.'],
  spear_wall: ['Mur de lanciers', 'Bloquez la cavalerie et tenez les passages étroits.', 'Armure et santé forment une ligne robuste tandis que l’entraînement rapide remplace les pertes.'],
  cheap_legion: ['Armée de masse', 'Submergez l’adversaire avec des épéistes abordables.', 'La réduction du coût et du temps de production maintient une production continue et efficace.'],
  siege: ['Briseur de siège', 'Détruisez les armées regroupées et les positions fortifiées.', 'Les dégâts de zone, la cadence, l’attaque et la portée rendent l’artillerie plus dangereuse.'],
  holy_guard: ['Garde sacrée', 'Soutenez une armée défensive avec des prêtres résistants.', 'La portée protège les prêtres derrière la ligne; santé et vitesse facilitent leur survie.'],
  mountain: ['Bastion montagneux', 'Transformez le terrain difficile en zone fortifiée.', 'La durabilité et la portée des structures se combinent au bonus de combat en montagne.'],
  militia: ['Milice citoyenne', 'Rendez les raids coûteux et protégez vos travailleurs.', 'Attaque, portée, durabilité et résistance à la conversion protègent durablement l’économie.'],
};

function categoryName(name, lang) { return lang === 'fr' ? FR_CATEGORIES[name] || name : name; }

function bonusName(name, lang) {
  if (lang !== 'fr') return name;
  const replacements = [
    ['Area Damage', 'Dégâts de zone'], ['Build Time Decrease', 'Réduction du temps de production'],
    ['Conversion Resistance', 'Résistance à la conversion'], ['Mountain Combat Bonus', 'Bonus de combat en montagne'],
    ['Population Cap', 'Limite de population'], ['Cost Reduction', 'Réduction du coût'], ['Rate of Fire', 'Cadence de tir'],
    ['Flight Time', 'Autonomie de vol'], ['Hit Points', 'Points de vie'], ['Gold Mining', 'Extraction d’or'],
    ['Iron Mining', 'Extraction de fer'], ['Stone Mining', 'Extraction de pierre'], ['Wood Cutting', 'Coupe du bois'],
    ['Hunting and Foraging', 'Chasse et cueillette'], ['Farming', 'Agriculture'], ['Fishing', 'Pêche'],
    ['Attack', 'Attaque'], ['Armor', 'Armure'], ['Range', 'Portée'], ['Speed', 'Vitesse'],
  ];
  return replacements.reduce((text, [from, to]) => text.replace(from, to), name);
}

function presetCopy(preset, lang) {
  if (lang !== 'fr') return preset;
  const [name, summary, reason] = FR_PRESETS[preset.id];
  return { ...preset, name, summary, reason };
}

function categoryCost(category, selected) {
  return sum(selected.map((bonus, index) => bonus.costs + index * category.category_cost));
}

function allSelected(selected) { return Object.values(selected).flat(); }

function totalCost(data, selected) {
  return sum(Object.entries(selected).map(([key, bonuses]) => categoryCost(data.categories[key], bonuses)));
}

function groupBonuses(bonuses) {
  return [...new Map(bonuses.map(bonus => [bonus.hexcode, bonus])).values()];
}

function makeCivBlob(name, selected) {
  const bonuses = allSelected(selected);
  const bytes = new Uint8Array(4 + name.length + 4 + bonuses.length * 4);
  bytes[0] = name.length;
  let position = 4;
  for (const character of name) bytes[position++] = character.charCodeAt(0);
  bytes[position] = bonuses.length;
  position += 4;
  for (const bonus of bonuses) {
    bytes[position++] = Number.parseInt(bonus.hexcode.slice(0, 2), 16);
    bytes[position++] = Number.parseInt(bonus.hexcode.slice(2, 4), 16);
    position += 2;
  }
  return new Blob([bytes], { type: 'application/octet-stream' });
}

function parseCiv(buffer, data) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8) throw new Error('File is too short to be an Empire Earth civilization.');
  const nameLength = bytes[0];
  const countOffset = 4 + nameLength;
  if (countOffset + 4 > bytes.length) throw new Error('Civilization name extends beyond the file.');
  const name = String.fromCharCode(...bytes.slice(4, countOffset));
  const count = bytes[countOffset];
  if (countOffset + 4 + count * 4 > bytes.length) throw new Error('Bonus count does not match the file length.');
  const lookup = new Map();
  for (const [categoryName, category] of Object.entries(data.categories)) {
    for (const bonus of category.bonuses) lookup.set(bonus.hexcode.toUpperCase(), { categoryName, bonus });
  }
  const selected = {};
  const unknown = [];
  let position = countOffset + 4;
  for (let index = 0; index < count; index++, position += 4) {
    const hex = bytes[position].toString(16).padStart(2, '0') + bytes[position + 1].toString(16).padStart(2, '0');
    const match = lookup.get(hex.toUpperCase());
    if (!match) unknown.push(hex.toUpperCase());
    else (selected[match.categoryName] ||= []).push(match.bonus);
  }
  return { name, selected, unknown };
}

function hydratePreset(data, preset, game) {
  const selected = {};
  for (const [categoryName, bonusName, copies] of preset.entries) {
    if (!data[game].includes(categoryName)) continue;
    const bonus = data.categories[categoryName].bonuses.find(item => item.name === bonusName);
    if (bonus) selected[categoryName] = [...(selected[categoryName] || []), ...Array(copies).fill(bonus)];
  }
  return selected;
}

const PRESET_GROUPS = {
  economy: 'economy', harvest: 'opening', dawn: 'opening', infantry: 'offense', archer: 'offense', tanks: 'offense',
  naval: 'offense', air: 'offense', cyber: 'offense', stonewall: 'defense', rapid_build: 'construction',
  spear_wall: 'defense', cheap_legion: 'offense', siege: 'siege', holy_guard: 'religion', mountain: 'defense', militia: 'defense',
};

const STRATEGY_SOURCE = {
  economy: 'economy', offense: 'infantry', defense: 'stonewall', construction: 'rapid_build', siege: 'siege', religion: 'holy_guard',
};

const MODE_SOURCE = { random: 'economy', deathmatch: 'cheap_legion', islands: 'naval', team: 'economy', duel: 'dawn', defense: 'stonewall' };
const PHASE_SOURCE = { early: 'dawn', mid: 'infantry', late: 'tanks' };

function buildGeneratedSelection(data, game, settings) {
  const sourceIds = [STRATEGY_SOURCE[settings.focus], MODE_SOURCE[settings.gameMode], PHASE_SOURCE[settings.phase]];
  if (settings.defense >= 65) sourceIds.unshift('stonewall');
  if (settings.balance <= 35) sourceIds.unshift('economy');
  if (settings.balance >= 65) sourceIds.unshift('cheap_legion');
  if (settings.timeline >= 70) sourceIds.unshift(game === 'aoc' ? 'cyber' : 'tanks');
  const candidates = sourceIds.flatMap(id => {
    const preset = PRESETS.find(item => item.id === id);
    return preset ? preset.entries.flatMap(([category, bonus, copies]) => Array.from({ length: copies }, () => [category, bonus])) : [];
  });
  const selected = {};
  for (const [categoryName, wantedBonus] of candidates) {
    if (!data[game].includes(categoryName)) continue;
    const category = data.categories[categoryName];
    const bonus = category.bonuses.find(item => item.name === wantedBonus);
    if (!bonus) continue;
    const list = selected[categoryName] || [];
    const nextCost = bonus.costs + list.length * category.category_cost;
    if (totalCost(data, selected) + nextCost <= CAP) selected[categoryName] = [...list, bonus];
  }
  return selected;
}

function fillUnusedPoints(data, game, current) {
  const selected = Object.fromEntries(Object.entries(current).map(([key, bonuses]) => [key, [...bonuses]]));
  let changed = true;
  while (changed) {
    changed = false;
    let best = null;
    for (const categoryName of data[game]) {
      const category = data.categories[categoryName];
      const count = (selected[categoryName] || []).length;
      for (const bonus of category.bonuses) {
        const cost = bonus.costs + count * category.category_cost;
        if (totalCost(data, selected) + cost <= CAP && (!best || cost < best.cost)) best = { categoryName, bonus, cost };
      }
    }
    if (best) {
      selected[best.categoryName] = [...(selected[best.categoryName] || []), best.bonus];
      changed = true;
    }
    if (allSelected(selected).length >= 40) break;
  }
  return selected;
}

function selectionSummary(data, selected) {
  const costs = Object.entries(selected).map(([key, bonuses]) => ({ key, cost: categoryCost(data.categories[key], bonuses) }));
  costs.sort((a, b) => b.cost - a.cost);
  return { total: totalCost(data, selected), entries: allSelected(selected).length, categories: costs.length, dominant: costs[0]?.key || '—' };
}

function efficiencyLabel(category, bonus, positions) {
  const costs = positions.map(index => bonus.costs + index * category.category_cost);
  const average = sum(costs) / costs.length;
  const ratio = average / Math.max(1, bonus.costs);
  if (ratio <= 1.6) return { key: 'excellent', tone: 'excellent' };
  if (ratio <= 2.4) return { key: 'good', tone: 'good' };
  return { key: 'expensive', tone: 'expensive' };
}

function buildValidation(data, selected, total, game, lang) {
  const results = [];
  const fr = lang === 'fr';
  if (!allSelected(selected).length) results.push({ tone: 'warn', text: fr ? 'Aucun bonus sélectionné.' : 'No bonuses selected yet.' });
  else results.push({ tone: 'ok', text: fr ? `${allSelected(selected).length} entrées de bonus valides.` : `${allSelected(selected).length} valid bonus entries selected.` });
  results.push(total <= CAP
    ? { tone: 'ok', text: fr ? `Budget respecté : ${CAP - total} points restants.` : `Total is within budget with ${CAP - total} points remaining.` }
    : { tone: 'error', text: fr ? `La limite est dépassée de ${total - CAP} points.` : `Build exceeds the limit by ${total - CAP} points.` });
  for (const [key, bonuses] of Object.entries(selected)) {
    if (!data[game].includes(key)) results.push({ tone: 'error', text: fr ? `${categoryName(key, lang)} n’est pas disponible dans cette version.` : `${key} is unavailable in this game version.` });
    const category = data.categories[key];
    for (const bonus of groupBonuses(bonuses)) {
      const copies = bonuses.filter(item => item.hexcode === bonus.hexcode).length;
      if (copies >= 4) results.push({ tone: 'warn', text: fr ? `${bonusName(bonus.name, lang)} ×${copies} a un supplément marginal élevé.` : `${bonus.name} ×${copies} has a high marginal surcharge.` });
      if (bonus.epochs !== '?' && bonus.epochs !== 'all') results.push({ tone: 'note', text: fr ? `${bonusName(bonus.name, lang)} s’applique aux époques ${bonus.epochs}.` : `${bonus.name} applies in epochs ${bonus.epochs}.` });
    }
    if (categoryCost(category, bonuses) >= 55) results.push({ tone: 'warn', text: fr ? `${categoryName(key, lang)} consomme plus de la moitié du budget.` : `${key} consumes over half of the entire budget.` });
  }
  return results.slice(0, 7);
}

function recommendationFor(category, bonus, lang) {
  const name = bonus.name.toLowerCase();
  if (lang === 'fr') {
    if (name.includes('attack')) return `L’attaque renforce les dégâts principaux de ${categoryName(category, lang)}.`;
    if (name.includes('range')) return 'La portée contrôle les engagements et réduit les dégâts subis.';
    if (name.includes('build time')) return 'Une production plus rapide transforme les ressources en pression plus tôt.';
    if (name.includes('cost reduction')) return 'La réduction du coût est surtout rentable dans les longues parties.';
    if (name.includes('hit points') || name.includes('armor')) return 'La durabilité protège l’investissement et améliore la résistance.';
    if (name.includes('speed')) return 'La vitesse facilite les renforts, le positionnement et la retraite.';
    if (category === 'Civ - Economy') return 'L’accélération économique produit un avantage cumulatif.';
    return `Ce bonus renforce la stratégie ${categoryName(category, lang)}.`;
  }
  if (name.includes('attack')) return `Attack supports the primary damage plan for ${category}.`;
  if (name.includes('range')) return 'Range improves engagement control and reduces return damage.';
  if (name.includes('build time')) return 'Faster production converts resources into pressure sooner.';
  if (name.includes('cost reduction')) return 'Cost reduction pays off most in long, production-heavy games.';
  if (name.includes('hit points') || name.includes('armor')) return 'Durability protects the investment and improves staying power.';
  if (name.includes('speed')) return 'Speed improves reinforcement, positioning, and retreat options.';
  if (category === 'Civ - Economy') return 'Economic acceleration compounds across the remainder of the match.';
  return `This bonus reinforces the selected ${category} strategy.`;
}

function loadStored() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.version === 2 ? saved : null;
  } catch { return null; }
}

function Header({ game, setGame, mode, setMode, undo, redo, clearCurrent, canClear, canUndo, canRedo, fileInput, importFile, autosaved, lang, setLang }) {
  const text = UI[lang];
  return <>
    <header className="topbar">
      <div className="brand"><div className="crest">EF</div><div><h1>Empire Forge</h1><span>{text.editor}</span></div></div>
      <div className="game-switch" aria-label="Game version">
        <button className={game === 'ee' ? 'active' : ''} onClick={() => setGame('ee')}>Empire Earth</button>
        <button className={game === 'aoc' ? 'active' : ''} onClick={() => setGame('aoc')}>Art of Conquest</button>
      </div>
      <div className="actions">
        <input ref={fileInput} type="file" accept=".civ" hidden onChange={importFile} />
        <div className="language-switch"><button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button><button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button></div>
        <button onClick={() => fileInput.current.click()}><FileUp size={17}/> {text.import}</button>
        <button disabled={!canUndo} onClick={undo}><Undo2 size={17}/> {text.undo}</button>
        <button disabled={!canRedo} onClick={redo}><Redo2 size={17}/> {text.redo}</button>
        <button className="header-clear" disabled={!canClear} onClick={clearCurrent}><Trash2 size={17}/> {text.clear}</button>
      </div>
    </header>
    <div className="modebar">
      <div><button className={mode === 'builder' ? 'active' : ''} onClick={() => setMode('builder')}>{text.builder}</button><button className={mode === 'advisor' ? 'active' : ''} onClick={() => setMode('advisor')}>{text.advisor}</button></div>
      <span><CheckCircle2 size={14}/> {autosaved ? text.autosaved : text.saving}</span>
    </div>
  </>;
}

function BudgetRing({ total, entries, lang }) {
  const text = UI[lang];
  return <div className="budget"><div className="budget-ring" style={{ '--fill': `${Math.min(total, 100) * 3.6}deg` }}><div><strong>{total}</strong><span>/ 100</span></div></div><div><b>{CAP - total} {text.remaining}</b><span>{entries} {text.entries}</span></div></div>;
}

function CompactPlan({ data, selected, lang }) {
  const total = totalCost(data, selected);
  return <div className="compact-plan">
    <div className="plan-title"><h3>{lang === 'fr' ? 'Plan de bonus' : 'Bonus plan'}</h3><b>{total} / 100</b></div>
    <div className="plan-table">{Object.entries(selected).map(([key, bonuses]) => <div className="plan-category" key={key}><div><strong>{categoryName(key, lang)}</strong><b>{categoryCost(data.categories[key], bonuses)} pts</b></div>{groupBonuses(bonuses).map(bonus => {
      const positions = bonuses.map((item, index) => item.hexcode === bonus.hexcode ? index : -1).filter(index => index >= 0);
      const costs = positions.map(index => bonus.costs + index * data.categories[key].category_cost);
      return <p key={bonus.hexcode}><span>{bonusName(bonus.name, lang)}</span><span>×{positions.length}</span><em>{costs.join(' + ')} = {sum(costs)}</em></p>;
    })}</div>)}</div>
  </div>;
}

function MiniAnalysis({ data, selected, game, lang }) {
  const total = totalCost(data, selected);
  const validation = buildValidation(data, selected, total, game, lang);
  return <div className="mini-analysis">
    <BudgetRing total={total} entries={allSelected(selected).length} lang={lang}/>
    <section className="analysis-section"><h3><Gauge size={16}/> {lang === 'fr' ? 'Analyse d’efficacité' : 'Efficiency analysis'}</h3>{Object.entries(selected).flatMap(([key, bonuses]) => groupBonuses(bonuses).map(bonus => {
      const positions = bonuses.map((item, index) => item.hexcode === bonus.hexcode ? index : -1).filter(index => index >= 0);
      const rating = efficiencyLabel(data.categories[key], bonus, positions);
      const labels = lang === 'fr' ? { excellent: 'Excellent', good: 'Bon', expensive: 'Coûteux' } : { excellent: 'Excellent', good: 'Good', expensive: 'Expensive' };
      return <div className="analysis-row" key={`${key}-${bonus.hexcode}`}><span>{bonusName(bonus.name, lang)} ×{positions.length}</span><b className={rating.tone}>{labels[rating.key]}</b></div>;
    })).slice(0, 6)}</section>
    <section className="analysis-section"><h3><ShieldCheck size={16}/> {lang === 'fr' ? 'Validation intelligente' : 'Smart validation'}</h3>{validation.map((item, index) => <div className={`validation-row ${item.tone}`} key={`${item.text}-${index}`}>{item.tone === 'ok' ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}<span>{item.text}</span></div>)}</section>
  </div>;
}

function ControlChoices({ title, options, value, onChange }) {
  return <fieldset className="control-choices"><legend>{title}</legend>{options.map(([key, label]) => <button type="button" key={key} className={value === key ? 'active' : ''} onClick={() => onChange(key)}>{label}</button>)}</fieldset>;
}

function RangeControl({ label, value, onChange, min = 0, max = 100 }) {
  return <label className="range-control"><span>{label}<b>{value}</b></span><input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))}/></label>;
}

function ToolNav({ tool, setTool, lang }) {
  const labels = { presets: lang === 'fr' ? 'Stratégies' : 'Presets', generator: lang === 'fr' ? 'Générateur' : 'Generator', compare: lang === 'fr' ? 'Comparer' : 'Compare', optimize: lang === 'fr' ? 'Optimiser' : 'Optimize', walls: lang === 'fr' ? 'Laboratoire des murs' : 'Wall Lab' };
  return <nav className="suite-tabs">{Object.entries(labels).map(([key, label]) => <button key={key} className={tool === key ? 'active' : ''} onClick={() => setTool(key)}>{label}</button>)}</nav>;
}

function StrategyTools({ data, game, lang, tool, setTool, showNav = true, generator, setGenerator, generatedPreview, compareIds, setCompareIds, optimizedSelected, selected, wallSettings, setWallSettings, wallSelected, applyStrategy, commitSelected }) {
  const bi = (en, fr) => lang === 'fr' ? fr : en;
  const comparePlans = compareIds.map(id => { const preset = PRESETS.find(item => item.id === id) || PRESETS[0]; const plan = hydratePreset(data, preset, game); return { preset: presetCopy(preset, lang), plan, summary: selectionSummary(data, plan) }; });
  const modes = [['random', bi('Random Map', 'Carte aléatoire')], ['deathmatch', 'Deathmatch'], ['islands', bi('Islands', 'Îles')], ['team', bi('Team Game', 'Partie en équipe')], ['duel', '1v1'], ['defense', bi('Long Defense', 'Défense longue')]];
  const focuses = [['economy', bi('Economy', 'Économie')], ['offense', bi('Offense', 'Attaque')], ['defense', bi('Defense', 'Défense')], ['construction', 'Construction'], ['siege', bi('Siege', 'Siège')], ['religion', 'Religion']];
  const toolPlan = tool === 'generator' ? generatedPreview : wallSelected;
  return <>{showNav ? <ToolNav tool={tool} setTool={setTool} lang={lang}/> : null}
    {tool === 'generator' && <div className="tool-grid"><aside className="tool-controls"><h2>{bi('Custom Strategy Generator', 'Générateur de stratégie')}</h2><ControlChoices title={bi('Game mode', 'Mode de jeu')} options={modes} value={generator.gameMode} onChange={value => setGenerator(current => ({ ...current, gameMode: value }))}/><ControlChoices title={bi('Phase', 'Phase')} options={[["early", bi('Early', 'Début')], ["mid", bi('Mid', 'Milieu')], ["late", bi('Late', 'Fin')]]} value={generator.phase} onChange={value => setGenerator(current => ({ ...current, phase: value }))}/><ControlChoices title={bi('Primary focus', 'Priorité')} options={focuses} value={generator.focus} onChange={value => setGenerator(current => ({ ...current, focus: value }))}/><RangeControl label={bi('Economy ↔ Military', 'Économie ↔ Militaire')} value={generator.balance} onChange={value => setGenerator(current => ({ ...current, balance: value }))}/><RangeControl label={bi('Early ↔ Late', 'Début ↔ Fin')} value={generator.timeline} onChange={value => setGenerator(current => ({ ...current, timeline: value }))}/><RangeControl label={bi('Defense level', 'Niveau de défense')} value={generator.defense} onChange={value => setGenerator(current => ({ ...current, defense: value }))}/></aside><section className="tool-plan"><div className="advisor-heading"><Sparkles size={25}/><div><h2>{bi('Generated Civilization', 'Civilisation générée')}</h2><p>{bi('Built from your mode, phase, focus, and sliders.', 'Créée selon votre mode, phase, priorité et vos curseurs.')}</p></div></div><CompactPlan data={data} selected={toolPlan} lang={lang}/><button className="apply-preset" onClick={() => applyStrategy(toolPlan, bi('Custom Strategy', 'Stratégie personnalisée'))}>{bi('Apply to builder', 'Appliquer au créateur')}</button></section><aside className="advisor-inspector"><h2>{bi('Analysis', 'Analyse')}</h2><MiniAnalysis data={data} selected={toolPlan} game={game} lang={lang}/></aside></div>}
    {tool === 'compare' && <div className="comparison-view"><div className="compare-header"><div><h2>{bi('Compare Strategies', 'Comparer les stratégies')}</h2><p>{bi('Compare costs, breadth, and dominant investment.', 'Comparez les coûts, la diversité et l’investissement dominant.')}</p></div>{compareIds.map((id, index) => <select key={index} value={id} onChange={event => setCompareIds(current => current.map((value, i) => i === index ? event.target.value : value))}>{PRESETS.map(item => <option key={item.id} value={item.id}>{presetCopy(item, lang).name}</option>)}</select>)}</div><div className="compare-columns">{comparePlans.map(({ preset, plan, summary }) => <article className="compare-card" key={preset.id}><h2>{preset.name}</h2><p>{preset.summary}</p><div className="compare-metrics"><b>{summary.total}<small>/100</small></b><span>{summary.entries} {bi('entries', 'bonus')}<br/>{summary.categories} {bi('categories', 'catégories')}</span></div><dl><div><dt>{bi('Dominant investment', 'Investissement principal')}</dt><dd>{categoryName(summary.dominant, lang)}</dd></div><div><dt>{bi('Remaining points', 'Points restants')}</dt><dd>{100 - summary.total}</dd></div></dl><CompactPlan data={data} selected={plan} lang={lang}/><button className="apply-preset" onClick={() => applyStrategy(plan, preset.name)}>{bi('Apply preset', 'Appliquer')}</button></article>)}</div></div>}
    {tool === 'optimize' && <div className="optimize-view"><header><h2>{bi('Optimize My Civilization', 'Optimiser ma civilisation')}</h2><p>{bi('Fills unused points with the lowest marginal-cost valid bonuses. Undo restores your original build.', 'Utilise les points restants avec les bonus valides au coût marginal le plus faible. Annuler restaure votre création.')}</p></header><div className="compare-columns"><article className="compare-card"><h2>{bi('Current build', 'Création actuelle')}</h2><CompactPlan data={data} selected={selected} lang={lang}/></article><article className="compare-card optimized"><h2>{bi('Optimized build', 'Création optimisée')}</h2><CompactPlan data={data} selected={optimizedSelected} lang={lang}/><button className="apply-preset" disabled={!allSelected(selected).length} onClick={() => commitSelected(optimizedSelected)}>{bi('Apply optimization', 'Appliquer l’optimisation')}</button></article></div></div>}
    {tool === 'walls' && <div className="tool-grid wall-lab"><aside className="tool-controls"><h2>{bi('Wall Defense Calculator', 'Calculateur de défense')}</h2>{[['hp', '50% Hit Points', '50% Points de vie'], ['cost', '15% Cost Reduction', '15% Réduction du coût'], ['build', '30% Build Time Decrease', '30% Construction accélérée'], ['attack', '20% Attack', '20% Attaque'], ['range', '20% Range', '20% Portée']].map(([key, en, fr]) => <RangeControl key={key} label={bi(en, fr)} value={wallSettings[key]} min={0} max={5} onChange={value => setWallSettings(current => ({ ...current, [key]: value }))}/>)}</aside><section className="tool-plan"><div className="advisor-heading"><ShieldCheck size={25}/><div><h2>{bi('Fortification Plan', 'Plan de fortification')}</h2><p>{bi('Exact point cost with category surcharges in displayed order.', 'Coût exact avec les suppléments de catégorie dans l’ordre affiché.')}</p></div></div><div className="wall-stats"><div><b>{1 + wallSettings.hp * .5}×</b><span>{bi('listed structure health', 'points de vie indiqués')}</span></div><div><b>{wallSettings.cost * 15}%</b><span>{bi('listed cost reduction', 'réduction indiquée')}</span></div><div><b>{totalCost(data, wallSelected)}</b><span>{bi('civilization points', 'points de civilisation')}</span></div></div><CompactPlan data={data} selected={wallSelected} lang={lang}/><button className="apply-preset" disabled={totalCost(data, wallSelected) > CAP || !allSelected(wallSelected).length} onClick={() => applyStrategy(wallSelected, bi('Custom Fortification', 'Fortification personnalisée'))}>{bi('Apply fortification', 'Appliquer la fortification')}</button></section><aside className="advisor-inspector"><h2>{bi('Analysis', 'Analyse')}</h2><MiniAnalysis data={data} selected={wallSelected} game={game} lang={lang}/></aside></div>}
  </>;
}

function App() {
  const stored = useMemo(loadStored, []);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [game, setGame] = useState(stored?.game || 'aoc');
  const [lang, setLang] = useState(stored?.lang || 'en');
  const [mode, setMode] = useState('builder');
  const [name, setName] = useState(stored?.name || 'My Civilization');
  const [selected, setSelected] = useState(stored?.selected || {});
  const [activeCategory, setActiveCategory] = useState('Civ - Economy');
  const [activePresetId, setActivePresetId] = useState(stored?.activePresetId || 'economy');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState(stored?.drafts || {});
  const [draftName, setDraftName] = useState('');
  const [advisorTool, setAdvisorTool] = useState('presets');
  const [presetFilter, setPresetFilter] = useState('all');
  const [presetQuery, setPresetQuery] = useState('');
  const [generator, setGenerator] = useState({ gameMode: 'random', phase: 'early', focus: 'economy', balance: 45, timeline: 30, defense: 45 });
  const [compareIds, setCompareIds] = useState(['dawn', 'stonewall']);
  const [wallSettings, setWallSettings] = useState({ hp: 3, cost: 1, build: 1, attack: 0, range: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [autosaved, setAutosaved] = useState(true);
  const fileInput = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}civ_info.json`)
      .then(response => { if (!response.ok) throw new Error(`Could not load civilization records (${response.status}).`); return response.json(); })
      .then(setData).catch(error => setLoadError(error.message));
  }, []);

  useEffect(() => {
    setAutosaved(false);
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, game, lang, name, selected, drafts, activePresetId }));
      setAutosaved(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [game, lang, name, selected, drafts, activePresetId]);

  useEffect(() => {
    if (!data || data[game].includes(activeCategory)) return;
    setActiveCategory(data[game][0]);
  }, [game, data, activeCategory]);

  const commitSelected = updater => {
    setSelected(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setUndoStack(stack => [...stack.slice(-29), current]);
      setRedoStack([]);
      return next;
    });
  };

  const undo = () => {
    if (!undoStack.length) return;
    const previous = undoStack.at(-1);
    setRedoStack(stack => [...stack, selected]);
    setUndoStack(stack => stack.slice(0, -1));
    setSelected(previous);
  };

  const redo = () => {
    if (!redoStack.length) return;
    const next = redoStack.at(-1);
    setUndoStack(stack => [...stack, selected]);
    setRedoStack(stack => stack.slice(0, -1));
    setSelected(next);
  };

  const total = useMemo(() => data ? totalCost(data, selected) : 0, [data, selected]);
  const available = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data[game].filter(category => !q || category.toLowerCase().includes(q) || data.categories[category].bonuses.some(b => b.name.toLowerCase().includes(q)));
  }, [data, game, query]);
  const text = UI[lang];
  const validation = useMemo(() => data ? buildValidation(data, selected, total, game, lang) : [], [data, selected, total, game, lang]);
  const activePresetBase = PRESETS.find(preset => preset.id === activePresetId);
  const activePreset = useMemo(() => presetCopy(activePresetBase, lang), [activePresetBase, lang]);
  const presetSelected = useMemo(() => data ? hydratePreset(data, activePreset, game) : {}, [data, activePreset, game]);
  const presetTotal = useMemo(() => data ? totalCost(data, presetSelected) : 0, [data, presetSelected]);
  const presetValidation = useMemo(() => data ? buildValidation(data, presetSelected, presetTotal, game, lang) : [], [data, presetSelected, presetTotal, game, lang]);
  const generatedPreview = useMemo(() => data ? buildGeneratedSelection(data, game, generator) : {}, [data, game, generator]);
  const optimizedSelected = useMemo(() => data ? fillUnusedPoints(data, game, selected) : {}, [data, game, selected]);
  const wallSelected = useMemo(() => data ? hydratePreset(data, { entries: [
    ['Civ - Buildings, Walls and Towers', '50% Hit Points', wallSettings.hp],
    ['Civ - Buildings, Walls and Towers', '15% Cost Reduction', wallSettings.cost],
    ['Civ - Buildings, Walls and Towers', '30% Build Time Decrease', wallSettings.build],
    ['Civ - Buildings, Walls and Towers', '20% Attack', wallSettings.attack],
    ['Civ - Buildings, Walls and Towers', '20% Range', wallSettings.range],
  ] }, game) : {}, [data, game, wallSettings]);

  if (loadError) return <div className="loading">{loadError}</div>;
  if (!data) return <div className="loading">Loading civilization records…</div>;

  const category = data.categories[activeCategory];
  const categorySelections = selected[activeCategory] || [];
  const nextSurcharge = categorySelections.length * category.category_cost;
  const bi = (english, french) => lang === 'fr' ? french : english;
  const visiblePresets = PRESETS.filter(item => {
    const copy = presetCopy(item, lang);
    const matchesGroup = presetFilter === 'all' || PRESET_GROUPS[item.id] === presetFilter;
    const q = presetQuery.trim().toLowerCase();
    return matchesGroup && (!q || `${copy.name} ${copy.summary}`.toLowerCase().includes(q));
  });
  const add = bonus => {
    const nextCost = bonus.costs + nextSurcharge;
    if (total + nextCost > CAP) return setMessage(`Cannot add: this copy costs ${nextCost}, but only ${CAP - total} points remain.`);
    commitSelected(previous => ({ ...previous, [activeCategory]: [...(previous[activeCategory] || []), bonus] }));
    setMessage('');
  };

  const removeOne = bonus => commitSelected(previous => {
    const list = [...(previous[activeCategory] || [])];
    const index = list.findLastIndex(item => item.hexcode === bonus.hexcode);
    if (index >= 0) list.splice(index, 1);
    const next = { ...previous };
    if (list.length) next[activeCategory] = list; else delete next[activeCategory];
    return next;
  });

  const clearCurrent = () => {
    if (!allSelected(selected).length) return;
    commitSelected({});
    setName('');
    setDraftName('');
    setMessage(bi('Current civilization cleared. Use Undo to restore it.', 'Civilisation actuelle effacée. Utilisez Annuler pour la restaurer.'));
  };

  const download = () => {
    if (!name.trim()) return setMessage('Enter a civilization name before downloading.');
    if (name.length > 31 || [...name].some(c => c.charCodeAt(0) > 255)) return setMessage('Use 1–31 basic Latin characters for the civilization name.');
    const url = URL.createObjectURL(makeCivBlob(name, selected));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${name}.civ`; anchor.click(); URL.revokeObjectURL(url);
    setMessage('Civilization downloaded.');
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseCiv(await file.arrayBuffer(), data);
      setName(parsed.name || file.name.replace(/\.civ$/i, ''));
      commitSelected(parsed.selected);
      setMessage(parsed.unknown.length ? `Imported with ${parsed.unknown.length} unknown bonus code(s): ${parsed.unknown.join(', ')}` : 'Civilization imported successfully.');
    } catch (error) { setMessage(error.message); }
    event.target.value = '';
  };

  const saveDraft = () => {
    const key = (draftName || name || 'Untitled Draft').trim();
    setDrafts(previous => ({ ...previous, [key]: { game, name, selected, savedAt: new Date().toISOString() } }));
    setDraftName(key);
    setMessage(`Draft “${key}” saved.`);
  };

  const loadDraft = key => {
    const draft = drafts[key];
    if (!draft) return;
    setGame(draft.game); setName(draft.name); commitSelected(draft.selected); setDraftName(key);
    setMessage(`Draft “${key}” loaded.`);
  };

  const builder = <>
    <aside className="sidebar">
      <label className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={text.search} /></label>
      <div className="side-label">{text.categories}</div>
      <nav>{available.map(key => <button key={key} className={key === activeCategory ? 'active' : ''} onClick={() => setActiveCategory(key)}><span>{categoryName(key, lang)}</span><b>{data.categories[key].bonuses.length}</b></button>)}</nav>
      <div className="help"><strong>{text.exactStacking}</strong><p>{text.stackingHelp}</p></div>
    </aside>
    <section className="catalog">
      <div className="section-heading"><div><h2>{categoryName(activeCategory, lang)}</h2><p>{text.categorySurcharge}: <strong>+{category.category_cost}</strong> {text.priorSelection}</p></div><div className="subtotal">{categoryCost(category, categorySelections)} pts</div></div>
      <div className="table-head"><span>{text.bonus}</span><span>{text.base}</span><span>{text.copies}</span><span>{text.nextCopy}</span></div>
      <div className="bonus-list">{category.bonuses.filter(b => !query || `${activeCategory} ${b.name}`.toLowerCase().includes(query.toLowerCase())).map(bonus => {
        const copies = categorySelections.filter(item => item.hexcode === bonus.hexcode).length;
        const next = bonus.costs + nextSurcharge;
        return <div className={`bonus-row ${copies ? 'chosen' : ''}`} key={bonus.hexcode}>
          <div><strong>{bonusName(bonus.name, lang)}</strong><small>Code {bonus.hexcode}{bonus.epochs !== '?' ? ` · Epochs ${bonus.epochs}` : ''}</small></div><span>{bonus.costs}</span>
          <div className="stepper"><button disabled={!copies} onClick={() => removeOne(bonus)} aria-label={`Remove ${bonus.name}`}><Minus size={15}/></button><b>{copies}</b><button disabled={total + next > CAP} onClick={() => add(bonus)} aria-label={`Add ${bonus.name}`}><Plus size={15}/></button></div>
          <strong className="next-cost">{next}</strong>
        </div>;
      })}</div>
      <div className="formula-strip">Next selection = base + current category count × surcharge. Repeated copy <i>n</i> = base + (<i>n</i>−1) × surcharge.</div>
    </section>
    <aside className="inspector">
      <h2>{text.civDetails}</h2>
      <label className="name-field">{text.civName}<input maxLength="31" value={name} onChange={e => setName(e.target.value)} /><span>{name.length}/31</span></label>
      <BudgetRing total={total} entries={allSelected(selected).length} lang={lang}/>
      <div className="selection-title"><h3>{text.selected}</h3><span>{text.marginal}</span></div>
      <div className="ledger">{Object.keys(selected).length === 0 && <div className="empty">{text.empty}</div>}{Object.entries(selected).map(([key, bonuses]) => <div className="ledger-category" key={key}><div><strong>{categoryName(key, lang)}</strong><b>{categoryCost(data.categories[key], bonuses)} pts</b></div>{groupBonuses(bonuses).map(bonus => {
        const positions = bonuses.map((item, i) => item.hexcode === bonus.hexcode ? i : -1).filter(i => i >= 0);
        const costs = positions.map(i => bonus.costs + i * data.categories[key].category_cost);
        return <p key={bonus.hexcode}><span>{bonusName(bonus.name, lang)} ×{positions.length}</span><em>{costs.join(' + ')} = {sum(costs)}</em></p>;
      })}</div>)}</div>
      <div className={`validity ${total <= CAP ? 'valid' : 'invalid'}`}><ShieldCheck size={24}/><div><strong>{total <= CAP ? text.valid : text.over}</strong><span>{total <= CAP ? text.within : text.remove}</span></div></div>
      {message && <div className="message">{message}</div>}
      <button className="download" disabled={total > CAP || !allSelected(selected).length} onClick={download}><Download size={20}/> {text.download}</button>
      <button className="clear" disabled={!allSelected(selected).length} onClick={() => commitSelected({})}><Trash2 size={15}/> {text.clear}</button>
    </aside>
  </>;

  const applyStrategy = (plan, label) => { commitSelected(plan); setName(label); setMode('builder'); setMessage(bi(`${label} applied.`, `${label} appliqué.`)); };

  const advisor = <section className="strategy-tools"><ToolNav tool={advisorTool} setTool={setAdvisorTool} lang={lang}/>{advisorTool === 'presets' ? <div className="advisor-workspace">
    <aside className="advisor-presets">
      <label className="search"><Search size={15}/><input value={presetQuery} onChange={event => setPresetQuery(event.target.value)} placeholder={lang === 'fr' ? 'Rechercher…' : 'Search…'}/></label>
      <select className="preset-filter" value={presetFilter} onChange={event => setPresetFilter(event.target.value)}><option value="all">{lang === 'fr' ? 'Toutes les stratégies' : 'All strategies'}</option><option value="opening">{lang === 'fr' ? 'Début de partie' : 'Opening'}</option><option value="economy">{lang === 'fr' ? 'Économie' : 'Economy'}</option><option value="offense">{lang === 'fr' ? 'Attaque' : 'Offense'}</option><option value="defense">{lang === 'fr' ? 'Défense' : 'Defense'}</option><option value="construction">Construction</option><option value="siege">{lang === 'fr' ? 'Siège' : 'Siege'}</option><option value="religion">Religion</option></select>
      <div className="side-label">{text.strategyPresets}</div>
      {visiblePresets.map(item => { const preset = presetCopy(item, lang); return <button key={preset.id} className={preset.id === activePresetId ? 'active' : ''} onClick={() => setActivePresetId(preset.id)}><strong>{preset.name}</strong><span>{preset.summary}</span></button>; })}
    </aside>
    <section className="advisor-plan">
      <div className="advisor-heading"><Sparkles size={25}/><div><h2>{activePreset.name}</h2><p>{activePreset.summary}</p></div></div>
      <div className="plan-title"><h3>{text.bonusPlan}</h3><b>{presetTotal} / 100 {text.points}</b></div>
      <div className="plan-table">{Object.entries(presetSelected).map(([key, bonuses]) => <div className="plan-category" key={key}><div><strong>{categoryName(key, lang)}</strong><b>{categoryCost(data.categories[key], bonuses)} pts</b></div>{groupBonuses(bonuses).map(bonus => {
        const positions = bonuses.map((item, index) => item.hexcode === bonus.hexcode ? index : -1).filter(index => index >= 0);
        const costs = positions.map(index => bonus.costs + index * data.categories[key].category_cost);
        return <p key={bonus.hexcode}><span>{bonusName(bonus.name, lang)}</span><span>×{positions.length}</span><em>{costs.join(' + ')} = {sum(costs)}</em></p>;
      })}</div>)}</div>
      <div className="preset-reason"><Lightbulb size={20}/><div><strong>{text.why}</strong><p>{activePreset.reason}</p></div></div>
      <button className="apply-preset" disabled={presetTotal > CAP} onClick={() => { commitSelected(presetSelected); setName(activePreset.name); setMode('builder'); setMessage(lang === 'fr' ? `${activePreset.name} appliqué. Vous pouvez maintenant l’ajuster.` : `${activePreset.name} applied. You can now fine-tune it.`); }}><Sparkles size={18}/> {text.apply}</button>
    </section>
    <aside className="advisor-inspector">
      <h2>{text.analysis}</h2>
      <BudgetRing total={presetTotal} entries={allSelected(presetSelected).length} lang={lang}/>
      <section className="analysis-section"><h3><Gauge size={16}/> {text.efficiency}</h3>{Object.entries(presetSelected).flatMap(([key, bonuses]) => groupBonuses(bonuses).map(bonus => {
        const positions = bonuses.map((item, index) => item.hexcode === bonus.hexcode ? index : -1).filter(index => index >= 0);
        const rating = efficiencyLabel(data.categories[key], bonus, positions);
        return <div className="analysis-row" key={`${key}-${bonus.hexcode}`}><span>{bonusName(bonus.name, lang)} ×{positions.length}</span><b className={rating.tone}>{text[rating.key]}</b></div>;
      })).slice(0, 7)}{!allSelected(presetSelected).length && <div className="empty-small">{text.noAnalysis}</div>}</section>
      <section className="analysis-section"><h3><ShieldCheck size={16}/> {text.smartValidation}</h3>{presetValidation.map((item, index) => <div className={`validation-row ${item.tone}`} key={`${item.text}-${index}`}>{item.tone === 'ok' ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}<span>{item.text}</span></div>)}</section>
      <section className="analysis-section recommendations"><h3><Lightbulb size={16}/> {text.recommendations}</h3>{Object.entries(presetSelected).flatMap(([key, bonuses]) => groupBonuses(bonuses).map(bonus => <p key={`${key}-${bonus.hexcode}`}>{recommendationFor(key, bonus, lang)}</p>)).slice(0, 3)}{!allSelected(presetSelected).length && <p>{text.noRecommendation}</p>}</section>
      <section className="draft-box"><h3><Save size={16}/> {text.drafts}</h3><div><input value={draftName} onChange={event => setDraftName(event.target.value)} placeholder={text.draftName}/><button onClick={saveDraft}><Save size={15}/> {text.save}</button></div>{Object.keys(drafts).length > 0 && <select value="" onChange={event => loadDraft(event.target.value)}><option value="">{text.loadDraft}</option>{Object.keys(drafts).map(key => <option key={key} value={key}>{key}</option>)}</select>}</section>
      <button className="clear advisor-clear" disabled={!allSelected(selected).length} onClick={() => { commitSelected({}); setName(''); setDraftName(''); setMessage(lang === 'fr' ? 'Civilisation actuelle effacée. Les brouillons enregistrés sont conservés.' : 'Current civilization cleared. Saved drafts were kept.'); }}><Trash2 size={15}/> {text.clear}</button>
      {message && <div className="message">{message}</div>}
    </aside>
  </div> : <StrategyTools {...{ data, game, lang, tool: advisorTool, setTool: setAdvisorTool, showNav: false, generator, setGenerator, generatedPreview, compareIds, setCompareIds, optimizedSelected, selected, wallSettings, setWallSettings, wallSelected, applyStrategy, commitSelected }}/>}</section>;

  return <main className={`app-shell ${mode === 'advisor' ? 'advisor-shell' : ''}`}>
    <Header {...{ game, setGame, mode, setMode, undo, redo, clearCurrent, canClear: !!allSelected(selected).length, canUndo: !!undoStack.length, canRedo: !!redoStack.length, fileInput, importFile, autosaved, lang, setLang }}/>
    {mode === 'builder' ? builder : advisor}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
