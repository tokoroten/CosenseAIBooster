const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const { version } = require('../package.json');

// Debug info
console.log(`Current directory: ${__dirname}`);
console.log(`Project root: ${path.resolve(__dirname, '..')}`);
console.log(`Checking for dist directory: ${fs.existsSync(path.resolve(__dirname, '../dist'))}`);

// Create output directory if it doesn't exist
const outputDir = path.resolve(__dirname, '../release');
console.log(`Output directory will be: ${outputDir}`);
if (!fs.existsSync(outputDir)) {
  console.log('Creating output directory');
  fs.mkdirSync(outputDir, { recursive: true });
}

// Define zip file path
const outputPath = path.resolve(outputDir, `cosense-ai-booster-v${version}.zip`);
console.log(`Output zip file: ${outputPath}`);

// Create a file to stream archive data to
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Compression level
});

// Listen for errors
output.on('close', () => {
  console.log(`✓ Archive created: ${outputPath}`);
  console.log(`  Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Append files from WXT build directory
archive.directory('.output/chrome-mv3/', false);

// Catch any errors during the finalization process
try {
  // Finalize the archive
  archive.finalize();
  console.log('Archive finalization started');
} catch (error) {
  console.error('Error finalizing archive:', error);
}
