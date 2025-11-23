# Test User Credentials

**DO NOT COMMIT THIS FILE - FOR LOCAL TESTING ONLY**

## User Accounts

### User 1
- **Email**: user@example.com
- **Password**: User@1234
- **Role**: user

### Admin
- **Email**: admin@test.com
- **Password**: Admin@1234
- **Role**: admin

### User 2
- **Email**: user2@example.com
- **Password**: User2@1234
- **Role**: user

## Usage

```bash
# Login as user
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "User@1234"}'

# Login as admin
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin@1234"}'

# Login as user2
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@example.com", "password": "User2@1234"}'
```
