import App from './app';
import { AuthRoute } from './routes/auth';

const app = new App([new AuthRoute()]);

app.listen();
