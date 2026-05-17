import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace dark mode specific classes with standard or warm alternatives
    content = content.replace(/bg-slate-950/g, 'bg-background');
    content = content.replace(/bg-slate-900/g, 'bg-card');
    content = content.replace(/bg-slate-800/g, 'bg-muted');
    content = content.replace(/bg-slate-700/g, 'bg-muted/80');
    content = content.replace(/border-slate-800/g, 'border-border');
    content = content.replace(/border-slate-700/g, 'border-border');
    content = content.replace(/text-slate-50/g, 'text-foreground');
    content = content.replace(/text-slate-100/g, 'text-foreground');
    content = content.replace(/text-slate-200/g, 'text-foreground/90');
    content = content.replace(/text-slate-300/g, 'text-muted-foreground');
    content = content.replace(/text-slate-400/g, 'text-muted-foreground');
    content = content.replace(/text-slate-500/g, 'text-muted-foreground');
    content = content.replace(/bg-emerald-950/g, 'bg-secondary');
    content = content.replace(/border-emerald-900/g, 'border-secondary/50');
    content = content.replace(/bg-blue-500\/10/g, 'bg-primary/10');
    content = content.replace(/bg-blue-500\/30/g, 'bg-primary/30');
    content = content.replace(/text-blue-400/g, 'text-primary');
    content = content.replace(/text-blue-300/g, 'text-primary/80');
    content = content.replace(/hover:bg-blue-500\/10/g, 'hover:bg-primary/10');
    content = content.replace(/text-white/g, 'text-primary-foreground');
    // Specifically fix some primary buttons
    content = content.replace(/bg-emerald-600/g, 'bg-primary');
    content = content.replace(/hover:bg-emerald-500/g, 'hover:bg-primary/90');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

traverse('./src/pages');
traverse('./src/components');
