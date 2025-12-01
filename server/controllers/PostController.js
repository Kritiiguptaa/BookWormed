import Post from '../models/postModel.js';
import { createNotificationHelper } from './NotificationController.js';
import userModel from '../models/userModel.js';
import { validateAndSanitizeText } from '../utils/sanitize.js';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { title, content, imageUrl, tags } = req.body;
    const userId = req.userId; // From auth middleware
    const userName = req.userName; // From auth middleware

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Sanitize title and content to prevent XSS
    const titleValidation = validateAndSanitizeText(title, 300);
    const contentValidation = validateAndSanitizeText(content, 10000);

    if (!titleValidation.valid) {
      return res.status(400).json({ success: false, message: titleValidation.error });
    }
    if (!contentValidation.valid) {
      return res.status(400).json({ success: false, message: contentValidation.error });
    }

    const newPost = new Post({
      title: titleValidation.sanitized,
      content: contentValidation.sanitized,
      author: userId,
      authorName: userName,
      imageUrl: imageUrl || '',
      tags: tags || []
    });

    await newPost.save();

    // Notify all followers about the new post
    try {
      const user = await userModel.findById(userId).select('followers');
      if (user && user.followers && user.followers.length > 0) {
        // Create notifications for all followers
        const notificationPromises = user.followers.map(followerId =>
          createNotificationHelper(followerId, userId, 'new_post', { postId: newPost._id })
        );
        await Promise.all(notificationPromises);
      }
    } catch (notifError) {
      console.error('Error creating follower notifications:', notifError);
      // Don't fail the post creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Error creating post' });
  }
};

// Get all posts (with pagination)
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ success: false, message: 'Error fetching posts' });
  }
};

// Get a single post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ success: false, message: 'Error fetching post' });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrl, tags } = req.body;
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    // Only update allowed fields - NEVER update author, authorName, or createdAt
    // These fields are immutable after creation to maintain data integrity
    post.title = title || post.title;
    post.content = content || post.content;
    post.imageUrl = imageUrl !== undefined ? imageUrl : post.imageUrl;
    post.tags = tags || post.tags;
    // Note: author, authorName, and createdAt are explicitly NOT updated

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, message: 'Error updating post' });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed } = req.body; // Require confirmation flag
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Require explicit confirmation to prevent accidental deletion
    if (!confirmed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please confirm post deletion',
        requiresConfirmation: true,
        postTitle: post.title
      });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    let post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    const isLiking = likeIndex === -1;

    // Use atomic operation to prevent race conditions
    if (isLiking) {
      // Like the post - use $addToSet to prevent duplicates
      post = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      );
      
      // Create notification for post author
      await createNotificationHelper(
        post.author.toString(),
        userId,
        'like_post',
        { postId: id }
      );
    } else {
      // Unlike the post - use $pull to remove
      post = await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
      likesCount: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
};

// Add a comment to a post
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userId;
    const userName = req.userName;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    // Sanitize comment text to prevent XSS
    const textValidation = validateAndSanitizeText(text, 1000);
    if (!textValidation.valid) {
      return res.status(400).json({ success: false, message: textValidation.error });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const newComment = {
      user: userId,
      userName,
      text: textValidation.sanitized,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Create notification for post author
    await createNotificationHelper(
      post.author.toString(),
      userId,
      'comment_post',
      { postId: id, comment: text.trim() }
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
};

// Get posts by user
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: userId });

    res.status(200).json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ success: false, message: 'Error fetching user posts' });
  }
};
