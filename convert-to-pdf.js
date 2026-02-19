const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter
function markdownToHTML(markdown) {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    // Horizontal rules
    .replace(/^---$/gim, '<hr>');

  // Wrap list items
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  
  // Clean up nested lists
  html = html.replace(/<\/ul>\s*<br>\s*<ul>/gim, '');
  
  // Wrap paragraphs
  html = '<p>' + html + '</p>';
  
  return html;
}

// Read markdown file
const markdownFile = path.join(__dirname, 'CHITEPO_ZANU_PF_PITCH.md');
const markdown = fs.readFileSync(markdownFile, 'utf8');

// Convert to HTML
const htmlContent = markdownToHTML(markdown);

// Create full HTML document
const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Digital Transformation for Chitepo School of Ideology</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      max-width: 100%;
    }
    h1 {
      font-size: 20pt;
      color: #1a1a1a;
      margin-top: 0.5em;
      margin-bottom: 0.3em;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 0.2em;
    }
    h2 {
      font-size: 16pt;
      color: #2c2c2c;
      margin-top: 0.8em;
      margin-bottom: 0.4em;
    }
    h3 {
      font-size: 13pt;
      color: #3c3c3c;
      margin-top: 0.6em;
      margin-bottom: 0.3em;
    }
    p {
      margin: 0.5em 0;
      text-align: justify;
    }
    ul {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }
    li {
      margin: 0.3em 0;
    }
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 1em 0;
    }
    strong {
      color: #1a1a1a;
      font-weight: bold;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

// Write HTML file (temporary)
const htmlFile = path.join(__dirname, 'CHITEPO_ZANU_PF_PITCH.html');
fs.writeFileSync(htmlFile, fullHTML);

console.log('HTML file created. Now converting to PDF...');
console.log('Note: You can open the HTML file in a browser and print to PDF,');
console.log('or install puppeteer to automate: npm install puppeteer');

// Try to use puppeteer if available
try {
  const puppeteer = require('puppeteer');
  
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    const pdfPath = path.join(__dirname, 'CHITEPO_ZANU_PF_PITCH.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      printBackground: true
    });
    await browser.close();
    console.log(`PDF created successfully: ${pdfPath}`);
    // Clean up HTML file
    fs.unlinkSync(htmlFile);
  })();
} catch (e) {
  console.log('Puppeteer not found. HTML file saved at:', htmlFile);
  console.log('To convert to PDF:');
  console.log('1. Install puppeteer: npm install puppeteer');
  console.log('2. Run this script again');
  console.log('OR');
  console.log('3. Open the HTML file in a browser and print to PDF');
}

