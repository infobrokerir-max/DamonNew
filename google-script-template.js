/**
 * DAMON SERVICE - GOOGLE SHEETS BACKEND
 *
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Create 6 Tabs named exactly: "Users", "Projects", "Inquiries", "Devices", "Categories", "Comments", "Sessions".
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this code completely.
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type: "Web app".
 * 7. Description: "v1".
 * 8. Execute as: "Me".
 * 9. Who has access: "Anyone" (Important for the app to work without login popup).
 * 10. Copy the Web App URL and paste it into the Admin Settings of your app.
 * 11. Make sure "Users" sheet has columns: id, username, password, full_name, role, is_active
 * 12. Add default admin user: id="u-admin", username="admin", password="sasan", full_name="مدیر سیستم", role="admin", is_active="TRUE"
 */

function doGet(e) {
  const wb = SpreadsheetApp.getActiveSpreadsheet();
  const path = e.parameter.path || '';
  const token = e.parameter.token;

  if (path === '/health') {
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (path === '/auth/me') {
    const session = getSessionByToken(wb, token);
    if (!session) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'توکن نامعتبر' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const user = getUserById(wb, session.user_id);
    if (!user) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'کاربر یافت نشد' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      data: { user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } }
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = {
    users: getSheetData(wb, 'Users'),
    projects: getSheetData(wb, 'Projects'),
    inquiries: getSheetData(wb, 'Inquiries'),
    devices: getSheetData(wb, 'Devices'),
    categories: getSheetData(wb, 'Categories'),
    comments: getSheetData(wb, 'Comments')
  };

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const wb = SpreadsheetApp.getActiveSpreadsheet();
  const postData = JSON.parse(e.postData.contents);
  const path = postData.path || '';

  // Auth endpoints
  if (path === '/auth/login') {
    return handleLogin(wb, postData);
  }

  if (path === '/auth/logout') {
    return handleLogout(wb, postData);
  }

  // For other operations, verify token if needed
  const action = postData.action;
  const payload = postData.payload;

  let sheetName = '';

  if (action.includes('user')) sheetName = 'Users';
  else if (action.includes('project')) sheetName = 'Projects';
  else if (action.includes('inquiry')) sheetName = 'Inquiries';
  else if (action.includes('device')) sheetName = 'Devices';
  else if (action.includes('category')) sheetName = 'Categories';
  else if (action.includes('comment')) sheetName = 'Comments';

  if (!sheetName) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'عملیات نامعتبر' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = wb.getSheetByName(sheetName);

  if (action.startsWith('create_')) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
      const keys = Object.keys(payload);
      sheet.appendRow(keys);
    }

    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = currentHeaders.map(header => {
      let val = payload[header];
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });

    sheet.appendRow(row);

  } else if (action.startsWith('update_')) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) return ContentService.createTextOutput(JSON.stringify({ ok: false }));

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == payload.id) {
        Object.keys(payload).forEach(key => {
          const colIndex = headers.indexOf(key);
          if (colIndex > -1) {
            let val = payload[key];
            if (typeof val === 'object') val = JSON.stringify(val);
            sheet.getRange(i + 1, colIndex + 1).setValue(val);
          }
        });
        break;
      }
    }
  } else if (action.startsWith('delete_')) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == payload.id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(wb, postData) {
  const username = postData.username;
  const password = postData.password;

  const user = getUserByCredentials(wb, username, password);
  if (!user) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (user.is_active === false || user.is_active === 'FALSE' || user.is_active === '') {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'کاربر غیرفعال است' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const token = generateToken();
  saveSession(wb, { token, user_id: user.id });

  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    data: {
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    }
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogout(wb, postData) {
  const token = postData.token;
  deleteSession(wb, token);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getUserByCredentials(wb, username, password) {
  const sheet = wb.getSheetByName('Users');
  if (!sheet) return null;

  const data = getSheetData(wb, 'Users');
  for (const user of data) {
    if (user.username === username && user.password === password) {
      return user;
    }
  }
  return null;
}

function getUserById(wb, userId) {
  const data = getSheetData(wb, 'Users');
  for (const user of data) {
    if (user.id === userId) {
      return user;
    }
  }
  return null;
}

function getSessionByToken(wb, token) {
  const data = getSheetData(wb, 'Sessions');
  for (const session of data) {
    if (session.token === token) {
      return session;
    }
  }
  return null;
}

function saveSession(wb, session) {
  const sheet = wb.getSheetByName('Sessions');
  if (!sheet) {
    sheet = wb.insertSheet('Sessions');
    sheet.appendRow(['token', 'user_id']);
  }

  sheet.appendRow([session.token, session.user_id]);
}

function deleteSession(wb, token) {
  const sheet = wb.getSheetByName('Sessions');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const tokenIndex = headers.indexOf('token');

  if (tokenIndex === -1) return;

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][tokenIndex] === token) {
      sheet.deleteRow(i + 1);
    }
  }
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function getSheetData(wb, sheetName) {
  const sheet = wb.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return []; // Only headers or empty
  
  const headers = rows[0];
  const data = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    let hasData = false;
    
    headers.forEach((header, index) => {
      let val = row[index];
      // Try to parse JSON strings back to objects (for nested data like breakdown)
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[header] = val;
      if (val !== '') hasData = true;
    });
    
    if (hasData) data.push(obj);
  }
  
  return data;
}
