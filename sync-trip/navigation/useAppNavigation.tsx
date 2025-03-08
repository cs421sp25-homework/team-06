import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

type TabsContextType = {
    tabIndex: number;
    setTabIndex: React.Dispatch<React.SetStateAction<number>>;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [tabIndex, setTabIndex] = useState<number>(0);
    return (
        <TabsContext.Provider value={{ tabIndex, setTabIndex }}>
            {children}
        </TabsContext.Provider>
    );
};

export const useTabs = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabsProvider');
    }
    return context;
};

export type RootStackParamList = {
    Home: undefined;
    SignUp: undefined;
    Login: undefined;
    Profile: undefined;
    App: undefined;
    History: undefined;
    ArchivedHistory: undefined;
};

export type AppNavigationProp = StackNavigationProp<RootStackParamList>;

export const useAppNavigation = (): AppNavigationProp => {
    return useNavigation<AppNavigationProp>();
};
