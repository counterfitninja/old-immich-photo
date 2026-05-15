import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Download, RefreshCw, Columns, Rows, Trash2, Camera, X, Aperture, Sparkles, FileText, Cloud, Server, Key, AlertCircle, Calendar } from 'lucide-react';

const ImageUploader = ({ side, image, label, onImageSet }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up the camera stream if the component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Prioritize the back camera for document scanning
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please ensure you have granted permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onImageSet(side, dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageSet(side, event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      <div className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl transition-all overflow-hidden ${image ? 'border-gray-300 bg-gray-50' : isCameraActive ? 'border-blue-500 bg-black' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'}`}>
        
        {/* State 1: Image is loaded */}
        {image && !isCameraActive && (
          <div className="relative w-full h-full p-2 group flex items-center justify-center">
            <img src={image} alt={`${side} preview`} className="max-w-full max-h-full object-contain rounded shadow-sm" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl gap-2">
              <label className="cursor-pointer bg-white text-gray-800 px-3 py-2 rounded-lg font-medium shadow-lg hover:bg-gray-100 flex items-center gap-2 text-sm">
                <Upload size={16} /> Upload
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
              <button onClick={startCamera} className="bg-white text-gray-800 px-3 py-2 rounded-lg font-medium shadow-lg hover:bg-gray-100 flex items-center gap-2 text-sm">
                <Camera size={16} /> Camera
              </button>
            </div>
          </div>
        )}

        {/* State 2: Camera is active */}
        {isCameraActive && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            
            {/* Camera Overlay Controls */}
            <div className="absolute top-2 right-2">
              <button onClick={stopCamera} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button 
                onClick={captureImage} 
                className="bg-white text-blue-600 p-4 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform"
                title="Capture Photo"
              >
                <Aperture size={32} />
              </button>
            </div>
            
            <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="border-2 border-white/40 w-3/4 h-3/4 rounded-lg"></div>
            </div>
          </div>
        )}

        {/* State 3: Empty State (No Image, No Camera) */}
        {!image && !isCameraActive && (
          <div className="flex flex-col items-center justify-center w-full h-full p-4 space-y-4">
            <div className="flex gap-4">
              <label className="flex flex-col items-center justify-center cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-blue-600 w-28 h-28">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Upload File</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
              
              <button onClick={startCamera} className="flex flex-col items-center justify-center cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-blue-600 w-28 h-28 text-center">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium leading-tight">Use Camera</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 opacity-80 text-center max-w-[200px]">
              Use your webcam/phone or upload an existing scanned file (JPEG, PNG).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [mergedImage, setMergedImage] = useState(null);
  const [layout, setLayout] = useState('horizontal'); // 'horizontal' or 'vertical'
  const [isMerging, setIsMerging] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- AI Provider State ---
  const [aiProvider, setAiProvider] = useState('lmstudio'); // 'gemini' | 'lmstudio'
  const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234');
  const [lmStudioModel, setLmStudioModel] = useState('gemma-4');

  // --- Immich Integration State ---
  const [immichUrl, setImmichUrl] = useState('');
  const [immichApiKey, setImmichApiKey] = useState('');
  const [isUploadingToImmich, setIsUploadingToImmich] = useState(false);
  const [immichUploadMessage, setImmichUploadMessage] = useState(null);
  const [photoDate, setPhotoDate] = useState('');
  const [photoDateSource, setPhotoDateSource] = useState(null);

  // Load persisted config from local storage on mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('immichUrl') || '';
    const storedKey = localStorage.getItem('immichApiKey') || '';
    setImmichUrl(storedUrl);
    setImmichApiKey(storedKey);

    const storedProvider = localStorage.getItem('aiProvider') || 'lmstudio';
    const storedLmUrl = localStorage.getItem('lmStudioUrl') || 'http://localhost:1234';
    const storedLmModel = localStorage.getItem('lmStudioModel') || 'gemma-4';
    setAiProvider(storedProvider);
    setLmStudioUrl(storedLmUrl);
    setLmStudioModel(storedLmModel);

    // Runtime config endpoint allows deployment-time URL configuration
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        if (!storedUrl && config?.immichBaseUrl) {
          setImmichUrl(config.immichBaseUrl);
          localStorage.setItem('immichUrl', config.immichBaseUrl);
        }
      })
      .catch(() => {
        // Ignore optional runtime config fetch failures
      });
  }, []);

  const updateImmichUrl = (e) => {
    setImmichUrl(e.target.value);
    localStorage.setItem('immichUrl', e.target.value);
  };

  const updateImmichApiKey = (e) => {
    setImmichApiKey(e.target.value);
    localStorage.setItem('immichApiKey', e.target.value);
  };

  const uploadToImmich = async () => {
    if (!mergedImage || !immichUrl || !immichApiKey) return;
    setIsUploadingToImmich(true);
    setImmichUploadMessage(null);

    try {
      // 1. Convert base64 data URL to a Blob
      const res = await fetch(mergedImage);
      const blob = await res.blob();

      // 2. Prepare Form Data for Immich Upload
      const formData = new FormData();
      const dateToUse = photoDate ? new Date(photoDate).toISOString() : new Date().toISOString();

      formData.append('assetData', blob, 'combined-photo.jpg');
      formData.append('deviceAssetId', `web-combiner-${Date.now()}`);
      formData.append('deviceId', 'photo-combiner');
      formData.append('fileCreatedAt', dateToUse);
      formData.append('fileModifiedAt', dateToUse);
      formData.append('isFavorite', 'false');

      // Strip trailing slash from URL if present
      const baseUrl = immichUrl.replace(/\/$/, '');

      // 3. Upload Asset
      const uploadRes = await fetch('/api/immich/assets', {
        method: 'POST',
        headers: {
          'x-immich-url': baseUrl,
          'x-api-key': immichApiKey,
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
      }

      const uploadData = await uploadRes.json();
      const assetId = uploadData.id;

      // 4. Update Metadata (Description) if AI analysis exists
      if (aiAnalysis && assetId) {
        const updateRes = await fetch(`/api/immich/assets/${assetId}`, {
          method: 'PUT',
          headers: {
            'x-immich-url': baseUrl,
            'x-api-key': immichApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            description: aiAnalysis
          })
        });

        if (!updateRes.ok) {
          console.warn("Uploaded to Immich successfully, but failed to update the description.");
        }
      }

      setImmichUploadMessage({ type: 'success', text: 'Successfully uploaded to Immich!' });
      setTimeout(() => setImmichUploadMessage(null), 5000); // Clear success message after 5 seconds

    } catch (error) {
      // Catch the specific browser block and handle it cleanly without throwing a red console error
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        setImmichUploadMessage({ 
          type: 'error', 
          text: 'Upload failed to reach the local proxy server. Check that this app is running from your Node server and the Immich URL is reachable.' 
        });
      } else {
        console.error("Immich upload error:", error);
        setImmichUploadMessage({ type: 'error', text: `Error: ${error.message}` });
      }
    } finally {
      setIsUploadingToImmich(false);
    }
  };

  const handleSetImage = useCallback((side, dataUrl) => {
    if (side === 'front') setFrontImage(dataUrl);
    if (side === 'back') setBackImage(dataUrl);
    setMergedImage(null); // Reset merged result when inputs change
  }, []);

  const clearImages = () => {
    setFrontImage(null);
    setBackImage(null);
    setMergedImage(null);
    setAiAnalysis(null);
  };

  const triggerDownload = (href, filename) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImageAndMetadata = () => {
    if (!mergedImage) return;

    const imageFileName = 'combined-photo.jpg';
    const metadataFileName = 'combined-photo.metadata.json';

    const metadata = {
      imageFileName,
      exportedAt: new Date().toISOString(),
      layout,
      timelineDate: photoDate || null,
      timelineDateSource: photoDateSource || null,
      aiAnalysis: aiAnalysis || null,
      includedSides: {
        front: Boolean(frontImage),
        back: Boolean(backImage)
      }
    };

    triggerDownload(mergedImage, imageFileName);

    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const metadataUrl = URL.createObjectURL(metadataBlob);
    triggerDownload(metadataUrl, metadataFileName);
    URL.revokeObjectURL(metadataUrl);
  };

  // Resize a data URL to fit within maxPx on its longest side, JPEG quality 0.85
  // LM Studio's HTTP parser rejects very large payloads — keep images under ~1 MB base64
  const resizeForApi = (dataUrl, maxPx = 1024) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    });

  const extractDateForPicker = (analysisText) => {
    if (!analysisText) return '';

    const normalizedText = analysisText.replace(/\r/g, '');
    const dateLabelMatch = normalizedText.match(/Detected Date:\s*([^\n]+)/i);
    const rawDate = dateLabelMatch ? dateLabelMatch[1].trim() : normalizedText;

    if (!rawDate || /^unknown\b/i.test(rawDate) || /^none\b/i.test(rawDate)) {
      return '';
    }

    const isoDateMatch = rawDate.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoDateMatch) {
      return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
    }

    const isoMonthMatch = rawDate.match(/\b(\d{4})-(\d{2})\b/);
    if (isoMonthMatch) {
      return `${isoMonthMatch[1]}-${isoMonthMatch[2]}-01`;
    }

    const monthNameMatch = rawDate.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})\b/i);
    if (monthNameMatch) {
      const parsedDate = new Date(`${monthNameMatch[1]} ${monthNameMatch[2]}, ${monthNameMatch[3]}`);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().slice(0, 10);
      }
    }

    const monthYearMatch = rawDate.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    if (monthYearMatch) {
      const parsedDate = new Date(`${monthYearMatch[1]} 1, ${monthYearMatch[2]}`);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().slice(0, 10);
      }
    }

    const yearMatch = rawDate.match(/\b(18|19|20)\d{2}\b/);
    if (yearMatch) {
      return `${yearMatch[0]}-01-01`;
    }

    return '';
  };

  const analyzeWithAI = async () => {
    if (!backImage) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);

    const PROMPT = "You are an expert archivist. I am giving you the back of an old photograph containing handwritten notes, and optionally the front of the photograph.\n\n1. Please carefully transcribe any handwriting or text on the back under the heading 'Transcription:'.\n2. If you can identify any date from the handwriting or context, include exactly one line under the heading 'Detected Date:' using one of these formats only: YYYY-MM-DD, YYYY-MM, YYYY, or Unknown.\n3. Provide a brief summary or deduction about the photograph based on the text and visual context under the heading 'Historical Context:'.";

    try {
      if (aiProvider === 'lmstudio') {
        // ── LM Studio (OpenAI-compatible) ───────────────────────────────
        // Resize images first — large base64 payloads cause LM Studio to reject the request
        const [smallBack, smallFront] = await Promise.all([
          resizeForApi(backImage),
          frontImage ? resizeForApi(frontImage) : Promise.resolve(null),
        ]);

        const content = [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: smallBack } },
        ];
        if (smallFront) {
          content.push({ type: 'image_url', image_url: { url: smallFront } });
        }

        const baseUrl = lmStudioUrl.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: lmStudioModel,
            messages: [{ role: 'user', content }],
            temperature: 0.2,
            stream: false,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          const msg = result.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.error('LM Studio error:', result);
          setAiAnalysis(`LM Studio Error: ${msg}`);
        } else {
          const analysisText = result.choices[0].message.content;
          setAiAnalysis(analysisText);
          const detectedDate = extractDateForPicker(analysisText);
          if (detectedDate) {
            setPhotoDate(detectedDate);
            setPhotoDateSource('ai');
          }
        }

      } else {
        // ── Gemini ──────────────────────────────────────────────────────
        const backBase64 = backImage.split(',')[1];
        const backMimeType = backImage.split(';')[0].split(':')[1];

        const parts = [
          { text: PROMPT },
          { inlineData: { mimeType: backMimeType, data: backBase64 } },
        ];
        if (frontImage) {
          const frontBase64 = frontImage.split(',')[1];
          const frontMimeType = frontImage.split(';')[0].split(':')[1];
          parts.push({ inlineData: { mimeType: frontMimeType, data: frontBase64 } });
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
        });

        const result = await response.json();
        if (!response.ok || result.error) {
          const msg = result.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.error('Gemini API error:', result);
          setAiAnalysis(`API Error: ${msg}`);
        } else if (result.promptFeedback?.blockReason) {
          setAiAnalysis(`Request blocked by safety filter: ${result.promptFeedback.blockReason}`);
        } else if (result.candidates?.length > 0) {
          const analysisText = result.candidates[0].content.parts[0].text;
          setAiAnalysis(analysisText);
          const detectedDate = extractDateForPicker(analysisText);
          if (detectedDate) {
            setPhotoDate(detectedDate);
            setPhotoDateSource('ai');
          }
        } else {
          console.error('Unexpected Gemini response:', result);
          setAiAnalysis('Unexpected response from API. Check console for details.');
        }
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      setAiAnalysis(`Connection error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mergePhotos = async () => {
    if (!frontImage || !backImage) return;
    setIsMerging(true);

    try {
      const loadImg = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const [imgFront, imgBack] = await Promise.all([
        loadImg(frontImage),
        loadImg(backImage)
      ]);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let canvasWidth, canvasHeight;
      let drawFrontX = 0, drawFrontY = 0;
      let drawBackX = 0, drawBackY = 0;
      let drawBackWidth, drawBackHeight;

      // We scale the back image to match the front image's connecting dimension
      if (layout === 'horizontal') {
        // Side-by-side: Match heights
        const scale = imgFront.height / imgBack.height;
        drawBackWidth = imgBack.width * scale;
        drawBackHeight = imgFront.height; 

        canvasWidth = imgFront.width + drawBackWidth;
        canvasHeight = imgFront.height;

        drawFrontX = 0;
        drawFrontY = 0;
        drawBackX = imgFront.width;
        drawBackY = 0;
      } else {
        // Top-and-bottom: Match widths
        const scale = imgFront.width / imgBack.width;
        drawBackWidth = imgFront.width; 
        drawBackHeight = imgBack.height * scale;

        canvasWidth = imgFront.width;
        canvasHeight = imgFront.height + drawBackHeight;

        drawFrontX = 0;
        drawFrontY = 0;
        drawBackX = 0;
        drawBackY = imgFront.height;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw images
      ctx.drawImage(imgFront, drawFrontX, drawFrontY, imgFront.width, imgFront.height);
      ctx.drawImage(imgBack, drawBackX, drawBackY, drawBackWidth, drawBackHeight);

      // Add a subtle dividing line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (layout === 'horizontal') {
        ctx.moveTo(imgFront.width, 0);
        ctx.lineTo(imgFront.width, canvasHeight);
      } else {
        ctx.moveTo(0, imgFront.height);
        ctx.lineTo(canvasWidth, imgFront.height);
      }
      ctx.stroke();

      setMergedImage(canvas.toDataURL('image/jpeg', 0.95));
    } catch (error) {
      console.error("Error merging images:", error);
      alert("There was an error merging the photos. Please try different files.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-bold text-gray-900">Photo Combiner</h1>
          </div>
          <p className="text-gray-600">Upload scanned files or use your camera to capture the front and back of your old photographs. We'll stitch them together so you never lose the handwritten notes on the back.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upload & Scan Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">1. Capture Photos</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploader side="front" image={frontImage} label="Front of Photo" onImageSet={handleSetImage} />
              <ImageUploader side="back" image={backImage} label="Back of Photo" onImageSet={handleSetImage} />
            </div>

            {/* Controls */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">2. Select Layout & Combine</h3>
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setLayout('horizontal')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${layout === 'horizontal' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <Columns size={18} /> Side-by-Side
                </button>
                <button
                  onClick={() => setLayout('vertical')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${layout === 'vertical' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <Rows size={18} /> Top & Bottom
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={mergePhotos}
                  disabled={!frontImage || !backImage || isMerging}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isMerging ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                  {isMerging ? 'Combining...' : 'Combine Photos'}
                </button>
                
                {(frontImage || backImage || mergedImage || aiAnalysis) && (
                  <button
                    onClick={clearImages}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                    title="Clear All"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Result Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-bold text-gray-800">3. Result</h2>
                
                <div className="flex gap-2">
                  {mergedImage && immichUrl && immichApiKey && (
                    <button
                      onClick={uploadToImmich}
                      disabled={isUploadingToImmich}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isUploadingToImmich ? <RefreshCw className="animate-spin" size={16} /> : <Cloud size={16} />}
                      {isUploadingToImmich ? 'Uploading...' : 'To Immich'}
                    </button>
                  )}
                  {mergedImage && (
                    <button
                      onClick={downloadImageAndMetadata}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Download size={16} /> Save Image + Metadata
                    </button>
                  )}
                </div>
              </div>

              {mergedImage && (
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Calendar size={18} />
                    <label className="text-sm font-semibold">Timeline Date:</label>
                  </div>
                  <input
                    type="date"
                    value={photoDate}
                    onChange={(e) => {
                      setPhotoDate(e.target.value);
                      setPhotoDateSource(e.target.value ? 'manual' : null);
                    }}
                    className="p-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-auto"
                    title="Set the date this photo was taken for your Immich timeline"
                  />
                  <div className="text-xs text-blue-600/80 sm:ml-2 space-y-1">
                    <p>Optional: Places the photo correctly in your Immich timeline.</p>
                    {photoDate && photoDateSource === 'ai' && (
                      <p className="font-medium text-blue-700">Auto-detected from notes. You can edit it if needed.</p>
                    )}
                    {photoDate && photoDateSource === 'manual' && (
                      <p className="font-medium text-blue-700">Set manually.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 min-h-[300px]">
                {mergedImage ? (
                  <div className="p-4 w-full h-full flex items-center justify-center">
                    <img 
                      src={mergedImage} 
                      alt="Combined result" 
                      className="max-w-full max-h-full object-contain shadow-lg rounded-sm bg-white"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center text-center p-6">
                    <ImageIcon className="w-16 h-16 mb-2 opacity-20" />
                    <p>Your combined photo will appear here.</p>
                    <p className="text-sm mt-1">Upload both sides and click "Combine".</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex justify-between items-center border-b border-purple-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  AI Archivist
                </h2>
                <button
                  onClick={analyzeWithAI}
                  disabled={!backImage || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <FileText size={16} />}
                  {isAnalyzing ? 'Analyzing...' : 'Transcribe Notes'}
                </button>
              </div>

              {/* Provider toggle */}
              <div className="mb-4 space-y-3">
                <div className="flex bg-purple-50 p-1 rounded-lg border border-purple-100">
                  <button
                    onClick={() => { setAiProvider('lmstudio'); localStorage.setItem('aiProvider', 'lmstudio'); }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors ${
                      aiProvider === 'lmstudio' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-500 hover:bg-purple-100'
                    }`}
                  >
                    🖥 LM Studio (local)
                  </button>
                  <button
                    onClick={() => { setAiProvider('gemini'); localStorage.setItem('aiProvider', 'gemini'); }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors ${
                      aiProvider === 'gemini' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-500 hover:bg-purple-100'
                    }`}
                  >
                    ☁️ Gemini (cloud)
                  </button>
                </div>

                {aiProvider === 'lmstudio' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">LM Studio URL</label>
                      <input
                        type="text"
                        value={lmStudioUrl}
                        onChange={(e) => { setLmStudioUrl(e.target.value); localStorage.setItem('lmStudioUrl', e.target.value); }}
                        placeholder="http://localhost:1234"
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Model name</label>
                      <input
                        type="text"
                        value={lmStudioModel}
                        onChange={(e) => { setLmStudioModel(e.target.value); localStorage.setItem('lmStudioModel', e.target.value); }}
                        placeholder="gemma-4"
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="text-gray-800 text-sm">
                {!aiAnalysis && !isAnalyzing && (
                  <p className="text-purple-600/70 italic text-center py-6 px-4">
                    Upload the back of a photo and click "Transcribe Notes" to let AI read the handwriting and provide historical context.
                  </p>
                )}
                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-8 text-purple-600">
                    <Sparkles className="animate-pulse mb-3" size={32} />
                    <p className="font-medium">Deciphering handwriting and analyzing context...</p>
                  </div>
                )}
                {aiAnalysis && (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap bg-white/60 p-5 rounded-xl border border-purple-100 shadow-inner mt-2">
                    {aiAnalysis}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Immich Configuration Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <Cloud className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Immich Integration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Server size={14} /> Server URL
              </label>
              <input 
                type="text" 
                value={immichUrl}
                onChange={updateImmichUrl}
                placeholder="https://immich.yourdomain.com"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Key size={14} /> API Key
              </label>
              <input 
                type="password" 
                value={immichApiKey}
                onChange={updateImmichApiKey}
                placeholder="Paste your Immich API Key here"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-mono"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              Your credentials are saved securely in your browser's local storage. 
              <strong> Note for self-hosters:</strong> Your Immich instance must be configured to allow CORS requests from this domain for uploads to succeed.
            </span>
          </p>

          {immichUploadMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${immichUploadMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <AlertCircle size={16} />
              {immichUploadMessage.text}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}