const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === '/keystore' || req.url === '/tasacak-release.p12') {
    const filePath = path.join(__dirname, 'tasacak-release.p12');
    const stat = fs.statSync(filePath);
    
    res.writeHead(200, {
      'Content-Type': 'application/x-pkcs12',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename=tasacak-release.p12'
    });
    
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Keystore Download</h1><a href="/keystore">Download tasacak-release.p12</a>');
  }
});

server.listen(8888, () => console.log('Server running on port 8888'));
