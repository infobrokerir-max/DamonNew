# راهنمای راه‌اندازی سیستم دامون سرویس

این راهنما مراحل راه‌اندازی کامل سیستم مدیریت پروژه دامون سرویس با Google Apps Script Backend را توضیح می‌دهد.

## بخش اول: راه‌اندازی Google Apps Script Backend

### مرحله 1: ایجاد Google Sheet

1. به [Google Sheets](https://sheets.google.com) بروید
2. یک Spreadsheet جدید ایجاد کنید
3. تب‌های (Sheet) زیر را با نام‌های دقیق ایجاد کنید:
   - `users`
   - `categories`
   - `devices`
   - `settings`
   - `projects`
   - `project_status_history`
   - `project_comments`
   - `project_inquiries`
   - `inquiry_prices_snapshot`
   - `sessions`
   - `audit_logs`

### مرحله 2: ایجاد ستون‌های جداول

برای هر تب، ستون‌های زیر را در ردیف اول ایجاد کنید:

#### جدول `users`:
```
id | full_name | username | role (admin / sales_manager / employee) | is_active (TRUE/FALSE) | password_salt | password_hash_sha256 | created_at
```

#### جدول `categories`:
```
id | category_name | description | is_active (TRUE/FALSE) | created_at
```

#### جدول `devices`:
```
id | category_id | model_name | factory_pricelist_eur (P) | length_meter (L) | weight_unit (W) | is_active (TRUE/FALSE) | created_at
```

#### جدول `settings`:
```
id | discount_multiplier (D) | freight_rate_per_meter_eur (F) | customs_numerator (CN) | customs_denominator (CD) | warranty_rate (WR) | commission_factor (COM) | office_factor (OFF) | profit_factor (PF) | rounding_mode | rounding_step | exchange_rate_irr_per_eur | is_active (TRUE/FALSE) | created_at
```

#### جدول `projects`:
```
id | created_by_user_id | assigned_sales_manager_id | project_name | employer_name | project_type (مسکونی/اداری/تجاری/…) | address_text | tehran_lat | tehran_lng | additional_info | status (pending_approval/approved/rejected/…) | approval_decision_by | approval_decision_at | approval_note | created_at | updated_at
```

#### جدول `project_status_history`:
```
id | project_id | changed_by_user_id | from_status | to_status | note | created_at
```

#### جدول `project_comments`:
```
id | project_id | author_user_id | author_role_snapshot | body | parent_comment_id | created_at
```

#### جدول `project_inquiries`:
```
id | project_id | requested_by_user_id | device_id | category_id | quantity | query_text_snapshot | settings_id_snapshot | created_at
```

#### جدول `inquiry_prices_snapshot`:
```
id | project_inquiry_id | sell_price_eur_snapshot | sell_price_irr_snapshot | created_at
```

#### جدول `sessions`:
```
token | user_id | expires_at (ISO datetime) | is_active (TRUE/FALSE) | ip_address | user_agent | created_at
```

#### جدول `audit_logs`:
```
id | actor_user_id | action_type | project_id | project_inquiry_id | meta_json | ip_address | user_agent | created_at
```

### مرحله 3: ایجاد کاربر اولیه (ادمین)

در تب `users`، یک ردیف با اطلاعات زیر اضافه کنید:
```
id: admin-001
full_name: مدیر سیستم
username: admin
role: admin
is_active: TRUE
password_salt: (خالی بگذارید - توسط اسکریپت پر می‌شود)
password_hash_sha256: (خالی بگذارید - توسط اسکریپت پر می‌شود)
created_at: (تاریخ کنونی)
```

### مرحله 4: ایجاد تنظیمات اولیه

در تب `settings`، یک ردیف نمونه اضافه کنید:
```
id: settings-001
discount_multiplier (D): 0.90
freight_rate_per_meter_eur (F): 5
customs_numerator (CN): 100
customs_denominator (CD): 50
warranty_rate (WR): 0.05
commission_factor (COM): 0.95
office_factor (OFF): 0.92
profit_factor (PF): 0.88
rounding_mode: round
rounding_step: 100
exchange_rate_irr_per_eur: 60000
is_active: TRUE
created_at: (تاریخ کنونی)
```

### مرحله 5: ایجاد Apps Script

1. در Google Sheet، به منوی `Extensions > Apps Script` بروید
2. محتوای فایل `google-script-template.js` را در پروژه کپی کنید
3. کد را در `Code.gs` قرار دهید

### مرحله 6: تنظیم Script Properties

1. در Apps Script Editor، به `Project Settings` (آیکن چرخ دنده) بروید
2. در بخش `Script Properties`، موارد زیر را اضافه کنید:
   - `SPREADSHEET_ID`: شناسه Google Sheet شما (از URL کپی کنید)
   - `TOKEN_TTL_HOURS`: 24

### مرحله 7: Deploy به عنوان Web App

1. در Apps Script Editor، روی `Deploy > New deployment` کلیک کنید
2. نوع را `Web app` انتخاب کنید
3. تنظیمات:
   - Description: DAMON SERVICE API
   - Execute as: Me
   - Who has access: Anyone
4. روی `Deploy` کلیک کنید
5. URL دریافتی را کپی کنید (این همان WEB_APP_URL است)

### مرحله 8: تنظیم رمز عبور ادمین

1. در Apps Script Editor، تابع `bootstrap_setAdminPassword` را باز کنید
2. این تابع را یک بار اجرا کنید (Run > bootstrap_setAdminPassword)
3. اجازه‌های لازم را بدهید
4. رمز عبور ادمین به `sasan` تنظیم می‌شود

## بخش دوم: راه‌اندازی Frontend

### مرحله 1: تنظیم Environment Variables

1. فایل `.env` را در ریشه پروژه باز کنید
2. مقدار `VITE_GOOGLE_APPS_SCRIPT_URL` را با URL دریافت شده از بخش قبل جایگزین کنید:

```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### مرحله 2: نصب Dependencies

```bash
npm install
```

### مرحله 3: اجرای پروژه

برای محیط توسعه:
```bash
npm run dev
```

برای Build کردن:
```bash
npm run build
```

## ورود به سیستم

پس از راه‌اندازی، می‌توانید با اطلاعات زیر وارد شوید:

- **نام کاربری:** admin
- **رمز عبور:** sasan

## ایجاد کاربران جدید

برای ایجاد کاربران جدید:

1. به عنوان ادمین وارد شوید
2. می‌توانید از endpoint زیر استفاده کنید:

```javascript
POST /admin/users/set_password
Body: {
  "token": "YOUR_ADMIN_TOKEN",
  "username": "new_user_username",
  "password": "new_password"
}
```

یا مستقیماً در Google Sheet، کاربر جدید اضافه کنید و سپس از طریق API رمز عبور را تنظیم کنید.

## نکات مهم

1. **امنیت:** حتماً `Execute as: Me` و `Who has access: Anyone` را در Deploy تنظیم کنید
2. **CORS:** اسکریپت به طور خودکار CORS headers را مدیریت می‌کند
3. **Token:** توکن‌های ورود به مدت 24 ساعت معتبر هستند
4. **Audit Logs:** تمام اعمال مهم در جدول `audit_logs` ثبت می‌شوند

## رفع مشکلات رایج

### خطای "SPREADSHEET_ID تنظیم نشده است"
- Script Properties را بررسی کنید و مطمئن شوید SPREADSHEET_ID تنظیم شده است

### خطای "Session معتبر نیست"
- مجدداً وارد شوید تا توکن جدید دریافت کنید

### خطای "دسترسی غیرمجاز"
- اطمینان حاصل کنید کاربر شما نقش مناسب (role) دارد

### خطای در ارتباط با سرور
- URL اسکریپت را در فایل `.env` بررسی کنید
- مطمئن شوید Web App به درستی Deploy شده است

## پشتیبانی

برای هرگونه سوال یا مشکل، به مستندات Google Apps Script مراجعه کنید.
