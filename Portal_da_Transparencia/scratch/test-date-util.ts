import { formatDateBR, formatDateLongBR, toISODateBR } from '../lib/utils/date';

const tests: [string | null, string][] = [
  ['2026-08-11', '11/08/2026'],
  ['2026-08-11T13:25:17', '11/08/2026'],
  ['2026-08-11 13:25:17', '11/08/2026'],
  ['11/08/2026', '11/08/2026'],
  ['11/08/2026 13:25:17', '11/08/2026'],
  [null, '-'],
  ['', '-'],
  ['data-invalida', '-'],
  ['5/8/2026', '05/08/2026'],
  ['2026', '-'],
];

let ok = true;
for (const [input, expected] of tests) {
  const got = formatDateBR(input);
  const pass = got === expected;
  if (!pass) ok = false;
  console.log(`${pass ? '✅' : '❌'} formatDateBR(${JSON.stringify(input)}) = ${JSON.stringify(got)} (esperado ${JSON.stringify(expected)})`);
}

console.log('formatDateLongBR(2026-08-11) =', formatDateLongBR('2026-08-11'));
console.log('toISODateBR(11/08/2026) =', toISODateBR('11/08/2026'));
console.log('toISODateBR(2026-08-11 13:25:17) =', toISODateBR('2026-08-11 13:25:17'));

process.exit(ok ? 0 : 1);
