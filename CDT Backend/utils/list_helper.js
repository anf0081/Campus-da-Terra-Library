const dummy = (books) => {
  console.log(books)
  return 1
}

const totalLikes = (books) => {
  const likes = books.map(book => book.likes)
  const sumLikes = (sum, likes) => {
    return sum + likes
  }
  return books.length === 0
    ? 0
    : likes.reduce(sumLikes, 0)
}

const favoriteBook = (books) => {
  const likes = books.map(book => book.likes)
  const favoreiteIndex = likes.indexOf(Math.max(...likes))
  return books[favoreiteIndex]
}

const mostBooks = (books) => {
  const authors = books.map(book => book.author)
  let countBooks = authors.reduce((count, author) => {
    count[author] = (count[author] ?? 0) + 1
    return count
  }, {})
  console.log(countBooks)
  let countBooksArr = Object.entries(countBooks)
  countBooksArr.sort((a, b) => b[1] - a[1])
  const mostAuthor = { author: countBooksArr[0][0], count: countBooksArr[0][1] }
  return mostAuthor
}

const mostLikes = (books) => {
  let countLikes = books.reduce((likes, book) => {
    likes[book.author] = (likes[book.author] ?? 0) + (book.likes ?? 0)
    return likes
  }, {})
  console.log(countLikes)
  let countLikesArr = Object.entries(countLikes)
  countLikesArr.sort((a, b) => b[1] - a[1])
  const likedAuthor = { author: countLikesArr[0][0], likes: countLikesArr[0][1] }
  return likedAuthor
}

module.exports = {
  dummy, totalLikes, favoriteBook, mostBooks, mostLikes
}