import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const CrunchCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [exercisePhase, setExercisePhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer abdominales crunch');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    neckPosition: 0,
    elbowPlacement: 0,
    legPosition: 0,
    incompleteMovement: 0,
    lowerBackArch: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidTorsoAngle, setLastValidTorsoAngle] = useState(160);
  const [repInProgress, setRepInProgress] = useState(false);
  const [hasInitialPose, setHasInitialPose] = useState(false);
  const [initialPoseTimer, setInitialPoseTimer] = useState(0);
  const [isInUpPosition, setIsInUpPosition] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante los abdominales crunch, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara en un lateral, a una distancia donde se pueda ver todo tu cuerpo acostado.\n\n" +
    "2. Acuéstate boca arriba con las rodillas flexionadas y los pies apoyados en el suelo.\n\n" +
    "3. Coloca las manos detrás de la cabeza o cruzadas sobre el pecho.\n\n" +
    "4. Asegúrate de tener buena iluminación y un fondo que contraste con tu ropa.\n\n" +
    "5. Mantente dentro del encuadre durante todo el ejercicio, sin bloquear la vista de tu torso.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para animar el overlay cuando cambia isCorrectPose
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isCorrectPose ? 0.3 : 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    const timer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isCorrectPose]);

  const onPoseDetected = (poses) => {
    if (!poses || poses.length === 0) return;
    
    const pose = poses[0]?.pose;
    
    // Verificar que tenemos todos los keypoints necesarios con suficiente confianza
    const keypoints = [
      pose.leftShoulder, pose.rightShoulder,
      pose.leftHip, pose.rightHip,
      pose.leftKnee, pose.rightKnee,
      pose.leftEar, pose.rightEar
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA ABDOMINALES CRUNCH
    analyzeCrunchForm(pose);
  };

  const analyzeCrunchForm = (pose) => {
    // Calcular el ángulo del torso (usando hombros, caderas y rodillas)
    const leftTorsoAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftHip,
      pose.leftKnee
    );
    
    const rightTorsoAngle = calculateAngle(
      pose.rightShoulder,
      pose.rightHip,
      pose.rightKnee
    );
    
    const avgTorsoAngle = (leftTorsoAngle + rightTorsoAngle) / 2;
    
    // Calcular el ángulo del cuello
    const neckAngle = calculateAngle(
      pose.leftEar,
      pose.leftShoulder,
      pose.leftHip
    );
    
    // Calcular el ángulo de las rodillas
    const leftKneeAngle = calculateAngle(
      pose.leftHip,
      pose.leftKnee,
      pose.leftAnkle || { x: pose.leftKnee.x, y: pose.leftKnee.y + 100 }
    );
    
    const rightKneeAngle = calculateAngle(
      pose.rightHip,
      pose.rightKnee,
      pose.rightAnkle || { x: pose.rightKnee.x, y: pose.rightKnee.y + 100 }
    );
    
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    // Verificar alineación de hombros (más permisiva)
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 50; // Más tolerante
    
    // Establecer pose inicial con más tiempo de espera
    if (!hasInitialPose) {
      setInitialPoseTimer(prev => prev + 1);
      
      if (initialPoseTimer > 45) { // Aproximadamente 1.5 segundos a 30fps
        setHasInitialPose(true);
        setFeedback('¡Perfecto! Ahora puedes comenzar con los crunches');
      } else {
        const secondsLeft = Math.ceil((45 - initialPoseTimer) / 15);
        setFeedback(`Mantén la posición... ${secondsLeft} segundos restantes`);
        return;
      }
    }
    
    // Filtros más permisivos para ruido
    const angleChange = Math.abs(avgTorsoAngle - lastValidTorsoAngle);
    if (angleChange > 50 && consecutiveCorrectFrames < 2) { // Más tolerante
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidTorsoAngle(avgTorsoAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Lógica simplificada para contar repeticiones
    let updatedExercisePhase = exercisePhase;
    
    // Solo necesitamos 2 frames consecutivos (más permisivo)
    if (consecutiveCorrectFrames >= 2) {
      
      // Detectar cuando está en posición elevada (contracción)
      if (avgTorsoAngle < 140 && !isInUpPosition) { // Más permisivo: era 130
        setIsInUpPosition(true);
        updatedExercisePhase = 'up';
        setFeedback('¡Muy bien! Mantén la contracción');
      }
      
      // Detectar cuando regresa a posición inicial (extensión)
      else if (avgTorsoAngle > 150 && isInUpPosition) { // Más permisivo: era 145
        setIsInUpPosition(false);
        updatedExercisePhase = 'down';
        setRepCount(prev => prev + 1);
        
        // Verificar forma (criterios más permisivos)
        const neckOk = neckAngle > 110; // Era 120, ahora más permisivo
        const kneesOk = avgKneeAngle < 130; // Era 120, ahora más permisivo
        const correctForm = shouldersAligned && neckOk && kneesOk;
        
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
        
        setFeedback(`¡Repetición ${repCount + 1} completada! Muy bien`);
      }
      
      // Posición inicial
      else if (exercisePhase === 'none' && avgTorsoAngle > 150) {
        updatedExercisePhase = 'down';
      }
    }
    
    if (updatedExercisePhase !== exercisePhase) {
      setExercisePhase(updatedExercisePhase);
    }
    
    // Feedback más alentador y menos crítico
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Solo dar feedback correctivo cada ciertos frames para no abrumar
    const shouldGiveFeedback = consecutiveCorrectFrames % 10 === 0;
    
    if (neckAngle < 110 && shouldGiveFeedback) {
      feedbackMessage = 'Intenta relajar un poco más el cuello';
      poseCorrect = false;
      currentIssues.neckPosition += 1;
    } else if (avgKneeAngle > 130 && shouldGiveFeedback) {
      feedbackMessage = 'Puedes flexionar un poco más las rodillas';
      poseCorrect = false;
      currentIssues.legPosition += 1;
    } else if (!shouldersAligned && shouldGiveFeedback) {
      feedbackMessage = 'Intenta mantener los hombros nivelados';
      poseCorrect = false;
      currentIssues.elbowPlacement += 1;
    } else if (isInUpPosition && avgTorsoAngle > 135) {
      feedbackMessage = 'Puedes elevar un poco más el torso';
      poseCorrect = false;
      currentIssues.incompleteMovement += 1;
    } else if (exercisePhase === 'up' && isInUpPosition) {
      feedbackMessage = '¡Excelente contracción! Mantén la posición';
      poseCorrect = true;
    } else if (exercisePhase === 'down' && !isInUpPosition) {
      feedbackMessage = 'Perfecto, ahora sube para el siguiente crunch';
      poseCorrect = true;
    } else {
      // Feedback neutral cuando todo está bien
      feedbackMessage = `Repeticiones: ${repCount}/${totalReps} - ¡Sigue así!`;
      poseCorrect = true;
    }
    
    // Solo actualizar issues si hay problemas reales
    if (!poseCorrect) {
      setPosturalIssues(currentIssues);
    }
    
    setFeedback(feedbackMessage);
    setIsCorrectPose(poseCorrect);
    
    // Verificar si se ha completado el ejercicio
    if (repCount >= totalReps && !isCompleted) {
      setIsCompleted(true);
      generateSummaryFeedback();
    }
  };

  const generateSummaryFeedback = () => {
    // Encontrar los problemas más frecuentes
    const issues = Object.entries(posturalIssues).sort((a, b) => b[1] - a[1]);
    
    let summaryFeedback = '';
    
    // Calificación general basada en repeticiones correctas
    if (correctPostureCount >= 4) {
      summaryFeedback = '¡Excelente! Has completado 5 abdominales crunch con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'neckPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén el cuello relajado, con un espacio entre la barbilla y el pecho. Concéntrate en mirar hacia el techo, no hacia tus pies.\n\n';
      } else if (issues[0][0] === 'elbowPlacement' && issues[0][1] > 0) {
        summaryFeedback += '• Asegúrate de mantener los codos abiertos y no usar los brazos para tirar del cuello durante el ejercicio.\n\n';
      } else if (issues[0][0] === 'legPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén las rodillas flexionadas en un ángulo de 90 grados para proteger la zona lumbar durante el ejercicio.\n\n';
      } else if (issues[0][0] === 'incompleteMovement' && issues[0][1] > 0) {
        summaryFeedback += '• Asegúrate de elevar el torso lo suficiente para activar correctamente los músculos abdominales.\n\n';
      } else if (issues[0][0] === 'lowerBackArch' && issues[0][1] > 0) {
        summaryFeedback += '• Evita arquear la espalda baja. Mantén el ombligo hacia dentro para proteger la columna.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'neckPosition') {
          summaryFeedback += '• También trabaja en mantener una posición neutral del cuello durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'elbowPlacement') {
          summaryFeedback += '• Recuerda mantener los codos abiertos para no sobrecargar el cuello.\n\n';
        } else if (issues[1][0] === 'legPosition') {
          summaryFeedback += '• No olvides mantener las piernas en la posición correcta para maximizar el trabajo abdominal.\n\n';
        } else if (issues[1][0] === 'incompleteMovement') {
          summaryFeedback += '• Intenta elevar más el torso en cada repetición para un trabajo más efectivo.\n\n';
        } else if (issues[1][0] === 'lowerBackArch') {
          summaryFeedback += '• Presta atención a no despegar la zona lumbar del suelo durante el ejercicio.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la calidad es más importante que la cantidad. Concéntrate en sentir la contracción abdominal en cada repetición.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setExercisePhase('none');
    setFeedback('Prepárate para hacer abdominales crunch');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      neckPosition: 0,
      elbowPlacement: 0,
      legPosition: 0,
      incompleteMovement: 0,
      lowerBackArch: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidTorsoAngle(160);
    setRepInProgress(false);
    setHasInitialPose(false);
    setInitialPoseTimer(0);
    setIsInUpPosition(false);
  };

  return (
    <PoseVisualization
      onPoseDetected={onPoseDetected}
      repCount={repCount}
      feedback={feedback}
      isCorrectPose={isCorrectPose}
      isCompleted={isCompleted}
      totalReps={totalReps}
      resetExercise={resetExercise}
      overlayOpacity={overlayOpacity}
      instructionsText={instructionsText}
      onFlipCamera={handleFlipCamera}
      isBackCamera={isBackCamera}
    />
  );
};

export default CrunchCorrection;