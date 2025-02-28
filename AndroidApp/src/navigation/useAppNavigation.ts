import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
    Home: undefined;
    SignUp: undefined;
    Login: undefined;
    Profile: undefined;
    App: undefined;
};

export type AppNavigationProp = StackNavigationProp<RootStackParamList>;

export const useAppNavigation = (): AppNavigationProp => {
    return useNavigation<AppNavigationProp>();
};
