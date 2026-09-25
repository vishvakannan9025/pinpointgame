const mammoth = require('mammoth');

async function parseHiddenCategory() {
  const filePath = 'c:\\pinpointgame\\Round 1\\Guess the Hidden Category.docx';
  
  // Get full HTML
  const result = await mammoth.convertToHtml({ path: filePath });
  console.log('=== HTML ===');
  console.log(result.value);
  
  // Get raw text
  const textResult = await mammoth.extractRawText({ path: filePath });
  console.log('\n=== RAW TEXT ===');
  console.log(textResult.value);
}

parseHiddenCategory().catch(console.error);
