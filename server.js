const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const BARCODE_FILE = path.join(__dirname, 'databarcode.json');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    // API Endpoints
    if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                if (payload.data) {
                    fs.writeFileSync(DATA_FILE, JSON.stringify(payload.data, null, 2), 'utf8');
                }
                if (payload.databarcode) {
                    fs.writeFileSync(BARCODE_FILE, JSON.stringify(payload.databarcode, null, 2), 'utf8');
                }
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
                console.log('✅ Updated data.json successfully');
            } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Static File Server
    let filePath = req.url === '/' ? 'index.html' : req.url.substring(1).split('?')[0];
    filePath = path.join(__dirname, filePath);

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.statusCode = 404;
                res.end('File not found');
            } else {
                res.statusCode = 500;
                res.end('Internal server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 WMS Server running at: http://localhost:${PORT}`);
    console.log(`📝 Directly writing to: ${DATA_FILE}`);
});
