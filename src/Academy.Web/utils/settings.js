import { createContext, useContext, } from 'react';

const SettingsContext = createContext({});
const SettingsProvider = ({ children, settings }) => {

    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
};

const useSettings = () => {
    return useContext(SettingsContext);
};


export { SettingsProvider, useSettings };