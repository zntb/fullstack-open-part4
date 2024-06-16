const { test, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const mongoose = require('mongoose');
const helper = require('./tests_helper');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs');

  assert.strictEqual(response.body.length, helper.initialBlogs.length);
});

test('unique identifier property of the blog posts is named id', async () => {
  const response = await api.get('/api/blogs');
  const blogs = response.body;

  blogs.forEach((blog) => {
    assert(blog.id, 'id property is missing');
    assert(!blog._id, '_id property should not be present');
  });
});

test('POST /api/blogs creates a new blog', async () => {
  const newBlog = {
    title: 'New Blog Post',
    author: 'Test Author',
    url: 'http://newblogpost.com',
    likes: 5,
  };

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

  const titles = blogsAtEnd.map((r) => r.title);
  assert(titles.includes('New Blog Post'));
});

test('POST /api/blogs without likes defaults to 0', async () => {
  const newBlog = {
    title: 'Blog Without Likes',
    author: 'No Likes Author',
    url: 'http://nolikes.com',
  };

  const response = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  assert.strictEqual(response.body.likes, 0);

  const blogsAtEnd = await helper.blogsInDb();
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

  const addedBlog = blogsAtEnd.find(
    (blog) => blog.title === 'Blog Without Likes'
  );
  assert.strictEqual(addedBlog.likes, 0);
});

after(() => {
  mongoose.connection.close();
});
