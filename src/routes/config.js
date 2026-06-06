const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {

    res.json({

        appName:
            process.env.APP_NAME,

        environment:
            process.env.ENVIRONMENT,

        company:
            process.env.COMPANY

    });

});

module.exports = router;
