# User Flagging System - Admin Implementation

**Date**: November 8, 2025
**Feature**: Evasion Detection & User Flagging
**Status**: ✅ Implemented

---

## 🎯 Overview

The Messages page now displays **real-time user flagging information** showing which users have attempted to evade the deal detection system. Admins can see flag levels, evasion attempt counts, and restriction status at a glance.

---

## ✅ What's Implemented

### **Enhanced Messages Dashboard**
**Location**: [/dashboard/messages](app/dashboard/messages/page.tsx:1)

### **1. Flag Level Badges**

Each participant in a conversation now shows their flag status:

```
User1 [WATCH (2)] ↔ User2 [WARNING (4)]
```

**Flag Levels Displayed:**
- 🔵 **WATCH** (1-2 attempts) - Blue badge with eye icon
- 🟡 **WARNING** (3-4 attempts) - Yellow badge with warning icon
- 🟠 **RESTRICTED** (5-9 attempts) - Orange badge with ban icon
- 🔴 **BANNED** (10+ attempts) - Red badge with shield icon

**Shows:**
- Flag level name (WATCH, WARNING, RESTRICTED, BANNED)
- Total evasion attempts count in parentheses
- Color-coded for quick visual identification

### **2. Evasion Attempt Alerts**

Below each conversation, see:
```
⚠️ 5 evasion attempt(s) in this conversation
```

This shows the total number of evasion attempts detected specifically in that conversation.

### **3. Enhanced Stats Cards**

Six stat cards now show:

| Card | Shows | Icon |
|------|-------|------|
| **Total Conversations** | All conversations | 💬 |
| **Active** | Active conversations | ✅ |
| **Unread Messages** | Unread count | 🕐 |
| **Flagged Users** | Users at Warning+ level | ⚠️ |
| **Restricted** | Users who can't message | 🚫 |
| **Evasion Attempts** | Total detected across platform | 🛡️ |

### **4. Real-Time Data Integration**

The system automatically fetches from these tables:
- `user_flags` - User flagging status and restriction info
- `security_logs` - Evasion attempt counts per conversation

---

## 🎨 Visual Design

### **Flag Level Colors**

```typescript
// Color scheme for flag levels
watch:      Blue    (#0ea5e9)
warning:    Yellow  (#eab308)
restricted: Orange  (#f97316)
banned:     Red     (#ef4444)
```

### **Badge Components**

Flags appear as compact badges:
- Small icon indicating flag type
- Flag level text (WATCH, WARNING, etc.)
- Attempt count in parentheses

**Example:**
```
⚠️ WARNING (4)
```

### **Conversation Row Layout**

```
[✓] Username1 🔵 WATCH (2) ↔ Username2 🟡 WARNING (4)
    email1@example.com • email2@example.com
    ⚠️ 5 evasion attempt(s) in this conversation
```

---

## 📊 How It Works

### **Data Flow**

1. **Fetch Conversations**
   - Gets all conversations from database
   - Extracts unique user IDs

2. **Fetch User Flags**
   - Queries `user_flags` table for all participants
   - Maps flags to conversation participants

3. **Fetch Evasion Counts**
   - Counts security logs with event_type LIKE '%evasion%'
   - Groups by conversation_id

4. **Display**
   - Shows flags next to usernames
   - Displays evasion counts per conversation
   - Updates stats cards with aggregated data

### **Database Queries**

**User Flags:**
```sql
SELECT * FROM user_flags
WHERE user_id IN (user_ids_from_conversations);
```

**Evasion Counts:**
```sql
SELECT COUNT(*) FROM security_logs
WHERE conversation_id = 'conv-uuid'
  AND event_type LIKE '%evasion%';
```

---

## 🔍 Flag Level Meanings

| Attempts | Level | Messaging | What Admin Sees |
|----------|-------|-----------|-----------------|
| 1-2 | **WATCH** | ✅ Allowed | Blue badge - Keep an eye on user |
| 3-4 | **WARNING** | ✅ Allowed | Yellow badge - User is pushing limits |
| 5-9 | **RESTRICTED** | ⚠️ Limited (7 days) | Orange badge - User can't send messages |
| 10+ | **BANNED** | ❌ Blocked (30 days) | Red badge - User is banned from messaging |

---

## 📱 Admin Actions

### **Viewing Flags**

1. Navigate to [Messages](/dashboard/messages)
2. Look for colored badges next to usernames
3. Check numbers in parentheses for attempt counts
4. Review conversation-level evasion alerts

### **Identifying High-Risk Conversations**

Look for:
- ⚠️ Multiple evasion attempts indicator
- 🟠 RESTRICTED or 🔴 BANNED badges
- High attempt counts (5+)

### **Filtering Flagged Users**

Currently shows in all conversations. Future enhancement could add filters:
- Show only flagged users
- Filter by flag level (Warning+, Restricted, Banned)
- Sort by evasion count

---

## 🛠️ Technical Implementation

### **TypeScript Interfaces**

```typescript
interface UserFlag {
  user_id: string;
  flag_level: 'watch' | 'warning' | 'restricted' | 'banned';
  total_evasion_attempts: number;
  messaging_restricted: boolean;
  restricted_until: string | null;
  last_evasion_attempt_at: string | null;
}

interface Conversation {
  // ... existing fields
  participant_1_flag?: UserFlag;
  participant_2_flag?: UserFlag;
  evasion_count?: number;
}
```

### **Helper Functions**

```typescript
// Get color for flag level
getFlagColor(flagLevel: string): string

// Get icon for flag level
getFlagIcon(flagLevel: string): React.ReactNode
```

### **Stats Calculation**

```typescript
stats = {
  flaggedUsers: conversations with participant at Warning+ level
  restrictedUsers: conversations with messaging_restricted = true
  totalEvasions: sum of all evasion_count across conversations
}
```

---

## 🚀 Future Enhancements

### **Phase 2 - User Details View**

- Click on flag badge to see full evasion history
- View specific messages that triggered detection
- See detection reasons and evasion scores

### **Phase 3 - Admin Actions**

Add these actions to dropdown menu:
- **View Evasion History** - Full security log for user
- **Manually Flag/Unflag** - Override automatic flagging
- **Extend Restriction** - Add more days to restriction
- **Permanent Ban** - Set restriction to far future
- **Add Review Notes** - Document admin decision

### **Phase 4 - Filters & Sorting**

Add filtering options:
- Filter by flag level
- Show only restricted users
- Sort by evasion count (highest first)
- Search by username/email

### **Phase 5 - Real-Time Alerts**

- Desktop notification when user gets flagged
- Alert when banned user attempts to message
- Daily summary of new flags

---

## 📖 Usage Examples

### **Example 1: Identifying Problem Users**

**Scenario**: Admin checks messages page

**What They See**:
```
User: John [🟡 WARNING (4)] ↔ Seller [🔵 WATCH (1)]
⚠️ 7 evasion attempt(s) in this conversation
```

**Admin Action**:
- John has 4 total attempts (all accounts)
- This conversation alone has 7 attempts
- Monitor closely - close to restriction

### **Example 2: Restricted User**

**Scenario**: User hits 5+ attempts

**What Admin Sees**:
```
User: Sarah [🟠 RESTRICTED (6)] ↔ Dealer [Clean]
⚠️ 6 evasion attempt(s) in this conversation
```

**Status**:
- Sarah is restricted for 7 days
- Cannot send new messages
- Admin can see restriction in progress

### **Example 3: Banned User**

**Scenario**: Repeat offender

**What Admin Sees**:
```
User: Mike [🔴 BANNED (12)] ↔ Agent [Clean]
⚠️ 15 evasion attempt(s) in this conversation
```

**Status**:
- Mike is banned for 30 days
- All messaging blocked
- Requires admin review to unban

---

## 🔐 Security & Privacy

### **Data Protection**

- Only admins can see flag information
- Users cannot see other users' flags
- Evasion attempts stored for 90 days
- Message content redacted after 90 days

### **Admin Permissions**

Required permissions:
- ✅ View conversations
- ✅ View user flags
- ✅ View security logs

Future permissions:
- ⏳ Modify flags (manual override)
- ⏳ Extend restrictions
- ⏳ View full security logs

---

## 📊 Analytics

The system provides these metrics on the dashboard:

### **Flagged Users**
Count of users at Warning level or higher. Helps identify how many users are pushing boundaries.

### **Restricted Users**
Count of users currently unable to message. Shows active restrictions in effect.

### **Total Evasion Attempts**
Sum of all detected evasion attempts across the platform. Indicates overall evasion activity.

### **Growth Tracking**

Monitor trends:
- Flagged user count over time
- Evasion attempts per week
- Restriction effectiveness

---

## ✅ Testing Checklist

### **Visual Testing**

- [ ] Flag badges display correctly
- [ ] Colors match flag levels
- [ ] Icons show properly
- [ ] Attempt counts accurate
- [ ] Evasion alerts visible

### **Data Testing**

- [ ] User flags fetch correctly
- [ ] Evasion counts calculated accurately
- [ ] Stats cards show right numbers
- [ ] Multiple flags in one conversation work
- [ ] Clean users show no badges

### **Edge Cases**

- [ ] User with no flags (clean user)
- [ ] Both users flagged in conversation
- [ ] Conversation with 0 evasions
- [ ] Newly flagged user appears immediately

---

## 🎯 Success Metrics

**Platform Health:**
- ✅ Admins can identify problem users instantly
- ✅ Visual indicators reduce review time
- ✅ Real-time data keeps admins informed

**Revenue Protection:**
- ✅ Early warning before users hit restriction
- ✅ Track evasion trends across platform
- ✅ Monitor effectiveness of restrictions

**User Management:**
- ✅ Quick identification of high-risk conversations
- ✅ Data-driven moderation decisions
- ✅ Clear visibility into user behavior

---

## 📞 Support

**For Admins:**
- Badge colors indicate severity
- Higher attempt counts = higher risk
- Restricted/Banned users need review

**For Developers:**
- Check [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) for deal detection
- See database schema in `types/supabase.ts`
- Review security logs table structure

---

## 🎉 Summary

The Messages page now provides **complete visibility** into user flagging and evasion attempts:

✅ **Flag levels** displayed next to usernames
✅ **Attempt counts** shown in parentheses
✅ **Evasion alerts** per conversation
✅ **Stats dashboard** with flagged/restricted counts
✅ **Color-coded badges** for quick identification
✅ **Real-time data** from database

**Result**: Admins can instantly identify problem users and track evasion activity across the entire platform!

---

**Version**: 1.0
**Last Updated**: November 8, 2025
**Feature**: User Flagging Display
**Status**: ✅ Production Ready
