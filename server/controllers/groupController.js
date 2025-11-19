import groupModel from '../models/groupModel.js';
import userModel from '../models/userModel.js';

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name, description, coverImage, category, privacy, userId } = req.body;

    console.log('Creating group - User ID:', userId);
    console.log('Request body:', req.body);

    if (!userId) {
      return res.json({ success: false, message: 'User authentication required' });
    }

    if (!name || !description) {
      return res.json({ success: false, message: 'Name and description are required' });
    }

    const newGroup = new groupModel({
      name,
      description,
      coverImage: coverImage || '',
      category: category || 'General',
      privacy: privacy || 'public',
      admin: userId,
      members: [userId] // Admin is automatically a member
    });

    await newGroup.save();

    const populatedGroup = await groupModel.findById(newGroup._id)
      .populate('admin', 'name username profilePicture')
      .populate('members', 'name username profilePicture');

    res.json({ success: true, message: 'Group created successfully', group: populatedGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get all public groups or user's groups
const getAllGroups = async (req, res) => {
  try {
    const userId = req.body.userId;

    const groups = await groupModel.find({ 
      $or: [
        { privacy: 'public' },
        { members: userId }
      ]
    })
      .populate('admin', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get user's joined groups
const getUserGroups = async (req, res) => {
  try {
    const userId = req.body.userId;

    const groups = await groupModel.find({ members: userId })
      .populate('admin', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get a single group by ID
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    const group = await groupModel.findById(id)
      .populate('admin', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate({
        path: 'posts.author',
        select: 'name username profilePicture'
      })
      .populate({
        path: 'posts.comments.user',
        select: 'name username profilePicture'
      });

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    // Check if user has access (public group or member)
    if (group.privacy === 'private' && !group.members.some(m => m._id.toString() === userId)) {
      return res.json({ success: false, message: 'You do not have access to this group' });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.json({ success: false, message: error.message });
  }
};

// Join a group
const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    const group = await groupModel.findById(id);

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    if (group.members.includes(userId)) {
      return res.json({ success: false, message: 'You are already a member of this group' });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await groupModel.findById(id)
      .populate('admin', 'name username profilePicture')
      .populate('members', 'name username profilePicture');

    res.json({ success: true, message: 'Joined group successfully', group: updatedGroup });
  } catch (error) {
    console.error('Error joining group:', error);
    res.json({ success: false, message: error.message });
  }
};

// Leave a group
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    const group = await groupModel.findById(id);

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    if (group.admin.toString() === userId) {
      return res.json({ success: false, message: 'Admin cannot leave the group. Transfer admin rights or delete the group.' });
    }

    if (!group.members.includes(userId)) {
      return res.json({ success: false, message: 'You are not a member of this group' });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();

    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.json({ success: false, message: error.message });
  }
};

// Create a post in a group
const createGroupPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, imageUrl, userId } = req.body;

    const group = await groupModel.findById(id);

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.json({ success: false, message: 'You must be a member to post in this group' });
    }

    const newPost = {
      author: userId,
      content,
      imageUrl: imageUrl || '',
      likes: [],
      comments: [],
      createdAt: new Date()
    };

    group.posts.push(newPost);
    await group.save();

    const updatedGroup = await groupModel.findById(id)
      .populate('posts.author', 'name username profilePicture');

    const createdPost = updatedGroup.posts[updatedGroup.posts.length - 1];

    res.json({ success: true, message: 'Post created successfully', post: createdPost });
  } catch (error) {
    console.error('Error creating group post:', error);
    res.json({ success: false, message: error.message });
  }
};

// Like a group post
const likeGroupPost = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.body.userId;

    const group = await groupModel.findById(groupId);

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    const post = group.posts.id(postId);

    if (!post) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await group.save();

    res.json({ success: true, likes: post.likes.length });
  } catch (error) {
    console.error('Error liking post:', error);
    res.json({ success: false, message: error.message });
  }
};

// Add comment to group post
const commentOnGroupPost = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const { text, userId } = req.body;

    const group = await groupModel.findById(groupId);

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    const post = group.posts.id(postId);

    if (!post) {
      return res.json({ success: false, message: 'Post not found' });
    }

    post.comments.push({
      user: userId,
      text,
      createdAt: new Date()
    });

    await group.save();

    const updatedGroup = await groupModel.findById(groupId)
      .populate('posts.comments.user', 'name username profilePicture');

    const updatedPost = updatedGroup.posts.id(postId);

    res.json({ success: true, message: 'Comment added', comments: updatedPost.comments });
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.json({ success: false, message: error.message });
  }
};

// Delete a group (admin only)
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    const group = await groupModel.findById(id);

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    if (group.admin.toString() !== userId) {
      return res.json({ success: false, message: 'Only admin can delete the group' });
    }

    await groupModel.findByIdAndDelete(id);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.json({ success: false, message: error.message });
  }
};

export {
  createGroup,
  getAllGroups,
  getUserGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  createGroupPost,
  likeGroupPost,
  commentOnGroupPost,
  deleteGroup
};
