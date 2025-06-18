import {
  useEditor,
  EditorContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';

import { useImperativeHandle, forwardRef, useRef } from 'react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatColorText,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdCode,
} from 'react-icons/md';
import { FaImage } from 'react-icons/fa';

interface RichTextEditorProps {
  initialContent?: string;
  taskId?: number;
}

export interface RichTextEditorRef {
  getHTML: () => string;
  setHTML: (html: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ initialContent = '', taskId }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Image,
      ],
      content: initialContent,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      setHTML: (html: string) => {
        editor?.commands.setContent(html || '');
      },
    }));

    const handleUploadImage = async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (taskId) formData.append('taskId', String(taskId));

      try {
        const res = await fetch('http://localhost:3000/tasks/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`Upload thất bại: ${err.message}`);
          return;
        }

        const data = await res.json();
        if (data.url) {
          editor?.chain().focus().setImage({ src: data.url }).run();
        } else {
          alert('Không nhận được URL ảnh.');
        }
      } catch (err) {
        console.error('Lỗi upload:', err);
        alert('Lỗi upload ảnh!');
      }
    };

    const handleImageClick = () => {
      fileInputRef.current?.click();
    };

    if (!editor) return null;

    return (
      <div className="border rounded-md">
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadImage(file);
          }}
        />

        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className="toolbar-btn">
            <MdFormatBold size={20} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className="toolbar-btn">
            <MdFormatItalic size={20} />
          </button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className="toolbar-btn">
            <MdFormatUnderlined size={20} />
          </button>
          <button className="toolbar-btn flex items-center gap-1">
            <MdFormatColorText size={20} />
            <input
              type="color"
              className="w-6 h-6 cursor-pointer"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className="toolbar-btn">
            <MdFormatAlignLeft size={20} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className="toolbar-btn">
            <MdFormatAlignCenter size={20} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className="toolbar-btn">
            <MdFormatAlignRight size={20} />
          </button>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="toolbar-btn">
            <MdCode size={20} />
          </button>
          <button onClick={handleImageClick} className="toolbar-btn" title="Tải ảnh từ máy">
            <FaImage size={18} />
          </button>
        </div>

        <EditorContent
          editor={editor}
          className="editor-content min-h-[150px] p-2 w-full"
          style={{ width: '100%' }}
        />
      </div>
    );
  }
);

export default RichTextEditor;
