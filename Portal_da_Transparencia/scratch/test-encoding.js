const text = "AquisiÃ§Ã£o de equipamentos para a Unidade BÃ¡sica";
const fixed = Buffer.from(text, 'latin1').toString('utf8');
console.log("Original:", text);
console.log("Fixed:", fixed);

const text2 = "ContrataÃ§Ã£o de empresa para prestaÃ§Ã£o de serviÃ§os";
const fixed2 = Buffer.from(text2, 'latin1').toString('utf8');
console.log("Original 2:", text2);
console.log("Fixed 2:", fixed2);
