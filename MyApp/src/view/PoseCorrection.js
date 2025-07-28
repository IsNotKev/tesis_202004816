import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { ArrowLeftIcon, BoltIcon } from 'react-native-heroicons/outline';

import corrections from '../data/correctionData';

const PoseCorrection = ({ navigation, route }) => {
  const { exercise } = route.params;
  
  // Función para volver a la pantalla anterior
  const goBack = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header semitransparente, flecha y título en la misma línea */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeftIcon size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <BoltIcon size={20} color="#fbbf24" style={styles.titleIcon} />
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        </View>
      </View>
      
      {/* Sección de corrección postural (ocupando máximo espacio) */}
      <View style={styles.correctionContainer}>
        {exercise.hasPoseCorrection && React.createElement(corrections[exercise.poseCorrection])}
      </View>
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    margin: 'auto',
  },
  titleIcon: {
    marginRight: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  correctionContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default PoseCorrection;