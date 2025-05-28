const express = require('express');
const router = express.Router();
const { Story, StoryStep } = require('../models');

/* STORY CRUD OPERATIONS */

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: Get all stories
 *     description: Retrieve all stories with their steps
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: A list of stories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Story'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stories', async (req, res) => {
    try {
        const stories = await Story.findAll({ include: StoryStep });
        res.status(200).json(stories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve stories' });
    }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     summary: Get a specific story
 *     description: Retrieve a specific story with its steps
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story ID
 *     responses:
 *       200:
 *         description: The story object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       404:
 *         description: Story not found
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
router.get('/stories/:id', async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id, { include: StoryStep });
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        res.status(200).json(story);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve story' });
    }
});

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Create a new story
 *     description: Create a new story with optional steps
 *     tags: [Stories]
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
 *                 description: Story name
 *               steps:
 *                 type: array
 *                 description: Story steps
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [intent, action]
 *                     name:
 *                       type: string
 *     responses:
 *       201:
 *         description: Created story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
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
router.post('/stories', async (req, res) => {
    try {
        const { name, steps } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Story name is required' });
        }

        const story = await Story.create({ name });

        // Create steps if provided
        if (steps && Array.isArray(steps)) {
            await Promise.all(steps.map(step =>
                StoryStep.create({ ...step, StoryId: story.id })
            ));
        }

        const createdStory = await Story.findByPk(story.id, { include: StoryStep });
        res.status(201).json(createdStory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create story' });
    }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   put:
 *     summary: Update a story
 *     description: Update an existing story and its steps
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [intent, action]
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Updated story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       404:
 *         description: Story not found
 *       500:
 *         description: Server error
 */
router.put('/stories/:id', async (req, res) => {
    try {
        const { name, steps } = req.body;
        const storyId = req.params.id;

        const story = await Story.findByPk(storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Update story name if provided
        if (name) {
            await story.update({ name });
        }

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
            // First delete existing steps
            await StoryStep.destroy({ where: { StoryId: storyId } });

            // Then create new steps
            await Promise.all(steps.map(step =>
                StoryStep.create({ ...step, StoryId: storyId })
            ));
        }

        const updatedStory = await Story.findByPk(storyId, { include: StoryStep });
        res.status(200).json(updatedStory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update story' });
    }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   delete:
 *     summary: Delete a story
 *     description: Delete a story and all its steps
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The story ID
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Story not found
 *       500:
 *         description: Server error
 */
router.delete('/stories/:id', async (req, res) => {
    try {
        const storyId = req.params.id;
        const story = await Story.findByPk(storyId);

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Delete steps first (cascade delete should handle this, but being explicit)
        await StoryStep.destroy({ where: { StoryId: storyId } });

        // Delete the story
        await story.destroy();

        res.status(200).json({ message: 'Story deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete story' });
    }
});

module.exports = router;