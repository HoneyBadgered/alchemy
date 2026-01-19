const fs = require('fs');

const completeList = JSON.parse(fs.readFileSync('complete-ingredient-list.json', 'utf8'));
const seedData = JSON.parse(fs.readFileSync('ingredients-seed-data.json', 'utf8'));

const existingMap = new Map();
seedData.forEach(ing => {
  const key = `${ing.name.toLowerCase().trim()}|${ing.role}`;
  existingMap.set(key, true);
});

const missing = [];
completeList.forEach(ing => {
  const key = `${ing.name.toLowerCase().trim()}|${ing.role}`;
  if (!existingMap.has(key)) {
    missing.push(ing);
  }
});

console.log('Complete list:', completeList.length);
console.log('Seed data:', seedData.length);
console.log('Missing:', missing.length);
console.log('');
missing.forEach(ing => {
  console.log(`- ${ing.name} (${ing.role}, ${ing.category})`);
});
