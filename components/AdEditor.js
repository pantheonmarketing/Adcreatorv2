import React, { useState, useRef, useEffect, useCallback } from 'react';

const AdEditor = ({ generatedAd, onDownload }) => {
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const width = generatedAd.exportSize?.width || 1080;
    const height = generatedAd.exportSize?.height || 1080;

    canvas.width = width;
    canvas.height = height;

    // Fill the entire canvas with white (or any default color)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const img = new Image();
    img.onload = () => {
      let imgWidth, imgHeight, imgX, imgY;

      if (generatedAd.hideTextAreas) {
        // If text areas are hidden, make the image cover the entire canvas
        const scale = Math.max(width / img.width, height / img.height);
        imgWidth = img.width * scale;
        imgHeight = img.height * scale;
        imgX = (width - imgWidth) / 2;
        imgY = (height - imgHeight) / 2;
      } else {
        // Calculate image dimensions and position as before
        const imageSize = (generatedAd.imageSize || 100) * 0.75;
        const scale = imageSize / 100;
        imgWidth = img.width * scale;
        imgHeight = img.height * scale;
        const aspectRatio = img.width / img.height;

        if (imgWidth > width) {
          imgWidth = width;
          imgHeight = imgWidth / aspectRatio;
        }
        if (imgHeight > height) {
          imgHeight = height;
          imgWidth = imgHeight * aspectRatio;
        }

        const imagePositionX = generatedAd.imagePositionX || 50;
        const imagePositionY = generatedAd.imagePositionY || 50;
        imgX = (width - imgWidth) * (imagePositionX / 100);
        imgY = (height - imgHeight) * (imagePositionY / 100);
      }

      // Draw the image
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

      // Apply background overlay only to the image
      if (generatedAd.backgroundOverlay) {
        ctx.fillStyle = `rgba(0, 0, 0, ${generatedAd.backgroundOverlay / 100})`;
        ctx.fillRect(imgX, imgY, imgWidth, imgHeight);
      }

      const drawTextFunction = (ctx, text, position, width, height, adToUse) => {
        const fontName = adToUse[`${position}Font`] || 'Impact';
        let fontSize = adToUse[`${position}FontSize`] || 40;
        const textColor = adToUse[`${position}TextColor`] || '#000';
        const textAlignment = adToUse[`${position}TextAlignment`] || 'center';
        const padding = adToUse[`${position}Padding`] || 10;

        const textCase = adToUse[`${position}TextCase`] || 'uppercase';
        const processedText = applyTextCase(text || '', textCase);

        let x;
        if (textAlignment === 'left') {
          x = padding;
        } else if (textAlignment === 'right') {
          x = width - padding;
        } else {
          x = width / 2;
        }

        const canvHeight = height * 0.15;
        let y;
        if (position === 'top') {
          y = canvHeight / 2 + fontSize / 2; // Center text vertically in top canv area
        } else {
          y = height - canvHeight / 2 + fontSize / 2; // Center text vertically in bottom canv area
        }

        // Function to check if text fits
        const textFits = (text, fontSize) => {
          ctx.font = `${fontSize}px ${fontName}`;
          return ctx.measureText(text).width <= width - padding * 2;
        };

        // Reduce font size if text is too long
        while (!textFits(processedText, fontSize) && fontSize > 20) {
          fontSize -= 2;
        }

        ctx.font = `${fontSize}px ${fontName}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = textAlignment;

        if (adToUse[`${position}TextOutline`]) {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
        }

        // Split text into two lines if it's still too long
        if (!textFits(processedText, fontSize)) {
          const words = processedText.split(' ');
          let line1 = '';
          let line2 = '';
          for (let i = 0; i < words.length; i++) {
            if (ctx.measureText(line1 + words[i]).width <= width - padding * 2) {
              line1 += words[i] + ' ';
            } else {
              line2 = words.slice(i).join(' ');
              break;
            }
          }

          // Draw first line
          if (adToUse[`${position}TextOutline`]) {
            ctx.strokeText(line1.trim(), x, y);
          }
          ctx.fillText(line1.trim(), x, y);

          // Draw second line
          const lineHeight = fontSize * 1.2;
          y += position === 'top' ? lineHeight : -lineHeight;
          if (adToUse[`${position}TextOutline`]) {
            ctx.strokeText(line2.trim(), x, y);
          }
          ctx.fillText(line2.trim(), x, y);
        } else {
          // Draw single line
          if (adToUse[`${position}TextOutline`]) {
            ctx.strokeText(processedText, x, y);
          }
          ctx.fillText(processedText, x, y);
        }
      };

      if (!generatedAd.hideTextAreas) {
        drawTextFunction(ctx, generatedAd.topText, 'top', width, height, generatedAd);
        drawTextFunction(ctx, generatedAd.bottomText, 'bottom', width, height, generatedAd);
      }

      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Error loading image:', generatedAd.imageUrl);
    };
    img.src = generatedAd.imageUrl;
  }, [generatedAd]);

  useEffect(() => {
    if (generatedAd && generatedAd.imageUrl) {
      drawCanvas();
    }
  }, [generatedAd, drawCanvas]);

  const applyTextCase = (text, textCase) => {
    switch (textCase) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.replace(/\b\w/g, char => char.toUpperCase());
      default:
        return text;
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onDownload(dataUrl);
    }
  };

  const handleDownloadHtml = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generated Ad</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #333; }
            h2 { color: #666; }
            img { max-width: 100%; height: auto; }
            pre { background-color: #f4f4f4; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Generated Ad</h1>
          <h2>Ad Image</h2>
          <img src="${dataUrl}" alt="Generated Ad Image" width="1080" height="1080">
          <h2>Ad Copy - Variation 1</h2>
          <pre>${generatedAd.adScript.variation1}</pre>
          <h2>Ad Copy - Variation 2</h2>
          <pre>${generatedAd.adScript.variation2}</pre>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'generated_ad.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', display: imageLoaded ? 'block' : 'none' }}
      />
      {!imageLoaded && (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
          Loading image...
        </div>
      )}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleDownload}
          className="bg-green-500 text-white py-2 px-4 rounded"
        >
          Download Image
        </button>
        <button
          onClick={handleDownloadHtml}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Download Image + Text
        </button>
      </div>
    </div>
  );
};

export default AdEditor;