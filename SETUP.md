# راه‌اندازی سیستم - Damon Service Management

## مراحل راه‌اندازی اولیه

### 1. نصب وابستگی‌ها
```bash
npm install
```

### 2. تنظیم متغیرهای محیطی
فایل `.env` از قبل تنظیم شده است و شامل اطلاعات اتصال به دیتابیس Supabase می‌باشد.

### 3. ایجاد کاربران اولیه
برای ایجاد کاربران اولیه، یکی از روش‌های زیر را انتخاب کنید:

#### روش اول: استفاده از اسکریپت (توصیه می‌شود)
```bash
# نیاز به SUPABASE_SERVICE_ROLE_KEY در متغیرهای محیطی
npx tsx seed-users.ts
```

#### روش دوم: ایجاد دستی از طریق Supabase Dashboard
1. به [Supabase Dashboard](https://supabase.com/dashboard) بروید
2. پروژه خود را انتخاب کنید
3. از منوی سمت چپ، Authentication > Users را انتخاب کنید
4. روی "Add User" کلیک کنید
5. کاربران زیر را ایجاد کنید:

**کاربر مدیر (Admin):**
- Email: `admin@damon.local`
- Password: `sasan`
- سپس در جدول `profiles`:
  - username: `admin`
  - full_name: `مدیر سیستم`
  - role: `admin`
  - is_active: `true`

**کاربر فروش (Sales Manager):**
- Email: `sales@damon.local`
- Password: `123`
- در جدول `profiles`:
  - username: `sales`
  - full_name: `مدیر فروش`
  - role: `sales_manager`

**کارمندان:**
- Email: `emp1@damon.local` / Password: `123`
- Email: `emp2@damon.local` / Password: `123`

### 4. اجرای برنامه
```bash
npm run dev
```

### 5. ورود به سیستم
- آدرس: `http://localhost:5173`
- نام کاربری: `admin`
- رمز عبور: `sasan`

## ساختار دیتابیس

دیتابیس شامل جداول زیر است:
- **profiles**: پروفایل کاربران و نقش‌های آن‌ها
- **categories**: دسته‌بندی دستگاه‌ها
- **devices**: مدل‌های دستگاه‌ها با اطلاعات قیمت‌گذاری محرمانه
- **settings**: تنظیمات سیستم برای محاسبات قیمت
- **projects**: پروژه‌ها
- **project_comments**: نظرات پروژه‌ها
- **project_inquiries**: استعلام‌های قیمت

## نقش‌های کاربری

### مدیر (Admin)
- دسترسی کامل به تمام بخش‌ها
- مدیریت کاربران، دستگاه‌ها، و دسته‌بندی‌ها
- تایید/رد استعلام‌ها
- مشاهده اطلاعات محرمانه قیمت‌گذاری

### مدیر فروش (Sales Manager)
- مشاهده تمام پروژه‌ها
- تایید/رد پروژه‌ها
- مدیریت وضعیت پروژه‌ها
- بدون دسترسی به اطلاعات محرمانه قیمت‌گذاری

### کارمند (Employee)
- ایجاد پروژه جدید
- مشاهده پروژه‌های خود
- درخواست استعلام برای پروژه‌های تایید شده
- بدون دسترسی به اطلاعات محرمانه

## پشتیبانی

برای مشکلات یا سوالات، لطفاً به مستندات Supabase مراجعه کنید:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
