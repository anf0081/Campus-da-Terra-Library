const mongoose = require('mongoose')
require('dotenv').config()
const Book = require('./models/book')

const title = process.argv[2]
const author = process.argv[3]
const bookUrl = process.argv[4]
const likes = process.argv[5]

const url = process.env.TEST_MONGODB_URI

mongoose.set('strictQuery',false)

mongoose.connect(url)


if ( title && author && bookUrl && likes ) {
  const book = new Book({
    title: typeof title === 'string' ? title : title.toString,
    author: typeof author === 'string' ? author : author.toString,
    url: typeof bookUrl === 'string' ? bookUrl : bookUrl.toString,
    likes: typeof likes === 'number' ? likes : parseInt(likes, 10)
  })
  book.save().then(() => {
    console.log('Book saved!')
    mongoose.connection.close()
  })
} else {
  Book.find({}).then(result => {
    result.forEach(book => {
      console.log(book)
    })
    mongoose.connection.close()
  })
}