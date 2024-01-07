const Highlight = require('../models/highlight');

exports.listHighlightsForBook = async (req, res) => {
  try {
    const highlights = await Highlight.find({ userId: req.user._id, bookId: req.params.bookId });
    res.json(highlights);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.listHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ userId: req.user._id });
    res.json(highlights);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.createHighlight = async (req, res) => {
  try {
    const newHighlight = new Highlight({
      text: req.body.text,
      location: req.body.location,
      bookId: req.body.bookId,
      userId: req.user._id
    });
    const savedHighlight = await newHighlight.save();
    res.status(201).send(savedHighlight);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) {
      return res.status(404).send('Highlight not found');
    }
    res.json(highlight);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateHighlight = async (req, res) => {
  try {
    const updatedHighlight = await Highlight.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json(updatedHighlight);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.deleteHighlight = async (req, res) => {
  try {
    const deletedHighlight = await Highlight.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.exportHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ userId: req.user._id });
    let markdown = '';
    highlights.forEach(highlight => {
      markdown += `## Highlight Location: ${highlight.location}\n`;
      markdown += `${highlight.text}\n\n`;
    });
    res.header('Content-Type', 'text/markdown');
    res.attachment('highlights.md');
    res.send(markdown);
  } catch (error) {
    res.status(500).send(error);
  }
};
