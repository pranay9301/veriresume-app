import React, { useState, useEffect } from 'react';
import './App.css';
import { getFileTypeLabel, extractTextFromFile } from './utils/fileParser';
import { supabase } from './lib/supabaseClient';
import BillingPage from './pages/BillingPage';

function App() {
  const [view, setView] = useState('app'); // 'app' | 'billing'
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setSessionLoading(false);
      const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user || null);
      });
      return () => {
        listener.subscription.unsubscribe();
      };
    };
    init();
  }, []);

  const signInWithGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const consumeCredit = async () => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('consume_credit');
    if (error) {
      setError('Insufficient credits or subscription error.');
      return false;
    }
    return data === true;
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
      if (user && !(await consumeCredit())) {
        setLoading(false);
        return;
      }

      const fileText = await extractTextFromFile(file);
      if (!fileText || fileText.trim().length === 0) {
        throw new Error('Could not extract text from the file. The file may be empty or corrupted.');
      }

      setUploadProgress(40);

      const token = (await supabase.auth.getSession()).data.session?.access_token || '';
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText: fileText }),
      });

      setUploadProgress(80);
      const result = await response.json();
      setUploadProgress(100);

      if (result.success) {
        setExtractedData(result.data);
        if (user) {
          const insert = {
            user_id: user.id,
            full_name: result.data.match(/Full Name:\s*(.+)/)?.[1] || '',
            user_email: result.data.match(/Email Address:\s*(.+)/)?.[1] || '',
            extracted_data: { rawText: result.data },
            original_filename: file.name,
          };
          const { error } = await supabase.from('resumes').insert([insert]);
          if (error) console.error('Supabase insert error:', error);
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

  if (sessionLoading) {
    return <div className="App">Loading...</div>;
  }

  if (view === 'billing') {
    return <BillingPage user={user} onBack={() => setView('app')} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>VeriResume</h1>
        <p>AI-Powered Resume Extraction</p>
      </header>

      <nav className="App-nav">
        <button onClick={() => setView('app')}>App</button>
        <button onClick={() => setView('billing')}>Billing</button>
        {user ? (
          <button onClick={signOut}>Sign out</button>
        ) : (
          <button onClick={signInWithGoogle}>Sign in with Google</button>
        )}
      </nav>

      <main className="App-main">
        <div className="upload-section">
          <h2>Upload Your Resume</h2>
          <p className="subtitle">Supported formats: PDF, DOCX, TXT</p>

          <div className="file-input-wrapper">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) setFile(selectedFile);
              }}
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
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
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
