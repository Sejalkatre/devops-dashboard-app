const express = require('express');
const client = require('prom-client');

const app = express();

// 🔥 SECURITY FIX: Hide Express framework info
app.disable('x-powered-by');

const register = new client.Registry();

client.collectDefaultMetrics({
    register
});

app.use('/health', require('./routes/health'));
app.use('/api/version', require('./routes/version'));
app.use('/api/config', require('./routes/config'));
app.use('/api/load', require('./routes/load'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/dashboard.html');
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

const port = 3000;

app.listen(port, () => {
    console.log(`Application running on ${port}`);
});
