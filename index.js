const fs = require('fs');

let folders = fs.readdirSync('./stock-info-dec/');

let text = 'DATE, COMPANY, CHANGE';

for (const folder of folders) {
  text += '\n\n\n' + folder.split('_')[0] + '\n\n';
  const file = fs.readFileSync(`./stock-info-dec/${folder}/closing11.lis`, 'utf-8');
  const lines = file.split('\n');
  for (const line of lines) {
    if (line.length) {
      const val = line.split('|');
      const change = Number(val[7]) - Number(val[9]);
      const t = `${val[0]}, ${val[3]}, ${change.toFixed(3)}`;
      text += '\n' + t;
    }
  }
}

fs.writeFileSync('./Full-Summary.csv', text, 'utf-8');
console.log('complete')
