// Package script for creating a distributable zip file of the extension
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('Starting packaging process...');

// Output directory for the packaged extension
const DIST_DIR = path.resolve(__dirname, '../dist');
// Input directory with the built extension files
const OUTPUT_DIR = path.resolve(__dirname, '../.output/chrome-mv3');

// Create dist directory if it doesn't exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Package name and version from package.json
const packageJson = require('../package.json');
const zipFileName = `${packageJson.name}-${packageJson.version}.zip`;
const zipFilePath = path.join(DIST_DIR, zipFileName);

// Create a file to stream archive data to
const output = fs.createWriteStream(zipFilePath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`Extension packaged successfully: ${zipFilePath}`);
  console.log(`Total size: ${archive.pointer()} bytes`);
});

// Handle archive warnings
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Handle archive errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add all files from the .output/chrome-mv3 directory
archive.directory(OUTPUT_DIR, false);

// Finalize the archive
archive.finalize();
