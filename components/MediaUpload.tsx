'use client';

import { useState, useRef } from 'react';

interface MediaUploadProps {
  onUploadComplete: () => void;
}

export default function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [altText, setAltText] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecteer eerst een bestand');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('altText', altText);
      formData.append('tags', tags);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/media-library/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      // Reset form
      setFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setAltText('');
      setTags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setTitle('');
    setDescription('');
    setAltText('');
    setTags('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Upload Media</h3>

      {/* File Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Selecteer bestand *
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            file:cursor-pointer cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ondersteunde formaten: JPG, PNG, WebP, GIF, MP4, WebM, MOV (max 50MB voor video&apos;s, 10MB voor afbeeldingen)
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Voorbeeld</label>
          <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
            {file?.type.startsWith('image/') ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={preview}
                className="w-full h-full object-contain"
                controls
              />
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Titel *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijvoorbeeld: Logo Bedrijfsnaam"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Beschrijving
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optionele beschrijving van de media"
          rows={3}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Alt Text (for images) */}
      {file?.type.startsWith('image/') && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Alt Text (voor toegankelijkheid)
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Beschrijf wat er in de afbeelding te zien is"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Tags */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Tags (gescheiden door komma&apos;s)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="logo, branding, marketing"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">
            {progress}% - Uploaden...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || !title || uploading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {uploading ? 'Uploaden...' : 'Upload'}
        </button>
        <button
          onClick={handleCancel}
          disabled={uploading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
