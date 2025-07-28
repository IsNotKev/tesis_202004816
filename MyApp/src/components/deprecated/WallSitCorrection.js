import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { calculateAngle } from '../../utils/calculateAngle';
import PoseVisualization from '../PoseVisualization';

const WallSitCorrection = () => {
  // Estados principales
  const [repCount, setRepCount] = useState('0s');
  const [squatPhase, setSquatPhase] = useState('none');
  const [feedback, setFeedback] = useState('Prepárate para la sentadilla isométrica');
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
    kneeAngle: 0,
    backAlignment: 0,
    hipAlignment: 0,
    kneeOverToes: 0,
    footPlacement: 0
  });
  
  // Animated value para la opacidad del overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Configuración específica del ejercicio
  const totalReps = '15s'; // Objetivo: mantener la sentadilla isométrica por 45 segundos
  const confidenceThreshold = 0.5;
  const requiredTime = 15; // 45 segundos en total
  
  // Variables de estado para mejor detección
  const [consecutiveCorrectFrames, setConsecutiveCorrectFrames] = useState(0);
  const [consecutiveIncorrectFrames, setConsecutiveIncorrectFrames] = useState(0);
  
  // Texto de instrucciones para la detección adecuada
  const instructionsText = 
    "Para una correcta detección de la sentadilla isométrica (wall sit), sigue estas instrucciones:\n\n" +
    "1. Coloca la cámara de lado (vista de perfil) para que pueda ver todo tu cuerpo.\n\n" +
    "2. Asegúrate de tener buena iluminación y suficiente espacio visible.\n\n" +
    "3. Párate con la espalda apoyada contra una pared.\n\n" +
    "4. Deslízate hacia abajo hasta formar un ángulo de 90 grados con tus rodillas.\n\n" +
    "5. Mantén los muslos paralelos al suelo y las rodillas alineadas sobre los tobillos.\n\n" +
    "6. El objetivo es mantener la posición correcta durante 45 segundos.";

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

  // Iniciar/detener el cronómetro basado en la fase de la sentadilla
  useEffect(() => {
    if (squatPhase === 'holding' && !isCompleted) {
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
        if (squatPhase === 'broken') {
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
  }, [squatPhase, isCompleted]);

  const onPoseDetected = (poses) => {
    if (!poses || poses.length === 0) return;
    
    const pose = poses[0]?.pose;
    
    // Verificar que tenemos todos los keypoints necesarios con suficiente confianza
    const keypoints = [
      pose.leftShoulder, pose.rightShoulder,
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
      setSquatPhase('none');
      setConsecutiveCorrectFrames(0);
      setConsecutiveIncorrectFrames(prev => prev + 1);
      return;
    }

    // LÓGICA ESPECÍFICA PARA SENTADILLA ISOMÉTRICA
    analyzeWallSitForm(pose);
  };

  const analyzeWallSitForm = (pose) => {
    // Calcular ángulos importantes para la sentadilla isométrica
    
    // Ángulo de la rodilla (debe estar cerca de 90 grados)
    const kneeAngleLeft = calculateAngle(
      pose.leftHip,
      pose.leftKnee,
      pose.leftAnkle
    );
    
    const kneeAngleRight = calculateAngle(
      pose.rightHip,
      pose.rightKnee,
      pose.rightAnkle
    );
    
    // Usar el promedio de ambas rodillas para mayor precisión
    const avgKneeAngle = (kneeAngleLeft + kneeAngleRight) / 2;
    
    // Ángulo del tronco-cadera para verificar la posición vertical del torso
    const backAngleLeft = calculateAngle(
      pose.leftShoulder,
      pose.leftHip,
      pose.leftKnee
    );
    
    const backAngleRight = calculateAngle(
      pose.rightShoulder,
      pose.rightHip,
      pose.rightKnee
    );
    
    // Usar el promedio para mejor precisión
    const avgBackAngle = (backAngleLeft + backAngleRight) / 2;
    
    // Verificar que los muslos estén paralelos al suelo
    // Calculamos la inclinación del muslo respecto a la horizontal
    const thighAngleLeft = Math.atan2(
      pose.leftKnee.y - pose.leftHip.y,
      pose.leftKnee.x - pose.leftHip.x
    ) * (180 / Math.PI);
    
    const thighAngleRight = Math.atan2(
      pose.rightKnee.y - pose.rightHip.y,
      pose.rightKnee.x - pose.rightHip.x
    ) * (180 / Math.PI);
    
    // Normalizar los ángulos para que 0 grados sea horizontal
    const normalizedThighAngleLeft = Math.abs(thighAngleLeft - 90);
    const normalizedThighAngleRight = Math.abs(thighAngleRight - 90);
    
    // Usar el mejor ángulo (el más cercano a la horizontal)
    const bestThighAlignment = Math.min(normalizedThighAngleLeft, normalizedThighAngleRight);
    
    // Verificar que las rodillas no sobrepasan la punta de los pies
    // Esto se puede aproximar comparando la posición X de las rodillas y tobillos
    const kneeOverToesLeft = pose.leftKnee.x > pose.leftAnkle.x;
    const kneeOverToesRight = pose.rightKnee.x > pose.rightAnkle.x;
    
    // Verificar posición adecuada de los pies (aproximadamente al ancho de los hombros)
    const shoulderWidth = Math.abs(pose.leftShoulder.x - pose.rightShoulder.x);
    const ankleWidth = Math.abs(pose.leftAnkle.x - pose.rightAnkle.x);
    const footPlacementRatio = ankleWidth / shoulderWidth;
    const isFootPlacementCorrect = footPlacementRatio > 0.7 && footPlacementRatio < 1.3;
    
    // Determinar si la sentadilla isométrica es correcta basado en todos los criterios
    const isKneeAngleCorrect = avgKneeAngle > 80 && avgKneeAngle < 110; // Aproximadamente 90° con margen
    const isBackStraight = avgBackAngle > 80 && avgBackAngle < 100; // Aproximadamente perpendicular al suelo
    const isThighParallel = bestThighAlignment < 15; // Menos de 15° de desviación de la horizontal
    const isKneePositionCorrect = !kneeOverToesLeft && !kneeOverToesRight;
    
    // Lógica para determinar la fase de la sentadilla
    const isPoseCorrect = isKneeAngleCorrect && isBackStraight && isThighParallel && isKneePositionCorrect && isFootPlacementCorrect;
    
    if (isPoseCorrect) {
      setConsecutiveCorrectFrames(prev => prev + 1);
      setConsecutiveIncorrectFrames(0);
      
      // Necesitamos varios frames correctos consecutivos para confirmar la posición
      if (consecutiveCorrectFrames > 5) {
        setSquatPhase('holding');
      }
    } else {
      setConsecutiveIncorrectFrames(prev => prev + 1);
      
      // Solo cambiamos de 'holding' a 'broken' si hay varios frames incorrectos consecutivos
      // para evitar parpadeos por detecciones incorrectas ocasionales
      if (consecutiveIncorrectFrames > 3 && squatPhase === 'holding') {
        setSquatPhase('broken');
        setConsecutiveCorrectFrames(0);
      }
    }
    
    // Proporcionar feedback específico basado en la forma
    let feedbackMessage = '';
    let currentIssues = {...posturalIssues};
    
    // Verificar si el usuario está en una posición aproximada de sentadilla
    if (avgKneeAngle < 140 && avgKneeAngle > 70) {
      // Está en una posición cercana a la sentadilla, evaluar la calidad
      
      if (!isKneeAngleCorrect) {
        if (avgKneeAngle < 80) {
          feedbackMessage = 'Sube un poco, tus rodillas están demasiado flexionadas';
          currentIssues.kneeAngle += 1;
        } else if (avgKneeAngle > 110) {
          feedbackMessage = 'Baja más hasta formar un ángulo de 90 grados en las rodillas';
          currentIssues.kneeAngle += 1;
        }
      } else if (!isBackStraight) {
        feedbackMessage = 'Mantén la espalda recta y completamente apoyada contra la pared';
        currentIssues.backAlignment += 1;
      } else if (!isThighParallel) {
        feedbackMessage = 'Ajusta la posición para mantener los muslos paralelos al suelo';
        currentIssues.hipAlignment += 1;
      } else if (!isKneePositionCorrect) {
        feedbackMessage = 'Mantén las rodillas alineadas con los tobillos, no adelante';
        currentIssues.kneeOverToes += 1;
      } else if (!isFootPlacementCorrect) {
        feedbackMessage = 'Coloca los pies aproximadamente al ancho de tus hombros';
        currentIssues.footPlacement += 1;
      } else {
        const remainingTime = Math.max(0, requiredTime - elapsedTime);
        feedbackMessage = `¡Buena posición! Mantén la sentadilla ${Math.ceil(remainingTime)} segundos más`;
      }
    } else {
      // No está en una posición reconocible como sentadilla isométrica
      feedbackMessage = 'Colócate en posición de sentadilla con la espalda contra la pared y rodillas a 90 grados';
      setSquatPhase('none');
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
      summaryFeedback = `Has mantenido la sentadilla durante el ${Math.round(percentageCompleted)}% del tiempo objetivo.\n\n`;
    } else {
      summaryFeedback = `Has completado el ${Math.round(percentageCompleted)}% del tiempo objetivo. Sigue practicando.\n\n`;
    }
    
    // Añadir información sobre la racha más larga
    summaryFeedback += `Tu racha más larga en posición correcta fue de ${longestStreakSeconds} segundos.\n\n`;
    
    // Añadir recomendaciones específicas basadas en los problemas detectados
    if (issues[0][1] > 0) {
      summaryFeedback += '📋 Principales aspectos a mejorar:\n\n';
      
      // Primer problema más común
      if (issues[0][0] === 'kneeAngle' && issues[0][1] > 0) {
        summaryFeedback += '• Trabaja en mantener un ángulo de 90 grados en tus rodillas.\n\n';
      } else if (issues[0][0] === 'backAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Enfócate en mantener la espalda completamente apoyada contra la pared.\n\n';
      } else if (issues[0][0] === 'hipAlignment' && issues[0][1] > 0) {
        summaryFeedback += '• Presta atención a la posición de tus muslos, deben estar paralelos al suelo.\n\n';
      } else if (issues[0][0] === 'kneeOverToes' && issues[0][1] > 0) {
        summaryFeedback += '• Tus rodillas no deben sobrepasar la punta de tus pies, ajusta tu posición.\n\n';
      } else if (issues[0][0] === 'footPlacement' && issues[0][1] > 0) {
        summaryFeedback += '• Coloca tus pies aproximadamente al ancho de tus hombros para mejor estabilidad.\n\n';
      }
      
      // Añadir el segundo problema más común si existe
      if (issues.length > 1 && issues[1][1] > 0) {
        if (issues[1][0] === 'kneeAngle') {
          summaryFeedback += '• También trabaja en el ángulo de tus rodillas, intenta mantenerlas a 90 grados.\n\n';
        } else if (issues[1][0] === 'backAlignment') {
          summaryFeedback += '• No olvides mantener la espalda recta y apoyada contra la pared.\n\n';
        } else if (issues[1][0] === 'hipAlignment') {
          summaryFeedback += '• Recuerda mantener tus muslos paralelos al suelo durante todo el ejercicio.\n\n';
        } else if (issues[1][0] === 'kneeOverToes') {
          summaryFeedback += '• Practica la alineación de rodillas sobre tobillos para prevenir lesiones.\n\n';
        } else if (issues[1][0] === 'footPlacement') {
          summaryFeedback += '• La posición de tus pies afecta tu estabilidad, mantén la anchura adecuada.\n\n';
        }
      }
    } else {
      summaryFeedback += '🌟 ¡Tu forma es excelente! Sigue así.\n\n';
    }
    
    // Añadir consejos generales para mejorar
    summaryFeedback += '💪 Consejos para mejorar:\n\n';
    
    if (longestStreakSeconds < 15) {
      summaryFeedback += '• Fortalece tus cuádriceps con ejercicios como sentadillas y zancadas.\n';
      summaryFeedback += '• Practica la sentadilla isométrica durante períodos más cortos varias veces al día.\n';
    } else if (longestStreakSeconds < 30) {
      summaryFeedback += '• Estás progresando bien. Intenta aumentar gradualmente el tiempo en 5-10 segundos.\n';
      summaryFeedback += '• Incorpora ejercicios de fortalecimiento para isquiotibiales para mayor equilibrio muscular.\n';
    } else {
      summaryFeedback += '• ¡Excelente resistencia! Prueba con variaciones más desafiantes como sentadilla con una sola pierna.\n';
      summaryFeedback += '• Considera aumentar el tiempo objetivo a 60 segundos en tus próximas sesiones.\n';
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
    setSquatPhase('none');
    setFeedback('Prepárate para la sentadilla isométrica');
    setIsCorrectPose(true);
    setIsCompleted(false);
    setElapsedTime(0);
    setCurrentStreak(0);
    setLongestStreak(0);
    setTotalCorrectTime(0);
    setPosturalIssues({
      kneeAngle: 0,
      backAlignment: 0,
      hipAlignment: 0,
      kneeOverToes: 0,
      footPlacement: 0
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

export default WallSitCorrection;