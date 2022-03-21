import dynamic from 'next/dynamic';

const DocumentEditor = dynamic(() => import('../components/DocumentEditorComponent'), { ssr: false });
export default DocumentEditor;