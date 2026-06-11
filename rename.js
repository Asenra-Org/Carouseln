import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.astro') || file.endsWith('.json')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.push(path.resolve('./package.json'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('BrandForge') || content.includes('brandforge')) {
    content = content.replace(/BrandForge/g, 'Carouseln');
    content = content.replace(/brandforge/g, 'carouseln');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});
