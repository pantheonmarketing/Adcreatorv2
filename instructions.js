// instructions.js

/*
Step-by-step guide to generate copy with Claude using the Anthropic API:

1. Set up the Anthropic API:
   - Install the Anthropic SDK: npm install @anthropic-ai/sdk
   - Import the SDK in your file: import Anthropic from '@anthropic-ai/sdk';
   - Initialize the client with your API key:
     const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

2. Prepare the prompt:
   - Create a string that includes instructions and any necessary context for Claude.
   - For headlines, you might use something like:
     const prompt = `Generate 5 engaging headlines for a Facebook ad about ${product}. 
     The target audience is ${audience}. 
     Each headline should be no longer than 10 words.
     Format the response as a JSON array of strings.`;

3. Make the API call:
   const completion = await anthropic.completions.create({
     model: "claude-2",
     prompt: `Human: ${prompt}\n\nAssistant:`,
     max_tokens_to_sample: 300,
     stop_sequences: ["\nHuman:"],
   });

4. Process the response:
   let content = completion.completion.trim();
   if (!content) throw new Error('No content received from Anthropic');

   // Extract JSON from the response
   const jsonMatch = content.match(/\[[\s\S]*\]/);
   if (!jsonMatch) {
     throw new Error('No valid JSON found in the API response');
   }

   const headlines = JSON.parse(jsonMatch[0]);

5. Use the generated headlines:
   - You can now use the 'headlines' array in your application.

6. Error handling:
   - Wrap the API call and processing in a try-catch block to handle any errors.

Example function to generate headlines:

async function generateHeadlines(product, audience) {
  try {
    const prompt = `Generate 5 engaging headlines for a Facebook ad about ${product}. 
    The target audience is ${audience}. 
    Each headline should be no longer than 10 words.
    Format the response as a JSON array of strings.`;

    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: `Human: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 300,
      stop_sequences: ["\nHuman:"],
    });

    let content = completion.completion.trim();
    if (!content) throw new Error('No content received from Anthropic');

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the API response');
    }

    const headlines = JSON.parse(jsonMatch[0]);
    return headlines;
  } catch (error) {
    console.error('Error generating headlines:', error);
    throw error;
  }
}

Usage example:

const product = "eco-friendly water bottles";
const audience = "environmentally conscious millennials";

try {
  const headlines = await generateHeadlines(product, audience);
  console.log('Generated headlines:', headlines);
} catch (error) {
  console.error('Failed to generate headlines:', error);
}

Remember to handle the API response carefully, as Claude might not always return perfectly formatted JSON. Always validate and sanitize the response before using it in your application.
