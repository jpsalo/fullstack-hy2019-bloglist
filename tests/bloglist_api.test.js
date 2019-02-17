const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const User = require('../models/user')
const Blog = require('../models/blog')

describe('blogs', async () => {
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
})

describe('when there is initially one user at db', async () => {
  beforeEach(async() => {
    await User.deleteMany({})
    const user = new User({ username: 'root', password: 'sekred' })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'jpqs',
      name: 'jp salo',
      password: 'saloinen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'alainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if no username provided', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'Superuser',
      password: 'alainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if no password provided', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'neue',
      name: 'euen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('invalid username or password')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if too short password provided', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'neue',
      name: 'euen',
      password: 'ne',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('invalid username or password')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
