import { copy } from 'fs-extra';
import { join } from 'path';

// Source and destination paths
const sourceDir = join(__dirname, './mails');
const destDir = join(__dirname, './build/mails');

// Copy the source folder to the destination
copy(sourceDir, destDir, (err) => {
  if (err) {
    console.error('Error copying folder:', err);
  } else {
    console.log('Folder copied successfully.');
  }
});
