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
    ticketReward: '',
    taskType: 'mining',
    miningOperationsRequired: '',
    dailyMiningCountRequired: '',
    shipCountRequired: '',
    referralCountRequired: '',
    requiredLevel: '',
    referenceLink: '',
    bannerImage: '',
    requiresProof: false,
    proofType: 'none' as 'screenshot' | 'link' | 'none',
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
        ticketReward: formData.ticketReward ? parseInt(formData.ticketReward) : undefined,
        taskType: formData.taskType,
        requirements: {},
        miningOperationsRequired: formData.miningOperationsRequired ? parseInt(formData.miningOperationsRequired) : undefined,
        dailyMiningCountRequired: formData.dailyMiningCountRequired ? parseInt(formData.dailyMiningCountRequired) : undefined,
        shipCountRequired: formData.shipCountRequired ? parseInt(formData.shipCountRequired) : undefined,
        referralCountRequired: formData.referralCountRequired ? parseInt(formData.referralCountRequired) : undefined,
        requiredLevel: formData.requiredLevel ? parseInt(formData.requiredLevel) : undefined,
        referenceLink: formData.referenceLink || undefined,
        bannerImage: formData.bannerImage || undefined,
        requiresProof: formData.requiresProof,
        proofType: formData.proofType,
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
      ticketReward: task.ticketReward?.toString() || '',
      taskType: task.taskType,
      miningOperationsRequired: task.miningOperationsRequired?.toString() || '',
      dailyMiningCountRequired: task.dailyMiningCountRequired?.toString() || '',
      shipCountRequired: task.shipCountRequired?.toString() || '',
      referralCountRequired: task.referralCountRequired?.toString() || '',
      requiredLevel: task.requiredLevel?.toString() || '',
      referenceLink: task.referenceLink || '',
      bannerImage: task.bannerImage || '',
      requiresProof: task.requiresProof || false,
      proofType: task.proofType || 'none',
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
      ticketReward: '',
      taskType: 'mining',
      miningOperationsRequired: '',
      dailyMiningCountRequired: '',
      shipCountRequired: '',
      referralCountRequired: '',
      requiredLevel: '',
      referenceLink: '',
      bannerImage: '',
      requiresProof: false,
      proofType: 'none' as 'screenshot' | 'link' | 'none',
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
        <h2 className="text-2xl font-inter font-bold text-white">Task Management</h2>
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
              className={`bg-gray-700 border-2 rounded-xl p-4 md:p-6 transition-all duration-300 ${
                task.isActive ? 'border-green-500' : 'border-gray-600'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4 flex-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {getTaskTypeIcon(task.taskType)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                      <h3 className="text-base md:text-lg font-inter font-bold text-white">
                        {task.title}
                      </h3>
                      <div className="flex gap-2">
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
                    </div>

                    <p className="text-sm md:text-base text-gray-300 mb-3 font-inter leading-relaxed">
                      {task.description}
                    </p>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
                      <div className="flex items-center gap-1 text-primary-600 font-inter font-bold">
                        <span>🍖</span>
                        {task.rewardAmount} Food
                      </div>
                      {task.ticketReward && task.ticketReward > 0 && (
                        <div className="flex items-center gap-1 text-purple-600 font-inter font-bold">
                          <span>🎫</span>
                          {task.ticketReward} Tickets
                        </div>
                      )}
                    </div>

                    {/* Task Requirements Display */}
                    {(task.referralCountRequired || task.miningOperationsRequired || task.dailyMiningCountRequired || task.shipCountRequired) && (
                      <div className="mt-3 p-2 bg-gray-800 rounded-lg">
                        <div className="text-xs text-gray-400 font-inter mb-1 font-bold">Requirements:</div>
                        <div className="flex flex-wrap gap-2">
                          {task.referralCountRequired && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-inter font-medium">
                              👥 Invite {task.referralCountRequired} friend{task.referralCountRequired > 1 ? 's' : ''}
                            </span>
                          )}
                          {task.miningOperationsRequired && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-inter font-medium">
                              🍖 {task.miningOperationsRequired} pet care ops
                            </span>
                          )}
                          {task.dailyMiningCountRequired && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-inter font-medium">
                              📅 {task.dailyMiningCountRequired} daily care
                            </span>
                          )}
                          {task.shipCountRequired && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-inter font-medium">
                              🐕 Own {task.shipCountRequired} dog{task.shipCountRequired > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs md:text-sm text-gray-500 font-inter mt-2">
                      Created {task.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 md:mt-0">
                  <Button
                    onClick={() => toggleTaskStatus(task.id!, task.isActive)}
                    className={`px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium font-inter ${
                      task.isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-success hover:bg-green-600 text-white'
                    }`}
                  >
                    {task.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleEdit(task)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-2 md:px-3 py-1 md:py-2 rounded-lg"
                  >
                    <Edit size={12} className="md:w-4 md:h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(task.id!)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 md:px-3 py-1 md:py-2 rounded-lg"
                  >
                    <Trash2 size={12} className="md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-inter font-bold text-white mb-6">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2 font-inter">
                  Task Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2 font-inter">
                    Food Reward 🍖
                  </label>
                  <input
                    type="number"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({...formData, rewardAmount: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2 font-inter">
                    Ticket Reward 🎫 (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.ticketReward}
                    onChange={(e) => setFormData({...formData, ticketReward: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2 font-inter">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] resize-none"
                  placeholder="Enter task description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2 font-inter">
                    Task Type
                  </label>
                  <select
                    value={formData.taskType}
                    onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  >
                    {taskTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2 font-inter">
                    Required Level
                  </label>
                  <input
                    type="number"
                    value={formData.requiredLevel}
                    onChange={(e) => setFormData({...formData, requiredLevel: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                    placeholder="e.g. 10"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2 font-inter">
                  Task Requirements (leave empty if not needed)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-1 font-inter">
                      Pet Care Ops
                    </label>
                    <input
                      type="number"
                      value={formData.miningOperationsRequired}
                      onChange={(e) => setFormData({...formData, miningOperationsRequired: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:ring-1 focus:ring-[#f97316]"
                      placeholder="5"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-1 font-inter">
                      Daily Care
                    </label>
                    <input
                      type="number"
                      value={formData.dailyMiningCountRequired}
                      onChange={(e) => setFormData({...formData, dailyMiningCountRequired: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:ring-1 focus:ring-[#f97316]"
                      placeholder="10"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-1 font-inter">
                      Dog Count
                    </label>
                    <input
                      type="number"
                      value={formData.shipCountRequired}
                      onChange={(e) => setFormData({...formData, shipCountRequired: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:ring-1 focus:ring-[#f97316]"
                      placeholder="3"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-1 font-inter">
                      Invite Friends 👥
                    </label>
                    <input
                      type="number"
                      value={formData.referralCountRequired}
                      onChange={(e) => setFormData({...formData, referralCountRequired: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:ring-1 focus:ring-[#f97316]"
                      placeholder="e.g. 5 friends"
                      min="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-inter">
                  <strong>Invite Friends:</strong> Set the number of friends a user must invite to complete this task (e.g., 1 for "Invite a friend", 5 for "Invite 5 friends", 10 for "Invite 10 friends")
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2 font-inter">
                  Reference Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.referenceLink}
                  onChange={(e) => setFormData({...formData, referenceLink: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  placeholder="https://example.com/instructions"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2 font-inter">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({...formData, bannerImage: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  placeholder="https://example.com/banner.png"
                />
                <p className="text-xs text-gray-400 mt-1 font-inter">
                  Add a banner image URL to display a card similar to the adoption center
                </p>
              </div>

              <div className="space-y-3 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <label className="block text-white text-sm font-medium font-inter">
                  Verification Settings
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresProof"
                    checked={formData.requiresProof}
                    onChange={(e) => setFormData({...formData, requiresProof: e.target.checked})}
                    className="w-4 h-4 text-[#f97316] bg-gray-700 border-gray-600 rounded focus:ring-[#f97316]"
                  />
                  <label htmlFor="requiresProof" className="text-white text-sm font-medium font-inter">
                    Requires proof for completion
                  </label>
                </div>

                {formData.requiresProof && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2 font-inter">
                      Proof Type
                    </label>
                    <select
                      value={formData.proofType}
                      onChange={(e) => setFormData({...formData, proofType: e.target.value as 'screenshot' | 'link' | 'none'})}
                      className="w-full px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                    >
                      <option value="none">No proof required</option>
                      <option value="screenshot">Screenshot</option>
                      <option value="link">Link/URL</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1 font-inter">
                      {formData.proofType === 'screenshot' && 'Users will upload a screenshot'}
                      {formData.proofType === 'link' && 'Users will provide a link/URL'}
                      {formData.proofType === 'none' && 'Task can be claimed immediately after starting'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-[#f97316] bg-gray-700 border-gray-600 rounded focus:ring-[#f97316]"
                />
                <label htmlFor="isActive" className="text-white text-sm font-medium font-inter">
                  Task is active
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
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
        </div>,
        document.body
      )}
    </div>
  );
};