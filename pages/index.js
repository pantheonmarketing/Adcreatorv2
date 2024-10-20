import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oval } from 'react-loader-spinner';
// Import the AdEditorComponent
import { AdEditorComponent } from '../components/ad-editor';
import AdEditor from '../components/AdEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import Image from 'next/image';
import AdGenerationLoadingScreen from '../components/AdGenerationLoadingScreen';
import cleanAndReformatAdCopy from '../utils/adComplianceCleaner';

export default function FacebookAdCreator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adDetails, setAdDetails] = useState({
    avatar: '',
    desiredOutcome: '',
    ineffectiveMethod1: '',
    ineffectiveMethod2: '',
    ineffectiveMethod3: '',
    newSolution: '',
    keywords: '',
    imageStyle: '',
  });
  const [generatedAd, setGeneratedAd] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false); // State to control the editor visibility
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [editedAd, setEditedAd] = useState(null);
  const [activeVariation, setActiveVariation] = useState('variation1');

  // Add this new state to keep track of the current example
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  const exampleData = [
    {
      avatar: 'Busy professionals struggling with time management',
      desiredOutcome: 'Increased productivity and better work-life balance',
      ineffectiveMethod1: 'Using traditional to-do lists',
      ineffectiveMethod2: 'Trying various productivity apps',
      ineffectiveMethod3: 'Attending time management seminars',
      newSolution: 'TimeWise AI Assistant',
      keywords: 'AI-powered smartwatch, productivity charts, happy professional',
      imageStyle: 'realistic',
    },
    {
      avatar: 'UK moms looking to earn money from home',
      desiredOutcome: 'Flexible work-from-home career as a virtual assistant',
      ineffectiveMethod1: 'Searching for part-time jobs',
      ineffectiveMethod2: 'Trying multi-level marketing schemes',
      ineffectiveMethod3: 'Taking online surveys for small payouts',
      newSolution: 'MomVA Academy',
      keywords: 'Woman working on laptop, happy family, home office setup',
      imageStyle: 'realistic',
    },
    {
      avatar: 'Men struggling to save their marriage',
      desiredOutcome: 'Rekindled romance and stronger relationship with spouse',
      ineffectiveMethod1: 'Couples therapy sessions',
      ineffectiveMethod2: 'Reading self-help books on relationships',
      ineffectiveMethod3: 'Taking separate vacations',
      newSolution: 'MarriageMender Program',
      keywords: 'Happy couple, romantic dinner, holding hands',
      imageStyle: 'realistic',
    },
    {
      avatar: 'Dads wanting to become wealthy and provide better for their family',
      desiredOutcome: 'Financial freedom and ability to spend more time with family',
      ineffectiveMethod1: 'Working overtime at current job',
      ineffectiveMethod2: 'Trying to start a side hustle without guidance',
      ineffectiveMethod3: 'Investing in get-rich-quick schemes',
      newSolution: 'DadPreneur Wealth System',
      keywords: 'Successful dad with family, luxury home, financial charts',
      imageStyle: 'realistic',
    },
  ];

  const imageStyles = [
    { value: 'sketch', label: 'Sketch Style', image: '/styles/sketch.png' },
    { value: 'animated', label: 'Animated Style', image: '/styles/animated.png' },
    { value: 'realistic', label: 'Realistic Style', image: '/styles/realistic.png' },
    { value: 'minimalist', label: 'Minimalist Style', image: '/styles/minimalist.png' },
    { value: 'vintage', label: 'Vintage Style', image: '/styles/vintage.png' },
    { value: 'futuristic', label: 'Futuristic Style', image: '/styles/futuristic.png' },
    { value: 'abstract', label: 'Abstract Style', image: '/styles/abstract.png' },
    { value: 'popart', label: 'Pop Art Style', image: '/styles/popart.png' },
    { value: 'cartoon', label: 'Cartoon Style', image: '/styles/cartoon.png' },
  ];


  const stylePrompts = {
    sketch: 'Realistic hand-drawn sketch of {keywords}, in grayscale with soft lines and gentle shading. Monochrome illustration with fine lines, minimal background, and a focus on natural expressions and body language.',
    animated: 'Animated illustration of {keywords}, in a vibrant and colorful style, suitable for an engaging cartoon.',
    realistic: 'High-resolution realistic image of {keywords}, captured with natural lighting and detailed textures.',
    minimalist: 'Minimalist depiction of {keywords}, using flat colors and simple shapes on a white background.',
    vintage: 'Vintage-style poster featuring {keywords}, with muted colors and retro typography.',
    futuristic: 'Futuristic depiction of {keywords}, with neon accents and abstract geometric shapes.',
    abstract: 'Abstract painting inspired by {keywords}, using bold brushstrokes and vibrant colors.',
    popart: 'Pop art illustration of {keywords}, with bold outlines and vibrant colors.',
    cartoon: 'Colorful cartoon drawing of {keywords}, with expressive characters and dynamic poses.',
  };

  const [isGeneratingAd, setIsGeneratingAd] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdDetails((prev) => ({ ...prev, [name]: value }));
  };

  const fillExampleData = () => {
    const example = exampleData[currentExampleIndex];
    setAdDetails(prevDetails => ({
      ...prevDetails,
      ...example,
      keywords: prevDetails.imageStyle === 'upload' ? '' : example.keywords,
    }));
    
    // Move to the next example, wrapping around to the beginning if necessary
    setCurrentExampleIndex((prevIndex) => (prevIndex + 1) % exampleData.length);
  };

  const generateAd = async () => {
    if (!adDetails.imageStyle) {
      toast.error('Please select an image style or upload your own image.');
      return;
    }

    setIsGeneratingAd(true);

    try {
      const scriptResponse = await axios.post('/api/generateAdScript', {
        avatar: adDetails.avatar,
        desiredOutcome: adDetails.desiredOutcome,
        ineffectiveMethod1: adDetails.ineffectiveMethod1,
        ineffectiveMethod2: adDetails.ineffectiveMethod2,
        ineffectiveMethod3: adDetails.ineffectiveMethod3,
        newSolution: adDetails.newSolution,
      });

      const { variation1, variation2 } = scriptResponse.data;

      let imageUrl;
      if (adDetails.imageStyle === 'upload') {
        if (!uploadedImage) {
          toast.error('Please upload an image.');
          return;
        }
        imageUrl = uploadedImage;
      } else {
        const selectedStylePrompt = stylePrompts[adDetails.imageStyle] || '{keywords}';
        const imagePrompt = selectedStylePrompt.replace('{keywords}', adDetails.keywords);
        const imageResponse = await axios.post('/api/generateAdImage', {
          prompt: imagePrompt,
        });
        imageUrl = imageResponse.data.imageUrl;
      }

      const memeTextResponse = await axios.post('/api/generateMemeText', {
        avatar: adDetails.avatar,
        desiredOutcome: adDetails.desiredOutcome,
        ineffectiveMethod1: adDetails.ineffectiveMethod1,
        ineffectiveMethod2: adDetails.ineffectiveMethod2,
        ineffectiveMethod3: adDetails.ineffectiveMethod3,
        newSolution: adDetails.newSolution,
      });

      // Apply initial AI edit
      const initialAd = {
        adScript: { variation1, variation2 },
        imageUrl: imageUrl,
        topText: memeTextResponse.data.topText.toUpperCase(),
        bottomText: memeTextResponse.data.bottomText.toUpperCase(),
        topFont: 'Impact',
        bottomFont: 'Impact',
        topFontSize: 60,
        bottomFontSize: 60,
        topTextColor: '#8B0000',
        bottomTextColor: '#00008B',
        topTextCase: 'uppercase',
        bottomTextCase: 'uppercase',
        topTextAlignment: 'center',
        bottomTextAlignment: 'center',
        topTextOutline: false,
        bottomTextOutline: false,
        imageSize: 100,
        imagePositionX: 50,
        imagePositionY: 50,
        backgroundOverlay: 0,
        exportSize: { width: 1080, height: 1080 },
      };

      setGeneratedAd(initialAd);
      toast.success('Ad generated successfully!');
    } catch (error) {
      console.error('Error generating ad:', error.response ? error.response.data : error.message);
      toast.error('Failed to generate ad. Please try again.');
    } finally {
      setIsGeneratingAd(false);
    }
  };

  const handleCopyAdScript = (variation) => {
    if (generatedAd && generatedAd.adScript[variation]) {
      const scriptText = Object.values(generatedAd.adScript[variation]).join('\n');
      navigator.clipboard
        .writeText(scriptText)
        .then(() => {
          toast.success(`Ad script (Variation ${variation === 'variation1' ? '1' : '2'}) copied to clipboard!`);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          toast.error('Failed to copy the ad script.');
        });
    }
  };

  const handleDownloadImage = (dataUrl) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'facebook_ad_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully!');
  };

  const handleImageUpload = useCallback((file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const fileType = file.type || file.mime; // Add this line to check both type and mime

      if (!allowedTypes.includes(fileType)) {
        toast.error('Only JPG, PNG, and GIF files are allowed');
        return;
      }

      setIsUploading(true);
      toast.info('Uploading image...', { autoClose: false });
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        setAdDetails((prev) => ({ 
          ...prev, 
          imageStyle: 'upload',
          keywords: '' // Clear keywords when uploading an image
        }));
        setIsUploading(false);
        toast.dismiss();
        toast.success('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setAdDetails((prev) => ({ ...prev, imageStyle: '' }));
  };

  const handleStyleClick = useCallback((style) => {
    setAdDetails((prev) => ({ 
      ...prev, 
      imageStyle: style.value,
      keywords: prev.imageStyle === 'upload' ? '' : prev.keywords // Restore keywords if switching from upload to AI style
    }));
    setUploadedImage(null);
  }, []);

  // Remove or comment out these unused functions
  // const handleSaveStyle = (style) => {
  //   setSavedStyle(style);
  //   localStorage.setItem('savedAdStyle', JSON.stringify(style));
  //   toast.success('Style saved successfully!');
  // };

  // const handleLoadDefaultStyle = () => {
  //   if (savedStyle) {
  //     setPreviewAd((prevAd) => ({
  //       ...prevAd,
  //       topFont: savedStyle.topFont,
  //       bottomFont: savedStyle.bottomFont,
  //       topFontSize: savedStyle.topFontSize,
  //       bottomFontSize: savedStyle.bottomFontSize,
  //       topTextColor: savedStyle.topTextColor,
  //       bottomTextColor: savedStyle.bottomTextColor,
  //     }));
  //     toast.success('Default style loaded!');
  //   } else {
  //     toast.error('No saved style found. Save a style first.');
  //   }
  // };

  // If you need these functions in the future, you can keep them commented out

  const handleEditorUpdate = (updatedAd) => {
    console.log('handleEditorUpdate called with:', updatedAd);
    setEditedAd(updatedAd);
    // Immediately apply the changes to the generated ad
    setGeneratedAd(updatedAd);
  };

  const handleSaveEdits = () => {
    console.log('handleSaveEdits called');
    setGeneratedAd(editedAd);
    closeEditor();
  };

  // Function to open the Ad Editor
  const openEditor = () => {
    console.log('openEditor called');
    setEditedAd(generatedAd);
    setIsEditorOpen(true);
  };

  // Function to close the Ad Editor
  const closeEditor = () => {
    console.log('closeEditor called');
    setIsEditorOpen(false);
    setEditedAd(null);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'Ghost' && password === 'brand102030') {
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } else {
      toast.error('Invalid username or password');
    }
  };

  const handleLoadAvatar = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const { additionalDetails } = json;
          
          console.log("Original data:", additionalDetails);

          // Show toast notification for compliance check
          toast.info("Running text through Facebook Ad compliance...", { autoClose: false });

          // Clean and reformat the ad copy
          const cleanedAdCopy = await cleanAndReformatAdCopy(additionalDetails);

          console.log("Cleaned data:", cleanedAdCopy);

          // Update the ad details with cleaned data
          setAdDetails({
            avatar: cleanedAdCopy.avatarAndProblem,
            desiredOutcome: cleanedAdCopy.desiredOutcome,
            ineffectiveMethod1: cleanedAdCopy.ineffectiveMethod1,
            ineffectiveMethod2: cleanedAdCopy.ineffectiveMethod2,
            ineffectiveMethod3: cleanedAdCopy.ineffectiveMethod3,
            newSolution: cleanedAdCopy.newSolutionName,
            keywords: cleanedAdCopy.imageGenerationKeywords,
          });

          // Dismiss the compliance check toast
          toast.dismiss();

          // Show success toast
          toast.success('Avatar loaded and cleaned for compliance!');
        } catch (error) {
          console.error('Error parsing JSON:', error);
          toast.error('Failed to load avatar. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }, [setAdDetails]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />

      <h1 className="text-2xl font-bold mb-4">Facebook Ad Creator</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Ad Details</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="avatar" className="block font-medium">
                Your Specific Avatar And Their Problem
              </label>
              <input
                id="avatar"
                name="avatar"
                value={adDetails.avatar}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="desiredOutcome" className="block font-medium">
                Your Avatar's Desired Outcome
              </label>
              <input
                id="desiredOutcome"
                name="desiredOutcome"
                value={adDetails.desiredOutcome}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="ineffectiveMethod1" className="block font-medium">
                1st Common But Ineffective Method They Might Have Tried To Fix Their Problem
              </label>
              <input
                id="ineffectiveMethod1"
                name="ineffectiveMethod1"
                value={adDetails.ineffectiveMethod1}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="ineffectiveMethod2" className="block font-medium">
                2nd Common But Ineffective Method They Might Have Tried To Fix Their Problem
              </label>
              <input
                id="ineffectiveMethod2"
                name="ineffectiveMethod2"
                value={adDetails.ineffectiveMethod2}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="ineffectiveMethod3" className="block font-medium">
                3rd Common But Ineffective Method They Might Have Tried To Fix Their Problem
              </label>
              <input
                id="ineffectiveMethod3"
                name="ineffectiveMethod3"
                value={adDetails.ineffectiveMethod3}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="newSolution" className="block font-medium">
                The Name Of Your New Solution
              </label>
              <input
                id="newSolution"
                name="newSolution"
                value={adDetails.newSolution}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="keywords" className="block font-medium">
                Keywords for Image Generation
              </label>
              <textarea
                id="keywords"
                name="keywords"
                value={adDetails.keywords}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded p-2 ${
                  adDetails.imageStyle === 'upload' ? 'bg-gray-100' : ''
                }`}
                disabled={adDetails.imageStyle === 'upload'}
                placeholder={adDetails.imageStyle === 'upload' ? 'Not applicable for uploaded images' : 'Enter keywords for AI-generated images'}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={fillExampleData}
                className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 mb-2"
              >
                Fill with Example Data
              </button>
              <label className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded cursor-pointer text-center block">
                Load Avatar
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoadAvatar}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="block font-medium mb-2">Select Image Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {imageStyles.map((style) => (
                  <div
                    key={style.value}
                    className={`relative border rounded p-2 cursor-pointer hover:shadow-lg ${
                      adDetails.imageStyle === style.value ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => handleStyleClick(style)}
                  >
                    <Image
                      src={style.image}
                      alt={style.label}
                      width={100}
                      height={64}
                      layout="responsive"
                      objectFit="cover"
                    />
                    <p className="text-center text-xs">{style.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <p className="mb-2">Drag and drop an image here, or click to select a file</p>
              <p className="text-sm text-gray-500">Supported formats: JPG, PNG, GIF (max 5MB)</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Select File
              </button>
            </div>
            {uploadedImage && (
              <div className="mt-4">
                <Image
                  src={uploadedImage}
                  alt="Uploaded"
                  width={500}
                  height={300}
                  layout="responsive"
                />
                <button
                  type="button"
                  onClick={removeUploadedImage}
                  className="bg-red-500 text-white py-1 px-2 rounded text-sm"
                >
                  Remove Image
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={generateAd}
              className="w-full bg-blue-500 text-white py-3 rounded text-lg flex items-center justify-center"
              disabled={isUploading}
            >
              {isGeneratingAd ? (
                <>
                  <Oval
                    height={20}
                    width={20}
                    color="white"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel='oval-loading'
                    secondaryColor="lightblue"
                    strokeWidth={4}
                    strokeWidthSecondary={4}
                  />
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                'Generate Ad'
              )}
            </button>
          </form>
        </div>

        {generatedAd && (
          <div className="p-4 border rounded relative">
            <h2 className="text-xl font-semibold mb-4">Generated Ad</h2>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Ad Script:</h3>
              <Tabs value={activeVariation} onValueChange={setActiveVariation}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="variation1">Variation 1</TabsTrigger>
                  <TabsTrigger value="variation2">Variation 2</TabsTrigger>
                </TabsList>
                <TabsContent value="variation1" className="mt-4">
                  <div className="bg-gray-100 p-4 rounded-lg relative">
                    <Button
                      onClick={() => handleCopyAdScript('variation1')}
                      className="absolute top-0 right-0 -mt-2 -mr-2"
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <pre className="whitespace-pre-wrap text-sm mt-6">
                      {Object.entries(generatedAd.adScript.variation1).map(([key, value]) => (
                        <div key={key}>{value}</div>
                      ))}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="variation2" className="mt-4">
                  <div className="bg-gray-100 p-4 rounded-lg relative">
                    <Button
                      onClick={() => handleCopyAdScript('variation2')}
                      className="absolute top-0 right-0 -mt-2 -mr-2"
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <pre className="whitespace-pre-wrap text-sm mt-6">
                      {Object.entries(generatedAd.adScript.variation2).map(([key, value]) => (
                        <div key={key}>{value}</div>
                      ))}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Generated Ad Image:</h3>
              <div className="relative">
                <AdEditor
                  generatedAd={editedAd || generatedAd}
                  onDownload={handleDownloadImage}
                  onUpdate={handleEditorUpdate}
                />
                <button
                  onClick={openEditor}
                  className="mt-4 w-full bg-blue-500 text-white py-3 rounded text-lg"
                >
                  Edit Image & Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeEditor}
              className="float-right text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
            <h2 className="text-xl font-semibold mb-4">Edit Ad</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <AdEditor
                  generatedAd={editedAd || generatedAd}
                  onDownload={handleDownloadImage}
                  onUpdate={handleEditorUpdate}
                />
              </div>
              <div>
                <AdEditorComponent
                  generatedAd={editedAd || generatedAd}
                  onUpdate={handleEditorUpdate}
                  onSave={handleSaveEdits}
                  onCancel={closeEditor}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isGeneratingAd && <AdGenerationLoadingScreen />}
    </div>
  );
}
