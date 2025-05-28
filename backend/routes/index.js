const express = require('express');
const router = express.Router();

// Import all route modules
const trainRoutes = require('./trainRoutes');
const train = require('./train');
const intentRoutes = require('./intentRoutes');
const intentExampleRoutes = require('./intentExampleRoutes');
const storyRoutes = require('./storyRoutes');
const storyStepRoutes = require('./storyStepRoutes');
const ruleRoutes = require('./ruleRoutes');
const ruleStepRoutes = require('./ruleStepRoutes');
const domainRoutes = require('./domainRoutes');

// Use route modules
router.use(trainRoutes);
router.use(train);
router.use(intentRoutes);
router.use(intentExampleRoutes);
router.use(storyRoutes);
router.use(storyStepRoutes);
router.use(ruleRoutes);
router.use(ruleStepRoutes);
router.use(domainRoutes);

module.exports = router;