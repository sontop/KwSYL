var express = require('express');
var router = express.Router();

/* GET chat listing. */
router.get('/', function(req, res, next) {
    res.render('chat', { title: 'chat tutorial' });

});

module.exports = router;
