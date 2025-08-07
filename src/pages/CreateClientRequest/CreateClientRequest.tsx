import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Plus, X } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useCreateClientRequest } from '../../hooks/useClientRequests';
import { useProfile } from '../../hooks/useProfile';

// Same categories as in the Gigs component
const categories = [
  'Programming & Tech',
  'Graphics & Design',
  'Digital Marketing',
  'Writing & Translation',
  'Video & Animation',
  'AI Services',
  'Music & Audio',
  'Business',
  'Consulting'
];

export const CreateClientRequest = () => {
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  
  // Real hooks
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const createRequest = useCreateClientRequest();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    category: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !profile) {
      alert('Please login to create a request');
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please provide a title for your request');
      return;
    }

    if (!formData.description.trim()) {
      alert('Please provide a description for your request');
      return;
    }

    if (!formData.category) {
      alert('Please select a category for your request');
      return;
    }

    try {
      const requestData = {
        title: formData.title,
        description: formData.description,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        deadline: formData.deadline || undefined,
        category: formData.category,
        skills_needed: skills
      };

      // Validate budget
      if (requestData.budget_min && requestData.budget_max && requestData.budget_min > requestData.budget_max) {
        alert('Minimum budget cannot be greater than maximum budget');
        return;
      }

      await createRequest.mutateAsync(requestData);
      navigate('/requests');
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="gradient-card p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-2">Create a Project Request</h1>
            <p className="text-gray-400">
              Describe your project in detail to attract the best providers. Be specific about your requirements, timeline, and budget.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Build a DeFi Dashboard"
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Project Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your project in detail. Include specific requirements, goals, and any relevant background information."
                  rows={8}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <hr className="border-gray-600" />

              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-2">Budget & Timeline</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-grey text-sm font-medium mb-2">
                    Minimum Budget (EGLD)
                  </label>
                  <input
                    type="number"
                    name="budget_min"
                    min="0"
                    step="0.01"
                    value={formData.budget_min}
                    onChange={handleChange}
                    placeholder="Min budget"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">Optional</p>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Maximum Budget (EGLD)
                  </label>
                  <input
                    type="number"
                    name="budget_max"
                    min="0"
                    step="0.01"
                    value={formData.budget_max}
                    onChange={handleChange}
                    placeholder="Max budget"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">Optional</p>
                </div>
              </div>

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-400 text-sm mt-1">Optional</p>
              </div>

              <hr className="border-gray-600" />

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Required Skills
                </label>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., React, Solidity, UI Design"
                    className="w-full md:flex-1 p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md"
                  >
                    <span className="md:hidden">Add Skill</span>
                    <span className="hidden md:inline">Add</span>
                    Add
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Press Enter to add a skill
                </p>
              </div>

              {skills.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-900 border border-blue-500 rounded-md p-3">
                <div className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-0.5">ℹ️</div>
                  <div>
                    <p className="text-white text-sm">
                      Your request will be visible to all providers for 30 days. You can select a proposal at any time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2"
                  disabled={createRequest.isLoading || isProfileLoading}
                >
                  <Plus size={20} />
                  {createRequest.isLoading ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};