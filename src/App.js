import React, { useState } from 'react';
import './App.css';
import { getFileTypeLabel } from './utils/fileParser';
import { supabase } from './lib/supabaseClient';

function App() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['.pdf', '.docx', '.txt'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setError('Invalid file format. Please upload PDF, DOCX, or TXT files only.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setExtractedData('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedData('');
    setUploadProgress(0);

    try {
      // Extract text from file based on its type
      setUploadProgress(10);
      const fileText = await extractTextFromFile(file);
      
      if (!fileText || fileText.trim().length === 0) {
        throw new Error('Could not extract text from the file. The file may be empty or corrupted.');
      }
      
      setUploadProgress(40);
      
      // Call the API
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText: fileText }),
      });

      setUploadProgress(80);

      const result = await response.json();
      setUploadProgress(100);

      if (result.success) {
        setExtractedData(result.data);
        
        // Save to Supabase
        try {
          const { data, error } = await supabase
            .from('resumes')
            .insert([
              {
                full_name: result.data.match(/Full Name:\s*(.+)/)?.[1] || '',
                user_email: result.data.match(/Email Address:\s*(.+)/)?.[1] || '',
                extracted_data: { rawText: result.data },
                original_filename: file.name,
              }
            ]);
            
          if (error) {
            console.error('Supabase insert error:', error);
          } else {
            console.log('Saved to Supabase:', data);
          }
        } catch (supabaseError) {
          console.error('Failed to save to Supabase:', supabaseError);
        }
      } else {
        setError(result.data || 'Failed to extract data from resume.');
      }
    } catch (err) {
      setError('An error occurred while processing the file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>VeriResume</h1>
        <p>AI-Powered Resume Extraction</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <h2>Upload Your Resume</h2>
          <p className="subtitle">Supported formats: PDF, DOCX, TXT</p>
          
          <div className="file-input-wrapper">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="resume-upload" className="file-label">
              {file ? `${file.name} (${getFileTypeLabel(file.name)})` : 'Choose a file'}
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="upload-button"
          >
            {loading ? 'Processing...' : 'Extract Information'}
          </button>

          {loading && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-section">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {extractedData && (
          <div className="result-section">
            <h3>Extracted Information</h3>
            <div className="extracted-content">
              <pre>{extractedData}</pre>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>VeriResume - Powered by Google Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;
