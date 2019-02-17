const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({})
    .find({}).populate('user', { username: 1, name: 1, id: 1 })
  res.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (req, res, next) => {
  const body = req.body

  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)
    if (!req.token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(body.userId)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: user._id,
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    res.json(savedBlog.toJSON())
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (req, res, next) => {
  const body = req.body

  try {

    const decodedToken = jwt.verify(req.token, process.env.SECRET)
    if (!req.token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const blog = await Blog.findById(req.params.id)

    if (!body.userId || blog.user.toString() !== body.userId.toString()) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    await Blog.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (req, res, next) => {
  const body = req.body

  const blog = {
    likes: body.likes,
  }

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true })
    res.json(updatedBlog.toJSON())
  } catch(exception) {
    next(exception)
  }
})

module.exports = blogsRouter
