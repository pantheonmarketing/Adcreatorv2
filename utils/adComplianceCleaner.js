const cleanAndReformatAdCopy = async (adData) => {
  console.log("Input data:", adData);

  try {
    const response = await fetch('/api/cleanAdCopy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adData),
    });

    if (!response.ok) {
      throw new Error('Failed to clean ad copy');
    }

    const cleanedData = await response.json();
    console.log("Raw cleaned data:", cleanedData);

    // Map the cleaned data back to the expected structure
    return {
      avatarAndProblem: cleanedData.avatarAndProblem || adData.avatarAndProblem,
      desiredOutcome: cleanedData.desiredOutcome || adData.desiredOutcome,
      ineffectiveMethod1: cleanedData.ineffectiveMethod1 || adData.ineffectiveMethod1,
      ineffectiveMethod2: cleanedData.ineffectiveMethod2 || adData.ineffectiveMethod2,
      ineffectiveMethod3: cleanedData.ineffectiveMethod3 || adData.ineffectiveMethod3,
      newSolutionName: cleanedData.newSolutionName || adData.newSolutionName,
      imageGenerationKeywords: cleanedData.imageGenerationKeywords || adData.imageGenerationKeywords,
    };
  } catch (error) {
    console.error('Error cleaning ad copy:', error);
    return adData; // Return original data if cleaning fails
  }
};

export default cleanAndReformatAdCopy;
