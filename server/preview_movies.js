const fs = require('fs');
const path = require('path');

const dir = 'c:\\pinpointgame\\Round1_images\\Guess_the_movie';
const files = fs.readdirSync(dir).sort((a, b) => {
  const numA = parseInt(a.replace(/[^0-9]/g, ''));
  const numB = parseInt(b.replace(/[^0-9]/g, ''));
  return numA - numB;
});

let html = `<html><body style="background: black; color: white;"><h1>Guess the Movie Images</h1>`;

files.forEach(file => {
  const filePath = path.join(dir, file);
  const base64 = fs.readFileSync(filePath, 'base64');
  const ext = path.extname(file).slice(1);
  html += `<div style="margin-bottom: 20px;">
    <h3>${file}</h3>
    <img src="data:image/${ext};base64,${base64}" style="max-width: 300px;" />
  </div>`;
});

html += `</body></html>`;
fs.writeFileSync('c:\\pinpointgame\\server\\public\\movie_preview.html', html);
console.log('Created movie_preview.html');
