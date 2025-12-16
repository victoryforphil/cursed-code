# Full SWE Pipeline Flow

Example workflow for complex feature implementation.

## Trigger
User has a complex request that needs planning.

## Step 1: Planning

```
@planner Analyze and break down: "Add user authentication with JWT tokens to our Express API"
```

**Expected Output:**
```
## Analysis
The API currently has no auth. Need to add:
- JWT token generation/validation
- User model with password hashing
- Login/register endpoints
- Auth middleware for protected routes

## Tasks
1. [ ] Create User model in models/user.ts
2. [ ] Add bcrypt password hashing utility
3. [ ] Create JWT helper in utils/jwt.ts
4. [ ] Add POST /auth/register endpoint
5. [ ] Add POST /auth/login endpoint
6. [ ] Create authMiddleware in middleware/auth.ts
7. [ ] Apply middleware to protected routes
8. [ ] Add tests for auth flow

## Risks
- Password hashing needs proper salt rounds
- JWT secret must be in env vars
- Consider refresh token strategy for later
```

## Step 2: Architecture

```
@architect Create implementation specs for these tasks:
1. Create User model in models/user.ts
2. Add bcrypt password hashing utility
3. Create JWT helper in utils/jwt.ts
[paste all tasks]
```

**Expected Output:**
```
### Task: User Model

**File**: `src/models/user.ts`
**Location**: New file

**Implementation**:
```pseudocode
import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'

interface IUser {
  email: string
  password: string
  createdAt: Date
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if this.isModified('password'):
    this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidate):
  return bcrypt.compare(candidate, this.password)

export const User = model<IUser>('User', userSchema)
```

[...more specs for each task...]
```

## Step 3: Coding

```
@coder Execute these implementation specs:
[paste specs from architect]
```

**Expected Output:**
```
## Completed
- [x] User model: Created src/models/user.ts with schema and bcrypt hooks
- [x] JWT helper: Created src/utils/jwt.ts with sign/verify functions
- [x] Auth endpoints: Added register/login to src/routes/auth.ts
- [x] Middleware: Created src/middleware/auth.ts
- [x] Applied middleware to protected routes

## Verification
- Lint: pass
- Types: pass
- Tests: 8 passing, 0 failing

## Notes
- Added JWT_SECRET to .env.example
- Used existing error handler pattern from src/utils/errors.ts
```

## Completion
User reviews changes, runs full test suite, commits if satisfied.

# Log
- 2024-12-16: Initial flow documentation
