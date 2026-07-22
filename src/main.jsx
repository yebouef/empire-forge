import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Download, FileUp, Minus, Plus, RotateCcw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import './styles.css';

const CAP = 100;

const sum = values => values.reduce((a, b) => a + b, 0);

function categoryCost(category, selected) {
  return sum(selected.map((bonus, index) => bonus.costs + index * category.category_cost));
}

function allSelected(selected) {
  return Object.values(selected).flat();
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

function App() {
  const [data, setData] = useState(null);
  const [game, setGame] = useState('aoc');
  const [name, setName] = useState('My Civilization');
  const [selected, setSelected] = useState({});
  const [activeCategory, setActiveCategory] = useState('Civ - Economy');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);

  useEffect(() => { fetch('/civ_info.json').then(r => r.json()).then(setData); }, []);
  useEffect(() => {
    if (!data || data[game].includes(activeCategory)) return;
    setActiveCategory(data[game][0]);
  }, [game, data, activeCategory]);

  const total = useMemo(() => !data ? 0 : sum(Object.entries(selected).map(([key, bonuses]) => categoryCost(data.categories[key], bonuses))), [data, selected]);
  const available = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data[game].filter(category => !q || category.toLowerCase().includes(q) || data.categories[category].bonuses.some(b => b.name.toLowerCase().includes(q)));
  }, [data, game, query]);

  if (!data) return <div className="loading">Loading civilization records…</div>;

  const category = data.categories[activeCategory];
  const categorySelections = selected[activeCategory] || [];
  const nextSurcharge = categorySelections.length * category.category_cost;

  const add = bonus => {
    const nextCost = bonus.costs + nextSurcharge;
    if (total + nextCost > CAP) return setMessage(`Cannot add: this copy costs ${nextCost}, but only ${CAP - total} points remain.`);
    setSelected(previous => ({ ...previous, [activeCategory]: [...(previous[activeCategory] || []), bonus] }));
    setMessage('');
  };

  const removeOne = bonus => setSelected(previous => {
    const list = [...(previous[activeCategory] || [])];
    const index = list.findLastIndex(item => item.hexcode === bonus.hexcode);
    if (index >= 0) list.splice(index, 1);
    const next = { ...previous };
    if (list.length) next[activeCategory] = list; else delete next[activeCategory];
    return next;
  });

  const download = () => {
    if (!name.trim()) return setMessage('Enter a civilization name before downloading.');
    if (name.length > 31 || [...name].some(c => c.charCodeAt(0) > 255)) return setMessage('Use 1–31 basic Latin characters for the civilization name.');
    const url = URL.createObjectURL(makeCivBlob(name, selected));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${name}.civ`; anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Civilization downloaded.');
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseCiv(await file.arrayBuffer(), data);
      setName(parsed.name || file.name.replace(/\.civ$/i, ''));
      setSelected(parsed.selected);
      setMessage(parsed.unknown.length ? `Imported with ${parsed.unknown.length} unknown bonus code(s): ${parsed.unknown.join(', ')}` : 'Civilization imported successfully.');
    } catch (error) { setMessage(error.message); }
    event.target.value = '';
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="crest">EF</div><div><h1>Empire Forge</h1><span>Custom Civilization Builder</span></div></div>
      <div className="game-switch" aria-label="Game version">
        <button className={game === 'ee' ? 'active' : ''} onClick={() => setGame('ee')}>Empire Earth</button>
        <button className={game === 'aoc' ? 'active' : ''} onClick={() => setGame('aoc')}>Art of Conquest</button>
      </div>
      <div className="actions">
        <input ref={fileInput} type="file" accept=".civ" hidden onChange={importFile} />
        <button onClick={() => fileInput.current.click()}><FileUp size={17}/> Import .civ</button>
        <button onClick={() => { setSelected({}); setMessage('Selections reset.'); }}><RotateCcw size={17}/> Reset</button>
      </div>
    </header>

    <aside className="sidebar">
      <label className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search bonuses…" /></label>
      <div className="side-label">Categories</div>
      <nav>{available.map(key => <button key={key} className={key === activeCategory ? 'active' : ''} onClick={() => setActiveCategory(key)}><span>{key}</span><b>{data.categories[key].bonuses.length}</b></button>)}</nav>
      <div className="help"><strong>Exact stacking</strong><p>Every selection in a category raises the next selection by that category’s surcharge—even another copy of the same bonus.</p></div>
    </aside>

    <section className="catalog">
      <div className="section-heading"><div><h2>{activeCategory}</h2><p>Category surcharge: <strong>+{category.category_cost}</strong> per prior selection</p></div><div className="subtotal">{categoryCost(category, categorySelections)} pts</div></div>
      <div className="table-head"><span>Bonus</span><span>Base</span><span>Copies</span><span>Next copy</span></div>
      <div className="bonus-list">{category.bonuses.filter(b => !query || `${activeCategory} ${b.name}`.toLowerCase().includes(query.toLowerCase())).map(bonus => {
        const copies = categorySelections.filter(item => item.hexcode === bonus.hexcode).length;
        const next = bonus.costs + nextSurcharge;
        return <div className={`bonus-row ${copies ? 'chosen' : ''}`} key={bonus.hexcode}>
          <div><strong>{bonus.name}</strong><small>Code {bonus.hexcode}{bonus.epochs !== '?' ? ` · Epochs ${bonus.epochs}` : ''}</small></div>
          <span>{bonus.costs}</span>
          <div className="stepper"><button disabled={!copies} onClick={() => removeOne(bonus)} aria-label={`Remove ${bonus.name}`}><Minus size={15}/></button><b>{copies}</b><button disabled={total + next > CAP} onClick={() => add(bonus)} aria-label={`Add ${bonus.name}`}><Plus size={15}/></button></div>
          <strong className="next-cost">{next}</strong>
        </div>;
      })}</div>
      <div className="formula-strip">Next selection cost = its base + current category selection count × surcharge. For only repeated copies: copy <i>n</i> = base + (<i>n</i>−1) × surcharge.</div>
    </section>

    <aside className="inspector">
      <h2>Civilization details</h2>
      <label className="name-field">Civilization name<input maxLength="31" value={name} onChange={e => setName(e.target.value)} /><span>{name.length}/31</span></label>
      <div className="budget"><div className="budget-ring" style={{'--fill': `${Math.min(total, 100) * 3.6}deg`}}><div><strong>{total}</strong><span>/ 100</span></div></div><div><b>{CAP-total} remaining</b><span>{allSelected(selected).length} bonus entries</span></div></div>
      <div className="selection-title"><h3>Selected bonuses</h3><span>marginal costs</span></div>
      <div className="ledger">{Object.keys(selected).length === 0 && <div className="empty">Choose bonuses to build your civilization.</div>}{Object.entries(selected).map(([key, bonuses]) => {
        const grouped = [...new Map(bonuses.map(b => [b.hexcode, b])).values()];
        return <div className="ledger-category" key={key}><div><strong>{key}</strong><b>{categoryCost(data.categories[key], bonuses)} pts</b></div>{grouped.map(b => {
          const positions = bonuses.map((item, i) => item.hexcode === b.hexcode ? i : -1).filter(i => i >= 0);
          const costs = positions.map(i => b.costs + i * data.categories[key].category_cost);
          return <p key={b.hexcode}><span>{b.name} ×{positions.length}</span><em>{costs.join(' + ')} = {sum(costs)}</em></p>;
        })}</div>;
      })}</div>
      <div className={`validity ${total <= CAP ? 'valid' : 'invalid'}`}><ShieldCheck size={24}/><div><strong>{total <= CAP ? 'Valid civilization' : 'Over budget'}</strong><span>{total <= CAP ? 'Within the 100-point limit.' : 'Remove bonuses before export.'}</span></div></div>
      {message && <div className="message">{message}</div>}
      <button className="download" disabled={total > CAP || !allSelected(selected).length} onClick={download}><Download size={20}/> Download .civ</button>
      <button className="clear" disabled={!allSelected(selected).length} onClick={() => setSelected({})}><Trash2 size={15}/> Clear all selections</button>
    </aside>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
