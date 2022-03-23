import dynamic from 'next/dynamic';

const DynamicEditor = dynamic(() => import('../components/DynamicEditor'), {
    ssr: false,
});

const DocumentEditor = props => {
    return ( <DynamicEditor {...props} />);
};

export default DocumentEditor;