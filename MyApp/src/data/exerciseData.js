const exerciseData = [
  {
    id: 1,
    name: 'Flexiones de brazos',
    description: 'Fortalece pecho, hombros y tríceps. Mantén el cuerpo recto mientras subes y bajas.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Pecho',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/L6cEBDdG_8s?si=ISgWCGpEVRqba7iM',
    instructions: [
      "Colócate en posición de plancha con las manos ligeramente más anchas que los hombros.",
      "Baja el cuerpo doblando los codos hasta que el pecho casi toque el suelo.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 2,
    name: 'Sentadillas',
    description: 'Fortalece piernas y glúteos. Baja como si te sentaras, manteniendo la espalda recta.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: true,
    poseCorrection: 'squatCorrection',
    time: false,
    image: require('../assets/eimg/Squat.jpg'),
    videoLink: 'https://youtu.be/VRKdOsad3HQ?si=f1SqkRk394xygnKw',
    instructions: [
      "Párate con los pies a la altura de los hombros.",
      "Baja doblando las rodillas, manteniendo la espalda recta.",
      "Desciende hasta que los muslos estén paralelos al suelo.",
      "Empuja con los talones para volver a la posición inicial."
    ]
  },
  {
    id: 3,
    name: 'Plancha',
    description: 'Fortalece el core. Mantén el cuerpo recto apoyado en antebrazos y pies.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Core',
    hasPoseCorrection: false,
    time: true,
    videoLink: 'https://youtu.be/d0atctiI7Vw?si=TLQ6jelAOrrMuV0c',
    instructions: [
      "Colócate en posición de plancha apoyando los antebrazos en el suelo.",
      "Mantén el cuerpo recto desde la cabeza hasta los talones.",
      "Aprieta los abdominales y glúteos.",
      "Mantén la posición durante el tiempo indicado."
    ]
  },
  {
    id: 4,
    name: 'Zancadas',
    description: 'Fortalece piernas y glúteos. Da un paso adelante y baja la rodilla trasera.',
    type: 'Fuerza',
    equipment: 'Con/sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/Xcfs_3DMKlc?si=ZZ1AFJwvYaIE0Iy8',
    instructions: [
      "Párate con los pies separados a la altura de las caderas.",
      "Da un paso adelante y baja la rodilla trasera hacia el suelo.",
      "Empuja con el talón delantero para volver a la posición inicial.",
      "Alterna las piernas."
    ]
  },
  {
    id: 5,
    name: 'Puente de glúteos',
    description: 'Fortalece glúteos y espalda baja. Levanta la cadera apretando los glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Glúteos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/FOE4eoO4nOk?si=Q1Sg7o_xYw1ZRn2H',
    instructions: [
      "Acuéstate boca arriba con las rodillas flexionadas y los pies apoyados.",
      "Levanta la cadera apretando los glúteos.",
      "Mantén la posición durante un segundo y baja de manera controlada.",
      "Repite el movimiento."
    ]
  },
  {
    id: 6,
    name: 'Step-ups',
    description: 'Fortalece piernas y glúteos. Sube y baja un escalón alternando piernas.',
    type: 'Fuerza',
    equipment: 'Con/sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/8wugVATDFok?si=nv-Iek0kVG5ZkMUx',
    instructions: [
      "Colócate frente a un escalón o banco.",
      "Sube con una pierna y levanta la otra hasta la altura de la cadera.",
      "Baja de manera controlada y alterna las piernas.",
      "Repite el movimiento."
    ]
  },
  {
    id: 7,
    name: 'Fondos de tríceps en silla',
    description: 'Fortalece tríceps. Usa una silla para bajar y subir el cuerpo.',
    type: 'Fuerza',
    equipment: 'Silla',
    muscleGroup: 'Brazos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/SFqqH-fPawk?si=jM-3SXMnJ89ElADp',
    instructions: [
      "Apoya las manos en el borde de una silla con las piernas extendidas.",
      "Baja el cuerpo doblando los codos hasta 90 grados.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 8,
    name: 'Abdominales crunch',
    description: 'Fortalece los abdominales. Levanta el torso hacia las rodillas.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Abdomen',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/OsUz898onTE?si=42NiFnuA6yClwetV',
    instructions: [
      "Acuéstate boca arriba con las rodillas flexionadas.",
      "Levanta el torso contrayendo los abdominales.",
      "Baja de manera controlada y repite."
    ]
  },
  {
    id: 9,
    name: 'Elevaciones de talones',
    description: 'Fortalece las pantorrillas. Levanta los talones del suelo.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: true,
    poseCorrection: 'heelRaiseCorrection',
    time: false,
    image: require('../assets/eimg/HeelRaise.jpg'),
    videoLink: 'https://youtu.be/hBS3yt6nY9s?si=56qytLfbmSXhXeJv',
    instructions: [
      "Párate con los pies separados a la altura de las caderas.",
      "Levanta los talones apoyándote en las puntas de los pies.",
      "Baja de manera controlada y repite."
    ]
  },
  {
    id: 10,
    name: 'Superman',
    description: 'Fortalece la espalda baja. Levanta brazos y piernas al mismo tiempo.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Espalda',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/z6PJMT2y8GQ?si=okcyjcCtMQ0305PQ',
    instructions: [
      "Acuéstate boca abajo con los brazos y piernas extendidos.",
      "Levanta brazos y piernas al mismo tiempo.",
      "Baja de manera controlada y repite."
    ]
  },
  {
    id: 11,
    name: 'Mountain climbers',
    description: 'Lleva las rodillas al pecho alternadamente. Fortalece el core.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Core',
    hasPoseCorrection: false,
    time: true,
    videoLink: 'https://youtu.be/FPLXxBxYcmE?si=oBwRKjiCOFnXG6V9',
    instructions: [
      "Colócate en posición de plancha con las manos apoyadas en el suelo.",
      "Lleva una rodilla hacia el pecho, manteniendo el cuerpo recto.",
      "Alterna rápidamente las piernas, como si estuvieras corriendo en el lugar.",
      "Mantén el ritmo y asegúrate de que los movimientos sean controlados.",
      "Repite el movimiento."
    ]
  },
  {
    id: 12,
    name: 'Flexiones diamante',
    description: 'Flexiones con las manos juntas en forma de diamante. Enfoca los tríceps.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Brazos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/ITe43DiSvrE?si=CWxY7qvXwnnNw5Gm',
    instructions: [
      "Colócate en posición de plancha con las manos juntas, formando un diamante con los dedos.",
      "Mantén el cuerpo recto desde la cabeza hasta los talones.",
      "Baja el cuerpo doblando los codos hasta que el pecho casi toque las manos.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 13,
    name: 'Sentadilla isométrica',
    description: 'Mantén la posición de sentadilla sin moverte. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: true,
    videoLink: 'https://youtu.be/-qXuHrdmk4g?si=_xE9ajTygnBpxlmm',
    instructions: [
      "Párate con los pies a la altura de los hombros.",
      "Baja lentamente doblando las rodillas, manteniendo la espalda recta.",
      "Desciende hasta que tus muslos estén paralelos al suelo.",
      "Mantén la posición durante el tiempo indicado.",
      "Asegúrate de que las rodillas no sobrepasen la punta de los pies."
    ]
  },
  {
    id: 14,
    name: 'Plancha lateral',
    description: 'Mantén el cuerpo recto de lado apoyado en un antebrazo. Fortalece el core.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Core',
    hasPoseCorrection: false,
    time: true,
    videoLink: 'https://youtu.be/bRivOELQVOs?si=2u0eIKLaJTgQIMX8',
    instructions: [
      "Acuéstate de lado con las piernas estiradas y apoya el antebrazo en el suelo.",
      "Levanta la cadera hasta que el cuerpo forme una línea recta desde la cabeza hasta los pies.",
      "Mantén la posición durante el tiempo indicado.",
      "Asegúrate de que el cuerpo no se hunda ni se eleve demasiado.",
      "Repite del otro lado."
    ]
  },
  {
    id: 15,
    name: 'Burpees',
    description: 'Combina flexión, salto y extensión completa del cuerpo. Ejercicio de cuerpo completo.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Cuerpo completo',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/IYusabTdFEo?si=Zs9zKxKy5-JhW5ma',
    instructions: [
      "Comienza de pie con los pies separados a la altura de los hombros.",
      "Baja al suelo colocando las manos en el suelo y saltando con los pies hacia atrás, llegando a la posición de plancha.",
      "Haz una flexión de brazos.",
      "Salta con los pies hacia las manos y luego salta explosivamente hacia arriba con los brazos extendidos.",
      "Repite el movimiento."
    ]
  },
  {
    id: 16,
    name: 'Saltos de tijera',
    description: 'Salta abriendo piernas y brazos al mismo tiempo. Mejora la resistencia cardiovascular.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Cuerpo completo',
    hasPoseCorrection: true,
    poseCorrection: 'jumpingJackCorrection',
    time: false,
    image: require('../assets/eimg/JumpingJack.jpg'),
    videoLink: 'https://youtu.be/iSSAk4XCsRA?si=BlITzUI0tTdU0zYW',
    instructions: [
      "Párate con los pies juntos y los brazos a los lados del cuerpo.",
      "Salta abriendo las piernas a la altura de los hombros y levantando los brazos por encima de la cabeza.",
      "Vuelve a la posición inicial saltando nuevamente.",
      "Mantén el ritmo y asegúrate de que los movimientos sean controlados.",
      "Repite el movimiento."
    ]
  },
  {
    id: 17,
    name: 'Flexiones inclinadas',
    description: 'Flexiones con las manos apoyadas en una superficie elevada. Ideal para principiantes.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Pecho',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/uCTbmCjiF7Y?si=JFxu3WLCKVkp4f6Q',
    instructions: [
      "Colócate frente a una superficie elevada, como un banco o una silla.",
      "Apoya las manos en la superficie y estira las piernas hacia atrás, manteniendo el cuerpo recto.",
      "Baja el cuerpo doblando los codos hasta que el pecho casi toque la superficie.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 18,
    name: 'Sentadilla sumo',
    description: 'Sentadilla con las piernas más abiertas y pies apuntando hacia afuera. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/QLwBxuaL4QY?si=-adWv2uM9YlixP3y',
    instructions: [
      "Párate con los pies más anchos que los hombros y los dedos de los pies apuntando hacia afuera.",
      "Baja lentamente doblando las rodillas, manteniendo la espalda recta.",
      "Desciende hasta que tus muslos estén paralelos al suelo.",
      "Empuja con los talones para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 19,
    name: 'Elevaciones de piernas',
    description: 'Levanta las piernas rectas hacia el techo. Fortalece los abdominales.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Abdomen',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/Ulzxpy5S0QU?si=KUvl6DDrLCgAcpMr',
    instructions: [
      "Acuéstate boca arriba con las piernas estiradas y los brazos a los lados del cuerpo.",
      "Levanta las piernas rectas hacia el techo, manteniendo la espalda baja pegada al suelo.",
      "Baja las piernas de manera controlada hasta casi tocar el suelo.",
      "Repite el movimiento."
    ]
  },
  {
    id: 20,
    name: 'Patada de glúteo',
    description: 'Levanta una pierna hacia atrás apretando el glúteo. Fortalece glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Glúteos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/efdtizTcRT4?si=NjF4q6E3ARMGB8_w',
    instructions: [
      "Colócate en posición de cuadrupedia, apoyando las manos y las rodillas en el suelo.",
      "Levanta una pierna hacia atrás, manteniendo la rodilla flexionada a 90 grados.",
      "Aprieta el glúteo al levantar la pierna.",
      "Baja la pierna de manera controlada y repite el movimiento.",
      "Alterna las piernas."
    ]
  },
  {
    id: 21,
    name: 'Flexiones de pared',
    description: 'Flexiones apoyado en una pared. Ideal para principiantes.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Pecho',
    hasPoseCorrection: true,
    poseCorrection: 'wallPushUpCorrection',
    time: false,
    image: require('../assets/eimg/WallPush.jpg'),
    videoLink: 'https://youtu.be/ujqbL-Anr9A?si=jBDJESv4YPZ9kpeW',
    instructions: [
      "Colócate frente a una pared con los pies separados a la altura de las caderas.",
      "Apoya las manos en la pared a la altura de los hombros.",
      "Baja el cuerpo doblando los codos hasta que la cabeza casi toque la pared.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 22,
    name: 'Caminata de cangrejo',
    description: 'Camina hacia atrás apoyado en manos y pies. Fortalece brazos y core.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Brazos',
    hasPoseCorrection: false,
    time: true,
    videoLink: 'https://youtu.be/pPYUMzhWbuQ?si=AM8c4wYsKz1Bf7lB',
    instructions: [
      "Siéntate en el suelo con las rodillas flexionadas y las manos apoyadas detrás de ti.",
      "Levanta la cadera del suelo, apoyándote en las manos y los pies.",
      "Camina hacia atrás moviendo las manos y los pies alternadamente.",
      "Mantén el cuerpo recto y los abdominales contraídos.",
      "Repite el movimiento."
    ]
  },
  {
    id: 25,
    name: 'Sentadilla con salto',
    description: 'Haz una sentadilla y salta explosivamente al subir. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/IiHH0EWo8-k?si=n3UUTlqzKNdiUE2o',
    instructions: [
      "Párate con los pies a la altura de los hombros.",
      "Baja lentamente doblando las rodillas, manteniendo la espalda recta.",
      "Desciende hasta que tus muslos estén paralelos al suelo.",
      "Salta explosivamente hacia arriba, extendiendo los brazos hacia el techo.",
      "Aterriza suavemente y repite el movimiento."
    ]
  },
  {
    id: 26,
    name: 'Plancha con levantamiento de brazo',
    description: 'En plancha, levanta un brazo hacia adelante alternadamente. Fortalece el core.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Core',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/JeLFDGn4Dbk?si=4tDXJHLG_IgFGedu',
    instructions: [
      "Colócate en posición de plancha con las manos apoyadas en el suelo.",
      "Levanta un brazo hacia adelante, manteniendo el cuerpo recto y estable.",
      "Baja el brazo de manera controlada y repite el movimiento con el otro brazo.",
      "Alterna los brazos durante el ejercicio.",
      "Mantén el core contraído para evitar que la cadera se mueva."
    ]
  },
  {
    id: 27,
    name: 'Abdominales bicicleta',
    description: 'Imita el pedaleo de una bicicleta con las piernas. Fortalece los abdominales.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Abdomen',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/apmprS8H1MY?si=XshgRURLTY85vEqE',
    instructions: [
      "Acuéstate boca arriba con las manos detrás de la cabeza y las piernas levantadas.",
      "Lleva el codo derecho hacia la rodilla izquierda mientras estiras la pierna derecha.",
      "Alterna el movimiento, llevando el codo izquierdo hacia la rodilla derecha.",
      "Mantén el ritmo y asegúrate de que los movimientos sean controlados.",
      "Repite el movimiento."
    ]
  },
  {
    id: 28,
    name: 'Elevaciones frontales de brazos',
    description: 'Eleva los brazos al frente por encima de los hombros. Fortalece los hombros.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Hombros',
    hasPoseCorrection: true,
    poseCorrection: 'frontRaiseCorrection',
    time: false,
    image: require('../assets/eimg/FrontRaise.jpg'),
    videoLink: 'https://youtu.be/NDvhv8gbxV0?si=z2cgdC_xvz-P8-5R',
    instructions: [
      "Colócate de pie con los pies al ancho de las caderas y los brazos a los costados.",
      "Levanta los brazos extendidos al frente, pasando el nivel de los hombros.",
      "Haz una breve pausa arriba y baja con control.",
      "Repite sin usar impulso del cuerpo."
    ]
  },
  {
    id: 29,
    name: 'Zancadas laterales',
    description: 'Da un paso hacia un lado y flexiona la rodilla. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/DwU1_3v9NnY?si=syoiLlP7-PW8CEUt',
    instructions: [
      "Párate con los pies separados a la altura de las caderas.",
      "Da un paso hacia un lado con una pierna y flexiona la rodilla, manteniendo la otra pierna estirada.",
      "Baja el cuerpo hasta que la rodilla flexionada esté a 90 grados.",
      "Empuja con la pierna flexionada para volver a la posición inicial.",
      "Alterna las piernas y repite el movimiento."
    ]
  },
  {
    id: 30,
    name: 'Flexiones de rodillas',
    description: 'Flexiones apoyado en las rodillas. Ideal para principiantes.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Pecho',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/NhtUptsdnbw?si=2ZD7fOLTIPqVuUAq',
    instructions: [
      "Colócate en posición de plancha con las rodillas apoyadas en el suelo.",
      "Mantén el cuerpo recto desde la cabeza hasta las rodillas.",
      "Baja el cuerpo doblando los codos hasta que el pecho casi toque el suelo.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 31,
    name: 'Puente de glúteos con una pierna',
    description: 'Puente de glúteos levantando una pierna hacia el techo. Fortalece glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Glúteos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/S0oUDi076k8?si=zXYbHkDN8PSCrfnR',
    instructions: [
      "Acuéstate boca arriba con las rodillas flexionadas y los pies apoyados en el suelo.",
      "Levanta una pierna hacia el techo, manteniéndola estirada.",
      "Levanta la cadera apretando los glúteos hasta que el cuerpo forme una línea recta desde los hombros hasta la rodilla apoyada.",
      "Baja la cadera de manera controlada y repite el movimiento.",
      "Alterna las piernas."
    ]
  },
  {
    id: 32,
    name: 'Saltos en cuclillas',
    description: 'Salta desde la posición de cuclillas. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/rp_ZKQ1FZvM?si=NsF7xApSDE2yMF8x',
    instructions: [
      "Colócate de pie con los pies separados al ancho de los hombros.",
      "Flexiona las rodillas y baja en cuclillas, manteniendo la espalda recta.",
      "Desciende hasta que los muslos estén casi paralelos al suelo.",
      "Realiza un salto corto y controlado, sin perder el ritmo.",
      "Aterriza suavemente con las rodillas ligeramente flexionadas y repite de forma continua."
    ]

  },
  {
    id: 33,
    name: 'Plancha con rotación',
    description: 'En plancha, rota el cuerpo llevando un brazo hacia el techo. Fortalece el core.',
    type: 'Resistencia',
    equipment: 'Sin equipo',
    muscleGroup: 'Core',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/cEGenJ4gESA?si=2ZtmZppDIzzJvKsM',
    instructions: [
      "Colócate en posición de plancha con las manos apoyadas en el suelo.",
      "Rota el cuerpo llevando un brazo hacia el techo, manteniendo el cuerpo recto.",
      "Vuelve a la posición inicial y repite el movimiento con el otro brazo.",
      "Alterna los brazos durante el ejercicio.",
      "Mantén el core contraído para evitar que la cadera se mueva."
    ]
  },
  {
    id: 34,
    name: 'Sentadilla búlgara',
    description: 'Apoya un pie en una superficie elevada y haz sentadillas con la otra pierna. Fortalece piernas.',
    type: 'Fuerza',
    equipment: 'Banco o silla',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/K-6DG1hcHzU?si=6Kik5EpyrUDc-02d',
    instructions: [
      "Párate frente a un banco o silla con los pies separados a la altura de las caderas.",
      "Apoya un pie en la superficie elevada detrás de ti.",
      "Baja el cuerpo doblando la rodilla de la pierna delantera, manteniendo la espalda recta.",
      "Desciende hasta que la rodilla delantera esté a 90 grados.",
      "Empuja con la pierna delantera para volver a la posición inicial.",
      "Repite el movimiento y alterna las piernas."
    ]
  },
  {
    id: 35,
    name: 'Flexiones de tríceps en el suelo',
    description: 'Acostado boca arriba, levanta y baja el cuerpo usando los tríceps. Fortalece los brazos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Brazos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/WOol6ujXzQE?si=IhC6cbW6GKlbozIb',
    instructions: [
      "Acuéstate boca arriba con las rodillas flexionadas y los pies apoyados en el suelo.",
      "Coloca las manos a los lados del cuerpo con las palmas hacia abajo.",
      "Levanta el cuerpo usando los tríceps, manteniendo los codos cerca del cuerpo.",
      "Baja el cuerpo de manera controlada hasta casi tocar el suelo.",
      "Repite el movimiento."
    ]
  },
  {
    id: 36,
    name: 'Elevaciones de piernas laterales',
    description: 'De lado, levanta una pierna hacia arriba. Fortalece los glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Glúteos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/Gh6DFG1D2Po?si=cjlqQylhIcyl2Kwv',
    instructions: [
      "Acuéstate de lado con las piernas estiradas y apoya la cabeza en el brazo inferior.",
      "Levanta la pierna superior hacia arriba, manteniéndola estirada.",
      "Baja la pierna de manera controlada y repite el movimiento.",
      "Alterna los lados."
    ]
  },
  {
    id: 37,
    name: 'Círculos con brazos',
    description: 'Haz círculos grandes con los brazos extendidos. Fortalece los hombros.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Hombros',
    hasPoseCorrection: true,
    poseCorrection: 'armCirclesCorrection',
    time: false,
    image: require('../assets/eimg/ArmCircles.jpg'),
    videoLink: 'https://youtu.be/YTueIW_xapc?si=b2ppWdZIhSMDyTVo',
    instructions: [
      "Párate con los pies separados a la altura de las caderas y los brazos extendidos a los lados.",
      "Haz círculos grandes con los brazos, manteniéndolos rectos.",
      "Alterna la dirección de los círculos después de un tiempo.",
      "Mantén el ritmo y asegúrate de que los movimientos sean controlados.",
      "Repite el movimiento."
    ]
  },
  {
    id: 38,
    name: 'Sentadilla con patada lateral',
    description: 'Haz una sentadilla y al subir, da una patada lateral con una pierna. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Sin equipo',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/7_Ue6jMA-JM?si=GFFPEzNdsSwTrIKZ',
    instructions: [
      "Párate con los pies a la altura de los hombros.",
      "Baja lentamente doblando las rodillas, manteniendo la espalda recta.",
      "Desciende hasta que tus muslos estén paralelos al suelo.",
      "Al subir, da una patada lateral con una pierna.",
      "Alterna las piernas y repite el movimiento."
    ]
  },
  {
    id: 39,
    name: 'Press de hombros con mancuernas',
    description: 'Levanta mancuernas por encima de la cabeza. Fortalece los hombros.',
    type: 'Fuerza',
    equipment: 'Mancuernas',
    muscleGroup: 'Hombros',
    hasPoseCorrection: true,
    poseCorrection: 'shoulderPressCorrection',
    time: false,
    image: require('../assets/eimg/ShoulderPress.jpg'),
    videoLink: 'https://youtu.be/JVrewkzyUKY?si=0OljjIMbC1HykFB4',
    instructions: [
      "Párate con los pies separados a la altura de las caderas y sostén una mancuerna en cada mano.",
      "Levanta las mancuernas a la altura de los hombros con las palmas hacia adelante.",
      "Empuja las mancuernas hacia arriba hasta que los brazos estén completamente extendidos.",
      "Baja las mancuernas de manera controlada hasta la altura de los hombros.",
      "Repite el movimiento."
    ]
  },
  {
    id: 40,
    name: 'Remo con mancuernas',
    description: 'Inclínate y levanta mancuernas hacia el torso. Fortalece la espalda.',
    type: 'Fuerza',
    equipment: 'Mancuernas',
    muscleGroup: 'Espalda',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/A1wX8qxm0Pk?si=9tnDzdjEUxGuM-_P',
    instructions: [
      "Párate con los pies separados a la altura de las caderas y sostén una mancuerna en cada mano.",
      "Inclínate hacia adelante manteniendo la espalda recta.",
      "Levanta las mancuernas hacia el torso, doblando los codos.",
      "Baja las mancuernas de manera controlada.",
      "Repite el movimiento."
    ]
  },
  {
    id: 41,
    name: 'Peso muerto con mancuernas',
    description: 'Levanta mancuernas desde el suelo manteniendo la espalda recta. Fortalece piernas y espalda.',
    type: 'Fuerza',
    equipment: 'Mancuernas',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/TITJAzojdG8?si=B5EtoXVwwz7U6zKR',
    instructions: [
      "Párate con los pies separados a la altura de las caderas y sostén una mancuerna en cada mano.",
      "Baja las mancuernas hacia el suelo, manteniendo la espalda recta y las rodillas ligeramente flexionadas.",
      "Levanta las mancuernas extendiendo las caderas y las rodillas.",
      "Mantén las mancuernas cerca del cuerpo durante el movimiento.",
      "Repite el movimiento."
    ]
  },
  {
    id: 42,
    name: 'Curl de bíceps con mancuernas',
    description: 'Levanta mancuernas flexionando los codos. Fortalece los bíceps.',
    type: 'Fuerza',
    equipment: 'Mancuernas',
    muscleGroup: 'Brazos',
    hasPoseCorrection: true,
    poseCorrection: 'bicepCurlCorrection',
    time: false,
    image: require('../assets/eimg/BicepCurl.jpeg'),
    videoLink: 'https://youtu.be/HU2lghjU29Y?si=0XKy_ypnwEzE3xMJ',
    instructions: [
      "Párate con los pies separados a la altura de las caderas y sostén una mancuerna en cada mano.",
      "Levanta las mancuernas flexionando los codos, manteniendo los brazos cerca del cuerpo.",
      "Baja las mancuernas de manera controlada.",
      "Repite el movimiento."
    ]
  },
  {
    id: 43,
    name: 'Fondos en paralelas',
    description: 'Usa barras paralelas para bajar y subir el cuerpo. Fortalece tríceps y pecho.',
    type: 'Fuerza',
    equipment: 'Barras paralelas',
    muscleGroup: 'Brazos',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/fJ5QdPGMkiY?si=Hi-w58Our2GC3jrT',
    instructions: [
      "Colócate entre las barras paralelas y apoya las manos en ellas.",
      "Baja el cuerpo doblando los codos hasta que los brazos estén a 90 grados.",
      "Empuja con los brazos para volver a la posición inicial.",
      "Repite el movimiento."
    ]
  },
  {
    id: 44,
    name: 'Elevaciones laterales con mancuernas',
    description: 'Levanta mancuernas a los lados hasta la altura de los hombros. Fortalece los hombros.',
    type: 'Fuerza',
    equipment: 'Mancuernas',
    muscleGroup: 'Hombros',
    hasPoseCorrection: true,
    poseCorrection: 'lateralRaiseCorrection',
    time: false,
    image: require('../assets/eimg/LateralRaise.jpg'),
    videoLink: 'https://youtu.be/dT6Q3NHtSjw?si=MUtar4HICKjiu7M3',
    instructions: [
      "Párate con los pies separados a la altura de las caderas y sostén una mancuerna en cada mano.",
      "Levanta las mancuernas a los lados hasta la altura de los hombros, manteniendo los brazos rectos.",
      "Baja las mancuernas de manera controlada.",
      "Repite el movimiento."
    ]
  },
  {
    id: 45,
    name: 'Sentadilla con salto y mancuernas',
    description: 'Haz una sentadilla y salta explosivamente al subir, sosteniendo mancuernas. Fortalece piernas y glúteos.',
    type: 'Fuerza',
    equipment: 'Mancuernas',
    muscleGroup: 'Piernas',
    hasPoseCorrection: false,
    time: false,
    videoLink: 'https://youtu.be/gNmJdQxTX7Y?si=w2MfwVSWUoHNwSqb',
    instructions: [
      "Párate con los pies a la altura de los hombros y sostén una mancuerna en cada mano.",
      "Baja lentamente doblando las rodillas, manteniendo la espalda recta.",
      "Desciende hasta que tus muslos estén paralelos al suelo.",
      "Salta explosivamente hacia arriba, extendiendo los brazos hacia el techo.",
      "Aterriza suavemente y repite el movimiento."
    ]
  },
];

export default exerciseData;