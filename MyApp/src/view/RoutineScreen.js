import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';

import { 
  PlayIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  Squares2X2Icon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  FireIcon,
  HeartIcon,
  StopCircleIcon
} from "react-native-heroicons/outline";

// Función para crear un gradiente de color personalizado según el nivel de dificultad
const getDifficultyColor = (difficulty) => {
  switch(difficulty?.toLowerCase()) {
    case 'fácil':
    case 'facil':
    case 'easy':
      return '#4CD964'; // Verde
    case 'medio':
    case 'medium':
      return '#FF9500'; // Naranja
    case 'difícil':
    case 'dificil':
    case 'hard':
      return '#FF3B30'; // Rojo
    default:
      return '#5856D6'; // Morado (por defecto)
  }
};

const RoutineScreen = ({ route, navigation }) => {
  // Obtener la rutina de los parámetros de navegación
  const { routine } = route.params;
  
  // Estado para controlar qué ejercicios tienen instrucciones expandidas
  const [expandedExercises, setExpandedExercises] = useState({});
  
  // Estado para animación de carga de ejercicios (efecto visual)
  const [loaded, setLoaded] = useState(false);

  // Efecto para simular carga de contenido
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  if (!routine || routine.exercises.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <Image 
          source={{ uri: 'https://via.placeholder.com/150' }} 
          style={styles.emptyImage} 
        />
        <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <HomeIcon size={20} color="#FFFFFF" />
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const openVideoLink = (url) => {
    Linking.openURL(url).catch(err => {
      console.error('Error al abrir el enlace:', err);
      Alert.alert('Error', 'No se pudo abrir el enlace de video');
    });
  };

  const toggleInstructions = (exerciseId) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const activatePoseCorrection = (exercise) => {
    navigation.navigate('PoseCorrection', { exercise });
  };
  
  const navigateToQuestionnaire = () => {
    navigation.navigate('Questionnaire');
  };
  
  const navigateToHome = () => {
    navigation.navigate('Inicio');
  };

  // Calcular estadísticas de la rutina
  const totalExercises = routine.exercises.length;
  const totalSets = routine.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets) || 0), 0);
  const avgRestTime = Math.round(routine.exercises.reduce((sum, ex) => sum + (parseInt(ex.restTime) || 0), 0) / totalExercises);

  // Función para renderizar los detalles del ejercicio según su tipo (tiempo o repeticiones)
  const renderExerciseDetails = (exercise) => {
    if (exercise.isTimeBasedExercise) {
      // Ejercicio basado en tiempo (isométrico)
      return (
        <View style={styles.exerciseDetailItem}>
          <StopCircleIcon size={20} color="#5856D6" />
          <Text style={styles.detailLabel}>Mantener</Text>
          <Text style={styles.detailValue}>
            {exercise.recommendedTime?.min || '20'}-{exercise.recommendedTime?.max || '30'} seg
          </Text>
        </View>
      );
    } else {
      // Ejercicio basado en repeticiones
      return (
        <View style={styles.exerciseDetailItem}>
          <ArrowPathIcon size={20} color="#34C759" />
          <Text style={styles.detailLabel}>Repeticiones</Text>
          <Text style={styles.detailValue}>
            {exercise.recommendedReps?.min || '8'}-{exercise.recommendedReps?.max || '12'}
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tu Rutina de Entrenamiento</Text>
        {routine.name && <Text style={styles.routineName}>{routine.name}</Text>}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Squares2X2Icon size={18} color="#FFFFFF" />
            <Text style={styles.statValue}>{totalExercises}</Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <ArrowPathIcon size={18} color="#FFFFFF" />
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Series</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <ClockIcon size={18} color="#FFFFFF" />
            <Text style={styles.statValue}>{avgRestTime}s</Text>
            <Text style={styles.statLabel}>Descanso</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {routine.message && (
          <View style={styles.messageContainer}>
            <FireIcon size={20} color="#FF9500" style={styles.messageIcon} />
            <Text style={styles.messageText}>{routine.message}</Text>
          </View>
        )}
        
        <Text style={styles.sectionTitle}>Ejercicios</Text>
        
        {routine.exercises.map((exercise, index) => (
          <View 
            key={exercise.id} 
            style={[
              styles.exerciseCard, 
              {
                opacity: loaded ? 1 : 0,
                transform: [{ translateY: loaded ? 0 : 20 }]
              },
              exercise.difficulty && { borderLeftWidth: 4, borderLeftColor: getDifficultyColor(exercise.difficulty) }
            ]}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitleContainer}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => openVideoLink(exercise.videoLink)}
                style={styles.videoButton}
              >
                <PlayIcon size={20} color="#007AFF" />
                <Text style={styles.videoButtonText}>Ver Video</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.exerciseDescription}>{exercise.description}</Text>

            {exercise.targets && (
              <View style={styles.targetsContainer}>
                <HeartIcon size={14} color="#FF2D55" />
                <Text style={styles.targetsText}>
                  Enfoca: <Text style={styles.targetsMuscles}>{exercise.targets}</Text>
                </Text>
              </View>
            )}
            
            {/* Badge para indicar si es un ejercicio isométrico */}
            {exercise.isTimeBasedExercise && (
              <View style={styles.exerciseTypeContainer}>
                <StopCircleIcon size={14} color="#5856D6" />
                <Text style={styles.exerciseTypeText}>Ejercicio Cronometrado</Text>
              </View>
            )}

            <View style={styles.exerciseDetailsContainer}>
              <View style={styles.exerciseDetailItem}>
                <ClockIcon size={20} color="#007AFF" />
                <Text style={styles.detailLabel}>Descanso</Text>
                <Text style={styles.detailValue}>{exercise.restTime} seg</Text>
              </View>

              {/* Renderizar detalles según el tipo de ejercicio */}
              {renderExerciseDetails(exercise)}

              <View style={styles.exerciseDetailItem}>
                <Squares2X2Icon size={20} color="#FF3B30" />
                <Text style={styles.detailLabel}>Series</Text>
                <Text style={styles.detailValue}>{exercise.sets || '3'}</Text>
              </View>
            </View>
            
            <View style={styles.actionsContainer}>
              {exercise.instructions && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => toggleInstructions(exercise.id)}
                >
                  <InformationCircleIcon size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>
                    {expandedExercises[exercise.id] ? 'Ocultar Instrucciones' : 'Ver Instrucciones'}
                  </Text>
                  {expandedExercises[exercise.id] ? (
                    <ChevronUpIcon size={16} color="#007AFF" />
                  ) : (
                    <ChevronDownIcon size={16} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              
              {exercise.hasPoseCorrection && (
                <TouchableOpacity 
                  style={styles.poseCorrectionButton}
                  onPress={() => activatePoseCorrection(exercise)}
                >
                  <View style={styles.poseCorrectionContent}>
                    <AdjustmentsHorizontalIcon size={20} color="#FFFFFF" />
                    <Text style={styles.poseCorrectionButtonText}>Activar Corrección Postural</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            
            {expandedExercises[exercise.id] && exercise.instructions && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Instrucciones:</Text>
                {exercise.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Text style={styles.instructionNumber}>{index + 1}</Text>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        
        {/* Espacio extra al final para evitar que el último elemento se oculte detrás de los botones fijos */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Botones para navegación, fijos en la parte inferior */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity 
          style={[styles.navigationButton, styles.homeButtonBottom]}
          onPress={navigateToHome}
        >
          <View style={styles.navigationButtonContent}>
            <HomeIcon size={20} color="#FFFFFF" />
            <Text style={styles.navigationButtonText}>Inicio</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navigationButton, styles.questionnaireButton]}
          onPress={navigateToQuestionnaire}
        >
          <View style={styles.navigationButtonContent}>
            <ClipboardDocumentListIcon size={20} color="#FFFFFF" />
            <Text style={styles.navigationButtonText}>Cuestionario</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 20,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 20,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  headerContainer: {
    backgroundColor: '#007AFF',
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  routineName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    // Animación de aparición
    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 28,
    marginRight: 10,
    fontSize: 14,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  videoButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '500',
    fontSize: 13,
  },
  exerciseDescription: {
    color: '#636366',
    marginBottom: 12,
    lineHeight: 20,
  },
  targetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 45, 85, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  targetsText: {
    fontSize: 13,
    color: '#636366',
    marginLeft: 4,
  },
  targetsMuscles: {
    fontWeight: '600',
    color: '#FF2D55',
  },
  exerciseTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 86, 214, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  exerciseTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5856D6',
    marginLeft: 4,
  },
  exerciseDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  exerciseDetailItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  detailLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#8E8E93',
  },
  detailValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  actionsContainer: {
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  actionButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  poseCorrectionButton: {
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  poseCorrectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#5856D6',
    borderRadius: 10,
  },
  poseCorrectionButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
  instructionsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1C1C1E',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    marginRight: 10,
    lineHeight: 24,
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    color: '#3A3A3C',
    lineHeight: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 5,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  messageIcon: {
    marginRight: 10,
  },
  messageText: {
    color: '#FF9500',
    flex: 1,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100, // Espacio para evitar que el contenido quede detrás de los botones fijos
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(242, 242, 247, 0.95)', // Semi-transparente para efecto de vidrio esmerilado
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  navigationButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  homeButtonBottom: {
    marginRight: 8,
    backgroundColor: '#007AFF',
  },
  questionnaireButton: {
    marginLeft: 8,
    backgroundColor: '#FF9500',
  },
  navigationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  navigationButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RoutineScreen;