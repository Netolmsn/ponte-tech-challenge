const express = require('express');
const path = require('path');

const app = express();

const browserDistFolder = path.join(__dirname, 'dist', 'angular', 'browser');

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
  }),
);

// Rotas principais da SPA (sem curingas com '*', para evitar erro do path-to-regexp)
const spaRoutes = ['/', '/login', '/tarefas'];
spaRoutes.forEach((route) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(browserDistFolder, 'index.html'));
  });
});

const port = process.env.PORT || 4000;
app.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Angular app listening on http://localhost:${port}`);
});
