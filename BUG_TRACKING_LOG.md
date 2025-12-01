# 🐛 BookWormed - Bug Tracking Log

**Project:** BookWormed  
**Version:** 1.0.0-dev  
**Last Updated:** December 1, 2025  
**QA Lead:** Senior Test Engineer

---

## 🔴 Critical Bugs (2)

### BUG-001: Cannot Upload Profile Picture
- **Reported:** Dec 1, 2025
- **Module:** User Profile
- **Severity:** 🔴 Critical
- **Priority:** P0
- **Status:** 🆕 NEW
- **Assigned To:** -
- **Reporter:** QA Team

**Description:**  
Users cannot upload or change their profile picture. Only default emoji (👤) is displayed.

**Steps to Reproduce:**
1. Login to application
2. Navigate to profile page
3. Look for upload/edit button on profile picture
4. No button exists

**Expected:** File upload functionality with preview  
**Actual:** No upload mechanism

**Impact:** Users cannot personalize profiles

**Files Affected:**
- `client/src/pages/UserProfile.jsx` (UI missing)
- `server/routes/userRoutes.js` (API missing)
- `server/controllers/UserController.js` (controller missing)
- `server/models/userModel.js` (schema field missing)

**Proposed Fix:**
- [ ] Add `profilePicture: String` to user model
- [ ] Create Cloudinary account and add credentials
- [ ] Install `multer` for file uploads
- [ ] Add POST `/api/user/profile/picture` endpoint
- [ ] Create upload UI component
- [ ] Add file validation (max 5MB, JPG/PNG only)

**Estimated Effort:** 8 hours  
**Dependencies:** Cloudinary setup

---

### BUG-005: No Password Change for Logged-In Users
- **Reported:** Dec 1, 2025
- **Module:** Security
- **Severity:** 🔴 Critical
- **Priority:** P0
- **Status:** 🆕 NEW
- **Assigned To:** -
- **Reporter:** QA Team

**Description:**  
Logged-in users cannot change their password. Only "Forgot Password" exists for logged-out users.

**Steps to Reproduce:**
1. Login as any user
2. Try to find "Change Password" option
3. Check settings page (doesn't exist)
4. No way to change password without logging out

**Expected:** Change password form in settings  
**Actual:** Must use "Forgot Password" flow

**Impact:** Security risk - users cannot maintain account security

**Files Affected:**
- `server/routes/userRoutes.js` (route missing)
- `server/controllers/UserController.js` (function missing)
- Settings page (doesn't exist)

**Proposed Fix:**
- [ ] Add PUT `/api/user/change-password` route
- [ ] Create `changePassword` controller function
- [ ] Verify current password before allowing change
- [ ] Create Settings page with change password form
- [ ] Add form validation
- [ ] Send email notification on password change

**Estimated Effort:** 6 hours  
**Dependencies:** Settings page creation

---

## 🟠 High Severity Bugs (5)

### BUG-002: Cannot Update Bio
- **Severity:** 🟠 High | **Priority:** P1 | **Status:** 🆕 NEW
- **Module:** User Profile

**Quick Summary:** Bio displays "No bio added yet" permanently, no edit function

**Fix Required:** Add bio editing UI + PUT API endpoint  
**Effort:** 4 hours

---

### BUG-003: Cannot Edit Profile Information
- **Severity:** 🟠 High | **Priority:** P1 | **Status:** 🆕 NEW
- **Module:** User Profile

**Quick Summary:** Stuck with registration name/username, no edit profile page

**Fix Required:** Create settings page + profile edit functionality  
**Effort:** 12 hours

---

### BUG-004: No Account Deletion
- **Severity:** 🟠 High | **Priority:** P1 | **Status:** 🆕 NEW
- **Module:** Account Management
- **⚠️ COMPLIANCE ISSUE:** GDPR Violation

**Quick Summary:** Users cannot delete their account or data

**Fix Required:** Add account deletion with confirmation + data export  
**Effort:** 10 hours  
**Legal Priority:** URGENT

---

### BUG-010: Message Button is Placeholder
- **Severity:** 🟠 High | **Priority:** P1 | **Status:** 🆕 NEW
- **Module:** Social Communication

**Quick Summary:** "Message" button shows "Chat feature coming soon" alert

**Fix Required:** Either implement messaging or remove button  
**Effort:** 40 hours (full implementation) OR 1 hour (remove button)

---

### BUG-012: No Content Reporting System
- **Severity:** 🟠 High | **Priority:** P1 | **Status:** 🆕 NEW
- **Module:** Content Moderation
- **⚠️ SAFETY ISSUE:** Cannot moderate harmful content

**Quick Summary:** No way to report inappropriate posts, comments, or users

**Fix Required:** Add report functionality + admin review system  
**Effort:** 15 hours

---

## 🟡 Medium Severity Bugs (4)

### BUG-006: Cannot Upload Post Images
- **Severity:** 🟡 Medium | **Priority:** P2 | **Status:** 🆕 NEW
- **Module:** Content Creation

**Quick Summary:** Posts are text-only, no image attachments

**Fix Required:** Add image upload to posts  
**Effort:** 8 hours

---

### BUG-008: No Privacy Settings
- **Severity:** 🟡 Medium | **Priority:** P2 | **Status:** 🆕 NEW
- **Module:** Privacy & Security

**Quick Summary:** All profiles public, no private account mode

**Fix Required:** Add privacy settings + follow request system  
**Effort:** 10 hours

---

### BUG-009: No Block User Feature
- **Severity:** 🟡 Medium | **Priority:** P2 | **Status:** 🆕 NEW
- **Module:** Social Safety

**Quick Summary:** Users cannot block others or prevent interactions

**Fix Required:** Implement block functionality  
**Effort:** 8 hours

---

### BUG-013: Missing User Model Fields
- **Severity:** 🟡 Medium | **Priority:** P2 | **Status:** 🆕 NEW
- **Module:** Database Schema

**Quick Summary:** User model missing 7+ essential fields for profile features

**Fix Required:** Update schema with new fields  
**Effort:** 2 hours (+ migration time)

---

## 🟢 Low Severity Bugs (2)

### BUG-007: No Notification Preferences
- **Severity:** 🟢 Low | **Priority:** P3 | **Status:** 🆕 NEW
- **Module:** User Preferences

**Quick Summary:** Cannot customize notification settings

**Fix Required:** Add notification preferences page  
**Effort:** 6 hours

---

### BUG-011: Hardcoded Static Interests
- **Severity:** 🟢 Low | **Priority:** P3 | **Status:** 🆕 NEW
- **Module:** User Profile

**Quick Summary:** Interests not user-selectable, all users have same interests

**Fix Required:** Make interests editable  
**Effort:** 4 hours

---

## 📊 Bug Statistics

### By Severity
| Severity | Count | Percentage |
|----------|-------|------------|
| 🔴 Critical | 2 | 15% |
| 🟠 High | 5 | 38% |
| 🟡 Medium | 4 | 31% |
| 🟢 Low | 2 | 15% |
| **Total** | **13** | **100%** |

### By Status
| Status | Count |
|--------|-------|
| 🆕 New | 13 |
| 🔄 In Progress | 0 |
| ✅ Fixed | 0 |
| 🔍 Retest | 0 |
| ✔️ Verified | 0 |
| ⏸️ Deferred | 0 |

### By Priority
| Priority | Count |
|----------|-------|
| P0 (Critical) | 2 |
| P1 (High) | 5 |
| P2 (Medium) | 4 |
| P3 (Low) | 2 |

### By Module
| Module | Count |
|--------|-------|
| User Profile | 4 |
| Security | 2 |
| Social Features | 3 |
| Content | 1 |
| Privacy | 2 |
| Settings | 1 |

---

## 🔥 Top 5 Must-Fix Bugs

### 1. BUG-001: Profile Picture Upload
**Why:** Most visible missing feature, impacts all users  
**Risk:** Low engagement, unprofessional appearance  
**Effort:** 8 hours  
**ROI:** Very High

### 2. BUG-004: Account Deletion
**Why:** Legal compliance (GDPR)  
**Risk:** Potential fines, legal action  
**Effort:** 10 hours  
**ROI:** Critical for production

### 3. BUG-005: Password Change
**Why:** Security fundamental  
**Risk:** Account security compromise  
**Effort:** 6 hours  
**ROI:** High

### 4. BUG-002: Bio Editing
**Why:** Basic profile personalization  
**Risk:** Poor user experience  
**Effort:** 4 hours  
**ROI:** High (quick win)

### 5. BUG-012: Content Reporting
**Why:** Platform safety requirement  
**Risk:** Inappropriate content proliferation  
**Effort:** 15 hours  
**ROI:** Essential for community health

---

## 📅 Sprint Planning Recommendation

### Sprint 1 (Week 1-2): Critical + Quick Wins
**Goal:** Fix critical security/legal issues + visible features

- [ ] BUG-001: Profile Picture Upload (8h)
- [ ] BUG-002: Bio Editing (4h)
- [ ] BUG-005: Password Change (6h)
- [ ] BUG-004: Account Deletion (10h)

**Total:** 28 hours (3.5 dev days)

### Sprint 2 (Week 3-4): High Priority Features
**Goal:** Complete user profile & safety features

- [ ] BUG-003: Profile Editing (12h)
- [ ] BUG-012: Content Reporting (15h)
- [ ] BUG-009: Block User (8h)
- [ ] BUG-010: Message Feature (decide: implement or remove)

**Total:** 35 hours (4.5 dev days) + message decision

### Sprint 3 (Week 5-6): Medium Priority Enhancements
**Goal:** Add privacy & content features

- [ ] BUG-008: Privacy Settings (10h)
- [ ] BUG-006: Post Images (8h)
- [ ] BUG-013: Database Schema (2h + migration)

**Total:** 20 hours (2.5 dev days)

### Sprint 4 (Week 7-8): Polish & Preferences
**Goal:** User preferences & quality of life

- [ ] BUG-007: Notification Preferences (6h)
- [ ] BUG-011: Editable Interests (4h)
- [ ] Testing & bug fixes (10h)

**Total:** 20 hours (2.5 dev days)

---

## 🎯 Release Criteria

### Minimum Viable Product (MVP) - Production
**Must Fix Before Launch:**
- ✅ BUG-001: Profile Picture Upload
- ✅ BUG-004: Account Deletion (GDPR)
- ✅ BUG-005: Password Change (Security)
- ✅ BUG-012: Content Reporting (Safety)

**Total Effort:** ~39 hours (5 dev days)

### Full Feature Complete - v1.0
**All 13 Bugs Fixed**

**Total Effort:** ~108 hours (13.5 dev days)

---

## 📝 Change Log

| Date | Action | Details |
|------|--------|---------|
| Dec 1, 2025 | Initial Report | 13 bugs logged from QA testing |
| - | - | Awaiting development assignment |

---

## 🔗 Related Documents

- 📄 [Detailed Test Report](./TEST_REPORT_USER_FUNCTIONALITY.md)
- 📋 [Test Execution Sheet](./TEST_EXECUTION_SHEET.md)
- ⚡ [Critical Bugs Summary](./CRITICAL_BUGS_SUMMARY.md)

---

## 👥 Bug Triage Team

**QA Lead:** Senior Test Engineer  
**Dev Lead:** TBD  
**Product Owner:** TBD  
**Security Review:** Required for BUG-005, BUG-008, BUG-012

---

## 📞 Emergency Contact

For critical security issues or GDPR concerns:
- Contact: Development Team Lead
- Priority: Immediate attention required for BUG-004 (GDPR compliance)

---

**Status:** 🔴 **13 OPEN BUGS - Action Required**  
**Last Review:** December 1, 2025  
**Next Review:** TBD (after sprint planning)

---

*Generated by QA Department - BookWormed Project*
