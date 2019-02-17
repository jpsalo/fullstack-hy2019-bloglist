const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.remove({})

  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body.length).toBe(helper.initialBlogs.length)
})

test('a valid id field is generated', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body[0].id).toBeDefined()
})

test('a blog can be added', async () => {
  const newBlog = {
    title: 'From Need to Product',
    author: 'Jukka-Pekka Salo',
    url: 'https://jpsa.lo',
    likes: 17,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map(b => b.title)
  expect(titles).toContain('From Need to Product')
})

test('blog without title is not added', async () => {
  const newBlog = {
    author: 'Jukka-Pekka Salo',
    url: 'https://jpsa.lo',
    likes: 1,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
})

test('blog without url is not added', async () => {
  const newBlog = {
    title: 'A Cog in the Machine?',
    author: 'Jukka-Pekka Salo',
    likes: 1,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
})

test('a blog without likes is added with zero likes', async () => {
  const newBlog = {
    title: 'A Cog in the Machine?',
    author: 'Jukka-Pekka Salo',
    url: 'https://jpsa.lo',
  }

  const resultBlog = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blog = await Blog.findById(resultBlog.body.id)
  expect(blog.likes).toEqual(0)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length - 1)

  const titles = blogsAtEnd.map(b => b.title)
  expect(titles).not.toContain(blogToDelete.title)
})

test('blog likes can be modified', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToModify = blogsAtStart[0]
  const likesAtStart = blogToModify.likes

  blogToModify.likes += 1

  const resultBlog = await api
    .put(`/api/blogs/${blogToModify.id}`)
    .send(blogToModify)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blog = await Blog.findById(resultBlog.body.id)
  expect(blog.likes).toEqual(likesAtStart + 1)
})

afterAll(() => {
  mongoose.connection.close()
})
