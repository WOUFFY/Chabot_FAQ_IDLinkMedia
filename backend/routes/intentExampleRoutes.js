const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel, getTrainingData, updateTrainingData, removeTrainingDataElement } = require('../services/rasaTrainer');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, DomainResponse, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');

/* INTENT EXAMPLE CRUD OPERATIONS */

/**
 * @swagger
 * /api/intent-examples:
 *   get:
 *     summary: Get all intent examples
 *     description: Retrieve all intent examples
 *     tags: [Intent Examples]
 *     responses:
 *       200:
 *         description: A list of intent examples
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   text:
 *                     type: string
 *                   IntentId:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get('/intent-examples', async (req, res) => {
    try {
        const examples = await IntentExample.findAll({
            include: [{ model: Intent, attributes: ['name'] }]
        });
        res.status(200).json(examples);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intent examples' });
    }
});

/**
 * @swagger
 * /api/intent-examples/{id}:
 *   get:
 *     summary: Get a specific intent example
 *     description: Retrieve a specific intent example by ID
 *     tags: [Intent Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent example ID
 *     responses:
 *       200:
 *         description: The intent example
 *       404:
 *         description: Intent example not found
 *       500:
 *         description: Server error
 */
router.get('/intent-examples/:id', async (req, res) => {
    try {
        const example = await IntentExample.findByPk(req.params.id, {
            include: [{ model: Intent, attributes: ['name'] }]
        });

        if (!example) {
            return res.status(404).json({ error: 'Intent example not found' });
        }

        res.status(200).json(example);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intent example' });
    }
});

/**
 * @swagger
 * /api/intent-examples:
 *   post:
 *     summary: Create a new intent example
 *     description: Add a new example to an intent
 *     tags: [Intent Examples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - IntentId
 *             properties:
 *               text:
 *                 type: string
 *                 description: The example text
 *               IntentId:
 *                 type: integer
 *                 description: The ID of the intent this example belongs to
 *     responses:
 *       201:
 *         description: Created intent example
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced intent not found
 *       500:
 *         description: Server error
 */
router.post('/intent-examples', async (req, res) => {
    try {
        const { text, IntentId } = req.body;

        if (!text || !IntentId) {
            return res.status(400).json({ error: 'Text and IntentId are required' });
        }

        // Check if the intent exists
        const intent = await Intent.findByPk(IntentId);
        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }

        const example = await IntentExample.create({ text, IntentId });
        res.status(201).json(example);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create intent example' });
    }
});

/**
 * @swagger
 * /api/intent-examples/{id}:
 *   put:
 *     summary: Update an intent example
 *     description: Update an existing intent example
 *     tags: [Intent Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent example ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The new example text
 *               IntentId:
 *                 type: integer
 *                 description: The ID of the intent this example belongs to
 *     responses:
 *       200:
 *         description: Updated intent example
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Intent example or referenced intent not found
 *       500:
 *         description: Server error
 */
router.put('/intent-examples/:id', async (req, res) => {
    try {
        const { text, IntentId } = req.body;
        const exampleId = req.params.id;

        const example = await IntentExample.findByPk(exampleId);
        if (!example) {
            return res.status(404).json({ error: 'Intent example not found' });
        }

        // If IntentId is provided, check if the intent exists
        if (IntentId) {
            const intent = await Intent.findByPk(IntentId);
            if (!intent) {
                return res.status(404).json({ error: 'Intent not found' });
            }
        }

        // Update the example
        const updateData = {};
        if (text) updateData.text = text;
        if (IntentId) updateData.IntentId = IntentId;

        await example.update(updateData);

        const updatedExample = await IntentExample.findByPk(exampleId, {
            include: [{ model: Intent, attributes: ['name'] }]
        });

        res.status(200).json(updatedExample);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update intent example' });
    }
});

/**
 * @swagger
 * /api/intent-examples/{id}:
 *   delete:
 *     summary: Delete an intent example
 *     description: Remove an intent example
 *     tags: [Intent Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent example ID
 *     responses:
 *       200:
 *         description: Intent example deleted successfully
 *       404:
 *         description: Intent example not found
 *       500:
 *         description: Server error
 */
router.delete('/intent-examples/:id', async (req, res) => {
    try {
        const exampleId = req.params.id;
        const example = await IntentExample.findByPk(exampleId);

        if (!example) {
            return res.status(404).json({ error: 'Intent example not found' });
        }

        await example.destroy();
        res.status(200).json({ message: 'Intent example deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete intent example' });
    }
});

module.exports = router;