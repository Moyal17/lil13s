const express = require('express');
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const compression = require('compression');

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 8080;

// Multi-process to utilize all CPU cores.
if (!isDev && cluster.isMaster) {
  console.error(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    // eslint-disable-next-line no-console
    console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });
} else {
  const app = express();
  app.use(compression());
  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, './build')));

  // All remaining requests return the React app, so it can handle routing.
  app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './build', 'index.html'));
  });

  app.listen(PORT, () => {
    console.error(`Node ${isDev ? 'dev server' : `cluster worker ${process.pid}`}: listening on port http://localhost:${PORT}`);
  });
}
