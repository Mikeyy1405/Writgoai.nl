    // Parse JSON response - handle markdown code blocks
    let result;
    try {
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks (various formats)
      // Handle: ```json\n...\n``` or ```\n...\n``` or ```json ... ``` 
      cleanedContent = cleanedContent
        .replace(/^```json\s*/i, '')  // Remove opening ```json
        .replace(/^```\s*/i, '')       // Remove opening ````
        .replace(/\s*```$/i, '')       // Remove closing ```
        .trim();
      
      // Try to extract JSON if still wrapped
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      result = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('[Article Writer] Failed to parse JSON:', e);
      console.error('[Article Writer] Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse article generation response');
    }