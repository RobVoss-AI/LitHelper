const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 8711;
const HEALTH_URL = `http://127.0.0.1:${PORT}/api/health`;

let backendProcess = null;

function startBackend() {
  return new Promise((resolve, reject) => {
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      // In production, use the PyInstaller binary
      const binaryPath = path.join(process.resourcesPath, 'backend', 'lithelper-backend');
      backendProcess = spawn(binaryPath, [], {
        env: { ...process.env, LITHELPER_BACKEND_PORT: String(PORT) },
        stdio: 'pipe',
      });
    } else {
      // In development, use uvicorn
      backendProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--port', String(PORT)], {
        cwd: path.join(__dirname, '..', 'backend'),
        env: { ...process.env, LITHELPER_BACKEND_PORT: String(PORT) },
        stdio: 'pipe',
      });
    }

    backendProcess.stdout.on('data', (data) => {
      console.log(`[backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[backend] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend exited with code ${code}`);
      backendProcess = null;
    });

    // Poll health endpoint
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      http
        .get(HEALTH_URL, (res) => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            console.log('Backend is ready');
            resolve();
          }
        })
        .on('error', () => {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('Backend failed to start after 30 seconds'));
          }
        });
    }, 1000);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

module.exports = { startBackend, stopBackend, PORT };
