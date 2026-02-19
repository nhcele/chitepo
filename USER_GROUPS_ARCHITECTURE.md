# User Groups - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Groups Feature                          │
│                  (Community Learning Platform)                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend UI    │────▶│   REST API       │────▶│    Database      │
│   (To Build)     │     │   (NestJS)       │     │   (PostgreSQL)   │
│                  │◀────│   ✅ Complete    │◀────│   ✅ Complete    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## Database Schema

```
┌────────────────────────┐
│     user_groups        │
├────────────────────────┤
│ • id (PK)              │
│ • name                 │
│ • type (enum)          │
│ • privacy (enum)       │
│ • status               │
│ • parent_group_id (FK) │──┐ Self-referencing
│ • creator_id (FK)      │  │ for hierarchy
│ • meeting_schedule     │  │
│ • focus_areas          │◀─┘
└────────────────────────┘
         │
         │ 1:N
         ▼
┌────────────────────────┐
│    group_members       │
├────────────────────────┤
│ • id (PK)              │
│ • group_id (FK)        │
│ • user_id (FK)         │
│ • role (enum)          │
│ • status (enum)        │
│ • contributions        │
│ • joined_at            │
└────────────────────────┘
         │
         │ 1:N
         ▼
┌────────────────────────┐
│  group_discussions     │
├────────────────────────┤
│ • id (PK)              │
│ • group_id (FK)        │
│ • author_id (FK)       │
│ • title                │
│ • content              │
│ • view_count           │
│ • reply_count          │
└────────────────────────┘
         │
         │ 1:N
         ▼
┌────────────────────────┐
│   discussion_replies   │
├────────────────────────┤
│ • id (PK)              │
│ • discussion_id (FK)   │
│ • author_id (FK)       │
│ • parent_reply_id (FK) │──┐ Self-referencing
│ • content              │  │ for nesting
│ • like_count           │◀─┘
└────────────────────────┘
```

## Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      AppModule                           │
│  (backend/src/app.module.ts)                            │
└─────────────────────────────────────────────────────────┘
                           │
                           │ imports
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 UserGroupsModule                         │
│  (backend/src/user-groups/user-groups.module.ts)       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │         UserGroupsController                    │   │
│  │  • POST   /api/user-groups                     │   │
│  │  • GET    /api/user-groups                     │   │
│  │  • GET    /api/user-groups/:id                 │   │
│  │  • PUT    /api/user-groups/:id                 │   │
│  │  • DELETE /api/user-groups/:id                 │   │
│  │  • POST   /api/user-groups/:id/join            │   │
│  │  • POST   /api/user-groups/:id/discussions     │   │
│  │  • GET    /api/user-groups/:id/analytics       │   │
│  └────────────────────────────────────────────────┘   │
│                           │                              │
│                           │ uses                         │
│                           ▼                              │
│  ┌────────────────────────────────────────────────┐   │
│  │         UserGroupsService                       │   │
│  │  • createGroup()                               │   │
│  │  • joinGroup()                                 │   │
│  │  • approveJoinRequest()                        │   │
│  │  • createDiscussion()                          │   │
│  │  • getGroupAnalytics()                         │   │
│  │  ... 20+ methods                               │   │
│  └────────────────────────────────────────────────┘   │
│                           │                              │
│                           │ uses                         │
│                           ▼                              │
│  ┌────────────────────────────────────────────────┐   │
│  │         TypeORM Repositories                    │   │
│  │  • UserGroupRepository                         │   │
│  │  • GroupMemberRepository                       │   │
│  │  • GroupDiscussionRepository                   │   │
│  │  • DiscussionReplyRepository                   │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Group Types & Use Cases

```
┌─────────────────────────────────────────────────────────────┐
│                     Group Types                              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Study Groups    │   │ Discussion Groups│   │  Learning Circles│
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ • Course-focused │   │ • Topic-based    │   │ • Peer learning  │
│ • Scheduled      │   │ • Q&A forums     │   │ • Small groups   │
│ • Collaborative  │   │ • Open discourse │   │ • Collaborative  │
└──────────────────┘   └──────────────────┘   └──────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Party Cells    │   │    Branches      │   │ Ideology Groups  │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ • 7-10 members   │   │ • Regional org   │   │ • Political ed   │
│ • Weekly meetings│   │ • Multi-level    │   │ • Structured     │
│ • Secret privacy │   │ • District/Prov  │   │ • Curriculum     │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

## Hierarchical Structure Example

```
National ZANU PF Structure
────────────────────────────────────────────────────────

                    ┌─────────────────┐
                    │    National     │ (type: branch)
                    └─────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼───────┐      ┌───────▼───────┐
        │    Harare     │      │   Bulawayo    │ (type: branch)
        │   Province    │      │   Province    │
        └───────────────┘      └───────────────┘
                │
        ┌───────┴───────┐
        │               │
    ┌───▼───┐      ┌───▼───┐
    │Central│      │ North │              (type: branch)
    │District│      │District│
    └───────┘      └───────┘
        │
    ┌───┴───────────┐
    │               │
┌───▼───┐      ┌───▼───┐
│Cell 1 │      │Cell 2 │                (type: party_cell)
│ Mbare │      │Highfld│
└───────┘      └───────┘
(7-10 members) (7-10 members)
```

## Privacy & Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                    Privacy Levels                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PUBLIC                                                        │
├──────────────────────────────────────────────────────────────┤
│ ✅ Visible in search                                         │
│ ✅ Anyone can view details                                   │
│ ✅ Anyone can join (optional approval)                       │
│ 📋 Best for: Study groups, open discussions                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PRIVATE                                                       │
├──────────────────────────────────────────────────────────────┤
│ ✅ Visible in search                                         │
│ ✅ Anyone can view details                                   │
│ ⚠️  Must request to join                                     │
│ ⚠️  Requires approval                                        │
│ 📋 Best for: Moderated communities, structured groups       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SECRET                                                        │
├──────────────────────────────────────────────────────────────┤
│ ❌ NOT visible in search                                     │
│ ❌ Only members see details                                  │
│ 🔒 Invitation-only                                           │
│ 🔒 Requires approval                                         │
│ 📋 Best for: Party cells, confidential groups               │
└──────────────────────────────────────────────────────────────┘
```

## Member Roles & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                    Member Roles                              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ LEADER (Cell Chairman / Organizer)                           │
├──────────────────────────────────────────────────────────────┤
│ ✅ Full group control                                        │
│ ✅ Approve/reject members                                    │
│ ✅ Change member roles                                       │
│ ✅ Modify group settings                                     │
│ ✅ Delete group                                              │
│ ✅ Moderate all content                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ MODERATOR (Facilitator)                                      │
├──────────────────────────────────────────────────────────────┤
│ ✅ Approve/reject members                                    │
│ ✅ Moderate content                                          │
│ ✅ Pin/unpin discussions                                     │
│ ❌ Cannot change settings                                    │
│ ❌ Cannot delete group                                       │
│ ❌ Cannot change roles                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ MEMBER (Participant)                                         │
├──────────────────────────────────────────────────────────────┤
│ ✅ View all content                                          │
│ ✅ Create discussions                                        │
│ ✅ Reply to discussions                                      │
│ ✅ Leave group                                               │
│ ❌ Cannot moderate                                           │
│ ❌ Cannot manage members                                     │
└──────────────────────────────────────────────────────────────┘
```

## API Request Flow

```
User Action → Frontend → API Endpoint → Controller → Service → Database
────────────────────────────────────────────────────────────────────────

Example: Create a Party Cell

1. User fills form:
   {
     "name": "Cell 5 - Mbare",
     "type": "party_cell",
     "privacy": "secret",
     "maxMembers": 10
   }

2. POST /api/user-groups
   ↓
3. UserGroupsController.createGroup()
   ↓
4. JwtAuthGuard validates token
   ↓
5. UserGroupsService.createGroup()
   ↓
6. Validates data
   ↓
7. Creates group in database
   ↓
8. Creates leader membership
   ↓
9. Returns group object
   ↓
10. Response to frontend
```

## Discussion Thread Structure

```
Group Discussion (Reddit-style Threading)
─────────────────────────────────────────────────

Discussion: "How does Pan-Africanism relate to globalization?"
├─ Reply 1: "I think Pan-Africanism..."
│  ├─ Reply 1.1: "Great point! I would add..."
│  └─ Reply 1.2: "I disagree because..."
│     └─ Reply 1.2.1: "Actually, if you consider..."
├─ Reply 2: "Historically, Pan-Africanism..."
│  └─ Reply 2.1: "This reminds me of Nkrumah's..."
└─ Reply 3: "From a modern perspective..."

Database Representation:
┌──────────────────────────┐
│   group_discussions      │
│   id: disc-123           │
│   title: "How does..."   │
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│   discussion_replies     │
│   id: reply-1            │
│   parent_reply_id: null  │ (Top-level)
├──────────────────────────┤
│   id: reply-1.1          │
│   parent_reply_id: reply-1│ (Nested)
├──────────────────────────┤
│   id: reply-1.2          │
│   parent_reply_id: reply-1│ (Nested)
├──────────────────────────┤
│   id: reply-1.2.1        │
│   parent_reply_id: reply-1.2│ (Nested deeper)
└──────────────────────────┘
```

## File Organization

```
chitepo/
├── backend/src/
│   ├── app.module.ts ✅ (Updated)
│   └── user-groups/
│       ├── entities/
│       │   ├── user-group.entity.ts ✅
│       │   ├── group-member.entity.ts ✅
│       │   └── group-discussion.entity.ts ✅
│       ├── dto/
│       │   ├── create-group.dto.ts ✅
│       │   ├── update-group.dto.ts ✅
│       │   ├── join-group.dto.ts ✅
│       │   └── create-discussion.dto.ts ✅
│       ├── user-groups.service.ts ✅ (584 lines)
│       ├── user-groups.controller.ts ✅ (136 lines)
│       └── user-groups.module.ts ✅
│
├── backend/src/database/migrations/
│   └── 1700000000000-CreateUserGroups.ts ✅
│
└── Documentation/
    ├── USER_GROUPS_DOCUMENTATION.md ✅ (500+ lines)
    ├── USER_GROUPS_QUICK_START.md ✅ (400+ lines)
    ├── USER_GROUPS_SUMMARY.md ✅ (200+ lines)
    └── USER_GROUPS_ARCHITECTURE.md ✅ (This file)
```

## Deployment Checklist

```
✅ Backend Implementation
   ✅ Entities created
   ✅ DTOs created
   ✅ Service implemented
   ✅ Controller implemented
   ✅ Module configured
   ✅ Migration created
   ✅ Integrated with app.module.ts

⬜ Database Setup
   ⬜ Run migration
   ⬜ Verify tables created
   ⬜ Test with sample data

⬜ Frontend Development (Next Steps)
   ⬜ Create group browser UI
   ⬜ Create group creation form
   ⬜ Create group dashboard
   ⬜ Create discussion forum UI
   ⬜ Create member management UI

⬜ Testing
   ⬜ Unit tests for service
   ⬜ Integration tests for API
   ⬜ E2E tests for flows

⬜ Documentation
   ✅ API documentation
   ✅ Setup guide
   ✅ Architecture diagram
   ⬜ User guide
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Technology Stack             │
├─────────────────────────────────────┤
│ Backend Framework: NestJS            │
│ Language: TypeScript                 │
│ ORM: TypeORM                         │
│ Database: PostgreSQL                 │
│ Authentication: JWT (Passport)       │
│ Validation: class-validator          │
│ API Style: RESTful                   │
└─────────────────────────────────────┘
```

---

**Architecture Complete!** 🎉

The entire backend is fully implemented and ready for:
1. Database migration
2. API testing
3. Frontend integration

See other documentation files for detailed usage instructions.


