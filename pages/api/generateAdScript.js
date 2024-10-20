import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { avatar, desiredOutcome, ineffectiveMethod1, ineffectiveMethod2, ineffectiveMethod3, newSolution } = req.body;

    const prompt = `
    Write two variations of a Facebook ad caption using the following information:

    Avatar and Their Problem: ${avatar}
    Desired Outcome: ${desiredOutcome}
    Ineffective Method 1: ${ineffectiveMethod1}
    Ineffective Method 2: ${ineffectiveMethod2}
    Ineffective Method 3: ${ineffectiveMethod3}
    New Solution Name: ${newSolution}

    Please write each ad copy variation in this format:

    {
      "variation1": {
        "line1": "📞 CALLING ALL [AVATAR + THEIR PAIN]: [achieve your desired outcome] with this NEW METHOD...",
        "line2": "I understand that you may have already tried:",
        "line3": "- [Ineffective Method 1]\\n- [Ineffective Method 2]\\n- Or even - [Ineffective Method 3]",
        "line4": "But you're still seeing no progress towards [desired outcome].",
        "line5": "That's why I want to introduce you to [new solution name].",
        "line6": "As of 2024, it's the fastest and easiest way to [desired outcome].",
        "line7": "If you're interested in learning more…",
        "line8": "You can access it right here: [INSERT LINK]"
      },
      "variation2": {
        "line1": "[Create a different approach using the same information but with a unique angle or hook]",
        "line2": "[Continue with the rest of the ad copy...]"
      }
    }

    Make sure both ad copy variations are engaging, persuasive, and tailored to the specific avatar and their problem. Use emojis where appropriate to make the ads more visually appealing. Provide ONLY the JSON object as the response, with no additional text.`;

    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: `Human: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 2000,
      stop_sequences: ["\nHuman:"],
    });

    let content = completion.completion.trim();
    if (!content) throw new Error('No content received from Anthropic');

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the API response');
    }

    content = jsonMatch[0];

    // Parse the JSON content
    const adContent = JSON.parse(content);

    return res.status(200).json(adContent);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to generate ad script', details: error.message });
  }
}
