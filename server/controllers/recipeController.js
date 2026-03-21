const ytSearch = require('yt-search');
const { GoogleGenAI } = require('@google/genai');

const generateRecipe = async (req, res) => {
    try {
        const { ingredients } = req.body;
        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ success: false, error: 'Please provide ingredients.' });
        }

        // Initialize Gemini API (Uses GEMINI_API_KEY from .env)
        // Providing a fallback dummy key so it doesn't crash if env is missing testing locally 
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AIzaSyDummyKeyForNow' });

        const prompt = `
You are an expert chef specializing in zero-waste cooking. 
Create a simple, quick (under 20 mins), and beginner-friendly recipe using primarily these ingredients: ${ingredients.join(', ')}.
Prioritize items that might be expiring soon.

Respond ONLY with a valid JSON object matching this exact structure:
{
    "recipeName": "String (e.g., Spinach Egg Sandwich)",
    "cookingTime": "String (e.g., 15 mins)",
    "tags": ["Array", "of", "Strings"],
    "steps": ["Step 1 description", "Step 2 description"]
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        // Parse JSON response
        const responseText = response.text;
        let recipeDataRaw = responseText;
        if (typeof responseText === 'function') {
            recipeDataRaw = responseText();
        }
        
        if (recipeDataRaw.startsWith('```json')) {
            recipeDataRaw = recipeDataRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        
        const recipeData = JSON.parse(recipeDataRaw);

        // Fetch Youtube Video Details
        const videoSearch = await ytSearch(recipeData.recipeName + ' easy recipe');
        const topVideo = videoSearch.videos.length > 0 ? videoSearch.videos[0] : null;

        let videoDetails = null;
        if (topVideo) {
            videoDetails = {
                title: topVideo.title,
                url: topVideo.url, // e.g., https://youtube.com/watch?v=...
                thumbnail: topVideo.thumbnail // high res image url
            };
        }

        return res.status(200).json({
            success: true,
            recipeName: recipeData.recipeName,
            cookingTime: recipeData.cookingTime,
            tags: recipeData.tags || ['Zero Waste'],
            steps: recipeData.steps,
            video: videoDetails
        });

    } catch (error) {
        console.error('Error generating recipe:', error);
        return res.status(500).json({ success: false, error: 'Failed to generate recipe', details: error.message });
    }
};

module.exports = {
    generateRecipe
};
