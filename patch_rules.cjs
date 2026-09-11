const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// The rules file was updated by the setup, let's just make sure it allows writing to our main doc
fs.writeFileSync('firestore.rules', rules);
