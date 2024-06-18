const { test, describe, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const mongoose = require('mongoose');
const helper = require('./tests_helper');
const app = require('../app');
const api = supertest(app);
const User = require('../models/user');

beforeEach(async () => {
  await User.deleteMany({});

  const userObjects = helper.initialUsers.map((user) => new User(user));
  const promiseArray = userObjects.map((user) => user.save());
  await Promise.all(promiseArray);
});

describe('when there are initially some users saved', () => {
  test('users are returned as json', async () => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all users are returned', async () => {
    const response = await api.get('/api/users');

    assert.strictEqual(response.body.length, helper.initialUsers.length);
  });

  test('unique identifier property of the user is named id', async () => {
    const response = await api.get('/api/users');
    const users = response.body;

    users.forEach((user) => {
      assert(user.id, 'id property is missing');
      assert(!user._id, '_id property should not be present');
    });
  });
});

describe('addition of a new user', () => {
  test('POST /api/users creates a new user with valid data', async () => {
    const newUser = {
      username: 'newuser',
      name: 'New User',
      password: 'password123',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, helper.initialUsers.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes('newuser'));
  });

  test('POST /api/users without username is not added', async () => {
    const newUser = {
      name: 'No Username User',
      password: 'password123',
    };

    await api.post('/api/users').send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, helper.initialUsers.length);
  });

  test('POST /api/users without password is not added', async () => {
    const newUser = {
      username: 'nousername',
      name: 'No Password User',
    };

    await api.post('/api/users').send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, helper.initialUsers.length);
  });

  test('POST /api/users with too short username is not added', async () => {
    const newUser = {
      username: 'nu',
      name: 'Short Username User',
      password: 'password123',
    };

    await api.post('/api/users').send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, helper.initialUsers.length);
  });

  test('POST /api/users with too short password is not added', async () => {
    const newUser = {
      username: 'newuser',
      name: 'Short Password User',
      password: 'pw',
    };

    await api.post('/api/users').send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, helper.initialUsers.length);
  });
});

after(() => {
  mongoose.connection.close();
});
