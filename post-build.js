const fs = require('fs-extra');
const path = require('path');

// Source and destination paths
const sourceDir = path.join(__dirname, './mails');
const destDir = path.join(__dirname, './build/mails');

// Copy the source folder to the destination
fs.copy(sourceDir, destDir, (err) => {
  if (err) {
    console.error('Error copying folder:', err);
  } else {
    console.log('Folder copied successfully.');
  }
});
