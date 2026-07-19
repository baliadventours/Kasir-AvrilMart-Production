# 🔒 Security Model & User Management

## Overview

Aplikasi POS ini menggunakan security model yang ketat untuk melindungi data bisnis Anda. **Tidak ada fitur sign-up publik** - semua user dibuat dan dikelola oleh administrator.

---

## 🎯 Security Architecture

### 1. No Public Signup
- ❌ Tidak ada halaman signup publik
- ❌ Tidak ada registrasi self-service
- ✅ Semua user dibuat oleh administrator
- ✅ Full control atas siapa yang bisa akses sistem

### 2. Admin-Only User Creation
- Hanya user dengan role `admin` yang bisa membuat user baru
- Server endpoint `/signup` memvalidasi JWT token admin
- Return 403 Forbidden jika non-admin mencoba create user

### 3. Role-Based Access Control (RBAC)
Dua role tersedia:
- **admin** - Full access
- **cashier** - Limited to POS only

---

## 👥 User Roles & Permissions

### Administrator (`admin`)

| Feature | Access |
|---------|--------|
| Point of Sale | ✅ Full Access |
| Inventory Management | ✅ Full Access |
| Sales History | ✅ Full Access |
| User Management | ✅ Full Access |
| Create Users | ✅ Admin & Cashier |
| Edit Products | ✅ Yes |
| Delete Products | ✅ Yes |
| View Reports | ✅ Yes |

### Kasir (`cashier`)

| Feature | Access |
|---------|--------|
| Point of Sale | ✅ Full Access |
| Inventory Management | ❌ No Access |
| Sales History | ❌ No Access |
| User Management | ❌ No Access |
| Create Users | ❌ No |
| Edit Products | ❌ No |
| Delete Products | ❌ No |
| View Reports | ❌ No |

---

## 🔐 Authentication Flow

### Initial Setup (First Admin)

```
1. Deploy aplikasi ke Vercel
2. Setup database schema di Supabase
3. Buat admin pertama via Supabase Dashboard
   ↓
4. Admin login ke aplikasi
5. Admin bisa create users (kasir/admin) via UI
```

### User Creation Flow

```
Admin Dashboard
   ↓
User Management Tab
   ↓
Click "Tambah User"
   ↓
Fill Form (name, email, password, role)
   ↓
Submit → Server validates admin token
   ↓
If admin: Create user ✅
If not admin: Return 403 ❌
```

### Login Flow

```
User → Login Page
   ↓
Enter email & password
   ↓
Supabase Auth validates
   ↓
Generate JWT access token
   ↓
Store in app state + session
   ↓
Route to appropriate dashboard (based on role)
```

---

## 🛡️ Security Layers

### Layer 1: Frontend Protection
- Route-based access control
- Conditional rendering based on role
- UI elements hidden for unauthorized users

### Layer 2: API Authorization
- JWT token validation on all requests
- Role checking in server endpoint
- Admin-only actions require admin token

### Layer 3: Database Security (RLS)
- Row Level Security policies active
- Users only see their own sales (unless admin)
- Admin can access all data
- Products table requires authentication

---

## 🔑 How to Create First Admin

### Method: Supabase Dashboard

1. **Go to Supabase Dashboard**
   ```
   https://app.supabase.com
   → Your Project
   → Authentication
   → Users
   ```

2. **Add User**
   - Click **"Add user"** → **"Create new user"**
   - Email: `admin@toko.com`
   - Password: `admin123456` (atau password kuat lainnya)
   - ✅ Check **"Auto Confirm User"**
   - Click **"Create user"**

3. **Set User Metadata**
   - Click user yang baru dibuat
   - Scroll ke **"User Metadata"** section
   - Click **"Edit"**
   - Add JSON:
     ```json
     {
       "name": "Administrator",
       "role": "admin"
     }
     ```
   - Click **"Save"**

4. **Login & Test**
   - Buka aplikasi
   - Login dengan email & password admin
   - Anda sekarang bisa create users lain!

---

## 👤 How Admin Creates New Users

### Via Application UI

1. **Login as Admin**
   ```
   Email: admin@toko.com
   Password: [your-password]
   ```

2. **Navigate to Users Tab**
   - Click **"Users"** di navigation bar
   - (Only visible to admin)

3. **Create User**
   - Click **"Tambah User"**
   - Fill form:
     - **Nama**: Full name
     - **Email**: Unique email address
     - **Password**: Min 6 characters
     - **Role**: Select "Kasir" or "Administrator"
   - Click **"Tambah User"**

4. **User Created ✅**
   - New user can now login
   - Access based on assigned role

---

## 🚨 Security Best Practices

### For Administrators

✅ **DO:**
- Use strong passwords (min 12 chars)
- Change default admin password immediately
- Only create admin accounts for trusted people
- Review user list regularly
- Disable/delete users who leave

❌ **DON'T:**
- Share admin credentials
- Use simple passwords
- Create admin accounts unnecessarily
- Leave unused accounts active

### For Deployment

✅ **DO:**
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use environment variables for all secrets
- Enable HTTPS (automatic on Vercel)
- Keep database schema up to date
- Monitor authentication logs

❌ **DON'T:**
- Commit `.env.local` to git
- Share service role key
- Disable Row Level Security
- Use weak database passwords

---

## 🔍 Monitoring & Auditing

### Check Active Users
```
Supabase Dashboard
→ Authentication
→ Users
→ See all registered users
```

### Check Login History
```
Supabase Dashboard
→ Authentication
→ Logs
→ See authentication attempts
```

### Check API Usage
```
Supabase Dashboard
→ Settings
→ API
→ Monitor request counts
```

---

## 🐛 Troubleshooting

### Error: "Unauthorized - Please login as admin"
**Cause**: Non-admin trying to create user
**Solution**: Login with admin account

### Error: "Forbidden - Only administrators can create users"
**Cause**: User has wrong role in metadata
**Solution**: Check user metadata in Supabase Dashboard

### Can't create first admin via UI
**Expected**: First admin MUST be created via Supabase Dashboard
**Solution**: Follow "How to Create First Admin" guide above

### User can't login after creation
**Cause**: Email not confirmed
**Solution**: In user creation, we set `email_confirm: true`, so this shouldn't happen. Check user status in Supabase Dashboard.

---

## 📝 User Lifecycle

```
Creation (Admin via UI or Dashboard)
   ↓
Email confirmation (auto)
   ↓
Active user (can login)
   ↓
Login/logout (as needed)
   ↓
(Optional) Disable in Supabase Dashboard
   ↓
(Optional) Delete from Authentication → Users
```

---

## 🔐 Password Policy

Current settings:
- **Minimum length**: 6 characters
- **Confirmation**: Not required (admin creates)
- **Reset**: Via Supabase auth flow
- **Change**: User can change via Supabase auth

To enforce stricter policy, configure in:
```
Supabase Dashboard
→ Authentication
→ Policies
→ Password Policy
```

---

## 📞 Security Questions?

For security concerns:
- Check Supabase Security docs: https://supabase.com/docs/guides/auth
- Review RLS policies in `supabase-schema.sql`
- Test permissions with different user roles
- Monitor authentication logs regularly

---

**Security is not a feature, it's a foundation.** 🛡️
