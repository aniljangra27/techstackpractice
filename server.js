require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const deckRoutes = require('./routes/decks');

const app = express();
app.use(express.json());  // JSON body parser

// Connect to MongoDB - specify gsgen database
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gsgen';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Routes
app.use('/api/decks', deckRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
