const express = require('express');

const router = express.Router();

const {
    generateLoad
} = require('../services/cpuStress');

router.get('/', (req, res) => {

    const duration =
        Number.parseInt(req.query.duration || "10", 10);

    generateLoad(duration);

    res.json({
        message: `Load generated for ${duration} seconds`
    });

});

module.exports = router;
