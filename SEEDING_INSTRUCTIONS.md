# How to Seed the Chitepo Platform

## Prerequisites
Make sure your database is running and configured in your `.env` file.

## Step-by-Step Instructions

### Step 1: Run the Migration (Add Category Column)
```bash
cd backend
npm run migration:run
```

This will add the `category` column to the `courses` table.

### Step 2: Run the Seeds (Create All 26 Courses)
```bash
npm run seed
```

This will:
1. Create all users (admin, instructors, learners)
2. Seed original 16 Chitepo courses
3. Seed 10 new courses (Governance + Diaspora)
4. Create assessments and quizzes
5. Generate enrollments
6. Create certificates
7. Populate analytics data

### Alternative: Use Existing Scripts

**Full seeding (recommended):**
```bash
npm run seed
# or
npm run seed:run
```

**Development seeding only:**
```bash
npm run seed:dev
```

**Course seeding only:**
```bash
npm run seed:courses
```

## Expected Output

You should see output like:
```
[seeds] Connecting to MySQL { host: 'localhost', port: 3306, ... }
Database connection established
[seeds] Disabled foreign key checks
[seeds] Starting comprehensive database seeding...
Starting to seed Chitepo School of Ideology courses...
Created course: Pan-Africanism and African Unity
  Created module: Historical Foundations of Pan-Africanism
    Created lesson: Early Pan-African Movements
    Created lesson: Key Figures: Nkrumah, Nyerere, and Cabral
    ...
Starting to seed 10 new Chitepo courses...
Created course: District Coordinating Committee (DCC) Training
  Created module: Political Mobilization and Organization
    Created lesson: Grassroots Organizing Fundamentals
    ...
✅ New Chitepo courses seeding completed!
   Total new courses created: 10
   Categories:
   - Practical Governance Track (6 courses)
   - Diaspora Engagement Program (4 courses)
✅ All seeds completed successfully!
📊 Database is now ready for development with:
   - Multiple user accounts (admin, instructors, learners)
   - Comprehensive course catalog (26 Chitepo School courses)
     • 16 core and contemporary courses
     • 6 practical governance track courses
     • 4 diaspora engagement program courses
   - Realistic enrollment patterns
   - Certificate records
   - Analytics events for the last 30 days
```

## Verify the Data

### Check Course Count
```sql
SELECT COUNT(*) FROM courses;
-- Should return 26
```

### Check Courses by Category
```sql
SELECT category, COUNT(*) as count 
FROM courses 
WHERE category IS NOT NULL
GROUP BY category;
```

Expected results:
- `practical_governance`: 6 courses
- `diaspora_program`: 4 courses
- (16 courses will have NULL category - the original courses)

### Check All Course Titles
```sql
SELECT title, category FROM courses ORDER BY category, title;
```

## Troubleshooting

### Error: "ER_NO_SUCH_TABLE: Table 'mindelta.courses' doesn't exist"
**Solution:** Run migrations first
```bash
npm run migration:run
```

### Error: "ER_DUP_ENTRY: Duplicate entry"
**Solution:** Courses already exist. Either:
1. Skip (seeds check for existing courses automatically)
2. Or reset the database:
```bash
npm run db:reset
```

### Error: "category" column doesn't exist
**Solution:** Run the migration:
```bash
npm run migration:run
```

### Error: Cannot find module '@mindelta/shared'
**Solution:** Build the shared package first:
```bash
cd ../shared
npm run build
cd ../backend
```

## Start the Application

After seeding, start the backend:
```bash
npm run start:dev
```

Then start the frontend in another terminal:
```bash
cd ../frontend
npm run dev
```

## Visit the New Pages

- **All Courses:** http://localhost:3000/courses
- **Filter by Category:** Click on any category card
- **Government Officials Track:** http://localhost:3000/government-officials
- **Diaspora Hub:** http://localhost:3000/diaspora (coming soon)

## Default User Accounts

Check the `users` file in the project root for default credentials:
- **Admin:** admin@mindelta.com / Admin@123
- **Instructor:** instructor1@mindelta.com / Instructor@123
- **Learner:** learner1@mindelta.com / Learner@123

---

**Status:** Ready to seed! All 26 courses prepared with categories.
**Last Updated:** November 26, 2025

