# 🚀 Quick Start Guide - Chitepo School of Ideology Platform

## Getting Started in 5 Minutes

### 1. Start the Backend
```bash
cd backend
npm run start:dev
```
✅ Backend will start on `http://localhost:3000`

### 2. Start the Frontend (New Terminal)
```bash
cd frontend
npm run dev
```
✅ Frontend will start on `http://localhost:3000` (or next available port)

### 3. Explore the Platform

Visit these pages to see the new features:

#### 📚 Browse All Courses
**URL:** `http://localhost:3000/courses`

**What you'll see:**
- 4 beautiful category cards with course counts
- Filter courses by:
  - 🔥 Core Ideological Courses (8 courses)
  - 🌍 Contemporary Studies (8 courses)
  - 🏛️ Practical Governance (6 courses)
  - ✈️ Diaspora Program (4 courses)

#### 🏛️ Government Officials Track
**URL:** `http://localhost:3000/government-officials`

**What you'll see:**
- 5 specialized training tracks
- 4 certification levels (Certificate → Advanced → Diploma → Trainer)
- Annual training calendar
- Mandatory training requirements
- Benefits grid

#### ✈️ Diaspora Hub
**URL:** `http://localhost:3000/diaspora`

**What you'll see:**
- 4 training streams (Political, Heritage, Investment, Advocacy)
- Global network stats (31,000+ members)
- Impact metrics dashboard
- Regional coordinator information
- Success stories

#### 🎓 Certification Explorer
**URL:** `http://localhost:3000/certifications`

**What you'll see:**
- Interactive pathway selector (6 pathways)
- Level-by-level breakdowns
- Cost and duration for each pathway
- Recognition of Prior Learning (RPL) info
- University articulation details

#### 📊 My Certifications (User Dashboard)
**URL:** `http://localhost:3000/my-certifications`

**What you'll see:**
- Personal certification progress cards
- Progress bars for each pathway
- Course completion statistics
- AI-powered recommendations
- Overall achievement stats
- Certificate download (when awarded)

---

## 🔌 API Endpoints Reference

All API endpoints are available at `http://localhost:3000/api`

### Course Endpoints
```bash
# Get all courses
GET /api/courses

# Filter courses by category
GET /api/courses/category/core_ideology
GET /api/courses/category/contemporary_studies
GET /api/courses/category/practical_governance
GET /api/courses/category/diaspora_program

# Get single course
GET /api/courses/:id
```

### Certification Endpoints
```bash
# Get all certification pathways
GET /api/certifications/pathways

# Filter pathways by type
GET /api/certifications/pathways/type/general_education
GET /api/certifications/pathways/type/government_officials
GET /api/certifications/pathways/type/diaspora_engagement
GET /api/certifications/pathways/type/youth_leadership
GET /api/certifications/pathways/type/womens_leadership

# Get user's certification progress (requires auth)
GET /api/certifications/progress
Headers: Authorization: Bearer <token>

# Get recommended pathways (requires auth)
GET /api/certifications/recommendations
Headers: Authorization: Bearer <token>

# Enroll in pathway (requires auth)
POST /api/certifications/enroll
Headers: Authorization: Bearer <token>
Body: { "pathwayId": "uuid" }

# Check eligibility (requires auth)
GET /api/certifications/eligibility/:pathwayId
Headers: Authorization: Bearer <token>

# Award certification (admin only)
POST /api/certifications/award
Body: { "userId": "uuid", "pathwayId": "uuid" }
```

---

## 🗄️ Database Verification

### Check Course Count
```sql
-- Should return 26
SELECT COUNT(*) FROM courses;
```

### Check Course Categories
```sql
-- Should show: 8, 8, 6, 4
SELECT category, COUNT(*) as count 
FROM courses 
WHERE category IS NOT NULL 
GROUP BY category;
```

### Check Certification Pathways
```sql
-- Should return 19
SELECT COUNT(*) FROM certification_pathways;
```

### Check Pathway Distribution
```sql
-- Should show: 5, 4, 4, 3, 3
SELECT type, COUNT(*) as count 
FROM certification_pathways 
GROUP BY type;
```

---

## 🎯 Testing the Features

### 1. Test Category Filtering
1. Go to `/courses`
2. Click on "Core Ideological Courses" card
3. Should show 8 courses
4. Click on "Contemporary Studies"
5. Should show 8 different courses

### 2. Test Certification Progress Tracker
1. Make sure you're logged in
2. Go to `/my-certifications`
3. If no certifications, you'll see "No Certifications Yet"
4. Click "Explore Certification Pathways"
5. Browse available pathways

### 3. Test API Endpoints
```bash
# Get all pathways
curl http://localhost:3000/api/certifications/pathways

# Get courses by category
curl http://localhost:3000/api/courses/category/core_ideology

# Get government officials pathways
curl http://localhost:3000/api/certifications/pathways/type/government_officials
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in .env
```

### Database connection error
```bash
# Verify MySQL is running
# Check credentials in backend/.env:
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=mindelta
```

### Courses not showing categories
```bash
# Run the category update script
cd backend
npm run update:categories
```

### Certification tables missing
```bash
# Create the tables
cd backend
npm run add:certifications
```

### No certification pathways
```bash
# Seed the pathways
cd backend
npm run seed
```

---

## 📊 What's Included

### Courses: 26 Total
- ✅ Core Ideological Courses: 8
- ✅ Contemporary Studies: 8
- ✅ Practical Governance: 6
- ✅ Diaspora Program: 4

### Certification Pathways: 19 Total
- ✅ General Education: 5 levels
- ✅ Government Officials: 4 levels
- ✅ Diaspora Engagement: 4 levels
- ✅ Youth Leadership: 3 levels
- ✅ Women's Leadership: 3 levels

### Landing Pages: 5
- ✅ `/courses` - Enhanced with categories
- ✅ `/government-officials` - Specialized track
- ✅ `/diaspora` - Diaspora hub
- ✅ `/certifications` - Pathway explorer
- ✅ `/my-certifications` - Progress tracker

### API Endpoints: 15+
- ✅ Course management
- ✅ Category filtering
- ✅ Certification pathways
- ✅ Progress tracking
- ✅ Recommendations
- ✅ Enrollment
- ✅ Eligibility checking

---

## 🎓 User Journeys

### Journey 1: Government Official
1. Visit `/government-officials`
2. Read about mandatory requirements
3. Check which track applies to you
4. View courses in that track
5. Enroll and begin training

### Journey 2: Diaspora Member
1. Visit `/diaspora`
2. Explore 4 training streams
3. Read success stories
4. Contact regional coordinator
5. Enroll in relevant courses

### Journey 3: General Learner
1. Visit `/courses`
2. Browse by category
3. View course details
4. Enroll in courses
5. Track progress in `/my-certifications`

### Journey 4: Youth Leader
1. Visit `/certifications`
2. Select "Youth Leadership Track"
3. See 3-level progression
4. Check eligibility
5. Start with Level 1

---

## 📞 Need Help?

### Documentation
- **Complete Implementation:** See `IMPLEMENTATION_COMPLETE_REPORT.md`
- **Final Summary:** See `FINAL_IMPLEMENTATION_SUMMARY.md`
- **TODO List:** See `CHITEPO_IMPLEMENTATION_TODO.md`

### Specific Features
- **Government Track:** See `GOVERNMENT_OFFICIALS_TRACK.md`
- **Diaspora Program:** See `DIASPORA_PROGRAM.md`
- **Certifications:** See `CERTIFICATION_PATHWAYS.md`

### Contact
- **Email:** info@chitepo.edu.zw
- **Phone:** +263 242 CHITEPO
- **Website:** www.chitepo.edu.zw

---

## ✅ Verification Checklist

Before declaring success, verify:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access `/courses` page
- [ ] Category filtering works on courses page
- [ ] Can access `/government-officials` page
- [ ] Can access `/diaspora` page
- [ ] Can access `/certifications` page
- [ ] Can access `/my-certifications` page (when logged in)
- [ ] Database has 26 courses
- [ ] Database has 19 certification pathways
- [ ] All API endpoints respond correctly

---

**🎉 You're all set! The platform is ready to use.**

**"Liberating the Mind, the Spirit, and the Nation"**

