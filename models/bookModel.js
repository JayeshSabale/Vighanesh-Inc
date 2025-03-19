import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, required: true },
    coverImage: { type: String }, // Path to uploaded image
    available: { type: Boolean, default: true }, // Track availability
  },
  { timestamps: true }
)

export default mongoose.model('Book', bookSchema)
