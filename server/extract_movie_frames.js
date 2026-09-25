const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractMovieFrames() {
  const filePath = 'c:\\pinpointgame\\Round 2\\movie_frames_identification.docx';
  const serverDir = 'c:\\pinpointgame\\server\\public\\clue-images\\round2\\movie_frames_identification';
  const adminDir = 'c:\\pinpointgame\\admin-portal\\public\\clue-images\\round2\\movie_frames_identification';

  if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
  if (!fs.existsSync(adminDir)) fs.mkdirSync(adminDir, { recursive: true });

  let imageIndex = 0;
  const result = await mammoth.convertToHtml(
    { path: filePath },
    {
      convertImage: mammoth.images.imgElement(function(image) {
        imageIndex++;
        const ext = image.contentType.split('/')[1] || 'jpeg';
        return image.read("base64").then(function(imageBuffer) {
          const buf = Buffer.from(imageBuffer, 'base64');
          const fileName = `img_${imageIndex}.${ext}`;
          
          fs.writeFileSync(path.join(serverDir, fileName), buf);
          fs.writeFileSync(path.join(adminDir, fileName), buf);
          
          console.log(`Extracted img_${imageIndex}.${ext} (${buf.length} bytes)`);
          return { src: `/clue-images/round2/movie_frames_identification/${fileName}` };
        });
      })
    }
  );

  console.log(`\nTotal images extracted: ${imageIndex}`);
  fs.writeFileSync('c:\\pinpointgame\\server\\movie_frames_html.html', result.value);
  console.log('Saved HTML to server/movie_frames_html.html');
}

extractMovieFrames().catch(console.error);
