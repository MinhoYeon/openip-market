require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const listingId = 'f14c3213-0ac7-4f1a-8233-aad3638fe614';
    console.log(`Searching for listing ID: ${listingId}`);

    const listing = await prisma.iPListing.findUnique({
      where: { id: listingId },
      include: {
        rightHolders: true,
        owner: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    if (listing) {
      console.log('Listing FOUND:', JSON.stringify(listing, null, 2));
    } else {
      console.error('Listing NOT FOUND');
    }
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
