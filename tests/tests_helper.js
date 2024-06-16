const Blog = require('../models/blog');

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d18a1',
    title: 'JavaScript Best Practices',
    author: 'John Doe',
    url: 'https://jsbestpractices.com/',
    likes: 15,
    __v: 0,
  },
  {
    _id: '5a422a851b54a676234d18a2',
    title: 'Understanding TypeScript',
    author: 'Jane Smith',
    url: 'https://typescriptguide.com/',
    likes: 22,
    __v: 0,
  },
  {
    _id: '5a422a851b54a676234d18a3',
    title: 'Vue.js Tips and Tricks',
    author: 'Alex Johnson',
    url: 'https://vuetipsandtricks.com/',
    likes: 10,
    __v: 0,
  },
  {
    _id: '5a422a851b54a676234d18a4',
    title: 'Advanced Node.js',
    author: 'Chris Lee',
    url: 'https://advancednodejs.com/',
    likes: 8,
    __v: 0,
  },
  {
    _id: '5a422a851b54a676234d18a6',
    title: 'Mastering Angular',
    author: 'David Brown',
    url: 'https://masteringangular.com/',
    likes: 12,
    __v: 0,
  },
];

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' });
  await blog.save();
  await blog.remove();
  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
};
