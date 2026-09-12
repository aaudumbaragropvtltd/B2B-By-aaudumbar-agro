import { getIndianStates, getCitiesByState, getVillagesByCity } from '../utils/indianLocations.js';

console.log('=== VERIFYING FULL INDIAN GEOGRAPHICAL DATASET ===');

const states = getIndianStates();
console.log(`Total States & UTs: ${states.length}`);
console.log('States List:\n', states.join(', '));

console.log('\n--- 1. Telangana Districts (Should be 33): ---');
const tgDistricts = getCitiesByState('Telangana');
console.log(`Count: ${tgDistricts.length}`);
console.log(tgDistricts.join(', '));

console.log('\n--- 2. Maharashtra Districts (Should be 36): ---');
const mhDistricts = getCitiesByState('Maharashtra');
console.log(`Count: ${mhDistricts.length}`);

console.log('\n--- 3. Uttar Pradesh Districts (Should be 75): ---');
const upDistricts = getCitiesByState('Uttar Pradesh');
console.log(`Count: ${upDistricts.length}`);

console.log('\n--- 4. Union Territories Check: ---');
const uts = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

uts.forEach(ut => {
  const d = getCitiesByState(ut);
  console.log(`UT: ${ut} -> ${d.length} Districts: [${d.join(', ')}]`);
});

console.log('\n--- 5. Sample Talukas in Telangana -> Hyderabad & Warangal: ---');
console.log('Hyderabad:', getVillagesByCity('Telangana', 'Hyderabad').join(', '));
console.log('Warangal:', getVillagesByCity('Telangana', 'Warangal').join(', '));
