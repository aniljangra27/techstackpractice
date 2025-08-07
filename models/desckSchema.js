const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  slideId: { type: String, required: true },
  layout: { type: String, required: true },
  elements: { type: mongoose.Schema.Types.Mixed, required: true }  // Flexible
}, { _id: false });

const deckSchema = new mongoose.Schema({
  deckId: { type: String, required: true },
  title: { type: String, required: true },
  outline: String,
  themeId: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.String,
  updatedBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  slidesJson: {
    slides: { type: [slideSchema], default: [] }
  }
});

// Specify collection name explicitly to get 'deck' instead of 'decks'
module.exports = mongoose.model('Deck', deckSchema, 'deck');
