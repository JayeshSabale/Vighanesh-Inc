import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import User from './models/userModel.js'
import Book from './models/bookModel.js'
import Rental from './models/rentalModel.js'
import bodyParser from 'body-parser'

dotenv.config()
const app = express()

// Middleware
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

// Static folder for uploaded images
app.use('/uploads', express.static('uploads'))

// Database Connection
await mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost:27017/VighneshInc',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)

console.log('MongoDB connected')

// Configure Multer for File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/'
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    let user = await User.findOne({ email })
    if (user) return res.status(400).json({ message: 'User already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)

    user = new User({ name, email, password: hashedPassword })
    await user.save()

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default_secret',
      {
        expiresIn: '1h',
      }
    )

    res.status(201).json({ token, userId: user._id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default_secret',
      {
        expiresIn: '1h',
      }
    )

    res.json({ token, userId: user._id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.post('/books', upload.single('coverImage'), async (req, res) => {
  try {
    const { title, author, genre } = req.body
    console.log(title, author, genre)

    const coverImage = req.file ? req.file.path : null

    const book = new Book({ title, author, genre, coverImage })
    await book.save()

    res.status(201).json(book)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.get('/books', async (req, res) => {
  try {
    const { page = 1, limit = 10, genre } = req.query
    const filter = genre ? { genre } : {}

    const books = await Book.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    const count = await Book.countDocuments(filter)

    res.json({
      books,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.put('/books/:id', async (req, res) => {
  try {
    const { title, author, genre } = req.body
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, genre },
      { new: true }
    )

    if (!book) return res.status(404).json({ message: 'Book not found' })

    res.json(book)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    res.json({ message: 'Book deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.post('/rentals', async (req, res) => {
  try {
    const { userId, bookId } = req.body
    const existingRental = await Rental.findOne({
      userId,
      bookId,
      returned: false,
    })
    if (existingRental)
      return res
        .status(400)
        .json({ message: 'You have already rented this book' })

    const rental = new Rental({ userId, bookId })
    await rental.save()

    res.status(201).json(rental)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

app.put('/rentals/:id/return', async (req, res) => {
  try {
    const rental = await Rental.findByIdAndUpdate(
      req.params.id,
      { returned: true, returnDate: new Date() },
      { new: true }
    )

    if (!rental) return res.status(404).json({ message: 'Rental not found' })

    res.json({ message: 'Book returned successfully', rental })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
