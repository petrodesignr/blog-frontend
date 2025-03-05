import { EditorComponent } from '@tinymce/tinymce-angular';
import { Editor } from 'tinymce';

export const TINYMCE_DEFAULT_CONFIG: EditorComponent['init'] = {
  base_url: '/tinymce',
  suffix: '.min',
  plugins: [
    'advlist',
    'autolink',
    'lists',
    'link',
    'image',
    'charmap',
    'preview',
    'anchor',
    'searchreplace',
    'visualblocks',
    'code',
    'fullscreen',
    'insertdatetime',
    'media',
    'table',
    'code',
    'help',
    'wordcount',
  ],
  toolbar:
    'undo redo | blocks | bold italic forecolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | removeformat | help',
  height: 400,
  menubar: false,
  promotion: false,
  statusbar: false,
  browser_spellcheck: true,
  contextmenu: false,
  paste_data_images: true,
  entity_encoding: 'raw',
  verify_html: false,
  forced_root_block: 'p',
  skin: 'oxide',
  content_css: 'default',
  content_style:
    'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
  setup: (editor: Editor) => {
    editor.on('init', () => {
      const container = editor.getContainer();
      if (container) {
        container.style.transition = 'border-color 0.15s ease-in-out';
      }
    });
  },
};