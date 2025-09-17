import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Target, Zap, Star, Gift } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminService } from '../services/adminService';
import { GameService, Task } from '../services/gameService';

export const AdminTasks: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    taskType: 'mining',
    requirements: '{}',
    isActive: true
  });

  const taskTypes = [
    { value: 'mining', label: 'Mining Task', icon: <Zap size={16} className="text-cyan-400" /> },
    { value: 'social', label: 'Social Task', icon: <Star size={16} className="text-purple-400" /> },
    { value: 'referral', label: 'Referral Task', icon: <Gift size={16} className="text-green-400" /> },
    { value: 'daily', label: 'Daily Task', icon: <Target size={16} className="text-orange-400" /> }
  ];

  useEffect(() => {
    if (user?.isAdmin) {
      fetchTasks();
    }
  }, [user?.isAdmin]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const allTasks = await AdminService.getAllTasks();
      setTasks(allTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        rewardAmount: parseInt(formData.rewardAmount),
        taskType: formData.taskType,
        requirements: JSON.parse(formData.requirements || '{}'),
       isActive: formData.isActive,
       createdAt: new Date(),
       updatedAt: new Date()
      };

      if (editingTask?.id) {
        await GameService.updateTask(editingTask.id, taskData);
        success('Task updated successfully!');
      } else {
        await GameService.createTask(taskData);
        success('Task created successfully!');
      }

      setShowModal(false);
      setEditingTask(null);
      resetForm();
      fetchTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      error('Failed to save task');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      rewardAmount: task.rewardAmount.toString(),
      taskType: task.taskType,
      requirements: JSON.stringify(task.requirements, null, 2),
      isActive: task.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await AdminService.deleteTask(taskId);
      success('Task deleted successfully!');
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      error('Failed to delete task');
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      await AdminService.toggleTaskStatus(taskId, !currentStatus);
      success(`Task ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      error('Failed to update task status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      rewardAmount: '',
      taskType: 'mining',
      requirements: '{}',
      isActive: true
    });
  };

  const getTaskTypeIcon = (taskType: string) => {
    const type = taskTypes.find(t => t.value === taskType);
    return type?.icon || <Target size={16} className="text-gray-400" />;
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-orbitron font-bold text-white mb-2">Access Denied</h3>
        <p className="text-gray-400">Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-orbitron font-bold text-white">Task Management</h2>
        <Button
          onClick={() => {
            setEditingTask(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg font-orbitron font-bold"
        >
          <Plus size={16} />
          Create Task
        </Button>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-slate-700/50 rounded-xl p-6 border transition-all duration-300 ${
                task.isActive ? 'border-green-500/50' : 'border-gray-600/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                    {getTaskTypeIcon(task.taskType)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-orbitron font-bold text-white">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 bg-slate-600 text-gray-300 rounded-full text-xs font-medium capitalize">
                        {task.taskType}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-3">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-cyan-400 font-orbitron font-bold">
                        <Zap size={14} />
                        {task.rewardAmount} ZEN Reward
                      </div>
                      <div className="text-gray-400">
                        Created {task.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => toggleTaskStatus(task.id!, task.isActive)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      task.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {task.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleEdit(task)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(task.id!)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full my-8 border border-cyan-500/20 flex flex-col relative min-h-0 max-h-[calc(100vh-4rem)]">
            <div className="space-y-6">
              <h3 className="text-2xl font-orbitron font-bold text-white">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2 min-h-0">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter task description"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Reward Amount (ZEN)
                    </label>
                    <input
                      type="number"
                      value={formData.rewardAmount}
                      onChange={(e) => setFormData({...formData, rewardAmount: e.target.value})}
                      className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="100"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Task Type
                    </label>
                    <select
                      value={formData.taskType}
                      onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                      className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      {taskTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Requirements (JSON)
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    className="w-full p-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
                    placeholder='{"mining_amount": 1000, "duration_hours": 24}'
                    rows={3}
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    JSON object defining task requirements
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-cyan-600 bg-slate-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="isActive" className="text-white font-medium">
                    Task is active
                  </label>
                </div>
                </div>
              </form>
              
              <div className="flex gap-3 pt-4 mt-4 pt-4 border-t border-gray-700">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-orbitron font-bold"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};