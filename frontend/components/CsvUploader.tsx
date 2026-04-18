'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface CsvUploaderProps {
  onFile: (text: string, filename: string) => void;
}

export function CsvUploader({ onFile }: CsvUploaderProps) {
  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => onFile(e.target?.result as string, file.name);
      reader.readAsText(file);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv', '.txt'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-400 bg-blue-900/20'
          : 'border-slate-600 hover:border-slate-400 bg-slate-800/40'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-4xl mb-3">📂</div>
      <p className="text-slate-300 font-medium">
        {isDragActive ? 'Drop CSV here…' : 'Drag & drop a CSV file, or click to browse'}
      </p>
      <p className="text-slate-500 text-xs mt-2">
        Expected columns: timestamp, belt_speed, motor_current, bearing_temp_1–4,
        vibration_rms_1–4, tonnes_per_hour, alignment_deviation
      </p>
    </div>
  );
}
