import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const SquatCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [squatPhase, setSquatPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer sentadillas');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    kneeAlignment: 0,
    shoulderAlignment: 0,
    backPosture: 0,
    kneeOverFeet: 0,
    depthIssues: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidKneeAngle, setLastValidKneeAngle] = useState(170);
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio de sentadillas, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara a una distancia donde se vea todo tu cuerpo, desde los pies hasta la cabeza.\n\n" +
    "2. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "3. Ponte de lado (perfil) para que se vean claramente tus rodillas, caderas y espalda.\n\n" +
    "4. Mantén visible todo tu cuerpo durante el ejercicio, sin salirte del encuadre.\n\n" +
    "5. Usa ropa que contraste con el fondo para mejorar la detección.";

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
      pose.leftAnkle, pose.rightAnkle,
      pose.leftShoulder, pose.rightShoulder
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA SENTADILLAS
    analyzeSquatForm(pose);
  };

  const analyzeSquatForm = (pose) => {
    // Calcular ángulos importantes para la sentadilla
    const leftKneeAngle = calculateAngle(
      pose.leftHip, 
      pose.leftKnee, 
      pose.leftAnkle
    );
    
    const rightKneeAngle = calculateAngle(
      pose.rightHip, 
      pose.rightKnee, 
      pose.rightAnkle
    );
    
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    // Filtrar lecturas incorrectas/ruido
    // Si hay un cambio demasiado brusco, podría ser un error de detección
    const angleChange = Math.abs(avgKneeAngle - lastValidKneeAngle);
    if (angleChange > 30 && consecutiveCorrectFrames < 3) {
      // Probablemente es ruido, ignoramos esta lectura
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidKneeAngle(avgKneeAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Cálculo de ángulo de espalda (usando hombros y cadera)
    const backAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftHip,
      pose.leftKnee
    );

    // Verificar alineación de rodillas (si están a la misma altura)
    const kneeYDiff = Math.abs(pose.leftKnee.y - pose.rightKnee.y);
    const kneesAligned = kneeYDiff < 30;

    // Verificar alineación de hombros
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 30;
    
    // Verificar si las rodillas están por delante de los pies (problema común)
    const leftKneeToAnkleX = pose.leftKnee.x - pose.leftAnkle.x;
    const rightKneeToAnkleX = pose.rightKnee.x - pose.rightAnkle.x;
    const kneesOverFeet = Math.abs(leftKneeToAnkleX) < 50 && Math.abs(rightKneeToAnkleX) < 50;

    // Lógica para determinar la fase de la sentadilla con mayor robustez
    let updatedSquatPhase = squatPhase;
    
    // Necesitamos varios frames consecutivos válidos para confirmar un cambio de fase
    if (consecutiveCorrectFrames >= 3) {
      if (avgKneeAngle < 120 && !repInProgress) {
        // Comenzando una sentadilla
        updatedSquatPhase = 'down';
        setRepInProgress(true);
      } else if (avgKneeAngle > 160 && repInProgress && squatPhase === 'down') {
        // Completó la sentadilla
        updatedSquatPhase = 'up';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta
        const correctForm = kneesAligned && shouldersAligned && kneesOverFeet && backAngle > 145;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (squatPhase === 'none' && avgKneeAngle > 160) {
        // Posición inicial
        updatedSquatPhase = 'up';
      }
    }
    
    if (updatedSquatPhase !== squatPhase) {
      setSquatPhase(updatedSquatPhase);
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    if (avgKneeAngle < 90) {
      feedbackMessage = 'No bajes demasiado, mantén las rodillas por encima de 90 grados';
      poseCorrect = false;
      currentIssues.depthIssues += 1;
    } else if (!shouldersAligned) {
      feedbackMessage = 'Mantén los hombros nivelados';
      poseCorrect = false;
      currentIssues.shoulderAlignment += 1;
    } else if (!kneesAligned) {
      feedbackMessage = 'Alinea tus rodillas al mismo nivel';
      poseCorrect = false;
      currentIssues.kneeAlignment += 1;
    } else if (!kneesOverFeet) {
      feedbackMessage = 'Cuidado: tus rodillas están demasiado adelante de tus pies';
      poseCorrect = false;
      currentIssues.kneeOverFeet += 1;
    } else if (backAngle < 140) {
      feedbackMessage = 'Mantén la espalda más recta';
      poseCorrect = false;
      currentIssues.backPosture += 1;
    } else if (avgKneeAngle < 130 && avgKneeAngle > 100 && squatPhase === 'down') {
      feedbackMessage = 'Buena posición, mantén el equilibrio';
      poseCorrect = true;
    } else if (avgKneeAngle > 160) {
      feedbackMessage = 'Buena posición de inicio';
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
      summaryFeedback = '¡Excelente! Has completado 5 sentadillas con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'kneeAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén tus rodillas alineadas y apuntando en la misma dirección que tus pies.\n\n';
      } else if (issues[0][0] === 'shoulderAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener los hombros nivelados durante todo el movimiento.\n\n';
      } else if (issues[0][0] === 'backPosture' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener la espalda recta durante la sentadilla.\n\n';
      } else if (issues[0][0] === 'kneeOverFeet' && issues[0][1] > 0) {
        summaryFeedback += '• Cuida que tus rodillas no sobrepasen la punta de tus pies.\n\n';
      } else if (issues[0][0] === 'depthIssues' && issues[0][1] > 0) {
        summaryFeedback += '• Controla la profundidad de tu sentadilla para no bajar demasiado.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'kneeAlignment') {
          summaryFeedback += '• También presta atención a la alineación de tus rodillas.\n\n';
        } else if (issues[1][0] === 'shoulderAlignment') {
          summaryFeedback += '• También trabaja en mantener los hombros nivelados.\n\n';
        } else if (issues[1][0] === 'backPosture') {
          summaryFeedback += '• No olvides mantener la espalda recta durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'kneeOverFeet') {
          summaryFeedback += '• Recuerda mantener las rodillas alineadas con los pies, sin sobrepasarlos.\n\n';
        } else if (issues[1][0] === 'depthIssues') {
          summaryFeedback += '• Controla hasta dónde bajas en la sentadilla.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setSquatPhase('none');
    setFeedback('Prepárate para hacer sentadillas');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      kneeAlignment: 0,
      shoulderAlignment: 0,
      backPosture: 0,
      kneeOverFeet: 0,
      depthIssues: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidKneeAngle(170);
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

export default SquatCorrection;