import dotenv from 'dotenv';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";

dotenv.config({ path: '.env.local' });

export async function generateDraft(rawStories: string | any[]) {
  // Convert array to string if needed and get appropriate length
  const storiesText = Array.isArray(rawStories) 
    ? rawStories.map(story => JSON.stringify(story)).join('\n')
    : rawStories;
  
  const contentLength = Array.isArray(rawStories) 
    ? rawStories.length + ' stories'
    : `${storiesText.length} characters`;

  console.log(`Generating a post draft with raw stories (${contentLength})...`);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Define the schema for our response
    const DraftPostSchema = z.object({
      trendingIdeas: z.array(z.object({
        tweet_link: z.string(),
        description: z.string()
      }))
    });

    // Create a date string if you need it elsewhere
    const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Europe/Rome', month: 'numeric', day: 'numeric' });

    const completion = await openai.beta.chat.completions.parse({
      model: "o1-preview",
      messages: [{
        role: 'user',
        content: `Given a list of raw personal finance tweets sourced from X/Twitter, identify actionable financial insights, market trends, or wealth-building strategies. We want to create educational X content based on these financial discussions. For each tweet, provide the tweet link and a detailed 1-2 sentence analysis focusing on:

1. The core financial insight or strategy being discussed
2. How this information could benefit our audience (We are a personal finance education platform)
3. Potential content angles we could develop from this insight

Return each financial insight as a structured object with:
- tweet_link
- core_insight 
- audience_benefit
- content_opportunities

Prioritize tweets that contain:
- Data-backed financial advice
- Unique perspectives on wealth building
- Market analysis and investment trends
- Personal finance tips for different life stages
- Risk management strategies
- Tax optimization approaches
- Passive income ideas

List ALL relevant tweets that meet these criteria. Aim to identify at least 10 high-value tweets. If there are fewer than 10 tweets that meet our quality standards, include all that qualify with detailed explanations for why they were selected.

Here are the raw tweets to analyze:\n\n ${storiesText}\n\n`
      }],
      response_format: zodResponseFormat(DraftPostSchema, "trendingIdeas"),
    });

    const parsedResponse = completion.choices[0].message.parsed;
    const header = `🚀 Finance Trends on Social Media for ${currentDate}\n\n`
    const draft_post = header + parsedResponse!.trendingIdeas.map(idea => 
      `• ${idea.description} \n  ${idea.tweet_link}`
    ).join('\n\n');

    console.log(draft_post);

    return draft_post;
    
  } catch (error) {
    console.log("error generating draft post");
    console.log(error);
  }
}
