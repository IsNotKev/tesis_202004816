import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const ArmCirclesCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [circlePhase, setCirclePhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer círculos con los brazos');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armAlignment: 0,
    shoulderPosture: 0,
    circleSize: 0,
    bodyStability: 0,
    movementSynchronization: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones (SIMILAR A SENTADILLAS)
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidArmAngle, setLastValidArmAngle] = useState(90); // Ángulo inicial brazo horizontal
  const [repInProgress, setRepInProgress] = useState(false);
  const [hasReachedTop, setHasReachedTop] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  
  // Tiempo de inicialización para que el usuario se posicione
  const [initializationTime, setInitializationTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio de círculos con brazos, sigue estas instrucciones:\n\n" +
    "1. Colócate frente a la cámara a una distancia donde todo tu cuerpo superior sea visible.\n\n" +
    "2. Mantén los pies separados al ancho de tus hombros para estabilidad.\n\n" +
    "3. Comienza con los brazos a los costados y realiza círculos amplios hacia adelante.\n\n" +
    "4. Asegúrate de tener buena iluminación y espacio suficiente para extender completamente los brazos.\n\n" +
    "5. Espera 3 segundos en posición inicial antes de comenzar el ejercicio.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para el tiempo de inicialización
  useEffect(() => {
    const timer = setInterval(() => {
      setInitializationTime(prev => {
        if (prev >= 3) {
          setIsInitialized(true);
          clearInterval(timer);
          return prev;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

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
      pose.leftElbow, pose.rightElbow,
      pose.leftWrist, pose.rightWrist,
      pose.leftHip, pose.rightHip,
      pose.nose
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      return;
    }

    // Mostrar tiempo de inicialización
    if (!isInitialized) {
      const remainingTime = Math.ceil(3 - initializationTime);
      setFeedback(`Mantente en posición inicial. Comenzando en ${remainingTime}...`);
      return;
    }

    // LÓGICA ESPECÍFICA PARA CÍRCULOS CON BRAZOS
    analyzeArmCirclesForm(pose);
  };

  const analyzeArmCirclesForm = (pose) => {
    // Calcular ángulo del brazo (usamos el brazo derecho como referencia principal)
    // Ángulo entre hombro-codo-muñeca para ver la extensión
    const rightElbowAngle = calculateAngle(
      pose.rightShoulder,
      pose.rightElbow,
      pose.rightWrist
    );
    
    const leftElbowAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftElbow,
      pose.leftWrist
    );
    
    // Ángulo del hombro (elevación del brazo) - similar a la lógica de sentadillas
    const rightShoulderAngle = calculateAngle(
      pose.rightHip,
      pose.rightShoulder,
      pose.rightWrist // Usamos muñeca directa para mejor detección
    );
    
    const leftShoulderAngle = calculateAngle(
      pose.leftHip,
      pose.leftShoulder,
      pose.leftWrist
    );
    
    // Promedio de ángulos para mayor estabilidad
    const avgShoulderAngle = (rightShoulderAngle + leftShoulderAngle) / 2;
    const avgElbowAngle = (rightElbowAngle + leftElbowAngle) / 2;
    
    // Filtrar lecturas incorrectas/ruido (IGUAL QUE EN SENTADILLAS)
    const angleChange = Math.abs(avgShoulderAngle - lastValidArmAngle);
    if (angleChange > 40 && consecutiveCorrectFrames < 3) {
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidArmAngle(avgShoulderAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Verificar extensión de brazos
    const armsExtended = avgElbowAngle > 150;
    
    // Verificar postura del cuerpo
    const shoulderYDiff = Math.abs(pose.leftShoulder.y - pose.rightShoulder.y);
    const shouldersAligned = shoulderYDiff < 30;
    
    // Verificar que los hombros no estén encogidos
    const shouldersRelaxed = 
      pose.nose.y < pose.leftShoulder.y - 40 && 
      pose.nose.y < pose.rightShoulder.y - 40;
    
    // Sincronización de brazos
    const armsInSync = Math.abs(leftShoulderAngle - rightShoulderAngle) < 30;
    
    // LÓGICA DE DETECCIÓN DE CÍRCULO COMPLETO (SIMILAR A SENTADILLAS)
    let updatedCirclePhase = circlePhase;
    
    if (consecutiveCorrectFrames >= 3) {
      // Brazo arriba (ángulo pequeño - brazo elevado)
      if (avgShoulderAngle < 30 && !hasReachedTop) {
        setHasReachedTop(true);
        updatedCirclePhase = 'top';
        if (!repInProgress) {
          setRepInProgress(true);
        }
      }
      // Brazo abajo (ángulo grande - brazo hacia abajo)
      else if (avgShoulderAngle > 150 && hasReachedTop && !hasReachedBottom) {
        setHasReachedBottom(true);
        updatedCirclePhase = 'bottom';
      }
      // Completó el círculo (volvió arriba después de haber pasado por abajo)
      else if (avgShoulderAngle < 30 && hasReachedTop && hasReachedBottom && repInProgress) {
        // CÍRCULO COMPLETO DETECTADO
        updatedCirclePhase = 'completed';
        setRepCount(prev => prev + 1);
        
        // Verificar si la forma fue correcta
        const correctForm = armsExtended && shouldersAligned && shouldersRelaxed && armsInSync;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
        
        // Resetear para el próximo círculo
        setRepInProgress(false);
        setHasReachedTop(false);
        setHasReachedBottom(false);
      }
      // Posición lateral/inicial (ángulo medio)
      else if (avgShoulderAngle > 70 && avgShoulderAngle < 110 && !repInProgress) {
        updatedCirclePhase = 'ready';
      }
    }
    
    if (updatedCirclePhase !== circlePhase) {
      setCirclePhase(updatedCirclePhase);
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Priorizar feedback por gravedad de los problemas
    if (!shouldersAligned) {
      feedbackMessage = 'Mantén tu cuerpo recto, no te inclines a los lados';
      poseCorrect = false;
      currentIssues.bodyStability += 1;
    } else if (!shouldersRelaxed) {
      feedbackMessage = 'Relaja los hombros, no los encorves';
      poseCorrect = false;
      currentIssues.shoulderPosture += 1;
    } else if (!armsInSync) {
      feedbackMessage = 'Sincroniza ambos brazos, deben moverse juntos';
      poseCorrect = false;
      currentIssues.movementSynchronization += 1;
    } else if (!armsExtended) {
      feedbackMessage = 'Mantén los brazos extendidos durante todo el movimiento';
      poseCorrect = false;
      currentIssues.armAlignment += 1;
    } else if (avgShoulderAngle > 40 && avgShoulderAngle < 140 && repInProgress) {
      feedbackMessage = 'Haz círculos más amplios, eleva más los brazos';
      poseCorrect = false;
      currentIssues.circleSize += 1;
    } else if (updatedCirclePhase === 'top') {
      feedbackMessage = 'Excelente, continúa el círculo hacia abajo';
      poseCorrect = true;
    } else if (updatedCirclePhase === 'bottom') {
      feedbackMessage = 'Bien, ahora completa el círculo hacia arriba';
      poseCorrect = true;
    } else if (updatedCirclePhase === 'completed') {
      feedbackMessage = '¡Círculo completado! Continúa con el siguiente';
      poseCorrect = true;
    } else if (updatedCirclePhase === 'ready' || avgShoulderAngle > 70 && avgShoulderAngle < 110) {
      feedbackMessage = 'Buena posición inicial, comienza el círculo elevando los brazos';
      poseCorrect = true;
    } else {
      feedbackMessage = 'Mantén los brazos en posición para comenzar';
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
      summaryFeedback = '¡Excelente! Has completado 5 círculos con los brazos con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'armAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén los brazos rectos y extendidos durante todo el movimiento circular.\n\n';
      } else if (issues[0][0] === 'shoulderPosture' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener los hombros relajados y en posición neutral.\n\n';
      } else if (issues[0][0] === 'circleSize' && issues[0][1] > 0) {
        summaryFeedback += '• Intenta hacer círculos más amplios, elevando más los brazos.\n\n';
      } else if (issues[0][0] === 'bodyStability' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén tu cuerpo estable y erguido durante el ejercicio.\n\n';
      } else if (issues[0][0] === 'movementSynchronization' && issues[0][1] > 0) {
        summaryFeedback += '• Mejora la sincronización de ambos brazos.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'armAlignment') {
          summaryFeedback += '• También enfócate en mantener los brazos extendidos.\n\n';
        } else if (issues[1][0] === 'shoulderPosture') {
          summaryFeedback += '• No olvides mantener una buena postura de hombros.\n\n';
        } else if (issues[1][0] === 'circleSize') {
          summaryFeedback += '• Trabaja en aumentar la amplitud de tus círculos.\n\n';
        } else if (issues[1][0] === 'bodyStability') {
          summaryFeedback += '• Recuerda mantener tu cuerpo estable.\n\n';
        } else if (issues[1][0] === 'movementSynchronization') {
          summaryFeedback += '• Presta atención a la sincronización de ambos brazos.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Practicar este ejercicio regularmente mejorará la movilidad de tus hombros.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setCirclePhase('none');
    setFeedback('Prepárate para hacer círculos con los brazos');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      armAlignment: 0,
      shoulderPosture: 0,
      circleSize: 0,
      bodyStability: 0,
      movementSynchronization: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidArmAngle(90);
    setRepInProgress(false);
    setHasReachedTop(false);
    setHasReachedBottom(false);
    setInitializationTime(0);
    setIsInitialized(false);
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

export default ArmCirclesCorrection;