/**
 * DAMON SERVICE - Secure Sheets Backend (Apps Script Web App) - v2 (RBAC + Pricing + Project Workflow)
 *
 * Required tabs (exact names):
 * users, categories, devices, settings, projects, project_status_history,
 * project_comments, project_inquiries, inquiry_prices_snapshot, sessions, audit_logs
 *
 * Script Properties:
 * SPREADSHEET_ID = <sheet id>
 * TOKEN_TTL_HOURS = 24
 *
 * Calling convention:
 * - GET:  WEB_APP_URL?path=/health
 * - POST: WEB_APP_URL?path=/auth/login  (body: {"username":"admin","password":"..."} )
 * - Protected GET: WEB_APP_URL?path=/projects/list&token=TOKEN
 * - Protected POST: WEB_APP_URL?path=/projects/create (body includes token)
 *
 * TEMP TEST:
 * - GET: WEB_APP_URL?path=/auth/login_get&username=admin&password=sasan123
 *   (Remove later for security)
 */

function doGet(e) { return respond_(handle_('GET', e)); }
function doPost(e) { return respond_(handle_('POST', e)); }

/* =======================
   Router
======================= */
function handle_(method, e) {
  try {
    const req = parseRequest_(method, e);
    const path = req.path;

    if (!path) return err_('NO_PATH', 'پارامتر path ارسال نشده است.', 400);

    // Public
    if (method === 'GET' && path === '/health') return ok_({ ok: true, time: new Date().toISOString() });
    if (method === 'POST' && path === '/auth/login') return authLogin_(req.body);

    // TEMP: login via GET for quick testing (REMOVE LATER)
    if (method === 'GET' && path === '/auth/login_get') return authLogin_({
      username: String(req.params.username || '').trim(),
      password: String(req.params.password || '')
    });

    if (method === 'POST' && path === '/auth/logout') return authLogout_(req.body);
    if (method === 'GET' && path === '/auth/me') return authMe_(req.params);

    // Protected
    const session = requireSession_(method, req.params, req.body);
    const user = session.user;

    // Catalog (safe)
    if (method === 'GET' && path === '/categories/list') return categoriesList_(user);
    if (method === 'GET' && path === '/devices/search') return devicesSearch_(user, req.params);

    // Projects
    if (method === 'POST' && path === '/projects/create') return projectsCreate_(user, req.body);
    if (method === 'GET'  && path === '/projects/list') return projectsList_(user, req.params);
    if (method === 'GET'  && path === '/projects/detail') return projectsDetail_(user, req.params);
    if (method === 'POST' && path === '/projects/approve') return projectsApprove_(user, req.body);
    if (method === 'POST' && path === '/projects/reject') return projectsReject_(user, req.body);

    // Comments
    if (method === 'POST' && path === '/comments/add') return commentsAdd_(user, req.body);

    // Pricing/Inquiries
    if (method === 'POST' && path === '/inquiries/quote') return inquiriesQuote_(user, req.body);

    // Admin utility
    if (method === 'POST' && path === '/admin/users/set_password') return adminSetPassword_(user, req.body);

    return err_('NOT_FOUND', 'مسیر API یافت نشد.', 404);

  } catch (ex) {
    return err_('SERVER_ERROR', String(ex && ex.message ? ex.message : ex), 500);
  }
}

/* =======================
   Parse + Response
======================= */
function parseRequest_(method, e) {
  const params = (e && e.parameter) ? e.parameter : {};
  let body = {};
  if (method === 'POST') {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (raw) { try { body = JSON.parse(raw); } catch (_) { body = {}; } }
  }
  const path = (params.path || (body && body.path) || '').trim();
  return { path, params, body };
}

function respond_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
function ok_(data) { return { ok: true, data }; }
function err_(code, message, status) { return { ok: false, error_code: code, message, status: status || 400 }; }

/* =======================
   Config + Sheets
======================= */
function prop_(k, defVal) {
  const v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === undefined || v === '') ? defVal : v;
}

function ss_() {
  const id = prop_('SPREADSHEET_ID', '');
  if (!id) throw new Error('SPREADSHEET_ID تنظیم نشده است.');
  return SpreadsheetApp.openById(id);
}

function sh_(name) {
  const s = ss_().getSheetByName(name);
  if (!s) throw new Error('Sheet وجود ندارد: ' + name);
  return s;
}

function nowIso_() { return new Date().toISOString(); }
function uuid_() { return Utilities.getUuid(); }

function isTrue_(v) {
  if (v === true) return true;
  const s = String(v || '').toUpperCase();
  return s === 'TRUE';
}

/**
 * Header aliasing: supports headers with parentheses (your current format) AND clean headers.
 */
const HEADER_TO_CANON = {
  // users
  'role (admin / sales_manager / employee)': 'role',
  'is_active (TRUE/FALSE)': 'is_active',

  // devices
  'factory_pricelist_eur (P)': 'factory_pricelist_eur',
  'length_meter (L)': 'length_meter',
  'weight_unit (W)': 'weight_unit',

  // settings
  'discount_multiplier (D)': 'discount_multiplier',
  'freight_rate_per_meter_eur (F)': 'freight_rate_per_meter_eur',
  'customs_numerator (CN)': 'customs_numerator',
  'customs_denominator (CD)': 'customs_denominator',
  'warranty_rate (WR)': 'warranty_rate',
  'commission_factor (COM)': 'commission_factor',
  'office_factor (OFF)': 'office_factor',
  'profit_factor (PF)': 'profit_factor',

  // projects
  'project_type (مسکونی/اداری/تجاری/…)': 'project_type',
  'status (pending_approval/approved/rejected/…)': 'status',

  // sessions
  'expires_at (ISO datetime)': 'expires_at'
};

function canonKey_(header) {
  return HEADER_TO_CANON[header] || header;
}

function buildRowForSheet_(sheetName, canonObj) {
  const sheet = sh_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  return headers.map(h => {
    const canon = canonKey_(h);
    return canonObj[canon] === undefined ? '' : canonObj[canon];
  });
}

function appendCanon_(sheetName, canonObj) {
  const sheet = sh_(sheetName);
  const row = buildRowForSheet_(sheetName, canonObj);
  sheet.appendRow(row);
}

function readAll_(sheetName) {
  const sheet = sh_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];
  const headers = values[0].map(String);
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    let empty = true;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = canonKey_(headers[c]); // normalize
      const val = row[c];
      if (val !== '' && val !== null && val !== undefined) empty = false;
      obj[key] = val;
    }
    if (!empty) out.push(obj);
  }
  return out;
}

function updateByIdCanon_(sheetName, id, patchCanon) {
  const sheet = sh_(sheetName);
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return false;

  const headersRaw = data[0].map(String);
  const headersCanon = headersRaw.map(canonKey_);
  const idIdx = headersCanon.indexOf('id');
  if (idIdx < 0) throw new Error('ستون id در ' + sheetName + ' وجود ندارد.');

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]) === String(id)) {
      Object.keys(patchCanon).forEach(canonKey => {
        // update all columns whose canon header matches canonKey
        for (let c = 0; c < headersCanon.length; c++) {
          if (headersCanon[c] === canonKey) {
            sheet.getRange(r + 1, c + 1).setValue(patchCanon[canonKey]);
          }
        }
      });
      return true;
    }
  }
  return false;
}

function findOne_(arr, pred) { for (let i = 0; i < arr.length; i++) if (pred(arr[i])) return arr[i]; return null; }

/* =======================
   Crypto (SHA256)
======================= */
function sha256Hex_(input) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return bytes.map(b => {
    const v = (b < 0) ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function salt16_() { return uuid_().replace(/-/g, '').slice(0, 16); }

/* =======================
   RBAC
======================= */
function isAdmin_(u) { return u.role === 'admin'; }
function isSales_(u) { return u.role === 'sales_manager'; }
function isEmployee_(u) { return u.role === 'employee'; }
function requireRole_(u, roles) { if (roles.indexOf(u.role) < 0) throw new Error('دسترسی غیرمجاز.'); }

/* =======================
   Sessions/Auth
======================= */
function requireSession_(method, params, body) {
  const token = (method === 'GET')
    ? String(params.token || '')
    : String((body && body.token) ? body.token : (params.token || ''));

  if (!token) throw new Error('Token ارسال نشده است.');

  const sessions = readAll_('sessions');
  const s = findOne_(sessions, x => String(x.token) === token && isTrue_(x.is_active));
  if (!s) throw new Error('Session معتبر نیست.');

  const exp = new Date(String(s.expires_at));
  if (isNaN(exp.getTime()) || exp.getTime() < Date.now()) {
    updateSession_(token, { is_active: 'FALSE' });
    throw new Error('Session منقضی شده است.');
  }

  const users = readAll_('users');
  const u = findOne_(users, x => String(x.id) === String(s.user_id) && isTrue_(x.is_active));
  if (!u) throw new Error('کاربر معتبر نیست.');

  return { token, user: normalizeUser_(u) };
}

function normalizeUser_(u) {
  return {
    id: String(u.id),
    full_name: String(u.full_name || ''),
    username: String(u.username || ''),
    role: String(u.role || ''),
    is_active: isTrue_(u.is_active)
  };
}

function updateSession_(token, patch) {
  const sheet = sh_('sessions');
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return false;
  const headersRaw = data[0].map(String);
  const headersCanon = headersRaw.map(canonKey_);

  const tIdx = headersCanon.indexOf('token');
  if (tIdx < 0) throw new Error('sessions باید ستون token داشته باشد.');

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][tIdx]) === String(token)) {
      Object.keys(patch).forEach(k => {
        for (let c = 0; c < headersCanon.length; c++) {
          if (headersCanon[c] === k) sheet.getRange(r + 1, c + 1).setValue(patch[k]);
        }
      });
      return true;
    }
  }
  return false;
}

function authLogin_(body) {
  const username = body && body.username ? String(body.username).trim() : '';
  const password = body && body.password ? String(body.password) : '';
  if (!username || !password) return err_('VALIDATION', 'نام کاربری و رمز عبور الزامی است.', 400);

  const users = readAll_('users');
  const u = findOne_(users, x => String(x.username) === username && isTrue_(x.is_active));
  if (!u) return err_('AUTH_FAILED', 'نام کاربری یا رمز عبور اشتباه است.', 401);

  const salt = String(u.password_salt || '');
  const hash = String(u.password_hash_sha256 || '');
  if (!salt || !hash) return err_('PASSWORD_NOT_SET', 'رمز عبور برای این کاربر تنظیم نشده است.', 403);

  const computed = sha256Hex_(salt + password);
  if (computed !== hash) return err_('AUTH_FAILED', 'نام کاربری یا رمز عبور اشتباه است.', 401);

  const token = uuid_();
  const ttlHours = Number(prop_('TOKEN_TTL_HOURS', '24')) || 24;
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  const now = nowIso_();

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    appendCanon_('sessions', {
      token,
      user_id: String(u.id),
      expires_at: expiresAt,
      is_active: 'TRUE',
      ip_address: body && body.ip_address ? String(body.ip_address) : '',
      user_agent: body && body.user_agent ? String(body.user_agent) : '',
      created_at: now
    });
    audit_(String(u.id), 'login', '', '', JSON.stringify({ username }), body.ip_address || '', body.user_agent || '');
  } finally {
    lock.releaseLock();
  }

  return ok_({ token, user: { id: String(u.id), full_name: String(u.full_name || ''), username: String(u.username || ''), role: String(u.role || '') } });
}

function authLogout_(body) {
  const token = body && body.token ? String(body.token) : '';
  if (!token) return err_('VALIDATION', 'token الزامی است.', 400);
  const ok = updateSession_(token, { is_active: 'FALSE' });
  return ok_({ logged_out: ok });
}

function authMe_(params) {
  const session = requireSession_('GET', params, null);
  return ok_({ user: session.user });
}

/* =======================
   Audit
======================= */
function audit_(actorUserId, actionType, projectId, inquiryId, metaJson, ip, ua) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    appendCanon_('audit_logs', {
      id: uuid_(),
      actor_user_id: actorUserId ? String(actorUserId) : '',
      action_type: String(actionType || ''),
      project_id: projectId ? String(projectId) : '',
      project_inquiry_id: inquiryId ? String(inquiryId) : '',
      meta_json: metaJson ? String(metaJson) : '',
      ip_address: ip ? String(ip) : '',
      user_agent: ua ? String(ua) : '',
      created_at: nowIso_()
    });
  } finally {
    lock.releaseLock();
  }
}

/* =======================
   Categories
======================= */
function categoriesList_(user) {
  const cats = readAll_('categories').filter(c => isTrue_(c.is_active));
  return ok_(cats.map(c => ({
    id: String(c.id),
    category_name: String(c.category_name || ''),
    description: String(c.description || '')
  })));
}

/* =======================
   Devices (safe search; no P/L/W exposed)
======================= */
function devicesSearch_(user, params) {
  const q = String(params.query || '').trim().toLowerCase();
  const categoryId = String(params.category_id || '').trim();

  const cats = readAll_('categories').filter(c => isTrue_(c.is_active));
  const catMap = {};
  cats.forEach(c => { catMap[String(c.id)] = String(c.category_name || ''); });

  let devices = readAll_('devices').filter(d => isTrue_(d.is_active));
  devices = devices.filter(d => !!catMap[String(d.category_id)]);

  if (categoryId) devices = devices.filter(d => String(d.category_id) === categoryId);
  if (q) devices = devices.filter(d => String(d.model_name || '').toLowerCase().indexOf(q) >= 0);

  const out = devices.slice(0, 50).map(d => ({
    device_id: String(d.id),
    category_id: String(d.category_id),
    category_name: catMap[String(d.category_id)] || '',
    model_name: String(d.model_name || '')
  }));

  return ok_(out);
}

/* =======================
   Projects
======================= */
function projectsCreate_(user, body) {
  requireRole_(user, ['employee']);

  const required = ['project_name', 'employer_name', 'project_type', 'address_text', 'tehran_lat', 'tehran_lng'];
  for (let i = 0; i < required.length; i++) {
    const f = required[i];
    if (!body || body[f] === undefined || body[f] === null || String(body[f]).trim() === '') {
      return err_('VALIDATION', 'فیلد الزامی ناقص است: ' + f, 400);
    }
  }

  const projectId = uuid_();
  const now = nowIso_();

  const project = {
    id: projectId,
    created_by_user_id: user.id,
    assigned_sales_manager_id: body.assigned_sales_manager_id ? String(body.assigned_sales_manager_id) : '',
    project_name: String(body.project_name),
    employer_name: String(body.employer_name),
    project_type: String(body.project_type),
    address_text: String(body.address_text),
    tehran_lat: Number(body.tehran_lat),
    tehran_lng: Number(body.tehran_lng),
    additional_info: body.additional_info ? String(body.additional_info) : '',
    status: 'pending_approval',
    approval_decision_by: '',
    approval_decision_at: '',
    approval_note: '',
    created_at: now,
    updated_at: now
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    appendCanon_('projects', project);
    appendCanon_('project_status_history', {
      id: uuid_(),
      project_id: projectId,
      changed_by_user_id: user.id,
      from_status: '',
      to_status: 'pending_approval',
      note: '',
      created_at: now
    });
    audit_(user.id, 'project_created', projectId, '', '', body.ip_address || '', body.user_agent || '');
  } finally {
    lock.releaseLock();
  }

  return ok_({ project_id: projectId, status: 'pending_approval' });
}

function projectsList_(user, params) {
  let rows = readAll_('projects');
  if (isEmployee_(user)) rows = rows.filter(p => String(p.created_by_user_id) === user.id);

  const status = String(params.status || '').trim();
  const type = String(params.project_type || '').trim();
  if (status) rows = rows.filter(p => String(p.status) === status);
  if (type) rows = rows.filter(p => String(p.project_type) === type);

  return ok_(rows.map(p => ({
    id: String(p.id),
    project_name: String(p.project_name || ''),
    employer_name: String(p.employer_name || ''),
    project_type: String(p.project_type || ''),
    status: String(p.status || ''),
    address_text: String(p.address_text || ''),
    tehran_lat: Number(p.tehran_lat),
    tehran_lng: Number(p.tehran_lng),
    created_by_user_id: String(p.created_by_user_id || ''),
    created_at: String(p.created_at || ''),
    updated_at: String(p.updated_at || '')
  })));
}

function projectsDetail_(user, params) {
  const projectId = String(params.id || '').trim();
  if (!projectId) return err_('VALIDATION', 'id الزامی است.', 400);

  const projects = readAll_('projects');
  const project = findOne_(projects, p => String(p.id) === projectId);
  if (!project) return err_('NOT_FOUND', 'پروژه پیدا نشد.', 404);

  if (isEmployee_(user) && String(project.created_by_user_id) !== user.id) {
    return err_('FORBIDDEN', 'فقط به پروژه‌های خودتان دسترسی دارید.', 403);
  }

  const history = readAll_('project_status_history').filter(h => String(h.project_id) === projectId);
  const comments = readAll_('project_comments').filter(c => String(c.project_id) === projectId);
  const inquiries = readAll_('project_inquiries').filter(i => String(i.project_id) === projectId);
  const prices = readAll_('inquiry_prices_snapshot');

  const devices = readAll_('devices');
  const cats = readAll_('categories');
  const deviceMap = {}; devices.forEach(d => deviceMap[String(d.id)] = d);
  const catMap = {}; cats.forEach(c => catMap[String(c.id)] = String(c.category_name || ''));

  const inqOut = inquiries.map(i => {
    const dev = deviceMap[String(i.device_id)] || {};
    const pr = findOne_(prices, x => String(x.project_inquiry_id) === String(i.id)) || {};

    const base = {
      id: String(i.id),
      created_at: String(i.created_at || ''),
      requested_by_user_id: String(i.requested_by_user_id || ''),
      category_id: String(i.category_id || ''),
      category_name: catMap[String(i.category_id)] || '',
      model_name: String(dev.model_name || ''),
      sell_price_eur: Number(pr.sell_price_eur_snapshot || 0)
    };

    if (isEmployee_(user)) return base;
    if (isSales_(user)) { base.factory_pricelist_eur = Number(dev.factory_pricelist_eur || 0); return base; }
    if (isAdmin_(user)) {
      base.factory_pricelist_eur = Number(dev.factory_pricelist_eur || 0);
      base.length_meter = Number(dev.length_meter || 0);
      base.weight_unit = Number(dev.weight_unit || 0);
      return base;
    }
    return base;
  });

  return ok_({
    project: {
      id: String(project.id),
      created_by_user_id: String(project.created_by_user_id || ''),
      assigned_sales_manager_id: String(project.assigned_sales_manager_id || ''),
      project_name: String(project.project_name || ''),
      employer_name: String(project.employer_name || ''),
      project_type: String(project.project_type || ''),
      address_text: String(project.address_text || ''),
      tehran_lat: Number(project.tehran_lat),
      tehran_lng: Number(project.tehran_lng),
      additional_info: String(project.additional_info || ''),
      status: String(project.status || ''),
      approval_note: String(project.approval_note || ''),
      created_at: String(project.created_at || ''),
      updated_at: String(project.updated_at || '')
    },
    status_history: history,
    comments: comments,
    inquiries: inqOut
  });
}

function projectsApprove_(user, body) {
  requireRole_(user, ['admin', 'sales_manager']);
  const projectId = body && body.project_id ? String(body.project_id) : '';
  const note = body && body.note ? String(body.note) : '';
  if (!projectId) return err_('VALIDATION', 'project_id الزامی است.', 400);
  return projectSetStatus_(user, projectId, 'approved', note, false);
}

function projectsReject_(user, body) {
  requireRole_(user, ['admin', 'sales_manager']);
  const projectId = body && body.project_id ? String(body.project_id) : '';
  const note = body && body.note ? String(body.note) : '';
  if (!projectId) return err_('VALIDATION', 'project_id الزامی است.', 400);
  if (!note) return err_('VALIDATION', 'note هنگام رد پروژه الزامی است.', 400);
  return projectSetStatus_(user, projectId, 'rejected', note, true);
}

function projectSetStatus_(user, projectId, toStatus, note) {
  const projects = readAll_('projects');
  const project = findOne_(projects, p => String(p.id) === projectId);
  if (!project) return err_('NOT_FOUND', 'پروژه پیدا نشد.', 404);

  const fromStatus = String(project.status || '');
  const now = nowIso_();

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    updateByIdCanon_('projects', projectId, {
      status: toStatus,
      approval_decision_by: user.id,
      approval_decision_at: now,
      approval_note: note,
      updated_at: now
    });

    appendCanon_('project_status_history', {
      id: uuid_(),
      project_id: projectId,
      changed_by_user_id: user.id,
      from_status: fromStatus,
      to_status: toStatus,
      note: note,
      created_at: now
    });

    audit_(user.id, (toStatus === 'approved' ? 'project_approved' : 'project_rejected'), projectId, '', JSON.stringify({ note }), '', '');
  } finally {
    lock.releaseLock();
  }

  return ok_({ project_id: projectId, status: toStatus });
}

/* =======================
   Comments
======================= */
function commentsAdd_(user, body) {
  const projectId = body && body.project_id ? String(body.project_id) : '';
  const text = body && body.body ? String(body.body) : '';
  const parentId = body && body.parent_comment_id ? String(body.parent_comment_id) : '';
  if (!projectId || !text) return err_('VALIDATION', 'project_id و body الزامی است.', 400);

  const projects = readAll_('projects');
  const project = findOne_(projects, p => String(p.id) === projectId);
  if (!project) return err_('NOT_FOUND', 'پروژه پیدا نشد.', 404);

  if (isEmployee_(user) && String(project.created_by_user_id) !== user.id) {
    return err_('FORBIDDEN', 'فقط می‌توانید روی پروژه‌های خودتان کامنت بگذارید.', 403);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    appendCanon_('project_comments', {
      id: uuid_(),
      project_id: projectId,
      author_user_id: user.id,
      author_role_snapshot: user.role,
      body: text,
      parent_comment_id: parentId,
      created_at: nowIso_()
    });
    audit_(user.id, 'comment_added', projectId, '', '', body.ip_address || '', body.user_agent || '');
  } finally {
    lock.releaseLock();
  }

  return ok_({ added: true });
}

/* =======================
   Settings + Pricing
======================= */
function getActiveSettings_() {
  const rows = readAll_('settings');
  const active = findOne_(rows, r => isTrue_(r.is_active));
  if (!active) throw new Error('هیچ settings فعالی وجود ندارد.');
  return active;
}

function applyRounding_(value, mode, step) {
  const v = Number(value);
  const s = Number(step || 0);
  if (!mode || mode === 'none' || !s || s <= 0) return v;
  if (mode === 'round') return Math.round(v / s) * s;
  if (mode === 'ceil') return Math.ceil(v / s) * s;
  if (mode === 'floor') return Math.floor(v / s) * s;
  return v;
}

/* =======================
   Inquiries (Quote)
======================= */
function inquiriesQuote_(user, body) {
  const projectId = body && body.project_id ? String(body.project_id) : '';
  const deviceId = body && body.device_id ? String(body.device_id) : '';
  const qty = body && body.quantity ? Number(body.quantity) : 1;
  const qText = body && body.query_text_snapshot ? String(body.query_text_snapshot) : '';

  if (!projectId || !deviceId) return err_('VALIDATION', 'project_id و device_id الزامی است.', 400);

  const allowedStatuses = ['approved', 'in_progress', 'quoted'];

  const projects = readAll_('projects');
  const project = findOne_(projects, p => String(p.id) === projectId);
  if (!project) return err_('NOT_FOUND', 'پروژه پیدا نشد.', 404);

  if (isEmployee_(user)) {
    if (String(project.created_by_user_id) !== user.id) return err_('FORBIDDEN', 'فقط روی پروژه‌های خودتان می‌توانید استعلام بگیرید.', 403);
    if (allowedStatuses.indexOf(String(project.status)) < 0) return err_('PROJECT_NOT_APPROVED', 'پروژه هنوز تایید نشده است.', 403);
  }

  const devices = readAll_('devices');
  const dev = findOne_(devices, d => String(d.id) === deviceId && isTrue_(d.is_active));
  if (!dev) return err_('NOT_FOUND', 'دستگاه فعال پیدا نشد.', 404);

  const s = getActiveSettings_();

  const P = Number(dev.factory_pricelist_eur);
  const L = Number(dev.length_meter);
  const W = Number(dev.weight_unit);

  const D = Number(s.discount_multiplier);
  const F = Number(s.freight_rate_per_meter_eur);
  const CN = Number(s.customs_numerator);
  const CD = Number(s.customs_denominator);
  const WR = Number(s.warranty_rate);
  const COM = Number(s.commission_factor);
  const OFF = Number(s.office_factor);
  const PF = Number(s.profit_factor);

  // Final formula (your corrected version)
  const companyPrice = P * D;
  const shipment = L * F;
  const custom = W * (CN / CD);
  const warranty = companyPrice * WR;
  const subtotal = companyPrice + shipment + custom + warranty;
  const afterCommission = subtotal / COM;
  const afterOffice = afterCommission / OFF;
  let sellPrice = afterOffice / PF;

  sellPrice = applyRounding_(sellPrice, String(s.rounding_mode || 'none'), s.rounding_step);

  const irrRate = Number(s.exchange_rate_irr_per_eur || 0);
  const sellIrr = irrRate > 0 ? (sellPrice * irrRate) : 0;

  const inquiryId = uuid_();
  const now = nowIso_();
  const settingsId = String(s.id);

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    appendCanon_('project_inquiries', {
      id: inquiryId,
      project_id: projectId,
      requested_by_user_id: user.id,
      device_id: deviceId,
      category_id: String(dev.category_id),
      quantity: qty,
      query_text_snapshot: qText,
      settings_id_snapshot: settingsId,
      created_at: now
    });

    appendCanon_('inquiry_prices_snapshot', {
      id: uuid_(),
      project_inquiry_id: inquiryId,
      sell_price_eur_snapshot: sellPrice,
      sell_price_irr_snapshot: (sellIrr > 0 ? sellIrr : ''),
      created_at: now
    });

    audit_(user.id, 'price_viewed', projectId, inquiryId, JSON.stringify({ device_id: deviceId }), body.ip_address || '', body.user_agent || '');
  } finally {
    lock.releaseLock();
  }

  // SAFE response build
  const cats = readAll_('categories').filter(c => isTrue_(c.is_active));
  const cat = findOne_(cats, c => String(c.id) === String(dev.category_id));
  const catName = cat ? String(cat.category_name || '') : '';

  const base = {
    project_id: projectId,
    inquiry_id: inquiryId,
    category_id: String(dev.category_id),
    category_name: catName,
    model_name: String(dev.model_name || ''),
    sell_price_eur: sellPrice
  };
  if (sellIrr > 0) base.sell_price_irr = sellIrr;

  // Employee: safe only
  if (isEmployee_(user)) return ok_(base);

  // Sales manager: allow Pricelist P only
  if (isSales_(user)) { base.factory_pricelist_eur = P; return ok_(base); }

  // Admin: allow full + breakdown
  if (isAdmin_(user)) {
    base.factory_pricelist_eur = P;
    base.length_meter = L;
    base.weight_unit = W;
    base.settings_id = settingsId;
    base.breakdown = {
      company_price_eur: companyPrice,
      shipment_eur: shipment,
      custom_eur: custom,
      warranty_eur: warranty,
      subtotal_eur: subtotal,
      after_commission: afterCommission,
      after_office: afterOffice
    };
    return ok_(base);
  }

  return ok_(base);
}

/* =======================
   Admin: Set user password
======================= */
function adminSetPassword_(user, body) {
  requireRole_(user, ['admin']);
  const username = body && body.username ? String(body.username).trim() : '';
  const password = body && body.password ? String(body.password) : '';
  if (!username || !password) return err_('VALIDATION', 'username و password الزامی است.', 400);

  const users = readAll_('users');
  const target = findOne_(users, u => String(u.username) === username);
  if (!target) return err_('NOT_FOUND', 'کاربر پیدا نشد.', 404);

  const salt = salt16_();
  const hash = sha256Hex_(salt + password);

  const ok = updateUserByUsername_(username, { password_salt: salt, password_hash_sha256: hash });
  audit_(user.id, 'admin_set_password', '', '', JSON.stringify({ username }), body.ip_address || '', body.user_agent || '');

  return ok_({ updated: ok, username });
}

function updateUserByUsername_(username, patchCanon) {
  const sheet = sh_('users');
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return false;

  const headersRaw = data[0].map(String);
  const headersCanon = headersRaw.map(canonKey_);
  const uIdx = headersCanon.indexOf('username');
  if (uIdx < 0) throw new Error('users باید ستون username داشته باشد.');

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][uIdx]) === String(username)) {
      Object.keys(patchCanon).forEach(k => {
        for (let c = 0; c < headersCanon.length; c++) {
          if (headersCanon[c] === k) sheet.getRange(r + 1, c + 1).setValue(patchCanon[k]);
        }
      });
      return true;
    }
  }
  return false;
}

/* =======================
   Bootstrap (optional):
   Run manually once: sets admin password to sasan123
======================= */
function bootstrap_setAdminPassword() {
  const users = readAll_('users');
  const admin = findOne_(users, u => String(u.username) === 'admin' && String(u.role) === 'admin');
  if (!admin) throw new Error("ادمین با username='admin' و role='admin' در users پیدا نشد.");

  const salt = salt16_();
  const hash = sha256Hex_(salt + 'sasan123');
  const ok = updateUserByUsername_('admin', { password_salt: salt, password_hash_sha256: hash });
  if (!ok) throw new Error('به‌روزرسانی پسورد ادمین انجام نشد.');
}
