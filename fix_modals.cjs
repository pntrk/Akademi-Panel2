const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Pattern to find standard modal container
  const regex = /className="bg-white\s+rounded-\[32px\]\s+border\s+border-\[#e6e2d3\]\s+shadow-2xl\s+w-full\s+([^"]+)"/g;
  
  content = content.replace(regex, (match, classes) => {
    let newClasses = classes;
    if (!newClasses.includes('max-h-')) {
      newClasses += ' max-h-[90vh]';
    }
    if (!newClasses.includes('flex')) {
      newClasses += ' flex flex-col';
    } else if (!newClasses.includes('flex-col')) {
      newClasses += ' flex-col';
    }
    if (!newClasses.includes('animate-slide-up')) {
      newClasses += ' animate-slide-up';
    }
    changed = true;
    return `className="bg-white rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full ${newClasses}"`;
  });

  if (changed) {
    fs.writeFileSync(file, content);
  }
});

