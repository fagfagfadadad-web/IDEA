import React, { useState } from 'react';
import { Plus, Check, Clock, AlertTriangle, Trash2, Edit, X } from 'lucide-react';
import { Button } from 'components';
import { useUserTasks, useCreateTask, useUpdateTask, useDeleteTask, TaskInput } from '../../hooks/useUserTasks';
import { useToast } from '../../context/ToastContext';

export const TaskManager: React.FC = () => {
  const { data: tasks, isLoading, error, refetch } = useUserTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState<TaskInput>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium'
  });

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      showErrorToast('Please enter a task title');
      return;
    }

    try {
      await createTask.mutateAsync(taskForm);
      showSuccessToast('Task created successfully');
      setShowCreateModal(false);
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
      refetch();
    } catch (error) {
      showErrorToast('Failed to create task');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title.trim()) {
      showErrorToast('Please enter a task title');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: editingTask.id,
        updates: taskForm
      });
      showSuccessToast('Task updated successfully');
      setEditingTask(null);
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
      refetch();
    } catch (error) {
      showErrorToast('Failed to update task');
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: { status: newStatus }
      });
      showSuccessToast(`Task marked as ${newStatus}`);
      refetch();
    } catch (error) {
      showErrorToast('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask.mutateAsync(taskId);
      showSuccessToast('Task deleted successfully');
      refetch();
    } catch (error) {
      showErrorToast('Failed to delete task');
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      priority: task.priority
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check size={16} className="text-green-600" />;
      case 'cancelled': return <X size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-blue-600" />;
    }
  };

  const pendingTasks = tasks?.filter(task => task.status === 'pending') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Workspace Tasks</h3>
            <p className="text-gray-600 text-sm">
              {pendingTasks.length} pending • {completedTasks.length} completed
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} />
            Add Task
          </Button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {tasks?.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No tasks yet. Create your first task!</p>
            </div>
          ) : (
            <>
              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Pending Tasks</h4>
                  <div className="space-y-2">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => handleToggleStatus(task.id, task.status)}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-gray-600 text-sm">{task.description}</p>
                            )}
                            {task.due_date && (
                              <p className="text-gray-500 text-xs">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Completed Tasks</h4>
                  <div className="space-y-2">
                    {completedTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg opacity-75"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => handleToggleStatus(task.id, task.status)}
                            className="text-green-600"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <div className="flex-1">
                            <p className="text-gray-700 font-medium line-through">{task.title}</p>
                            <p className="text-gray-500 text-xs">
                              Completed {new Date(task.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {completedTasks.length > 3 && (
                      <p className="text-gray-500 text-sm text-center">
                        +{completedTasks.length - 3} more completed tasks
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                    setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Enter task title"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Enter task description"
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                    setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                  disabled={createTask.isLoading || updateTask.isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg"
                >
                  {createTask.isLoading || updateTask.isLoading 
                    ? 'Saving...' 
                    : editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};