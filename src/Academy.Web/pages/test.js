import { useQueryState } from 'next-usequerystate'
import { useEffect, useState } from 'react';

export default () => {
    const [name, setName] = useQueryState('name');
    const [mounted, setMounted] = useState(false);

    useEffect(()=> { setMounted(true); }, []);
    return (
        <>
            <h1>Hello, {name || 'anonymous visitor'}!</h1>
            <input value={name || ''} onChange={e => setName(e.target.value)} />
            <button key={String(mounted)} {...{ className: name }} className={`${name}`} onClick={() => setName(null)}>Clear</button>
        </>
    )
}