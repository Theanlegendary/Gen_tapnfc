# Group-Based QR Code Attendance System

## Overview

The Group-Based QR Code Attendance System provides a secure, flexible approach to attendance tracking that doesn't rely on GPS or physical location constraints. Instead, it uses group membership and secure QR codes to manage attendance.

## How It Works

### 1. Admin Creates Attendance Group

**Admin Dashboard → Group Management → Create New Group**

- Admin creates a group (e.g., "Software Development Team")
- Sets group rules:
  - Attendance window (e.g., 9:00 AM - 5:00 PM)
  - Late threshold (e.g., 15 minutes)
  - Working days (Monday-Friday)
  - Maximum members
  - Approval requirements
- System generates a unique secret key for the group
- Group invite QR code is automatically created

### 2. Admin Shares Group Invite QR Code

**Options for sharing:**
- Print QR code and post in office
- Share QR code image digitally
- Email QR code to potential members
- Display on screens/monitors

### 3. User Scans Group Invite QR Code

**User App → QR Scanner → Scan Group Invite**

- User scans the group invite QR code
- App extracts group information and secret key
- System creates a join request with:
  - User details (name, email, employee ID)
  - Group secret key (proves they scanned valid QR)
  - Timestamp of request
- Join request is sent to admin for approval

### 4. Admin Approves/Rejects Join Requests

**Admin Dashboard → Join Requests**

- Admin receives notification of new join request
- Reviews user details and group information
- Can approve or reject with optional message
- User receives notification of decision

### 5. Admin Creates Attendance QR Codes

**Admin Dashboard → Group Management → [Select Group] → Create Attendance QR**

**Quick Options:**
- Today's Attendance QR
- This Week's Attendance QR  
- This Month's Attendance QR

**Custom Options:**
- Event-specific attendance
- Custom date ranges
- Specific time windows
- Location-based attendance

### 6. Users Scan Attendance QR Codes

**User App → QR Scanner → Scan Attendance QR**

**Validation Process:**
1. Verify user is approved member of the group
2. Check if QR code is within valid time range
3. Verify attendance window is active
4. Record attendance with status (Present/Late/Early)

**Attendance Status:**
- **Present**: Scanned within normal hours
- **Late**: Scanned after grace period
- **Early**: Scanned before attendance window opens

### 7. Real-time Tracking & Alerts

**Admin Dashboard Features:**
- Live attendance monitoring
- Automatic absence detection
- Late arrival alerts
- Group attendance statistics
- Member activity tracking

## Key Benefits

### 🔒 **Enhanced Security**
- Secret keys prevent unauthorized QR creation
- Group membership validation
- Admin approval process
- App signature verification

### 🏢 **Location Flexibility**
- Works in multi-floor buildings
- No GPS dependency
- Perfect for remote/hybrid work
- Suitable for complex office layouts

### 👥 **Group Management**
- Department-specific attendance
- Team-based tracking
- Role-based access control
- Scalable membership system

### 📊 **Advanced Analytics**
- Group-specific reports
- Member attendance patterns
- Comparative group analysis
- Automated absence tracking

### ⚡ **Operational Efficiency**
- Quick QR generation for different time periods
- Bulk attendance tracking
- Automated status determination
- Real-time notifications

## Technical Implementation

### Group Invite QR Code Structure
```json
{
  "id": "qr_1642345678_abc123",
  "type": "group_invite",
  "groupId": "group_dev_team_001",
  "groupName": "Software Development Team",
  "groupDescription": "Daily attendance for developers",
  "secretKey": "GRP_DEV_2025_ABC123",
  "adminId": "admin_001",
  "adminName": "John Admin",
  "rules": {
    "allowLateJoining": true,
    "requireApproval": true,
    "attendanceWindow": {
      "startTime": "09:00",
      "endTime": "17:00"
    },
    "lateThresholdMinutes": 15,
    "allowedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },
  "maxMembers": 25,
  "currentMembers": 12,
  "validUntil": "2025-02-01T00:00:00Z",
  "appSignature": "secure_hash_signature",
  "createdAt": "2025-01-20T10:00:00Z"
}
```

### Group Attendance QR Code Structure
```json
{
  "id": "qr_att_1642345678_xyz789",
  "type": "group_attendance",
  "groupId": "group_dev_team_001",
  "groupSecretKey": "GRP_DEV_2025_ABC123",
  "attendanceId": "att_daily_20250120",
  "title": "Daily Attendance - Jan 20, 2025",
  "validFrom": "2025-01-20T08:00:00Z",
  "validUntil": "2025-01-20T18:00:00Z",
  "attendanceWindow": {
    "startTime": "09:00",
    "endTime": "17:00"
  },
  "location": "Main Office",
  "appSignature": "secure_hash_signature",
  "createdAt": "2025-01-20T08:00:00Z",
  "createdBy": "admin_001"
}
```

## Security Features

### 1. **Secret Key Validation**
- Each group has a unique secret key
- Secret key is embedded in both invite and attendance QR codes
- Prevents creation of fake QR codes

### 2. **App Signature Verification**
- All QR codes include cryptographic signature
- Signature validates QR was generated by authorized app
- Prevents external QR code creation

### 3. **Membership Validation**
- Only approved group members can mark attendance
- Real-time membership status checking
- Automatic rejection of unauthorized scans

### 4. **Time-based Validation**
- QR codes have validity periods
- Attendance windows prevent off-hours scanning
- Automatic expiration handling

## Admin Workflow

### Daily Operations
1. **Morning**: Generate today's attendance QR for each group
2. **Monitor**: Watch live attendance dashboard
3. **Respond**: Handle join requests as they come in
4. **Review**: Check attendance reports and alerts

### Weekly Operations
1. **Generate**: Create weekly attendance QR codes
2. **Analyze**: Review weekly attendance patterns
3. **Report**: Generate department reports
4. **Optimize**: Adjust group rules based on patterns

### Monthly Operations
1. **Review**: Monthly attendance statistics
2. **Export**: Generate comprehensive reports
3. **Audit**: Review group memberships
4. **Plan**: Adjust group structures as needed

## User Workflow

### Initial Setup
1. **Receive**: Group invite QR code from admin
2. **Scan**: Use mobile app to scan invite QR
3. **Request**: Submit join request with details
4. **Wait**: Receive notification when approved

### Daily Attendance
1. **Arrive**: Come to office/location
2. **Scan**: Use mobile app to scan attendance QR
3. **Confirm**: Receive attendance confirmation
4. **Track**: View attendance history in app

## Best Practices

### For Admins
- Create groups based on departments/teams
- Set realistic attendance windows
- Regularly review and approve join requests
- Generate attendance QR codes in advance
- Monitor attendance patterns for insights

### For Users
- Scan group invite QR as soon as received
- Keep mobile app updated
- Scan attendance QR within designated windows
- Check attendance history regularly
- Contact admin if experiencing issues

## Troubleshooting

### Common Issues

**"Invalid QR Code" Error**
- QR code may be expired
- QR code not generated by this app
- QR code corrupted or damaged

**"Access Denied" Error**
- User not a member of the group
- Join request still pending approval
- Group membership was revoked

**"Outside Attendance Window" Error**
- Scanning outside designated hours
- QR code validity period expired
- Wrong attendance QR for current time

### Solutions
1. **For Invalid QR**: Request new QR code from admin
2. **For Access Denied**: Check group membership status
3. **For Time Issues**: Verify current time and QR validity

This group-based system provides enterprise-level security and flexibility while maintaining ease of use for both administrators and end users.