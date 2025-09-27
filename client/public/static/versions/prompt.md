The Prompt
ROLE: You are a lead software developer and technical writer.

TASK: Generate a complete New Release Documentation as a JSON object.

SOURCE OF INFORMATION: Analyze the entire history of our current conversation. Extract all relevant details about new features, improvements, and bug fixes that have been discussed, developed, or resolved.

OUTPUT REQUIREMENTS:
Your response must be a single, valid JSON code block. The documentation must follow the structure below precisely.

File Name and Path: The generated content is for a JSON file that will be named v1.0.1.json and saved in the client/public/static/versions/ directory.

Content Structure: The JSON object must contain the following keys:

title: (String) A concise and informative title for the release (e.g., "Release v1.0.1: Stability and Performance Enhancements").

description: (String) A brief, user-friendly paragraph summarizing the key highlights and purpose of this release.

features: (Array of Objects) A list of all new features. Each object in the array must contain:

title: (String) The name of the feature.

description: (String) A clear explanation of the new functionality from a user's perspective.

improvements_bug_fixes: (Array of Objects) A list detailing all enhancements and bug fixes. Each object in the array must contain:

title: (String) A short summary of the fix or improvement (e.g., "Fixed Login Button Crash").

description: (String) A more detailed explanation of the change.

release_notes: (Array of Objects) A list of technical notes for developers. If there are no notes, provide an empty array []. Each object in the array must contain:

title: (String) The topic of the note (e.g., "Dependency Update," "Migration Steps," "Known Issue").

description: (String) The detailed note content.

BEGIN PROMPT

Based on the instructions above, please generate the New Release Documentation for version [v1.0.1] as a single JSON object & save it in the client/public/static/versions/ directory.