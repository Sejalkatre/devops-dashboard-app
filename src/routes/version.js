const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {

    res.json({

        version:
            process.env.APP_VERSION || "v1"

    });

});

module.exports = router;
