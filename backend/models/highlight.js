const mongoose = require('mongoose');

const rectSchema = new mongoose.Schema({
  x1: Number,
  y1: Number,
  x2: Number,
  y2: Number,
  width: Number,
  height: Number
}, { _id: false });

const positionSchema = new mongoose.Schema({
  boundingRect: rectSchema,
  rects: [rectSchema],
  pageNumber: Number
}, { _id: false });

const contentSchema = new mongoose.Schema({
  text: { type: String, default: null },
  image: { type: String, default: null }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  text: String,
  emoji: { type: String, default: "" }
}, { _id: false });

const highlightSchema = new mongoose.Schema({
  content: contentSchema,
  position: positionSchema,
  comment: commentSchema,
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'books' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
});

const Highlight = mongoose.model('Highlight', highlightSchema);

module.exports = Highlight;
