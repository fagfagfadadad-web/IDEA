import React, { useState } from 'react';
import { CheckSquare, Plus, Edit, Trash2, X, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import { Button } from 'components';
import { useAdminTasks } from '../hooks/useRewards';
import { useToast } from '../context/ToastContext';
import { Task, UserRewardTask } from '../types/rewards.types';

export const AdminTasks: React.FC = () => {
  const { 
    isAdmin, 
    adminTasks, 
    taskStats, 
    isLoading, 
    error, 
    createTask, 
    updateTask, 
    deleteTask 
  } = useAdminTasks();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward_amount: 0,
    xp_reward: 0,
    task_type: 'manual' as Task['task_type'],
    required_value: '',
    proof_required_type: 'none' as Task['proof_required_type'],
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reward_amount: 0,
      xp_reward: 0,
      task_type: 'manual',
      required_value: '',
      proof_required_type: 'none',
      is_active: true
    });
    setEditingTask(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      reward_amount: task.reward_amount,
      xp_reward: task.xp_reward,
      task_type: task.task_type,
      required_value: task.required_value || '',
      proof_required_type: task.proof_required_type,
      is_active: task.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || formData.reward_amount < 0 || formData.xp_reward < 0) {
      showErrorToast('Please fill in all required fields with valid values');
      return;
    }

    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, formData);
        if (updated) {
          showSuccessToast('Task updated successfully');
        }
      } else {
        const created = await createTask(formData);
        if (created) {
          showSuccessToast('Task created successfully');
        }
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      showErrorToast('Failed to save task');
    }
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      const success = await deleteTask(taskId);
      if (success) {
        showSuccessToast('Task deleted successfully');
      }
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'wallet_connect': return 'Wallet Connect';
      case 'transaction': return 'Transaction';
      case 'mining_level': return 'Level Requirement';
      case 'referral': return 'Referral';
      case 'social_follow': return 'Social Follow';
      case 'social_post': return 'Social Post';
      case 'social_retweet': return 'Social Retweet';
      case 'social_like': return 'Social Like';
      case 'external_link': return 'External Link';
      default: return 'Manual';
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="text-red-700 font-medium">Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
          <span className="text-indigo-800 font-medium">
            {adminTasks.length} task{adminTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare size={20} className="text-blue-600" />
            <span className="text-blue-800 font-medium">Total Tasks</span>
          </div>
          <p className="text-blue-800 text-2xl font-bold">{taskStats.totalTasks}</p>
        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare size={20} className="text-green-600" />
            <span className="text-green-800 font-medium">Active Tasks</span>
          </div>
          <p className="text-green-800 text-2xl font-bold">{taskStats.activeTasks}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare size={20} className="text-purple-600" />
            <span className="text-purple-800 font-medium">Completions</span>
          </div>
          <p className="text-purple-800 text-2xl font-bold">{taskStats.totalCompletions}</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare size={20} className="text-orange-600" />
            <span className="text-orange-800 font-medium">IDA Distributed</span>
          </div>
          <p className="text-orange-800 text-2xl font-bold">{taskStats.totalRewardsDistributed.toLocaleString()}</p>
        </div>
      </div>

      {/* Create Task Button */}
      <Button
        onClick={handleOpenCreate}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
      >
        <Plus size={16} />
        Create New Task
      </Button>

      {/* Tasks List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-700">Loading tasks...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 font-medium">Error loading tasks: {error}</span>
            </div>
          </div>
        ) : adminTasks.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {adminTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {task.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getTaskTypeLabel(task.task_type)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-purple-600 font-medium">
                        Reward: {task.reward_amount.toLocaleString()} IDA
                      </span>
                      <span className="text-indigo-600 font-medium">
                        XP: {task.xp_reward}
                      </span>
                      {task.required_value && (
                        <span className="text-gray-600">
                          Required: {task.required_value}
                        </span>
                      )}
                      <span className="text-gray-600">
                        Proof: {task.proof_required_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenEdit(task)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(task.id, task.title)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckSquare size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tasks found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800 text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description"
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">Reward Amount (IDA) *</label>
                    <input
                      type="number"
                      value={formData.reward_amount}
                      onChange={(e) => setFormData({ ...formData, reward_amount: parseInt(e.target.value) || 0 })}
                      placeholder="1000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-medium mb-2">XP Reward</label>
                    <input
                      type="number"
                      value={formData.xp_reward}
                      onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                      placeholder="50"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Experience points (100 XP = 1 level)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 text-sm font-medium mb-2">Task Type *</label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value as Task['task_type'] })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="wallet_connect">Wallet Connect</option>
                    <option value="transaction">Transaction</option>
                    <option value="mining_level">Level Requirement</option>
                    <option value="referral">Referral</option>
                    <option value="social_follow">Social Follow</option>
                    <option value="social_post">Social Post</option>
                    <option value="social_retweet">Social Retweet</option>
                    <option value="social_like">Social Like</option>
                    <option value="external_link">External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-800 text-sm font-medium mb-2">
                    {formData.task_type === 'social_follow' || formData.task_type === 'social_post' || formData.task_type === 'external_link' 
                      ? 'URL Link (required)' 
                      : 'Required Value (optional)'
                    }
                  </label>
                  <input
                    type="text"
                    value={formData.required_value}
                    onChange={(e) => setFormData({ ...formData, required_value: e.target.value })}
                    placeholder={
                      formData.task_type === 'social_follow' ? 'https://twitter.com/username' :
                      formData.task_type === 'social_post' ? 'https://twitter.com/intent/tweet?text=...' :
                      formData.task_type === 'social_retweet' ? 'https://twitter.com/username/status/123456789' :
                      formData.task_type === 'social_like' ? 'https://twitter.com/username/status/123456789' :
                      formData.task_type === 'external_link' ? 'https://example.com' :
                      'e.g., 10 for level 10'
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {(formData.task_type === 'social_follow' || formData.task_type === 'social_post' || formData.task_type === 'social_retweet' || formData.task_type === 'social_like' || formData.task_type === 'external_link') && (
                    <p className="text-gray-500 text-xs mt-1">
                      {formData.task_type === 'social_retweet' || formData.task_type === 'social_like' 
                        ? 'Enter the Twitter post URL that users should retweet/like'
                        : 'Enter the complete URL that users should visit to complete this task'
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 text-sm font-medium mb-2">Proof Required</label>
                  <select
                    value={formData.proof_required_type}
                    onChange={(e) => setFormData({ ...formData, proof_required_type: e.target.value as Task['proof_required_type'] })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="none">No proof required</option>
                    <option value="file">File upload (screenshot, document)</option>
                    <option value="url">URL link</option>
                    <option value="text">Text response</option>
                  </select>
                  <p className="text-gray-500 text-xs mt-1">
                    {formData.proof_required_type === 'file' && 'Users will need to upload a file as proof (images, PDFs, etc.)'}
                    {formData.proof_required_type === 'url' && 'Users will need to provide a URL link as proof'}
                    {formData.proof_required_type === 'text' && 'Users will need to write a text response as proof'}
                    {formData.proof_required_type === 'none' && 'Task can be completed without submitting proof'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-gray-800 font-medium">Active</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg"
                  >
                    {isLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};