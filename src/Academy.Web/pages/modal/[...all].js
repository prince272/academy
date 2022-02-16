import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Loader from '../../components/Loader';

const IndexPage = () => {
    const router = useRouter();

    return (<Loader />);
};

export default IndexPage;