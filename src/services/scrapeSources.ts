import FirecrawlApp from '@mendable/firecrawl-js';
import dotenv from 'dotenv';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

dotenv.config({ path: '.env.local' });

const app = new FirecrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});

// Add type definition for source
interface Source {
  type: 'twitter' | 'reddit' | 'instagram';
  identifier: string;
}

// Helper to convert legacy string format to Source object
function parseSource(source: string | Source): Source {
  if (typeof source === 'string') {
    if (source.includes('x.com') || source.includes('twitter.com')) {
      return { type: 'twitter', identifier: source };
    }
    if (source.startsWith('r/')) {
      return { type: 'reddit', identifier: source };
    }
    if (source.startsWith('@')) {
      return { type: 'instagram', identifier: source };
    }
    throw new Error(`Unable to determine source type for: ${source}`);
  }
  return source;
}

// Add these type definitions at the top of the file after the imports
interface FirecrawlPost {
  title?: string;
  content?: string;
  score?: number;
  url?: string;
  date_posted?: string;
  caption?: string;
  imageUrl?: string;
  timestamp?: string;
  link?: string;
  text?: string;
  media_url?: string;
  created_at?: string;
}

interface FirecrawlResponse {
  data?: {
    llm_extraction?: {
      posts?: FirecrawlPost[];
    };
  };
}

// Define the schemas using Zod
const RedditPostSchema = z.object({
  posts: z.array(z.object({
    title: z.string(),
    content: z.string(),
    score: z.number(),
    url: z.string(),
    date_posted: z.string()
  }))
});

const InstagramPostSchema = z.object({
  posts: z.array(z.object({
    caption: z.string(),
    imageUrl: z.string(),
    timestamp: z.string(),
    link: z.string()
  }))
});

const TwitterPostSchema = z.object({
  posts: z.array(z.object({
    text: z.string(),
    media_url: z.string(),
    created_at: z.string(),
    url: z.string()
  }))
});

// Update the scrapeReddit function with better type safety
async function scrapeReddit(subreddit: string) {
  try {
    const firecrawlResponse = await app.scrapeUrl(`https://reddit.com/r/${subreddit}/hot`, {
      formats: ['extract'],
      extract: {
        schema: RedditPostSchema
      }
    }) as FirecrawlResponse;

    const posts = firecrawlResponse?.data?.llm_extraction?.posts;
    if (!posts || !Array.isArray(posts)) {
      console.warn(`No valid posts found for subreddit: ${subreddit}`);
      return [];
    }

    return posts.map((post) => ({
      headline: post.title || '',
      link: post.url || '',
      date_posted: post.date_posted || new Date().toISOString(),
      content: post.content || '',
      score: post.score || 0
    }));
  } catch (error) {
    console.error(`Error scraping Reddit: ${error}`);
    return [];
  }
}

// Update the scrapeInstagram function with better type safety
async function scrapeInstagram(username: string) {
  try {
    const firecrawlResponse = await app.scrapeUrl(`https://www.instagram.com/${username.replace('@', '')}`, {
      formats: ['extract', 'screenshot'],
      extract: {
        schema: InstagramPostSchema
      }
    }) as FirecrawlResponse;

    const posts = firecrawlResponse?.data?.llm_extraction?.posts;
    if (!posts || !Array.isArray(posts)) {
      console.warn(`No valid posts found for Instagram user: ${username}`);
      return [];
    }

    return posts.map((post) => ({
      headline: post.caption || '',
      link: post.link || '',
      date_posted: post.timestamp || new Date().toISOString(),
      media_url: post.imageUrl || '',
      media_type: 'image'
    }));
  } catch (error) {
    console.error(`Error scraping Instagram: ${error}`);
    return [];
  }
}

// Update the scrapeTwitter function with better type safety
async function scrapeTwitter(url: string) {
  try {
    const firecrawlResponse = await app.scrapeUrl(url, {
      formats: ['extract'],
      extract: {
        schema: TwitterPostSchema
      }
    }) as FirecrawlResponse;

    const posts = firecrawlResponse?.data?.llm_extraction?.posts;
    if (!posts || !Array.isArray(posts)) {
      console.warn(`No valid posts found for Twitter URL: ${url}`);
      return [];
    }

    return posts.map((post) => ({
      headline: post.text || '',
      link: post.url || '',
      date_posted: post.created_at || new Date().toISOString(),
      media_url: post.media_url || '',
      media_type: 'image'
    }));
  } catch (error) {
    console.error(`Error scraping Twitter: ${error}`);
    return [];
  }
}

export async function scrapeSources(sources: (string | Source)[]) {
  console.log(`Scraping ${sources.length} sources...`);
  let combinedText: { stories: any[] } = { stories: [] };

  // Reduce batch size and increase delay
  const BATCH_SIZE = 3;  // Reduced from 5
  const DELAY_BETWEEN_BATCHES = 5000;  // Increased from 2000

  for (let i = 0; i < sources.length; i += BATCH_SIZE) {
    const batch = sources.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (rawSource) => {
      try {
        const source = parseSource(rawSource);
        let retries = 3;
        
        while (retries > 0) {
          try {
            let posts = [];
            switch (source.type) {
              case 'twitter':
                posts = await scrapeTwitter(source.identifier);
                break;
              case 'reddit':
                posts = await scrapeReddit(source.identifier.replace('r/', ''));
                break;
              case 'instagram':
                posts = await scrapeInstagram(source.identifier);
                break;
            }
            if (posts.length > 0) {
              combinedText.stories.push(...posts);
              break; // Success, exit retry loop
            }
          } catch (error) {
            retries--;
            if (retries > 0) {
              console.log(`Retrying ${source.identifier} (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
            } else {
              throw error; // Last retry failed
            }
          }
        }
      } catch (error) {
        console.error(`Error processing source ${JSON.stringify(rawSource)}:`, error);
      }
    }));

    if (i + BATCH_SIZE < sources.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  return combinedText.stories;
}  
