const _ = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  if (blogs.length === 1) {
    return blogs[0].likes
  }

  if (blogs.length === 0) {
    return 0
  }

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 1) {
    return blogs[0]
  }

  if (blogs.length === 0) {
    return null
  }

  const mostLikes = blogs.reduce((prev, current) => (prev.likes > current.likes) ? prev : current)
  return mostLikes
}

const mostBlogs = (blogs) => {
  if (blogs.length === 1) {
    return {
      author: blogs[0].author,
      blogs: 1,
    }
  }

  if (blogs.length === 0) {
    return null
  }

  // [{ author: '...', blogs: X }]
  // https://stackoverflow.com/a/37347919/7010222
  const result = _(blogs)
    .groupBy('author')
    .map((blogs, author) => ( { author, blogs: blogs.length } ))
    .value()

  return _.maxBy(result, 'author')
}

const mostLikes = (blogs) => {
  if (blogs.length === 1) {
    return {
      author: blogs[0].author,
      likes: blogs[0].likes,
    }
  }

  if (blogs.length === 0) {
    return null
  }

  const result = _(blogs)
    .groupBy('author')
    .map((objs, key) => ({
      'author': key,
      'likes': _.sumBy(objs, 'likes')
    }))
    .value()

  return _.maxBy(result, 'likes')
}

module.exports = {
  dummy,
  favoriteBlog,
  mostBlogs,
  mostLikes,
  totalLikes,
}
