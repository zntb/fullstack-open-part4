const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.get('/', async (req, response) => {
  try {
    const users = await User.find({}).populate('blogs', [
      'url',
      'title',
      'author',
    ]);

    const formattedUsers = users.map((user) => ({
      blogs: user.blogs.map((blog) => ({
        url: blog.url,
        title: blog.title,
        author: blog.author,
        id: blog._id,
      })),
      username: user.username,
      name: user.name,
      id: user._id,
    }));

    response.json(formattedUsers);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

usersRouter.post('/', async (request, response, next) => {
  const { username, name, password } = request.body;

  if (!username || !password || username.length < 3 || password.length < 3) {
    return response.status(400).json({
      error: 'username and password must be at least 3 characters',
    });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return response.status(400).json({
      error: 'username must be unique',
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  try {
    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
