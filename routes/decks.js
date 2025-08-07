const express = require('express');
const router = express.Router();
const Deck = require('../models/desckSchema');

// CREATE Deck
router.post('/', async (req, res) => {
  try {
    const deck = new Deck(req.body);
    await deck.save();
    res.status(201).json(deck);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ All Decks
router.get('/', async (req, res) => {
  try {
    const decks = await Deck.find();
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ One Deck
router.get('/:id', async (req, res) => {
  try {
    // Use findOne with deckId field instead of findById with _id
    const deck = await Deck.findOne({ deckId: req.params.id });
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Deck
router.put('/:id', async (req, res) => {
  try {
    // Use findOneAndUpdate with deckId field instead of findByIdAndUpdate with _id
    const deck = await Deck.findOneAndUpdate({ deckId: req.params.id }, req.body, { new: true });
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json(deck);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE Deck
router.delete('/:id', async (req, res) => {
  try {
    // Use findOneAndDelete with deckId field instead of findByIdAndDelete with _id
    const deck = await Deck.findOneAndDelete({ deckId: req.params.id });
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json({ message: 'Deck deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:deckId/slide/:slideId', async (req, res) => {
    const { deckId, slideId } = req.params;
    const updateData = req.body;
  
    try {
      // Use findOne with deckId field instead of findById with _id
      const deck = await Deck.findOne({ deckId: deckId });
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
      
      const slideIndex = deck.slidesJson.slides.findIndex(s => s.slideId === slideId);
  
      if (slideIndex === -1) return res.status(404).json({ error: 'Slide not found' });
  
      // Update the slide with new data (merge, don't replace)
      if (updateData.layout) {
        deck.slidesJson.slides[slideIndex].layout = updateData.layout;
      }
      if (updateData.elements) {
        // Merge new elements with existing elements to preserve existing fields
        deck.slidesJson.slides[slideIndex].elements = {
          ...deck.slidesJson.slides[slideIndex].elements,
          ...updateData.elements
        };
      }
      
      deck.updatedAt = new Date();
      await deck.save();
  
      res.json({ message: 'Slide updated', slide: deck.slidesJson.slides[slideIndex] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;
