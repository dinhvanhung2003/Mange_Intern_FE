import {
  useEditor,
  EditorContent,
  Editor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { useImperativeHandle, forwardRef } from 'react';

// ICONS
import { MdFormatBold } from 'react-icons/md';
import { MdFormatItalic } from 'react-icons/md';
import { MdFormatUnderlined } from 'react-icons/md';
import { MdFormatColorText } from 'react-icons/md';
import { MdFormatAlignLeft } from 'react-icons/md';
import { MdFormatAlignCenter } from 'react-icons/md';
import { MdFormatAlignRight } from 'react-icons/md';
import { MdCode } from 'react-icons/md';

interface RichTextEditorProps {
  initialContent?: string;
}

export interface RichTextEditorRef {
  getHTML: () => string;
  setHTML: (html: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ initialContent = '' }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
      ],
      content: initialContent,
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      setHTML: (html: string) => {
        editor?.commands.setContent(html || '');
      },
    }));

    if (!editor) return null;

    return (
      <div className="border rounded-md">
        {/* Toolbar */}
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
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} className="min-h-[150px] p-2" />
      </div>
    );
  }
);

export default RichTextEditor;
