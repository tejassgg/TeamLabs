const readline = require('readline');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { randomUUID: uuidv4 } = require('crypto');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Error: MONGO_URI environment variable is not defined.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.error("Connected to MongoDB for MCP server");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Models
const User = require('./models/User');
const Project = require('./models/Project');
const TaskDetails = require('./models/TaskDetails');
const Organization = require('./models/Organization');
const Team = require('./models/Team');
const TeamDetails = require('./models/TeamDetails');
const ProjectDetails = require('./models/ProjectDetails');
const TaskDetailsHistory = require('./models/TaskDetailsHistory');
const CommonType = require('./models/CommonType');
const { logActivity } = require('./services/activityService');
const { emitDashboardMetrics } = require('./services/dashboardMetricsService');

// Stdio reader
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Helpers
function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

async function resolveUser(userInput) {
  if (!userInput) return null;
  userInput = String(userInput).trim();

  if (/^[0-9a-fA-F]{24}$/.test(userInput)) {
    const user = await User.findById(userInput);
    if (user) return user._id.toString();
  }

  // Search by Email
  let user = await User.findOne({ email: userInput.toLowerCase() });
  if (user) return user._id.toString();

  // Search by Username
  user = await User.findOne({ username: { $regex: new RegExp('^' + escapeRegex(userInput) + '$', 'i') } });
  if (user) return user._id.toString();

  // Search by Full Name
  const parts = userInput.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    user = await User.findOne({
      firstName: { $regex: new RegExp('^' + escapeRegex(first) + '$', 'i') },
      lastName: { $regex: new RegExp('^' + escapeRegex(last) + '$', 'i') }
    });
    if (user) return user._id.toString();
  } else {
    // Single name
    user = await User.findOne({
      $or: [
        { firstName: { $regex: new RegExp('^' + escapeRegex(userInput) + '$', 'i') } },
        { lastName: { $regex: new RegExp('^' + escapeRegex(userInput) + '$', 'i') } }
      ]
    });
    if (user) return user._id.toString();
  }

  return null;
}

async function resolveOrganization(orgInput) {
  if (!orgInput) return null;
  const strInput = String(orgInput).trim();

  if (/^\d+$/.test(strInput)) {
    const num = parseInt(strInput, 10);
    const org = await Organization.findOne({ OrganizationID: num });
    if (org) return org.OrganizationID;
  }

  const orgByName = await Organization.findOne({ Name: { $regex: new RegExp('^' + escapeRegex(strInput) + '$', 'i') } });
  if (orgByName) return orgByName.OrganizationID;

  return null;
}

async function resolveProject(projectInput) {
  if (!projectInput) return null;
  const strInput = String(projectInput).trim();

  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(strInput)) {
    const project = await Project.findOne({ ProjectID: strInput });
    if (project) return project.ProjectID;
  }

  // Search by Name (case-insensitive)
  const projectByName = await Project.findOne({ Name: { $regex: new RegExp('^' + escapeRegex(strInput) + '$', 'i') } });
  if (projectByName) return projectByName.ProjectID;

  // Partial match search as fallback
  const projectPartial = await Project.findOne({ Name: { $regex: new RegExp(escapeRegex(strInput), 'i') } });
  if (projectPartial) return projectPartial.ProjectID;

  return null;
}

async function resolveTaskStatus(statusInput) {
  if (statusInput === undefined || statusInput === null) return undefined;

  if (typeof statusInput === 'number') {
    return statusInput;
  }
  if (typeof statusInput === 'string' && /^\d+$/.test(statusInput.trim())) {
    return parseInt(statusInput.trim(), 10);
  }

  const typeStr = String(statusInput).trim();
  const found = await CommonType.findOne({
    MasterType: 'ProjectStatus',
    Value: { $regex: new RegExp('^' + escapeRegex(typeStr) + '$', 'i') }
  });
  if (found) return found.Code;

  const lower = typeStr.toLowerCase();
  if (lower === 'not assigned' || lower === 'backlog' || lower === 'todo' || lower === 'to do') return 1;
  if (lower === 'assigned') return 2;
  if (lower === 'in progress' || lower === 'inprogress' || lower === 'active') return 3;
  if (lower === 'under review' || lower === 'underreview' || lower === 'review') return 4;
  if (lower === 'completed' || lower === 'done' || lower === 'finished') return 6;

  return undefined;
}

function resolvePriority(priority) {
  if (!priority) return 3;
  const p = String(priority).trim().toLowerCase();
  if (p === 'critical' || p === '1' || priority === 1) return 1;
  if (p === 'high' || p === '2' || priority === 2) return 2;
  if (p === 'medium' || p === '3' || priority === 3) return 3;
  if (p === 'low' || p === '4' || priority === 4) return 4;
  return 3;
}

function resolveType(type) {
  if (!type) return 'Task';
  const t = String(type).trim().toLowerCase();
  const valid = ['Task', 'Bug', 'User Story', 'Feature', 'Improvement', 'Documentation', 'Maintenance', 'Support'];
  const matched = valid.find(v => v.toLowerCase() === t);
  return matched || 'Task';
}

function formatResponse(data) {
  return {
    content: [
      {
        type: "text",
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      }
    ]
  };
}

function formatError(errorMessage) {
  return {
    content: [
      {
        type: "text",
        text: `Error: ${errorMessage}`
      }
    ],
    isError: true
  };
}

// Tool functions
async function getListOrganizations() {
  const orgs = await Organization.find({ IsActive: true });
  return formatResponse(orgs);
}

async function getListUsers(args) {
  let query = { isActive: true };
  if (args.organization) {
    const resolvedOrg = await resolveOrganization(args.organization);
    if (resolvedOrg !== null) {
      query.organizationID = String(resolvedOrg);
    }
  }
  const users = await User.find(query).select('username firstName lastName email organizationID role status');
  return formatResponse(users);
}

async function getListProjects(args) {
  let query = { IsActive: true };
  if (args.organization) {
    const resolvedOrg = await resolveOrganization(args.organization);
    if (resolvedOrg !== null) {
      query.OrganizationID = String(resolvedOrg);
    }
  }
  const projects = await Project.find(query);
  return formatResponse(projects);
}

async function getCreateProject(args) {
  const orgId = await resolveOrganization(args.organization);
  if (orgId === null) {
    return formatError(`Organization "${args.organization}" could not be resolved.`);
  }
  const ownerId = await resolveUser(args.projectOwner);
  if (!ownerId) {
    return formatError(`Project owner "${args.projectOwner}" could not be resolved.`);
  }

  const newProject = new Project({
    Name: args.name,
    Description: args.description || "",
    OrganizationID: String(orgId),
    ProjectOwner: ownerId,
    DueDate: args.dueDate ? new Date(args.dueDate) : undefined,
    IsActive: true,
    ProjectStatusID: 1
  });
  await newProject.save();

  try {
    await logActivity(
      ownerId,
      'project_create',
      'success',
      `Created new project "${args.name}" via MCP`,
      null,
      {
        projectId: newProject.ProjectID,
        projectName: args.name,
        organizationId: String(orgId)
      }
    );
  } catch (e) {
    console.error("Failed to log activity:", e);
  }

  try { await emitDashboardMetrics(String(orgId)); } catch (e) { }

  return formatResponse(newProject);
}

async function getUpdateProject(args) {
  let project = await Project.findOne({ ProjectID: args.projectID });
  if (!project) return formatError(`Project with ID "${args.projectID}" not found.`);

  const oldValues = {
    name: project.Name,
    description: project.Description,
    dueDate: project.DueDate,
    statusId: project.ProjectStatusID
  };

  if (args.name !== undefined) project.Name = args.name;
  if (args.description !== undefined) project.Description = args.description;
  if (args.projectStatusID !== undefined) project.ProjectStatusID = args.projectStatusID;
  if (args.dueDate !== undefined) project.DueDate = args.dueDate ? new Date(args.dueDate) : null;
  project.ModifiedDate = new Date();

  await project.save();

  try {
    await logActivity(
      project.ProjectOwner,
      'project_update',
      'success',
      `Updated project "${project.Name}" via MCP`,
      null,
      {
        projectId: project.ProjectID,
        projectName: project.Name,
        oldValues,
        newValues: {
          name: project.Name,
          description: project.Description,
          dueDate: project.DueDate,
          statusId: project.ProjectStatusID
        }
      }
    );
  } catch (e) { }

  try { await emitDashboardMetrics(project.OrganizationID); } catch (e) { }

  return formatResponse(project);
}

async function getDeleteProject(args) {
  let project = await Project.findOne({ ProjectID: args.projectID });
  if (!project) return formatError(`Project with ID "${args.projectID}" not found.`);

  project.IsActive = false;
  project.ModifiedDate = new Date();
  await project.save();

  try {
    await logActivity(
      project.ProjectOwner,
      'project_update',
      'success',
      `Deactivated project "${project.Name}" via MCP`,
      null,
      { projectId: project.ProjectID }
    );
  } catch (e) { }

  try { await emitDashboardMetrics(project.OrganizationID); } catch (e) { }

  return formatResponse({ success: true, message: `Project deactivated successfully` });
}

async function getListTasks(args) {
  let query = { IsActive: true };

  if (args.projectID || args.project) {
    const projIdentifier = args.projectID || args.project;
    const resolvedProjId = await resolveProject(projIdentifier);
    if (!resolvedProjId) {
      return formatError(`Project "${projIdentifier}" could not be resolved.`);
    }
    query.ProjectID_FK = resolvedProjId;
  }

  if (args.assignedTo) {
    const resolvedUserId = await resolveUser(args.assignedTo);
    if (!resolvedUserId) {
      return formatError(`Assignee "${args.assignedTo}" could not be resolved.`);
    }
    query.AssignedTo = resolvedUserId;
  }

  if (args.type) {
    query.Type = resolveType(args.type);
  }

  if (args.status !== undefined) {
    const resolvedStatus = await resolveTaskStatus(args.status);
    if (resolvedStatus !== undefined) {
      query.Status = resolvedStatus;
    }
  }

  const tasks = await TaskDetails.find(query).lean();

  const userIds = [...new Set([
    ...tasks.map(t => t.AssignedTo),
    ...tasks.map(t => t.CreatedBy)
  ].filter(Boolean))];

  const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName username email');
  const userMap = new Map(users.map(u => [u._id.toString(), u]));

  const enrichedTasks = tasks.map(t => {
    const assigned = userMap.get(t.AssignedTo);
    const creator = userMap.get(t.CreatedBy);
    return {
      ...t,
      AssignedToDetails: assigned ? {
        fullName: `${assigned.firstName} ${assigned.lastName}`,
        username: assigned.username,
        email: assigned.email
      } : null,
      CreatedByDetails: creator ? {
        fullName: `${creator.firstName} ${creator.lastName}`,
        username: creator.username,
        email: creator.email
      } : null
    };
  });

  return formatResponse(enrichedTasks);
}

async function getCreateTask(args) {
  const project = await Project.findOne({ ProjectID: args.projectID });
  if (!project) return formatError(`Project with ID "${args.projectID}" not found.`);

  const creatorId = await resolveUser(args.createdBy);
  if (!creatorId) return formatError(`Creator "${args.createdBy}" could not be resolved.`);

  const taskType = resolveType(args.type);
  const priority = resolvePriority(args.priority);

  let assigneeId = null;
  if (args.assignedTo) {
    assigneeId = await resolveUser(args.assignedTo);
    if (!assigneeId) return formatError(`Assignee "${args.assignedTo}" could not be resolved.`);
  }

  let parentId = args.parentId;
  if (taskType !== 'User Story') {
    if (!parentId) {
      return formatError(`ParentID (parent User Story TaskID) is required for task type "${taskType}". Please find or create a User Story first.`);
    }
    const parent = await TaskDetails.findOne({ TaskID: parentId });
    if (!parent) {
      return formatError(`Parent task/user story with TaskID "${parentId}" not found.`);
    }
    if (parent.Type !== 'User Story') {
      return formatError(`Parent task with TaskID "${parentId}" is of type "${parent.Type}". It must be of type "User Story".`);
    }
  } else {
    parentId = undefined;
  }

  let dueDate = args.dueDate ? new Date(args.dueDate) : undefined;
  if (taskType === 'User Story' && !dueDate) {
    dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const taskData = {
    TaskID: uuidv4(),
    Name: args.name,
    Description: args.description || "",
    Type: taskType,
    Priority: taskType !== 'User Story' ? priority : undefined,
    ProjectID_FK: args.projectID,
    ParentID: parentId,
    AssignedTo: assigneeId,
    CreatedBy: creatorId,
    CreatedDate: new Date(),
    IsActive: true,
    Status: 1
  };

  if (dueDate) {
    taskData.DueDate = dueDate;
  }

  if (taskType === 'User Story') {
    taskData.Assignee = "";
    taskData.AssignedDate = "";
    taskData.Status = 2;
  } else {
    if (assigneeId) {
      taskData.AssignedDate = new Date();
      taskData.Status = 2;
    }
  }

  const newTask = new TaskDetails(taskData);
  await newTask.save();

  try {
    await logActivity(
      creatorId,
      taskType === 'User Story' ? 'user_story_create' : 'task_create',
      'success',
      `Created new ${taskType.toLowerCase()} "${args.name}" via MCP`,
      null,
      {
        taskId: newTask.TaskID,
        taskName: args.name,
        taskType: taskType,
        projectId: args.projectID
      }
    );
  } catch (e) { }

  try { await emitDashboardMetrics(project.OrganizationID); } catch (e) { }

  return formatResponse(newTask);
}

async function getUpdateTask(args) {
  const task = await TaskDetails.findOne({ TaskID: args.taskID });
  if (!task) return formatError(`Task with ID "${args.taskID}" not found.`);

  try {
    const taskHistory = new TaskDetailsHistory({
      TaskID: task.TaskID,
      ParentID: task.ParentID,
      Name: task.Name,
      Description: task.Description,
      OldStatus: task.Status,
      Type: task.Type,
      Priority: task.Priority,
      Old_Assignee: task.Assignee,
      Old_AssignedTo: task.AssignedTo,
      ProjectID_FK: task.ProjectID_FK,
      IsActive: task.IsActive,
      CreatedDate: task.CreatedDate,
      AssignedDate: task.AssignedDate,
      CreatedBy: task.CreatedBy,
      HistoryDate: new Date()
    });
    await taskHistory.save();
  } catch (e) {
    console.error("Failed to save task history:", e);
  }

  if (args.name !== undefined) task.Name = args.name;
  if (args.description !== undefined) task.Description = args.description;
  if (args.type !== undefined) task.Type = resolveType(args.type);
  if (args.priority !== undefined) task.Priority = resolvePriority(args.priority);
  if (args.dueDate !== undefined) task.DueDate = args.dueDate ? new Date(args.dueDate) : null;

  if (args.assignedTo !== undefined) {
    if (args.assignedTo) {
      const resAssignee = await resolveUser(args.assignedTo);
      if (!resAssignee) return formatError(`Assignee "${args.assignedTo}" could not be resolved.`);
      task.AssignedTo = resAssignee;
      task.AssignedDate = new Date();
      if (task.Status === 1) task.Status = 2;
    } else {
      task.AssignedTo = null;
      task.AssignedDate = null;
      if (task.Status === 2) task.Status = 1;
    }
  }

  if (args.status !== undefined) {
    const resStatus = await resolveTaskStatus(args.status);
    if (resStatus === undefined) {
      return formatError(`Status "${args.status}" could not be resolved.`);
    }
    task.Status = resStatus;
  }

  if (args.parentId !== undefined) {
    if (task.Type !== 'User Story') {
      if (args.parentId) {
        const parent = await TaskDetails.findOne({ TaskID: args.parentId });
        if (!parent) return formatError(`Parent User Story TaskID "${args.parentId}" not found.`);
        task.ParentID = args.parentId;
      } else {
        return formatError(`ParentID is required for tasks of type "${task.Type}". Cannot set to empty.`);
      }
    }
  }

  task.ModifiedDate = new Date();
  await task.save();

  try {
    await logActivity(
      task.CreatedBy,
      task.Type === 'User Story' ? 'user_story_update' : 'task_update',
      'success',
      `Updated ${task.Type.toLowerCase()} "${task.Name}" via MCP`,
      null,
      {
        taskId: task.TaskID,
        taskName: task.Name,
        taskType: task.Type,
        projectId: task.ProjectID_FK
      }
    );
  } catch (e) { }

  try {
    const project = await Project.findOne({ ProjectID: task.ProjectID_FK });
    if (project) {
      await emitDashboardMetrics(project.OrganizationID);
    }
  } catch (e) { }

  return formatResponse(task);
}

async function getDeleteTask(args) {
  const task = await TaskDetails.findOne({ TaskID: args.taskID });
  if (!task) return formatError(`Task with ID "${args.taskID}" not found.`);

  try {
    const taskHistory = new TaskDetailsHistory({
      TaskID: task.TaskID,
      ParentID: task.ParentID,
      Name: task.Name,
      Description: task.Description,
      OldStatus: task.Status,
      Type: task.Type,
      Old_Assignee: task.Assignee,
      Old_AssignedTo: task.AssignedTo,
      ProjectID_FK: task.ProjectID_FK,
      IsActive: task.IsActive,
      CreatedDate: task.CreatedDate,
      AssignedDate: task.AssignedDate,
      CreatedBy: task.CreatedBy,
      HistoryDate: new Date()
    });
    await taskHistory.save();
  } catch (e) { }

  try {
    await logActivity(
      task.CreatedBy,
      task.Type === 'User Story' ? 'user_story_delete' : 'task_delete',
      'success',
      `Deleted ${task.Type.toLowerCase()} "${task.Name}" via MCP`,
      null,
      {
        taskId: task.TaskID,
        taskName: task.Name,
        taskType: task.Type,
        projectId: task.ProjectID_FK
      }
    );
  } catch (e) { }

  const orgId = (await Project.findOne({ ProjectID: task.ProjectID_FK }))?.OrganizationID;

  await task.deleteOne();

  if (orgId) {
    try { await emitDashboardMetrics(orgId); } catch (e) { }
  }

  return formatResponse({ success: true, message: "Task permanently deleted successfully" });
}

// Schemas
const TOOLS = [
  {
    name: "list_organizations",
    description: "List all organizations in the system.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "list_users",
    description: "List all users in the system, optionally filtering by organization ID or name.",
    inputSchema: {
      type: "object",
      properties: {
        organization: {
          type: "string",
          description: "Optional organization ID or name to filter by."
        }
      }
    }
  },
  {
    name: "list_projects",
    description: "List all active projects inside an organization.",
    inputSchema: {
      type: "object",
      properties: {
        organization: {
          type: "string",
          description: "Optional organization ID or name to filter projects."
        }
      }
    }
  },
  {
    name: "create_project",
    description: "Create a new project within a specific organization.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name (max 50 characters)." },
        description: { type: "string", description: "Project description (max 100 characters)." },
        organization: { type: "string", description: "Organization ID (e.g. '1') or Name." },
        projectOwner: { type: "string", description: "Owner's Email, Username, Full Name, or User ID." },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format." }
      },
      required: ["name", "organization", "projectOwner"]
    }
  },
  {
    name: "update_project",
    description: "Update details of an existing project.",
    inputSchema: {
      type: "object",
      properties: {
        projectID: { type: "string", description: "The unique ProjectID UUID of the project." },
        name: { type: "string", description: "New project name." },
        description: { type: "string", description: "New project description." },
        projectStatusID: { type: "number", description: "New project status ID (e.g. 1)." },
        dueDate: { type: "string", description: "New due date in YYYY-MM-DD format." }
      },
      required: ["projectID"]
    }
  },
  {
    name: "delete_project",
    description: "Deactivate/soft-delete a project (sets IsActive to false).",
    inputSchema: {
      type: "object",
      properties: {
        projectID: { type: "string", description: "The unique ProjectID UUID of the project." }
      },
      required: ["projectID"]
    }
  },
  {
    name: "list_tasks",
    description: "List active tasks and user stories. Can filter by project (name/ID), assignee (name/email/ID), task type, or status.",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Optional Project name or ProjectID UUID."
        },
        projectID: {
          type: "string",
          description: "Optional ProjectID UUID (alias for project)."
        },
        assignedTo: {
          type: "string",
          description: "Optional Assignee's Email, Username, Full Name, or User ID."
        },
        type: {
          type: "string",
          description: "Optional type filter (e.g. 'Task', 'Bug', 'User Story')."
        },
        status: {
          type: "string",
          description: "Optional status name or status code filter."
        }
      }
    }
  },
  {
    name: "create_task",
    description: "Create a new task, bug, or user story. NOTE: For task types other than 'User Story', a ParentID (User Story ID) is required.",
    inputSchema: {
      type: "object",
      properties: {
        projectID: { type: "string", description: "The ProjectID UUID." },
        name: { type: "string", description: "Task name (max 150 chars)." },
        type: {
          type: "string",
          description: "Type: 'Task', 'Bug', 'User Story', 'Feature', 'Improvement', 'Documentation', 'Maintenance', 'Support'."
        },
        description: { type: "string", description: "Task description." },
        priority: { type: "string", description: "Priority: 'High', 'Medium', 'Low' (ignored for User Story)." },
        assignedTo: { type: "string", description: "Assignee's Email, Username, Full Name, or User ID." },
        createdBy: { type: "string", description: "Creator's Email, Username, Full Name, or User ID." },
        parentId: { type: "string", description: "Parent User Story TaskID (UUID). Required if type is NOT 'User Story'." },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format. Required if type is 'User Story'." }
      },
      required: ["projectID", "name", "type", "createdBy"]
    }
  },
  {
    name: "update_task",
    description: "Update an existing task or user story.",
    inputSchema: {
      type: "object",
      properties: {
        taskID: { type: "string", description: "The TaskID UUID." },
        name: { type: "string", description: "New name." },
        description: { type: "string", description: "New description." },
        status: { type: "string", description: "New status code (number) or status name (e.g. 'In Progress', 'Completed')." },
        priority: { type: "string", description: "Priority: 'High', 'Medium', 'Low'." },
        type: { type: "string", description: "Task type." },
        assignedTo: { type: "string", description: "Assignee's Email, Username, Full Name, or User ID." },
        dueDate: { type: "string", description: "New due date in YYYY-MM-DD format." },
        parentId: { type: "string", description: "New parent User Story TaskID." }
      },
      required: ["taskID"]
    }
  },
  {
    name: "delete_task",
    description: "Permanently delete a task from the database.",
    inputSchema: {
      type: "object",
      properties: {
        taskID: { type: "string", description: "The TaskID UUID." }
      },
      required: ["taskID"]
    }
  }
];

// JSON-RPC Request Router
async function handleRequest(request) {
  const { method, id, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        serverInfo: {
          name: "teamlabs-mcp-server",
          version: "1.0.0"
        }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: TOOLS
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      let result;
      switch (name) {
        case 'list_organizations':
          result = await getListOrganizations(args);
          break;
        case 'list_users':
          result = await getListUsers(args);
          break;
        case 'list_projects':
          result = await getListProjects(args);
          break;
        case 'create_project':
          result = await getCreateProject(args);
          break;
        case 'update_project':
          result = await getUpdateProject(args);
          break;
        case 'delete_project':
          result = await getDeleteProject(args);
          break;
        case 'list_tasks':
          result = await getListTasks(args);
          break;
        case 'create_task':
          result = await getCreateTask(args);
          break;
        case 'update_task':
          result = await getUpdateTask(args);
          break;
        case 'delete_task':
          result = await getDeleteTask(args);
          break;
        default:
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Tool not found: ${name}`
            }
          };
      }
      return {
        jsonrpc: "2.0",
        id,
        result
      };
    } catch (err) {
      console.error(`Error executing tool ${name}:`, err);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Internal error: ${err.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`
    }
  };
}

// Stdio listener loop
rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    if (request.id === undefined) {
      return; // notification
    }
    const response = await handleRequest(request);
  } catch (err) {
    console.error("Failed to parse standard input line:", err);
  }
});
