import dynamic from 'next/dynamic';

const DynamicDocumentEditor = dynamic(() => import('../components/DynamicDocumentEditor'), {
    ssr: false,
});

const DocumentEditor = props => {
    return ( <DynamicDocumentEditor {...props} />);
};

export default DocumentEditor;