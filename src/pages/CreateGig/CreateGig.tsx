import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Check, DollarSign, Coins } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useCreateGig, useUpdateGig, useGigById } from '../../hooks/useGigs';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../context/ToastContext';

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

// Payment token options
const paymentTokens = [
  {
    id: 'EGLD',
    name: 'EGLD',
    symbol: 'EGLD',
    icon: <DollarSign size={20} />,
    fee: '10%',
    description: 'Native MultiversX token (10% platform fee)'
  },
  {
    id: 'IDA-f9bc1d',
    name: 'IDA Token',
    symbol: 'IDA',
    icon: <Coins size={20} />,
    fee: '0%',
    description: 'IDA platform token (no fees)'
  }
];

// Gig status options
const statusOptions = [
  { value: 'active', label: 'Active', description: 'Gig is visible and can receive orders' },
  { value: 'paused', label: 'Paused', description: 'Gig is temporarily hidden from public view' },
  { value: 'inactive', label: 'Inactive', description: 'Gig is permanently hidden' }
];

interface CreateGigProps {
  isEditing?: boolean;
}

export const CreateGig: React.FC<CreateGigProps> = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const isEditMode = isEditing || window.location.pathname.includes('/edit');

  // Real hooks
  const { data: gig, isLoading: isGigLoading } = useGigById(isEditMode && id ? id : '');
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const createGig = useCreateGig();
  const updateGig = useUpdateGig();
  const { error: showErrorToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    payment_token: 'EGLD', // Default to EGLD
    status: 'active', // Default to active
  });

  const [packageDetails, setPackageDetails] = useState<string[]>([]);
  const [newDetail, setNewDetail] = useState('');

  const [media, setMedia] = useState<{
    images: { file: File; preview: string }[];
    video?: { file: File; preview: string };
  }>({
    images: [],
    video: undefined,
  });

  // Load gig data when editing
  useEffect(() => {
    if (isEditMode && gig) {
      // Extract package details from description
      const parts = gig.description.split('\n\nPackage Includes:\n');
      const description = parts[0];
      const details = parts[1]?.split('\n') || [];

      setFormData({
        title: gig.title,
        description,
        price: gig.price.toString(),
        duration: gig.duration.toString(),
        category: gig.category,
        payment_token: gig.payment_token || 'EGLD',
        status: gig.status || 'active',
      });

      setPackageDetails(details);
    }
  }, [isEditMode, gig]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        setMedia(prev => ({
          ...prev,
          images: [...prev.images, {
            file,
            preview: URL.createObjectURL(file)
          }]
        }));
      } else if (file.type.startsWith('video/')) {
        setMedia(prev => ({
          ...prev,
          video: {
            file,
            preview: URL.createObjectURL(file)
          }
        }));
      }
    });
  }, []);

  const removeImage = (index: number) => {
    setMedia(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = () => {
    setMedia(prev => ({
      ...prev,
      video: undefined
    }));
  };

  const addPackageDetail = () => {
    if (newDetail.trim()) {
      setPackageDetails([...packageDetails, newDetail.trim()]);
      setNewDetail('');
    }
  };

  const removePackageDetail = (index: number) => {
    setPackageDetails(packageDetails.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isLoggedIn) {
      showErrorToast('Please login to create a gig');
      navigate('/');
      return;
    }

    if (!isProfileLoading && !profile) {
      showErrorToast('Please complete your profile before creating a gig');
      navigate('/profile');
      return;
    }
  }, [isLoggedIn, profile, isProfileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !profile) {
      showErrorToast('Please complete your profile before creating a gig');
      navigate('/profile');
      return;
    }

    if (packageDetails.length === 0) {
      alert('Please add at least one package detail');
      return;
    }

    // Validate price
    const priceValue = Number(formData.price);
    if (!formData.price || isNaN(priceValue) || priceValue <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    // Validate duration
    const durationValue = Number(formData.duration);
    if (!formData.duration || isNaN(durationValue) || durationValue <= 0) {
      alert('Please enter a valid duration greater than 0 days');
      return;
    }

    try {
      const gigData = {
        title: formData.title,
        description: `${formData.description}\n\nPackage Includes:\n${packageDetails.join('\n')}`,
        price: Number(formData.price),
        duration: Number(formData.duration),
        category: formData.category,
        payment_token: formData.payment_token,
        status: formData.status,
      };

      if (isEditMode && id) {
        await updateGig.mutateAsync({ ...gigData, id });
      } else {
        await createGig.mutateAsync(gigData);
      }
      
      navigate('/profile');
    } catch (error) {
      console.error('Error creating/updating gig:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedToken = paymentTokens.find(token => token.id === formData.payment_token);

  if (isEditMode && isGigLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Gig" reference="#">
          <p className="text-white">Loading...</p>
        </Card>
      </div>
    );
  }

  if (isProfileLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="p-8" title="Loading Profile" reference="#">
          <p className="text-white">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <Card className="p-8" title="Create Gig" reference="#">
        <div className="space-y-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-2">{isEditMode ? 'Edit Gig' : 'Create a New Gig'}</h1>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Gig Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Professional Web Development"
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
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your gig in detail..."
                  rows={8}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Package Details
                </label>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      placeholder="e.g., Source code, Smart Contract, Logo files..."
                      className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button
                      type="button"
                      onClick={addPackageDetail}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                  
                  <ul className="space-y-2">
                    {packageDetails.map((detail, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                        <div className="flex items-center">
                          <Check className="text-blue-400 mr-3" size={16} />
                          <span className="text-white">{detail}</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removePackageDetail(index)}
                          className="text-red-400 hover:text-red-300 bg-transparent border-none p-1"
                        >
                          <X size={16} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <hr className="border-gray-600" />

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Media
                </label>
                <div
                  className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      onDrop(files);
                    }}
                    className="hidden"
                  />
                  <p className="text-gray-400">
                    Drag & drop images/video here, or click to select files
                  </p>
                </div>
              </div>

              {media.images.length > 0 && (
                <div>
                  <h3 className="text-grey font-medium mb-4">Images</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {media.images.map((image, index) => (
                      <div key={index} className="relative min-w-36">
                        <img
                          src={image.preview}
                          alt={`Preview ${index}`}
                          className="w-36 h-24 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {media.video && (
                <div>
                  <h3 className="text-white font-medium mb-4">Video</h3>
                  <div className="relative">
                    <video
                      src={media.video.preview}
                      controls
                      className="w-full max-w-md h-48 rounded-md"
                    />
                    <Button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              )}

              <hr className="border-gray-600" />

              {/* Gig Status Selection */}
              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Gig Status *
                </label>
                <div className="space-y-4">
                  {statusOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.status === option.value
                          ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                          : 'border-gray-600 bg-gray-800'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, status: option.value }))}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={formData.status === option.value}
                          onChange={handleChange}
                          className="mr-3"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">
                              {option.label}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              option.value === 'active' ? 'bg-green-100 text-green-800' :
                              option.value === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {option.value === 'active' ? 'Public' : 'Hidden'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {formData.status !== 'active' && (
                  <div className="mt-4 bg-blue-900 border border-blue-500 rounded-md p-3">
                    <div className="flex items-start">
                      <div className="text-blue-400 mr-2 mt-0.5">ℹ️</div>
                      <div>
                        <p className="text-white font-medium">Visibility Notice</p>
                        <p className="text-blue-200 text-sm">
                          This gig will not be visible in public listings. Existing orders will not be affected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Token Selection */}
              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Payment Token *
                </label>
                <div className="space-y-4">
                  {paymentTokens.map((token) => (
                    <div
                      key={token.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.payment_token === token.id
                          ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                          : 'border-gray-600 bg-gray-800'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, payment_token: token.id }))}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="payment_token"
                          value={token.id}
                          checked={formData.payment_token === token.id}
                          onChange={handleChange}
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <div className={formData.payment_token === token.id ? "text-blue-400" : "text-white"}>
                            {token.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold">
                                {token.name}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                token.id === 'EGLD' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {token.fee} fee
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                              {token.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Fee Information Alert */}
                {formData.payment_token === 'EGLD' && (
                  <div className="mt-4 bg-orange-900 border border-orange-500 rounded-md p-3">
                    <div className="flex items-start">
                      <div className="text-orange-400 mr-2 mt-0.5">ℹ️</div>
                      <div>
                        <p className="text-white font-medium">EGLD Payment Fee</p>
                        <p className="text-orange-200 text-sm">
                          10% platform fee will be deducted from EGLD payments. 
                          Use IDA tokens for zero fees!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.payment_token === 'IDA-f9bc1d' && (
                  <div className="mt-4 bg-green-900 border border-green-500 rounded-md p-3">
                    <div className="flex items-start">
                      <div className="text-green-400 mr-2 mt-0.5">✅</div>
                      <div>
                        <p className="text-white font-medium">IDA Token Benefits</p>
                        <p className="text-green-200 text-sm">
                          No platform fees! Keep 100% of your earnings with IDA tokens.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Price ({selectedToken?.symbol || 'Token'}) *
                </label>
                <input
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="100"
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {formData.payment_token === 'EGLD' && formData.price && (
                  <p className="text-orange-300 text-sm mt-2">
                    💡 You'll receive: {(Number(formData.price) * 0.9).toFixed(2)} EGLD (after 10% fee)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-grey text-sm font-medium mb-2">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="7"
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-gray-400 text-sm mt-1">
                  How many days it will take you to complete this gig
                </p>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium text-lg"
                  disabled={createGig.isLoading || updateGig.isLoading}
                >
                  {createGig.isLoading || updateGig.isLoading 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update Gig' : 'Create Gig')
                  }
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};