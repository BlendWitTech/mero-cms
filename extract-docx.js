const yauzl = require('yauzl');
const fs = require('fs');
const path = require('path');

const docxPath = path.resolve('mero-cms-product-docs.docx');

yauzl.open(docxPath, { lazyEntries: true }, (err, zipfile) => {
    if (err) throw err;
    zipfile.readEntry();
    zipfile.on('entry', (entry) => {
        if (entry.fileName === 'word/document.xml') {
            zipfile.openReadStream(entry, (err, readStream) => {
                if (err) throw err;
                let content = '';
                readStream.on('data', (chunk) => {
                    content += chunk.toString();
                });
                readStream.on('end', () => {
                    // Simple XML tag stripping to get plain text
                    const plainText = content
                        .replace(/<w:p[^>]*>/g, '\n') // Paragraphs to newlines
                        .replace(/<[^>]+>/g, '')      // Strip all other tags
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"');
                    console.log('--- EXTRACTED CONTENT START ---');
                    console.log(plainText);
                    console.log('--- EXTRACTED CONTENT END ---');
                });
            });
        } else {
            zipfile.readEntry();
        }
    });
});
