# 🔐 SentinelIQ - Login Credentials

**⚠️ CONFIDENTIAL - For Security Administrators Only**

This document contains all login credentials for the SentinelIQ platform. Keep this document secure and do not share publicly.

---

## 👨‍💼 Security Administrators (2)

### Admin 1:
- **Username:** `admin`
- **Password:** `admin123`
- **Name:** Security Admin 1
- **Access:** Full system access, all users, all features
- **Can View:** All 50 users, all alerts, all incidents, analytics, intelligence

### Admin 2:
- **Username:** `secadmin`
- **Password:** `secure123`
- **Name:** Security Admin 2
- **Access:** Full system access, all users, all features
- **Can View:** All 50 users, all alerts, all incidents, analytics, intelligence

---

## 👥 Team Members - Demo Users (3)

These users are for demonstration purposes and have real-time monitoring enabled.

### Abhinav P V:
- **Username:** `U001`
- **Password:** `user123`
- **User ID:** U001
- **Name:** Abhinav P V
- **Role:** Developer
- **Department:** Engineering
- **Status:** Real-time monitoring active
- **Can View:** Only their own data and activities

### Abhinav Gadde:
- **Username:** `U002`
- **Password:** `user123`
- **User ID:** U002
- **Name:** Abhinav Gadde
- **Role:** Developer
- **Department:** Engineering
- **Status:** Real-time monitoring active
- **Can View:** Only their own data and activities

### Indushree:
- **Username:** `U003`
- **Password:** `user123`
- **User ID:** U003
- **Name:** Indushree
- **Role:** Developer
- **Department:** Engineering
- **Status:** Real-time monitoring active
- **Can View:** Only their own data and activities

---

## 👤 Regular Users (47)

All regular users follow the pattern: `U004` through `U050`

### Password Pattern:
- **Default Password:** `user123`
- **Username:** User ID (e.g., `U004`, `U005`, etc.)

### User List:

| User ID | Username | Password | Name | Role | Department |
|---------|----------|----------|------|------|------------|
| U004 | U004 | user123 | [Generated Indian Name] | Developer/HR/Finance/Manager/Sales | [Department] |
| U005 | U005 | user123 | [Generated Indian Name] | Developer/HR/Finance/Manager/Sales | [Department] |
| U006 | U006 | user123 | [Generated Indian Name] | Developer/HR/Finance/Manager/Sales | [Department] |
| ... | ... | ... | ... | ... | ... |
| U050 | U050 | user123 | [Generated Indian Name] | Developer/HR/Finance/Manager/Sales | [Department] |

**Note:** Names are randomly generated Indian names. Check database for exact names.

**Access:** Regular users can only view their own data, activities, and threat scores.

---

## 🔄 Adding New Users

To add new users, security administrators must:

### 1. Update Backend:
```bash
# Add user to database via populate_database.py
# Or use admin panel (if implemented)
```

### 2. Update Frontend:
- Add credentials to `frontend/src/App.js` in `CREDENTIALS.users` array
- Format: `{ username: 'U051', password: 'user123', name: 'User Name', role: 'user' }`

### 3. Update This Document:
- Add new user entry to this document
- Keep credentials secure

---

## 🚨 Security Notes

### 1. Change Default Passwords:
- All users should change their default password (`user123`) on first login
- Implement password policy (min 8 chars, complexity requirements)

### 2. Access Control:
- **Regular users** can only see their own data
- **Admins** can see all users and system-wide data
- Session persists on refresh (localStorage)

### 3. Credential Management:
- Do not share credentials publicly
- Use secure password management tools
- Rotate passwords regularly
- Keep this document secure

### 4. Real-Time Monitoring:
- Users U001, U002, U003 have real-time monitoring enabled
- Other users use generated/synthetic data
- In production, all users should have real-time monitoring

---

## 📋 Quick Reference

### For Exhibition Demo:
- **Admin Login:** `admin` / `admin123`
- **Demo User 1:** `U001` / `user123` (Abhinav P V)
- **Demo User 2:** `U002` / `user123` (Abhinav Gadde)
- **Demo User 3:** `U003` / `user123` (Indushree)

### For Testing:
- Use any User ID (U004-U050) with password `user123`
- Check database for actual user names
- All regular users have same password pattern

---

## 🔧 Troubleshooting

### Login Issues:
1. Verify username and password match exactly (case-sensitive)
2. Check user exists in database
3. Verify credentials in `frontend/src/App.js`
4. Clear browser cache and localStorage
5. Check backend is running: `docker-compose ps`

### Access Issues:
1. Regular users should only see their own data
2. Admins should see all data
3. Check user role in database
4. Verify session is stored in localStorage

### Session Issues:
1. Session persists on refresh (by design)
2. Only logout button clears session
3. Clear localStorage to force logout

---

## 📊 User Roles Explained

### Admin Role:
- ✅ View all users (50 users)
- ✅ View all alerts and incidents
- ✅ Access analytics and intelligence
- ✅ Create and resolve incidents
- ✅ Trigger anomalies for testing
- ✅ View system statistics

### User Role:
- ✅ View only their own data
- ✅ View their own activities
- ✅ View their own threat score
- ❌ Cannot see other users
- ❌ Cannot access admin features
- ❌ Cannot create incidents

---

## 🔐 Password Policy (Recommended)

For production deployment:

1. **Minimum Length:** 8 characters
2. **Complexity:** Mix of uppercase, lowercase, numbers, special chars
3. **Expiration:** Change every 90 days
4. **History:** Cannot reuse last 5 passwords
5. **Lockout:** 5 failed attempts = account locked for 30 minutes

---

**Last Updated:** November 14, 2024  
**Maintained By:** Security Administration Team  
**Document Version:** 1.0

---

**⚠️ REMEMBER:** Keep this document secure. Do not commit to public repositories.

