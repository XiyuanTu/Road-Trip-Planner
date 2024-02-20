const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const middlewares = require('./middlewares');

require('dotenv').config();

const app = express();

app.enable('trust proxy');

mongoose.connect('mongodb://localhost:27017/Travel-Planner', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(morgan('common'));
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
  });
});

const logsRouter = require('./API/logs');

app.use('/API/logs', logsRouter);

const usersRouter = require('./API/users');

app.use('/API/users', usersRouter);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const port = 1337;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
