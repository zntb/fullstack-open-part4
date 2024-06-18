const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const User = require('../models/user');
const blogsRouter = require('express').Router();

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
  const { title, url, likes } = request.body;

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }

    const user = await User.findById(decodedToken.id);

    if (!title || !url) {
      return response.status(400).json({ error: 'title or url missing' });
    }

    const blog = new Blog({
      title,
      author: user.username,
      url,
      likes: likes || 0,
      user: user._id,
    });

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    response.status(201).json(savedBlog);
  } catch (error) {
    next(error);
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
