import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  console.log('Received request body:', req.body);
  
  const { 
    avatar, 
    desiredOutcome, 
    ineffectiveMethod1, 
    ineffectiveMethod2, 
    ineffectiveMethod3, 
    newSolution 
  } = req.body;

  console.log('Received request with data:', req.body);

  // Input validation
  if (!avatar || !desiredOutcome || !ineffectiveMethod1 || !ineffectiveMethod2 || !ineffectiveMethod3 || !newSolution) {
    console.error('Missing required fields:', {
      avatar, 
      desiredOutcome, 
      ineffectiveMethod1, 
      ineffectiveMethod2, 
      ineffectiveMethod3, 
      newSolution
    });
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Cycle through ineffective methods
  const ineffectiveMethods = [ineffectiveMethod1, ineffectiveMethod2, ineffectiveMethod3];
  const randomIneffectiveMethod = ineffectiveMethods[Math.floor(Math.random() * ineffectiveMethods.length)];
  console.log('Selected ineffective method:', randomIneffectiveMethod);

  const prompt = `
  Provide two short phrases suitable for the top and bottom text of a meme, in the following format:

  {
    "topText": "IF YOU WANT ${desiredOutcome}, DON'T ${randomIneffectiveMethod}",
    "bottomText": "DO THIS INSTEAD: ${newSolution}"
  }

  The text should be attention-grabbing and relevant to the audience and the solution.
  Do not include hashtags, emojis, or quotation marks in the text.
  Keep each phrase short and impactful, ideally no more than 5-7 words each.
  Provide ONLY the JSON object as the response, with no additional text.
  `;

  try {
    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: `Human: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 300,
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
    const memeText = JSON.parse(content);

    console.log('Generated meme text:', memeText);
    return res.status(200).json(memeText);
  } catch (error) {
    console.error('Error generating meme text:', error);
    return res.status(500).json({ error: 'Failed to generate meme text', details: error.message });
  }
}
