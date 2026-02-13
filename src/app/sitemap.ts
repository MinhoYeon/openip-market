import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://openip.market'; // Replace with actual domain

  // 1. Static Routes
  const routes = [
    '',
    '/marketplace',
    '/experts',
    '/demand',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 2. Dynamic IP Listings
  const listings = await prisma.iPListing.findMany({
    where: { status: 'Published', visibility: 'Full' },
    select: { id: true, updatedAt: true },
    take: 1000,
  });

  const listingUrls = listings.map((listing) => ({
    url: `${baseUrl}/marketplace/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Dynamic Expert Profiles
  const experts = await prisma.expertProfile.findMany({
    select: { userId: true, updatedAt: true },
    take: 100,
  });

  const expertUrls = experts.map((expert) => ({
    url: `${baseUrl}/experts/${expert.userId}`,
    lastModified: expert.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...listingUrls, ...expertUrls];
}
