const express = require('express');
const router = express.Router();
const { Intent, IntentExample } = require('../models');

/* INTENT CRUD OPERATIONS */

/**
 * @swagger
 * /api/intents:
 *   get:
 *     summary: Get all intents
 *     description: Retrieve all intents with their examples from the database
 *     tags: [Intents]
 *     responses:
 *       200:
 *         description: A list of intents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Intent'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/intents', async (req, res) => {
    try {
        const intents = await Intent.findAll({ include: IntentExample });
        res.status(200).json(intents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intents' });
    }
});

/**
 * @swagger
 * /api/intents/{id}:
 *   get:
 *     summary: Get a specific intent
 *     description: Retrieve a specific intent with its examples by ID
 *     tags: [Intents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent ID
 *     responses:
 *       200:
 *         description: The intent object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Intent'
 *       404:
 *         description: Intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/intents/:id', async (req, res) => {
    try {
        const intent = await Intent.findByPk(req.params.id, { include: IntentExample });
        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }
        res.status(200).json(intent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve intent' });
    }
});

/**
 * @swagger
 * /api/intents:
 *   post:
 *     summary: Create a new intent
 *     description: Create a new intent with optional examples
 *     tags: [Intents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Intent name
 *               examples:
 *                 type: array
 *                 description: Example utterances
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created intent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Intent'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/intents', async (req, res) => {
    try {
        const { name, examples } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Intent name is required' });
        }

        const intent = await Intent.create({ name });

        // Create examples if provided
        if (examples && Array.isArray(examples)) {
            await Promise.all(examples.map(text =>
                IntentExample.create({ text, IntentId: intent.id })
            ));
        }

        const createdIntent = await Intent.findByPk(intent.id, { include: IntentExample });
        res.status(201).json(createdIntent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create intent' });
    }
});

/**
 * @swagger
 * /api/intents/{id}:
 *   put:
 *     summary: Update an intent
 *     description: Update an existing intent and its examples
 *     tags: [Intents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New intent name
 *               examples:
 *                 type: array
 *                 description: New example utterances (replaces all existing)
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated intent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Intent'
 *       404:
 *         description: Intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/intents/:id', async (req, res) => {
    try {
        const { name, examples } = req.body;
        const intentId = req.params.id;

        const intent = await Intent.findByPk(intentId);
        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }

        // Update intent name if provided
        if (name) {
            await intent.update({ name });
        }

        // Update examples if provided
        if (examples && Array.isArray(examples)) {
            // First delete existing examples
            await IntentExample.destroy({ where: { IntentId: intentId } });

            // Then create new examples
            await Promise.all(examples.map(text =>
                IntentExample.create({ text, IntentId: intentId })
            ));
        }

        const updatedIntent = await Intent.findByPk(intentId, { include: IntentExample });
        res.status(200).json(updatedIntent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update intent' });
    }
});

/**
 * @swagger
 * /api/intents/{id}:
 *   delete:
 *     summary: Delete an intent
 *     description: Delete an intent and all its examples
 *     tags: [Intents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The intent ID
 *     responses:
 *       200:
 *         description: Intent deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Intent deleted successfully
 *       404:
 *         description: Intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/intents/:id', async (req, res) => {
    try {
        const intentId = req.params.id;
        const intent = await Intent.findByPk(intentId);

        if (!intent) {
            return res.status(404).json({ error: 'Intent not found' });
        }

        // Delete examples first (cascade delete should handle this, but being explicit)
        await IntentExample.destroy({ where: { IntentId: intentId } });

        // Delete the intent
        await intent.destroy();

        res.status(200).json({ message: 'Intent deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete intent' });
    }
});

module.exports = router;