import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/view/HomeScreen';
import ExerciseGridScreen from './src/view/ExerciseGridScreen';
import ExerciseDetailScreen from './src/view/ExerciseDetailScreen';
import PoseCorrection from './src/view/PoseCorrection';
import QuestionnaireScreen from './src/view/QuestionnaireScreen';
import RoutineScreen from './src/view/RoutineScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Inicio" component={HomeScreen} />
        <Stack.Screen name="ExerciseGrid" component={ExerciseGridScreen} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <Stack.Screen name="PoseCorrection" component={PoseCorrection} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
        <Stack.Screen name="Routine" component={RoutineScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
