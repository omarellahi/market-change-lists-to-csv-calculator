const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

let folders = fs.readdirSync('./stock-info-dec/');

let text = 'DATE, COMPANY, CHANGE';

// Create a directory for graphs if it doesn't exist
const graphDir = './graphs';
if (!fs.existsSync(graphDir)) {
  fs.mkdirSync(graphDir, { recursive: true });
}

let companyData = {}; // Store data for each company for graphing purposes

for (const folder of folders) {
  const date = folder.split('_')[0];
  text += '\n\n\n' + date + '\n\n';
  const file = fs.readFileSync(`./stock-info-dec/${folder}/closing11.lis`, 'utf-8');
  const lines = file.split('\n');
  for (const line of lines) {
    if (line.length) {
      const val = line.split('|');
      const companyName = val[3].replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize company name for file system
      const change = Number(val[7]) - Number(val[9]);
      const t = `${val[0]}, ${companyName}, ${change.toFixed(3)}`;
      text += '\n' + t;

      // Collect data for the company
      if (!companyData[companyName]) {
        companyData[companyName] = [];
      }
      companyData[companyName].push({ date, change });
    }
  }
}

fs.writeFileSync('./Full-Summary.csv', text, 'utf-8');

// Generate PNG graphs for each company
for (const [company, data] of Object.entries(companyData)) {
  const labels = data.map(item => item.date);
  const changes = data.map(item => item.change);

  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw title
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`${company.replace(/_/g, ' ')} Monthly Change`, 10, 30);

  // Calculate chart dimensions
  const chartWidth = width - 100;
  const chartHeight = height - 100;
  const chartX = 50;
  const chartY = 50;

  // Draw grid lines
  ctx.strokeStyle = 'lightgray';
  ctx.lineWidth = 1;
  for (let i = 0; i <= labels.length - 1; i++) {
    const x = chartX + i * (chartWidth / (labels.length - 1));
    ctx.beginPath();
    ctx.moveTo(x, chartY);
    ctx.lineTo(x, chartY + chartHeight);
    ctx.stroke();
  }

  const numYLabels = 5;
  for (let i = 0; i <= numYLabels; i++) {
    const y = chartY + chartHeight - (i * chartHeight) / numYLabels;
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartWidth, y);
    ctx.stroke();
  }

  // Draw axes
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartHeight);
  ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
  ctx.stroke();

  // Add axis labels
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  ctx.fillText('Dates', chartX + chartWidth / 2, chartY + chartHeight + 40);
  ctx.save();
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Stock Change', -(chartY + chartHeight / 2), chartX - 40);
  ctx.restore();

  // Calculate scaling
  const maxChange = Math.max(...changes);
  const minChange = Math.min(...changes);
  const yScale = chartHeight / (maxChange - minChange || 1); // Avoid division by zero
  const xScale = chartWidth / (labels.length - 1 || 1); // Avoid division by zero

  // Draw data points and lines
  ctx.strokeStyle = 'rgba(75, 192, 192, 1)';
  ctx.fillStyle = 'rgba(75, 192, 192, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < changes.length; i++) {
    const x = chartX + i * xScale;
    const y = chartY + chartHeight - (changes[i] - minChange) * yScale;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    // Draw points
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.stroke();

  // Add x-axis labels with notches
  ctx.strokeStyle = 'black';
  for (let i = 0; i < labels.length; i++) {
    const x = chartX + i * xScale;
    ctx.beginPath();
    ctx.moveTo(x, chartY + chartHeight);
    ctx.lineTo(x, chartY + chartHeight + 5);
    ctx.stroke();

    if (i % Math.ceil(labels.length / 5) === 0) { // Display fewer labels to reduce clutter
      const label = labels[i];
      ctx.fillText(label, x - ctx.measureText(label).width / 2, chartY + chartHeight + 20);
    }
  }

  // Add y-axis labels (stock change values)
  for (let i = 0; i <= numYLabels; i++) {
    const value = minChange + (i * (maxChange - minChange)) / numYLabels;
    const y = chartY + chartHeight - (value - minChange) * yScale;
    ctx.fillText(value.toFixed(2), chartX - 40, y + 5);
  }

  // Save as PNG
  const sanitizedFileName = company.replace(/[^a-zA-Z0-9]/g, '_') + '.png';
  const out = fs.createWriteStream(path.join(graphDir, sanitizedFileName));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log(`Graph for ${company.replace(/_/g, ' ')} saved as PNG.`));
}

console.log('Complete. Summary CSV and graphs generated.');
