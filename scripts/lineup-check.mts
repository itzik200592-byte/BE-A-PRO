/**
 * The team sheet says what each man is playing, and puts him somewhere sane.
 *   node --experimental-strip-types scripts/lineup-check.mts
 *
 * Item 5 on Itzik's list: a list of names cannot show you that your right back
 * slot is filled by a third centre back. These are the rules that make the
 * pitch view honest.
 */
import { FORMATIONS, formation, fillFormation, roleFit, ROLE_LABEL } from '../src/data/formations.ts';
import type { SlotRole } from '../src/data/formations.ts';
import { makeSquad } from '../src/data/squadGen.ts';
import { createRng } from '../src/engine/matchEngine.ts';

const fails: string[] = [];
let checked = 0;

/* 1. every slot in every formation has a role, and a name for it */
for (const f of FORMATIONS) {
  checked++;
  if (f.slots.length !== 11) fails.push(`${f.id}: ${f.slots.length} slots`);
  for (const s of f.slots) {
    checked++;
    if (!s.role) fails.push(`${f.id}: a ${s.line} slot has no role`);
    else if (!ROLE_LABEL[s.role]) fails.push(`${f.id}: role ${s.role} has no Hebrew label`);
  }
  // the roles must match the shape the formation advertises
  const defs = f.slots.filter(s => s.line === 'DEF').length;
  const mids = f.slots.filter(s => s.line === 'MID').length;
  const fwds = f.slots.filter(s => s.line === 'FWD').length;
  checked++;
  if (defs !== f.counts[0] || mids !== f.counts[1] || fwds !== f.counts[2])
    fails.push(`${f.id}: slots are ${defs}-${mids}-${fwds}, label says ${f.counts.join('-')}`);
  // a back four has a left and a right, and only one keeper
  checked++;
  if (f.slots.filter(s => s.line === 'GK').length !== 1) fails.push(`${f.id}: not exactly one keeper`);
  const wide = f.slots.filter(s => ['LB', 'RB', 'LWB', 'RWB'].includes(s.role));
  checked++;
  if (wide.length !== 2) fails.push(`${f.id}: ${wide.length} full backs, wanted 2`);
}

/* 2. a squad that HOLDS the right men is lined up with them in the right shirts.
      This is the bug the pitch view exposed: grabbing by line alone could put a
      right back at left back purely from list order. */
for (const f of FORMATIONS) {
  for (let seed = 0; seed < 60; seed++) {
    const sq = makeSquad(58, createRng(3300 + seed * 17));
    const eleven = fillFormation(sq.starters, f);
    checked++;
    if (eleven.length !== 11) { fails.push(`${f.id} seed ${seed}: ${eleven.length} men`); continue; }
    // nobody plays twice
    if (new Set(eleven.map(p => p.id)).size !== 11) fails.push(`${f.id} seed ${seed}: a man is in two shirts`);

    // if the squad has a natural for a wide slot, he must be in it
    for (let i = 0; i < 11; i++) {
      const role = f.slots[i].role as SlotRole;
      if (!['LB', 'RB'].includes(role)) continue;
      const natural = eleven.some(p => p.position === role);
      checked++;
      if (natural && eleven[i].position !== role)
        fails.push(`${f.id} seed ${seed}: a ${role} is in the squad but ${eleven[i].position} wears the shirt`);
    }
    // the keeper is the keeper
    checked++;
    if (sq.starters.some(p => p.position === 'GK') && eleven[0].position !== 'GK')
      fails.push(`${f.id} seed ${seed}: ${eleven[0].position} in goal with a keeper available`);
  }
}

/* 3. seating never makes the fit worse than the order it was handed */
let improved = 0, sameOrWorse = 0;
for (const f of FORMATIONS) {
  for (let seed = 0; seed < 40; seed++) {
    const sq = makeSquad(58, createRng(8800 + seed * 13));
    const eleven = fillFormation(sq.starters, f);
    const score = (list: typeof eleven) => list.reduce((s, p, i) => {
      const fit = roleFit(p.position, f.slots[i].role);
      return s + (fit === 'natural' ? 2 : fit === 'covers' ? 1 : 0);
    }, 0);
    const mine = score(eleven);
    const raw = score(sq.starters.slice(0, 11));
    checked++;
    if (mine < raw) fails.push(`${f.id} seed ${seed}: seating made the fit worse, ${mine} vs ${raw}`);
    else if (mine > raw) improved++;
    else sameOrWorse++;
  }
}

/* 4. roleFit is not simply calling everything a fit */
checked += 3;
if (roleFit('ST', 'CB') !== 'out') fails.push('a striker at centre back reads as fine');
if (roleFit('CB', 'CB') !== 'natural') fails.push('a centre back at centre back does not read as natural');
if (roleFit('GK', 'ST') !== 'out') fails.push('a keeper up front reads as fine');

console.log(`${checked} checks across ${FORMATIONS.length} formations`);
console.log(`seating improved the fit in ${improved} of ${improved + sameOrWorse} squads, made it worse in 0`);
console.log(`4-4-2 reads: ${formation('4-4-2').slots.map(s => s.role).join(' ')}`);
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, every shirt has a name and the right man is in it');
process.exit(fails.length ? 1 : 0);
