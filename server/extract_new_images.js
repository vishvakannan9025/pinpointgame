const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractImages(filePath, outputDir) {
  const basename = path.basename(filePath, '.docx').replace(/ /g, '_');
  const outDir = path.join(outputDir, basename);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let imageIndex = 0;
  await mammoth.convertToHtml(
    { path: filePath },
    {
      convertImage: mammoth.images.imgElement(function(image) {
        imageIndex++;
        const ext = image.contentType.split('/')[1] || 'png';
        return image.read("base64").then(function(imageBuffer) {
          const imgPath = path.join(outDir, `img_${imageIndex}.${ext}`);
          fs.writeFileSync(imgPath, Buffer.from(imageBuffer, 'base64'));
          console.log(`  Extracted: img_${imageIndex}.${ext} (${Buffer.from(imageBuffer, 'base64').length} bytes)`);
          return { src: imgPath };
        });
      })
    }
  );
  console.log(`Total images extracted from ${basename}: ${imageIndex}`);
}

async function main() {
  const outputDir = 'c:\\pinpointgame\\server\\public\\clue-images\\round1';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('\n=== GUESS THE CARTOON ===');
  await extractImages('c:\\pinpointgame\\Round 1\\Guess the Cartoon.docx', outputDir);
  
  console.log('\n=== GUESS THE GAME ===');
  await extractImages('c:\\pinpointgame\\Round 1\\Guess The Game.docx', outputDir);
}

main().catch(console.error);
