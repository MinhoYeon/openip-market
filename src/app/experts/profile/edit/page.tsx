
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { RoleGuard } from '@/components/Auth/RoleGuard';

interface ExpertProfileData {
  expertType: string;
  specializations: string[];
  bio: string;
  experience: string;
  hourlyRate: string;
  projectRate: string;
  availability: string;
}

export default function EditExpertProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ExpertProfileData>({
    expertType: 'Expert',
    specializations: [],
    bio: '',
    experience: '',
    hourlyRate: '',
    projectRate: '',
    availability: 'Available'
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/experts/profile?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.id) { // if profile exists
          setFormData({
            expertType: data.expertType || 'Expert',
            specializations: JSON.parse(data.specializations || '[]'),
            bio: data.bio || '',
            experience: data.experience || '',
            hourlyRate: data.hourlyRate || '',
            projectRate: data.projectRate || '',
            availability: data.availability || 'Available'
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/experts/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.id })
      });

      if (res.ok) {
        alert('Profile saved successfully!');
        router.push('/experts/' + user.id);
      } else {
        alert('Failed to save profile');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.specializations.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          specializations: [...prev.specializations, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(t => t !== tag)
    }));
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <RoleGuard allowedRoles={['Owner', 'Buyer', 'Broker', 'Valuator', 'Admin']}>
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Expert Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="fluent-card p-6 bg-white space-y-4">

            {/* Expert Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Expert Type</label>
              <select
                className="input-field w-full"
                value={formData.expertType}
                onChange={e => setFormData({ ...formData, expertType: e.target.value })}
              >
                <option value="Valuator">Valuator (가치평가사)</option>
                <option value="PatentAttorney">Patent Attorney (변리사)</option>
                <option value="Broker">IP Broker (거래사)</option>
                <option value="Consultant">Consultant ({'컨설턴트'})</option>
              </select>
            </div>

            {/* Specializations (Tags) */}
            <div>
              <label className="block text-sm font-semibold mb-2">Specializations (Press Enter to add)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.specializations.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. AI, BioTech, Semiconductor"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold mb-2">Bio / Introduction</label>
              <textarea
                className="input-field w-full h-32"
                placeholder="Introduce your expertise and background..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold mb-2">Years of Experience / Key Achievements</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. 15 Years, Ex-Samsung IP Team"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Hourly Rate (Optional)</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. 300,000 KRW"
                  value={formData.hourlyRate}
                  onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Project Base Rate (Optional)</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. 3,000,000 KRW"
                  value={formData.projectRate}
                  onChange={e => setFormData({ ...formData, projectRate: e.target.value })}
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-semibold mb-2">Current Availability</label>
              <select
                className="input-field w-full"
                value={formData.availability}
                onChange={e => setFormData({ ...formData, availability: e.target.value })}
              >
                <option value="Available">Available for New Projects</option>
                <option value="Busy">Busy (Limited Availability)</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '16px' }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
