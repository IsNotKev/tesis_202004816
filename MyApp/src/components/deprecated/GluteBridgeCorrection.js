import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const GluteBridgeCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [bridgePhase, setBridgePhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer puentes de glúteos');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    hipAlignment: 0,     // Cadera nivelada
    hipExtension: 0,     // Extensión adecuada de cadera
    shoulderAlignment: 0, // Hombros alineados
    spineAlignment: 0,   // Columna alineada
    neckPosition: 0      // Posición del cuello
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidHipAngle, setLastValidHipAngle] = useState(170);
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio de puente de glúteos, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara a una distancia donde se vea todo tu cuerpo recostado, desde los pies hasta la cabeza.\n\n" +
    "2. Posiciónate de lado (perfil) para que la cámara pueda ver claramente la elevación de tu cadera.\n\n" +
    "3. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "4. Usa ropa que contraste con el fondo para mejorar la detección.\n\n" +
    "5. Mantén tus pies apoyados en el suelo a la altura de tus caderas durante todo el ejercicio.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para animar el overlay cuando cambia isCorrectPose
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isCorrectPose ? 0.3 : 0.5, // Mayor opacidad para indicaciones incorrectas
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Reset opacity after a short time
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
      pose.leftHip, pose.rightHip, 
      pose.leftKnee, pose.rightKnee, 
      pose.leftShoulder, pose.rightShoulder,
      pose.leftAnkle, pose.rightAnkle
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA PUENTE DE GLÚTEOS
    analyzeGluteBridgeForm(pose);
  };

  const analyzeGluteBridgeForm = (pose) => {
    // Calcular ángulos importantes para el puente de glúteos
    
    // Ángulo de la cadera (hombro-cadera-rodilla)
    const leftHipAngle = calculateAngle(
      pose.leftShoulder, 
      pose.leftHip, 
      pose.leftKnee
    );
    
    const rightHipAngle = calculateAngle(
      pose.rightShoulder, 
      pose.rightHip, 
      pose.rightKnee
    );
    
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;
    
    // Filtrar lecturas incorrectas/ruido
    const angleChange = Math.abs(avgHipAngle - lastValidHipAngle);
    if (angleChange > 30 && consecutiveCorrectFrames < 3) {
      // Probablemente es ruido, ignoramos esta lectura
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidHipAngle(avgHipAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Verificar alineación de caderas (si están a la misma altura)
    const hipYDiff = Math.abs(pose.leftHip.y - pose.rightHip.y);
    const hipsAligned = hipYDiff < 30;
    
    // Verificar alineación de hombros
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 30;
    
    // Verificar posición del cuello (hombro-oreja)
    const neckAlignment = pose.nose && pose.leftEar && 
                          Math.abs(pose.leftEar.y - pose.nose.y) < 20;
    
    // Verificar alineación de la columna (hombrOS, caderas y rodillas deberían estar alineados)
    const shoulderToHipX = Math.abs((pose.leftShoulder.x + pose.rightShoulder.x)/2 - 
                                  (pose.leftHip.x + pose.rightHip.x)/2);
    const spineAligned = shoulderToHipX < 40;
    
    // Lógica para determinar la fase del puente con mayor robustez
    let updatedBridgePhase = bridgePhase;
    
    // Necesitamos varios frames consecutivos válidos para confirmar un cambio de fase
    if (consecutiveCorrectFrames >= 3) {
      // En el puente de glúteos:
      // - Ángulo grande (>160): posición inicial (cadera abajo)
      // - Ángulo pequeño (~110-140): posición elevada (cadera arriba)
      
      if (avgHipAngle < 140 && !repInProgress) {
        // Cadera elevada - iniciando repetición
        updatedBridgePhase = 'up';
        setRepInProgress(true);
      } else if (avgHipAngle > 160 && repInProgress && bridgePhase === 'up') {
        // Cadera bajada - completó repetición
        updatedBridgePhase = 'down';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta
        const correctForm = hipsAligned && shouldersAligned && spineAligned;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (bridgePhase === 'none' && avgHipAngle > 160) {
        // Posición inicial (acostado)
        updatedBridgePhase = 'down';
      }
    }
    
    if (updatedBridgePhase !== bridgePhase) {
      setBridgePhase(updatedBridgePhase);
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Feedback basado en la postura
    if (!hipsAligned) {
      feedbackMessage = 'Mantén tus caderas niveladas durante el ejercicio';
      poseCorrect = false;
      currentIssues.hipAlignment += 1;
    } else if (!shouldersAligned) {
      feedbackMessage = 'Mantén los hombros nivelados y apoyados firmemente';
      poseCorrect = false;
      currentIssues.shoulderAlignment += 1;
    } else if (!spineAligned) {
      feedbackMessage = 'Mantén tu columna alineada, evita arquear demasiado la espalda';
      poseCorrect = false;
      currentIssues.spineAlignment += 1;
    } else if (!neckAlignment && pose.nose && pose.leftEar) {
      feedbackMessage = 'Mantén tu cuello en posición neutra, mira hacia el techo';
      poseCorrect = false;
      currentIssues.neckPosition += 1;
    } else if (avgHipAngle > 150 && bridgePhase === 'up') {
      feedbackMessage = 'Eleva más tus caderas para activar glúteos';
      poseCorrect = false;
      currentIssues.hipExtension += 1;
    } else if (avgHipAngle < 140 && avgHipAngle > 120 && bridgePhase === 'up') {
      feedbackMessage = '¡Excelente elevación! Aprieta tus glúteos';
      poseCorrect = true;
    } else if (avgHipAngle > 160 && bridgePhase === 'down') {
      feedbackMessage = 'Buena posición de inicio, prepárate para elevar';
      poseCorrect = true;
    }
    
    // Actualizar registro de problemas posturales
    setPosturalIssues(currentIssues);
    
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
      summaryFeedback = '¡Excelente! Has completado 5 puentes de glúteos con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'hipAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén tus caderas niveladas durante todo el movimiento para trabajar ambos glúteos por igual.\n\n';
      } else if (issues[0][0] === 'hipExtension' && issues[0][1] > 0) {
        summaryFeedback += '• Eleva más tus caderas para lograr una completa extensión y activar mejor los glúteos.\n\n';
      } else if (issues[0][0] === 'shoulderAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Asegúrate de mantener los hombros firmemente apoyados en el suelo durante todo el ejercicio.\n\n';
      } else if (issues[0][0] === 'spineAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Evita arquear demasiado la espalda baja. Mantén la columna en posición neutra.\n\n';
      } else if (issues[0][0] === 'neckPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén tu cuello y cabeza en posición neutra, mirando hacia el techo, sin tensión.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'hipAlignment') {
          summaryFeedback += '• También presta atención a mantener las caderas niveladas para un trabajo equilibrado.\n\n';
        } else if (issues[1][0] === 'hipExtension') {
          summaryFeedback += '• Recuerda elevar completamente la cadera para activar mejor los glúteos.\n\n';
        } else if (issues[1][0] === 'shoulderAlignment') {
          summaryFeedback += '• No olvides mantener ambos hombros bien apoyados en el suelo.\n\n';
        } else if (issues[1][0] === 'spineAlignment') {
          summaryFeedback += '• Trabaja en mantener una posición neutra de la columna durante el ejercicio.\n\n';
        } else if (issues[1][0] === 'neckPosition') {
          summaryFeedback += '• Cuida la posición de tu cuello para evitar tensiones innecesarias.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica. Concentra tu atención en apretar los glúteos en la posición elevada.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setBridgePhase('none');
    setFeedback('Prepárate para hacer puentes de glúteos');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      hipAlignment: 0,
      hipExtension: 0,
      shoulderAlignment: 0,
      spineAlignment: 0,
      neckPosition: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidHipAngle(170);
    setRepInProgress(false);
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

export default GluteBridgeCorrection;