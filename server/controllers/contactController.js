const ContactSupport = require('../models/ContactSupport');
const TaskDetails = require('../models/TaskDetails');
const { emailService } = require('../services/emailService');

// Submit contact support request
const submitContactRequest = async (req, res) => {
  try {
    const { title, description, name, email, attachments } = req.body;
    
    // Validate required fields
    if (!title || !description || !name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, name, and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Process attachments (array of attachment objects with url, filename, size)
    const processedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      attachments.forEach(attachment => {
        if (attachment.url && attachment.filename) {
          processedAttachments.push({
            filename: attachment.filename,
            originalName: attachment.filename,
            mimetype: attachment.mimetype || 'application/octet-stream',
            size: attachment.size || 0,
            path: attachment.url // Store the URL as the path
          });
        }
      });
    }

    // Generate ticket number in format T-MMDDYYY-Timestamp
    const now = new Date();
    const month = String(now.getMonth() ).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()); // Last 3 digits of year
    const timestamp = String(now.getTime()).slice(-4); // Last 4 digits of timestamp
    const ticketNumber = `T${month}${day}${year}${timestamp}`;

    // Create contact support request
    const contactRequest = new ContactSupport({
      title: title.trim(),
      description: description.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      attachments: processedAttachments,
      tags: ['general'], // Default tag
      ticketNumber: ticketNumber // Set the generated ticket number
    });

    await contactRequest.save();

    // Create a task for the support request
    let createdTask = null;
    try {
      const taskData = {
        Name: `Support Request: ${title}`,
        Description: `Support request from ${name} (${email})\n\nDescription: ${description}`,
        Type: 'Bug',
        Priority: 'High',
        ProjectID_FK: '1718b30e-236e-490c-bb3a-8a75bfdb37df',
        ParentID: '978ccbd0-9051-40c9-abdc-0d7af4136503', // UserStory ID for customer support
        Status: 2, // Assigned
        AssignedDate: new Date(),
        CreatedBy: '68d3130111a3cf84135b14e4', // System user for support requests
        IsActive: true,
        CreatedDate: new Date(),
        TicketNumber: contactRequest.ticketNumber,
        Assignee: '68d3130111a3cf84135b14e4',
        AssignedTo: '681d488bb30030619cf0053d',
        DueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
      };

      const newTask = new TaskDetails(taskData);
      createdTask = await newTask.save();
      
      console.log(`Created support task: ${createdTask.TaskID} for contact request: ${contactRequest.ticketNumber}`);
    } catch (taskError) {
      console.error('Failed to create support task:', taskError);
      // Don't fail the contact request if task creation fails
    }

    // Send confirmation email to user
    try {
      await emailService.sendContactConfirmation({
        to: email,
        name: name,
        ticketNumber: contactRequest.ticketNumber,
        title: title,
        description: description
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to support team
    try {
      await emailService.sendContactNotification({
        ticketNumber: contactRequest.ticketNumber,
        title: title,
        description: description,
        name: name,
        email: email,
        attachments: processedAttachments,
        taskId: createdTask ? createdTask.TaskID : null
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: `Contact request submitted successfully. Your ticket number is: ${contactRequest.ticketNumber}`,
      ticketNumber: contactRequest.ticketNumber,
      taskId: createdTask ? createdTask.TaskID : null,
      data: {
        id: contactRequest._id,
        ticketNumber: contactRequest.ticketNumber,
        status: contactRequest.status,
        createdAt: contactRequest.createdAt,
        taskCreated: !!createdTask,
        taskId: createdTask ? createdTask.TaskID : null
      }
    });

  } catch (error) {
    console.error('Error submitting contact request:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact request. Please try again.'
    });
  }
};

// Get contact support requests (for admin)
const getContactRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const contactRequests = await ContactSupport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'firstName lastName email')
      .populate('responses.responder', 'firstName lastName email')
      .lean();

    const total = await ContactSupport.countDocuments(query);

    res.json({
      success: true,
      data: contactRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Error fetching contact requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact requests'
    });
  }
};

// Get single contact request
const getContactRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const contactRequest = await ContactSupport.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('responses.responder', 'firstName lastName email')
      .lean();

    if (!contactRequest) {
      return res.status(404).json({
        success: false,
        error: 'Contact request not found'
      });
    }

    res.json({
      success: true,
      data: contactRequest
    });

  } catch (error) {
    console.error('Error fetching contact request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact request'
    });
  }
};

// Update contact request status
const updateContactRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, tags, response } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (tags) updateData.tags = tags;

    // If status is being changed to resolved, set resolvedAt
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const contactRequest = await ContactSupport.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contactRequest) {
      return res.status(404).json({
        success: false,
        error: 'Contact request not found'
      });
    }

    // Add response if provided
    if (response) {
      contactRequest.responses.push({
        message: response.message,
        responder: req.user._id,
        responderEmail: req.user.email,
        isInternal: response.isInternal || false
      });
      await contactRequest.save();
    }

    res.json({
      success: true,
      message: 'Contact request updated successfully',
      data: contactRequest
    });

  } catch (error) {
    console.error('Error updating contact request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact request'
    });
  }
};

// Delete contact request
const deleteContactRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const contactRequest = await ContactSupport.findById(id);
    if (!contactRequest) {
      return res.status(404).json({
        success: false,
        error: 'Contact request not found'
      });
    }

    // Delete attachment files
    if (contactRequest.attachments && contactRequest.attachments.length > 0) {
      contactRequest.attachments.forEach(attachment => {
        if (fs.existsSync(attachment.path)) {
          fs.unlinkSync(attachment.path);
        }
      });
    }

    await ContactSupport.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Contact request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact request'
    });
  }
};

module.exports = {
  submitContactRequest,
  getContactRequests,
  getContactRequest,
  updateContactRequest,
  deleteContactRequest
};
