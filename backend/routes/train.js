const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel, getTrainingData, updateTrainingData, removeTrainingDataElement } = require('../services/rasaTrainer');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, DomainResponse, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');


/**
 * @swagger
 * /api/train:
 *   post:
 *     summary: Train a new Rasa model
 *     description: Loads data from DB, generates YAML files, triggers Rasa training, and saves the model
 *     tags: [Training]
 *     responses:
 *       200:
 *         description: Training completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Training complete
 *                 model:
 *                   type: string
 *                   example: model_1622128812345.tar.gz
 *       500:
 *         description: Training failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/train', async (req, res) => {
    try {
        // Load all data from database
        const intents = await Intent.findAll({ include: IntentExample });
        const stories = await Story.findAll({ include: StoryStep });
        const rules = await Rule.findAll({ include: RuleStep });

        // Transform database objects into the structure needed for YAML generation
        const transformedIntents = intents.map(i => ({
            name: i.name,
            examples: i.IntentExamples.map(e => e.text)
        }));

        const transformedStories = stories.map(s => ({
            name: s.name,
            steps: s.StorySteps
        }));

        const transformedRules = rules.map(r => ({
            name: r.name,
            steps: r.RuleSteps
        }));

        // Generate YAML files from transformed data
        await writeYAMLFiles({ intents: transformedIntents, stories: transformedStories, rules: transformedRules });

        // Trigger Rasa training process and get model filename
        const model = await trainRasaModel();

        // Return success with model information
        res.status(200).json({ message: 'Training complete', model });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Training failed' });
    }
});



module.exports = router;