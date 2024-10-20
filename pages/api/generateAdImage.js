import Replicate from 'replicate';
import axios from 'axios';
import sharp from 'sharp';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  console.log('Received request for generateAdImage');
  console.log('Request body:', req.body);

  const { prompt } = req.body;

  try {
    const input = {
      prompt: prompt,
      guidance: 3.5,
      output_format: 'png',
      aspect_ratio: '1:1', // Try different formats if needed, e.g., 'aspect-ratio': '1:1' or aspect: 'square'
    };

    console.log('Sending request to Replicate with input:', input);

    const output = await replicate.run('black-forest-labs/flux-dev', { input });

    console.log('Received response from Replicate');
    console.log('Output:', output);

    const imageUrl = output[0];

    console.log('Generated image URL:', imageUrl);

    // Fetch the generated image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    // Get metadata of the original image
    const originalMetadata = await sharp(imageResponse.data).metadata();
    console.log('Original image dimensions:', originalMetadata.width, originalMetadata.height);

    console.log('Resizing image to 1080x1080');

    // Resize the image to 1080x1080 pixels using Sharp
    const resizedImageBuffer = await sharp(imageResponse.data)
      .resize(1080, 1080, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toBuffer();

    // Get metadata of the resized image
    const resizedMetadata = await sharp(resizedImageBuffer).metadata();
    console.log('Resized image dimensions:', resizedMetadata.width, resizedMetadata.height);

    // Convert the buffer to a base64 data URL
    const base64Image = `data:image/png;base64,${resizedImageBuffer.toString('base64')}`;

    console.log('Image resized and converted to base64');

    // Send the base64 data URL to the client
    res.status(200).json({ imageUrl: base64Image });
  } catch (error) {
    console.error('Error generating or resizing ad image:', error.response ? error.response.data : error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({
      error: 'Failed to generate or resize ad image',
      details: error.message,
      stack: error.stack
    });
  }
}