import _ from 'lodash';
import React from 'react';

// Persisting React State in localStorage
// source: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
export function useSessionState(defaultValue, key) {
    const [value, setValue] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const storage = window.sessionStorage;
            const storageValue = storage.getItem(key);
            return storageValue !== null
                ? JSON.parse(storageValue)
                : defaultValue;
        }
        else {
            return undefined;
        }
    });

    React.useEffect(() => {
        const storage = window.sessionStorage;
        storage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}

export function useLocalState(defaultValue, key) {
    const [value, setValue] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const storage = window.localStorage;
            const storageValue = storage.getItem(key);
            return storageValue !== null
                ? JSON.parse(storageValue)
                : defaultValue;
        }
        else {
            return undefined;
        }
    });

    React.useEffect(() => {
        const storage = window.localStorage;
        storage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}

// Custom hook, uses a closure to store values
// which kan overlive component's re-mount
// !!! WARNING !!!
// This will not works with tests or components with multiple instances
const memoryStorage = {}; // important to have this variable outside of useMemoryState function

export function useMemoryState(defaultValue, key) {
    const [value, setValue] = React.useState(memoryStorage[key] ? memoryStorage[key] : defaultValue);

    React.useEffect(() => {
        memoryStorage[key] = value;
    }, [value]);

    return [value, setValue];
}


// useTimeout & useInterval Custom React Hook Implementation
// source: https://codezup.com/usetimeout-useinterval-custom-react-hook-implementation/
export const useTimeout = (callback, timer) => {
    const timeoutIdRef = React.useRef()

    React.useEffect(() => {
        timeoutIdRef.current = callback
    }, [callback])

    React.useEffect(() => {
        const fn = () => {
            timeoutIdRef.current()
        }
        if (timer !== null) {
            let timeoutId = setTimeout(fn, timer)
            return () => clearTimeout(timeoutId)
        }
    }, [timer])
}

export const useInterval = (callback, timer) => {
    const intervalIdRef = React.useRef()

    useEffect(() => {
        intervalIdRef.current = callback;
    }, [callback])

    useEffect(() => {
        const fn = () => {
            intervalIdRef.current()
        }
        if (timer !== null) {
            let intervalId = setInterval(fn, timer)
            return () => clearInterval(intervalId)
        }
    }, [timer])
}


// Life and death of the usePrevious hook
// source: https://giacomocerquone.com/life-death-useprevious-hook/
export function useAlternativePrevious(value, initial) {
    const ref = React.useRef({ target: value, previous: initial });
    if (!_.isEqual(ref.current.target, value)) {
        ref.current.previous = ref.current.target;
        ref.current.target = value;
    }
    return ref.current.previous;
}


// Life and death of the usePrevious hook
// source: https://giacomocerquone.com/life-death-useprevious-hook/
export const usePrevious = (value) => {
    // The ref object is a generic container whose current property is mutable ...
    // ... and can hold any value, similar to an instance property on a class
    const ref = React.useRef();
    // Store current value in ref
    React.useEffect(() => {
        ref.current = value;
    }, [value]); // Only re-run if value changes
    // Return previous value (happens before update in useEffect above)
    return ref.current;
}

// useCombinedRefs - CodeSandbox
// source: https://codesandbox.io/s/uhj08?file=/src/App.js:223-537
export const setRefs = (...refs) => (element) => {
    refs.forEach((ref) => {
        if (!ref) {
            return;
        }

        // Ref can have two types - a function or an object. We treat each case.
        if (typeof ref === "function") {
            return ref(element);
        }

        ref.current = element;
    });
};

export function withRemount(Component) {
    const WrapperComponent = (props) => {
        const [key, setKey] = React.useState(1);
        return (<Component key={key} {...props} remount={() => setKey(key + 1)} />);
    };
    return WrapperComponent;
}

export function useAsyncState(initialState) {
    const [state, setState] = React.useState(initialState);
    const resolveState = React.useRef();
    const isMounted = React.useRef(false);

    React.useEffect(() => {
        isMounted.current = true;

        return () => {
            isMounted.current = false;
        };
    }, []);

    React.useEffect(() => {
        if (resolveState.current) {
            resolveState.current(state);
        }
    }, [state]);

    const setAsyncState = React.useCallback(
        newState =>
            new Promise(resolve => {
                if (isMounted.current) {
                    resolveState.current = resolve;
                    setState(newState);
                }
            }),
        []
    );

    return [state, setAsyncState];
}

export { default as useConfetti } from './useConfetti';