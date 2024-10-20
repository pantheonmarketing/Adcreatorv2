import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const adData = req.body;

  const prompt = `
  Clean and reformat the following text according to Facebook ad compliance guidelines, then rewrite the content using a persuasive Frank Kern-style copywriting format. Follow these steps:

  1. Remove any unrealistic claims, personal targeting, or promises of guaranteed success. Avoid sensationalism, before/after comparisons, and fear-inducing language. Ensure testimonials are realistic and add disclaimers when necessary.

  2. Reword the text in a conversational tone, focusing on benefits instead of features. Keep the language simple, friendly, and direct, making the ad feel like a personal conversation. Highlight the journey or process instead of promising results, and frame the message positively.

  3. Return the cleaned and reformatted text for each field, maintaining the original structure.

  Here is the input data:
  ${JSON.stringify(adData, null, 2)}

  Please provide the cleaned version for each field, keeping the same structure. Format your response as follows:

  avatarAndProblem: [Cleaned text here]
  desiredOutcome: [Cleaned text here]
  ineffectiveMethod1: [Cleaned text here]
  ineffectiveMethod2: [Cleaned text here]
  ineffectiveMethod3: [Cleaned text here]
  newSolutionName: [Cleaned text here]
  imageGenerationKeywords: [Cleaned text here]
  `;

  try {
    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: `Human: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 1000,
      stop_sequences: ["\nHuman:"],
    });

    let content = completion.completion.trim();
    if (!content) throw new Error('No content received from Anthropic');

    // Parse the response manually
    const cleanedData = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        cleanedData[key.trim()] = valueParts.join(':').trim();
      }
    }

    console.log('Cleaned data:', cleanedData);
    res.status(200).json(cleanedData);
  } catch (error) {
    console.error('Error cleaning ad copy:', error);
    res.status(500).json({ message: 'Failed to clean ad copy', error: error.message });
  }
}
