import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Linking, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { 
  ArrowLeftIcon, 
  PlayCircleIcon,
  BoltIcon,
  FireIcon,
  UserIcon,
  VideoCameraIcon,
  CameraIcon, 
  CubeIcon
} from 'react-native-heroicons/solid';

const ExerciseDetailScreen = ({ navigation, route }) => {
  
  const { exercise } = route.params;
  const [showFullDescription, setShowFullDescription] = useState(false);

  

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      poseCorrection: exercise.poseCorrection,
    });
  }, [navigation, exercise.poseCorrection]);

  const openVideoLink = async () => {
    Linking.openURL(exercise.videoLink).catch(err => {
      console.error('Error al abrir el enlace:', err);
      // Puedes mostrar una alerta al usuario aquí
      Alert.alert('Error', 'No se pudo abrir el enlace de video');
    });
  };

  // Función para determinar el color según el grupo muscular
  const getMuscleGroupColor = (muscleGroup) => {
    const colors = {
      'Pecho': '#ef4444',
      'Espalda': '#f97316',
      'Piernas': '#22c55e',
      'Hombros': '#3b82f6',
      'Brazos': '#8b5cf6',
      'Abdominales': '#ec4899',
      'Glúteos': '#f43f5e',
    };
    return colors[muscleGroup] || '#6b7280';
  };

  // Color de fondo según el grupo muscular
  const bgColor = getMuscleGroupColor(exercise.muscleGroup);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header con imagen */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon size={20} color="#FFF" />
        </TouchableOpacity>
        
        {exercise.image ? (
          <Image source={exercise.image} style={styles.exerciseImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <FireIcon size={60} color="#FFF" />
          </View>
        )}
        
        <Text style={styles.title}>{exercise.name}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Detalles del ejercicio */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <UserIcon size={24} color={bgColor} />
              <Text style={styles.infoLabel}>Músculo</Text>
              <Text style={styles.infoValue}>{exercise.muscleGroup}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <BoltIcon size={24} color={bgColor} />
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>{exercise.type}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <CubeIcon size={24} color={bgColor} />
              <Text style={styles.infoLabel}>Equipo</Text>
              <Text style={styles.infoValue}>{exercise.equipment}</Text>
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>
              {showFullDescription 
                ? exercise.description 
                : exercise.description.length > 150 
                  ? `${exercise.description.substring(0, 150)}...` 
                  : exercise.description
              }
            </Text>
            {exercise.description.length > 150 && (
              <TouchableOpacity 
                onPress={() => setShowFullDescription(!showFullDescription)}
                style={styles.readMoreButton}
              >
                <Text style={[styles.readMoreText, {color: bgColor}]}>
                  {showFullDescription ? 'Leer menos' : 'Leer más'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Video tutorial */}
          {exercise.videoLink && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Tutorial en video</Text>
              <TouchableOpacity 
                style={[styles.videoButton, {backgroundColor: bgColor}]} 
                onPress={openVideoLink}
              >
                <VideoCameraIcon size={24} color="#FFF" />
                <Text style={styles.videoButtonText}>Ver tutorial</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pose correction */}
          {exercise.hasPoseCorrection && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Corrección de postura</Text>
              <Text style={styles.description}>
                Utiliza la cámara para verificar tu postura durante el ejercicio.
              </Text>
              <TouchableOpacity 
                style={[styles.poseButton, {backgroundColor: bgColor}]} 
                onPress={() => navigation.navigate('PoseCorrection', { exercise })}
              >
                <CameraIcon size={24} color="#FFF" />
                <Text style={styles.videoButtonText}>Verificar postura</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Instrucciones de ejecución */}
          {exercise.instructions && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Instrucciones</Text>
              <View style={styles.instructionsList}>
                {exercise.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={[styles.instructionNumber, {backgroundColor: bgColor}]}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Espacio al final para scroll */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Botón flotante para ejercicios con corrección */}
      {exercise.hasPoseCorrection && (
        <TouchableOpacity 
          style={[styles.floatingButton, {backgroundColor: bgColor}]}
          onPress={() => navigation.navigate('PoseCorrection', { exercise })}
        >
          <PlayCircleIcon size={24} color="#FFF" />
          <Text style={styles.floatingButtonText}>Iniciar ejercicio</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    height: 250,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.6,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    padding: 16,
  },
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  videoButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  poseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  instructionsList: {
    marginTop: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default ExerciseDetailScreen;