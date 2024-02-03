const Highlight = require('../models/highlight');
const { queryGPT } = require('../utils/queryGPT');

exports.listHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ bookId: req.query.bookId });
    res.json(highlights);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.createHighlight = async (req, res) => {
  try {
    const newHighlight = new Highlight({
      content: req.body.content,
      position: req.body.position,
      comment: req.body.comment,
      id: req.body.id,
      bookId: req.body.bookId,
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
    const updateData = {
      content: req.body.content,
      position: req.body.position,
      comment: req.body.comment,
      id: req.body.id,
      ...(req.body.bookId && { bookId: req.body.bookId }),
    };
    const updatedHighlight = await Highlight.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json(updatedHighlight);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.deleteHighlight = async (req, res) => {
  try {
    await Highlight.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.exportHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ bookId: req.query.bookId });
    let markdown = '';
    highlights.forEach(highlight => {
      markdown += `## Highlight ID: ${highlight.id}\n`;
      markdown += `- Content: ${highlight.content.text || 'Image content'}\n`;
      markdown += `- Comment: ${highlight.comment.text}\n`;
      markdown += `- Page Number: ${highlight.position.pageNumber}\n\n`;
    });
    res.header('Content-Type', 'text/markdown');
    res.attachment('highlights.md');
    res.send(markdown);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.queryGPT = async (req, res) => {
  try {
    const question = req.body.question;
    const answer = await queryGPT(question);
    res.json({ answer: answer });
  } catch (error) {
    res.status(500).send(error);
  }
};
