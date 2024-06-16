const express = require('express');
const Blog = require('../models/blog');
const router = express.Router();

router.get('/', (request, response) => {
  Blog.find({}).then((blogs) => {
    response.json(blogs);
  });
});

router.post('/', async (request, response, next) => {
  const { title, author, url, likes } = request.body;

  if (!title || !url) {
    return response.status(400).json({ error: 'title or url missing' });
  }

  const blog = new Blog({
    title,
    author,
    url,
    likes: likes || 0,
  });

  try {
    const savedBlog = await blog.save();
    response.status(201).json(savedBlog);
  } catch (exception) {
    next(exception);
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const { id } = request.params;
    await Blog.findByIdAndDelete(id);
    response.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

router.put('/:id', async (request, response, next) => {
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

module.exports = router;
