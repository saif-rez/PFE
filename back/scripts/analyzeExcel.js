const XLSX = require('xlsx');
const path = require('path');

// Place ton fichier Excel ici :
const FILE_PATH = path.join(__dirname, 'data.xlsx');

const workbook = XLSX.readFile(FILE_PATH);

console.log('\n======================================');
console.log('  ANALYSE DU FICHIER EXCEL');
console.log('======================================\n');

console.log(`Nombre de feuilles : ${workbook.SheetNames.length}`);
console.log(`Feuilles trouvées  : ${workbook.SheetNames.join(', ')}\n`);

workbook.SheetNames.forEach((sheetName, index) => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log('--------------------------------------');
  console.log(`Feuille ${index + 1} : "${sheetName}"`);
  console.log(`Nombre de lignes  : ${rows.length}`);

  if (rows.length > 0) {
    const columns = Object.keys(rows[0]);
    console.log(`Colonnes (${columns.length}) :`);
    columns.forEach(col => console.log(`  - "${col}"`));

    console.log('\nAperçu (2 premières lignes) :');
    rows.slice(0, 2).forEach((row, i) => {
      console.log(`  Ligne ${i + 1}:`, JSON.stringify(row, null, 2));
    });
  } else {
    console.log('  ⚠ Feuille vide ou sans données.');
  }

  console.log();
});
