const express = require('express');
const router = express.Router();
const { writeYAMLFiles } = require('../utils/yamlWriter');
const { trainRasaModel, getTrainingData, updateTrainingData, removeTrainingDataElement } = require('../services/rasaTrainer');
const { Intent, IntentExample, Story, StoryStep, Rule, RuleStep, DomainResponse, DomainIntent, SessionConfig, ResponseTemplate } = require('../models');

/* RULE CRUD OPERATIONS */

/**
 * @swagger
 * /api/rules:
 *   get:
 *     summary: Get all rules
 *     description: Retrieve all rules with their steps
 *     tags: [Rules]
 *     responses:
 *       200:
 *         description: A list of rules
 *       500:
 *         description: Server error
 */
router.get('/rules', async (req, res) => {
    try {
        const rules = await Rule.findAll({ include: RuleStep });
        res.status(200).json(rules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rules' });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   get:
 *     summary: Get a specific rule
 *     description: Retrieve a specific rule with its steps
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The rule object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.get('/rules/:id', async (req, res) => {
    try {
        const rule = await Rule.findByPk(req.params.id, { include: RuleStep });
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        res.status(200).json(rule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve rule' });
    }
});

/**
 * @swagger
 * /api/rules:
 *   post:
 *     summary: Create a new rule
 *     description: Create a new rule with optional steps
 *     tags: [Rules]
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
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Created rule
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/rules', async (req, res) => {
    try {
        const { name, steps } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Rule name is required' });
        }

        const rule = await Rule.create({ name });

        // Create steps if provided
        if (steps && Array.isArray(steps)) {
            await Promise.all(steps.map(step =>
                RuleStep.create({ ...step, RuleId: rule.id })
            ));
        }

        const createdRule = await Rule.findByPk(rule.id, { include: RuleStep });
        res.status(201).json(createdRule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   put:
 *     summary: Update a rule
 *     description: Update an existing rule and its steps
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated rule
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.put('/rules/:id', async (req, res) => {
    try {
        const { name, steps } = req.body;
        const ruleId = req.params.id;

        const rule = await Rule.findByPk(ruleId);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Update rule name if provided
        if (name) {
            await rule.update({ name });
        }

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
            // First delete existing steps
            await RuleStep.destroy({ where: { RuleId: ruleId } });

            // Then create new steps
            await Promise.all(steps.map(step =>
                RuleStep.create({ ...step, RuleId: ruleId })
            ));
        }

        const updatedRule = await Rule.findByPk(ruleId, { include: RuleStep });
        res.status(200).json(updatedRule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   delete:
 *     summary: Delete a rule
 *     description: Delete a rule and all its steps
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rule deleted successfully
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.delete('/rules/:id', async (req, res) => {
    try {
        const ruleId = req.params.id;
        const rule = await Rule.findByPk(ruleId);

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Delete steps first (cascade delete should handle this, but being explicit)
        await RuleStep.destroy({ where: { RuleId: ruleId } });

        // Delete the rule
        await rule.destroy();

        res.status(200).json({ message: 'Rule deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

module.exports = router;