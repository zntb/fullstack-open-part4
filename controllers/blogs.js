const express = require('express');
const Blog = require('../models/blog');
const User = require('../models/user');
const blogsRouter = express.Router();

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', ['username', 'name']);

  response.json(
    blogs.map((blog) => ({
      url: blog.url,
      title: blog.title,
      author: blog.author,
      user: {
        username: blog.user.username,
        name: blog.user.name,
        id: blog.user._id,
      },
      likes: blog.likes,
      id: blog._id,
    }))
  );
});

blogsRouter.post('/', async (request, response, next) => {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      return response.status(400).json({ error: 'no users found' });
    }

    const randomUserIndex = Math.floor(Math.random() * users.length);
    const randomUser = users[randomUserIndex];

    const { title, url, likes } = request.body;

    if (!title || !url) {
      return response.status(400).json({ error: 'title or url missing' });
    }

    const blog = new Blog({
      title,
      author: randomUser.username,
      url,
      likes: likes || 0,
      user: randomUser._id,
    });

    const savedBlog = await blog.save();

    randomUser.blogs = randomUser.blogs.concat(savedBlog._id);
    await randomUser.save();

    response.status(201).json(savedBlog);
  } catch (exception) {
    next(exception);
  }
});

blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    const { id } = request.params;
    await Blog.findByIdAndDelete(id);
    response.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

blogsRouter.put('/:id', async (request, response, next) => {
  const { likes } = request.body;

  const blog = {
    likes,
  };

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    if (updatedBlog) {
      response.json(updatedBlog);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

module.exports = blogsRouter;
