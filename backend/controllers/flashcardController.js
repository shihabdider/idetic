const Flashcard = require('../models/flashcard');

exports.listFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.user._id });
    res.json(flashcards);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.createFlashcard = async (req, res) => {
  try {
    const newFlashcard = new Flashcard({
      frontText: req.body.frontText,
      backText: req.body.backText,
      highlightId: req.body.highlightId,
      userId: req.user._id
    });
    const savedFlashcard = await newFlashcard.save();
    res.status(201).send(savedFlashcard);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).send('Flashcard not found');
    }
    res.json(flashcard);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateFlashcard = async (req, res) => {
  try {
    const updatedFlashcard = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json(updatedFlashcard);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.deleteFlashcard = async (req, res) => {
  try {
    const deletedFlashcard = await Flashcard.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
};
