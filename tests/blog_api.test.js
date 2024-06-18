const { test, describe, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const mongoose = require('mongoose');
const helper = require('./tests_helper');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

let token;

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const user = new User(helper.initialUsers[0]);
  await user.save();

  const blogObjects = helper.initialBlogs.map(
    (blog) => new Blog({ ...blog, user: user._id })
  );
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  token = jwt.sign(userForToken, process.env.SECRET);
});

describe('when there are initially some blogs saved', () => {
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
});

describe('addition of a new blog', () => {
  test('POST /api/blogs creates a new blog', async () => {
    const newBlog = {
      title: 'New Blog Post',
      author: 'Test Author',
      url: 'http://newblogpost.com',
      likes: 5,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
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

  test('POST /api/blogs blog without title is not added', async () => {
    const newBlog = {
      author: 'No Title Author',
      url: 'http://notitle.com',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });

  test('POST /api/blogs blog without url is not added', async () => {
    const newBlog = {
      title: 'No URL Blog',
      author: 'No URL Author',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });

  test('POST /api/blogs without token returns 401 Unauthorized', async () => {
    const newBlog = {
      title: 'Unauthorized Blog',
      author: 'Unauthorized Author',
      url: 'http://unauthorized.com',
      likes: 1,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });
});

describe('deletion of a blog', () => {
  test('DELETE /api/blogs deletes a blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);

    const titles = blogsAtEnd.map((r) => r.title);
    assert(!titles.includes(blogToDelete.title));
  });
});

describe('updating a blog', () => {
  test("PUT /api/blogs/:id a blog's likes can be updated", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const updatedBlogData = {
      likes: blogToUpdate.likes + 1,
    };

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlogData)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const updatedBlog = response.body;
    assert.strictEqual(updatedBlog.likes, blogToUpdate.likes + 1);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlogInDb = blogsAtEnd.find(
      (blog) => blog.id === blogToUpdate.id
    );
    assert.strictEqual(updatedBlogInDb.likes, blogToUpdate.likes + 1);
  });
});

after(() => {
  mongoose.connection.close();
});
