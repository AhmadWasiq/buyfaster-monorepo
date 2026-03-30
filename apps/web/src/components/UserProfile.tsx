import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Check,
  Home,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User as UserEntity, UserData, UserAddress } from '../entities/User';
import { Auth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  onBack: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [authUser, setAuthUser] = useState(Auth.getCurrentUser());
  
  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState<Partial<UserData>>({});
  const [addressForm, setAddressForm] = useState<Partial<UserAddress>>({});

  // Profile picture upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logout handler
  const handleLogout = async () => {
    await Auth.signOut();
    // Force a page reload to reset the app state
    window.location.reload();
  };

  // Auth state listener
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await Auth.waitForAuth();
      setAuthUser(currentUser);
      
      if (!currentUser) {
        setError('Please sign in to view your profile');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Load user data when auth user is available
  useEffect(() => {
    if (authUser) {
      loadUserData();
    }
  }, [authUser]);

  const loadUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!authUser) {
        throw new Error('No authenticated user found');
      }

      // Try to get existing user profile or create new one
      let userData = await UserEntity.getCurrentUser();
      
      if (!userData) {
        // Create new user profile with Supabase auth user ID
        userData = await UserEntity.create({
          id: authUser.id, // Use Supabase auth user ID
          email: authUser.email,
          first_name: authUser.first_name,
          last_name: authUser.last_name,
          avatar_url: authUser.avatar_url, // Include Google profile picture
        });
      }
      
      setUser(userData);
      setProfileForm(userData);
      
      // Load addresses (RLS will filter automatically)
      const userAddresses = await UserEntity.getAddresses();
      setAddresses(userAddresses);
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!authUser) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      const updatedUser = await UserEntity.update({ avatar_url: publicUrl });
      setUser(updatedUser);
      setProfileForm({ ...profileForm, avatar_url: publicUrl });
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
  };

  const handleProfileSave = async () => {
    if (!authUser || !profileForm) return;

    try {
      const updatedUser = await UserEntity.update(profileForm);
      setUser(updatedUser);
      setEditingProfile(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleAddressCreate = async () => {
    if (!authUser) return;
    
    try {
      const newAddress = await UserEntity.createAddress({
        user_id: authUser.id,
        address_type: 'shipping',
        first_name: addressForm.first_name || '',
        last_name: addressForm.last_name || '',
        address_line_1: addressForm.address_line_1 || '',
        address_line_2: addressForm.address_line_2 || '',
        city: addressForm.city || '',
        state: addressForm.state || '',
        postal_code: addressForm.postal_code || '',
        country: addressForm.country || 'FR',
        phone: addressForm.phone || '',
        is_default: addressForm.is_default || false
      });
      
      // If the new address is default, update other addresses to not be default
      let updatedAddresses = [...addresses, newAddress];
      if (newAddress.is_default) {
        updatedAddresses = updatedAddresses.map(addr => 
          addr.id !== newAddress.id && addr.address_type === newAddress.address_type 
            ? { ...addr, is_default: false }
            : addr
        );
      }
      
      setAddresses(updatedAddresses);
      setShowAddAddress(false);
      setAddressForm({});
    } catch (err) {
      console.error('Failed to create address:', err);
      setError('Failed to create address. Please try again.');
    }
  };

  const handleAddressUpdate = async (id: string) => {
    try {
      const updatedAddress = await UserEntity.updateAddress(id, addressForm);
      
      // Update the addresses state properly
      let updatedAddresses = addresses.map(addr => addr.id === id ? updatedAddress : addr);
      
      // If the updated address is now default, make sure other addresses of same type are not default
      if (updatedAddress.is_default) {
        updatedAddresses = updatedAddresses.map(addr => 
          addr.id !== updatedAddress.id && addr.address_type === updatedAddress.address_type
            ? { ...addr, is_default: false }
            : addr
        );
      }
      
      setAddresses(updatedAddresses);
      setEditingAddress(null);
      setAddressForm({});
    } catch (err) {
      console.error('Failed to update address:', err);
      setError('Failed to update address. Please try again.');
    }
  };

  const handleAddressDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await UserEntity.deleteAddress(id);
      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (err) {
      console.error('Failed to delete address:', err);
      setError('Failed to delete address. Please try again.');
    }
  };


  const startEditAddress = (address: UserAddress) => {
    setAddressForm(address);
    setEditingAddress(address.id!);
  };

  const cancelEdit = () => {
    setEditingProfile(false);
    setEditingAddress(null);
    setShowAddAddress(false);
    setAddressForm({});
    setProfileForm(user || {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sign in required</h3>
          <p className="text-gray-600 mb-6">Please sign in to view your profile</p>
          <Button 
            onClick={() => Auth.signInWithGoogle()} 
            variant="gradient"
            className="px-6"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">
          Profile
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl hover:text-red-500 hover:bg-red-50"
          title="Sign out"
        >
          <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-3xl p-6"
          >
            <div className="text-center mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                className={`w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden ${
                  editingProfile ? 'cursor-pointer hover:bg-cyan-200 transition-colors' : ''
                }`}
                onClick={editingProfile ? () => fileInputRef.current?.click() : undefined}
                title={editingProfile ? (uploading ? 'Uploading...' : 'Click to change profile picture') : undefined}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={`w-10 h-10 text-cyan-600 ${user?.avatar_url ? 'hidden' : ''}`} />
                {editingProfile && uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-gray-500">{user?.email}</p>
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="First name"
                    value={profileForm.first_name || ''}
                    onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                    className="rounded-2xl"
                  />
                  <Input
                    placeholder="Last name"
                    value={profileForm.last_name || ''}
                    onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                    className="rounded-2xl"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={profileForm.email || ''}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="rounded-2xl"
                  disabled
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  className="rounded-2xl"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    className="flex-1 rounded-2xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProfileSave}
                    variant="gradient"
                    size="sm"
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={() => setEditingProfile(true)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </motion.div>

          {/* Addresses Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">My Addresses</h3>
              </div>
              <Button
                onClick={() => {
                  setAddressForm({address_type: 'shipping', country: 'FR', is_default: false});
                  setShowAddAddress(true);
                }}
                variant="gradient"
                size="sm"
                className="px-4 py-2 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>

            {/* Add Address Form */}
            {showAddAddress && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 shadow-brand-soft"
              >
                <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h4>
                <AddressForm
                  address={addressForm}
                  onChange={setAddressForm}
                  onSave={handleAddressCreate}
                  onCancel={cancelEdit}
                />
              </motion.div>
            )}

            {/* Addresses List */}
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-brand-soft hover:shadow-brand transition-shadow duration-200">
                  {editingAddress === address.id ? (
                    <AddressForm
                      address={addressForm}
                      onChange={setAddressForm}
                      onSave={() => handleAddressUpdate(address.id!)}
                      onCancel={cancelEdit}
                      isEditing
                    />
                  ) : (
                    <AddressDisplay
                      address={address}
                      onEdit={() => startEditAddress(address)}
                      onDelete={() => handleAddressDelete(address.id!)}
                    />
                  )}
                </div>
              ))}
              
              {addresses.length === 0 && !showAddAddress && (
                <div className="text-center py-12">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No addresses saved yet</p>
                  <p className="text-gray-400 text-sm">Add an address to get started</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Address Form Component
const AddressForm: React.FC<{
  address: Partial<UserAddress>;
  onChange: (address: Partial<UserAddress>) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}> = ({ address, onChange, onSave, onCancel, isEditing = false }) => {
  const handleDefaultChange = (checked: boolean) => {
    onChange({ ...address, is_default: checked });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl">
        <input
          type="checkbox"
          id="is_default"
          checked={address.is_default || false}
          onChange={(e) => handleDefaultChange(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="is_default" className="text-sm text-gray-600">
          Set as default address
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="First name*"
          value={address.first_name || ''}
          onChange={(e) => onChange({ ...address, first_name: e.target.value })}
          className="rounded-2xl"
          required
        />
        <Input
          placeholder="Last name*"
          value={address.last_name || ''}
          onChange={(e) => onChange({ ...address, last_name: e.target.value })}
          className="rounded-2xl"
          required
        />
      </div>

      <Input
        placeholder="Address*"
        value={address.address_line_1 || ''}
        onChange={(e) => onChange({ ...address, address_line_1: e.target.value })}
        className="rounded-2xl"
        required
      />


      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="City*"
          value={address.city || ''}
          onChange={(e) => onChange({ ...address, city: e.target.value })}
          className="rounded-2xl"
          required
        />
        <Input
          placeholder="Postal code*"
          value={address.postal_code || ''}
          onChange={(e) => onChange({ ...address, postal_code: e.target.value })}
          className="rounded-2xl"
          required
        />
      </div>


      <Input
        value="France"
        disabled
        className="rounded-2xl bg-gray-50 text-gray-600"
        placeholder="Country"
      />
      <input type="hidden" value="FR" onChange={() => onChange({ ...address, country: 'FR' })} />

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-2xl"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="gradient"
          size="sm"
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

// Address Display Component
const AddressDisplay: React.FC<{
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ address, onEdit, onDelete }) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium text-gray-900">
            Address
          </h4>
          {address.is_default && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              <Check className="w-3 h-3" />
              Default
            </span>
          )}
        </div>
        <div className="text-gray-600 text-sm space-y-1">
          <p>{address.first_name} {address.last_name}</p>
          <p>{address.address_line_1}</p>
          {address.address_line_2 && <p>{address.address_line_2}</p>}
          <p>{address.city} {address.postal_code}</p>
          <p>{address.country}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="text-gray-400 hover:text-cyan-600"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
