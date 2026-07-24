# User Groups Feature Documentation

## Overview

The User Groups feature allows learners to create and join learning communities on the Chitepo/Mindelta platform. This feature complements the existing Teams feature (which is designed for organizations) by providing informal learning groups, study circles, and community-based learning.

## Key Differences: Teams vs User Groups

### Teams (Existing Feature)
- **Purpose**: Organizational learning management
- **Use Cases**: Companies, enterprises, training organizations
- **Features**: License management, subscriptions, org hierarchies
- **Members**: Employees, team members with licenses
- **Focus**: Corporate/institutional training

### User Groups (New Feature)
- **Purpose**: Community-based learning and discussion
- **Use Cases**: Study groups, learning circles, party cells, ideology groups
- **Features**: Discussions, peer learning, meeting coordination
- **Members**: Individual learners with shared interests
- **Focus**: Collaborative learning and knowledge sharing

## Group Types

### 1. Study Groups
- **Purpose**: Collaborative learning on specific courses or topics
- **Features**: Course-focused discussions, study schedules, resource sharing

### 2. Discussion Groups
- **Purpose**: Topic-based discussions and knowledge exchange
- **Features**: Open discussions, Q&A, peer support

### 3. Party Cells
- **Purpose**: Political education and organization (e.g., ZANU PF cells)
- **Features**: Hierarchical structure, leadership roles, meeting schedules
- **Ideal For**: Chitepo School of Ideology courses

### 4. Branches
- **Purpose**: Regional/district-level organizations
- **Features**: Sub-group management, geographic organization

### 5. Learning Circles
- **Purpose**: Small, intimate learning communities
- **Features**: Peer-to-peer learning, collaborative problem-solving

### 6. Ideology Groups
- **Purpose**: Political education and ideological development
- **Features**: Structured curriculum, leadership development

## Privacy Levels

### Public Groups
- Visible in search results
- Anyone can see group details
- Anyone can join (with or without approval)
- **Best For**: Open learning communities, public discussions

### Private Groups
- Visible in search results
- Anyone can see group details
- Must request to join
- **Best For**: Moderated communities, structured learning

### Secret Groups
- Not visible in search
- Invitation-only membership
- Only members can see group details
- **Best For**: Closed study groups, private communities

## Member Roles

### Leader
- Full control over group settings
- Can approve/reject join requests
- Can promote/demote members
- Can manage all content
- **Similar to**: Party cell chairman, study group organizer

### Moderator
- Can approve/reject join requests
- Can moderate discussions
- Can manage content
- Cannot change group settings
- **Similar to**: Study group facilitator, discussion moderator

### Member
- Can participate in discussions
- Can view group content
- Can invite others (if enabled)
- **Similar to**: Regular group participant

## API Endpoints

### Group Management

#### Create Group
```http
POST /api/user-groups
Authorization: Bearer <token>

{
  "name": "Pan-Africanism Study Group",
  "description": "Studying Pan-African history and contemporary movements",
  "type": "study_group",
  "privacy": "public",
  "location": "Harare, Zimbabwe",
  "tags": ["pan-africanism", "history", "ideology"],
  "maxMembers": 50,
  "requireApproval": false,
  "focusAreas": ["course-id-1", "course-id-2"],
  "meetingSchedule": {
    "frequency": "weekly",
    "dayOfWeek": "Saturday",
    "time": "14:00",
    "location": "Community Center",
    "virtual": true
  }
}
```

#### Get Group
```http
GET /api/user-groups/:id
Authorization: Bearer <token> (optional for public groups)
```

#### Update Group
```http
PUT /api/user-groups/:id
Authorization: Bearer <token>

{
  "description": "Updated description",
  "maxMembers": 100
}
```

#### Delete Group
```http
DELETE /api/user-groups/:id
Authorization: Bearer <token>
```

#### Search Groups
```http
GET /api/user-groups?q=pan-africanism
```

#### Get Groups by Type
```http
GET /api/user-groups/by-type/party_cell
```

#### Get My Groups
```http
GET /api/user-groups/my-groups
Authorization: Bearer <token>
```

### Member Management

#### Join Group
```http
POST /api/user-groups/:id/join
Authorization: Bearer <token>

{
  "joinReason": "I want to learn more about Pan-Africanism" // Optional, for approval
}
```

#### Leave Group
```http
POST /api/user-groups/:id/leave
Authorization: Bearer <token>
```

#### Approve Join Request
```http
POST /api/user-groups/:id/approve-member
Authorization: Bearer <token>

{
  "membershipId": "member-uuid"
}
```

#### Remove Member
```http
DELETE /api/user-groups/:id/members/:userId
Authorization: Bearer <token>
```

#### Update Member Role
```http
PUT /api/user-groups/:id/members/:userId/role
Authorization: Bearer <token>

{
  "role": "moderator"
}
```

#### Get Group Members
```http
GET /api/user-groups/:id/members
Authorization: Bearer <token>
```

#### Get Pending Join Requests
```http
GET /api/user-groups/:id/pending-requests
Authorization: Bearer <token>
```

### Discussion Management

#### Create Discussion
```http
POST /api/user-groups/:id/discussions
Authorization: Bearer <token>

{
  "title": "How does Pan-Africanism relate to modern globalization?",
  "content": "I've been thinking about...",
  "tags": ["pan-africanism", "globalization"]
}
```

#### Get Group Discussions
```http
GET /api/user-groups/:id/discussions
Authorization: Bearer <token>
```

#### Get Discussion
```http
GET /api/user-groups/discussions/:discussionId
Authorization: Bearer <token>
```

#### Create Reply
```http
POST /api/user-groups/discussions/:discussionId/replies
Authorization: Bearer <token>

{
  "content": "Great question! I think...",
  "parentReplyId": "reply-uuid" // Optional, for nested replies
}
```

### Analytics

#### Get Group Analytics
```http
GET /api/user-groups/:id/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "overview": {
    "totalMembers": 45,
    "activeMembers": 32,
    "totalDiscussions": 28,
    "totalReplies": 156
  },
  "members": [
    {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "leader",
      "joinedAt": "2024-01-15T10:00:00Z",
      "lastActiveAt": "2024-01-20T14:30:00Z",
      "contributions": {
        "discussionsStarted": 5,
        "commentsPosted": 23,
        "resourcesShared": 8,
        "meetingsAttended": 12
      }
    }
  ]
}
```

## Use Cases for Chitepo School of Ideology

### 1. Party Cell Organization

Create hierarchical party structures:

```javascript
// Create Provincial Group
const province = await createGroup({
  name: "Harare Province",
  type: "branch",
  privacy: "private"
});

// Create District Group (child of province)
const district = await createGroup({
  name: "Harare Central District",
  type: "branch",
  parentGroupId: province.id,
  privacy: "private"
});

// Create Party Cell (child of district)
const cell = await createGroup({
  name: "Cell 5 - Mbare",
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
});
```

### 2. Course Study Groups

Create study groups for Chitepo courses:

```javascript
const studyGroup = await createGroup({
  name: "Pan-Africanism Study Circle",
  type: "study_group",
  privacy: "public",
  focusAreas: ["pan-africanism-course-id"],
  meetingSchedule: {
    frequency: "weekly",
    dayOfWeek: "Saturday",
    time: "10:00",
    virtual: true
  }
});
```

### 3. Discussion Forums

Create topic-based discussion groups:

```javascript
const discussionGroup = await createGroup({
  name: "Revolutionary Theory Discussion",
  type: "discussion_group",
  privacy: "public",
  tags: ["revolution", "theory", "marxism"],
  settings: {
    allowDiscussions: true,
    moderationEnabled: true
  }
});
```

## Database Schema

### user_groups
- `id`: UUID (primary key)
- `name`: varchar(255)
- `description`: text
- `type`: enum (study_group, discussion_group, party_cell, branch, learning_circle, ideology_group)
- `privacy`: enum (public, private, secret)
- `status`: enum (active, inactive, suspended, archived)
- `avatar`: varchar(500)
- `location`: varchar(255)
- `tags`: json
- `member_count`: int
- `max_members`: int (nullable)
- `allow_join_requests`: boolean
- `require_approval`: boolean
- `meeting_schedule`: json
- `focus_areas`: json
- `settings`: json
- `parent_group_id`: UUID (nullable, for hierarchical structures)
- `creator_id`: UUID (foreign key to users)
- `created_at`: timestamp
- `updated_at`: timestamp

### group_members
- `id`: UUID (primary key)
- `group_id`: UUID (foreign key to user_groups)
- `user_id`: UUID (foreign key to users)
- `role`: enum (leader, moderator, member)
- `status`: enum (active, pending, inactive, removed, banned)
- `joined_at`: timestamp
- `last_active_at`: timestamp
- `contributions`: json
- `join_reason`: text
- `approved_by_id`: UUID (foreign key to users)
- `approved_at`: timestamp
- `created_at`: timestamp
- `updated_at`: timestamp

### group_discussions
- `id`: UUID (primary key)
- `group_id`: UUID (foreign key to user_groups)
- `author_id`: UUID (foreign key to users)
- `title`: varchar(500)
- `content`: text
- `status`: enum (active, closed, pinned, archived)
- `tags`: json
- `view_count`: int
- `reply_count`: int
- `like_count`: int
- `is_pinned`: boolean
- `created_at`: timestamp
- `updated_at`: timestamp

### discussion_replies
- `id`: UUID (primary key)
- `discussion_id`: UUID (foreign key to group_discussions)
- `author_id`: UUID (foreign key to users)
- `content`: text
- `parent_reply_id`: UUID (nullable, foreign key to discussion_replies)
- `like_count`: int
- `created_at`: timestamp
- `updated_at`: timestamp

## Running Migrations

```bash
# Generate migration
cd backend
npm run migration:generate -- -n CreateUserGroups

# Run migrations
npm run migration:run

# Revert migrations (if needed)
npm run migration:revert
```

## Testing

### Create Test Groups
```bash
# Using curl or Postman
curl -X POST http://localhost:3000/api/user-groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Study Group",
    "type": "study_group",
    "privacy": "public"
  }'
```

## Frontend Integration

Coming soon: React components for:
- Group browsing and search
- Group creation wizard
- Group management dashboard
- Discussion forums
- Member management interface
- Analytics dashboard

## Best Practices

1. **Group Size**: Keep groups reasonably sized (10-50 members) for effective interaction
2. **Moderation**: Enable moderation for public groups to maintain quality
3. **Privacy**: Use appropriate privacy settings based on group purpose
4. **Hierarchy**: Use parent groups for organizational structures
5. **Engagement**: Encourage regular discussions and meetings

## Future Enhancements

- [ ] File sharing within groups
- [ ] Event management and calendar integration
- [ ] Live video meetings integration
- [ ] Gamification (badges, points)
- [ ] Advanced analytics and insights
- [ ] Mobile app support
- [ ] Email/push notifications
- [ ] Integration with courses (auto-create study groups)

## Support

For questions or issues, contact the development team or refer to the main platform documentation.

---

**Last Updated**: November 2024
**Version**: 1.0.0


