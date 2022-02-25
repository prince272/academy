import { createContext, useContext, } from 'react';

const AppSettingsContext = createContext({});
const AppSettingsProvider = ({ children, appSettings }) => {

    return (
        <AppSettingsContext.Provider value={appSettings}>
            {children}
        </AppSettingsContext.Provider>
    );
};

const useAppSettings = () => {
    return useContext(AppSettingsContext);
};


export { AppSettingsProvider, useAppSettings };