import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, StatusBar, SafeAreaView } from 'react-native';
import { 
  FireIcon, 
  ClipboardDocumentCheckIcon, 
  ChartBarIcon,
  ArrowRightIcon
} from 'react-native-heroicons/solid';

import inicio from '../assets/inicio.jpeg';

const HomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={inicio}
      style={styles.backgroundImage}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>ATLUS</Text>
            <Text style={styles.subtitle}>Tu entrenador personal</Text>
          </View>

          <View style={styles.cardsContainer}>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('ExerciseGrid')}
            >
              <View style={styles.cardIconContainer}>
                <ClipboardDocumentCheckIcon size={32} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Ejercicios</Text>
                <Text style={styles.cardSubtitle}>Explora nuestra biblioteca de ejercicios</Text>
              </View>
              <ArrowRightIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.card, styles.cardOrange]}
              onPress={() => navigation.navigate('Questionnaire')}
            >
              <View style={styles.cardIconContainer}>
                <FireIcon size={32} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Rutina Personalizada</Text>
                <Text style={styles.cardSubtitle}>Crea un plan adaptado a tus objetivos</Text>
              </View>
              <ArrowRightIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>

           {/*  <TouchableOpacity 
              style={[styles.card, styles.cardGreen]}
              onPress={() => navigation.navigate('Stats')}
            >
              <View style={styles.cardIconContainer}>
                <ChartBarIcon size={32} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Progreso</Text>
                <Text style={styles.cardSubtitle}>Visualiza tu avance y estadísticas</Text>
              </View>
              <ArrowRightIcon size={20} color="#FFFFFF" />
            </TouchableOpacity> */}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¡Pilas pues, a entrenar! 💪</Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  headerContainer: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#DDD',
    marginTop: 5,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', // Blue
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardOrange: {
    backgroundColor: '#f97316', // Orange
  },
  cardGreen: {
    backgroundColor: '#22c55e', // Green
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;