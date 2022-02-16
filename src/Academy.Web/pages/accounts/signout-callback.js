import { useEffect } from 'react';
import Loader from '../../components/Loader';
import { useClient } from '../../utils/client';

export default function SignoutCallback() {

    const client = useClient();

    useEffect(() => {
        client.signoutCallback();
    }, []);

    return (<Loader />);
};