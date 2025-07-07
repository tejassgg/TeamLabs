import { useEffect, useState } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { subtaskService } from '../services/api';

const TaskSubtasks = ({ taskId, initialSubtasks }) => {
  const [subtasks, setSubtasks] = useState(initialSubtasks || []);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSubtasks) {
      setSubtasks(initialSubtasks);
    } else if (taskId) {
      fetchSubtasks();
    }
    // eslint-disable-next-line
  }, [initialSubtasks, taskId]);

  const fetchSubtasks = async () => {
    setLoading(true);
    try {
      const data = await subtaskService.getSubtasks(taskId);
      setSubtasks(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await subtaskService.addSubtask(taskId, newTitle);
    setNewTitle('');
    fetchSubtasks();
  };

  const handleDelete = async (id) => {
    await subtaskService.deleteSubtask(id);
    fetchSubtasks();
  };

  const handleToggle = async (id, isCompleted) => {
    await subtaskService.updateSubtask(id, { IsCompleted: !isCompleted });
    fetchSubtasks();
  };

  const handleEdit = async (id) => {
    if (!editingTitle.trim()) return;
    await subtaskService.updateSubtask(id, { Title: editingTitle });
    setEditingId(null);
    setEditingTitle('');
    fetchSubtasks();
  };

  const completed = subtasks.filter(s => s.IsCompleted).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold text-gray-90">Subtask <b>{completed}/{subtasks.length}</b></span>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Add subtask..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            disabled={loading}
          />
          <button className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleAdd} disabled={loading}>
            <FaPlus size={12} />
          </button>
        </div>
      </div>
      <div className="mb-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="bg-blue-500 h-full" style={{ width: `${subtasks.length ? (completed / subtasks.length) * 100 : 0}%` }} />
      </div>
      <ul className="divide-y divide-gray-100">
        {subtasks.map(subtask => (
          <li key={subtask.SubtaskID} className="flex items-center py-2 group">
            <input
              type="checkbox"
              checked={subtask.IsCompleted}
              onChange={() => handleToggle(subtask.SubtaskID, subtask.IsCompleted)}
              className="mr-3 accent-blue-500"
            />
            {editingId === subtask.SubtaskID ? (
              <>
                <input
                  className="border rounded px-2 py-1 text-sm flex-1"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit(subtask.SubtaskID)}
                  autoFocus
                />
                <button className="ml-2 text-green-600" onClick={() => handleEdit(subtask.SubtaskID)}><FaCheck /></button>
                <button className="ml-1 text-gray-400" onClick={() => setEditingId(null)}><FaTimes /></button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm ${subtask.IsCompleted ? 'line-through text-gray-400' : ''}`}>{subtask.Title}</span>
                <button className="ml-2 text-gray-400 group-hover:text-blue-500" onClick={() => { setEditingId(subtask.SubtaskID); setEditingTitle(subtask.Title); }}><FaEdit size={13} /></button>
                <button className="ml-1 text-gray-400 group-hover:text-red-500" onClick={() => handleDelete(subtask.SubtaskID)}><FaTrash size={13} /></button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskSubtasks; 