import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/rich-text-editor.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, rows = 4, disabled = false }: RichTextEditorProps) {
  const { theme } = useTheme();

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  const handleChange = (content: string) => {
    if (onChange) {
      onChange(content);
    }
  };

  // 确保value始终是字符串
  const editorValue = value === null || value === undefined ? '' : String(value);

  return (
    <div className={`rich-text-editor-wrapper ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={disabled ? { toolbar: false } : modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{ 
          height: `${rows * 24 + 100}px`,
          marginBottom: 42
        }}
      />
    </div>
  );
}

