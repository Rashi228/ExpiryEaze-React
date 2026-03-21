const express = require('express');
const router = express.Router();
const { generateRecipe } = require('../controllers/recipeController');

// @route   POST /api/v1/recipes/generate
// @desc    Generate a recipe using AI and find YouTube video
// @access  Public (or Private depending on your auth middleware setup)
router.post('/generate', generateRecipe);

module.exports = router;
