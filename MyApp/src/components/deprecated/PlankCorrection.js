import React, { useState, useEffect, useRef } from 'react';
import { Animated, Alert } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const PlankCorrection = () => {
  // Estados principales
  const [repCount, setRepCount] = useState('0s');
  const [plankPhase, setPlankPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para hacer la plancha');
  const [isCorrectPose, setIsCorrectPose] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBackCamera, setIsBackCamera] = useState(false);
  
  // Estados para el cronómetro
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCorrectTime, setTotalCorrectTime] = useState(0);
  
  // Referencias para intervalos y timestamps
  const timerRef = useRef(null);
  const lastFrameTimeRef = useRef(Date.now());
  
  // Seguimiento de problemas específicos para el resumen final
  const [posturalIssues, setPosturalIssues] = useState({
    hipAlignment: 0,
    backAlignment: 0,
    neckAlignment: 0,
    shoulderElbowAlignment: 0,
    bodyStability: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = '30s'; // Objetivo: mantener la plancha por 60 segundos
  const confidenceThreshold = 0.5;
  const requiredTime = 30; // 60 segundos en total
  
  // Variables de estado para mejor detección
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [consecutiveIncorrectFrames, setConsecutiveIncorrectFrames] = useState(0);
  
  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para que la aplicación detecte correctamente tu postura durante el ejercicio de plancha, sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara de lado (vista de perfil) para que pueda ver toda tu alineación corporal.\n\n" +
    "2. Asegúrate de tener buena iluminación y suficiente espacio para que todo tu cuerpo sea visible.\n\n" +
    "3. Apoya tus antebrazos en el suelo con los codos alineados bajo los hombros.\n\n" +
    "4. Mantén el cuerpo recto desde la cabeza hasta los talones.\n\n" +
    "5. Evita que la cadera se eleve o caiga durante el ejercicio.\n\n" +
    "6. El objetivo es mantener la posición correcta durante 60 segundos.";

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

  // Iniciar/detener el cronómetro basado en la fase de la plancha
  useEffect(() => {
    if (plankPhase === 'holding' && !isCompleted) {
      // Si no hay un timer activo, iniciamos uno
      if (!timerRef.current) {
        lastFrameTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          const now = Date.now();
          const deltaTime = (now - lastFrameTimeRef.current) / 1000;
          lastFrameTimeRef.current = now;
          
          // Aumentar el tiempo total y la racha actual
          setElapsedTime(prev => {
            const newTime = prev + deltaTime;
            setRepCount(`${Math.floor(newTime)}s`);
            
            // Verificar si hemos alcanzado el tiempo objetivo
            if (newTime >= requiredTime && !isCompleted) {
              setIsCompleted(true);
              clearInterval(timerRef.current);
              timerRef.current = null;
              generateSummaryFeedback();
            }
            
            return newTime;
          });
          
          setCurrentStreak(prev => {
            const newStreak = prev + deltaTime;
            
            // Actualizar la racha más larga si es necesario
            if (newStreak > longestStreak) {
              setLongestStreak(newStreak);
            }
            
            return newStreak;
          });
          
          setTotalCorrectTime(prev => prev + deltaTime);
          
        }, 100); // Actualizar cada 100ms para un cronómetro más preciso
      }
    } else {
      // Si la postura ya no es correcta o el ejercicio se completó, detener el timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        
        // Reiniciar la racha actual si la postura se rompió
        if (plankPhase === 'broken') {
          setCurrentStreak(0);
        }
      }
    }
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [plankPhase, isCompleted]);

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
      pose.leftAnkle, pose.rightAnkle,
      pose.nose
    ];
    
    const allPointsDetected = keypoints.every(point => 
      point && point.confidence > confidenceThreshold
    );
    
    if (!allPointsDetected) {
      setFeedback('Ponte en posición para que pueda verte completamente');
      setIsCorrectPose(false);
      setPlankPhase('none');
      setConsecutiveCorrectFrames(0);
      setConsecutiveIncorrectFrames(prev => prev + 1);
      return;
    }

    // LÓGICA ESPECÍFICA PARA PLANCHA
    analyzePlankForm(pose);
  };

  const analyzePlankForm = (pose) => {
    // Calcular ángulos importantes para la plancha
    
    // Ángulo entre hombro, cadera y rodilla (debe ser cercano a 180° para una espalda recta)
    const backAngle = calculateAngle(
      pose.leftShoulder, 
      pose.leftHip, 
      pose.leftKnee
    );
    
    // También probar con el lado derecho para mejor precisión
    const backAngleRight = calculateAngle(
      pose.rightShoulder, 
      pose.rightHip, 
      pose.rightKnee
    );
    
    // Usar el mejor ángulo de los dos lados (el más cercano a 180)
    const bestBackAngle = Math.abs(180 - backAngle) < Math.abs(180 - backAngleRight) 
      ? backAngle 
      : backAngleRight;
    
    // Ángulo entre codo, hombro y cadera (debe ser cercano a 90° para una buena posición de antebrazos)
    const shoulderElbowAngle = calculateAngle(
      pose.leftElbow,
      pose.leftShoulder,
      pose.leftHip
    );
    
    const shoulderElbowAngleRight = calculateAngle(
      pose.rightElbow,
      pose.rightShoulder,
      pose.rightHip
    );
    
    // Usar el mejor ángulo de los dos lados
    const bestShoulderElbowAngle = Math.abs(90 - shoulderElbowAngle) < Math.abs(90 - shoulderElbowAngleRight)
      ? shoulderElbowAngle
      : shoulderElbowAngleRight;
    
    // Ángulo entre hombro, cadera y tobillo (para medir la alineación general del cuerpo)
    const bodyLineAngle = calculateAngle(
      pose.leftShoulder,
      pose.leftHip,
      pose.leftAnkle
    );
    
    const bodyLineAngleRight = calculateAngle(
      pose.rightShoulder,
      pose.rightHip,
      pose.rightAnkle
    );
    
    // Usar el mejor ángulo de los dos lados
    const bestBodyLineAngle = Math.abs(180 - bodyLineAngle) < Math.abs(180 - bodyLineAngleRight)
      ? bodyLineAngle
      : bodyLineAngleRight;
    
    // Ángulo entre nariz, hombro y codo (para verificar la posición del cuello)
    const neckAngle = calculateAngle(
      pose.nose,
      pose.leftShoulder,
      pose.leftElbow
    );
    
    const neckAngleRight = calculateAngle(
      pose.nose,
      pose.rightShoulder,
      pose.rightElbow
    );
    
    // Usar el mejor ángulo de los dos lados
    const bestNeckAngle = Math.abs(180 - neckAngle) < Math.abs(180 - neckAngleRight)
      ? neckAngle
      : neckAngleRight;
    
    // Verificar si la cadera está demasiado alta o baja con respecto a la línea entre hombros y tobillos
    const shoulderY = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    const hipY = (pose.leftHip.y + pose.rightHip.y) / 2;
    const ankleY = (pose.leftAnkle.y + pose.rightAnkle.y) / 2;
    
    // Calcular la posición ideal de la cadera en la línea recta
    const shoulderToAnkleRatio = 0.6; // Aproximadamente dónde debería estar la cadera
    const idealHipY = shoulderY + (ankleY - shoulderY) * shoulderToAnkleRatio;
    
    // Diferencia entre la posición actual y la ideal
    const hipDeviation = Math.abs(hipY - idealHipY);
    const maxAcceptableDeviation = 30; // Píxeles máximos de desviación permitidos
    const hipAlignment = hipDeviation < maxAcceptableDeviation;
    
    // Determinar si la plancha es correcta basado en todos los criterios
    const isBackStraight = bestBackAngle > 165; // Espalda casi recta
    const isBodyLineStraight = bestBodyLineAngle > 165; // Cuerpo en línea recta
    const isElbowPositionCorrect = bestShoulderElbowAngle > 75 && bestShoulderElbowAngle < 105; // Codos aproximadamente a 90°
    const isNeckAligned = bestNeckAngle > 160; // Cuello alineado
    
    // Lógica para determinar la fase de la plancha
    const isPoseCorrect = isBackStraight && isBodyLineStraight && isElbowPositionCorrect && isNeckAligned && hipAlignment;
    
    if (isPoseCorrect) {
      setConsecutiveCorrectFrames(prev => prev + 1);
      setConsecutiveIncorrectFrames(0);
      
      // Necesitamos varios frames correctos consecutivos para confirmar la posición
      if (consecutiveCorrectFrames > 5) {
        setPlankPhase('holding');
      }
    } else {
      setConsecutiveIncorrectFrames(prev => prev + 1);
      
      // Solo cambiamos de 'holding' a 'broken' si hay varios frames incorrectos consecutivos
      // para evitar parpadeos por detecciones incorrectas ocasionales
      if (consecutiveIncorrectFrames > 3 && plankPhase === 'holding') {
        setPlankPhase('broken');
        setConsecutiveCorrectFrames(0);
      }
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let currentIssues = {...posturalIssues};
    
    // Verificar si el usuario está en una posición aproximada de plancha
    if (bestShoulderElbowAngle < 130 && bestShoulderElbowAngle > 60 && bestBackAngle > 140) {
      // Está en una posición cercana a la plancha, evaluar la calidad
      
      if (!isBackStraight) {
        feedbackMessage = 'Mantén la espalda más recta, sin arquear ni hundir';
        currentIssues.backAlignment += 1;
      } else if (!hipAlignment) {
        feedbackMessage = 'Ajusta la altura de tus caderas, no deben estar ni muy altas ni muy bajas';
        currentIssues.hipAlignment += 1;
      } else if (!isNeckAligned) {
        feedbackMessage = 'Alinea mejor tu cuello, mira hacia el suelo para mantener una línea recta';
        currentIssues.neckAlignment += 1;
      } else if (!isElbowPositionCorrect) {
        feedbackMessage = 'Coloca tus codos directamente debajo de tus hombros';
        currentIssues.shoulderElbowAlignment += 1;
      } else if (!isBodyLineStraight) {
        feedbackMessage = 'Mantén todo tu cuerpo en línea recta de pies a cabeza';
        currentIssues.bodyStability += 1;
      } else {
        const remainingTime = Math.max(0, requiredTime - elapsedTime);
        feedbackMessage = `¡Buena posición! Mantén la plancha ${Math.ceil(remainingTime)} segundos más`;
      }
    } else {
      // No está en una posición reconocible como plancha
      feedbackMessage = 'Colócate en posición de plancha con antebrazos en el suelo y cuerpo recto';
      setPlankPhase('none');
    }
    
    // Actualizar registro de problemas posturales
    setPosturalIssues(currentIssues);
    
    // Actualizar feedback y estado de la pose
    setFeedback(feedbackMessage);
    setIsCorrectPose(isPoseCorrect);
    
    // Verificar si se ha completado el ejercicio
    if (elapsedTime >= requiredTime && !isCompleted) {
      setIsCompleted(true);
      generateSummaryFeedback();
      
      // Limpiar el timer si existe
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const generateSummaryFeedback = () => {
    // Encontrar los problemas más frecuentes
    const issues = Object.entries(posturalIssues).sort((a, b) => b[1] - a[1]);
    
    let summaryFeedback = '';
    
    // Calificación general basada en tiempo total y racha más larga
    const percentageCompleted = Math.min(100, (totalCorrectTime / requiredTime) * 100);
    const longestStreakSeconds = Math.floor(longestStreak);
    
    // Calcular calificación
    if (percentageCompleted >= 90) {
      summaryFeedback = `¡Excelente! Has completado el objetivo al ${Math.round(percentageCompleted)}%.\n\n`;
    } else if (percentageCompleted >= 70) {
      summaryFeedback = `Buen trabajo. Has alcanzado el ${Math.round(percentageCompleted)}% del objetivo.\n\n`;
    } else if (percentageCompleted >= 50) {
      summaryFeedback = `Has mantenido la plancha durante el ${Math.round(percentageCompleted)}% del tiempo objetivo.\n\n`;
    } else {
      summaryFeedback = `Has completado el ${Math.round(percentageCompleted)}% del tiempo objetivo. Sigue practicando.\n\n`;
    }
    
    // Añadir información sobre la racha más larga
    summaryFeedback += `Tu racha más larga en posición correcta fue de ${longestStreakSeconds} segundos.\n\n`;
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      // Primer problema más común
      if (issues[0][0] === 'hipAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener las caderas alineadas, ni muy altas ni muy bajas.\n\n';
      } else if (issues[0][0] === 'backAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener la espalda recta sin arquear ni hundir.\n\n';
      } else if (issues[0][0] === 'neckAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Presta atención a la posición de tu cuello, mantenlo neutro.\n\n';
      } else if (issues[0][0] === 'shoulderElbowAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Asegúrate de colocar tus codos directamente debajo de tus hombros.\n\n';
      } else if (issues[0][0] === 'bodyStability' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener todo tu cuerpo en una línea recta.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'hipAlignment') {
          summaryFeedback += '• También presta atención a la altura de tus caderas.\n\n';
        } else if (issues[1][0] === 'backAlignment') {
          summaryFeedback += '• No olvides mantener la espalda recta durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'neckAlignment') {
          summaryFeedback += '• Recuerda mantener el cuello alineado con la espalda.\n\n';
        } else if (issues[1][0] === 'shoulderElbowAlignment') {
          summaryFeedback += '• Revisa la colocación de tus codos en relación con tus hombros.\n\n';
        } else if (issues[1][0] === 'bodyStability') {
          summaryFeedback += '• Mejora la estabilidad general de tu cuerpo durante el ejercicio.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.\n\n';
    }
    
    // Añadir consejos generales para mejorar
    summaryFeedback += '💪 Consejos para mejorar:\n\n';
    
    if (longestStreakSeconds < 20) {
      summaryFeedback += '• Intenta ejercicios de fortalecimiento de core como abdominales y bird-dog.\n';
      summaryFeedback += '• Practica la posición de plancha durante períodos más cortos varias veces al día.\n';
    } else if (longestStreakSeconds < 40) {
      summaryFeedback += '• Estás progresando bien. Intenta aumentar gradualmente el tiempo en 5-10 segundos.\n';
      summaryFeedback += '• Incorpora variaciones como plancha lateral para mejorar tu estabilidad general.\n';
    } else {
      summaryFeedback += '• ¡Excelente resistencia! Prueba con variaciones más desafiantes como plancha con elevación de piernas.\n';
      summaryFeedback += '• Considera aumentar el tiempo objetivo a 90 segundos en tus próximas sesiones.\n';
    }
    
    setFeedback(summaryFeedback);
  };

  const resetExercise = () => {
    // Limpiar el timer si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setRepCount('0s');
    setPlankPhase('none');
    setFeedback('Prepárate para hacer la plancha');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setElapsedTime(0);
    setCurrentStreak(0);
    setLongestStreak(0);
    setTotalCorrectTime(0);
    setPosturalIssues({
      hipAlignment: 0,
      backAlignment: 0,
      neckAlignment: 0,
      shoulderElbowAlignment: 0,
      bodyStability: 0
    });
    setConsecutiveCorrectFrames(0);
    setConsecutiveIncorrectFrames(0);
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
      isTimedExercise={true}  // Indicamos que es un ejercicio basado en tiempo
    />
  );
};

export default PlankCorrection;