const fs = require('fs');
const path = require('path');

const dir = 'c:\\pinpointgame\\Round1_images\\Guess_the_movie';
const artifactDir = 'C:\\Users\\Vishvakannan\\.gemini\\antigravity-ide\\brain\\eb1d2102-4033-4bee-87fc-fb6ecbb0af57\\scratch';

const files = fs.readdirSync(dir).sort((a, b) => {
  const numA = parseInt(a.replace(/[^0-9]/g, ''));
  const numB = parseInt(b.replace(/[^0-9]/g, ''));
  return numA - numB;
});

let md = `# Guess the Movie Images\n\n`;

files.forEach(file => {
  const src = path.join(dir, file);
  const dest = path.join(artifactDir, file);
  fs.copyFileSync(src, dest);
  md += `### ${file}\n![${file}](${dest})\n\n`;
});

fs.writeFileSync(path.join(artifactDir, 'movie_images.md'), md);
console.log('Created movie_images.md artifact');
