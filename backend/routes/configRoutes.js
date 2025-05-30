const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const db = require('../models');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, Config, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');
/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get current Rasa configuration
 *     description: Returns the active Rasa configuration settings
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Config'
 *       500:
 *         description: Server error
 */
router.get('/config', async (req, res) => {
    try {

        const config = await Config.getActiveConfig();
        res.status(200).json(config);
    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get configuration' });
    }
});

/**
 * @swagger
 * /api/config:
 *   put:
 *     summary: Update Rasa configuration
 *     description: Updates the Rasa configuration settings
 *     tags: [Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfigUpdate'
 *     responses:
 *       200:
 *         description: Updated configuration data
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/config', async (req, res) => {
    try {
        const { recipe, assistant_id, language, pipeline, policies } = req.body;

        // Input validation
        if (!recipe || !language) {
            return res.status(400).json({ error: 'Recipe and language are required' });
        }

        // Get active config
        const config = await Config.getActiveConfig();

        // Update config
        await config.update({
            recipe: recipe || config.recipe,
            assistant_id: assistant_id || config.assistant_id,
            language: language || config.language,
            pipeline: pipeline || config.pipeline,
            policies: policies || config.policies
        });

        // Save to YAML file
        await config.saveToYaml();

        res.status(200).json(config);
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

/**
 * @swagger
 * /api/config/reset:
 *   post:
 *     summary: Reset configuration to default
 *     description: Resets the Rasa configuration to default values from YAML file
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Reset successful
 *       500:
 *         description: Server error
 */
router.post('/config/reset', async (req, res) => {
    try {

        const configYamlPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/config.yml');
        const config = await Config.loadFromYaml(configYamlPath);
        res.status(200).json(config);
    } catch (error) {
        console.error('Error resetting config:', error);
        res.status(500).json({ error: 'Failed to reset configuration' });
    }
});

/**
 * @swagger
 * /api/config/load:
 *   post:
 *     summary: Load configuration from YAML
 *     description: Loads the Rasa configuration from config.yml file
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration loaded successfully
 *       500:
 *         description: Server error
 */
router.post('/config/load', async (req, res) => {
    try {

        const config = await Config.loadFromYaml();
        res.status(200).json(config);
    } catch (error) {
        console.error('Error loading config from YAML:', error);
        res.status(500).json({ error: 'Failed to load configuration from YAML' });
    }
});

/**
 * @swagger
 * /api/config/save:
 *   post:
 *     summary: Save configuration to YAML
 *     description: Saves the current configuration to config.yml file
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration saved successfully
 *       500:
 *         description: Server error
 */
router.post('/config/save', async (req, res) => {
    try {

        const config = await Config.getActiveConfig();
        await config.saveToYaml();
        res.status(200).json({
            message: 'Configuration saved to YAML file successfully',
            config
        });
    } catch (error) {
        console.error('Error saving config to YAML:', error);
        res.status(500).json({ error: 'Failed to save configuration to YAML' });
    }
});

/**
 * @swagger
 * /api/config/extract:
 *   post:
 *     summary: Extract configuration from existing config.yml
 *     description: Reads existing config.yml and populates the database with its contents
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Data extracted successfully
 *       500:
 *         description: Extraction failed
 */
router.post('/config/extract', async (req, res) => {
    try {
        console.log('Starting extraction from config.yml file...');


        const configPath = path.join(__dirname, '../../Chabot_FAQ_IDLinkMedia/config.yml');

        if (!fs.existsSync(configPath)) {
            throw new Error(`Config file not found at ${configPath}`);
        }

        // Load config.yml file
        const configContent = yaml.load(fs.readFileSync(configPath, 'utf8'));
        console.log('Config file loaded successfully');

        // Create a new config entry or update existing
        const [config, created] = await Config.findOrCreate({
            where: { name: 'default' },
            defaults: {
                recipe: configContent.recipe || 'default.v1',
                assistant_id: configContent.assistant_id,
                language: configContent.language || 'id',
                pipeline: configContent.pipeline || [],
                policies: configContent.policies || [],
                isActive: true
            }
        });

        if (!created) {
            await config.update({
                recipe: configContent.recipe || config.recipe,
                assistant_id: configContent.assistant_id || config.assistant_id,
                language: configContent.language || config.language,
                pipeline: configContent.pipeline || config.pipeline,
                policies: configContent.policies || config.policies,
                isActive: true
            });
        }

        res.status(200).json({
            message: 'Config data extracted successfully',
            config
        });
    } catch (err) {
        console.error('Extraction error:', err);
        res.status(500).json({
            error: 'Config extraction failed',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

module.exports = router;