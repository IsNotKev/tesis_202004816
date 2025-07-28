import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const PushUpCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [pushupPhase, setPushupPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer flexiones de brazos');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    bodyAlignment: 0,    // Alineación corporal (cabeza-espalda-cadera)
    elbowPosition: 0,    // Posición de codos
    depthIssues: 0,      // Profundidad de la flexión
    hipSagging: 0,       // Cadera caída
    neckPosition: 0      // Posición del cuello
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [lastValidElbowAngle, setLastValidElbowAngle] = useState(170);
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante las flexiones de brazos, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara a un lado, a una distancia donde se vea todo tu cuerpo de perfil.\n\n" +
    "2. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "3. Mantén tu cuerpo completamente visible durante todo el ejercicio.\n\n" +
    "4. Usa ropa que contraste con el fondo para mejorar la detección.\n\n" +
    "5. Si la cámara no detecta bien tu posición, prueba a cambiar ligeramente el ángulo de la cámara.";

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
      pose.leftShoulder, pose.rightShoulder,
      pose.leftElbow, pose.rightElbow,
      pose.leftWrist, pose.rightWrist,
      pose.leftHip, pose.rightHip,
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

    // LÓGICA ESPECÍFICA PARA FLEXIONES DE BRAZOS
    analyzePushUpForm(pose);
  };

  const analyzePushUpForm = (pose) => {
    // Calcular ángulos importantes para las flexiones
    
    // Ángulo del codo (hombro-codo-muñeca)
    const leftElbowAngle = calculateAngle(
      pose.leftShoulder, 
      pose.leftElbow, 
      pose.leftWrist
    );
    
    const rightElbowAngle = calculateAngle(
      pose.rightShoulder, 
      pose.rightElbow, 
      pose.rightWrist
    );
    
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
    
    // Filtrar lecturas incorrectas/ruido
    const angleChange = Math.abs(avgElbowAngle - lastValidElbowAngle);
    if (angleChange > 30 && consecutiveCorrectFrames < 3) {
      // Probablemente es ruido, ignoramos esta lectura
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    setLastValidElbowAngle(avgElbowAngle);
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Ángulo de alineación del cuerpo (hombro-cadera-tobillo)
    const bodyAngle = calculateAngle(
      pose.leftShoulder, 
      pose.leftHip, 
      pose.leftAnkle
    );
    
    // Verificar alineación del cuerpo
    const isBodyAligned = Math.abs(bodyAngle - 170) < 15; // Debe estar cerca de 170° para alineación correcta
    
    // Verificar si la cadera está caída
    const shoulderToHipY = pose.leftShoulder.y - pose.leftHip.y;
    const hipToAnkleY = pose.leftHip.y - pose.leftAnkle.y;
    const isHipSagging = shoulderToHipY / hipToAnkleY > 0.2; // Si la proporción es alta, la cadera está caída
    
    // Verificar posición del cuello (mirar hacia el suelo vs. extender demasiado)
    const neckAligned = pose.nose && pose.leftEar && 
                        Math.abs(pose.nose.y - pose.leftEar.y) < 20;
    
    // Verificar la profundidad adecuada (codos doblados ~90°)
    const properDepth = avgElbowAngle < 110 && avgElbowAngle > 70;
    
    // Lógica para determinar la fase de la flexión
    let updatedPushupPhase = pushupPhase;
    
    // Necesitamos varios frames consecutivos válidos para confirmar un cambio de fase
    if (consecutiveCorrectFrames >= 3) {
      if (avgElbowAngle < 120 && !repInProgress) {
        // Posición baja de la flexión - iniciando repetición
        updatedPushupPhase = 'down';
        setRepInProgress(true);
      } else if (avgElbowAngle > 160 && repInProgress && pushupPhase === 'down') {
        // Posición elevada - completó la repetición
        updatedPushupPhase = 'up';
        setRepCount(prev => prev + 1);
        setRepInProgress(false);
        
        // Verificar si la forma fue correcta durante toda la repetición
        const correctForm = isBodyAligned && !isHipSagging && neckAligned;
        if (correctForm) {
          setCorrectPostureCount(prev => prev + 1);
        }
      } else if (pushupPhase === 'none' && avgElbowAngle > 160) {
        // Posición inicial (plancha alta)
        updatedPushupPhase = 'up';
      }
    }
    
    if (updatedPushupPhase !== pushupPhase) {
      setPushupPhase(updatedPushupPhase);
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Feedback basado en la postura
    if (!isBodyAligned) {
      feedbackMessage = 'Mantén tu cuerpo en línea recta de la cabeza a los talones';
      poseCorrect = false;
      currentIssues.bodyAlignment += 1;
    } else if (isHipSagging) {
      feedbackMessage = 'No dejes caer la cadera, mantén el core activo';
      poseCorrect = false;
      currentIssues.hipSagging += 1;
    } else if (!neckAligned && pose.nose && pose.leftEar) {
      feedbackMessage = 'Mantén la cabeza alineada con tu columna, mira ligeramente hacia adelante';
      poseCorrect = false;
      currentIssues.neckPosition += 1;
    } else if (avgElbowAngle < 70 && pushupPhase === 'down') {
      feedbackMessage = 'No bajes demasiado, puedes lastimar tus hombros';
      poseCorrect = false;
      currentIssues.depthIssues += 1;
    } else if (avgElbowAngle > 120 && avgElbowAngle < 160 && pushupPhase === 'down') {
      feedbackMessage = 'Baja un poco más para completar el movimiento';
      poseCorrect = false;
      currentIssues.depthIssues += 1;
    } else if (Math.abs(leftElbowAngle - rightElbowAngle) > 20) {
      feedbackMessage = 'Mantén ambos brazos trabajando por igual';
      poseCorrect = false;
      currentIssues.elbowPosition += 1;
    } else if (avgElbowAngle > 160 && pushupPhase === 'up') {
      feedbackMessage = 'Buena posición, mantén la espalda recta';
      poseCorrect = true;
    } else if (avgElbowAngle < 110 && avgElbowAngle > 70 && pushupPhase === 'down') {
      feedbackMessage = 'Excelente profundidad, ahora empuja hacia arriba';
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
      summaryFeedback = '¡Excelente! Has completado 5 flexiones con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'bodyAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener tu cuerpo como una línea recta desde la cabeza hasta los talones. Piensa en la posición de plancha.\n\n';
      } else if (issues[0][0] === 'elbowPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Presta atención a la posición de tus codos. Deben doblarse a unos 90 grados y trabajar simétricamente.\n\n';
      } else if (issues[0][0] === 'depthIssues' && issues[0][1] > 0) {
        summaryFeedback += '• Asegúrate de alcanzar la profundidad adecuada: los codos deben formar aproximadamente 90 grados en el punto más bajo.\n\n';
      } else if (issues[0][0] === 'hipSagging' && issues[0][1] > 0) {
        summaryFeedback += '• No dejes caer la cadera durante el ejercicio. Activa tu core para mantener la alineación correcta.\n\n';
      } else if (issues[0][0] === 'neckPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Mantén tu cuello neutral, como una extensión natural de tu columna. Evita mirar demasiado hacia arriba o hacia abajo.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'bodyAlignment') {
          summaryFeedback += '• También trabaja en la alineación general de tu cuerpo para una correcta distribución del esfuerzo.\n\n';
        } else if (issues[1][0] === 'elbowPosition') {
          summaryFeedback += '• Recuerda controlar la posición de tus codos durante todo el movimiento.\n\n';
        } else if (issues[1][0] === 'depthIssues') {
          summaryFeedback += '• Trabaja en la consistencia de la profundidad de tus flexiones para maximizar el beneficio.\n\n';
        } else if (issues[1][0] === 'hipSagging') {
          summaryFeedback += '• Fortalece tu core para evitar que la cadera se caiga durante el ejercicio.\n\n';
        } else if (issues[1][0] === 'neckPosition') {
          summaryFeedback += '• Presta atención a la posición de tu cuello para evitar tensión innecesaria.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica. Considera comenzar con flexiones modificadas contra la pared o de rodillas si la forma completa resulta difícil.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setPushupPhase('none');
    setFeedback('Prepárate para hacer flexiones de brazos');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      bodyAlignment: 0,
      elbowPosition: 0,
      depthIssues: 0,
      hipSagging: 0,
      neckPosition: 0
    });
    setConsecutiveCorrectFrames(0);
    setLastValidElbowAngle(170);
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

export default PushUpCorrection;