import 'dotenv/config';
import App from './app';

const app = new App({
  owner_username: 'arfffrzy',
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.API_SECRET_KEY,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET_TOKEN,
});

app.run();