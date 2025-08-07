const express = require('express');
const router = express.Router();
const slidesController = require('../controllers/slidesController');

// Authentication routes
router.get('/auth', slidesController.getAuthUrl);
router.get('/auth/callback', slidesController.handleAuthCallback);

// Slides routes
router.post('/create', slidesController.createSlide);
router.get('/status/:id', slidesController.getSlideStatus);
router.get('/setup', slidesController.getSetupInstructions);

module.exports = router;