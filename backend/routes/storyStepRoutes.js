const express = require('express');
const router = express.Router();
const { Story, StoryStep } = require('../models');

/* STORY STEP CRUD OPERATIONS */

/**
 * @swagger
 * /api/story-steps:
 *   get:
 *     summary: Get all story steps
 *     description: Retrieve all story steps
 *     tags: [Story Steps]
 *     responses:
 *       200:
 *         description: A list of story steps
 *       500:
 *         description: Server error
 */
router.get('/story-steps', async (req, res) => {
    try {
        const steps = await StoryStep.findAll({
            include: [{ model: Story, attributes: ['name'] }],
            order: [['StoryId', 'ASC'], ['order', 'ASC']]
        });
        res.status(200).json(steps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve story steps' });
    }
});

/**
 * @swagger
 * /api/story-steps/{id}:
 *   get:
 *     summary: Get a specific story step
 *     description: Retrieve a specific story step by ID
 *     tags: [Story Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story step ID
 *     responses:
 *       200:
 *         description: The story step
 *       404:
 *         description: Story step not found
 *       500:
 *         description: Server error
 */
router.get('/story-steps/:id', async (req, res) => {
    try {
        const step = await StoryStep.findByPk(req.params.id, {
            include: [{ model: Story, attributes: ['name'] }]
        });

        if (!step) {
            return res.status(404).json({ error: 'Story step not found' });
        }

        res.status(200).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve story step' });
    }
});

/**
 * @swagger
 * /api/story-steps:
 *   post:
 *     summary: Create a new story step
 *     description: Add a new step to a story
 *     tags: [Story Steps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - StoryId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [intent, action]
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               StoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created story step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced story not found
 *       500:
 *         description: Server error
 */
router.post('/story-steps', async (req, res) => {
    try {
        const { type, name, order, StoryId } = req.body;

        if (!type || !name || !StoryId) {
            return res.status(400).json({ error: 'Type, name, and StoryId are required' });
        }

        if (type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // Check if the story exists
        const story = await Story.findByPk(StoryId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // If order is not provided, place at the end
        let nextOrder = 0;
        if (order === undefined) {
            const lastStep = await StoryStep.findOne({
                where: { StoryId },
                order: [['order', 'DESC']]
            });

            nextOrder = lastStep ? lastStep.order + 1 : 0;
        } else {
            nextOrder = order;
        }

        const step = await StoryStep.create({
            type,
            name,
            order: nextOrder,
            StoryId
        });

        res.status(201).json(step);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create story step' });
    }
});

/**
 * @swagger
 * /api/story-steps/{id}:
 *   put:
 *     summary: Update a story step
 *     description: Update an existing story step
 *     tags: [Story Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story step ID
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
 *               StoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated story step
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Story step or referenced story not found
 *       500:
 *         description: Server error
 */
router.put('/story-steps/:id', async (req, res) => {
    try {
        const { type, name, order, StoryId } = req.body;
        const stepId = req.params.id;

        const step = await StoryStep.findByPk(stepId);
        if (!step) {
            return res.status(404).json({ error: 'Story step not found' });
        }

        // If type is provided, validate it
        if (type && type !== 'intent' && type !== 'action') {
            return res.status(400).json({ error: 'Type must be either "intent" or "action"' });
        }

        // If StoryId is provided, check if the story exists
        if (StoryId) {
            const story = await Story.findByPk(StoryId);
            if (!story) {
                return res.status(404).json({ error: 'Story not found' });
            }
        }

        // Update the step
        const updateData = {};
        if (type) updateData.type = type;
        if (name) updateData.name = name;
        if (order !== undefined) updateData.order = order;
        if (StoryId) updateData.StoryId = StoryId;

        await step.update(updateData);

        const updatedStep = await StoryStep.findByPk(stepId, {
            include: [{ model: Story, attributes: ['name'] }]
        });

        res.status(200).json(updatedStep);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update story step' });
    }
});

/**
 * @swagger
 * /api/story-steps/{id}:
 *   delete:
 *     summary: Delete a story step
 *     description: Remove a story step
 *     tags: [Story Steps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story step ID
 *     responses:
 *       200:
 *         description: Story step deleted successfully
 *       404:
 *         description: Story step not found
 *       500:
 *         description: Server error
 */
router.delete('/story-steps/:id', async (req, res) => {
    try {
        const stepId = req.params.id;
        const step = await StoryStep.findByPk(stepId);

        if (!step) {
            return res.status(404).json({ error: 'Story step not found' });
        }

        await step.destroy();
        res.status(200).json({ message: 'Story step deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete story step' });
    }
});

module.exports = router;