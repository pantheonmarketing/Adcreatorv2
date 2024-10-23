import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oval } from 'react-loader-spinner';
// Import the AdEditorComponent
import { AdEditorComponent } from '../components/ad-editor';
import AdEditor from '../components/AdEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from 'lucide-react';
import Image from 'next/image';
import AdGenerationLoadingScreen from '../components/AdGenerationLoadingScreen';
import cleanAndReformatAdCopy from '../utils/adComplianceCleaner';
// Add the ThemeToggle import at the top
import { ThemeToggle } from '../components/ThemeToggle';
import { useSession, signIn, signOut } from 'next-auth/react';
// Add this import at the top with your other imports
import UserProfile from '../components/UserProfile';

// Add this new component for the step indicator
const StepIndicator = ({ number, title, isActive }) => (
  <div className={`flex items-center justify-between ${isActive ? 'opacity-100' : 'opacity-50'}`}>
    <div className="flex items-center">
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full 
        ${isActive ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-300 dark:bg-gray-600'}
        text-white font-bold mr-2
      `}>
        {number}
      </div>
      <span className="text-lg font-medium text-gray-800 dark:text-white">{title}</span>
    </div>
    <svg 
      className="w-5 h-5 text-gray-500 transform transition-transform duration-200" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

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

  // Add these new state variables after your other useState declarations
  const [openSections, setOpenSections] = useState({
    step1: true,
    step2: false,
    step3: false
  });

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

  // Add this function to handle section visibility
  const handleStepCompletion = (step) => {
    if (step === 'step1' && adDetails.avatar !== '') {
      setOpenSections(prev => ({
        ...prev,
        step2: true
      }));
    } else if (step === 'step2' && (adDetails.imageStyle !== '' || uploadedImage !== null)) {
      setOpenSections(prev => ({
        ...prev,
        step3: true
      }));
    }
  };

  // Update handleInputChange to automatically open next section when fields are filled
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdDetails(prev => ({ ...prev, [name]: value }));
    
    // Check if all required fields in step 1 are filled
    if (name === 'avatar' || name === 'desiredOutcome' || name === 'newSolution') {
      const updatedDetails = { ...adDetails, [name]: value };
      if (updatedDetails.avatar && updatedDetails.desiredOutcome && updatedDetails.newSolution) {
        handleStepCompletion('step1');
      }
    }
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

  // Update handleStyleClick to automatically open step 3
  const handleStyleClick = useCallback((style) => {
    setAdDetails((prev) => ({ 
      ...prev, 
      imageStyle: style.value,
      keywords: prev.imageStyle === 'upload' ? '' : prev.keywords
    }));
    handleStepCompletion('step2');
  }, [handleStepCompletion]); // Add handleStepCompletion to the dependency array

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

  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
        <ThemeToggle />
        {/* Add UserProfile component here, right after ThemeToggle */}
        <UserProfile />
        <div className="container mx-auto p-4 max-w-6xl">
          <ToastContainer />

          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-2">
            AI Avatar Magic
          </h1>
          <p className="text-lg mt-1 text-gray-600 dark:text-gray-300 mb-8">
            Create your perfect Facebook ad in three simple steps
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Left Column - Input Section */}
            <div className="space-y-6">
              {/* Step 1: Fill Details */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div 
                  className="cursor-pointer"
                  onClick={() => setOpenSections(prev => ({ ...prev, step1: !prev.step1 }))}
                >
                  <StepIndicator number="1" title="Fill in your ad details" isActive={true} />
                </div>
                {openSections.step1 && (
                  <div className="mt-4 space-y-6">
                    {/* Buttons section */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={fillExampleData}
                        className="w-full bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white border border-gray-700/50 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 py-3 rounded-lg backdrop-blur-sm"
                      >
                        Fill with Example Data
                      </button>
                      
                      <label className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-[1px] rounded-lg cursor-pointer block group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/40">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-transparent hover:to-transparent text-white py-3 rounded-lg text-center transition-all duration-300 group-hover:scale-[0.99]">
                          Load Avatar
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleLoadAvatar}
                            className="hidden"
                          />
                        </div>
                      </label>
                    </div>

                    {/* Form inputs */}
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        Your Specific Avatar And Their Problem
                      </label>
                      <input
                        id="avatar"
                        name="avatar"
                        value={adDetails.avatar}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        Your Avatar's Desired Outcome
                      </label>
                      <input
                        id="desiredOutcome"
                        name="desiredOutcome"
                        value={adDetails.desiredOutcome}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        1st Common But Ineffective Method
                      </label>
                      <input
                        id="ineffectiveMethod1"
                        name="ineffectiveMethod1"
                        value={adDetails.ineffectiveMethod1}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        2nd Common But Ineffective Method
                      </label>
                      <input
                        id="ineffectiveMethod2"
                        name="ineffectiveMethod2"
                        value={adDetails.ineffectiveMethod2}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        3rd Common But Ineffective Method
                      </label>
                      <input
                        id="ineffectiveMethod3"
                        name="ineffectiveMethod3"
                        value={adDetails.ineffectiveMethod3}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        The Name Of Your New Solution
                      </label>
                      <input
                        id="newSolution"
                        name="newSolution"
                        value={adDetails.newSolution}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-200">
                        Keywords for Image Generation
                      </label>
                      <textarea
                        id="keywords"
                        name="keywords"
                        value={adDetails.keywords}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 ${
                          adDetails.imageStyle === 'upload' ? 'bg-gray-100 dark:bg-gray-600' : ''
                        }`}
                        disabled={adDetails.imageStyle === 'upload'}
                        placeholder={adDetails.imageStyle === 'upload' ? 'Not applicable for uploaded images' : 'Enter keywords for AI-generated images'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Choose Style */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div 
                  className="cursor-pointer"
                  onClick={() => setOpenSections(prev => ({ ...prev, step2: !prev.step2 }))}
                >
                  <StepIndicator 
                    number="2" 
                    title="Choose your image style or upload your own" 
                    isActive={adDetails.avatar !== ''} 
                  />
                </div>
                {openSections.step2 && (
                  <div className={`mt-4 ${adDetails.avatar === '' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {imageStyles.map((style) => (
                        <div
                          key={style.value}
                          className={`relative border rounded p-2 cursor-pointer hover:shadow-lg transition-all ${
                            adDetails.imageStyle === style.value ? 'border-purple-500 scale-105' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={() => handleStyleClick(style)}
                        >
                          <Image
                            src={style.image}
                            alt={style.label}
                            width={100}
                            height={64}
                            style={{ objectFit: 'cover' }}
                            className="rounded"
                          />
                          <p className="text-center text-sm mt-2 text-gray-700 dark:text-gray-300">{style.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center mb-4">
                      <span className="text-gray-500 dark:text-gray-400">- OR -</span>
                    </div>

                    {/* Drag and Drop Section */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center ${
                        isDragging 
                          ? 'border-purple-500 bg-purple-50 dark:bg-gray-700' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-2">
                        <p className="text-gray-700 dark:text-gray-300">Drag and drop your image here</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">or</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-6 rounded-md inline-flex items-center"
                        >
                          Choose File
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Supported formats: JPG, PNG, GIF (max 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>

                    {/* Uploaded Image Preview */}
                    {uploadedImage && (
                      <div className="mt-4">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded"
                          width={500}
                          height={300}
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                        <button
                          type="button"
                          onClick={removeUploadedImage}
                          className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-md text-sm"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Generate */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div 
                  className="cursor-pointer"
                  onClick={() => setOpenSections(prev => ({ ...prev, step3: !prev.step3 }))}
                >
                  <StepIndicator 
                    number="3" 
                    title="Generate your ad" 
                    isActive={adDetails.avatar !== '' && (adDetails.imageStyle !== '' || uploadedImage !== null)} 
                  />
                </div>
                {openSections.step3 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={generateAd}
                      disabled={!adDetails.avatar || (!adDetails.imageStyle && !uploadedImage) || isUploading}
                      className={`
                        w-full p-[1px] rounded-lg text-lg relative group transition-all duration-300
                        ${(!adDetails.avatar || (!adDetails.imageStyle && !uploadedImage) || isUploading)
                          ? 'bg-gray-700/50 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/40'}
                      `}
                    >
                      <div className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-transparent hover:to-transparent text-white py-3 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-[0.99]">
                        {isGeneratingAd ? (
                          <>
                            <Oval
                              height={24}
                              width={24}
                              color="white"
                              visible={true}
                              ariaLabel='oval-loading'
                              secondaryColor="lightblue"
                              strokeWidth={4}
                              strokeWidthSecondary={4}
                            />
                            <span className="ml-3">Generating...</span>
                          </>
                        ) : (
                          <span>Generate Ad</span>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Generated Ad Section */}
            <div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  {generatedAd ? 'Your Generated Ad' : 'Ad Preview'}
                </h2>
                
                {/* Facebook Ad Preview */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden mb-6 bg-white shadow-md">
                  {/* Ad Header - Profile Info */}
                  <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white">
                    <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {adDetails.newSolution || 'Your Business Name'}
                      </p>
                      <p className="text-xs text-gray-500">Sponsored · <span>🌐</span></p>
                    </div>
                  </div>

                  {/* Ad Copy */}
                  <div className="p-4 bg-white">
                    {generatedAd ? (
                      <Tabs value={activeVariation} onValueChange={setActiveVariation}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="variation1">Variation 1</TabsTrigger>
                          <TabsTrigger value="variation2">Variation 2</TabsTrigger>
                        </TabsList>
                        <TabsContent value="variation1">
                          <div className="text-gray-900 whitespace-pre-wrap">
                            {Object.entries(generatedAd.adScript.variation1).map(([key, value]) => (
                              <div key={key} className="mb-2">{value}</div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="variation2">
                          <div className="text-gray-900 whitespace-pre-wrap">
                            {Object.entries(generatedAd.adScript.variation2).map(([key, value]) => (
                              <div key={key} className="mb-2">{value}</div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="text-gray-900 space-y-3">
                        <p className="font-medium">📢 ATTENTION [Your Avatar]: Ready to transform your [current situation]?</p>
                        <p>Tired of struggling with [problem]? You're not alone...</p>
                        <p>Introducing [Your Solution] - the revolutionary approach that's helping people just like you achieve [desired outcome] without [pain point].</p>
                        <p>🔥 Limited Time Offer - Click Learn More below!</p>
                      </div>
                    )}
                  </div>

                  {/* Ad Image */}
                  <div className="relative bg-white">
                    {generatedAd ? (
                      <AdEditor
                        generatedAd={editedAd || generatedAd}
                        onDownload={handleDownloadImage}
                        onUpdate={handleEditorUpdate}
                      />
                    ) : (
                      <div className="aspect-video bg-gray-50 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="text-6xl mb-4">🎯</div>
                          <p className="text-gray-500">Your ad image will appear here</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Complete the steps on the left to generate your custom ad
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ad Footer - Call to Action */}
                  <div className="p-4 border-t border-gray-100 bg-white">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                      Learn More
                    </button>
                  </div>
                </div>

                {/* Action Buttons - Moved here */}
                {generatedAd && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCopyAdScript(activeVariation)}
                        className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Ad Text
                      </button>
                      <button
                        onClick={handleDownloadImage}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Download Image
                      </button>
                      <button
                        onClick={handleDownloadImage}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Download Image + Text
                      </button>
                    </div>

                    <button
                      onClick={openEditor}
                      className="w-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 hover:from-gray-800 hover:to-gray-950 dark:hover:from-gray-700 dark:hover:to-gray-900 text-white py-3 rounded-md text-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Edit Image & Text
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor Modal */}
          {isEditorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto"> {/* Changed max-w-3xl to max-w-5xl */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Ad</h2>
                  <button
                    onClick={closeEditor}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Left side - Ad Preview */}
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <AdEditor
                      generatedAd={editedAd || generatedAd}
                      onUpdate={handleEditorUpdate}
                    />
                  </div>

                  {/* Right side - Editor Controls */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <AdEditorComponent
                      generatedAd={editedAd || generatedAd}
                      onUpdate={handleEditorUpdate}
                      onSave={handleSaveEdits}
                      onCancel={closeEditor}
                    />
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <button
                    onClick={closeEditor}
                    className="flex-1 px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdits}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {isGeneratingAd && <AdGenerationLoadingScreen />}

          <footer className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI-powered avatar creation • Customizable profiles • Instant generation
            </p>
          </footer>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background.png"
            alt="Background"
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-800/95" />
        </div>

        {/* Login Card */}
        <div className="relative z-10 bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl text-white font-bold">G</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to Ghostbrand AI
            </h2>
            <p className="text-gray-400">
              Sign in to create stunning Facebook ads with AI
            </p>
          </div>

          <button
            onClick={() => signIn('google')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-[1px] rounded-lg cursor-pointer block group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/40"
          >
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-transparent hover:to-transparent text-white py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 group-hover:scale-[0.99]">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  style={{ fill: "#4285F4" }}
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  style={{ fill: "#34A853" }}
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  style={{ fill: "#FBBC05" }}
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  style={{ fill: "#EA4335" }}
                />
              </svg>
              Continue with Google
            </div>
          </button>

          <div className="text-center text-sm text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    );
  }
}
