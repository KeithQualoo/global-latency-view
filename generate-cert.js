const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, 'ssl');
const keyPath = path.join(certDir, 'private.key');
const certPath = path.join(certDir, 'certificate.crt');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
}

// Generate private key and self-signed certificate
const generateCert = () => {
    try {
        console.log('Generating self-signed certificate...');
        execSync(
            `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`,
            { stdio: 'inherit' }
        );
        console.log('Certificate generated successfully!');
        console.log(`Private key: ${keyPath}`);
        console.log(`Certificate: ${certPath}`);
    } catch (error) {
        console.error('Error generating certificate:', error.message);
        console.log('\nMake sure OpenSSL is installed and available in your PATH.');
        console.log('You can download it from: https://slproweb.com/products/Win32OpenSSL.html');
    }
};

generateCert();
