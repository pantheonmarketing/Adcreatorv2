import React, { useState, useEffect } from 'react';
import { fonts } from '../fonts';

const EditTextModal = ({ generatedAd, onClose, onSave }) => {
  const [editedAd, setEditedAd] = useState({
    ...generatedAd,
    topPadding: generatedAd.topPadding || 10,
    bottomPadding: generatedAd.bottomPadding || 10,
    backgroundOverlay: generatedAd.backgroundOverlay || 0,
    exportSize: generatedAd.exportSize || { width: 1080, height: 1080 },
    imageSize: generatedAd.imageSize || 100,
    imagePositionX: generatedAd.imagePositionX || 50,
    imagePositionY: generatedAd.imagePositionY || 50,
    topAutoBreak: generatedAd.topAutoBreak !== undefined ? generatedAd.topAutoBreak : true,
    bottomAutoBreak: generatedAd.bottomAutoBreak !== undefined ? generatedAd.bottomAutoBreak : true,
  });

  const [activeTab, setActiveTab] = useState('top');
  const [matchTopBottom, setMatchTopBottom] = useState(false);

  const handleMatchTopBottom = (checked) => {
    setMatchTopBottom(checked);
    if (checked) {
      const newEditedAd = {
        ...editedAd,
        bottomFont: editedAd.topFont,
        bottomFontSize: editedAd.topFontSize,
        bottomTextColor: editedAd.topTextColor,
        bottomTextCase: editedAd.topTextCase,
        bottomTextAlignment: editedAd.topTextAlignment,
        bottomTextOutline: editedAd.topTextOutline,
        bottomPadding: editedAd.topPadding,
      };
      setEditedAd(newEditedAd);
    }
  };

  const handleChange = (field, value) => {
    setEditedAd(prev => {
      const newState = { ...prev, [field]: value };
      if (matchTopBottom && field.startsWith('top') && !field.includes('Padding')) {
        const bottomField = field.replace('top', 'bottom');
        newState[bottomField] = value;
      }
      return newState;
    });
  };

  const handleSliderChange = (field, value) => {
    const numValue = parseInt(value, 10);
    handleChange(field, numValue);
  };

  const fontOptions = Object.keys(fonts);
  const textCaseOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'uppercase', label: 'ALL CAPS' },
    { value: 'lowercase', label: 'all lowercase' },
    { value: 'capitalize', label: 'Capitalize Each Word' },
  ];
  const alignmentOptions = ['left', 'center', 'right'];
  const exportSizes = [
    { name: 'Square', width: 1080, height: 1080 },
    { name: 'Landscape', width: 1200, height: 628 },
    { name: 'Portrait', width: 1080, height: 1350 },
  ];

  const popularColors = [
    { name: 'Red', value: '#D94C52' },
    { name: 'Blue', value: '#264283' },
    { name: 'Gray Blue', value: '#627792' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Yellow', value: '#FFC300' },
    { name: 'Green', value: '#00A86B' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Purple', value: '#8E44AD' },
  ];

  const TextOptions = ({ position }) => {
    const [localText, setLocalText] = useState(editedAd[`${position}Text`]);

    useEffect(() => {
      setLocalText(editedAd[`${position}Text`]);
    }, [position]);

    const handleTextChange = (e) => {
      const newValue = e.target.value;
      setLocalText(newValue);

      // Debounce the update to the main state
      clearTimeout(window.textUpdateTimeout);
      window.textUpdateTimeout = setTimeout(() => {
        handleChange(`${position}Text`, newValue);
      }, 300); // 300ms delay
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{position} Text</label>
          <input
            type="text"
            value={localText}
            onChange={handleTextChange}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Font</label>
            <select
              value={editedAd[`${position}Font`] || 'Roboto'}
              onChange={(e) => handleChange(`${position}Font`, e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleChange(`${position}TextColor`, color.value)}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <input
              type="color"
              value={editedAd[`${position}TextColor`] || '#000000'}
              onChange={(e) => handleChange(`${position}TextColor`, e.target.value)}
              className="w-full h-8"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Font Size</label>
            <input
              type="range"
              min="10"
              max="80"
              value={editedAd[`${position}FontSize`] || 20}
              onChange={(e) => handleSliderChange(`${position}FontSize`, e.target.value)}
              className="w-full"
            />
            <span>{editedAd[`${position}FontSize`] || 20}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Padding</label>
            <input
              type="range"
              min={position === 'bottom' ? -100 : 0}
              max="100"
              value={editedAd[`${position}Padding`] || 10}
              onChange={(e) => handleSliderChange(`${position}Padding`, e.target.value)}
              className="w-full"
            />
            <span>{editedAd[`${position}Padding`] || 10}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Text Case</label>
            <select
              value={editedAd[`${position}TextCase`] || 'normal'}
              onChange={(e) => handleChange(`${position}TextCase`, e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {textCaseOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alignment</label>
            <div className="flex justify-between">
              {alignmentOptions.map((align) => (
                <button
                  key={align}
                  onClick={() => handleChange(`${position}TextAlignment`, align)}
                  className={`px-2 py-1 rounded ${editedAd[`${position}TextAlignment`] === align ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={editedAd[`${position}TextOutline`] || false}
              onChange={(e) => handleChange(`${position}TextOutline`, e.target.checked)}
            />
            <span className="text-sm font-medium">Text Outline</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={editedAd[`${position}AutoBreak`]}
              onChange={(e) => handleChange(`${position}AutoBreak`, e.target.checked)}
            />
            <span className="text-sm font-medium">Auto Line Break</span>
          </label>
        </div>
      </div>
    );
  };

  const ImageControls = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Image Size</label>
        <input
          type="range"
          min="50"
          max="150"
          value={editedAd.imageSize || 100}
          onChange={(e) => handleSliderChange('imageSize', e.target.value)}
          className="w-full"
        />
        <span>{editedAd.imageSize || 100}%</span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Image Position X</label>
        <input
          type="range"
          min="0"
          max="100"
          value={editedAd.imagePositionX || 50}
          onChange={(e) => handleSliderChange('imagePositionX', e.target.value)}
          className="w-full"
        />
        <span>{editedAd.imagePositionX || 50}%</span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Image Position Y</label>
        <input
          type="range"
          min="0"
          max="100"
          value={editedAd.imagePositionY || 50}
          onChange={(e) => handleSliderChange('imagePositionY', e.target.value)}
          className="w-full"
        />
        <span>{editedAd.imagePositionY || 50}%</span>
      </div>
    </div>
  );

  const ExportSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Background Overlay</label>
        <input
          type="range"
          min="0"
          max="100"
          value={editedAd.backgroundOverlay || 0}
          onChange={(e) => handleChange('backgroundOverlay', parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Export Size</label>
        <select 
          className="w-full border rounded px-2 py-1 text-sm"
          value={JSON.stringify(editedAd.exportSize)}
          onChange={(e) => handleChange('exportSize', JSON.parse(e.target.value))}
        >
          {exportSizes.map(size => (
            <option key={size.name} value={JSON.stringify({width: size.width, height: size.height})}>
              {size.name} ({size.width}x{size.height})
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="bg-white w-96 h-screen overflow-y-auto p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Edit Image Text</h2>
      <div className="mb-4 flex border-b">
        <button
          className={`py-2 px-4 ${activeTab === 'top' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          Top Text
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'bottom' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('bottom')}
        >
          Bottom Text
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'image' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          Image
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'export' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export Settings
        </button>
      </div>
      
      {(activeTab === 'top' || activeTab === 'bottom') && (
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={matchTopBottom}
              onChange={(e) => handleMatchTopBottom(e.target.checked)}
            />
            <span className="text-sm font-medium">Match Top & Bottom Text</span>
          </label>
        </div>
      )}
      
      {activeTab === 'top' && <TextOptions position="top" />}
      {activeTab === 'bottom' && <TextOptions position="bottom" />}
      {activeTab === 'image' && <ImageControls />}
      {activeTab === 'export' && <ExportSettings />}
      
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="bg-gray-500 text-white py-1 px-3 rounded text-sm mr-2"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editedAd)}
          className="bg-blue-500 text-white py-1 px-3 rounded text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default EditTextModal;