import dynamic from 'next/dynamic';

const DynamicDocumentViewer = dynamic(() => import('../components/DynamicDocumentViewer'), {
    ssr: false,
});

const DocumentViewer = props => {
    return ( <DynamicDocumentViewer {...props} />);
};

export default DocumentViewer;