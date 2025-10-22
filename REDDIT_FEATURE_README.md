# Reddit-Like Posts Feature

## Overview
A complete Reddit-style posting system where users can create posts, like them, and comment on them.

## 📁 New Files Created

### Backend (Server)
1. **`server/models/postModel.js`** - MongoDB schema for posts
2. **`server/controllers/PostController.js`** - All post-related logic
3. **`server/routes/postRoutes.js`** - API endpoints for posts
4. **`server/middlewares/authPost.js`** - Enhanced authentication middleware

### Frontend (Client)
1. **`client/src/components/CreatePost.jsx`** - Component to create new posts
2. **`client/src/components/PostCard.jsx`** - Individual post display with interactions
3. **`client/src/components/PostFeed.jsx`** - Feed showing all posts with pagination
4. **`client/src/pages/Posts.jsx`** - Main page for the posts feature

## 🚀 Features

### Post Creation
- Title and content (required)
- Optional image URL
- Tags support
- Character limits (title: 300, content: 10,000)

### Post Interactions
- ❤️ Like/Unlike posts
- 💬 Comment on posts
- 🗑️ Delete own posts
- 🗑️ Delete own comments

### Feed Features
- Pagination (10 posts per page)
- Load more functionality
- Real-time like/comment counts
- Timestamp display (e.g., "2h ago", "1 day ago")

## 🔌 API Endpoints

### Public Endpoints
```
GET  /api/post/all              - Get all posts (with pagination)
GET  /api/post/:id              - Get single post by ID
GET  /api/post/user/:userId     - Get posts by specific user
```

### Protected Endpoints (Require Authentication)
```
POST   /api/post/create              - Create new post
PUT    /api/post/:id                 - Update post
DELETE /api/post/:id                 - Delete post
POST   /api/post/:id/like            - Like/Unlike post
POST   /api/post/:id/comment         - Add comment
DELETE /api/post/:id/comment/:commentId - Delete comment
```

## 📊 Database Schema

### Post Model
```javascript
{
  title: String (required, max 300 chars)
  content: String (required, max 10,000 chars)
  author: ObjectId (ref: User)
  authorName: String
  likes: [ObjectId] (array of user IDs)
  comments: [{
    user: ObjectId
    userName: String
    text: String (max 1000 chars)
    createdAt: Date
  }]
  imageUrl: String (optional)
  tags: [String] (array of tags)
  createdAt: Date
  updatedAt: Date
}
```

## 🎨 UI Components

### CreatePost Component
- Expandable form
- Input validation
- Error handling
- Success feedback

### PostCard Component
- User avatar (generated from name)
- Post content with formatting
- Like button with count
- Comment section (expandable)
- Delete option for post authors
- Relative timestamps

### PostFeed Component
- Loading states
- Error handling
- Infinite scroll with "Load More"
- Empty state messaging

### Posts Page
- Header with login prompt
- Create post section (authenticated users only)
- Feed display
- Community guidelines

## 🔐 Authentication

Posts use the enhanced `authPost` middleware which:
- Verifies JWT token
- Fetches user details from database
- Provides `userId` and `userName` to controllers
- Returns 401 for unauthorized requests

## 🎯 How to Use

### 1. Access the Posts Page
Import and add to your routing:
```javascript
import Posts from './pages/Posts';

// In your router
<Route path="/posts" element={<Posts />} />
```

### 2. Create a Post
- Login to your account
- Click "Create a post..."
- Fill in title and content
- Optionally add image URL and tags
- Click "Post"

### 3. Interact with Posts
- Click ❤️ to like/unlike
- Click 💬 to view/add comments
- Click ⋮ (if author) to delete post

## 📦 Dependencies Used
- `axios` - HTTP requests
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - Authentication
- React Context API - State management

## 🔄 Updates Made to Existing Files

### `server/server.js`
Added:
```javascript
import postRouter from './routes/postRoutes.js';
app.use('/api/post', postRouter);
```

**No other existing files were modified!** All functionality is in new, separate files for easy GitHub updates.

## 🚦 Getting Started

The servers are already running! Just:

1. Navigate to the Posts page in your app
2. Login if you haven't already
3. Start creating posts!

## 🛠️ Future Enhancements (Optional)

- Upvote/downvote system
- Post editing
- Image upload (not just URL)
- Search and filter posts
- User profiles
- Post categories
- Nested comments
- Share functionality
- Report/flag posts

## 📝 Notes

- All new files are modular and independent
- Easy to push to GitHub (separate components)
- Follows existing project structure
- Uses existing authentication system
- Responsive design with Tailwind CSS
- No breaking changes to existing code

---

Created: October 23, 2025
Ready for GitHub commit! 🎉
