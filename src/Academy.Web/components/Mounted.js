import { useEffect, useState } from 'react';

const Mounted = ({ children }) => {
    const [component, setComponent] = useState({ inner: null })
    useEffect(() => {
        setComponent({ children })
    }, []);

    return <>{component.children}</>
};

export default Mounted;