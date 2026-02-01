/**
 * Comment Seeder for AI Moderation Testing
 * 
 * Creates sample comments across all moderation categories to test
 * the AI moderation system. Run with: npm run seed:comments
 * 
 * Categories:
 * - Appropriate comments (positive, neutral feedback)
 * - Profanity (explicit language)
 * - Toxicity (negative, aggressive)
 * - Harassment (targeting individuals)
 * - Hate speech (discriminatory)
 * - Spam (promotional, repetitive)
 * - Inappropriate (off-topic, adult content references)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './env.js';
import { User } from '../models/user.model.js';
import { Event } from '../models/event.model.js';
import { Feedback } from '../models/feedback.model.js';

// Sample comments by category
const SAMPLE_COMMENTS = {
  // APPROPRIATE - Should pass moderation
  appropriate: [
    { comment: "Great workshop! Learned a lot about machine learning.", rating: 5 },
    { comment: "The professor was very knowledgeable and helpful.", rating: 5 },
    { comment: "Good event but the room was a bit crowded.", rating: 4 },
    { comment: "Really enjoyed the networking opportunities!", rating: 5 },
    { comment: "The food was okay, but the content was excellent.", rating: 4 },
    { comment: "Would definitely attend again. Very well organized.", rating: 5 },
    { comment: "Nice event, though it started a bit late.", rating: 3 },
    { comment: "The hands-on exercises were super helpful.", rating: 5 },
    { comment: "Interesting topic, but the pace was too fast for beginners.", rating: 3 },
    { comment: "Thank you to the organizers for this amazing experience!", rating: 5 },
  ],

  // PROFANITY - Contains explicit language
  profanity: [
    { comment: "What the hell was that? Complete waste of time.", rating: 1 },
    { comment: "This event was absolute crap, don't bother attending.", rating: 1 },
    { comment: "Damn, that was boring as fuck.", rating: 1 },
    { comment: "The speaker was full of shit and didn't know anything.", rating: 1 },
    { comment: "Such a BS event, total scam for the money.", rating: 1 },
  ],

  // TOXICITY - Aggressive, negative without specific profanity
  toxicity: [
    { comment: "This was the worst event I've ever attended. A complete disgrace.", rating: 1 },
    { comment: "Whoever organized this should be fired immediately.", rating: 1 },
    { comment: "What a pathetic excuse for a workshop. Utterly useless.", rating: 1 },
    { comment: "The organizers are clearly incompetent idiots.", rating: 1 },
    { comment: "Don't waste your time or money on this garbage.", rating: 1 },
    { comment: "This university should be ashamed of hosting such trash.", rating: 1 },
  ],

  // HARASSMENT - Targeting specific individuals
  harassment: [
    { comment: "Dr. Ahmed is the worst professor ever. Students should avoid him.", rating: 1 },
    { comment: "The event manager Sarah is so annoying and rude to everyone.", rating: 1 },
    { comment: "I saw Mohamed cheating during the workshop quiz. He should be expelled.", rating: 1 },
    { comment: "That girl in the front row kept asking stupid questions. So embarrassing.", rating: 2 },
    { comment: "The student volunteers were lazy and incompetent, especially the one named Ali.", rating: 1 },
  ],

  // HATE SPEECH - Discriminatory content
  hate_speech: [
    { comment: "Why do they let those people attend our events?", rating: 1 },
    { comment: "This faculty is full of foreigners who don't belong here.", rating: 1 },
    { comment: "Women shouldn't be giving technical presentations.", rating: 1 },
    { comment: "The religious students always ruin these events.", rating: 1 },
    { comment: "Students from that department are all the same - lazy.", rating: 1 },
  ],

  // SPAM - Promotional, repetitive
  spam: [
    { comment: "Check out my website for FREE courses! www.fake-courses.com", rating: 5 },
    { comment: "BUY NOW! Best laptops at discount prices. DM me for details!!!", rating: 5 },
    { comment: "WIN FREE IPHONE!! Click here now: bit.ly/scam123", rating: 5 },
    { comment: "AMAZING AMAZING AMAZING EVENT!!!!!!!! 10/10 WOULD RECOMMEND!!!!!", rating: 5 },
    { comment: "Contact me for assignment help. WhatsApp: +1234567890", rating: 3 },
    { comment: "I sell answers for all exams. Very cheap. Message me.", rating: 4 },
  ],

  // INAPPROPRIATE - Off-topic, suggestive
  inappropriate: [
    { comment: "The refreshments were nice but I was more interested in the cute attendees ;)", rating: 4 },
    { comment: "This event was so boring I started swiping on Tinder instead.", rating: 2 },
    { comment: "Did anyone else notice how hot the presenter was? Couldn't focus on anything else.", rating: 4 },
    { comment: "I came just to meet girls/guys, the content was whatever.", rating: 3 },
    { comment: "More interested in the after-party if you know what I mean 😏", rating: 3 },
  ],

  // HARSH LANGUAGE - Negative but borderline
  harsh_language: [
    { comment: "Honestly, this was terrible. Very disappointed.", rating: 1 },
    { comment: "The worst part was the awful organization. Just bad.", rating: 1 },
    { comment: "Stupid decision to hold it in that tiny room.", rating: 2 },
    { comment: "What a joke of an event. Never coming back.", rating: 1 },
    { comment: "The speaker was arrogant and dismissed all questions rudely.", rating: 1 },
  ],

  // PERSONAL ATTACKS
  personal_attack: [
    { comment: "The organizer is clearly an idiot who doesn't know what they're doing.", rating: 1 },
    { comment: "You'd have to be a moron to think this event was good.", rating: 1 },
    { comment: "Anyone who gave this 5 stars must be the organizer's friend.", rating: 2 },
    { comment: "The speaker needs to go back to school. Embarrassing lack of knowledge.", rating: 1 },
  ],

  // INSULTING
  insulting: [
    { comment: "Only losers would enjoy this kind of event.", rating: 1 },
    { comment: "The people who planned this are absolute clowns.", rating: 1 },
    { comment: "What kind of idiot wastes money on this?", rating: 1 },
    { comment: "The presentation was made for dummies, nothing new.", rating: 2 },
  ],

  // NEGATIVE SENTIMENT - Strongly negative but not necessarily violating
  negative_sentiment: [
    { comment: "Very disappointing. Expected much more from this event.", rating: 2 },
    { comment: "Not worth the time or money. Completely let down.", rating: 1 },
    { comment: "The content was outdated and the delivery was boring.", rating: 2 },
    { comment: "Regret attending. Could have done something more productive.", rating: 1 },
    { comment: "Below average event. The university can do much better.", rating: 2 },
  ],

  // MISINFORMATION - False claims
  misinformation: [
    { comment: "They lied about the speaker credentials. He has no PhD.", rating: 1 },
    { comment: "This event was secretly funded by a controversial company.", rating: 2 },
    { comment: "The organizers are pocketing the registration fees. It's a scam.", rating: 1 },
    { comment: "I heard the certificates they give are not recognized anywhere.", rating: 2 },
  ],
};

/**
 * Seed sample comments for AI moderation testing
 * Can be called from other seeders or run standalone
 */
export async function seedSampleComments(): Promise<void> {
  console.log('\n💬 Seeding sample comments for AI moderation testing...');

  try {
    // Get sample users and events
    const users = await User.find({ role: 'STUDENT' }).limit(20).lean();
    const events = await Event.find({ status: 'PUBLISHED' }).limit(10).lean();

    if (users.length === 0 || events.length === 0) {
      console.log('  ⚠️  No users or events found. Skipping comment seeding.');
      return;
    }

    console.log(`  📝 Found ${users.length} users and ${events.length} events`);

    let createdCount = 0;
    const categories = Object.keys(SAMPLE_COMMENTS) as Array<keyof typeof SAMPLE_COMMENTS>;

    for (const category of categories) {
      const comments = SAMPLE_COMMENTS[category];

      for (const commentData of comments) {
        // Pick random user and event
        const user = users[Math.floor(Math.random() * users.length)];
        const event = events[Math.floor(Math.random() * events.length)];

        try {
          // Check if similar comment already exists
          const existingComment = await Feedback.findOne({
            user: user._id,
            event: event._id,
            comment: commentData.comment,
          });

          if (!existingComment) {
            await Feedback.create({
              user: user._id,
              event: event._id,
              type: 'both',
              rating: commentData.rating,
              comment: commentData.comment,
              // Leave moderation fields empty for AI to fill
              moderationStatus: null,
              moderationFlags: [],
              moderationSeverity: null,
              moderationConfidence: null,
            });
            createdCount++;
          }
        } catch (err: any) {
          // Skip duplicate errors silently
          if (err.code !== 11000) {
            console.error(`  ❌ Error creating comment: ${err.message}`);
          }
        }
      }
    }

    console.log(`  ✅ Seeded ${createdCount} comments across ${categories.length} categories`);
    console.log(`  📋 Categories: ${categories.join(', ')}`);
    
    // Show stats
    const totalComments = await Feedback.countDocuments({ comment: { $exists: true, $ne: '' } });
    const unmoderated = await Feedback.countDocuments({
      comment: { $exists: true, $ne: '' },
      $or: [
        { moderationStatus: null },
        { moderationStatus: { $exists: false } },
        { moderationFlags: { $size: 0 } },
      ],
    });
    
    console.log(`  📊 Total comments in DB: ${totalComments}`);
    console.log(`  🔍 Unmoderated: ${unmoderated}`);
    console.log(`  🤖 AI service will moderate these on next poll cycle`);

  } catch (error) {
    console.error('  ❌ Comment seeding failed:', error);
    // Don't throw - allow main seeding to continue
  }
}

/**
 * Standalone seeding script (when run directly)
 */
async function seedComments() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    await seedSampleComments();

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedComments();
}
