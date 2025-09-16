const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')

const booksNull = []

const booksOne = [
  {
    title: 'Book 1',
    author: 'Anon 1',
    url: 'https://example1.com/',
    likes: 4,
    userId: '68c75c16961f1fb31cdd512d'
  }
]

const books = [
  {
    title: 'Book 1',
    author: 'Anon 1',
    url: 'https://example1.com/',
    likes: 4,
    userId: '68c75c16961f1fb31cdd512d'
  },
  {
    title: 'Book 2',
    author: 'Anon 2',
    url: 'https://example2.com/',
    likes: 80,
    userId: '68c75c16961f1fb31cdd512d'
  },
  {
    title: 'Book 3',
    author: 'Anon 3',
    url: 'https://example3.com/',
    likes: 402,
    userId: '68c75c16961f1fb31cdd512d'
  },
  {
    title: 'Book 4',
    author: 'Anon 2',
    url: 'https://example4.com/',
    likes: 12,
    userId: '68c75c16961f1fb31cdd512d'
  },
  {
    title: 'Book 5',
    author: 'Anon 2',
    url: 'https://example5.com/',
    likes: 42,
    userId: '68c75c16961f1fb31cdd512d'
  },
  {
    title: 'Book 6',
    author: 'Anon 3',
    url: 'https://example6.com/',
    likes: 4,
    userId: '68c75c16961f1fb31cdd512d'
  }
]

describe('dummy', () => {
  test('dummy returns one', () => {
    const result = listHelper.dummy(booksNull)
    assert.strictEqual(result, 1)
  })
})

describe('total likes', () => {
  test('empty list returns zero', () => {
    const result = listHelper.totalLikes(booksNull)
    assert.strictEqual(result, 0)
  })
  test('list only has one object, equals like of object', () => {
    const result = listHelper.totalLikes(booksOne)
    assert.strictEqual(result, 4)
  })
  test('bigger list is calculated correctly', () => {
    let sumLikes = 0
    for (const book of books) {
      sumLikes = sumLikes + book.likes
    }
    const result = listHelper.totalLikes(books)
    assert.strictEqual(result, sumLikes)
  })

  describe('favorite Book', () => {
    test('returns the correct Book', () => {
      const result = listHelper.favoriteBook(books)
      assert.deepStrictEqual(result, books[2])
    })
  })

  describe('most Books', () => {
    test('returns the author with most books', () => {
      const expected = { author: 'Anon 2', count: 3 }
      const result = listHelper.mostBooks(books)
      assert.deepStrictEqual(result, expected)
    })
  })

  describe('most Likes', () => {
    test('returns the author with most Likes', () => {
      const expected = { author: 'Anon 3', likes: 406 }
      const result = listHelper.mostLikes(books)
      assert.deepStrictEqual(result, expected)
    })
  })
})