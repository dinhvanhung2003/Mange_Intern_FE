import { Editor } from '@tinymce/tinymce-react';
import { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';

export interface RichTextEditorRef {
  getHTML: () => string;
  setHTML: (html: string) => void;
}

interface RichTextEditorProps {
  initialContent?: string;
}
// tiny richtext
const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ initialContent = '' }, ref) => {
    const editorRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getHTML: () => editorRef.current?.getContent() || '',
      setHTML: (html: string) => {
        if (editorRef.current) {
          editorRef.current.setContent(html || '');
        }
      },
    }));

    useEffect(() => {
      if (editorRef.current && initialContent) {
        editorRef.current.setContent(initialContent);
      }
    }, [initialContent]);

    return (
      <Editor
       apiKey="emd7v129vz8b7yfwvfy1xb9308sg7kim8jsu1cncwpo54wbl"
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue={initialContent}
        init={{
          height: 300,
          menubar: false,
          plugins: [
            'image',
            'advlist autolink lists link image charmap preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste help wordcount',
          ],
          toolbar:
            'undo redo | formatselect | bold italic underline | \
            forecolor backcolor | alignleft aligncenter alignright | \
            bullist numlist outdent indent | removeformat | help | image',
          image_title: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          file_picker_callback: (callback:any) => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.onchange = async () => {
              const file = input.files?.[0];
              if (file) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('http://localhost:3000/tasks/upload-image', {
                  method: 'POST',
                  body: formData,
                });

                const data = await res.json();
                if (data?.url) {
                  callback(data.url, { alt: file.name });
                } else {
                  alert('Tải ảnh thất bại');
                }
              }
            };
            input.click();
          },
        }}
      />
    );
  }
);

export default RichTextEditor;
