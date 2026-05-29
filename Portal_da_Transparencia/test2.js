function extractDigits(code) { return code.replace(/[^\d]/g, ''); }
function padCode(clean) { return clean.padEnd(10, '0').slice(0, 10); }
function formatCodigo(clean) {
  return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean[6]}.${clean[7]}.${clean.slice(8, 10)}`;
}

function computeParentSafe(codigo) {
  const digits = extractDigits(codigo).padEnd(10, '0').slice(0, 10);
  const groups = [
    { start: 0, size: 1 }, { start: 1, size: 1 }, { start: 2, size: 1 },
    { start: 3, size: 1 }, { start: 4, size: 2 }, { start: 6, size: 1 },
    { start: 7, size: 1 }, { start: 8, size: 2 },
  ];
  let deepestNonZero = -1;
  for (let i = 0; i < groups.length; i++) {
    const g = digits.slice(groups[i].start, groups[i].start + groups[i].size);
    if (g !== '0'.repeat(groups[i].size)) deepestNonZero = i;
  }
  if (deepestNonZero <= 0) return null;
  const parent = digits.split('');
  for (let i = groups[deepestNonZero].start; i < digits.length; i++) parent[i] = '0';
  return formatCodigo(parent.join(''));
}

console.log('Parent of 1721.51.0.1.00:', computeParentSafe('1721.51.0.1.00'));
console.log('Parent of 1000.00.0.0.00:', computeParentSafe('1000.00.0.0.00'));
console.log('Parent of 1112.50.0.1.00:', computeParentSafe('1112.50.0.1.00'));
