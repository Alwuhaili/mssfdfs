const fs = require('fs');
const path = 'src/services/syncService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, writeBatch, disableNetwork, terminate } from 'firebase/firestore';", 
"import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, writeBatch, disableNetwork, terminate } from 'firebase/firestore';");

content = content.replace("const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');\n      const { db } = await import('../lib/firebase');", "");

fs.writeFileSync(path, content);
