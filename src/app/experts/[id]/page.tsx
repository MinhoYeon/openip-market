
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

interface ExpertProfile {
  id: string; // User ID
  name: string;
  email: string;
  createdAt: string;
  expertProfile: {
    expertType: string;
    specializations: string; // JSON string
    bio: string;
    experience: string;
    hourlyRate: string;
    projectRate: string;
    availability: string;
    rating: number;
    reviewCount: number;
    completedJobs: number;
  } | null;
}

export default function ExpertProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchExpert();
  }, [id]);

  const fetchExpert = async () => {
    try {
      const res = await fetch(`/api/experts/${id}`);
      if (res.ok) {
        setExpert(await res.json());
      } else {
        setExpert(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading expert profile...</div>;
  if (!expert || !expert.expertProfile) return <div className="p-8 text-center">Expert not found.</div>;

  const profile = expert.expertProfile;
  const specializations = JSON.parse(profile.specializations || '[]');

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="fluent-card p-8 bg-white mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Avatar / Identity */}
          <div className="flex-shrink-0 text-center">
            <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-500 mb-4 mx-auto">
              {expert.name[0]}
            </div>
            <h1 className="text-2xl font-bold">{expert.name}</h1>
            <p className="text-slate-500 font-medium">{profile.expertType}</p>

            <div className="mt-4 flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block
                ${profile.availability === 'Available' ? 'bg-green-100 text-green-700' :
                  profile.availability === 'Busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {profile.availability}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-grow space-y-6">

            {/* Stats Check */}
            <div className="flex gap-6 border-b pb-6">
              <div>
                <span className="block text-2xl font-bold">{profile.rating.toFixed(1)}</span>
                <span className="text-sm text-slate-500">Rating ({profile.reviewCount})</span>
              </div>
              <div>
                <span className="block text-2xl font-bold">{profile.completedJobs}</span>
                <span className="text-sm text-slate-500">Jobs Done</span>
              </div>
              <div>
                <span className="block text-2xl font-bold">{profile.experience}</span>
                <span className="text-sm text-slate-500">Experience</span>
              </div>
            </div>

            {/* Specializations */}
            <div>
              <h3 className="text-lg font-bold mb-2">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {specializations.map((tag: string) => (
                  <span key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-bold mb-2">About</h3>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                {profile.bio || "No biography provided."}
              </p>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <span className="block text-sm text-slate-500">Hourly Rate</span>
                <span className="font-semibold">{profile.hourlyRate || 'Negotiable'}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Project Rate</span>
                <span className="font-semibold">{profile.projectRate || 'Negotiable'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-4">
              {user?.id === expert.id ? (
                <Link href="/experts/profile/edit" className="btn-secondary w-full text-center py-3">
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button className="btn-primary flex-1 py-3">
                    Request Services
                  </button>
                  <button className="btn-secondary flex-1 py-3">
                    Contact
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
