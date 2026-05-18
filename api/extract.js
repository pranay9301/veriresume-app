import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { resumeText, fileBuffer, fileType } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Validate API key exists
    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            success: false,
            data: "Configuration Error: GEMINI_API_KEY is not set. Please check your environment variables."
        });
    }

    let textToProcess = resumeText;

    // If fileBuffer is provided, parse it server-side
    if (fileBuffer && fileType) {
        try {
            const buffer = Buffer.from(fileBuffer, 'base64');
            
            if (fileType === 'pdf') {
                const pdfData = await pdfParse(buffer);
                textToProcess = pdfData.text;
            } else if (fileType === 'docx') {
                const result = await mammoth.extractRawText({ buffer });
                textToProcess = result.value;
            }
        } catch (parseError) {
            console.error('File parsing error:', parseError);
            return res.status(400).json({
                success: false,
                data: `Error parsing file: ${parseError.message}`
            });
        }
    }

    // Validate resume text exists
    if (!textToProcess || textToProcess.trim().length === 0) {
        return res.status(400).json({
            success: false,
            data: "Validation Error: No resume text provided."
        });
    }

    // Try multiple models in order of preference
    const models = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-pro"
    ];

    for (let modelName of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Extract the following information from this resume text and format it clearly:
                            
1. Full Name
2. Email Address
3. Phone Number (if available)
4. Skills (as a comma-separated list)
5. Education (brief summary)
6. Work Experience (brief summary)

If any information is not found, indicate "Not found" for that field.

Resume Text:
${textToProcess}`
                        }]
                    }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            const data = await response.json();

            // Check for Google API errors
            if (data.error) {
                console.error(`Model ${modelName} error:`, data.error);
                continue; // Try next model
            }

            // Check if we got a valid response
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const extracted = data.candidates[0].content.parts[0].text;
                return res.status(200).json({
                    success: true,
                    data: extracted,
                    modelUsed: modelName
                });
            }
            
            // Log failed attempt for debugging
            console.log(`Model ${modelName} failed: No valid content in response`);
            
        } catch (err) {
            console.error(`Model ${modelName} exception:`, err.message);
            continue; // Try next model
        }
    }

    // If all models failed
    return res.status(200).json({
        success: false,
        data: "CRITICAL ERROR: All AI models failed. Please verify your GEMINI_API_KEY is correct and active. Ensure it starts with 'AIza' and has access to Gemini models in Google AI Studio."
    });
}
