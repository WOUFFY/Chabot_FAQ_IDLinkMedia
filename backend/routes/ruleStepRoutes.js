const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel, getTrainingData, updateTrainingData, removeTrainingDataElement } = require('../services/rasaTrainer');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, DomainResponse, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');

/* RULE STEP CRUD OPERATIONS */

/**
 * @swagger
 * /api/rule-steps:
 *   get:
 *     summary: Get all rule steps
 *     description: Retrieve all rule steps
 *     tags: [Rule Steps]
 *     responses:
 *       200:
 *         description: A list of rule steps
 *       500:
 *         description: Server error
 */
router.get('/rule-steps', async (req, res) => {
    try {
        const steps = await RuleStep.findAll({
            include: [{ model: Rule, attributes: ['name'] }],
            order: [['RuleId', 'ASC'], ['order', 'ASC']]
        });
        res.status(200).json(steps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rule steps' });
    }
});

/**
 * @swagger
 * /api/rule-steps/{id}:
 *   get:
 *     summary: Get a specific rule step
 *     description: Retrieve a specific rule step by ID
 *     tags: [Rule Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rule step ID
 *     responses:
 *       200:
 *         description: The rule step
 *       404:
 *         description: Rule step not found
 *       500:
 *         description: Server error
 */
router.get('/rule-steps/:id', async (req, res) => {
    try {
        const step = await RuleStep.findByPk(req.params.id, {
            include: [{ model: Rule, attributes: ['name'] }]
        });

        if (!step) {
            return res.status(404).json({ error: 'Rule step not found' });
        }

        res.status(200).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rule step' });
    }
});

/**
 * @swagger
 * /api/rule-steps:
 *   post:
 *     summary: Create a new rule step
 *     description: Add a new step to a rule
 *     tags: [Rule Steps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - RuleId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               RuleId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created rule step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced rule not found
 *       500:
 *         description: Server error
 */
router.post('/rule-steps', async (req, res) => {
    try {
        const { type, name, order, RuleId } = req.body;

        if (!type || !name || !RuleId) {
            return res.status(400).json({ error: 'Type, name, and RuleId are required' });
        }

        if (type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // Check if the rule exists
        const rule = await Rule.findByPk(RuleId);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // If order is not provided, place at the end
        let nextOrder = 0;
        if (order === undefined) {
            const lastStep = await RuleStep.findOne({
                where: { RuleId },
                order: [['order', 'DESC']]
            });

            nextOrder = lastStep ? lastStep.order + 1 : 0;
        } else {
            nextOrder = order;
        }

        const step = await RuleStep.create({
            type,
            name,
            order: nextOrder,
            RuleId
        });

        res.status(201).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create rule step' });
    }
});

/**
 * @swagger
 * /api/rule-steps/{id}:
 *   put:
 *     summary: Update a rule step
 *     description: Update an existing rule step
 *     tags: [Rule Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rule step ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               RuleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated rule step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Rule step or referenced rule not found
 *       500:
 *         description: Server error
 */
router.put('/rule-steps/:id', async (req, res) => {
    try {
        const { type, name, order, RuleId } = req.body;
        const stepId = req.params.id;

        const step = await RuleStep.findByPk(stepId);
        if (!step) {
            return res.status(404).json({ error: 'Rule step not found' });
        }

        // If type is provided, validate it
        if (type && type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // If RuleId is provided, check if the rule exists
        if (RuleId) {
            const rule = await Rule.findByPk(RuleId);
            if (!rule) {
                return res.status(404).json({ error: 'Rule not found' });
            }
        }

        // Update the step
        const updateData = {};
        if (type) updateData.type = type;
        if (name) updateData.name = name;
        if (order !== undefined) updateData.order = order;
        if (RuleId) updateData.RuleId = RuleId;

        await step.update(updateData);

        const updatedStep = await RuleStep.findByPk(stepId, {
            include: [{ model: Rule, attributes: ['name'] }]
        });

        res.status(200).json(updatedStep);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update rule step' });
    }
});

/**
 * @swagger
 * /api/rule-steps/{id}:
 *   delete:
 *     summary: Delete a rule step
 *     description: Remove a rule step
 *     tags: [Rule Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rule step ID
 *     responses:
 *       200:
 *         description: Rule step deleted successfully
 *       404:
 *         description: Rule step not found
 *       500:
 *         description: Server error
 */
router.delete('/rule-steps/:id', async (req, res) => {
    try {
        const stepId = req.params.id;
        const step = await RuleStep.findByPk(stepId);

        if (!step) {
            return res.status(404).json({ error: 'Rule step not found' });
        }

        await step.destroy();
        res.status(200).json({ message: 'Rule step deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete rule step' });
    }
});

module.exports = router;