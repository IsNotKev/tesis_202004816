import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const SidePlankCorrection = () => {
  const [timeHeld, setTimeHeld] = useState(0);
  const [plankPhase, setPlankPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer la plancha lateral');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalTimeInCorrectPosture, setTotalTimeInCorrectPosture] = useState(0);
  const [isBackCamera, setIsBackCamera] = useState(false);
  const [sideDetected, setSideDetected] = useState(null); // 'left' o 'right'
  
  // Temporizador para llevar cuenta del tiempo sosteniendo la plancha
  const timerRef = useRef(null);
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    bodyAlignment: 0,    // Cuerpo no alineado en línea recta
    hipPosition: 0,      // Caderas demasiado bajas o altas
    shoulderStability: 0, // Hombros no estables o no alineados
    headPosition: 0,     // Cabeza no alineada con el cuerpo
    rotation: 0          // Rotación del cuerpo (debe estar de lado)
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalHoldTime = 30; // 30 segundos de plancha lateral
  const confidenceThreshold = 0.5;
  
  // Variables de estado para mejor detección de la postura
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [isInPlankPosition, setIsInPlankPosition] = useState(false);

  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio de plancha lateral, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara a una distancia donde se vea todo tu cuerpo, desde los pies hasta la cabeza.\n\n" +
    "2. Asegúrate de tener buena iluminación. Evita contraluz o sombras fuertes.\n\n" +
    "3. Posiciónate de lado frente a la cámara para que se vea claramente todo tu perfil.\n\n" +
    "4. La aplicación detectará automáticamente si estás haciendo plancha lateral derecha o izquierda.\n\n" +
    "5. Usa ropa que contraste con el fondo para mejorar la detección.";

  // Función para cambiar la cámara
  const handleFlipCamera = () => {
    setIsBackCamera(prev => !prev);
  };

  // Efecto para manejar el temporizador cuando estamos en la posición correcta
  useEffect(() => {
    if (isInPlankPosition && !isCompleted) {
      timerRef.current = setInterval(() => {
        setTimeHeld(prev => {
          const newTime = prev + 1;
          
          // Si hemos alcanzado el tiempo objetivo, completamos el ejercicio
          if (newTime >= totalHoldTime && !isCompleted) {
            clearInterval(timerRef.current);
            setIsCompleted(true);
            generateSummaryFeedback();
            return totalHoldTime;
          }
          
          return newTime;
        });
        
        // Si la postura es correcta, incrementamos el tiempo en postura correcta
        if (isCorrectPose) {
          setTotalTimeInCorrectPosture(prev => prev + 1);
        }
        
      }, 1000); // Incrementar cada segundo
    } else {
      // Si no estamos en posición, limpiamos el intervalo
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInPlankPosition, isCorrectPose, isCompleted]);

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
      pose.leftHip, pose.rightHip,
      pose.leftAnkle, pose.rightAnkle,
      pose.leftEar, pose.rightEar,
      pose.leftElbow, pose.rightElbow,
      pose.leftWrist, pose.rightWrist
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      setIsInPlankPosition(false);
      return;
    }

    // LÓGICA ESPECÍFICA PARA PLANCHA LATERAL
    analyzeSidePlankForm(pose);
  };

  const analyzeSidePlankForm = (pose) => {
    // Primero detectamos qué lado está hacia la cámara
    // Si el ojo izquierdo está más visible que el derecho, probablemente la plancha es del lado derecho
    const leftSideVisible = pose.leftEye && pose.leftEye.confidence > (pose.rightEye ? pose.rightEye.confidence : 0);
    
    // Si no tenemos aún detectado el lado, o ha cambiado, lo actualizamos
    const currentSide = leftSideVisible ? 'right' : 'left';
    if (sideDetected !== currentSide) {
      setSideDetected(currentSide);
    }
    
    // Dependiendo del lado, seleccionamos los puntos relevantes para el análisis
    const supportShoulder = currentSide === 'right' ? pose.rightShoulder : pose.leftShoulder;
    const topShoulder = currentSide === 'right' ? pose.leftShoulder : pose.rightShoulder;
    const supportHip = currentSide === 'right' ? pose.rightHip : pose.leftHip;
    const topHip = currentSide === 'right' ? pose.leftHip : pose.rightHip;
    const supportAnkle = currentSide === 'right' ? pose.rightAnkle : pose.leftAnkle;
    const topAnkle = currentSide === 'right' ? pose.leftAnkle : pose.rightAnkle;
    const ear = currentSide === 'right' ? pose.rightEar : pose.leftEar;
    const supportElbow = currentSide === 'right' ? pose.rightElbow : pose.leftElbow;
    const supportWrist = currentSide === 'right' ? pose.rightWrist : pose.leftWrist;
    
    // Verificamos si estamos en posición de plancha
    // En una plancha lateral, el brazo de soporte debe estar extendido y perpendicular al suelo
    const elbowAngle = calculateAngle(
      supportShoulder,
      supportElbow,
      supportWrist
    );
    
    // Si el codo está demasiado flexionado, probablemente no es una plancha
    if (elbowAngle < 150) {
      setFeedback('Extiende el brazo de apoyo para entrar en posición de plancha');
      setIsCorrectPose(false);
      setIsInPlankPosition(false);
      setConsecutiveCorrectFrames(0);
      return;
    }
    
    // Verificamos la alineación del cuerpo (hombro-cadera-tobillo)
    const bodyAlignmentAngle1 = calculateAngle(
      supportShoulder,
      supportHip,
      supportAnkle
    );
    
    // Otro ángulo importante: cabeza-hombro-cadera
    const neckAlignmentAngle = calculateAngle(
      ear,
      supportShoulder,
      supportHip
    );
    
    // Ángulo entre hombros (para verificar rotación)
    const shouldersAngle = Math.atan2(
      topShoulder.y - supportShoulder.y,
      topShoulder.x - supportShoulder.x
    ) * (180 / Math.PI);
    
    // Ángulo entre caderas (para verificar rotación)
    const hipsAngle = Math.atan2(
      topHip.y - supportHip.y,
      topHip.x - supportHip.x
    ) * (180 / Math.PI);
    
    // Incrementamos los frames consecutivos donde detectamos la posición
    setConsecutiveCorrectFrames(prev => prev + 1);
    
    // Si tenemos suficientes frames consecutivos, consideramos que estamos en la posición
    if (consecutiveCorrectFrames >= 10 && !isInPlankPosition) {
      setIsInPlankPosition(true);
      setPlankPhase('holding');
    }
    
    // Análisis de la postura y proporcionar feedback
    let feedbackMessage = '';
    let poseCorrect = true;
    let currentIssues = {...posturalIssues};
    
    // Verificar alineación del cuerpo
    if (Math.abs(bodyAlignmentAngle1 - 180) > 15) {
      feedbackMessage = 'Alinea tu cuerpo en línea recta desde los tobillos hasta los hombros';
      poseCorrect = false;
      currentIssues.bodyAlignment += 1;
    } 
    // Verificar posición de la cadera
    else if (Math.abs(supportHip.y - ((supportShoulder.y + supportAnkle.y) / 2)) > 30) {
      if (supportHip.y < ((supportShoulder.y + supportAnkle.y) / 2)) {
        feedbackMessage = 'Baja la cadera, está demasiado elevada';
      } else {
        feedbackMessage = 'Eleva la cadera, está demasiado baja';
      }
      poseCorrect = false;
      currentIssues.hipPosition += 1;
    }
    // Verificar alineación de la cabeza
    else if (Math.abs(neckAlignmentAngle - 180) > 15) {
      feedbackMessage = 'Mantén la cabeza alineada con tu columna, mira al frente';
      poseCorrect = false;
      currentIssues.headPosition += 1;
    }
    // Verificar rotación del cuerpo (los hombros y caderas deben estar casi perpendiculares al suelo)
    else if (Math.abs(shouldersAngle - hipsAngle) > 15) {
      feedbackMessage = 'Evita rotar tu cuerpo, mantén hombros y caderas alineados verticalmente';
      poseCorrect = false;
      currentIssues.rotation += 1;
    }
    // Si todo está bien
    else {
      feedbackMessage = '¡Buena posición! Mantén la tensión en el core';
      poseCorrect = true;
    }
    
    // Actualizar registro de problemas posturales
    setPosturalIssues(currentIssues);
    
    setFeedback(feedbackMessage);
    setIsCorrectPose(poseCorrect);
  };

  const generateSummaryFeedback = () => {
    // Encontrar los problemas más frecuentes
    const issues = Object.entries(posturalIssues).sort((a, b) => b[1] - a[1]);
    
    let summaryFeedback = '';
    
    // Calificación general basada en tiempo en postura correcta
    const percentageCorrect = (totalTimeInCorrectPosture / totalHoldTime) * 100;
    
    if (percentageCorrect >= 80) {
      summaryFeedback = `¡Excelente! Has completado la plancha lateral de ${totalHoldTime} segundos con muy buena forma (${Math.round(percentageCorrect)}% del tiempo en postura correcta).\n\n`;
    } else if (percentageCorrect >= 60) {
      summaryFeedback = `Buen trabajo. Has completado la plancha lateral con forma aceptable (${Math.round(percentageCorrect)}% del tiempo en postura correcta).\n\n`;
    } else {
      summaryFeedback = `Has completado el tiempo, pero necesitas mejorar tu técnica (solo ${Math.round(percentageCorrect)}% del tiempo en postura correcta).\n\n`;
    }
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      if (issues[0][0] === 'bodyAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener tu cuerpo completamente alineado, formando una línea recta desde los tobillos hasta los hombros.\n\n';
      } else if (issues[0][0] === 'hipPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en la posición de tu cadera, manteniéndola alineada con los hombros y tobillos, sin elevarse ni caer.\n\n';
      } else if (issues[0][0] === 'shoulderStability' && issues[0][1] > 0) {
        summaryFeedback += '• Mejora la estabilidad de tus hombros, manteniéndolos firmes durante todo el ejercicio.\n\n';
      } else if (issues[0][0] === 'headPosition' && issues[0][1] > 0) {
        summaryFeedback += '• Cuida la posición de tu cabeza, manteniéndola alineada con tu columna vertebral.\n\n';
      } else if (issues[0][0] === 'rotation' && issues[0][1] > 0) {
        summaryFeedback += '• Evita la rotación del cuerpo durante el ejercicio, manteniendo hombros y caderas alineados verticalmente.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'bodyAlignment') {
          summaryFeedback += '• También presta atención a la alineación general de tu cuerpo.\n\n';
        } else if (issues[1][0] === 'hipPosition') {
          summaryFeedback += '• También trabaja en mantener la cadera en la posición correcta.\n\n';
        } else if (issues[1][0] === 'shoulderStability') {
          summaryFeedback += '• No olvides mantener los hombros estables durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'headPosition') {
          summaryFeedback += '• Recuerda mantener la cabeza alineada con el cuerpo.\n\n';
        } else if (issues[1][0] === 'rotation') {
          summaryFeedback += '• Controla la rotación de tu cuerpo durante el ejercicio.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.';
    }
    
    // Añadir consejos generales para mejorar
    if (percentageCorrect < 90) {
      summaryFeedback += '💪 Recuerda que la práctica constante mejorará tu técnica. Intenta aumentar progresivamente el tiempo de plancha.';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    setTimeHeld(0);
    setPlankPhase('none');
    setFeedback('Prepárate para hacer la plancha lateral');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setTotalTimeInCorrectPosture(0);
    setPosturalIssues({
      bodyAlignment: 0,
      hipPosition: 0,
      shoulderStability: 0,
      headPosition: 0,
      rotation: 0
    });
    setConsecutiveCorrectFrames(0);
    setIsInPlankPosition(false);
    setSideDetected(null);
  };

  return (
    <PoseVisualization
      onPoseDetected={onPoseDetected}
      repCount={`${timeHeld}s`} // Mostramos el tiempo en lugar de repeticiones
      feedback={feedback}
      isCorrectPose={isCorrectPose}
      isCompleted={isCompleted}
      totalReps={`${totalHoldTime}s`} // Tiempo total en lugar de repeticiones
      resetExercise={resetExercise}
      overlayOpacity={overlayOpacity}
      instructionsText={instructionsText}
      onFlipCamera={handleFlipCamera}
      isBackCamera={isBackCamera}
      isTimedExercise={true} // Indicamos que es un ejercicio basado en tiempo
    />
  );
};

export default SidePlankCorrection;