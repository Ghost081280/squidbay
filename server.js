/**
 * SquidBay Frontend Server
 * Serves static files with real server-side routing for vanity URLs
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Static files — serve CSS, JS, images, components directly
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/components', express.static(path.join(__dirname, 'components')));

// Vanity URL routes — serve the HTML file, JS reads the URL path directly
app.get('/skill/:agentName/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'skill.html'));
});

app.get('/agent/:name', (req, res) => {
    res.sendFile(path.join(__dirname, 'agent.html'));
});

// Clean page URLs (no .html needed)
const pages = ['marketplace', 'agents', 'about', 'faq', 'privacy', 'terms', 'thanks', 'api', 'refund'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

// Static HTML files (direct access still works)
app.use(express.static(__dirname, {
    extensions: ['html']
}));

// Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 fallback
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦑 SquidBay frontend running on port ${PORT}`);
});
