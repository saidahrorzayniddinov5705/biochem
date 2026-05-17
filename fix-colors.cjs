const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules')) filelist = walkSync(dirFile, filelist);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync('./src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  content = content.replace(/text-foreground0/g, 'text-muted-foreground');
  
  // replace text-primary-foreground to text-foreground ONLY on specific tags, or conditionally:
  content = content.replace(/(<h1[^>]*?)text-primary-foreground([^>]*?>)/g, '$1text-foreground$2');
  content = content.replace(/(<h2[^>]*?)text-primary-foreground([^>]*?>)/g, '$1text-foreground$2');
  content = content.replace(/(<h3[^>]*?)text-primary-foreground([^>]*?>)/g, '$1text-foreground$2');
  content = content.replace(/(<h4[^>]*?)text-primary-foreground([^>]*?>)/g, '$1text-foreground$2');
  content = content.replace(/(<div[^>]*font-bold[^>]*?)text-primary-foreground([^>]*?>)/g, '$1text-foreground$2');
  content = content.replace(/(<span[^>]*font-bold[^>]*?)text-primary-foreground([^>]*?>)/g, '$1text-foreground$2');

  fs.writeFileSync(f, content);
});
console.log('Fixed colors');
