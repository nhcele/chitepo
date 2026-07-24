# User Groups - Quick Start Guide

## What You've Got

A complete **User Groups** feature has been added to your Chitepo/Mindelta platform! This feature allows learners to create study groups, party cells, learning circles, and discussion communities.

## What's Been Implemented

### ✅ Backend (NestJS)
1. **Entities** (Database Models):
   - `UserGroup` - Main group entity
   - `GroupMember` - Group membership management
   - `GroupDiscussion` - Discussion threads
   - `DiscussionReply` - Nested replies

2. **Service Layer** (`user-groups.service.ts`):
   - Group CRUD operations
   - Member management (join, leave, approve, remove)
   - Discussion management
   - Analytics and reporting

3. **Controller** (`user-groups.controller.ts`):
   - RESTful API endpoints
   - JWT authentication guards
   - Request validation

4. **Module** (`user-groups.module.ts`):
   - Integrated with main app module
   - TypeORM repositories configured

5. **Migration** (`1700000000000-CreateUserGroups.ts`):
   - Database schema for all tables
   - Foreign keys and indexes

## Quick Setup

### 1. Run Database Migration

```bash
cd backend
npm run migration:run
```

This creates 4 new tables:
- `user_groups`
- `group_members`
- `group_discussions`
- `discussion_replies`

### 2. Start the Server

```bash
# Backend
cd backend
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### 3. Test the API

#### Create a Study Group
```bash
curl -X POST http://localhost:3000/api/user-groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pan-Africanism Study Group",
    "description": "Studying Pan-African history and movements",
    "type": "study_group",
    "privacy": "public",
    "location": "Harare",
    "tags": ["pan-africanism", "history"]
  }'
```

#### Search Groups
```bash
curl http://localhost:3000/api/user-groups?q=pan-africanism
```

#### Join a Group
```bash
curl -X POST http://localhost:3000/api/user-groups/{group-id}/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Use Cases for Your Platform

### 1. Political Education (Party Cells)

Perfect for the Chitepo School of Ideology:

```javascript
// Create a party cell
{
  "name": "Cell 5 - Mbare",
  "type": "party_cell",
  "privacy": "secret",
  "maxMembers": 10,
  "requireApproval": true,
  "meetingSchedule": {
    "frequency": "weekly",
    "dayOfWeek": "Wednesday",
    "time": "18:00"
  }
}
```

### 2. Course Study Groups

Link study groups to your Chitepo courses:

```javascript
{
  "name": "Revolutionary Theory Study Circle",
  "type": "study_group",
  "privacy": "public",
  "focusAreas": ["revolutionary-theory-course-id"],
  "maxMembers": 25
}
```

### 3. Hierarchical Organization

Create province → district → cell structures:

```javascript
// Province
{
  "name": "Harare Province",
  "type": "branch",
  "privacy": "private"
}

// District (child of province)
{
  "name": "Harare Central",
  "type": "branch",
  "parentGroupId": "province-uuid",
  "privacy": "private"
}

// Cell (child of district)
{
  "name": "Cell 5",
  "type": "party_cell",
  "parentGroupId": "district-uuid",
  "privacy": "secret"
}
```

## Key Features

### Group Types
- ✅ **Study Groups** - Course-focused learning
- ✅ **Discussion Groups** - Topic-based discussions
- ✅ **Party Cells** - Political organization (ZANU PF structure)
- ✅ **Branches** - Regional/district groups
- ✅ **Learning Circles** - Peer-to-peer learning
- ✅ **Ideology Groups** - Political education

### Privacy Levels
- ✅ **Public** - Open to all, visible in search
- ✅ **Private** - Visible but requires approval
- ✅ **Secret** - Invitation-only, hidden from search

### Member Roles
- ✅ **Leader** - Full control (like cell chairman)
- ✅ **Moderator** - Can moderate content
- ✅ **Member** - Regular participant

### Features
- ✅ Create & manage groups
- ✅ Join/leave groups
- ✅ Approval workflow for join requests
- ✅ Discussion threads with nested replies
- ✅ Member contributions tracking
- ✅ Group analytics
- ✅ Hierarchical group structures
- ✅ Meeting schedules
- ✅ Search and discovery

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user-groups` | Create group |
| GET | `/api/user-groups` | Search groups |
| GET | `/api/user-groups/:id` | Get group details |
| PUT | `/api/user-groups/:id` | Update group |
| DELETE | `/api/user-groups/:id` | Delete group |
| GET | `/api/user-groups/my-groups` | Get my groups |
| GET | `/api/user-groups/by-type/:type` | Get groups by type |
| POST | `/api/user-groups/:id/join` | Join group |
| POST | `/api/user-groups/:id/leave` | Leave group |
| GET | `/api/user-groups/:id/members` | Get members |
| POST | `/api/user-groups/:id/approve-member` | Approve join request |
| DELETE | `/api/user-groups/:id/members/:userId` | Remove member |
| PUT | `/api/user-groups/:id/members/:userId/role` | Update member role |
| POST | `/api/user-groups/:id/discussions` | Create discussion |
| GET | `/api/user-groups/:id/discussions` | Get discussions |
| POST | `/api/user-groups/discussions/:id/replies` | Reply to discussion |
| GET | `/api/user-groups/:id/analytics` | Get group analytics |

## Next Steps

### 1. Frontend Components (To Do)
Create React components:
- Group browser/search page
- Group creation wizard
- Group dashboard
- Discussion forum
- Member management UI

### 2. Integration with Existing Features
- Link groups to courses
- Show related groups on course pages
- Add group activity to user dashboard
- Notifications for group activities

### 3. Testing
- Write unit tests for service methods
- Integration tests for API endpoints
- E2E tests for user flows

## File Structure

```
backend/src/user-groups/
├── entities/
│   ├── user-group.entity.ts         # Main group entity
│   ├── group-member.entity.ts       # Membership entity
│   └── group-discussion.entity.ts   # Discussion entities
├── dto/
│   ├── create-group.dto.ts          # Create group DTO
│   ├── update-group.dto.ts          # Update group DTO
│   ├── join-group.dto.ts            # Join/approval DTOs
│   └── create-discussion.dto.ts     # Discussion DTOs
├── user-groups.service.ts           # Business logic
├── user-groups.controller.ts        # API endpoints
└── user-groups.module.ts            # Module configuration
```

## Differences from Teams Feature

| Feature | Teams | User Groups |
|---------|-------|-------------|
| **Purpose** | Organizational training | Community learning |
| **Use Case** | Companies, enterprises | Study groups, cells |
| **Licenses** | ✅ Yes | ❌ No |
| **Subscriptions** | ✅ Yes | ❌ No |
| **Discussions** | ❌ No | ✅ Yes |
| **Hierarchy** | Flat | ✅ Multi-level |
| **Privacy** | Private | Public/Private/Secret |
| **Size** | Unlimited | Configurable limit |

## Troubleshooting

### Migration Fails
```bash
# Check if tables already exist
psql -d mindelta -c "\dt"

# Drop tables if needed (caution!)
psql -d mindelta -c "DROP TABLE IF EXISTS discussion_replies, group_discussions, group_members, user_groups CASCADE;"

# Re-run migration
npm run migration:run
```

### Module Not Found
Make sure `UserGroupsModule` is imported in `app.module.ts`:
```typescript
import { UserGroupsModule } from './user-groups/user-groups.module';

@Module({
  imports: [
    // ... other modules
    UserGroupsModule,
  ],
})
```

### Authentication Issues
- Make sure `JwtAuthGuard` is properly configured
- Check that your JWT token is valid
- Verify user ID is being extracted from token correctly

## Support

- **Full Documentation**: See `USER_GROUPS_DOCUMENTATION.md`
- **API Reference**: All endpoints documented with examples
- **ZANU PF Structure**: Example of party cell hierarchy included

## What's Not Included (Yet)

These would be great next features:
- [ ] Frontend UI components
- [ ] File sharing in groups
- [ ] Event/calendar integration
- [ ] Push notifications
- [ ] Email digests
- [ ] Mobile app support
- [ ] Video meetings integration
- [ ] Advanced moderation tools

## Example: Creating a Complete Party Structure

```javascript
// 1. Create National Structure
const national = await createGroup({
  name: "ZANU PF National",
  type: "branch",
  privacy: "private"
});

// 2. Create Provincial Branches
const provinces = await Promise.all([
  createGroup({
    name: "Harare Province",
    type: "branch",
    parentGroupId: national.id,
    privacy: "private"
  }),
  createGroup({
    name: "Bulawayo Province",
    type: "branch",
    parentGroupId: national.id,
    privacy: "private"
  })
]);

// 3. Create Districts
const district = await createGroup({
  name: "Harare Central District",
  type: "branch",
  parentGroupId: provinces[0].id,
  privacy: "private"
});

// 4. Create Party Cells
const cells = await Promise.all([
  createGroup({
    name: "Cell 1 - Mbare",
    type: "party_cell",
    parentGroupId: district.id,
    privacy: "secret",
    maxMembers: 10,
    requireApproval: true,
    meetingSchedule: {
      frequency: "weekly",
      dayOfWeek: "Wednesday",
      time: "18:00",
      location: "Community Hall"
    }
  }),
  createGroup({
    name: "Cell 2 - Highfield",
    type: "party_cell",
    parentGroupId: district.id,
    privacy: "secret",
    maxMembers: 10,
    requireApproval: true
  })
]);
```

This creates a complete hierarchical structure matching the ZANU PF organization you analyzed earlier!

---

**Ready to use!** The backend is fully implemented and ready for frontend integration.


