import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    miningOperationsRequired: '',
    dailyMiningCountRequired: '',
    shipCountRequired: '',
    referralCountRequired: '',
    requiredLevel: '',
    referenceLink: '',
    isActive: true
  });

  const taskTypes = [
    { value: 'mining', label: 'Pet Care Task', icon: <span className="text-lg">🍖</span> },
    { value: 'social', label: 'Social Task', icon: <span className="text-lg">⭐</span> },
    { value: 'referral', label: 'Friends Task', icon: <span className="text-lg">👥</span> },
    { value: 'daily', label: 'Daily Task', icon: <span className="text-lg">🎯</span> }
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
        requirements: {},
        miningOperationsRequired: formData.miningOperationsRequired ? parseInt(formData.miningOperationsRequired) : undefined,
        dailyMiningCountRequired: formData.dailyMiningCountRequired ? parseInt(formData.dailyMiningCountRequired) : undefined,
        shipCountRequired: formData.shipCountRequired ? parseInt(formData.shipCountRequired) : undefined,
        referralCountRequired: formData.referralCountRequired ? parseInt(formData.referralCountRequired) : undefined,
        requiredLevel: formData.requiredLevel ? parseInt(formData.requiredLevel) : undefined,
        referenceLink: formData.referenceLink || undefined,
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
      miningOperationsRequired: task.miningOperationsRequired?.toString() || '',
      dailyMiningCountRequired: task.dailyMiningCountRequired?.toString() || '',
      shipCountRequired: task.shipCountRequired?.toString() || '',
      referralCountRequired: task.referralCountRequired?.toString() || '',
      requiredLevel: task.requiredLevel?.toString() || '',
      referenceLink: task.referenceLink || '',
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
      miningOperationsRequired: '',
      dailyMiningCountRequired: '',
      shipCountRequired: '',
      referralCountRequired: '',
      requiredLevel: '',
      referenceLink: '',
      isActive: true
    });
  };

  const getTaskTypeIcon = (taskType: string) => {
    const type = taskTypes.find(t => t.value === taskType);
    return type?.icon || <span className="text-lg">🎯</span>;
  };

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-inter font-bold text-red-600 mb-2">Access Denied</h3>
        <p className="text-gray-700 font-inter">Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-inter font-bold text-gray-800">Task Management</h2>
        <Button
          onClick={() => {
            setEditingTask(null);
            resetForm();
            setShowModal(true);
          }}
          className="cute-button px-4 py-2"
        >
          <Plus size={16} />
          Create Task
        </Button>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`cute-card p-6 transition-all duration-300 ${
                task.isActive ? 'border-success bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                    {getTaskTypeIcon(task.taskType)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-inter font-bold text-gray-800">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.isActive 
                          ? 'bg-green-100 text-success' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded-full text-xs font-medium capitalize font-inter">
                        {task.taskType}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 font-inter">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-primary-600 font-inter font-bold">
                        <span>🍖</span>
                        {task.rewardAmount} Food Reward
                      </div>
                      <div className="text-gray-600 font-inter">
                        Created {task.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => toggleTaskStatus(task.id!, task.isActive)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium font-inter ${
                      task.isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-success hover:bg-green-600 text-white'
                    }`}
                  >
                    {task.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleEdit(task)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(task.id!)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
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
          <div className="cute-card p-4 max-w-3xl w-full">
            <h3 className="text-xl font-inter font-bold text-gray-800 mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-800 text-xs font-medium mb-1 font-inter">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-800 text-xs font-medium mb-1 font-inter">
                    Reward (Food Points)
                  </label>
                  <input
                    type="number"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({...formData, rewardAmount: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-800 text-xs font-medium mb-1 font-inter">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Enter task description"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-800 text-xs font-medium mb-1 font-inter">
                    Task Type
                  </label>
                  <select
                    value={formData.taskType}
                    onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {taskTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-800 text-xs font-medium mb-1 font-inter">
                    Required Level
                  </label>
                  <input
                    type="number"
                    value={formData.requiredLevel}
                    onChange={(e) => setFormData({...formData, requiredLevel: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. 10"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1 font-inter">
                    Pet Care Ops
                  </label>
                  <input
                    type="number"
                    value={formData.miningOperationsRequired}
                    onChange={(e) => setFormData({...formData, miningOperationsRequired: e.target.value})}
                    className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    placeholder="5"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1 font-inter">
                    Daily Care
                  </label>
                  <input
                    type="number"
                    value={formData.dailyMiningCountRequired}
                    onChange={(e) => setFormData({...formData, dailyMiningCountRequired: e.target.value})}
                    className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    placeholder="10"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1 font-inter">
                    Dog Count
                  </label>
                  <input
                    type="number"
                    value={formData.shipCountRequired}
                    onChange={(e) => setFormData({...formData, shipCountRequired: e.target.value})}
                    className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    placeholder="3"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1 font-inter">
                    Friends
                  </label>
                  <input
                    type="number"
                    value={formData.referralCountRequired}
                    onChange={(e) => setFormData({...formData, referralCountRequired: e.target.value})}
                    className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-800 text-xs font-medium mb-1 font-inter">
                  Reference Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.referenceLink}
                  onChange={(e) => setFormData({...formData, referenceLink: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://example.com/instructions"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-gray-800 text-sm font-medium font-inter">
                  Task is active
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-300">
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="cute-button-outline flex-1 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="cute-button flex-1 py-2"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};