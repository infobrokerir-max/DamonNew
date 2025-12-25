import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const PORT = 3001;

const GAS_BASE_URL = "https://script.google.com/macros/s/AKfycbyWeH17Ut3BQEvbdLB13e7WerluTExLqZOut1XgFjlCS4W4d06dfwCP1y2lTos9hUy7/exec";

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

async function callGAS(path: string, token?: string, body?: any, method: 'GET' | 'POST' = 'POST') {
  try {
    let url = `${GAS_BASE_URL}?path=${encodeURIComponent(path)}`;

    if (method === 'GET' && token) {
      url += `&token=${encodeURIComponent(token)}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'text/plain'
      }
    };

    if (method === 'POST' && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GAS call error:', error);
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

app.get('/api/health', async (req: Request, res: Response) => {
  const result = await callGAS('/health', undefined, undefined, 'GET');
  res.json(result);
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await callGAS('/auth/login', undefined, { username, password });

  if (result.ok && result.data?.token) {
    res.cookie('auth_token', result.data.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ ok: true, data: { user: result.data.user } });
  } else {
    res.json(result);
  }
});

app.post('/api/logout', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (token) {
    await callGAS('/auth/logout', undefined, { token });
  }
  res.clearCookie('auth_token');
  res.json({ ok: true });
});

app.get('/api/me', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }
  const result = await callGAS('/auth/me', token, undefined, 'GET');
  res.json(result);
});

app.get('/api/projects/list', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  let path = '/projects/list';
  const queryParams = [];
  if (req.query.status) queryParams.push(`status=${req.query.status}`);
  if (req.query.project_type) queryParams.push(`project_type=${req.query.project_type}`);

  if (queryParams.length > 0) {
    path += '&' + queryParams.join('&');
  }

  const result = await callGAS(path, token, undefined, 'GET');
  res.json(result);
});

app.post('/api/projects/create', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/projects/create', undefined, { token, ...req.body });
  res.json(result);
});

app.get('/api/projects/detail', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const { id } = req.query;
  const result = await callGAS(`/projects/detail&id=${id}`, token, undefined, 'GET');
  res.json(result);
});

app.post('/api/projects/approve', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/projects/approve', undefined, { token, ...req.body });
  res.json(result);
});

app.post('/api/projects/reject', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/projects/reject', undefined, { token, ...req.body });
  res.json(result);
});

app.get('/api/categories/list', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/categories/list', token, undefined, 'GET');
  res.json(result);
});

app.get('/api/devices/search', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  let path = '/devices/search';
  const queryParams = [];
  if (req.query.query) queryParams.push(`query=${encodeURIComponent(req.query.query as string)}`);
  if (req.query.category_id) queryParams.push(`category_id=${req.query.category_id}`);

  if (queryParams.length > 0) {
    path += '&' + queryParams.join('&');
  }

  const result = await callGAS(path, token, undefined, 'GET');
  res.json(result);
});

app.post('/api/inquiries/quote', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/inquiries/quote', undefined, { token, ...req.body });
  res.json(result);
});

app.post('/api/comments/add', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/comments/add', undefined, { token, ...req.body });
  res.json(result);
});

app.post('/api/admin/users/set_password', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.json({ ok: false, error: 'احراز هویت نشده' });
  }

  const result = await callGAS('/admin/users/set_password', undefined, { token, ...req.body });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
