'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlignLeft, AlignCenter, AlignRight, Wand2 } from 'lucide-react'
import { fonts } from '../fonts'
import { GeneratedAd } from './types' // Keep this import

// Custom debounce function
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedFunc = (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
  return debouncedFunc;
}

interface AdEditorComponentProps {
  generatedAd: GeneratedAd;
  onUpdate: (ad: GeneratedAd) => void;
  onSave: (ad: GeneratedAd) => void;
  onCancel: () => void;
}

export function AdEditorComponent({ generatedAd, onUpdate, onSave, onCancel }: AdEditorComponentProps) {
  console.log('AdEditorComponent rendered with props:', { generatedAd, onUpdate, onSave, onCancel });

  const [editedAd, setEditedAd] = useState<GeneratedAd>(generatedAd)
  const [matchTexts, setMatchTexts] = useState(false)

  // State to hold form input values
  const [formData, setFormData] = useState({
    avatar: '',
    desiredOutcome: '',
    ineffectiveMethod1: '',
    ineffectiveMethod2: '',
    ineffectiveMethod3: '',
    newSolution: '',
  });

  useEffect(() => {
    console.log('editedAd updated:', editedAd);
    onUpdate(editedAd)
  }, [editedAd, onUpdate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);

    try {
      const response = await fetch('/api/generateMemeText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),  // Send formData instead of { keywords: ... }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate ad');
      }

      const data = await response.json();
      console.log('Meme Text Data:', data);

      if (data.topText && data.bottomText) {
        setEditedAd(prev => ({
          ...prev,
          topText: data.topText,
          bottomText: data.bottomText,
        }));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (
    field: keyof GeneratedAd,
    value: string | number | boolean | { width: number; height: number },
    position: 'top' | 'bottom' | null = null
  ) => {
    console.log('handleChange called:', { field, value, position });
    setEditedAd((prev) => {
      const newState = { ...prev };
      if (position) {
        const key = `${position}${(field as string).charAt(0).toUpperCase() + (field as string).slice(1)}` as keyof GeneratedAd;
        newState[key] = value;
        if (matchTexts && (position === 'top' || position === 'bottom')) {
          const otherPosition = position === 'top' ? 'bottom' : 'top';
          const otherKey = `${otherPosition}${(field as string).charAt(0).toUpperCase() + (field as string).slice(1)}` as keyof GeneratedAd;
          newState[otherKey] = value;
        }
      } else {
        newState[field] = value;
      }
      return newState;
    });
  };

  const handleMatchTextsChange = (checked: boolean) => {
    console.log('handleMatchTextsChange called:', checked);
    setMatchTexts(checked)
    if (checked) {
      setEditedAd(prev => ({
        ...prev,
        bottomFont: prev.topFont,
        bottomFontSize: prev.topFontSize,
        bottomTextColor: prev.topTextColor,
        bottomTextCase: prev.topTextCase,
        bottomTextAlignment: prev.topTextAlignment,
        bottomTextOutline: prev.topTextOutline,
        bottomAutoBreak: prev.topAutoBreak,
      }))
    }
  }

  const applyAIDesign = () => {
    console.log('Applying AI Design');
    const updatedAd = { ...editedAd };
    const canvasWidth = updatedAd.exportSize.width;

    // Apply AI design logic here
    updatedAd.topFont = 'Impact';
    updatedAd.bottomFont = 'Impact';
    updatedAd.topFontSize = Math.min(canvasWidth * 0.08, 80);
    updatedAd.bottomFontSize = Math.min(canvasWidth * 0.08, 80);
    updatedAd.topTextColor = '#8B0000'; // Dark red
    updatedAd.bottomTextColor = '#00008B'; // Dark blue
    updatedAd.topTextCase = 'uppercase';
    updatedAd.bottomTextCase = 'uppercase';
    updatedAd.topTextAlignment = 'center';
    updatedAd.bottomTextAlignment = 'center';
    updatedAd.topTextOutline = false;
    updatedAd.bottomTextOutline = false;
    updatedAd.topAutoBreak = true;
    updatedAd.bottomAutoBreak = true;
    updatedAd.imageSize = 80;
    updatedAd.imagePositionX = 50;
    updatedAd.imagePositionY = 50;
    updatedAd.backgroundOverlay = 20;

    setEditedAd(updatedAd);
    onUpdate(updatedAd);
  }

  const TextEditor = ({ position }: { position: 'top' | 'bottom' }) => {
    const [localText, setLocalText] = useState(editedAd[`${position}Text`]);

    const positionText = editedAd[`${position}Text`];

    useEffect(() => {
      setLocalText(positionText);
    }, [position, positionText]);
    const debouncedHandleChange = useMemo(
      () => debounce((...args: unknown[]) => {
        const value = args[0] as string;
        handleChange('Text' as keyof GeneratedAd, value, position);
      }, 300),
      [position] // Remove handleChange from here
    );

    useEffect(() => {
      // No need for cleanup in this case
    }, [debouncedHandleChange]);

    const handleLocalTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalText(newValue);
      debouncedHandleChange(newValue);
    };

    return (
      <div className="space-y-4">
        <Input
          value={localText}
          onChange={handleLocalTextChange}
          placeholder={`${position.charAt(0).toUpperCase() + position.slice(1)} Text`}
        />
        <Select
          value={editedAd[`${position}Font`]}
          onValueChange={(value) => handleChange('Font' as keyof GeneratedAd, value, position)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(fonts).map((font) => (
              <SelectItem key={font} value={font}>{font}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="color"
          value={editedAd[`${position}TextColor`]}
          onChange={(e) => handleChange('TextColor' as keyof GeneratedAd, e.target.value, position)}
        />
        <Slider
          value={[editedAd[`${position}FontSize`]]}
          onValueChange={(value) => handleChange('FontSize' as keyof GeneratedAd, value[0], position)}
          min={10}
          max={100}
        />
        <Slider
          value={[editedAd[`${position}Padding`] ?? 10]}
          onValueChange={(value) => handleChange(`${position}Padding` as keyof GeneratedAd, value[0])}
          min={0}
          max={100}
        />
        <Select
          value={editedAd[`${position}TextCase`]}
          onValueChange={(value) => handleChange('TextCase' as keyof GeneratedAd, value, position)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select text case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="uppercase">Uppercase</SelectItem>
            <SelectItem value="lowercase">Lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
          <Button
            variant={editedAd[`${position}TextAlignment`] === 'left' ? 'default' : 'outline'}
            onClick={() => handleChange('TextAlignment' as keyof GeneratedAd, 'left', position)}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editedAd[`${position}TextAlignment`] === 'center' ? 'default' : 'outline'}
            onClick={() => handleChange('TextAlignment' as keyof GeneratedAd, 'center', position)}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editedAd[`${position}TextAlignment`] === 'right' ? 'default' : 'outline'}
            onClick={() => handleChange('TextAlignment' as keyof GeneratedAd, 'right', position)}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${position}TextOutline`}
            checked={editedAd[`${position}TextOutline`]}
            onCheckedChange={(checked) => handleChange('TextOutline' as keyof GeneratedAd, checked as boolean, position)}
          />
          <Label htmlFor={`${position}TextOutline`}>Text Outline</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id={`${position}AutoBreak`}
            checked={editedAd[`${position}AutoBreak`]}
            onCheckedChange={(checked) => handleChange('AutoBreak' as keyof GeneratedAd, checked, position)}
          />
          <Label htmlFor={`${position}AutoBreak`}>Auto Line Break</Label>
        </div>
      </div>
    );
  };

  const ImageControls = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Image Size</Label>
          <Slider
            value={[editedAd.imageSize]}
            onValueChange={(value) => handleChange('imageSize', value[0])}
            min={50}
            max={150}
            step={1}
          />
          <span className="text-sm">{editedAd.imageSize}%</span>
        </div>
        <div>
          <Label>Background Overlay</Label>
          <Slider
            value={[editedAd.backgroundOverlay]}
            onValueChange={(value) => handleChange('backgroundOverlay', value[0])}
            min={0}
            max={100}
            step={1}
          />
          <span className="text-sm">{editedAd.backgroundOverlay}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Image Position X</Label>
          <Slider
            value={[editedAd.imagePositionX]}
            onValueChange={(value) => handleChange('imagePositionX', value[0])}
            min={0}
            max={100}
            step={1}
          />
          <span className="text-sm">{editedAd.imagePositionX}%</span>
        </div>
        <div>
          <Label>Image Position Y</Label>
          <Slider
            value={[editedAd.imagePositionY]}
            onValueChange={(value) => handleChange('imagePositionY', value[0])}
            min={0}
            max={100}
            step={1}
          />
          <span className="text-sm">{editedAd.imagePositionY}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Top Canv Color</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="topCanvColorEnabled"
              checked={editedAd.topCanvColorEnabled || false}
              onCheckedChange={(checked) => handleChange('topCanvColorEnabled', checked)}
            />
            <Input
              type="color"
              value={editedAd.topCanvColor || '#ffffff'}
              onChange={(e) => handleChange('topCanvColor', e.target.value)}
              disabled={!editedAd.topCanvColorEnabled}
              className="w-12 h-8 p-0 border-0"
            />
          </div>
        </div>
        <div>
          <Label>Bottom Canv Color</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bottomCanvColorEnabled"
              checked={editedAd.bottomCanvColorEnabled || false}
              onCheckedChange={(checked) => handleChange('bottomCanvColorEnabled', checked)}
            />
            <Input
              type="color"
              value={editedAd.bottomCanvColor || '#ffffff'}
              onChange={(e) => handleChange('bottomCanvColor', e.target.value)}
              disabled={!editedAd.bottomCanvColorEnabled}
              className="w-12 h-8 p-0 border-0"
            />
          </div>
        </div>
      </div>
      
      <Button 
        onClick={() => {
          handleChange('bottomCanvColor', editedAd.topCanvColor || '');
          handleChange('bottomCanvColorEnabled', editedAd.topCanvColorEnabled || false);
        }}
        className="w-full"
        disabled={editedAd.hideTextAreas}
      >
        Match Bottom Canv Color to Top
      </Button>
      
      <div>
        <Label>Export Size</Label>
        <Select
          value={JSON.stringify(editedAd.exportSize)}
          onValueChange={(value) => handleChange('exportSize', JSON.parse(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select export size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={JSON.stringify({ width: 1080, height: 1080 })}>Square (1080x1080)</SelectItem>
            <SelectItem value={JSON.stringify({ width: 1200, height: 628 })}>Landscape (1200x628)</SelectItem>
            <SelectItem value={JSON.stringify({ width: 1080, height: 1350 })}>Portrait (1080x1350)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  console.log('Rendering AdEditorComponent');

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="avatar">Your Specific Avatar And Their Problem</Label>
          <Input id="avatar" name="avatar" value={formData.avatar} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="desiredOutcome">Your Avatar's Desired Outcome</Label>
          <Input id="desiredOutcome" name="desiredOutcome" value={formData.desiredOutcome} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="ineffectiveMethod1">1st Common But Ineffective Method</Label>
          <Input id="ineffectiveMethod1" name="ineffectiveMethod1" value={formData.ineffectiveMethod1} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="ineffectiveMethod2">2nd Common But Ineffective Method</Label>
          <Input id="ineffectiveMethod2" name="ineffectiveMethod2" value={formData.ineffectiveMethod2} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="ineffectiveMethod3">3rd Common But Ineffective Method</Label>
          <Input id="ineffectiveMethod3" name="ineffectiveMethod3" value={formData.ineffectiveMethod3} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="newSolution">The Name Of Your New Solution</Label>
          <Input id="newSolution" name="newSolution" value={formData.newSolution} onChange={handleInputChange} required />
        </div>
        <Button type="submit">Generate Meme Text</Button>
      </form>
      <Button 
        onClick={applyAIDesign} 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
      >
        <Wand2 className="mr-2 h-5 w-5" /> AI Magic Design
      </Button>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="matchTexts"
          checked={matchTexts}
          onCheckedChange={handleMatchTextsChange}
        />
        <Label htmlFor="matchTexts">Match Top & Bottom Text</Label>
      </div>
      <Tabs defaultValue="top">
        <TabsList>
          <TabsTrigger value="top">Top Text</TabsTrigger>
          <TabsTrigger value="bottom">Bottom Text</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>
        <TabsContent value="top">
          <TextEditor position="top" />
        </TabsContent>
        <TabsContent value="bottom">
          <TextEditor position="bottom" />
        </TabsContent>
        <TabsContent value="image">
          <ImageControls />
        </TabsContent>
      </Tabs>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(editedAd)}>Save</Button>
      </div>
    </div>
  )
}
