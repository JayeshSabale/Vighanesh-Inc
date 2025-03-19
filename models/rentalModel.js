import mongoose from 'mongoose'

const rentalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,

      required: true,
    },
    bookId: {
      type: String,

      required: true,
    },
    rentalDate: { type: Date, default: Date.now },
    returnDate: { type: Date },
    returned: { type: Boolean, default: false }, // If book is returned
  },
  { timestamps: true }
)

export default mongoose.model('Rental', rentalSchema)
