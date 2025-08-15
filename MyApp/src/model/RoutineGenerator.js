import exerciseData from '../data/exerciseData';

const generateAdvancedRoutine = (userPreferences) => {
  // Filtrado inicial de ejercicios
  const filteredExercises = exerciseData.filter(exercise => {
    // Filtro por tipo de enfoque
    const matchFocus =
      (userPreferences.focus === 1 && exercise.type === 'Fuerza') ||
      (userPreferences.focus === 2 && exercise.type === 'Resistencia') ||
      userPreferences.focus === 3;

    // Filtro por grupo muscular
    const matchMuscleGroup =
      (userPreferences.muscleGroup === 1 &&
        ['Pecho', 'Brazos', 'Hombros', 'Espalda'].includes(exercise.muscleGroup)) ||
      (userPreferences.muscleGroup === 2 &&
        ['Piernas', 'Glúteos'].includes(exercise.muscleGroup)) ||
      userPreferences.muscleGroup === 3;

    // Filtro por equipo
    const matchEquipment =
      (userPreferences.equipment === 1 && exercise.equipment === 'Sin equipo') ||
      (userPreferences.equipment === 2 &&
        ['Sin equipo', 'Con/sin equipo', 'Silla', 'Banco o silla'].includes(exercise.equipment)) ||
      userPreferences.equipment === 3;

    return matchFocus && matchMuscleGroup && matchEquipment;
  });

  // Función para calcular la intensidad de los ejercicios
  const calculateExerciseIntensity = (exercise, userLevel) => {
    const intensityMultipliers = {
      1: { // Principiante
        reps: [8, 12], 
        sets: 2, 
        restTime: 60,
        holdTime: [20, 30] // Tiempo en segundos para ejercicios isométricos
      },  
      2: { // Intermedio
        reps: [12, 15], 
        sets: 3, 
        restTime: 45,
        holdTime: [30, 40]
      }, 
      3: { // Avanzado
        reps: [15, 20], 
        sets: 4, 
        restTime: 30,
        holdTime: [40, 60]
      }
    };

    const intensity = intensityMultipliers[userLevel];

    // Si el ejercicio es por tiempo (isométrico)
    if (exercise.time) {
      return {
        ...exercise,
        isTimeBasedExercise: true,
        recommendedTime: {
          min: intensity.holdTime[0],
          max: intensity.holdTime[1]
        },
        sets: intensity.sets,
        restTime: intensity.restTime
      };
    } else {
      // Ejercicio normal basado en repeticiones
      return {
        ...exercise,
        isTimeBasedExercise: false,
        recommendedReps: {
          min: intensity.reps[0],
          max: intensity.reps[1]
        },
        sets: intensity.sets,
        restTime: intensity.restTime
      };
    }
  };

  // Selección de ejercicios basada en la duración
  const selectExercisesForDuration = (exercises, duration, focus) => {
    const durationConfig = {
      1: { maxExercises: 3, totalTime: 300 },    // 5-10 min
      2: { maxExercises: 4, totalTime: 600 },    // 10-20 min
      3: { maxExercises: 5, totalTime: 1200 }    // 20-30 min
    };

    const config = durationConfig[duration];

    // Filtrar ejercicios según el enfoque
    let filteredExercises = exercises;
    if (focus === 1) {
      // Solo fuerza
      filteredExercises = exercises.filter(e => e.type === 'Fuerza');
    } else if (focus === 2) {
      // Solo resistencia
      filteredExercises = exercises.filter(e => e.type === 'Resistencia');
    }

    // Agrupar por músculo para mayor variedad
    const exercisesByMuscleGroup = filteredExercises.reduce((acc, exercise) => {
      if (!acc[exercise.muscleGroup]) {
        acc[exercise.muscleGroup] = [];
      }
      acc[exercise.muscleGroup].push(exercise);
      return acc;
    }, {});

    // Función para obtener ejercicios aleatorios de diferentes grupos musculares
    const getRandomExercises = (muscleGroups, maxExercises) => {
      const selectedExercises = [];
      const muscleGroupKeys = Object.keys(muscleGroups);

      // Barajar grupos musculares
      const shuffledMuscleGroups = muscleGroupKeys.sort(() => 0.5 - Math.random());

      for (let group of shuffledMuscleGroups) {
        if (selectedExercises.length >= maxExercises) break;

        // Si el grupo tiene ejercicios
        if (muscleGroups[group].length > 0) {
          // Barajar ejercicios del grupo
          const shuffledExercises = muscleGroups[group].sort(() => 0.5 - Math.random());

          // Agregar un ejercicio del grupo sin repetir
          const exerciseToAdd = shuffledExercises.find(
            exercise => !selectedExercises.some(selected => selected.id === exercise.id)
          );

          if (exerciseToAdd) {
            selectedExercises.push(exerciseToAdd);
          }
        }
      }

      // Si no hay suficientes ejercicios, rellenar con aleatorios
      while (selectedExercises.length < maxExercises && filteredExercises.length > 0) {
        const randomExercise = filteredExercises[Math.floor(Math.random() * filteredExercises.length)];
        if (!selectedExercises.some(selected => selected.id === randomExercise.id)) {
          selectedExercises.push(randomExercise);
        }
      }

      return selectedExercises.slice(0, maxExercises);
    };

    // Obtener ejercicios aleatorios
    const selectedExercises = getRandomExercises(
      exercisesByMuscleGroup,
      config.maxExercises
    );

    return selectedExercises.map(exercise =>
      calculateExerciseIntensity(exercise, userPreferences.level)
    );
  };

  // Generar rutina final
  const generateFinalRoutine = () => {
    if (filteredExercises.length === 0) {
      return {
        exercises: [],
        message: 'No se encontraron ejercicios que coincidan con tus criterios.'
      };
    }

    const selectedExercises = selectExercisesForDuration(
      filteredExercises,
      userPreferences.time
    );

    return {
      exercises: selectedExercises,
      message: 'Rutina generada exitosamente'
    };
  };

  return generateFinalRoutine();
};

export default generateAdvancedRoutine;