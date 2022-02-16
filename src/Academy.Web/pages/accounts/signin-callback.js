import { useEffect } from 'react';
import Loader from '../../components/Loader';
import { useClient } from '../../utils/client';

export default function SigninCallback() {

    const client = useClient();

    useEffect(() => {
        client.signinCallback();
    }, []);

    return (<Loader />);
};