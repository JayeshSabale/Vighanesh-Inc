import mongoose from 'mongoose'

const url = 'mongodb://localhost:27017/2-VighneshInc'

const connectDB = (url) => {
  console.log('Connected to database')
  return mongoose.connect(url)
}

export default connectDB
