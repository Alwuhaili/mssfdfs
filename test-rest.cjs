const fs = require('fs');
const https = require('https');
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json'));

const data = JSON.stringify({
  fields: {
    test: { stringValue: "ping" }
  }
});

const req = https.request({
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: `/v1/projects/${config.projectId}/databases/maysan-prod-db/documents/database/main`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
