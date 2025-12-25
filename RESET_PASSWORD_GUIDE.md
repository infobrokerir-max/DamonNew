# راهنمای تغییر رمز عبور (Reset Password)

قابلیت تغییر رمز عبور به شما اجازه می‌دهد بدون نیاز به ورود به سیستم، رمز عبور کاربران را تغییر دهید.

## نحوه استفاده

### از طریق رابط کاربری (UI)

1. به آدرس `/reset-password` بروید یا در صفحه Login روی "فراموشی رمز عبور" کلیک کنید
2. فرم زیر را پر کنید:
   - نام کاربری
   - رمز عبور جدید
   - تکرار رمز عبور جدید
3. روی دکمه "تغییر رمز عبور" کلیک کنید
4. بعد از تغییر موفق، به صفحه Login هدایت می‌شوید

### مثال برای ادمین

اگر می‌خواهید رمز عبور ادمین را به `sasan` تغییر دهید:

1. نام کاربری: `admin`
2. رمز عبور جدید: `sasan`
3. تکرار رمز عبور: `sasan`

## نحوه کار

این قابلیت از endpoint عمومی (public) در Google Apps Script استفاده می‌کند:

```
POST /dev/reset_password
Body: {
  "username": "admin",
  "new_password": "sasan"
}
```

این endpoint:
1. نام کاربری را جستجو می‌کند
2. یک salt جدید تولید می‌کند
3. رمز عبور را با SHA256 هش می‌کند
4. password_salt و password_hash_sha256 را در Google Sheet به‌روزرسانی می‌کند

## به‌روزرسانی Google Apps Script

اگر قبلاً اسکریپت را Deploy کرده‌اید، باید آن را به‌روزرسانی کنید:

1. فایل `google-script-backend.js` را از پروژه باز کنید
2. محتوای آن را در Apps Script Editor جایگزین کنید
3. Deploy جدیدی ایجاد کنید یا deploy فعلی را به‌روزرسانی کنید

## امنیت

⚠️ **هشدار امنیتی مهم:**

این قابلیت **فقط برای محیط توسعه (Development)** طراحی شده است!

در محیط تولید (Production):
- این endpoint باید غیرفعال شود
- یا باید با authentication محافظت شود
- یا باید از email verification استفاده شود

برای غیرفعال کردن در Production:

در `google-script-backend.js`، خط زیر را کامنت کنید:

```javascript
// PUBLIC PASSWORD RESET (Development Only - Remove in Production)
// if (method === 'POST' && path === '/dev/reset_password') return devResetPassword_(req.body);
```

## رفع مشکل

### "کاربر پیدا نشد"
- اطمینان حاصل کنید username دقیقاً مطابق با Google Sheet است
- بررسی کنید که کاربر در تب `users` وجود دارد

### "خطا در ارتباط با سرور"
- URL اسکریپت در `.env` را بررسی کنید
- مطمئن شوید Apps Script به‌روزرسانی و Deploy شده است

### "خطا در به‌روزرسانی رمز عبور"
- بررسی کنید Sheet دارای ستون‌های `password_salt` و `password_hash_sha256` است
- اطمینان حاصل کنید Apps Script دسترسی نوشتن به Sheet دارد
