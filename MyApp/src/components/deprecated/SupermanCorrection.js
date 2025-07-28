import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const SupermanCorrection = () => {
  const [repCount, setRepCount] = useState(0);
  const [supermanPhase, setSupermanPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer el ejercicio Superman');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctPostureCount, setCorrectPostureCount] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    armExtension: 0,
    legExtension: 0,
    bodyAlignment: 0,
    symmetry: 0,
    neckPosition: 0,
    elevation: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = 5;
  const confidenceThreshold = 0.5;
  const minHoldTime = 30; // Frames necesarios para considerar una repetición válida (aproximadamente 1 segundo)
  
  // Variables de estado para mejor detección de repeticiones
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [holdTimeCounter, setHoldTimeCounter] = useState(0);
  const [repInProgress, setRepInProgress] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio Superman, sigue estas instrucciones:\n\n" +
    "1. Coloca el teléfono a una distancia donde se vea todo tu cuerpo acostado.\n\n" +
    "2. Asegúrate de tener buena iluminación sin sombras fuertes.\n\n" +
    "3. Acuéstate boca abajo sobre una esterilla o superficie cómoda.\n\n" +
    "4. Posiciona la cámara de lado (vista lateral) para que se vea tu perfil completo.\n\n" +
    "5. Usa ropa que contraste con el fondo para mejorar la detección.\n\n" +
    "6. Extiende brazos y piernas completamente durante el ejercicio.";

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
      pose.leftKnee, pose.rightKnee,
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

    // LÓGICA ESPECÍFICA PARA SUPERMAN
    analyzeSupermanForm(pose);
  };

  const analyzeSupermanForm = (pose) => {
    // Para Superman, necesitamos verificar:
    // 1. Elevación de brazos y piernas
    // 2. Extensión adecuada
    // 3. Alineación y simetría

    // Calcular la elevación relativa de extremidades respecto al torso
    const shoulderElevation = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    const hipElevation = (pose.leftHip.y + pose.rightHip.y) / 2;
    const wristElevation = (pose.leftWrist.y + pose.rightWrist.y) / 2;
    const ankleElevation = (pose.leftAnkle.y + pose.rightAnkle.y) / 2;
    
    // En posición acostada, menor valor Y significa más elevación (arriba en la pantalla)
    const armsElevated = wristElevation < shoulderElevation - 20;
    const legsElevated = ankleElevation < hipElevation - 20;
    
    // Ángulos para extensión de brazos y piernas
    const leftArmAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftElbow,
      pose.leftWrist
    );
    
    const rightArmAngle = calculateAngle(
      pose.rightShoulder,
      pose.rightElbow,
      pose.rightWrist
    );
    
    const leftLegAngle = calculateAngle(
      pose.leftHip,
      pose.leftKnee,
      pose.leftAnkle
    );
    
    const rightLegAngle = calculateAngle(
      pose.rightHip,
      pose.rightKnee,
      pose.rightAnkle
    );
    
    // Comprobar la extensión adecuada (ángulos cercanos a 180 indican extensión)
    const armsExtended = leftArmAngle > 160 && rightArmAngle > 160;
    const legsExtended = leftLegAngle > 160 && rightLegAngle > 160;
    
    // Verificar simetría entre lados izquierdo y derecho
    const wristYDiff = Math.abs(pose.leftWrist.y - pose.rightWrist.y);
    const ankleYDiff = Math.abs(pose.leftAnkle.y - pose.rightAnkle.y);
    const symmetricalPosition = wristYDiff < 30 && ankleYDiff < 30;
    
    // Verificar alineación del cuerpo (hombros y caderas deben estar relativamente al mismo nivel)
    const bodyAligned = Math.abs(shoulderElevation - hipElevation) < 30;
    
    // Verificar la posición del cuello (no debe estar demasiado extendido hacia atrás)
    // Esto es aproximado ya que no tenemos keypoint específico para la cabeza en este contexto
    const neckPosition = pose.leftEar && pose.rightEar && pose.nose ? 
      Math.abs((pose.leftEar.y + pose.rightEar.y)/2 - pose.nose.y) < 30 : true;
    
    // Considerar que está en posición Superman si hay suficiente elevación de extremidades
    const inSupermanPosition = armsElevated && legsElevated;
    
    // Lógica de detección de repeticiones
    if (inSupermanPosition && armsExtended && legsExtended) {
      // Está en posición correcta de Superman
      setConsecutiveCorrectFrames(prev => prev + 1);
      
      if (!repInProgress && consecutiveCorrectFrames > 5) {
        // Comenzó una nueva repetición
        setSupermanPhase('up');
        setRepInProgress(true);
        setHoldTimeCounter(1);
      } else if (repInProgress) {
        // Incrementar contador de tiempo de mantenimiento
        setHoldTimeCounter(prev => prev + 1);
        
        // Si ha mantenido la posición suficiente tiempo, contar como repetición completa
        if (holdTimeCounter >= minHoldTime && supermanPhase === 'up') {
          setRepCount(prev => prev + 1);
          setSupermanPhase('complete');
          
          // Verificar si la forma fue correcta durante todo el mantenimiento
          const correctForm = armsExtended && legsExtended && symmetricalPosition && bodyAligned && neckPosition;
          if (correctForm) {
            setCorrectPostureCount(prev => prev + 1);
          }
        }
      }
    } else {
      // No está en posición Superman
      setConsecutiveCorrectFrames(0);
      
      if (repInProgress && supermanPhase === 'complete') {
        // Bajando después de completar una repetición
        setRepInProgress(false);
        setSupermanPhase('rest');
        setHoldTimeCounter(0);
      }
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    if (!armsElevated && !legsElevated && supermanPhase === 'rest') {
      feedbackMessage = 'Descansa brevemente y prepárate para la siguiente repetición';
      poseCorrect = true;
    } else if (!armsElevated) {
      feedbackMessage = 'Eleva más los brazos';
      poseCorrect = false;
      currentIssues.elevation += 1;
    } else if (!legsElevated) {
      feedbackMessage = 'Eleva más las piernas';
      poseCorrect = false;
      currentIssues.elevation += 1;
    } else if (!armsExtended) {
      feedbackMessage = 'Extiende completamente los brazos';
      poseCorrect = false;
      currentIssues.armExtension += 1;
    } else if (!legsExtended) {
      feedbackMessage = 'Extiende completamente las piernas';
      poseCorrect = false;
      currentIssues.legExtension += 1;
    } else if (!symmetricalPosition) {
      feedbackMessage = 'Mantén brazos y piernas a la misma altura';
      poseCorrect = false;
      currentIssues.symmetry += 1;
    } else if (!bodyAligned) {
      feedbackMessage = 'Alinea mejor tu torso';
      poseCorrect = false;
      currentIssues.bodyAlignment += 1;
    } else if (!neckPosition) {
      feedbackMessage = 'Mantén la cabeza en línea con la columna, mirando hacia abajo';
      poseCorrect = false;
      currentIssues.neckPosition += 1;
    } else if (repInProgress && holdTimeCounter < minHoldTime) {
      feedbackMessage = `Mantén la posición (${Math.round(holdTimeCounter * 100 / minHoldTime)}%)`;
      poseCorrect = true;
    } else if (repInProgress && holdTimeCounter >= minHoldTime) {
      feedbackMessage = '¡Excelente! Ahora baja lentamente';
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
      summaryFeedback = '¡Excelente! Has completado 5 Superman con muy buena forma.\n\n';
    } else if (correctPostureCount >= 2) {
      summaryFeedback = 'Buen trabajo. Has completado las repeticiones con forma aceptable.\n\n';
    } else {
      summaryFeedback = 'Has completado las repeticiones, pero necesitas mejorar tu técnica.\n\n';
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'armExtension' && issues[0][1] > 0) {
        summaryFeedback += '• Extiende completamente los brazos durante todo el ejercicio.\n\n';
      } else if (issues[0][0] === 'legExtension' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener las piernas extendidas al máximo.\n\n';
      } else if (issues[0][0] === 'bodyAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener el cuerpo bien alineado, con hombros y caderas al mismo nivel.\n\n';
      } else if (issues[0][0] === 'symmetry' && issues[0][1] > 0) {
        summaryFeedback += '• Procura que ambos lados del cuerpo se eleven a la misma altura.\n\n';
      } else if (issues[0][0] === 'neckPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Cuida la posición de tu cuello, manteniendo la mirada hacia abajo.\n\n';
      } else if (issues[0][0] === 'elevation' && issues[0][1] > 0) {
        summaryFeedback += '• Intenta elevar más tanto brazos como piernas del suelo.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'armExtension') {
          summaryFeedback += '• También presta atención a extender completamente los brazos.\n\n';
        } else if (issues[1][0] === 'legExtension') {
          summaryFeedback += '• No olvides mantener las piernas bien extendidas.\n\n';
        } else if (issues[1][0] === 'bodyAlignment') {
          summaryFeedback += '• Trabaja en la alineación correcta de tu cuerpo durante el ejercicio.\n\n';
        } else if (issues[1][0] === 'symmetry') {
          summaryFeedback += '• Busca mayor simetría entre ambos lados del cuerpo.\n\n';
        } else if (issues[1][0] === 'neckPosition') {
          summaryFeedback += '• Cuida la posición de tu cuello para evitar tensión.\n\n';
        } else if (issues[1][0] === 'elevation') {
          summaryFeedback += '• Trabaja en conseguir mayor elevación de extremidades.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (correctPostureCount < 5) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica y fortalecerá los músculos de la espalda.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setRepCount(0);
    setSupermanPhase('none');
    setFeedback('Prepárate para hacer el ejercicio Superman');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setCorrectPostureCount(0);
    setPosturalIssues({
      armExtension: 0,
      legExtension: 0,
      bodyAlignment: 0,
      symmetry: 0,
      neckPosition: 0,
      elevation: 0
    });
    setConsecutiveCorrectFrames(0);
    setHoldTimeCounter(0);
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

export default SupermanCorrection;