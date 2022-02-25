import EventEmitter from 'events';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const createEventDispatcher = () => {
    return new EventEmitter();
};

const EventDispatcherContext = createContext({});

const EventDispatcherProvider = ({ children }) => {
    const events = useMemo(() => createEventDispatcher(), []);
    return (
        <EventDispatcherContext.Provider value={events}>
            {children}
        </EventDispatcherContext.Provider>
    )
}

const EventDispatcherConsumer = ({ children }) => {
    return (
        <EventDispatcherContext.Consumer>
            {context => {
                if (context === undefined) {
                    throw new Error('EventDispatcherConsumer must be used within a EventDispatcherProvider.')
                }
                return children(context)
            }}
        </EventDispatcherContext.Consumer>
    )
}

const useEventDispatcher = () => {
    return useContext(EventDispatcherContext);
};

export { EventDispatcherProvider, EventDispatcherConsumer, useEventDispatcher, createEventDispatcher };