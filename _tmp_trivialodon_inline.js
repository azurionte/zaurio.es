
    const SUPABASE_URL = "https://adpjitccwwvlydrtvvqk.supabase.co";
    const SUPABASE_KEY = "sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk";
    const FRAME_SRC = "/shared/assets/brand/participantes-frame.png";
    const AVATAR_OPTIONS = [
      {id:"blue_black",label:"Sombra",src:"/trivialodon/assets/avatars/blue_black.png"},
      {id:"blue_orange",label:"Chispa",src:"/trivialodon/assets/avatars/blue_orange.png"},
      {id:"green_red",label:"Roco",src:"/trivialodon/assets/avatars/green_red.png"},
      {id:"orange_blue",label:"Tango",src:"/trivialodon/assets/avatars/orange_blue.png"},
      {id:"pink_green",label:"Lima",src:"/trivialodon/assets/avatars/pink_green.png"},
      {id:"purple_yellow",label:"Mora",src:"/trivialodon/assets/avatars/purple_yellow.png"},
      {id:"red_green",label:"Fiera",src:"/trivialodon/assets/avatars/red_green.png"},
      {id:"yellow_purple",label:"Solis",src:"/trivialodon/assets/avatars/yellow_purple.png"}
    ];
    const MODES = [
      {id:"classic",icon:"\uD83C\uDFA9",titleKey:"mode_classic_title",descKey:"mode_classic_desc"},
      {id:"custom",icon:"\uD83D\uDEE0",titleKey:"mode_custom_title",descKey:"mode_custom_desc"}
    ];
    const DURATIONS = [
      {id:"timed",icon:"\u23F1",titleKey:"duration_timed_title",descKey:"duration_timed_desc"},
      {id:"questions",icon:"?",titleKey:"duration_questions_title",descKey:"duration_questions_desc"},
      {id:"olympic",icon:"\uD83C\uDFC6",titleKey:"duration_olympic_title",descKey:"duration_olympic_desc"}
    ];
    const CLASSIC_TOTAL_QUESTIONS = 300;
    const LANGUAGE_KEY = "trivialodon-lang-v1";
    const DEFAULT_LANG = (() => {
      try{
        const saved = String(localStorage.getItem(LANGUAGE_KEY) || "").toLowerCase();
        if(saved === "en" || saved === "es") return saved;
      } catch(_){ }
      return String(navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
    })();
    let currentLang = DEFAULT_LANG;
    const I18N = {
      es:{
        introLead:"El juego de trivia mas actualizado y divertido.",
        continueGame:"Continuar partida",
        host:"Soy el anfitrion",
        guest:"Soy el invitado",
        settingsLanguage:"Idioma",
        settingsGame:"Partida",
        endGame:"Terminar partida",
        exit:"Salir",
        home:"Inicio",
        audio:"Sonido",
        mute:"Silenciar",
        unmute:"Activar sonido",
        audioSettings:"Audio y ajustes",
        openMenu:"Abrir menu de Zaurio",
        volume:"Volumen",
        tv:"TV",
        noDevice:"Sin dispositivo conectado",
        castHintReady:"Busca tu Chromecast y lanza la pantalla de TV de la sala actual.",
        castHintNeedRoom:"Primero entra en una sala para poder enviarla a la TV.",
        castVolume:"Volumen de la TV",
        sendToTv:"Enviar a TV",
        reconnectTv:"Reconectar TV",
        muteTv:"Mute TV",
        unmuteTv:"Activar audio TV",
        disconnect:"Desconectar",
        castOpening:"Abriendo selector de Chromecast...",
        castMuteError:"No he podido cambiar el mute de la TV.",
        castVolumeError:"No he podido ajustar el volumen de la TV.",
        room:"Sala",
        guestKicker:"Invitado",
        roomCode:"Codigo de sala",
        yourName:"Tu nombre",
        chooseAvatar:"Escoge tu avatar",
        nameExample:"Ejemplo: Marta Rex",
        back:"Volver",
        next:"Siguiente",
        avatarPrev:"Avatar anterior",
        avatarNext:"Avatar siguiente",
        joinTitle:"Introduce el codigo de sala",
        joinLead:"Primero entramos en la sala. En la siguiente pantalla ya te pedire nombre y avatar.",
        joinHint:"Escribe el codigo tal como te lo haya dado el anfitrion.",
        playersList:"Lista de jugadores",
        preparingRoom:"Preparando la sala",
        lobbyDesc:"Quien haya entrado pero aun no este listo aparece con dinosaurio y una frase divertida.",
        setup:"Configuracion",
        setupTitle:"Preparamos la partida",
        setupDesc:"Elige el modo y la duracion antes de lanzar la ronda.",
        modesTitle:"Modos de juego",
        modesLead:"Escoge entre la experiencia clasica o una ronda personalizada.",
        durationTitle:"Duracion",
        durationLead:"Decide si la partida va por tiempo, por numero de preguntas o en formato olimpico.",
        mode_classic_title:"Trivialodon classic",
        mode_classic_desc:"Rondas elegantes con ritmo de concurso clasico.",
        mode_custom_title:"Personalizado",
        mode_custom_desc:"Ajusta el tono del juego y juega a tu manera.",
        duration_timed_title:"Quiero que dure un tiempo determinado",
        duration_timed_desc:"Sesiones por tiempo flexible.",
        duration_questions_title:"Quiero que dure una cantidad de preguntas determinada",
        duration_questions_desc:"Controlas la longitud por numero de preguntas.",
        duration_olympic_title:"Trivialodon olimpico",
        duration_olympic_desc:"Formato oficial de 40 minutos.",
        personalized:"Personalizado",
        generatingTitle:"Trivialodon esta montando la ronda",
        pausedKicker:"Sesion",
        gamePaused:"Juego pausado",
        pausedHost:"Has pausado la partida entre preguntas. Reanudamos cuando quieras.",
        pausedGuest:"El anfitrion ha pausado la partida. Espera a que vuelva el rugido.",
        resume:"Reanudar",
        countdown:"Cuenta atras",
        countdownCopy:"Respira. Enseguida empieza la accion.",
        surpriseCategory:"Categoria sorpresa",
        question:"Pregunta",
        questionLead:"Marca tu respuesta antes de que termine la cuenta atras.",
        answerKicker:"Respuesta correcta",
        scoresKicker:"Marcador",
        scoreSession:"Puntos de esta sesion",
        scoreRound:"Puntuacion del round",
        scoreLead:"Un momento para leer el ranking.",
        close:"Cerrar",
        savedSession:"Sesion guardada",
        resumeTitle:"Quieres continuar donde lo dejaste?",
        resumeText:"Hemos recuperado tu sala, tu perfil y el estado actual. Puedes seguir jugando o empezar desde cero.",
        newGame:"Empezar nueva partida",
        continuePlay:"Continuar juego",
        durationKickerModal:"Duracion",
        durationModalTitle:"Configura la duracion",
        durationMinutesLabel:"Minutos de partida",
        durationQuestionsLabel:"Numero de preguntas",
        cancel:"Cancelar",
        accept:"Aceptar",
        customKicker:"Personalizado",
        customTitle:"Define el estilo de la ronda",
        theme:"Tema",
        tone:"Tono",
        difficulty:"Dificultad",
        customThemePlaceholder:"Ejemplo: ciencia, cine, actualidad, videojuegos",
        extraPrompt:"Indicacion extra",
        save:"Guardar",
        player:"Jugador",
        noName:"Sin nombre",
        points:"Puntos",
        nobodyYet:"Nadie todavia",
        roomWaits:"La sala espera al primer dino.",
        hostReady:"Anfitrion listo",
        guestReady:"Invitado listo",
        notReadyYet:"Aun no ha pulsado listo",
        allAlmostReady:"Todos casi listos",
        whenEveryoneReady:"Cuando todos hayan pulsado listo, puedes pasar a la configuracion del juego.",
        waitingInRoom:"Esperando en sala",
        gameClosed:"Partida cerrada",
        players:"Jugadores",
        hostProfileTitle:"Comparte el codigo de sala",
        guestProfileTitle:"Prepara tu ficha",
        hostProfileSideTitle:"Preparando la sala",
        guestProfileSideTitle:"Sala encontrada",
        hostProfileSideText:"Comparte el codigo de sala y espera a que entren los invitados.",
        guestProfileSideText:"Ya estas dentro. Ahora solo falta tu nombre y tu avatar.",
        hostConfiguring:"El anfitrion esta configurando la partida.",
        showQuestionAlone:"Mostrar pregunta sola",
        answerSeconds:"Tiempo para responder",
        generateQuestions:"Generar {count} preguntas",
        startQuestions:"Empezar {count} preguntas",
        generatingQuestions:"Generando {count} preguntas...",
        minutesQuestion:"Cuantos minutos quieres jugar",
        countQuestion:"Cuantas preguntas quieres jugar",
        couldNotPrepareQuestions:"No he podido preparar las preguntas ahora mismo.",
        enteringRoom:"Entrando en la sala...",
        currentLeader:"Lider actual",
        inRace:"En carrera",
        noScoresYet:"Aun no hay puntuaciones.",
        victory:"Victoria Jurasica!",
        defeat:"Has perdido :(",
        championText:"Te coronas con {score} puntos. Rugido de campeon.",
        defeatText:"Te tocara saborear las sobras. Pero la proxima remontas.",
        leadsGame:"{name} lidera la partida",
        accumulatedPoints:"{score} puntos acumulados",
        continueSession:"Continuar partida",
        newSession:"Partida nueva",
        tiebreakKicker:"Desempate jurasico",
        tiebreakTitle:"VERSUS!",
        tiebreakLead:"Dos dinos no pueden seguir empatando.",
        tiebreakCopy:"En cuanto acabe la cuenta atras pasaremos a las manos. Tendreis 5 segundos para marcar.",
        versusKicker:"Combate",
        versusTitle:"Decidid con las manos",
        versusRound:"Ronda {round}",
        decisiveRound:"Ronda decisiva",
        duelResolved:"Duelo resuelto",
        hiddenChoice:"Eleccion oculta",
        yourDuel:"Tu duelo",
        inDuel:"En duelo",
        markNow:"Marca ya",
        haveSecondsToMark:"Teneis 5 segundos para marcar.",
        timeResolving:"Tiempo. Resolviendo la mano...",
        onlyDuelists:"Solo los duelistas pueden marcar. El resto observa.",
        drawHands:"Empate. Otra vez a las manos.",
        roundWinner:"{name} gana esta mano. Seguimos con el mejor de 3.",
        finalVsWinner:"{name} gana el VS y se lleva {points} puntos extra.",
        winner:"Ganador",
        waitingForYourMark:"Esperando tu marca",
        versusChampionTitle:"{name} domina la era jurasica",
        bestOfThree:"Mejor de 3",
        chooseAnswer:"Elegir",
        selected:"Elegida",
        yourAnswer:"Tuya",
        locked:"Bloqueada",
        pick:"Coger",
        pause:"Pausar",
        questionProgress:"Pregunta {current} de {total}",
        preparingVelociraptor:"Preparando Modo Velociraptor!",
        preparingAnswers:"Preparando respuestas...",
        timeUp:"Tiempo. Mira la correcta y quedate con el dato curioso.",
        timeUpSpeed:"Tiempo. Mira el ranking completo del Modo Velociraptor!.",
        speedReadyInfo:"Modo Velociraptor! Cada respuesta se bloquea al instante y da puntos distintos.",
        speedCountdownNotice:"Atencion: se acerca un Modo Velociraptor!",
        category:"Categoria",
        pointsShort:"pts",
        correct:"Correcta",
        funFact:"Fun fact",
        correctOrder:"Orden correcto",
        answerLoading:"Preparando respuestas...",
        speedMode:"Modo Velociraptor!",
        languageLabelEs:"Español",
        languageLabelEn:"English",
        tone_divertido:"Divertido",
        tone_televisivo:"Televisivo",
        tone_serio:"Serio",
        tone_familiar:"Familiar",
        difficulty_facil:"Facil",
        difficulty_media:"Media",
        difficulty_dificil:"Dificil"
      },
      en:{
        introLead:"The freshest and most fun trivia game around.",
        continueGame:"Resume game",
        host:"I'm the host",
        guest:"I'm a guest",
        settingsLanguage:"Language",
        settingsGame:"Game",
        endGame:"End game",
        exit:"Leave",
        home:"Home",
        audio:"Sound",
        mute:"Mute",
        unmute:"Unmute",
        audioSettings:"Audio settings",
        openMenu:"Open Zaurio menu",
        volume:"Volume",
        tv:"TV",
        noDevice:"No device connected",
        castHintReady:"Find your Chromecast and launch the room's TV screen.",
        castHintNeedRoom:"Join a room first so you can send it to the TV.",
        castVolume:"TV volume",
        sendToTv:"Cast to TV",
        reconnectTv:"Reconnect TV",
        muteTv:"Mute TV",
        unmuteTv:"Unmute TV",
        disconnect:"Disconnect",
        castOpening:"Opening Chromecast selector...",
        castMuteError:"Could not change TV mute.",
        castVolumeError:"Could not adjust TV volume.",
        room:"Room",
        guestKicker:"Guest",
        roomCode:"Room code",
        yourName:"Your name",
        chooseAvatar:"Choose your avatar",
        nameExample:"Example: Jamie Rex",
        back:"Back",
        next:"Next",
        avatarPrev:"Previous avatar",
        avatarNext:"Next avatar",
        joinTitle:"Enter the room code",
        joinLead:"First we join the room. On the next screen I'll ask for your name and avatar.",
        joinHint:"Type the code exactly as the host gave it to you.",
        playersList:"Players",
        preparingRoom:"Setting up the room",
        lobbyDesc:"Anyone who joined but isn't ready yet shows up with a dinosaur and a funny line.",
        setup:"Setup",
        setupTitle:"Let's set up the match",
        setupDesc:"Choose the mode and duration before starting the round.",
        modesTitle:"Game modes",
        modesLead:"Pick between the classic experience or a custom round.",
        durationTitle:"Duration",
        durationLead:"Choose whether the match runs by time, by question count, or in olympic format.",
        mode_classic_title:"Trivialodon classic",
        mode_classic_desc:"Elegant rounds with classic quiz rhythm.",
        mode_custom_title:"Custom",
        mode_custom_desc:"Shape the round and play your way.",
        duration_timed_title:"I want it to last a specific time",
        duration_timed_desc:"Flexible time sessions.",
        duration_questions_title:"I want it to last a specific number of questions",
        duration_questions_desc:"You control length by question count.",
        duration_olympic_title:"Trivialodon Olympic",
        duration_olympic_desc:"Official 40-minute format.",
        personalized:"Custom",
        generatingTitle:"Trivialodon is building the round",
        pausedKicker:"Session",
        gamePaused:"Game paused",
        pausedHost:"You've paused the game between questions. We can resume whenever you want.",
        pausedGuest:"The host has paused the game. Wait for the roar to come back.",
        resume:"Resume",
        countdown:"Countdown",
        countdownCopy:"Breathe in. The action starts in a moment.",
        surpriseCategory:"Surprise category",
        question:"Question",
        questionLead:"Pick your answer before the countdown ends.",
        answerKicker:"Correct answer",
        scoresKicker:"Scoreboard",
        scoreSession:"Points this session",
        scoreRound:"Round score",
        scoreLead:"A moment to read the standings.",
        close:"Close",
        savedSession:"Saved session",
        resumeTitle:"Want to continue where you left off?",
        resumeText:"We recovered your room, profile and current state. You can keep playing or start fresh.",
        newGame:"Start new game",
        continuePlay:"Continue game",
        durationKickerModal:"Duration",
        durationModalTitle:"Set the duration",
        durationMinutesLabel:"Minutes",
        durationQuestionsLabel:"Number of questions",
        cancel:"Cancel",
        accept:"Accept",
        customKicker:"Custom",
        customTitle:"Define the style of the round",
        theme:"Theme",
        tone:"Tone",
        difficulty:"Difficulty",
        customThemePlaceholder:"Example: science, film, current events, video games",
        extraPrompt:"Extra instruction",
        save:"Save",
        player:"Player",
        noName:"No name",
        points:"Points",
        nobodyYet:"Nobody yet",
        roomWaits:"The room is waiting for the first dino.",
        hostReady:"Host ready",
        guestReady:"Guest ready",
        notReadyYet:"Hasn't pressed ready yet",
        allAlmostReady:"Almost ready",
        whenEveryoneReady:"Once everyone has pressed ready, you can move on to game setup.",
        waitingInRoom:"Waiting in room",
        gameClosed:"Game closed",
        players:"Players",
        hostProfileTitle:"Share the room code",
        guestProfileTitle:"Set up your badge",
        hostProfileSideTitle:"Preparing the room",
        guestProfileSideTitle:"Room found",
        hostProfileSideText:"Share the room code and wait for the guests to join.",
        guestProfileSideText:"You're in. Now all that's left is your name and avatar.",
        hostConfiguring:"The host is configuring the match.",
        showQuestionAlone:"Show question alone",
        answerSeconds:"Time to answer",
        generateQuestions:"Generate {count} questions",
        startQuestions:"Start {count} questions",
        generatingQuestions:"Generating {count} questions...",
        minutesQuestion:"How many minutes do you want to play?",
        countQuestion:"How many questions do you want to play?",
        couldNotPrepareQuestions:"I couldn't prepare the questions right now.",
        currentLeader:"Current leader",
        inRace:"Still in it",
        noScoresYet:"There are no scores yet.",
        victory:"Jurassic victory!",
        defeat:"You lost :(",
        championText:"You win with {score} points. Champion roar unlocked.",
        defeatText:"You'll have to taste the leftovers this time. Next match, comeback time.",
        leadsGame:"{name} is leading the game",
        accumulatedPoints:"{score} points total",
        continueSession:"Continue playing",
        newSession:"New game",
        tiebreakKicker:"Jurassic tiebreaker",
        tiebreakTitle:"VERSUS!",
        tiebreakLead:"These two dinos can't keep tying.",
        tiebreakCopy:"Once the countdown ends, it's hands time. You'll get 5 seconds to pick.",
        versusKicker:"Showdown",
        versusTitle:"Settle it by hand",
        versusRound:"Round {round}",
        decisiveRound:"Deciding round",
        duelResolved:"Duel settled",
        hiddenChoice:"Hidden choice",
        yourDuel:"Your duel",
        inDuel:"In duel",
        markNow:"Pick now",
        haveSecondsToMark:"You have 5 seconds to choose.",
        timeResolving:"Time's up. Resolving the hand...",
        onlyDuelists:"Only the duelists can choose. Everyone else watches.",
        drawHands:"Draw. Hands again.",
        roundWinner:"{name} wins this hand. We continue with the best of 3.",
        finalVsWinner:"{name} wins the VS and gets {points} bonus points.",
        winner:"Winner",
        waitingForYourMark:"Waiting for your choice",
        versusChampionTitle:"{name} rules the Jurassic era",
        bestOfThree:"Best of 3",
        chooseAnswer:"Choose",
        selected:"Selected",
        yourAnswer:"Yours",
        locked:"Locked",
        pick:"Choose",
        pause:"Pause",
        questionProgress:"Question {current} of {total}",
        preparingVelociraptor:"Preparing Velociraptor Mode!",
        preparingAnswers:"Preparing answers...",
        timeUp:"Time. See the correct answer and take the fun fact.",
        timeUpSpeed:"Time. See the full Velociraptor Mode ranking.",
        speedReadyInfo:"Velociraptor Mode! Each answer locks instantly and gives different points.",
        speedCountdownNotice:"Heads up: Velociraptor Mode is coming!",
        category:"Category",
        pointsShort:"pts",
        correct:"Correct",
        funFact:"Fun fact",
        correctOrder:"Correct order",
        answerLoading:"Preparing answers...",
        speedMode:"Velociraptor Mode!",
        languageLabelEs:"Español",
        languageLabelEn:"English",
        tone_divertido:"Fun",
        tone_televisivo:"Showtime",
        tone_serio:"Serious",
        tone_familiar:"Family",
        difficulty_facil:"Easy",
        difficulty_media:"Medium",
        difficulty_dificil:"Hard",
        required:"is required",
        chromecastConnected:"Chromecast connected",
        castingRoom:"Casting room {code} to TV.",
        findChromecast:"Find your Chromecast and launch the room's TV screen.",
        joinRoomFirst:"Join a room first so you can send it to the TV.",
        reconnectTv:"Reconnect TV",
        sendToTv:"Send to TV",
        unmuteTv:"Unmute TV",
        iosCastWarning:"On iPhone or iPad, web Google Cast is usually not available. Use Chrome on desktop or Android.",
        castNotAvailable:"Google Cast is not available in this browser yet.",
        tvConnected:"TV connected{custom}.",
        chromecastReady:"Chromecast ready to connect when you want."
      }
    };
    const CATEGORY_LABELS = {
      "Ciencia":{en:"Science"},
      "Mundo":{en:"World"},
      "Cultura general":{en:"General knowledge"},
      "Historia y cultura":{en:"History and culture"},
      "Lengua y cultura":{en:"Language and culture"},
      "Naturaleza":{en:"Nature"},
      "Espana":{en:"Spain"},
      "Arte y musica":{en:"Arts and music"},
      "Geografia":{en:"Geography"},
      "Arquitectura":{en:"Architecture"},
      "Gastronomia":{en:"Food and drink"},
      "Cine y TV":{en:"Film and TV"},
      "Cine y television":{en:"Film and TV"},
      "Psicologia":{en:"Psychology"},
      "Personalizado":{en:"Custom"},
      "Modo Velociraptor!":{en:"Velociraptor Mode!"},
      "Categoria sorpresa":{en:"Surprise category"},
      "Otros":{en:"Other"}
    };
    function applyCurrentLanguage(lang, persist = true) {
      if (lang !== "es" && lang !== "en") return;
      currentLang = lang;
      if(persist){
        try { localStorage.setItem(LANGUAGE_KEY, lang); } catch(_) {}
      }
      document.documentElement.lang = lang;
      state.waitingLine = lineFor(state.playerId);
      applyTranslations();
      updateLanguageButtons();
    }
    function setLanguage(lang) {
      if (lang !== "es" && lang !== "en") return;
      applyCurrentLanguage(lang, true);
      if(state.role === "host" && state.roomCode){
        state.game.lang = lang;
        saveSession();
        broadcastGame().catch(() => {});
        renderCurrentScene();
      }
    }
    function t(key, params = {}) {
      const text = I18N[currentLang]?.[key] || I18N.es[key] || key;
      return Object.entries(params).reduce((str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v), text);
    }
    function setText(node, value){
      if(node) node.textContent = value;
    }
    function applyTranslations() {
      // Intro screen
      ui.introLead.textContent = t("introLead");
      ui.btnContinue.textContent = t("continueGame");
      ui.btnHost.textContent = t("host");
      ui.btnGuest.textContent = t("guest");

      // Menu
      ui.settingsLanguage.textContent = t("settingsLanguage");
      ui.settingsGame.textContent = t("settingsGame");
      ui.btnEndGameText.textContent = t("endGame");
      ui.btnExitGameText.textContent = t("exit");
      setText(ui.menuHomeLinkLabel, t("home"));
      setText(ui.soundChipLabel, t("audio"));
      ui.soundChip?.setAttribute("aria-label", t("audio"));
      setText(ui.soundMini, t("audio"));
      ui.btnToggleMute.textContent = t("mute");
      setText(ui.soundVolumeLabel, t("volume"));
      setText(ui.castVolumeLabel, t("castVolume"));
      setText(ui.castDeviceName, t("noDevice"));
      setText(ui.castDeviceHint, t("castHintReady"));
      if(ui.btnCastConnect) ui.btnCastConnect.innerHTML = `<span class="btnIcon">📺</span>${t("sendToTv")}`;
      if(ui.btnCastMute) ui.btnCastMute.innerHTML = `<span class="btnIcon">🔇</span>${t("muteTv")}`;
      if(ui.btnCastDisconnect) ui.btnCastDisconnect.innerHTML = `<span class="btnIcon">⏹</span>${t("disconnect")}`;
      ui.menuBtn?.setAttribute("aria-label", t("openMenu"));
      ui.soundChip?.setAttribute("aria-label", t("audioSettings"));
      ui.btnAvatarPrev?.setAttribute("aria-label", t("avatarPrev"));
      ui.btnAvatarNext?.setAttribute("aria-label", t("avatarNext"));
      setText(ui.joinStatus, t("joinHint"));
      ui.nameInput?.setAttribute("placeholder", t("nameExample"));
      ui.customThemeInput?.setAttribute("placeholder", t("customThemePlaceholder"));
      ui.customPromptInput?.setAttribute("placeholder", t("customPromptPlaceholder"));
      setText(ui.avatarEditorKicker, t("chooseAvatar"));
      setText(ui.profileSideKicker, state.role === "host" ? t("room") : t("guestKicker"));
      setText(ui.setupKicker, t("setup"));
      setText(ui.modesKicker, t("modesTitle"));
      setText(ui.durationKicker, t("durationTitle"));
      setText(ui.countdownKicker, t("countdown"));
      setText(ui.questionKicker, t("question"));
      setText(ui.answerKicker, t("answerKicker"));
      setText(ui.scoresKicker, t("scoresKicker"));
      setText(ui.versusIntroKicker, t("tiebreakKicker"));
      setText(ui.versusIntroTitle, t("tiebreakTitle"));
      setText(ui.versusKicker, t("versusKicker"));
      setText(ui.versusTitle, t("versusTitle"));
      setText(ui.btnCloseScore, t("close"));

      // Profile screen
      ui.profileKicker.textContent = state.role === "host" ? t("room") : t("guestKicker");
      ui.profileTitle.textContent = state.role === "host" ? t("hostProfileTitle") : t("guestProfileTitle");
      ui.profileSideTitle.textContent = state.role === "host" ? t("hostProfileSideTitle") : t("guestProfileSideTitle");
      ui.profileSideText.textContent = state.role === "host" ? t("hostProfileSideText") : t("guestProfileSideText");

      // Join screen
      setText(ui.joinKicker, t("guestKicker"));
      setText(ui.joinTitle, t("joinTitle"));
      setText(ui.joinLead, t("joinLead"));
      setText(ui.joinCodeLabel, t("roomCode"));
      setText(ui.joinCodeOnlyLabel, t("roomCode"));
      setText(ui.btnJoinBack, t("back"));
      setText(ui.btnJoinNext, t("next"));
      setText(ui.btnBack, t("back"));
      setText(ui.btnReady, t("next"));

      // Lobby screen
      setText(ui.lobbyKicker, t("playersList"));
      ui.lobbyTitle.textContent = t("preparingRoom");
      ui.lobbyDesc.textContent = t("lobbyDesc");
      setText(ui.btnToSetup, t("next"));
      setText(ui.durationLead, t("durationLead"));

      // Setup screen
      ui.setupTitle.textContent = t("setupTitle");
      ui.setupDesc.textContent = t("setupDesc");
      setText(ui.modesLead, t("modesLead"));
      setText(ui.durationLead, t("durationLead"));
      setText(ui.generatingTitle, t("generatingTitle"));
      setText(ui.generatingKicker, t("customKicker"));
      setText(ui.pausedKicker, t("pausedKicker"));

      setText(ui.scoreModalKicker, t("scoresKicker"));
      setText(ui.scoreModalTitle, t("scoreSession"));
      setText(ui.resumeKicker, t("savedSession"));
      setText(ui.resumeTitle, t("resumeTitle"));
      setText(ui.resumeText, t("resumeText"));
      setText(ui.btnResumeNew, t("newGame"));
      setText(ui.btnResumeContinue, t("continuePlay"));
      setText(ui.durationModalKicker, t("durationKickerModal"));
      setText(ui.durationMinutesLabel, t("durationMinutesLabel"));
      setText(ui.durationQuestionsLabel, t("durationQuestionsLabel"));
      setText(ui.btnCloseDuration, t("cancel"));
      setText(ui.btnAcceptDuration, t("accept"));
      setText(ui.customKicker, t("customKicker"));
      setText(ui.customTitle, t("customTitle"));
      setText(ui.customThemeLabel, t("theme"));
      ui.customThemeInput?.setAttribute("placeholder", t("customThemePlaceholder"));
      setText(ui.customToneLabel, t("tone"));
      setText(ui.customDifficultyLabel, t("difficulty"));
      setText(ui.customPromptLabel, t("extraPrompt"));
      ui.customPromptInput?.setAttribute("placeholder", t("extraPrompt"));
      setText(ui.btnCloseCustom, t("cancel"));
      setText(ui.btnAcceptCustom, t("save"));
      ui.customToneChoices?.querySelectorAll("[data-tone]")?.forEach(btn => btn.textContent = t(`tone_${btn.dataset.tone}`));
      ui.customDifficultyChoices?.querySelectorAll("[data-difficulty]")?.forEach(btn => btn.textContent = t(`difficulty_${btn.dataset.difficulty}`));

      // Update other dynamic content
      updateIdentity();
      renderCurrentScene();
    }
    function updateLanguageButtons() {
      ui.langEsIntro.classList.toggle("active", currentLang === "es");
      ui.langEnIntro.classList.toggle("active", currentLang === "en");
      ui.langEs.classList.toggle("active", currentLang === "es");
      ui.langEn.classList.toggle("active", currentLang === "en");
    }
    const STANDARD_VARIANT_LEADS = ["","Cambiamos de tercio: ","Vamos con una mas fina: ","Subimos un poco el nivel: "];
    const SPEED_VARIANT_LEADS = ["","Modo Velociraptor! ","Ronda Velociraptor! ","Velociraptor en pista: ","Atencion, garras fuera: "];
    const BASE_STANDARD_QUESTIONS = [
      {category:"Ciencia",prompt:"\u00BFQue planeta del sistema solar es conocido como el planeta rojo?",answers:["Venus","Marte","Saturno","Mercurio","Neptuno"],correct:1},
      {category:"Mundo",prompt:"\u00BFCual es la capital de Australia?",answers:["Sidney","Melbourne","Canberra","Perth","Brisbane"],correct:2},
      {category:"Cultura general",prompt:"\u00BFCuantos lados tiene un hexagono?",answers:["5","6","7","8","9"],correct:1},
      {category:"Mundo",prompt:"\u00BFCual es el oceano mas grande del planeta?",answers:["Atlantico","Indico","Pacifico","Artico","Antartico"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFCual es el metal principal del bronce?",answers:["Hierro","Cobre","Plata","Aluminio","Zinc"],correct:1},
      {category:"Lengua y cultura",prompt:"\u00BFCual es el idioma mas hablado del mundo por numero total de hablantes?",answers:["Ingles","Hindi","Espanol","Mandarin","Arabe"],correct:3},
      {category:"Cultura general",prompt:"\u00BFCual es el resultado de 9 x 7?",answers:["56","63","72","49","58"],correct:1},
      {category:"Naturaleza",prompt:"\u00BFCual de estos animales es un mamifero?",answers:["Pinguino","Cocodrilo","Delfin","Tortuga","Pulpo"],correct:2},
      {category:"Mundo",prompt:"\u00BFCual es el continente mas pequeno?",answers:["Europa","Oceania","Antartida","Sudamerica","Africa"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCual es el gas mas abundante de la atmosfera terrestre?",answers:["Oxigeno","Dioxido de carbono","Nitrogeno","Helio","Hidrogeno"],correct:2},
      {category:"Cultura general",prompt:"\u00BFCuantos minutos tiene una hora y media?",answers:["30","60","90","120","150"],correct:2},
      {category:"Espana",prompt:"\u00BFCual es el rio mas largo de Espana?",answers:["Ebro","Tajo","Duero","Guadalquivir","Jucar"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFCual es la primera letra del alfabeto griego?",answers:["Beta","Gamma","Alfa","Delta","Omega"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFCual de estos instrumentos tiene teclas?",answers:["Violin","Trompeta","Piano","Flauta","Tambor"],correct:2},
      {category:"Cultura general",prompt:"\u00BFCuantos dias tiene un ano bisiesto?",answers:["364","365","366","367","368"],correct:2},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Canada?",answers:["Toronto","Vancouver","Ottawa","Montreal","Calgary"],correct:2},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Brasil?",answers:["Rio de Janeiro","Brasilia","Sao Paulo","Salvador","Recife"],correct:1},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Japon?",answers:["Osaka","Kioto","Tokio","Nagoya","Sapporo"],correct:2},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Marruecos?",answers:["Casablanca","Rabat","Marrakech","Fez","Tanger"],correct:1},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Argentina?",answers:["Cordoba","Mendoza","Rosario","Buenos Aires","La Plata"],correct:3},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Suecia?",answers:["Gotemburgo","Upsala","Malmo","Estocolmo","Helsingborg"],correct:3},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Egipto?",answers:["Alejandria","Giza","El Cairo","Luxor","Asuan"],correct:2},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Turquia?",answers:["Estambul","Ankara","Esmirna","Bursa","Antalya"],correct:1},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Sudafrica a nivel administrativo?",answers:["Ciudad del Cabo","Johannesburgo","Pretoria","Durban","Bloemfontein"],correct:2},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Nueva Zelanda?",answers:["Auckland","Wellington","Christchurch","Hamilton","Dunedin"],correct:1},
      {category:"Geografia",prompt:"\u00BFCual es la capital de India?",answers:["Bombay","Bangalore","Calcuta","Nueva Delhi","Chennai"],correct:3},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Mexico?",answers:["Guadalajara","Monterrey","Ciudad de Mexico","Puebla","Merida"],correct:2},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Noruega?",answers:["Oslo","Bergen","Stavanger","Trondheim","Tromso"],correct:0},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Portugal?",answers:["Oporto","Lisboa","Coimbra","Faro","Braga"],correct:1},
      {category:"Geografia",prompt:"\u00BFCual es la capital de Corea del Sur?",answers:["Busan","Incheon","Seul","Daegu","Daejeon"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFCual de estas civilizaciones construyo Machu Picchu?",answers:["Mayas","Aztecas","Incas","Romanos","Fenicios"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFCual fue el apellido de Julio Cesar?",answers:["Augusto","Cesar","Bruto","Pompeyo","Marco"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFCual era la capital del Imperio Bizantino?",answers:["Roma","Atenas","Constantinopla","Jerusalen","Antioquia"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFCual de estos pueblos navegantes se asocia a Escandinavia?",answers:["Fenicios","Vikingos","Hunos","Sumerios","Persas"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFCual de estas reinas goberno en el antiguo Egipto?",answers:["Nefertiti","Cleopatra","Boudica","Victoria","Isabel I"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFCual de estas guerras termino en 1945?",answers:["Guerra de Crimea","Primera Guerra Mundial","Segunda Guerra Mundial","Guerra de Corea","Guerra de Vietnam"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFCual de estos documentos arranca con 'We the People'?",answers:["Carta Magna","Constitucion de Estados Unidos","Codigo de Hammurabi","Tratado de Versalles","Declaracion de Derechos inglesa"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFCual era la ruta comercial que conectaba Asia y Europa?",answers:["Ruta del Incienso","Ruta del Cobre","Ruta de la Seda","Ruta del Oro","Ruta Imperial"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFCual de estas ciudades fue sepultada por el Vesubio?",answers:["Esparta","Pompeya","Mileto","Cartago","Siracusa"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFCual de estos lideres fue emperador de Francia?",answers:["Bismarck","Napoleon Bonaparte","Garibaldi","Wellington","Robespierre"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCual es el simbolo quimico del oro?",answers:["Ag","Au","Go","Or","Pt"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCuanta agua pura hierve a nivel del mar?",answers:["80\u00BAC","90\u00BAC","100\u00BAC","110\u00BAC","120\u00BAC"],correct:2},
      {category:"Ciencia",prompt:"\u00BFCual es el hueso mas largo del cuerpo humano?",answers:["Humero","Tibia","Femur","Perone","Cubito"],correct:2},
      {category:"Ciencia",prompt:"\u00BFCual es el satelite natural de la Tierra?",answers:["Europa","Luna","Titan","Io","Fobos"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCual es el organo que bombea la sangre?",answers:["Pulmon","Higado","Corazon","Rinon","Pancreas"],correct:2},
      {category:"Ciencia",prompt:"\u00BFCual es el simbolo quimico de la plata?",answers:["Pt","Ag","Pb","Au","Sn"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCual de estos planetas tiene anillos mas visibles?",answers:["Marte","Venus","Saturno","Mercurio","Tierra"],correct:2},
      {category:"Ciencia",prompt:"\u00BFCual es la estrella del sistema solar?",answers:["Sirio","Polaris","El Sol","Betelgeuse","Vega"],correct:2},
      {category:"Ciencia",prompt:"\u00BFCual es el estado del agua en forma de hielo?",answers:["Liquido","Solido","Gas","Plasma","Vapor"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCual de estos animales es un insecto?",answers:["Ara\u00F1a","Hormiga","Ciempi\u00E9s","Escorpion","Garrapata"],correct:1},
      {category:"Naturaleza",prompt:"\u00BFCual de estos animales pone huevos?",answers:["Murcielago","Caballo","Pato","Perro","Gato"],correct:2},
      {category:"Naturaleza",prompt:"\u00BFCual es el arbol asociado a las bellotas?",answers:["Pino","Olivo","Roble","Sauce","Abeto"],correct:2},
      {category:"Naturaleza",prompt:"\u00BFCual de estos animales vive en el Artico?",answers:["Koala","Ping\u00FCino emperador","Oso polar","Canguro","Camello"],correct:2},
      {category:"Naturaleza",prompt:"\u00BFCual de estas aves no puede volar?",answers:["Golondrina","Avestruz","Gaviota","Halcon","Buitre"],correct:1},
      {category:"Naturaleza",prompt:"\u00BFCual de estos animales es un reptil?",answers:["Sapo","Salamandra","Lagarto","Delfin","Nutria"],correct:2},
      {category:"Cine y TV",prompt:"\u00BFCual de estas sagas tiene a Hogwarts como escuela?",answers:["Star Wars","Harry Potter","El Se\u00F1or de los Anillos","Narnia","Matrix"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual es el apellido de la familia amarilla de Springfield?",answers:["Griffin","Simpson","Smith","Belcher","Hill"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual de estos personajes pertenece a Star Wars?",answers:["Legolas","Han Solo","Sherlock Holmes","Indiana Jones","Jack Sparrow"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual de estas peliculas tiene dinosaurios clonados?",answers:["Avatar","Jurassic Park","Titanic","Gladiator","Alien"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual de estas series transcurre en Hawkins?",answers:["Dark","Stranger Things","Lost","The Office","Friends"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual de estos heroes usa escudo como arma principal?",answers:["Thor","Capitan America","Iron Man","Doctor Strange","Hulk"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual de estas peliculas dirige James Cameron?",answers:["Inception","Avatar","El padrino","Joker","Pulp Fiction"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFCual de estas franquicias incluye a Batman?",answers:["DC","Marvel","Star Trek","Pokemon","Pixar"],correct:0},
      {category:"Mundo friki",prompt:"\u00BFCual es el nombre del fontanero de Nintendo con gorra roja?",answers:["Sonic","Mario","Link","Kirby","Pikachu"],correct:1},
      {category:"Mundo friki",prompt:"\u00BFCual es la piedra verde de Minecraft?",answers:["Hierro","Esmeralda","Cobre","Lapis lazuli","Redstone"],correct:1},
      {category:"Mundo friki",prompt:"\u00BFCual de estos Pokemon es electrico?",answers:["Bulbasaur","Squirtle","Pikachu","Charmander","Oddish"],correct:2},
      {category:"Mundo friki",prompt:"\u00BFCual de estas franquicias tiene una Trifuerza?",answers:["Zelda","Halo","Fortnite","Diablo","Doom"],correct:0},
      {category:"Mundo friki",prompt:"\u00BFCual es el nombre del martillo de Thor?",answers:["Stormbreaker","Gungnir","Mjolnir","Anduril","Leviatan"],correct:2},
      {category:"Mundo friki",prompt:"\u00BFCual de estos personajes lleva sombrero de paja?",answers:["Naruto","Luffy","Goku","Deku","Ichigo"],correct:1},
      {category:"Mundo friki",prompt:"\u00BFCual de estos juegos transcurre en Hyrule?",answers:["Zelda","Metroid","F-Zero","Kirby","Animal Crossing"],correct:0},
      {category:"Mundo friki",prompt:"\u00BFCual de estas gemas del infinito esta asociada al tiempo?",answers:["Gema del Alma","Gema del Poder","Gema del Tiempo","Gema del Espacio","Gema de la Mente"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFCual de estos generos suele tener improvisacion de jazz?",answers:["Opera barroca","Jazz","Reggaeton","Marcha militar","Canto gregoriano"],correct:1},
      {category:"Arte y musica",prompt:"\u00BFCual de estos pintores es famoso por el Guernica?",answers:["Dal\u00ED","Velazquez","Picasso","Goya","Mir\u00F3"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFCual de estas notas va despues de fa en la escala?",answers:["Mi","Sol","La","Si","Do"],correct:1},
      {category:"Arte y musica",prompt:"\u00BFCual de estos instrumentos se toca con arco?",answers:["Bateria","Violin","Trombon","Clarinete","Pandereta"],correct:1},
      {category:"Arte y musica",prompt:"\u00BFCual de estos museos esta en Paris?",answers:["Prado","Louvre","MET","Uffizi","MOMA"],correct:1},
      {category:"Arte y musica",prompt:"\u00BFCual de estas figuras musicales dura mas?",answers:["Negra","Corchea","Redonda","Blanca","Semicorchea"],correct:2},
      {category:"Lengua y cultura",prompt:"\u00BFCual es el plural correcto de 'luz'?",answers:["Luzes","Luces","Luzs","Luzos","Luzeses"],correct:1},
      {category:"Lengua y cultura",prompt:"\u00BFCual de estas palabras lleva tilde?",answers:["Facil","Dificil","Joven","Azul","Pared"],correct:1},
      {category:"Lengua y cultura",prompt:"\u00BFCual de estos signos se usa para preguntar en espanol?",answers:["! !","? ?","¿ ?","; ;",": :"],correct:2},
      {category:"Lengua y cultura",prompt:"\u00BFCual es un sinonimo de 'rapido'?",answers:["Lento","Veloz","Torpe","Callado","Suave"],correct:1},
      {category:"Lengua y cultura",prompt:"\u00BFCual de estas obras escribio Cervantes?",answers:["La Celestina","Don Quijote de la Mancha","La Regenta","El Lazarillo","Fuenteovejuna"],correct:1},
      {category:"Lengua y cultura",prompt:"\u00BFCual es la palabra correcta para una coleccion de poemas?",answers:["Novela","Poemario","Ensayo","Guion","F\u00E1bula"],correct:1},
      {category:"Deportes",prompt:"\u00BFCuantos jugadores hay por equipo en el campo de futbol?",answers:["9","10","11","12","13"],correct:2},
      {category:"Deportes",prompt:"\u00BFCual de estos deportes usa canasta?",answers:["Rugby","Baloncesto","Tenis","Balonmano","Hockey"],correct:1},
      {category:"Deportes",prompt:"\u00BFCuanto vale un try en rugby union?",answers:["3","5","6","7","1"],correct:1},
      {category:"Deportes",prompt:"\u00BFCual de estos deportes se juega en pista de hielo?",answers:["Cricket","Curling","Padel","Rugby","Golf"],correct:1},
      {category:"Deportes",prompt:"\u00BFCual de estos torneos pertenece al tenis?",answers:["Masters de Augusta","Wimbledon","Super Bowl","Tour de Francia","Mundial de Clubes"],correct:1},
      {category:"Tecnologia",prompt:"\u00BFCual de estas marcas desarrolla el iPhone?",answers:["Samsung","Apple","Xiaomi","Sony","Huawei"],correct:1},
      {category:"Tecnologia",prompt:"\u00BFCual de estos atajos suele copiar texto?",answers:["Ctrl+X","Ctrl+P","Ctrl+C","Ctrl+Z","Ctrl+L"],correct:2},
      {category:"Tecnologia",prompt:"\u00BFCual de estos elementos almacena archivos a largo plazo?",answers:["RAM","Disco duro","GPU","Ventilador","Teclado"],correct:1},
      {category:"Tecnologia",prompt:"\u00BFCual de estos logos se asocia a Windows?",answers:["Pinguino Tux","Ventana","Manzana mordida","Robot verde","Caja naranja"],correct:1},
      {category:"Tecnologia",prompt:"\u00BFCual de estos navegadores desarrolla Mozilla?",answers:["Chrome","Safari","Firefox","Edge","Opera GX"],correct:2},
      {category:"Gastronomia",prompt:"\u00BFCual de estos ingredientes lleva un guacamole clasico?",answers:["Aguacate","Manzana","Nata","Mostaza","Zanahoria"],correct:0},
      {category:"Gastronomia",prompt:"\u00BFCual de estos quesos se asocia a Italia?",answers:["Cheddar","Gouda","Mozzarella","Emmental","Roquefort"],correct:2},
      {category:"Gastronomia",prompt:"\u00BFCual de estas bebidas se prepara con granos tostados?",answers:["Cafe","Horchata","Limonada","Tonica","T\u00E9 verde"],correct:0},
      {category:"Gastronomia",prompt:"\u00BFCual de estas frutas suele ir en una macedonia?",answers:["Patata","Pera","Cebolla","Ajo","Pepino"],correct:1},
      {category:"Gastronomia",prompt:"\u00BFCual de estos platos se come con palillos con frecuencia?",answers:["Pizza","Sushi","Hamburguesa","Tortilla","Paella"],correct:1},
      {category:"Matematicas",prompt:"\u00BFCual es el resultado de 12 x 8?",answers:["84","88","96","108","112"],correct:2},
      {category:"Matematicas",prompt:"\u00BFCual es la mitad de 144?",answers:["62","72","82","92","102"],correct:1},
      {category:"Matematicas",prompt:"\u00BFCual es el siguiente numero en 2, 4, 8, 16...?",answers:["18","24","32","20","30"],correct:2},
      {category:"Matematicas",prompt:"\u00BFCuanto suman los angulos de un triangulo?",answers:["90","180","270","360","540"],correct:1},
      {category:"Psicologia",prompt:"\u00BFCual de estas emociones suele asociarse a la perdida?",answers:["Alegria","Tristeza","Euforia","Calma","Orgullo"],correct:1},
      {category:"Psicologia",prompt:"\u00BFCual de estas opciones describe mejor la empatia?",answers:["Mandar a otros","Entender emociones ajenas","Hablar mas alto","Dormir mejor","Memorizar rapido"],correct:1},
      {category:"Psicologia",prompt:"\u00BFCual de estas palabras se relaciona con la memoria?",answers:["Recuerdo","Martillo","Pared","Motor","Escoba"],correct:0}
    ];
    const HARDER_STANDARD_QUESTIONS = [
      {category:"Historia y cultura",prompt:"\u00BFQue tratado puso fin oficialmente a la Primera Guerra Mundial?",answers:["Utrecht","Versalles","Tordesillas","Yalta","Ginebra"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFQue ciudad fue la capital del califato omeya en Al-Andalus?",answers:["Toledo","Sevilla","Granada","Cordoba","Merida"],correct:3},
      {category:"Historia y cultura",prompt:"\u00BFQue monarca frances es conocido como el Rey Sol?",answers:["Luis XIV","Luis XVI","Enrique IV","Carlos X","Felipe Augusto"],correct:0},
      {category:"Historia y cultura",prompt:"\u00BFQue emperador romano legalizo el cristianismo con el Edicto de Milan?",answers:["Neron","Trajano","Constantino","Adriano","Diocleciano"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFQue navegante completo la primera vuelta al mundo tras la muerte de Magallanes?",answers:["Elcano","Drake","Caboto","Colon","Vespucci"],correct:0},
      {category:"Historia y cultura",prompt:"\u00BFEn que ano cayo el Muro de Berlin?",answers:["1987","1988","1989","1990","1991"],correct:2},
      {category:"Historia y cultura",prompt:"\u00BFQue conflicto enfrento a Atenas y Esparta?",answers:["Guerras Medicas","Guerra del Peloponeso","Guerra de los Treinta Anos","Guerras Punicas","Guerra de Troya"],correct:1},
      {category:"Historia y cultura",prompt:"\u00BFQue ciudad fue dividida por un muro durante la Guerra Fria?",answers:["Praga","Budapest","Varsovia","Berlin","Viena"],correct:3},
      {category:"Mundo",prompt:"\u00BFQue estrecho separa Europa de Africa?",answers:["Bosforo","Dardanelos","Ormuz","Gibraltar","Magallanes"],correct:3},
      {category:"Mundo",prompt:"\u00BFQue rio atraviesa Viena, Budapest y Belgrado?",answers:["Rin","Danubio","Vistula","Elba","Po"],correct:1},
      {category:"Mundo",prompt:"\u00BFCual es la capital administrativa de Bolivia?",answers:["La Paz","Sucre","Cochabamba","Santa Cruz","Oruro"],correct:0},
      {category:"Mundo",prompt:"\u00BFQue pais tiene por capital a Abuja?",answers:["Kenia","Nigeria","Ghana","Etiopia","Uganda"],correct:1},
      {category:"Mundo",prompt:"\u00BFQue pais no forma parte de la peninsula iberica?",answers:["Portugal","Andorra","Espana","Francia","Gibraltar"],correct:3},
      {category:"Ciencia",prompt:"\u00BFQue elemento tiene el simbolo Sn?",answers:["Sodio","Esta\u00F1o","Silicio","Estroncio","Selenio"],correct:1},
      {category:"Ciencia",prompt:"\u00BFCual es la luna mas grande de Saturno?",answers:["Europa","Titan","Io","Calisto","Encelado"],correct:1},
      {category:"Ciencia",prompt:"\u00BFQue planeta tarda mas en dar una vuelta al Sol?",answers:["Jupiter","Saturno","Urano","Neptuno","Mercurio"],correct:3},
      {category:"Ciencia",prompt:"\u00BFQue cientifica descubrio la radiactividad junto a Pierre Curie?",answers:["Lise Meitner","Marie Curie","Dorothy Hodgkin","Rosalind Franklin","Ada Lovelace"],correct:1},
      {category:"Ciencia",prompt:"\u00BFQue parte de la celula contiene la mayor parte del ADN?",answers:["Citoplasma","Membrana","Nucleo","Ribosoma","Mitocondria"],correct:2},
      {category:"Ciencia",prompt:"\u00BFQue escala se usa para medir la dureza de los minerales?",answers:["Richter","Mohs","Kelvin","Beaufort","Mercalli"],correct:1},
      {category:"Ciencia",prompt:"\u00BFQue cientifico formulo las leyes del movimiento y la gravitacion clasica?",answers:["Galileo","Newton","Kepler","Faraday","Planck"],correct:1},
      {category:"Arte y musica",prompt:"\u00BFQuien compuso La consagracion de la primavera?",answers:["Debussy","Ravel","Stravinsky","Satie","Berlioz"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFQue pintor espanol es autor de Las meninas?",answers:["Goya","El Greco","Velazquez","Sorolla","Murillo"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFEn que ciudad italiana se encuentra la Capilla Sixtina?",answers:["Florencia","Venecia","Roma","Milan","Napoles"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFQue compositor quedo sordo en la etapa final de su vida?",answers:["Mozart","Chopin","Beethoven","Haydn","Schubert"],correct:2},
      {category:"Arte y musica",prompt:"\u00BFQue instrumento pertenece a la familia de cuerda frotada?",answers:["Oboe","Timbal","Viola","Trompa","Fagot"],correct:2},
      {category:"Lengua y cultura",prompt:"\u00BFQue obra teatral de Lorca transcurre en una casa de luto rigido?",answers:["Yerma","Bodas de sangre","La casa de Bernarda Alba","Mariana Pineda","Dona Rosita la soltera"],correct:2},
      {category:"Lengua y cultura",prompt:"\u00BFQue lengua romance tiene mas hablantes nativos?",answers:["Italiano","Frances","Portugues","Espanol","Rumano"],correct:3},
      {category:"Literatura",prompt:"\u00BFQuien escribio Crimen y castigo?",answers:["Tolstoi","Dostoievski","Gogol","Turgueniev","Pushkin"],correct:1},
      {category:"Literatura",prompt:"\u00BFQue detective creo Agatha Christie y es belga?",answers:["Poirot","Marlowe","Holmes","Maigret","Lupin"],correct:0},
      {category:"Literatura",prompt:"\u00BFQue novela empieza con la frase 'Llamadme Ismael'?",answers:["La isla del tesoro","Moby Dick","Dracula","Ulises","Robinson Crusoe"],correct:1},
      {category:"Literatura",prompt:"\u00BFQue escritor latinoamericano creo Macondo?",answers:["Borges","Cortazar","Garcia Marquez","Vargas Llosa","Bioy Casares"],correct:2},
      {category:"Economia",prompt:"\u00BFQue organismo fija la politica monetaria de la eurozona?",answers:["Comision Europea","Banco Central Europeo","Banco Mundial","Ecofin","FMI"],correct:1},
      {category:"Economia",prompt:"\u00BFQue impuesto indirecto grava el consumo en Espana?",answers:["IRPF","Sucesiones","IVA","IAE","IBI"],correct:2},
      {category:"Tecnologia",prompt:"\u00BFQue empresa creo originalmente el lenguaje Java?",answers:["Microsoft","Sun Microsystems","IBM","Oracle","Adobe"],correct:1},
      {category:"Tecnologia",prompt:"\u00BFQue protocolo se usa normalmente para navegar por webs seguras?",answers:["FTP","SSH","HTTPS","SMTP","SNMP"],correct:2},
      {category:"Tecnologia",prompt:"\u00BFQue componente interpreta y ejecuta instrucciones de un programa?",answers:["GPU","SSD","CPU","RAM","Router"],correct:2},
      {category:"Cine y TV",prompt:"\u00BFQuien dirigio Pulp Fiction?",answers:["Scorsese","Tarantino","Fincher","Coppola","Ridley Scott"],correct:1},
      {category:"Cine y TV",prompt:"\u00BFEn que pelicula aparece la frase 'Siempre nos quedara Paris'?",answers:["Casablanca","Ciudadano Kane","Lo que el viento se llevo","Rebecca","Vertigo"],correct:0},
      {category:"Cine y TV",prompt:"\u00BFQue actor interpreto a Vito Corleone en la primera pelicula de El padrino?",answers:["Al Pacino","Robert De Niro","Marlon Brando","James Caan","Robert Duvall"],correct:2},
      {category:"Gastronomia",prompt:"\u00BFQue pais popularizo el plato llamado pho?",answers:["Corea del Sur","Japon","Tailandia","Vietnam","China"],correct:3},
      {category:"Gastronomia",prompt:"\u00BFQue queso frances se elabora tradicionalmente con moho azul y leche de oveja?",answers:["Brie","Camembert","Roquefort","Comte","Reblochon"],correct:2},
      {category:"Deportes",prompt:"\u00BFCuantos hoyos tiene una vuelta completa de golf en torneo?",answers:["9","12","18","24","27"],correct:2},
      {category:"Deportes",prompt:"\u00BFQue ciclista apodado El Canibal gano cinco Tours?",answers:["Coppi","Merckx","Indurain","Hinault","Anquetil"],correct:1},
      {category:"Psicologia",prompt:"\u00BFQue sesgo consiste en buscar solo informacion que confirma lo que ya pensamos?",answers:["Halo","Anclaje","Confirmacion","Disponibilidad","Atribucion"],correct:2},
      {category:"Psicologia",prompt:"\u00BFQue termino describe la dificultad para decidir por exceso de opciones?",answers:["Disonancia","Habituacion","Paralisis por analisis","Priming","Catarsis"],correct:2},
      {category:"Espana",prompt:"\u00BFQue ciudad andaluza alberga la Alhambra?",answers:["Cordoba","Sevilla","Granada","Jaen","Malaga"],correct:2},
      {category:"Espana",prompt:"\u00BFEn que comunidad autonoma esta Merida?",answers:["Andalucia","Castilla-La Mancha","Extremadura","Aragon","Murcia"],correct:2},
      {category:"Matematicas",prompt:"\u00BFCual de estos numeros es primo?",answers:["21","27","29","33","39"],correct:2}
    ];
    const TOO_EASY_PROMPTS = new Set([
      "\u00BFQue planeta del sistema solar es conocido como el planeta rojo?",
      "\u00BFCuantos lados tiene un hexagono?",
      "\u00BFCual es el resultado de 9 x 7?",
      "\u00BFCual de estos animales es un mamifero?",
      "\u00BFCuantos minutos tiene una hora y media?",
      "\u00BFCual es la primera letra del alfabeto griego?",
      "\u00BFCual de estos instrumentos tiene teclas?",
      "\u00BFCuantos dias tiene un ano bisiesto?",
      "\u00BFCual es el simbolo quimico del oro?",
      "\u00BFCuanta agua pura hierve a nivel del mar?",
      "\u00BFCual es el hueso mas largo del cuerpo humano?",
      "\u00BFCual es el satelite natural de la Tierra?",
      "\u00BFCual es el organo que bombea la sangre?",
      "\u00BFCual es el simbolo quimico de la plata?",
      "\u00BFCual es la estrella del sistema solar?",
      "\u00BFCual es el estado del agua en forma de hielo?",
      "\u00BFCual de estos animales es un insecto?",
      "\u00BFCual de estos animales pone huevos?",
      "\u00BFCual es el arbol asociado a las bellotas?",
      "\u00BFCual de estas aves no puede volar?",
      "\u00BFCual de estos animales es un reptil?",
      "\u00BFCual es el nombre del fontanero de Nintendo con gorra roja?",
      "\u00BFCual de estos Pokemon es electrico?",
      "\u00BFCual de estas sagas tiene a Hogwarts como escuela?",
      "\u00BFCual es el apellido de la familia amarilla de Springfield?",
      "\u00BFCual de estos personajes pertenece a Star Wars?",
      "\u00BFCual de estas peliculas tiene dinosaurios clonados?",
      "\u00BFCual de estas marcas desarrolla el iPhone?",
      "\u00BFCual de estos atajos suele copiar texto?",
      "\u00BFCual de estos logos se asocia a Windows?",
      "\u00BFCual de estos ingredientes lleva un guacamole clasico?",
      "\u00BFCual de estas bebidas se prepara con granos tostados?",
      "\u00BFCual de estas frutas suele ir en una macedonia?",
      "\u00BFCual de estos platos se come con palillos con frecuencia?",
      "\u00BFCual es la mitad de 144?",
      "\u00BFCual es el siguiente numero en 2, 4, 8, 16...?",
      "\u00BFCuanto suman los angulos de un triangulo?",
      "\u00BFCual de estas emociones suele asociarse a la perdida?",
      "\u00BFCual de estas opciones describe mejor la empatia?"
    ]);
    const BASE_SPEED_QUESTIONS = [
      {category:"Arquitectura",type:"speed",prompt:"\u00BFCual de estos edificios es mas alto?",choices:[{text:"Burj Khalifa",score:140,rank:1},{text:"Merdeka 118",score:120,rank:2},{text:"Shanghai Tower",score:100,rank:3},{text:"Makkah Royal Clock Tower",score:80,rank:4},{text:"Ping An Finance Center",score:0,rank:5}],explanation:"Todos son gigantes, pero el Burj Khalifa sigue liderando la altura total."},
      {category:"Naturaleza",type:"speed",prompt:"\u00BFCual de estos animales terrestres corre mas rapido?",choices:[{text:"Guepardo",score:140,rank:1},{text:"Antilope berrendo",score:120,rank:2},{text:"Leon",score:100,rank:3},{text:"Caballo cuarto de milla",score:80,rank:4},{text:"Lobo gris",score:0,rank:5}],explanation:"El guepardo manda en el sprint puro."},
      {category:"Mundo friki",type:"speed",prompt:"\u00BFCual de estas peliculas de Marvel recaudo mas en cines?",choices:[{text:"Vengadores: Endgame",score:140,rank:1},{text:"Vengadores: Infinity War",score:120,rank:2},{text:"Spider-Man: No Way Home",score:100,rank:3},{text:"Los Vengadores",score:80,rank:4},{text:"Black Panther",score:0,rank:5}],explanation:"Endgame fue la mas descomunal en taquilla de este grupo."},
      {category:"Ciencia",type:"speed",prompt:"\u00BFCual de estos planetas es mas grande?",choices:[{text:"Jupiter",score:140,rank:1},{text:"Saturno",score:120,rank:2},{text:"Urano",score:100,rank:3},{text:"Neptuno",score:80,rank:4},{text:"Tierra",score:0,rank:5}],explanation:"Jupiter domina claramente por tama\u00F1o entre los planetas del sistema solar."},
      {category:"Mundo",type:"speed",prompt:"\u00BFCual de estos paises tiene mas superficie?",choices:[{text:"Rusia",score:140,rank:1},{text:"Canada",score:120,rank:2},{text:"China",score:100,rank:3},{text:"Estados Unidos",score:80,rank:4},{text:"Brasil",score:0,rank:5}],explanation:"Rusia sigue siendo el pais mas extenso del planeta."},
      {category:"Mundo",type:"speed",prompt:"\u00BFCual de estos oceanos es mas grande?",choices:[{text:"Pacifico",score:140,rank:1},{text:"Atlantico",score:120,rank:2},{text:"Indico",score:100,rank:3},{text:"Antartico",score:80,rank:4},{text:"Artico",score:0,rank:5}],explanation:"El Pacifico gana por mucho en superficie."},
      {category:"Historia y cultura",type:"speed",prompt:"\u00BFCual de estas civilizaciones es mas antigua?",choices:[{text:"Sumeria",score:140,rank:1},{text:"Antiguo Egipto",score:120,rank:2},{text:"Grecia clasica",score:100,rank:3},{text:"Imperio romano",score:80,rank:4},{text:"Imperio bizantino",score:0,rank:5}],explanation:"Sumeria se remonta mucho mas atras que el resto."},
      {category:"Arte y musica",type:"speed",prompt:"\u00BFCual de estos instrumentos suele sonar mas grave?",choices:[{text:"Tuba",score:140,rank:1},{text:"Trombon",score:120,rank:2},{text:"Trompeta",score:100,rank:3},{text:"Clarinete",score:80,rank:4},{text:"Flauta",score:0,rank:5}],explanation:"La tuba reina en el registro grave de este grupo."},
      {category:"Deportes",type:"speed",prompt:"\u00BFCual de estos torneos de tenis da mas puntos?",choices:[{text:"Grand Slam",score:140,rank:1},{text:"Masters 1000",score:120,rank:2},{text:"ATP 500",score:100,rank:3},{text:"ATP 250",score:80,rank:4},{text:"Challenger",score:0,rank:5}],explanation:"Los Grand Slam estan en la cima del reparto de puntos."},
      {category:"Tecnologia",type:"speed",prompt:"\u00BFCual de estas unidades suele ofrecer mas capacidad?",choices:[{text:"Terabyte",score:140,rank:1},{text:"Gigabyte",score:120,rank:2},{text:"Megabyte",score:100,rank:3},{text:"Kilobyte",score:80,rank:4},{text:"Byte",score:0,rank:5}],explanation:"Terabyte supera al resto por capacidad de almacenamiento."},
      {category:"Mundo friki",type:"speed",prompt:"\u00BFCual de estos heroes de Dragon Ball aparece antes?",choices:[{text:"Goku",score:140,rank:1},{text:"Bulma",score:120,rank:2},{text:"Krillin",score:100,rank:3},{text:"Vegeta",score:80,rank:4},{text:"Trunks",score:0,rank:5}],explanation:"Goku abre la historia y Bulma aparece enseguida despues."},
      {category:"Cine y TV",type:"speed",prompt:"\u00BFCual de estas peliculas se estreno antes?",choices:[{text:"Jurassic Park",score:140,rank:1},{text:"Titanic",score:120,rank:2},{text:"Avatar",score:100,rank:3},{text:"Interstellar",score:80,rank:4},{text:"Dune: Parte Dos",score:0,rank:5}],explanation:"Jurassic Park es la mas veterana de ese grupo."}
    ];
    const CURATED_STANDARD_QUESTIONS = [
      ...HARDER_STANDARD_QUESTIONS,
      ...BASE_STANDARD_QUESTIONS.filter(item => !TOO_EASY_PROMPTS.has(item.prompt))
    ];
    const HARDER_SPEED_QUESTIONS = [
      {category:"Historia y cultura",type:"speed",prompt:"\u00BFCual de estos inventos aparecio antes?",choices:[{text:"Imprenta de tipos moviles",score:140,rank:1},{text:"Telefono",score:120,rank:2},{text:"Radio",score:100,rank:3},{text:"Television",score:80,rank:4},{text:"Internet comercial",score:0,rank:5}],explanation:"La imprenta moderna va siglos por delante del resto."},
      {category:"Arte y musica",type:"speed",prompt:"\u00BFCual de estos pintores nacio antes?",choices:[{text:"Leonardo da Vinci",score:140,rank:1},{text:"Miguel Angel",score:120,rank:2},{text:"Velazquez",score:100,rank:3},{text:"Goya",score:80,rank:4},{text:"Picasso",score:0,rank:5}],explanation:"Leonardo es claramente el mas antiguo del grupo."},
      {category:"Literatura",type:"speed",prompt:"\u00BFCual de estas obras se publico antes?",choices:[{text:"Don Quijote de la Mancha",score:140,rank:1},{text:"Los viajes de Gulliver",score:120,rank:2},{text:"Madame Bovary",score:100,rank:3},{text:"1984",score:80,rank:4},{text:"El nombre de la rosa",score:0,rank:5}],explanation:"El Quijote juega en otra liga temporal frente a las demas."},
      {category:"Mundo",type:"speed",prompt:"\u00BFCual de estos paises tiene mas poblacion?",choices:[{text:"India",score:140,rank:1},{text:"China",score:120,rank:2},{text:"Estados Unidos",score:100,rank:3},{text:"Indonesia",score:80,rank:4},{text:"Pakistan",score:0,rank:5}],explanation:"India ya supera al resto de esta lista en poblacion total."},
      {category:"Lengua y cultura",type:"speed",prompt:"\u00BFCual de estas lenguas tiene mas hablantes nativos?",choices:[{text:"Mandarin",score:140,rank:1},{text:"Espanol",score:120,rank:2},{text:"Ingles",score:100,rank:3},{text:"Arabe",score:80,rank:4},{text:"Frances",score:0,rank:5}],explanation:"El mandarin sigue en cabeza por hablantes nativos."},
      {category:"Ciencia",type:"speed",prompt:"\u00BFCual de estas unidades de almacenamiento ofrece mas capacidad?",choices:[{text:"Petabyte",score:140,rank:1},{text:"Terabyte",score:120,rank:2},{text:"Gigabyte",score:100,rank:3},{text:"Megabyte",score:80,rank:4},{text:"Kilobyte",score:0,rank:5}],explanation:"Petabyte queda muy por encima del resto de unidades."}
    ];
    const expandStandardBank = (base, target) => { const out = []; for(let i = 0; out.length < target; i++){ const item = base[i % base.length]; const variant = Math.floor(i / base.length); const lead = STANDARD_VARIANT_LEADS[variant % STANDARD_VARIANT_LEADS.length]; out.push({...item, basePrompt:item.prompt, prompt:`${lead}${item.prompt}`.trim()}); } return out; };
    const expandSpeedBank = (base, target) => { const out = []; for(let i = 0; out.length < target; i++){ const item = base[i % base.length]; const variant = Math.floor(i / base.length); const lead = SPEED_VARIANT_LEADS[variant % SPEED_VARIANT_LEADS.length]; out.push({...item, basePrompt:item.prompt, prompt:`${lead}${item.prompt}`.trim()}); } return out; };
    const QUESTION_BANK = expandStandardBank(CURATED_STANDARD_QUESTIONS, 240);
    const SPEED_QUESTION_BANK = expandSpeedBank([...HARDER_SPEED_QUESTIONS, ...BASE_SPEED_QUESTIONS], 60);
    const FUN_LINES = {
      es:["espera espera, voy!","estoy eligiendo mi mejor dino","mi dinosaurio interior ya casi sale","un momento, que me peino las escamas","estoy eligiendo mi pose jurasica","ya casi, estoy afinando el glamour","buscando angulo de estrella prehistorica","modo diva sauria en proceso"],
      en:["hold up, I'm on it!","I'm choosing my best dino","my inner dinosaur is almost ready","one sec, I'm fluffing the scales","I'm finding the perfect prehistoric pose","almost there, tuning the glam","scanning the trivia planet","dinosaur diva mode engaged"]
    };
    const GENERATING_LINES = {
      es:["Trivialodon esta buscando preguntas con chispa jurasica...","Trivialodon esta abriendo cajones secretos del saber...","Trivialodon esta peinando datos para que no salgan preguntas sosas...","Trivialodon esta afinando opciones trampa con elegancia televisiva...","Trivialodon esta desenterrando curiosidades frescas del planeta trivia..."],
      en:["Trivialodon is searching for Jurassic-fresh questions...","Trivialodon is opening secret knowledge drawers...","Trivialodon is combing facts so boring questions don't slip through...","Trivialodon is tuning trap options with TV elegance...","Trivialodon is unearthing fresh trivia curiosities..."]
    };
    const STORAGE_KEY = "trivialodon-session-v1";
    const SOUND_KEY = "trivialodon-sound-muted-v1";
    const SOUND_VOLUME_KEY = "trivialodon-sound-volume-v1";
    const WAITING_AUDIO_SRCS = ["/trivialodon/assets/waiting.mp3","/trivialodon/assets/waiting 2.mp3","/trivialodon/assets/waiting 3.mp3","/trivialodon/assets/waiting 4.mp3","/trivialodon/assets/waiting 5.mp3","/trivialodon/assets/waiting 6.mp3"];
    const ANSWERING_AUDIO_SRCS = ["/trivialodon/assets/answering.mp3","/trivialodon/assets/answering 2.mp3","/trivialodon/assets/answering 3.mp3","/trivialodon/assets/answering 4.mp3","/trivialodon/assets/answering 5.mp3","/trivialodon/assets/answering 6.mp3","/trivialodon/assets/answering 7.mp3"];
    const VERSUS_AUDIO_SRC = "/trivialodon/assets/vs.mp3";
    const WINNER_AUDIO_SRC = "/trivialodon/assets/winner.mp3";
    const LOSER_AUDIO_SRC = "/trivialodon/assets/loser.mp3";
    const CATEGORY_ARTS = {
      ciencia:{src:"/trivialodon/assets/ciencia.png", keywords:["ciencia","naturaleza","biologia","quimica","fisica","tecnologia","espacio","salud"]},
      cineytv:{src:"/trivialodon/assets/cineytv.png", keywords:["cine","tv","television","series","peliculas","streaming","famosos"]},
      friki:{src:"/trivialodon/assets/friki.png", keywords:["friki","geek","marvel","dc","anime","manga","videojuego","videojuegos","fantasia","superheroes","superheroe","comic","comics","star wars","star trek"]},
      geografia:{src:"/trivialodon/assets/geografia.png", keywords:["geografia","mundo","paises","capitales","continentes","mapas","espana","viajes"]},
      mundo_antiguo:{src:"/trivialodon/assets/mundo%20antiguo.png", keywords:["historia","antigua","antiguo","edad media","romanos","egipto","grecia","mundo antiguo","prehistoria"]},
      psicologia:{src:"/trivialodon/assets/psicologia.png", keywords:["psicologia","mente","emociones","conducta","cerebro","personalidad"]},
      otros:{src:"/trivialodon/assets/otros.png", keywords:[]}
    };
    const VERSUS_MOVES = [
      {id:"rock",label:{es:"Piedra",en:"Rock"},glyph:"✊"},
      {id:"paper",label:{es:"Papel",en:"Paper"},glyph:"✋"},
      {id:"scissors",label:{es:"Tijera",en:"Scissors"},glyph:"✌️"}
    ];
    const VERSUS_INTRO_SECONDS = 4;
    const VERSUS_BONUS_POINTS = 20;
    const VERSUS_ROUND_SECONDS = 5;
    const CAST_APP_ID = "C5432B88";
    const CAST_NAMESPACE = "urn:x-cast:zaurio.trivialodon";
    const $ = id => document.getElementById(id);
    const ui = {
      introScene:$("introScene"), shell:$("shell"), btnHost:$("btnHost"), btnGuest:$("btnGuest"), btnContinue:$("btnContinue"), menuWrap:$("menuWrap"), menuBtn:$("menuBtn"), menuHomeLinkLabel:$("menuHomeLinkLabel"),
      identity:$("identity"), scoreChipValue:$("scoreChipValue"), soundWrap:$("soundWrap"), soundPanel:$("soundPanel"), soundChip:$("soundChip"), soundChipGlyph:$("soundChipGlyph"), soundChipLabel:$("soundChipLabel"), btnToggleMute:$("btnToggleMute"), soundMini:$("soundMini"), soundVolumeInput:$("soundVolumeInput"), soundVolumeLabel:$("soundVolumeLabel"), settingsCast:$("settingsCast"), btnEndGame:$("btnEndGame"), btnExitGame:$("btnExitGame"), identityAvatar:$("identityAvatar"), identityName:$("identityName"), identityRole:$("identityRole"),
      scenes:{join:$("joinScene"), profile:$("profileScene"), lobby:$("lobbyScene"), setup:$("setupScene"), generating:$("generatingScene"), paused:$("pausedScene"), countdown:$("countdownScene"), question:$("questionScene"), answer:$("answerScene"), scores:$("scoresScene"), versusIntro:$("versusIntroScene"), versus:$("versusScene")},
      joinCodeOnlyInput:$("joinCodeOnlyInput"), joinStatus:$("joinStatus"), btnJoinBack:$("btnJoinBack"), btnJoinNext:$("btnJoinNext"),
      profileLayout:$("profileLayout"), profileSideCard:$("profileSideCard"), lobbyLayout:$("lobbyLayout"), setupLayout:$("setupLayout"), profileKicker:$("profileKicker"), profileTitle:$("profileTitle"), roomBadge:$("roomBadge"), joinCodeField:$("joinCodeField"), joinCodeInput:$("joinCodeInput"), joinCodeLabel:$("joinCodeLabel"),
      nameInput:$("nameInput"), avatarViewport:$("avatarViewport"), avatarRail:$("avatarRail"), avatarLegend:$("avatarLegend"), btnAvatarPrev:$("btnAvatarPrev"), btnAvatarNext:$("btnAvatarNext"), profileStatus:$("profileStatus"), btnBack:$("btnBack"), btnReady:$("btnReady"),
      joinKicker:$("joinKicker"), joinTitle:$("joinTitle"), joinLead:$("joinLead"), joinCodeOnlyLabel:$("joinCodeOnlyLabel"), profilePlayers:$("profilePlayers"), profileSideKicker:$("profileSideKicker"), profileSideTitle:$("profileSideTitle"), profileSideText:$("profileSideText"), lobbySide:$("lobbySide"), lobbyKicker:$("lobbyKicker"), lobbyTitle:$("lobbyTitle"),
      lobbyDesc:$("lobbyDesc"), lobbyPlayers:$("lobbyPlayers"), modesLead:$("modesLead"), btnToSetup:$("btnToSetup"), setupSide:$("setupSide"), setupKicker:$("setupKicker"), setupDesc:$("setupDesc"), modesKicker:$("modesKicker"), durationKicker:$("durationKicker"), durationLead:$("durationLead"), generatingTitle:$("generatingTitle"), generatingKicker:$("generatingKicker"), hostVoteWrap:$("hostVoteWrap"),
      hostVoteCountdown:$("hostVoteCountdown"), voteToggle:$("voteToggle"), modeGrid:$("modeGrid"), durationGrid:$("durationGrid"), setupActions:$("setupActions"),
      generatingLine:$("generatingLine"), generatingKicker:$("generatingKicker"), pausedTitle:$("pausedTitle"), pausedKicker:$("pausedKicker"), pausedCopy:$("pausedCopy"), pausedActions:$("pausedActions"), countdownCategory:$("countdownCategory"), countdownCategoryArt:$("countdownCategoryArt"), countdownValue:$("countdownValue"), countdownActions:$("countdownActions"), questionPrompt:$("questionPrompt"), questionCopy:$("questionCopy"), questionTimerRing:$("questionTimerRing"),
      questionTimer:$("questionTimer"), questionAnswers:$("questionAnswers"), answerCorrect:$("answerCorrect"), answerPrompt:$("answerPrompt"),
      scoresTitle:$("scoresTitle"), scoresLead:$("scoresLead"), scoresRows:$("scoresRows"), finalActions:$("finalActions"), versusIntroLead:$("versusIntroLead"), versusIntroNames:$("versusIntroNames"), versusIntroCopy:$("versusIntroCopy"), versusIntroCount:$("versusIntroCount"), versusLead:$("versusLead"), versusRoundBadge:$("versusRoundBadge"), versusBurst:$("versusBurst"), versusChampionFx:$("versusChampionFx"), versusChampionText:$("versusChampionText"), versusHandA:$("versusHandA"), versusHandB:$("versusHandB"), versusPlayerA:$("versusPlayerA"), versusPlayerB:$("versusPlayerB"), versusScoreline:$("versusScoreline"), versusTimer:$("versusTimer"), versusRoundCopy:$("versusRoundCopy"), versusButtons:$("versusButtons"), scoreModal:$("scoreModal"), scoreModalKicker:$("scoreModalKicker"), scoreModalTitle:$("scoreModalTitle"), scoreModalRows:$("scoreModalRows"),
      btnCloseScore:$("btnCloseScore"), resumeModal:$("resumeModal"), resumeKicker:$("resumeKicker"), resumeTitle:$("resumeTitle"), resumeText:$("resumeText"), btnResumeContinue:$("btnResumeContinue"), btnResumeNew:$("btnResumeNew"),
      durationModal:$("durationModal"), durationModalKicker:$("durationModalKicker"), durationModalTitle:$("durationModalTitle"), durationMinutesField:$("durationMinutesField"), durationQuestionsField:$("durationQuestionsField"),
      durationMinutesInput:$("durationMinutesInput"), durationQuestionsInput:$("durationQuestionsInput"), durationMinutesLabel:$("durationMinutesLabel"), durationQuestionsLabel:$("durationQuestionsLabel"), btnCloseDuration:$("btnCloseDuration"), btnAcceptDuration:$("btnAcceptDuration"),
      customModal:$("customModal"), customKicker:$("customKicker"), customTitle:$("customTitle"), customThemeInput:$("customThemeInput"), customThemeLabel:$("customThemeLabel"), customToneLabel:$("customToneLabel"), customToneChoices:$("customToneChoices"), customDifficultyLabel:$("customDifficultyLabel"), customDifficultyChoices:$("customDifficultyChoices"), customPromptLabel:$("customPromptLabel"), customPromptInput:$("customPromptInput"),
      btnCloseCustom:$("btnCloseCustom"), btnAcceptCustom:$("btnAcceptCustom"),
      castDeviceName:$("castDeviceName"), castDeviceHint:$("castDeviceHint"), btnCastConnect:$("btnCastConnect"), castVolumeInput:$("castVolumeInput"), castVolumeLabel:$("castVolumeLabel"), btnCastMute:$("btnCastMute"), btnCastDisconnect:$("btnCastDisconnect"), castStatus:$("castStatus"),
      introLead:$("introLead"), settingsLanguage:$("settingsLangTitle"), settingsGame:$("settingsGameTitle"), btnEndGameText:$("btnEndGameText"), btnExitGameText:$("btnExitGameText"),
      langEsIntro:$("langEsIntro"), langEnIntro:$("langEnIntro"), langEs:$("langEs"), langEn:$("langEn")
    };
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
    const state = {
      playerId:crypto.randomUUID(), role:"", roomCode:"", name:"", ready:false, waitingLine:"", channel:null, players:[], avatarIndex:0, localAnswer:null,
      avatar:{kind:"preset",src:AVATAR_OPTIONS[0].src,rendered:AVATAR_OPTIONS[0].src,avatarId:AVATAR_OPTIONS[0].id},
      game:{phase:"lobby",selectedMode:"",selectedDuration:"",selectedDurationValue:15,question:null,questionIndex:0,scores:{},questionSet:[],questionLeadSeconds:6,answerSeconds:15,lastRoundScores:{},tieTracker:{streak:0,pair:[]},versus:null,hostNotice:"",lang:currentLang,customConfig:{theme:"",tone:"divertido",difficulty:"media",customPrompt:""}}
    };
    const audioState = {
      muted: localStorage.getItem(SOUND_KEY) === "1",
      volume: Math.max(0, Math.min(1, Number(localStorage.getItem(SOUND_VOLUME_KEY) || .72))),
      unlocked: false,
      lastFinalCue: "",
      fadeTimers: new Map(),
      decks: {},
      versus: new Audio(VERSUS_AUDIO_SRC),
      winner: new Audio(WINNER_AUDIO_SRC),
      loser: new Audio(LOSER_AUDIO_SRC)
    };
    const castState = {available:false, session:null, connected:false, deviceName:"", volume:.7, muted:false};
    let clockOffsetMs = 0;
    const esc = value => String(value || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
    const normalizeCategory = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
    function categoryArtFor(category){
      const raw = normalizeCategory(category);
      if(!raw) return CATEGORY_ARTS.otros;
      const match = Object.values(CATEGORY_ARTS).find(entry => entry.keywords.some(keyword => raw.includes(keyword)));
      return match || CATEGORY_ARTS.otros;
    }
    function translateCategory(category){
      if(!category) return t("surpriseCategory");
      if(currentLang === "en" && CATEGORY_LABELS[category]?.en) return CATEGORY_LABELS[category].en;
      return category;
    }
    const normalize = value => String(value || "").replace(/\D/g,"").slice(0,4);
    const sharedNow = () => Date.now() + clockOffsetMs;
    const syncClock = hostNow => {
      const nextOffset = Math.round(Number(hostNow || 0) - Date.now());
      if(!Number.isFinite(nextOffset)) return;
      clockOffsetMs = Math.abs(clockOffsetMs) < 1 ? nextOffset : Math.round((clockOffsetMs * 0.4) + (nextOffset * 0.6));
    };
    const countText = ts => { const left = Math.max(0, Math.ceil((ts - sharedNow()) / 1000)); return `${String(Math.floor(left / 60)).padStart(2,"0")}:${String(left % 60).padStart(2,"0")}`; };
    const lineFor = id => {
      const lines = FUN_LINES[currentLang] || FUN_LINES.es;
      return lines[[...id].reduce((a,c)=>a + c.charCodeAt(0), 0) % lines.length];
    };
    const roomCode = () => String(Math.floor(1000 + Math.random() * 9000));
    const hostCanContinue = () => state.role === "host" && state.players.length > 0 && state.players.every(player => player.ready);
    const shuffle = list => { const copy = [...list]; for(let i = copy.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
    const prepareQuestion = source => {
      if(source.type === "speed"){
        const shuffled = shuffle((source.choices || []).map(choice => ({...choice})));
        return {
          type:"speed",
          prompt: source.prompt,
          category: source.category || "Modo Velociraptor!",
          choices: shuffled.map(item => item.text),
          scores: shuffled.map(item => Number(item.score || 0)),
          ranking: [...(source.choices || [])].sort((a,b) => (a.rank || 99) - (b.rank || 99)).map(item => ({text:item.text,score:Number(item.score || 0),rank:Number(item.rank || 0)})),
          explanation: source.explanation || ""
        };
      }
      const choices = (source.answers || source.choices || []).map((text, index) => ({text, correct:index === source.correct}));
      const shuffled = shuffle(choices);
      return {
        type:"standard",
        prompt: source.prompt,
        category: source.category || "Cultura general",
        choices: shuffled.map(item => item.text),
        correct: shuffled.findIndex(item => item.correct),
        explanation: source.explanation || ""
      };
    };
    const takeDiverseQuestions = (pool, target) => {
      const buckets = new Map();
      shuffle(pool).forEach(item => {
        const category = item.category || "Otros";
        if(!buckets.has(category)) buckets.set(category, []);
        buckets.get(category).push(item);
      });
      const categoryOrder = shuffle([...buckets.keys()]);
      const chosen = [];
      const usedBasePrompts = new Set();
      let progressed = true;
      while(chosen.length < target && progressed){
        progressed = false;
        categoryOrder.forEach(category => {
          if(chosen.length >= target) return;
          const bucket = buckets.get(category) || [];
          while(bucket.length){
            const candidate = bucket.shift();
            const key = candidate.basePrompt || candidate.prompt;
            if(usedBasePrompts.has(key)) continue;
            chosen.push(candidate);
            usedBasePrompts.add(key);
            progressed = true;
            break;
          }
        });
      }
      if(chosen.length < target){
        shuffle(pool).forEach(item => {
          if(chosen.length >= target) return;
          chosen.push(item);
        });
      }
      return chosen.slice(0, target);
    };
    const buildMixedQuestionSet = (count, bank) => {
      const speedCount = Math.max(1, Math.round(count * 0.2));
      const standardCount = Math.max(0, count - speedCount);
      const base = takeDiverseQuestions(bank || QUESTION_BANK, standardCount);
      const speed = takeDiverseQuestions(SPEED_QUESTION_BANK, Math.min(speedCount, SPEED_QUESTION_BANK.length));
      return shuffle([...base, ...speed]).slice(0, count);
    };
    const fallbackFact = question => {
      const choices = Array.isArray(question?.choices) ? question.choices : [];
      const answer = choices[question?.correct] || "esa opcion";
      return question?.explanation || `Dato flash: la respuesta correcta era ${answer}. Ahora ya no se te escapa en la siguiente ronda.`;
    };
    const activeQuestionSet = () => Array.isArray(state.game.questionSet) && state.game.questionSet.length ? state.game.questionSet : buildMixedQuestionSet(CLASSIC_TOTAL_QUESTIONS, QUESTION_BANK);
    const gameDefaults = () => ({phase:"lobby",selectedMode:"",selectedDuration:"",selectedDurationValue:15,question:null,questionIndex:0,scores:{},questionSet:[],questionLeadSeconds:6,answerSeconds:15,lastRoundScores:{},tieTracker:{streak:0,pair:[]},versus:null,hostNotice:"",lang:currentLang,customConfig:{theme:"",tone:"divertido",difficulty:"media",customPrompt:""}});
    function serializeQuestionForTranslation(question){
      if(question?.type === "speed"){
        return {
          type:"speed",
          question:question.prompt || "",
          choices:(question.choices || []).map((choice, index) => ({
            text:choice?.text || choice || "",
            score:Number(choice?.score ?? question.scores?.[index] ?? 0),
            rank:Number(choice?.rank ?? question.ranking?.find(item => item.text === (choice?.text || choice))?.rank ?? index + 1)
          })),
          explanation:question.explanation || "",
          category:question.category || "Modo Velociraptor!",
          difficulty:"media"
        };
      }
      return {
        type:"standard",
        question:question.prompt || "",
        choices:[...(question.answers || question.choices || [])],
        correct_index:Number(question.correct ?? 0),
        explanation:question.explanation || "",
        category:question.category || "Cultura general",
        difficulty:"media"
      };
    }
    function hydrateTranslatedQuestionSet(items){
      return (items || []).map(item => {
        if(item?.type === "speed"){
          return {
            type:"speed",
            prompt:item.question || "",
            choices:(item.choices || []).map(choice => ({
              text:choice?.text || "",
              score:Number(choice?.score || 0),
              rank:Number(choice?.rank || 0)
            })),
            explanation:item.explanation || "",
            category:item.category || "Velociraptor Mode!"
          };
        }
        return {
          prompt:item?.question || "",
          answers:Array.isArray(item?.choices) ? item.choices.map(String) : [],
          correct:Number(item?.correct_index || 0),
          explanation:item?.explanation || "",
          category:item?.category || "General knowledge"
        };
      });
    }
    const roundSeconds = () => Number(state.game.questionLeadSeconds || 6) + Number(state.game.answerSeconds || 15) + 10;
    const plannedQuestionCount = () => {
      if(state.game.selectedDuration === "questions") return Math.max(5, Number(state.game.selectedDurationValue || 15));
      if(state.game.selectedDuration === "timed") return Math.max(5, Math.floor((Math.max(5, Number(state.game.selectedDurationValue || 15)) * 60) / roundSeconds()));
      if(state.game.selectedDuration === "olympic") return Math.max(20, Math.floor((40 * 60) / roundSeconds()));
      return CLASSIC_TOTAL_QUESTIONS;
    };
    const durationLabel = () => {
      if(state.game.selectedDuration === "questions") return `${state.game.selectedDurationValue || 15} preguntas`;
      if(state.game.selectedDuration === "timed") return `${state.game.selectedDurationValue || 15} min`;
      if(state.game.selectedDuration === "olympic") return "40 min";
      return "";
    };
    const scorePairKey = pair => [...(pair || [])].sort().join("|");
    const versusMoveById = id => VERSUS_MOVES.find(move => move.id === id) || VERSUS_MOVES[0];
    const versusMoveLabel = move => move ? (typeof move.label === "object" ? (move.label[currentLang] || move.label.en) : move.label) : "";
    const versusBeats = (left, right) => (left === "rock" && right === "scissors") || (left === "paper" && right === "rock") || (left === "scissors" && right === "paper");
    function readyPlayers(){
      return state.players.filter(player => player.ready);
    }
    function findPlayer(playerId){
      return state.players.find(player => player.playerId === playerId) || null;
    }
    function currentTiePair(scores){
      const buckets = new Map();
      readyPlayers().forEach(player => {
        const score = Number((scores || {})[player.playerId] || 0);
        if(!buckets.has(score)) buckets.set(score, []);
        buckets.get(score).push(player.playerId);
      });
      const tiedPairs = [...buckets.values()].filter(group => group.length === 2);
      const crowded = [...buckets.values()].some(group => group.length > 2);
      if(crowded || tiedPairs.length !== 1) return [];
      return [...tiedPairs[0]].sort();
    }
    function evaluateTieTracker(scores){
      const pair = currentTiePair(scores);
      if(pair.length !== 2) return {streak:0,pair:[]};
      const previous = state.game.tieTracker || {streak:0,pair:[]};
      if(scorePairKey(previous.pair) === scorePairKey(pair)) return {streak:Number(previous.streak || 0) + 1,pair};
      return {streak:1,pair};
    }
    function createVersusState(pair){
      return {
        pair:[...pair],
        bestOf:3,
        introEndsAt:Date.now() + (VERSUS_INTRO_SECONDS * 1000),
        wins:{[pair[0]]:0,[pair[1]]:0},
        roundNumber:1,
        roundDeadline:0,
        choices:{},
        revealChoices:{},
        roundWinnerId:"",
        finalWinnerId:"",
        awarded:false,
        revealUntil:0,
        spectatorIds:readyPlayers().map(player => player.playerId).filter(playerId => !pair.includes(playerId))
      };
    }
    function resetVersusRound(versus){
      versus.choices = {};
      versus.revealChoices = {};
      versus.roundWinnerId = "";
      versus.roundDeadline = Date.now() + (VERSUS_ROUND_SECONDS * 1000);
      versus.revealUntil = 0;
      return versus;
    }
    function concludeVersusRound(versus){
      const [playerA, playerB] = versus.pair || [];
      const moveA = versus.choices?.[playerA] || "";
      const moveB = versus.choices?.[playerB] || "";
      versus.revealChoices = {...(versus.choices || {})};
      if(!moveA && !moveB){
        versus.roundWinnerId = "";
      } else if(!moveA){
        versus.roundWinnerId = playerB;
      } else if(!moveB){
        versus.roundWinnerId = playerA;
      } else if(moveA === moveB){
        versus.roundWinnerId = "";
      } else {
        versus.roundWinnerId = versusBeats(moveA, moveB) ? playerA : playerB;
      }
      if(versus.roundWinnerId){
        versus.wins[versus.roundWinnerId] = Number(versus.wins[versus.roundWinnerId] || 0) + 1;
      }
      const neededWins = Math.ceil(Number(versus.bestOf || 3) / 2);
      const winner = versus.pair.find(playerId => Number(versus.wins[playerId] || 0) >= neededWins) || "";
      if(winner){
        versus.finalWinnerId = winner;
        versus.revealUntil = Date.now() + 2600;
        return versus;
      }
      versus.revealUntil = Date.now() + 2200;
      return versus;
    }
    function resetGameToSetup(clearScores = false){
      const next = gameDefaults();
      state.game.phase = "setup";
      state.game.finished = false;
      state.game.finishedAt = 0;
      state.game.question = null;
      state.game.questionIndex = 0;
      state.game.questionSet = [];
      state.game.lastRoundScores = {};
      state.game.tieTracker = next.tieTracker;
      state.game.versus = null;
      state.game.hostNotice = "";
      state.game.selectedMode = "classic";
      state.game.selectedDuration = "questions";
      state.game.selectedDurationValue = 15;
      if(clearScores) state.game.scores = {};
    }
    function maybeStartVersus(){
      const nextTie = evaluateTieTracker(state.game.scores || {});
      state.game.tieTracker = nextTie;
      if(Number(nextTie.streak || 0) >= 2 && (nextTie.pair || []).length === 2){
        state.game.phase = "versus_intro";
        state.game.versus = createVersusState(nextTie.pair);
        return true;
      }
      state.game.versus = null;
      return false;
    }
    function createLoopDeck(sources, targetVolume){
      const tracks = [new Audio(), new Audio()];
      tracks.forEach(track => { track.preload = "auto"; track.loop = false; track.volume = 0; });
      return {tracks, sources:[...(sources || [])], activeIndex:0, baseVolume:targetVolume, targetVolume:targetVolume, playing:false, transition:false, handoffSeconds:1.1, lastSourceIndex:-1};
    }
    function pickDeckSourceIndex(deck, excludeIndex = -1){
      const total = deck?.sources?.length || 0;
      if(total <= 1) return 0;
      const options = [];
      for(let i = 0; i < total; i++){
        if(i !== excludeIndex && i !== deck.lastSourceIndex) options.push(i);
      }
      if(!options.length){
        for(let i = 0; i < total; i++){
          if(i !== excludeIndex) options.push(i);
        }
      }
      return options[Math.floor(Math.random() * options.length)];
    }
    function assignTrackSource(track, deck, sourceIndex){
      const src = deck.sources[sourceIndex] || deck.sources[0] || "";
      if(!src) return;
      if(track.__trivialodonSrc !== src){
        safePause(track);
        safeRewind(track);
        track.src = src;
        track.__trivialodonSrc = src;
        try{ track.load(); } catch(_){}
      }
      track.__trivialodonSourceIndex = sourceIndex;
      deck.lastSourceIndex = sourceIndex;
    }
    audioState.decks.waiting = createLoopDeck(WAITING_AUDIO_SRCS, .34);
    audioState.decks.answering = createLoopDeck(ANSWERING_AUDIO_SRCS, .38);
    audioState.preloads = [...WAITING_AUDIO_SRCS, ...ANSWERING_AUDIO_SRCS].map(src => { const track = new Audio(src); track.preload = "auto"; return track; });
    audioState.versus.preload = "auto";
    audioState.versus.loop = true;
    [audioState.versus,audioState.winner,audioState.loser, ...(audioState.preloads || [])].forEach(track => { track.preload = "auto"; });
    function refreshAudioTargets(){
      audioState.decks.waiting.targetVolume = audioState.decks.waiting.baseVolume * audioState.volume;
      audioState.decks.answering.targetVolume = audioState.decks.answering.baseVolume * audioState.volume;
      audioState.versus.volume = .44 * audioState.volume;
      audioState.winner.volume = .52 * audioState.volume;
      audioState.loser.volume = .46 * audioState.volume;
      ui.soundVolumeInput.value = String(Math.round(audioState.volume * 100));
    }
    function applyVolumeImmediately(){
      ["waiting","answering"].forEach(key => {
        const deck = audioState.decks[key];
        if(!deck) return;
        deck.tracks.forEach(track => {
          if(!track) return;
          const target = audioState.muted ? 0 : deck.targetVolume;
          clearFade(track);
          track.muted = audioState.muted;
          track.volume = target;
        });
      });
      [audioState.versus,audioState.winner,audioState.loser].forEach(track => {
        if(!track) return;
        clearFade(track);
        track.muted = audioState.muted;
      });
      if(!audioState.versus.paused) audioState.versus.volume = audioState.muted ? 0 : (.44 * audioState.volume);
      if(!audioState.winner.paused) audioState.winner.volume = audioState.muted ? 0 : (.52 * audioState.volume);
      if(!audioState.loser.paused) audioState.loser.volume = audioState.muted ? 0 : (.46 * audioState.volume);
    }
    function updateSoundChip(){
      ui.soundChip.hidden = !state.role;
      ui.soundChipGlyph.textContent = audioState.muted ? "🔇" : (audioState.volume < .45 ? "🔉" : "🔊");
      ui.btnToggleMute.textContent = audioState.muted ? t("unmute") : t("mute");
    }
    refreshAudioTargets();
    function safePause(track){ try{ track.pause(); } catch(_){} }
    function safeRewind(track){ try{ track.currentTime = 0; } catch(_){} }
    function safePlay(track){
      if(audioState.muted || !audioState.unlocked || !track) return;
      const result = track.play();
      if(result && typeof result.catch === "function") result.catch(() => {});
    }
    function clearFade(track){
      const timer = audioState.fadeTimers.get(track);
      if(timer){ clearInterval(timer); audioState.fadeTimers.delete(track); }
    }
    function fadeTrack(track, to, duration = 980, pauseOnZero = false){
      if(!track) return;
      clearFade(track);
      const from = Number(track.volume || 0);
      const start = Date.now();
      const timer = setInterval(() => {
        const progress = Math.min(1, (Date.now() - start) / duration);
        track.volume = from + (to - from) * progress;
        if(progress >= 1){
          clearFade(track);
          track.volume = to;
          if(pauseOnZero && to <= 0.001){
            safePause(track);
            safeRewind(track);
          }
        }
      }, 40);
      audioState.fadeTimers.set(track, timer);
    }
    function activeTrack(deck){ return deck.tracks[deck.activeIndex]; }
    function standbyTrack(deck){ return deck.tracks[1 - deck.activeIndex]; }
    function ensureDeckPlaying(deck){
      if(!deck || deck.playing) return;
      const track = activeTrack(deck);
      assignTrackSource(track, deck, pickDeckSourceIndex(deck));
      safePause(track);
      safeRewind(track);
      track.volume = 0;
      safePlay(track);
      fadeTrack(track, deck.targetVolume, 1100, false);
      deck.playing = true;
      deck.transition = false;
    }
    function stopDeck(deck, immediate = false){
      if(!deck) return;
      deck.playing = false;
      deck.transition = false;
      deck.tracks.forEach(track => {
        clearFade(track);
        if(immediate){
          safePause(track);
          safeRewind(track);
          track.volume = 0;
        } else {
          fadeTrack(track, 0, 900, true);
        }
      });
    }
    function maintainDeck(deck){
      if(!deck || !deck.playing || deck.transition || audioState.muted || !audioState.unlocked) return;
      const current = activeTrack(deck);
      const next = standbyTrack(deck);
      if(!current.duration || current.currentTime < Math.max(0, current.duration - deck.handoffSeconds)) return;
      deck.transition = true;
      assignTrackSource(next, deck, pickDeckSourceIndex(deck, current.__trivialodonSourceIndex ?? -1));
      safePause(next);
      safeRewind(next);
      next.volume = 0;
      safePlay(next);
      fadeTrack(next, deck.targetVolume, 420, false);
      fadeTrack(current, 0, 420, true);
      setTimeout(() => {
        deck.activeIndex = 1 - deck.activeIndex;
        deck.transition = false;
      }, 440);
    }
    function pauseBackgroundAudio(immediate = false){
      stopDeck(audioState.decks.waiting, immediate);
      stopDeck(audioState.decks.answering, immediate);
    }
    function primeAudio(){
      if(audioState.unlocked) return;
      audioState.unlocked = true;
      [...audioState.decks.waiting.tracks, ...audioState.decks.answering.tracks, ...(audioState.preloads || []), audioState.versus, audioState.winner, audioState.loser].forEach(track => {
        try{ track.load(); } catch(_){}
      });
      syncAudio();
    }
    function ensureAudioReady(){
      if(audioState.muted) return;
      primeAudio();
      syncAudio();
    }
    function setVolume(value){
      const mutedBefore = audioState.muted;
      audioState.volume = Math.max(0, Math.min(1, Number(value)));
      try{ localStorage.setItem(SOUND_VOLUME_KEY, String(audioState.volume)); } catch(_){}
      if(audioState.volume <= 0.001 && !audioState.muted){
        audioState.muted = true;
        try{ localStorage.setItem(SOUND_KEY, "1"); } catch(_){}
      } else if(audioState.volume > 0.001 && audioState.muted){
        audioState.muted = false;
        try{ localStorage.setItem(SOUND_KEY, "0"); } catch(_){}
      }
      refreshAudioTargets();
      applyVolumeImmediately();
      updateSoundChip();
      if(mutedBefore !== audioState.muted) syncAudio();
    }
    function setMuted(value){
      audioState.muted = !!value;
      try{ localStorage.setItem(SOUND_KEY, audioState.muted ? "1" : "0"); } catch(_){}
      if(audioState.muted){
        pauseBackgroundAudio(true);
        [audioState.versus,audioState.winner,audioState.loser].forEach(track => { safePause(track); safeRewind(track); });
      } else {
        primeAudio();
      }
      updateSoundChip();
      syncAudio();
    }
    function playFinalCue(win){
      const cueKey = `${state.game.finishedAt || 0}:${win ? "win" : "lose"}`;
      if(audioState.lastFinalCue === cueKey) return;
      audioState.lastFinalCue = cueKey;
      pauseBackgroundAudio();
      safePause(audioState.winner); safePause(audioState.loser);
      safeRewind(audioState.winner); safeRewind(audioState.loser);
      safePlay(win ? audioState.winner : audioState.loser);
    }
    function syncAudio(){
      updateSoundChip();
      if(!state.role || audioState.muted || !audioState.unlocked){
        pauseBackgroundAudio(true);
        [audioState.versus,audioState.winner,audioState.loser].forEach(track => safePause(track));
        return;
      }
      const scene = currentScene();
      const finished = scene === "scores" && !!state.game.finished;
      if(!finished) audioState.lastFinalCue = "";
      if(finished){
        const entries = scoreEntries();
        const leader = entries[0];
        const win = !!(leader && leader.playerId === state.playerId);
        playFinalCue(win);
        return;
      }
      if(scene === "versusIntro" || scene === "versus"){
        pauseBackgroundAudio();
        safePause(audioState.winner);
        safePause(audioState.loser);
        safePlay(audioState.versus);
        return;
      }
      safePause(audioState.versus);
      safePause(audioState.winner);
      safePause(audioState.loser);
      const useAnswering = scene === "question" || (scene === "countdown" && state.game.countdownEndAt && (state.game.countdownEndAt - Date.now()) <= 3200);
      const target = useAnswering ? audioState.decks.answering : audioState.decks.waiting;
      const other = useAnswering ? audioState.decks.waiting : audioState.decks.answering;
      ensureDeckPlaying(target);
      stopDeck(other, false);
    }
    setInterval(() => {
      maintainDeck(audioState.decks.waiting);
      maintainDeck(audioState.decks.answering);
    }, 120);
    function saveSession(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({playerId:state.playerId,role:state.role,roomCode:state.roomCode,name:state.name,ready:state.ready,avatar:state.avatar,game:state.game})); } catch(_){} }
    function clearSession(){ try{ localStorage.removeItem(STORAGE_KEY); } catch(_){} }
    function readSession(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch(_){ return null; } }
    function showResumeModal(){ ui.resumeModal.classList.add("on"); }
    function hideResumeModal(){ ui.resumeModal.classList.remove("on"); }
    function startFreshFromMenu(){ clearSession(); location.reload(); }
    async function terminateGameByHost(){
      if(state.role !== "host") return;
      state.game = {...gameDefaults(), phase:"lobby", hostNotice:"Partida terminada por el anfitrion"};
      state.localAnswer = null;
      await broadcastGame();
      renderCurrentScene();
    }
    function setCastStatus(text, type = "info"){ ui.castStatus.textContent = text; ui.castStatus.className = `castStatus ${type}`; }
    function isIosLike(){ return /iPad|iPhone|iPod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
    function castErrorText(error){
      const code = error?.code || error?.errorCode || "";
      const text = String(error?.description || error?.message || "").trim();
      if(code === "cancel" || code === "cancel_session_error" || code === "cancel_request_session_error") return "Has cancelado la seleccion del Chromecast.";
      if(code === "receiver_unavailable" || code === "receiver_unavailable_error") return "No encuentro ningun Chromecast disponible ahora mismo.";
      if(code === "timeout" || code === "timeout_error") return "La conexion con Chromecast ha tardado demasiado.";
      return text || "No he podido conectar con Chromecast.";
    }
    function getCastContext(){ return window.cast?.framework?.CastContext?.getInstance?.() || null; }
    function getCastSession(){ return getCastContext()?.getCurrentSession?.() || null; }
    function getCastRawSession(){ return castState.session?.getSessionObj?.() || null; }
    function refreshCastSessionData(){
      castState.session = getCastSession();
      castState.connected = !!castState.session;
      const raw = getCastRawSession();
      castState.deviceName = raw?.getCastDevice?.()?.friendlyName || raw?.receiver?.friendlyName || "";
      const level = raw?.receiver?.volume?.level;
      const muted = raw?.receiver?.volume?.muted;
      if(Number.isFinite(level)) castState.volume = Math.max(0, Math.min(1, Number(level)));
      if(typeof muted === "boolean") castState.muted = muted;
    }
    function updateCastUi(){
      const roomReady = !!state.roomCode;
      if(ui.settingsCast) ui.settingsCast.hidden = isIosLike();
      refreshCastSessionData();
      ui.castDeviceName.textContent = castState.connected ? (castState.deviceName || t("chromecastConnected")) : t("noDevice");
      ui.castDeviceHint.textContent = castState.connected ? t("castingRoom", {code: state.roomCode || "----"}) : (roomReady ? t("findChromecast") : t("joinRoomFirst"));
      ui.btnCastConnect.innerHTML = castState.connected ? `<span class="btnIcon">📺</span>${t("reconnectTv")}` : `<span class="btnIcon">📺</span>${t("sendToTv")}`;
      ui.btnCastConnect.disabled = !roomReady || isIosLike();
      ui.btnCastDisconnect.disabled = !castState.connected;
      ui.btnCastMute.disabled = !castState.connected;
      ui.castVolumeInput.disabled = !castState.connected;
      ui.castVolumeInput.value = String(Math.round((castState.volume || 0) * 100));
      ui.btnCastMute.innerHTML = castState.muted ? `<span class="btnIcon">🔊</span>${t("unmuteTv")}` : `<span class="btnIcon">🔇</span>${t("muteTv")}`;
      if(ui.settingsCast) ui.settingsCast.hidden = isIosLike();
      if(isIosLike()) setCastStatus(t("iosCastWarning"), "danger");
      else if(!castState.available) setCastStatus(t("castNotAvailable"), "danger");
      else if(castState.connected) setCastStatus(t("tvConnected", {custom: castState.deviceName ? `: ${castState.deviceName}` : ""}), "ok");
      else setCastStatus(t("chromecastReady"), "info");
    }
    function castPayload(){
      return {type:"sync", roomCode:state.roomCode, soundOff:false, sentAt:Date.now(), title:"Trivialodon Live"};
    }
    function sendCastMessage(payload){
      if(!castState.connected) return;
      try{
        const raw = getCastRawSession();
        if(raw?.sendMessage) raw.sendMessage(CAST_NAMESPACE, JSON.stringify(payload), ()=>{}, ()=>{});
      } catch(_){}
    }
    function syncCastSession(){
      if(!state.roomCode || !castState.connected) return;
      sendCastMessage(castPayload());
      updateCastUi();
    }
    function syncCastSessionBurst(){
      syncCastSession();
      setTimeout(syncCastSession, 400);
      setTimeout(syncCastSession, 1200);
    }
    function fallbackRequestSession(){
      return new Promise((resolve, reject) => {
        const req = window.chrome?.cast?.requestSession;
        if(!req) return reject(new Error("requestSession no disponible"));
        req(
          session => resolve(session),
          err => reject(err || new Error("No he podido abrir el selector de Chromecast."))
        );
      });
    }
    function setCastVolume(level){
      return new Promise(async resolve => {
        try{
          const session = getCastSession();
          if(session?.setVolume){
            await session.setVolume(level);
            castState.volume = level;
            if(level > 0) castState.muted = false;
            refreshCastSessionData();
            updateCastUi();
            return resolve(true);
          }
        } catch(_){}
        try{
          const raw = getCastRawSession();
          if(!raw?.setReceiverVolumeLevel) return resolve(false);
          raw.setReceiverVolumeLevel(level, () => {
            castState.volume = level;
            if(level > 0) castState.muted = false;
            refreshCastSessionData();
            updateCastUi();
            resolve(true);
          }, () => resolve(false));
        } catch(_){
          resolve(false);
        }
      });
    }
    function setCastMuted(muted){
      return new Promise(async resolve => {
        try{
          const session = getCastSession();
          if(session?.setMute){
            await session.setMute(muted);
            castState.muted = muted;
            refreshCastSessionData();
            updateCastUi();
            return resolve(true);
          }
        } catch(_){}
        try{
          const raw = getCastRawSession();
          if(!raw?.setReceiverMuted) return resolve(false);
          raw.setReceiverMuted(muted, () => {
            castState.muted = muted;
            refreshCastSessionData();
            updateCastUi();
            resolve(true);
          }, () => resolve(false));
        } catch(_){
          resolve(false);
        }
      });
    }
    async function connectCast(){
      if(!state.roomCode){
        setCastStatus(t("joinRoomFirst"), "danger");
        return;
      }
      if(isIosLike()){
        setCastStatus(t("iosCastWarning"), "danger");
        return;
      }
      const ctx = getCastContext();
      if(!ctx && !window.chrome?.cast?.requestSession){
        setCastStatus(t("castNotAvailable"), "danger");
        return;
      }
      ui.btnCastConnect.disabled = true;
      setCastStatus(t("castOpening"), "info");
      try{
        if(ctx?.requestSession) await ctx.requestSession();
        else await fallbackRequestSession();
        refreshCastSessionData();
        syncCastSessionBurst();
        setCastStatus(`Emision enviada${castState.deviceName ? ` a ${castState.deviceName}` : ""}.`, "ok");
      } catch(error){
        setCastStatus(castErrorText(error), "danger");
      } finally {
        ui.btnCastConnect.disabled = false;
      }
      updateCastUi();
    }
    function disconnectCast(){
      const ctx = getCastContext();
      try{ ctx?.endCurrentSession?.(true); } catch(_){}
      castState.session = null;
      castState.connected = false;
      castState.deviceName = "";
      updateCastUi();
    }
    window.__onGCastApiAvailable = function(isAvailable){
      castState.available = !!isAvailable;
      if(!isAvailable) return updateCastUi();
      const ctx = getCastContext();
      if(!ctx) return updateCastUi();
      ctx.setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: window.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED || "origin_scoped"
      });
      const evtType = window.cast?.framework?.CastContextEventType?.SESSION_STATE_CHANGED;
      if(evtType){
        ctx.addEventListener(evtType, () => {
          refreshCastSessionData();
          if(castState.connected) syncCastSession();
          updateCastUi();
        });
      }
      updateCastUi();
    };
    function syncChoiceGroup(root, key, value){ if(!root) return; root.querySelectorAll(`[data-${key}]`).forEach(btn => btn.classList.toggle("active", btn.dataset[key] === value)); }
    async function restoreSavedSession(saved){
      if(!saved?.role || !saved?.roomCode) return false;
      showShell();
      try{
        if(saved.playerId) state.playerId = saved.playerId;
        state.role = saved.role;
        state.roomCode = saved.roomCode;
        state.name = saved.name || "";
        state.ready = !!saved.ready;
        state.waitingLine = lineFor(state.playerId);
        state.avatar = normalizeSavedAvatar(saved.avatar);
        state.game = saved.game || state.game;
        if(saved?.game?.lang === "es" || saved?.game?.lang === "en"){
          applyCurrentLanguage(saved.game.lang, true);
        }
        ui.nameInput.value = state.name;
        applyAvatar();
        await connectRoom(saved.role, saved.roomCode, {keepGame:true, keepReady:true, silentStatus:true});
        state.role = saved.role;
        state.roomCode = saved.roomCode;
        state.name = saved.name || "";
        state.ready = !!saved.ready;
        state.waitingLine = lineFor(state.playerId);
        state.avatar = normalizeSavedAvatar(saved.avatar);
        state.game = saved.game || state.game;
        if(saved?.game?.lang === "es" || saved?.game?.lang === "en"){
          applyCurrentLanguage(saved.game.lang, true);
        }
        ui.nameInput.value = state.name;
        applyAvatar();
        await updatePresence();
        if(state.role === "host" && saved.game){
          await broadcastGame();
        }
        renderCurrentScene();
        return true;
      } catch(error){
        console.error("No he podido restaurar la partida", error);
        return false;
      }
    }
    function setStatus(text, tone){ ui.profileStatus.textContent = text || ""; ui.profileStatus.className = `status ${tone || "info"}`; }
    function avatarOption(index){ return AVATAR_OPTIONS[((index % AVATAR_OPTIONS.length) + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length]; }
    function normalizeSavedAvatar(avatar){
      if(!avatar) return {kind:"preset",src:AVATAR_OPTIONS[0].src,rendered:AVATAR_OPTIONS[0].src,avatarId:AVATAR_OPTIONS[0].id};
      const option = AVATAR_OPTIONS.find(item => item.id === avatar.avatarId || item.src === avatar.src || item.src === avatar.rendered);
      return option ? {kind:"preset",src:option.src,rendered:option.src,avatarId:option.id} : {kind:"preset",src:AVATAR_OPTIONS[0].src,rendered:AVATAR_OPTIONS[0].src,avatarId:AVATAR_OPTIONS[0].id};
    }
    function syncAvatarIndex(){ const idx = AVATAR_OPTIONS.findIndex(item => item.id === state.avatar.avatarId || item.src === state.avatar.src || item.src === state.avatar.rendered); state.avatarIndex = idx >= 0 ? idx : 0; }
      let avatarScrollBound = false;
      let avatarAnimating = false;
      let avatarQueuedShift = 0;
      let avatarDragState = null;
    function commitAvatarIndex(index, options = {}){
      const option = avatarOption(index);
      state.avatarIndex = AVATAR_OPTIONS.findIndex(item => item.id === option.id);
      state.avatar = {kind:"preset",src:option.src,rendered:option.src,avatarId:option.id};
      if(ui.avatarLegend) ui.avatarLegend.textContent = option.label;
      updateIdentity();
      if(options.scroll) renderAvatarCarousel();
    }
    function setAvatarIndex(index){ commitAvatarIndex(index, {scroll:true, behavior:"smooth"}); }
      function avatarCards(){ return ui.avatarRail ? [...ui.avatarRail.querySelectorAll("[data-offset]")] : []; }
      function avatarStepPx(){
        const first = avatarCards()[0];
        if(!first || !ui.avatarRail) return 0;
        const gap = parseFloat(getComputedStyle(ui.avatarRail).gap || 0) || 0;
        return first.offsetWidth + gap;
      }
      function avatarBaseOffset(){
        return -avatarStepPx();
      }
      function setAvatarRailOffset(px, animate = false){
        if(!ui.avatarRail) return;
        ui.avatarRail.style.transition = animate ? "transform .34s cubic-bezier(.22,.8,.18,1)" : "none";
        ui.avatarRail.style.transform = `translate3d(${px}px,0,0)`;
      }
      function normalizeAvatarVirtual(index){
        const len = AVATAR_OPTIONS.length;
        return ((index % len) + len) % len;
      }
      function ensureAvatarCarouselDom(){
        if(!ui.avatarRail) return;
        const items = [-2,-1,0,1,2].map(offset => {
          const option = avatarOption(state.avatarIndex + offset);
          const tone = offset === 0 ? "is-center" : (Math.abs(offset) === 1 ? "is-side" : "is-far");
          return `<button class="avatarCard ${tone}" data-offset="${offset}" data-avatar-index="${normalizeAvatarVirtual(state.avatarIndex + offset)}" type="button" tabindex="-1" aria-label="${esc(option.label)}"><img src="${option.src}" alt="${esc(option.label)}"></button>`;
        }).join("");
        ui.avatarRail.innerHTML = items;
        avatarCards().forEach(card => {
          card.onclick = () => {
            const offset = Number(card.dataset.offset || 0);
            if(offset === 0 || avatarAnimating) return;
            shiftAvatar(offset > 0 ? 1 : -1);
          };
        });
      }
      function updateAvatarCarouselSelection(){
        const option = avatarOption(state.avatarIndex);
        if(ui.avatarLegend) ui.avatarLegend.textContent = option.label;
      }
      function refreshAvatarCardTones(){
        avatarCards().forEach(card => {
          const offset = Number(card.dataset.offset || 0);
          card.classList.toggle("is-center", offset === 0);
          card.classList.toggle("is-side", Math.abs(offset) === 1);
          card.classList.toggle("is-far", Math.abs(offset) > 1);
        });
      }
      function completeAvatarShift(delta){
        commitAvatarIndex(state.avatarIndex + delta, {scroll:false});
        ensureAvatarCarouselDom();
        setAvatarRailOffset(avatarBaseOffset(), false);
        updateAvatarCarouselSelection();
        avatarAnimating = false;
        if(avatarQueuedShift){
          const next = Math.sign(avatarQueuedShift);
          avatarQueuedShift -= next;
          shiftAvatar(next);
        }
      }
      function shiftAvatar(delta){
        if(!ui.avatarRail || !delta) return;
        if(avatarAnimating){
          avatarQueuedShift = Math.max(-2, Math.min(2, avatarQueuedShift + Math.sign(delta)));
          return;
        }
        const step = avatarStepPx();
        if(!step) return;
        avatarAnimating = true;
        const direction = delta > 0 ? 1 : -1;
        setAvatarRailOffset(avatarBaseOffset() - (direction * step), true);
        clearTimeout(ui.avatarRail._avatarShiftTimer);
        ui.avatarRail._avatarShiftTimer = setTimeout(() => completeAvatarShift(direction), 340);
      }
      function bindAvatarSwipe(){
        if(!ui.avatarViewport || avatarScrollBound) return;
        avatarScrollBound = true;
        const start = clientX => {
          if(avatarAnimating) return;
          avatarDragState = {startX:clientX, deltaX:0};
          setAvatarRailOffset(avatarBaseOffset(), false);
        };
        const move = clientX => {
          if(!avatarDragState || avatarAnimating) return;
          avatarDragState.deltaX = clientX - avatarDragState.startX;
          const step = avatarStepPx() || 1;
          const damped = Math.max(-step * .9, Math.min(step * .9, avatarDragState.deltaX));
          setAvatarRailOffset(avatarBaseOffset() + damped, false);
        };
        const end = () => {
          if(!avatarDragState || avatarAnimating) return;
          const deltaX = avatarDragState.deltaX;
          avatarDragState = null;
          const threshold = Math.max(22, (avatarStepPx() || 80) * .18);
          if(Math.abs(deltaX) >= threshold){
            shiftAvatar(deltaX < 0 ? 1 : -1);
          } else {
            setAvatarRailOffset(avatarBaseOffset(), true);
          }
        };
        ui.avatarViewport.addEventListener("touchstart", ev => {
          if(ev.touches.length !== 1) return;
          start(ev.touches[0].clientX);
        }, {passive:true});
        ui.avatarViewport.addEventListener("touchmove", ev => {
          if(ev.touches.length !== 1) return;
          if(avatarDragState && Math.abs(ev.touches[0].clientX - avatarDragState.startX) > 6) ev.preventDefault();
          move(ev.touches[0].clientX);
        }, {passive:false});
        ui.avatarViewport.addEventListener("touchend", end, {passive:true});
        ui.avatarViewport.addEventListener("touchcancel", end, {passive:true});
      }
      function renderAvatarCarousel(){
        if(!ui.avatarRail) return;
        ensureAvatarCarouselDom();
        requestAnimationFrame(() => {
          setAvatarRailOffset(avatarBaseOffset(), false);
          updateAvatarCarouselSelection();
          refreshAvatarCardTones();
        });
        bindAvatarSwipe();
      }
    function updateIdentity(){ ui.identity.hidden = !state.role; updateSoundChip(); ui.identityName.textContent = state.name || t("noName"); ui.roomBadge.textContent = state.roomCode || "------"; ui.scoreChipValue.textContent = String((state.game.scores && state.game.scores[state.playerId]) || 0); const src = state.avatar.rendered || state.avatar.src; ui.identityAvatar.innerHTML = src ? `<img src="${src}" alt="">` : "\uD83E\uDD96"; ui.btnEndGame.hidden = state.role !== "host"; updateCastUi(); }
    function applyAvatar(){ syncAvatarIndex(); renderAvatarCarousel(); updateIdentity(); }
    function renderPlayerRows(players){ if(!players.length) return `<article class="playerCard"><div class="sceneStack"><div class="playerName">${t("nobodyYet")}</div><div class="playerSub">${t("roomWaits")}</div></div></article>`; return players.map(player => `<article class="playerCard"><div class="avatarStack">${player.ready && player.avatarSrc ? `<div class="avatarShot"><img src="${player.avatarSrc}" alt=""></div>` : `<div class="dinoHole">\uD83E\uDD96</div>`}<img class="avatarFrame" src="${FRAME_SRC}" alt=""></div><div class="sceneStack" style="gap:6px"><div class="playerName">${esc(player.ready ? player.name : (player.waitingLine || lineFor(player.playerId)))}</div><div class="playerSub">${esc(player.ready ? (player.role === "host" ? t("hostReady") : t("guestReady")) : t("notReadyYet"))}</div></div></article>`).join(""); }
    function dedupePlayers(raw){ const map = new Map(); raw.forEach(entry => { const prev = map.get(entry.playerId); if(!prev || entry.updatedAt > prev.updatedAt) map.set(entry.playerId, entry); }); return [...map.values()].sort((a,b) => { if(a.role !== b.role) return a.role === "host" ? -1 : 1; if(a.ready !== b.ready) return a.ready ? -1 : 1; return String(a.name || a.waitingLine).localeCompare(String(b.name || b.waitingLine), "es"); }); }
    function scoreEntries(){ return readyPlayers().map(player => ({playerId:player.playerId,name:player.name,avatarSrc:player.avatarSrc,score:(state.game.scores && state.game.scores[player.playerId]) || 0})).sort((a,b) => b.score - a.score || a.name.localeCompare(b.name, "es")); }
    function renderProfileScene(){
      const guestDraft = state.role === "guest" && !!state.roomCode;
      const soloProfileStep = state.role === "host" || guestDraft;
      if(!ui.profileStatus.classList.contains("danger")) setStatus("", "info");
      ui.profileKicker.textContent = state.role === "host" ? t("room") : t("guestKicker");
      ui.profileTitle.textContent = state.role === "host" ? t("hostProfileTitle") : t("guestProfileTitle");
      ui.profileSideKicker.textContent = state.role === "host" ? t("room") : t("guestKicker");
      ui.profileSideTitle.textContent = state.role === "host" ? t("hostProfileSideTitle") : t("guestProfileSideTitle");
      ui.profileSideText.textContent = state.role === "host" ? t("hostProfileSideText") : t("guestProfileSideText");
      ui.roomBadge.hidden = state.role !== "host";
      ui.roomBadge.style.display = state.role !== "host" ? "none" : "inline-flex";
      ui.joinCodeField.hidden = true;
      ui.joinCodeField.style.display = "none";
      ui.profilePlayers.innerHTML = renderPlayerRows(state.players);
      ui.profileSideCard.hidden = soloProfileStep;
      ui.profileSideCard.style.display = soloProfileStep ? "none" : "grid";
      ui.profileLayout.style.gridTemplateColumns = soloProfileStep ? "minmax(320px,520px)" : "minmax(320px,440px) minmax(0,1fr)";
      ui.profileLayout.style.justifyContent = soloProfileStep ? "center" : "stretch";
    }
    function renderLobbyScene(){ const notice = state.game.hostNotice || ""; ui.lobbyPlayers.innerHTML = renderPlayerRows(state.players); ui.btnToSetup.disabled = !hostCanContinue(); if(state.role === "host"){ ui.lobbyLayout.style.gridTemplateColumns = "minmax(320px,420px) minmax(0,1fr)"; ui.lobbyLayout.style.width = "min(1180px,100%)"; ui.lobbyLayout.style.justifyContent = "stretch"; ui.lobbySide.hidden = false; ui.lobbySide.style.display = "grid"; ui.lobbyTitle.textContent = t("preparingRoom"); ui.lobbyDesc.textContent = notice || t("lobbyDesc"); ui.btnToSetup.style.display = "inline-flex"; ui.lobbySide.innerHTML = `<span class="kicker">${t("room")}</span><h2 class="subtitle">${notice ? t("gameClosed") : t("allAlmostReady")}</h2><p>${notice ? esc(notice) : t("whenEveryoneReady")}</p><div class="codeBadge">${esc(state.roomCode)}</div>`; } else { ui.lobbyLayout.style.gridTemplateColumns = "minmax(320px,760px)"; ui.lobbyLayout.style.width = "min(760px,100%)"; ui.lobbyLayout.style.justifyContent = "center"; ui.lobbySide.hidden = true; ui.lobbySide.style.display = "none"; ui.lobbyTitle.textContent = t("waitingInRoom"); ui.lobbyDesc.textContent = notice || t("players"); ui.btnToSetup.style.display = "none"; } }
    function renderSetupCards(items, kind, current){ return items.map(item => {
      const title = t(item.titleKey || item.title || "");
      const desc = t(item.descKey || item.desc || "");
      return `<button class="modeCard ${current === item.id ? "active" : ""}" data-kind="${kind}" data-id="${item.id}"><div class="modeHead"><span class="modeIcon">${item.icon}</span></div><strong>${esc(title)}</strong><p>${esc(desc)}</p></button>`;
    }).join(""); }
    function renderSetupScene(){
      ui.modeGrid.innerHTML = renderSetupCards(MODES, "mode", state.game.selectedMode);
      ui.durationGrid.innerHTML = renderSetupCards(DURATIONS, "duration", state.game.selectedDuration);
      if(state.role === "host"){
        ui.setupDesc.textContent = t("setupDesc");
        ui.setupLayout.style.gridTemplateColumns = "minmax(320px,980px)";
        ui.setupLayout.style.width = "min(980px,100%)";
        ui.setupLayout.style.justifyContent = "center";
        ui.setupSide.hidden = true;
        ui.setupSide.style.display = "none";
        ui.setupActions.innerHTML = `<div class="field" style="min-width:180px"><label for="leadSecondsInput">${t("showQuestionAlone")}</label><input id="leadSecondsInput" type="number" min="0" max="30" value="${Number(state.game.questionLeadSeconds || 6)}"></div><div class="field" style="min-width:180px"><label for="answerSecondsInput">${t("answerSeconds")}</label><input id="answerSecondsInput" type="number" min="5" max="60" value="${Number(state.game.answerSeconds || 15)}"></div><button class="btn btnGhost" id="btnSetupBack" type="button">${t("back")}</button><button class="btn btnPrimary" id="btnStartRound" type="button" ${!(state.game.selectedMode && state.game.selectedDuration) ? "disabled" : ""}>${state.game.selectedMode === "custom" ? t("generateQuestions", {count: plannedQuestionCount()}) : t("startQuestions", {count: plannedQuestionCount()})}</button>`;
        $("leadSecondsInput").onchange = async ev => { state.game.questionLeadSeconds = Math.max(0, Math.min(30, Number(ev.target.value || 6))); await broadcastGame(); renderCurrentScene(); };
        $("answerSecondsInput").onchange = async ev => { state.game.answerSeconds = Math.max(5, Math.min(60, Number(ev.target.value || 15))); await broadcastGame(); renderCurrentScene(); };
        $("btnSetupBack").onclick = async () => { state.game.phase = "lobby"; await broadcastGame(); renderCurrentScene(); };
        $("btnStartRound").onclick = async () => {
          if(!(state.game.selectedMode && state.game.selectedDuration)) return;
          state.localAnswer = null;
          state.game.questionIndex = 0;
          state.game.questionSet = [];
          const targetLang = state.game.lang === "en" ? "en" : "es";
          if(state.game.selectedMode === "custom"){
            const amount = plannedQuestionCount();
            ui.setupActions.innerHTML = `<div class="countPill">${t("generatingQuestions", {count: amount})}</div>`;
            state.game.phase = "generating";
            await broadcastGame();
            renderCurrentScene();
            const difficulty = state.game.customConfig.difficulty === "media" ? "media-alta" : state.game.customConfig.difficulty;
            const { data, error } = await sb.functions.invoke("trivialodon-generate-question", { headers:{Authorization:`Bearer ${SUPABASE_KEY}`,apikey:SUPABASE_KEY}, body:{
              theme: state.game.customConfig.theme || "conocimiento general",
              tone: state.game.customConfig.tone || "divertido",
              difficulty,
              audience: "general",
              answerCount: 5,
              questionCount: amount,
              customPrompt: state.game.customConfig.customPrompt || "",
              language: targetLang
            }});
            const generated = data && Array.isArray(data.questions) ? data.questions : [];
            if(error || !generated.length){
              state.game.phase = "setup";
              ui.setupActions.innerHTML = `<div class="status danger">${t("couldNotPrepareQuestions")}</div>`;
              await broadcastGame();
              renderCurrentScene();
              return;
            }
            state.game.questionSet = shuffle(generated.map(item => item.type === "speed" ? ({type:"speed",prompt:item.question,choices:item.choices || [],explanation:item.explanation || "",category:item.category || "Personalizado"}) : ({prompt:item.question,answers:item.choices,correct:item.correct_index,explanation:item.explanation || "",category:item.category || "Personalizado"})));
          } else {
            const classicSet = buildMixedQuestionSet(plannedQuestionCount(), QUESTION_BANK);
            if(targetLang === "en"){
              const { data, error } = await sb.functions.invoke("trivialodon-generate-question", { headers:{Authorization:`Bearer ${SUPABASE_KEY}`,apikey:SUPABASE_KEY}, body:{
                mode:"translate",
                language:"en",
                answerCount:5,
                questionCount:classicSet.length,
                questions:classicSet.map(serializeQuestionForTranslation)
              }});
              const translated = data && Array.isArray(data.questions) ? data.questions : [];
              if(error || translated.length !== classicSet.length){
                state.game.phase = "setup";
                ui.setupActions.innerHTML = `<div class="status danger">${t("couldNotPrepareQuestions")}</div>`;
                await broadcastGame();
                renderCurrentScene();
                return;
              }
              state.game.questionSet = hydrateTranslatedQuestionSet(translated);
            } else {
              state.game.questionSet = classicSet;
            }
          }
          state.game.phase = "countdown";
          state.game.countdownEndAt = Date.now() + 4000;
          await broadcastGame();
          renderCurrentScene();
        };
      } else {
        ui.setupLayout.style.gridTemplateColumns = "minmax(320px,760px)";
        ui.setupLayout.style.width = "min(760px,100%)";
        ui.setupLayout.style.justifyContent = "center";
        ui.setupSide.hidden = true;
        ui.setupSide.style.display = "none";
        ui.setupDesc.textContent = t("hostConfiguring");
        ui.setupActions.innerHTML = ``;
      }
      [...ui.modeGrid.querySelectorAll("[data-kind]"), ...ui.durationGrid.querySelectorAll("[data-kind]")].forEach(btn => {
        btn.onclick = async () => {
          const kind = btn.dataset.kind;
          const id = btn.dataset.id;
          if(state.role === "host"){
            if(kind === "mode"){
              state.game.selectedMode = id;
              if(id === "custom"){
                ui.customThemeInput.value = state.game.customConfig.theme || "";
                syncChoiceGroup(ui.customToneChoices, "tone", state.game.customConfig.tone || "divertido");
                syncChoiceGroup(ui.customDifficultyChoices, "difficulty", state.game.customConfig.difficulty || "media");
                ui.customPromptInput.value = state.game.customConfig.customPrompt || "";
                ui.customModal.classList.add("on");
              }
            } else {
              state.game.selectedDuration = id;
              if(id === "timed"){
                ui.durationModalTitle.textContent = t("durationModalTitle");
                ui.durationMinutesField.style.display = "grid";
                ui.durationQuestionsField.style.display = "none";
                ui.durationMinutesInput.value = String(state.game.selectedDurationValue || 15);
                ui.durationModal.classList.add("on");
              } else if(id === "questions"){
                ui.durationModalTitle.textContent = t("durationModalTitle");
                ui.durationMinutesField.style.display = "none";
                ui.durationQuestionsField.style.display = "grid";
                ui.durationQuestionsInput.value = String(state.game.selectedDurationValue || 15);
                ui.durationModal.classList.add("on");
              } else {
                state.game.selectedDurationValue = 40;
              }
            }
            await broadcastGame();
            renderCurrentScene();
            return;
          }
        };
      });
    }
    function renderPausedScene(){ ui.pausedTitle.textContent = t("gamePaused"); ui.pausedCopy.textContent = state.role === "host" ? t("pausedHost") : t("pausedGuest"); ui.pausedActions.innerHTML = state.role === "host" ? `<button class="btn btnPrimary" id="btnResumeGame" type="button">${t("resume")}</button>` : ""; if(state.role === "host" && $("btnResumeGame")) $("btnResumeGame").onclick = async () => { state.game.phase = "countdown"; state.game.countdownEndAt = Date.now() + Math.max(1000, Number(state.game.pausedRemainingMs || 4000)); state.game.pausedRemainingMs = 0; await broadcastGame(); renderCurrentScene(); }; }
    function renderAnswerScene(){ const question = state.game.question; const choices = Array.isArray(question.choices) ? question.choices : []; ui.answerCorrect.textContent = choices[question.correct] || ""; ui.answerPrompt.textContent = question.prompt; }
    function renderScoresScene(){ const entries = scoreEntries(); const leader = entries[0]; const finished = !!state.game.finished; const myScore = Number((state.game.scores || {})[state.playerId] || 0); const win = leader && leader.playerId === state.playerId; const rows = entries.map((entry, index) => { const gain = Number((state.game.lastRoundScores || {})[entry.playerId] || 0); return `<article class="scoreRow"><div class="rankAvatar">${entry.avatarSrc ? `<img src="${entry.avatarSrc}" alt="">` : "\uD83E\uDD96"}</div><div class="sceneStack" style="gap:4px"><strong>#${index + 1} ${esc(entry.name)}</strong><span class="playerSub">${index === 0 ? t("currentLeader") : t("inRace")}</span></div><div class="scoreValueWrap">${gain > 0 ? `<span class="scoreDelta">+${gain}</span><span class="scoreGlitter">✦</span>` : ""}<strong>${entry.score}</strong></div></article>`; }).join("") || `<p>${t("noScoresYet")}</p>`; if(finished){ ui.scoresTitle.textContent = win ? t("victory") : t("defeat"); ui.scoresLead.textContent = win ? t("championText", {score: myScore}) : t("defeatText"); } else { ui.scoresTitle.textContent = leader ? t("leadsGame", {name: leader.name}) : t("scoreRound"); ui.scoresLead.textContent = leader ? t("accumulatedPoints", {score: leader.score}) : t("noScoresYet"); } ui.scoresRows.innerHTML = rows; ui.scoreModalRows.innerHTML = rows; const showButtons = finished && state.game.finishedAt && Date.now() - state.game.finishedAt >= 2000; ui.finalActions.innerHTML = showButtons ? `<button class="btn btnOk" id="btnContinueGame" type="button">${t("continueSession")}</button><button class="btn btnGhost" id="btnNewGame" type="button">${t("newSession")}</button>` : ""; if(showButtons){ $("btnContinueGame").onclick = async () => { if(state.role !== "host") return; resetGameToSetup(false); await broadcastGame(); renderCurrentScene(); }; $("btnNewGame").onclick = async () => { if(state.role !== "host") return; resetGameToSetup(true); await broadcastGame(); renderCurrentScene(); }; } }
    function renderVersusPlayerCard(playerId, activeId, visibleChoiceId){
      const player = findPlayer(playerId);
      const choice = visibleChoiceId ? versusMoveById(visibleChoiceId) : null;
      const waitingText = playerId === state.playerId ? t("waitingForYourMark") : t("hiddenChoice");
      const choiceLabel = choice ? versusMoveLabel(choice) : "";
      return `<div class="versusAvatar">${player?.avatarSrc ? `<img src="${player.avatarSrc}" alt="">` : "🦖"}</div><strong class="versusPlayerName">${esc(player?.name || t("player"))}</strong><span class="versusPlayerSub">${playerId === state.playerId ? t("yourDuel") : t("inDuel")}</span><div class="versusChoice">${choice ? `${choice.glyph} ${esc(choiceLabel)}` : (activeId === playerId ? t("markNow") : waitingText)}</div>`;
    }
    function renderVersusIntroScene(){
      const versus = state.game.versus || {};
      const names = (versus.pair || []).map(playerId => findPlayer(playerId)?.name).filter(Boolean);
      ui.versusIntroLead.textContent = t("tiebreakLead");
      ui.versusIntroNames.innerHTML = names.map(name => `<span class="versusPill">${esc(name)}</span>`).join("");
      ui.versusIntroCopy.textContent = t("tiebreakCopy");
      ui.versusIntroCount.textContent = String(Math.max(0, Math.ceil((Number(versus.introEndsAt || 0) - sharedNow()) / 1000)));
    }
    function renderVersusScene(){
      const versus = state.game.versus || {};
      const [playerA, playerB] = versus.pair || [];
      const contenderIds = [playerA, playerB].filter(Boolean);
      const isContender = contenderIds.includes(state.playerId);
      const now = sharedNow();
      const revealActive = Number(versus.revealUntil || 0) > now;
      const canPick = isContender && !versus.finalWinnerId && !revealActive && now < Number(versus.roundDeadline || 0);
      const countdown = Math.max(0, Math.ceil((Number(versus.roundDeadline || 0) - now) / 1000));
      const neededWins = Math.ceil(Number(versus.bestOf || 3) / 2);
      const winsA = Number(versus.wins?.[playerA] || 0);
      const winsB = Number(versus.wins?.[playerB] || 0);
      const playerAData = findPlayer(playerA);
      const playerBData = findPlayer(playerB);
      const championId = versus.finalWinnerId || "";
      const champion = championId ? findPlayer(championId) : null;
      const ownChoiceA = playerA === state.playerId ? ((versus.choices || {})[playerA] || "") : "";
      const ownChoiceB = playerB === state.playerId ? ((versus.choices || {})[playerB] || "") : "";
      const visibleChoiceA = (revealActive || versus.finalWinnerId || versus.roundWinnerId) ? ((versus.revealChoices || {})[playerA] || "") : ownChoiceA;
      const visibleChoiceB = (revealActive || versus.finalWinnerId || versus.roundWinnerId) ? ((versus.revealChoices || {})[playerB] || "") : ownChoiceB;
      ui.versusLead.textContent = t("tiebreakLead");
      ui.versusRoundBadge.textContent = versus.finalWinnerId ? t("duelResolved") : ((winsA === neededWins - 1 && winsB === neededWins - 1) ? t("decisiveRound") : t("versusRound", {round: Number(versus.roundNumber || 1)}));
      const handMoveA = visibleChoiceA || "rock";
      const handMoveB = visibleChoiceB || "rock";
      ui.versusHandA.dataset.move = handMoveA;
      ui.versusHandB.dataset.move = handMoveB;
      ui.versusHandA.className = `versusHand ${(revealActive || versus.finalWinnerId || versus.roundWinnerId) ? "revealed" : (ownChoiceA ? "locked" : "")}`;
      ui.versusHandB.className = `versusHand right ${(revealActive || versus.finalWinnerId || versus.roundWinnerId) ? "revealed" : (ownChoiceB ? "locked" : "")}`;
      ui.versusPlayerA.className = `versusPlayer ${versus.roundWinnerId === playerA ? "active" : ""} ${championId === playerA ? "champion" : ""}`;
      ui.versusPlayerB.className = `versusPlayer ${versus.roundWinnerId === playerB ? "active" : ""} ${championId === playerB ? "champion" : ""}`;
      ui.versusBurst.className = `versusBurst ${championId ? "champion" : ""}`;
      ui.versusChampionFx.className = `versusChampionFx ${championId ? "on" : ""}`;
      ui.versusChampionText.textContent = champion ? t("versusChampionTitle", {name: champion.name}) : t("victory");
      ui.versusPlayerA.innerHTML = renderVersusPlayerCard(playerA, canPick ? state.playerId : "", visibleChoiceA);
      ui.versusPlayerB.innerHTML = renderVersusPlayerCard(playerB, canPick ? state.playerId : "", visibleChoiceB);
      ui.versusScoreline.innerHTML = contenderIds.map(playerId => {
        const player = findPlayer(playerId);
        const wins = Number(versus.wins?.[playerId] || 0);
        const target = "●".repeat(wins) + "○".repeat(Math.max(0, neededWins - wins));
        return `<span class="versusPill">${esc(player?.name || t("player"))} <strong>${wins}</strong> <span>${target}</span></span>`;
      }).join("") || `<span class="versusPill">${t("bestOfThree")}</span>`;
      ui.versusTimer.textContent = String(countdown);
      if(versus.finalWinnerId){
        const winner = findPlayer(versus.finalWinnerId);
        ui.versusRoundCopy.textContent = t("finalVsWinner", {name: winner?.name || t("winner"), points: VERSUS_BONUS_POINTS});
      } else if(revealActive && !versus.roundWinnerId){
        ui.versusRoundCopy.textContent = t("drawHands");
      } else if(versus.roundWinnerId){
        const winner = findPlayer(versus.roundWinnerId);
        ui.versusRoundCopy.textContent = t("roundWinner", {name: winner?.name || t("winner")});
      } else if(countdown === 0){
        ui.versusRoundCopy.textContent = t("timeResolving");
      } else if(isContender){
        ui.versusRoundCopy.textContent = t("haveSecondsToMark");
      } else {
        ui.versusRoundCopy.textContent = t("onlyDuelists");
      }
      ui.versusButtons.innerHTML = canPick ? VERSUS_MOVES.map(move => {
        const mine = (versus.choices || {})[state.playerId] === move.id;
        const winningMove = versus.roundWinnerId && Object.entries(versus.revealChoices || {}).some(([playerId, value]) => playerId === versus.roundWinnerId && value === move.id);
        return `<button class="versusMove ${mine ? "active" : ""} ${winningMove ? "win" : ""}" data-versus-move="${move.id}" type="button"><span class="versusGlyph">${move.glyph}</span><strong>${move.label}</strong></button>`;
      }).join("") : "";
      ui.versusButtons.querySelectorAll("[data-versus-move]").forEach(btn => {
        btn.onclick = async () => {
          if(!canPick) return;
          const move = btn.dataset.versusMove;
          if(!move) return;
          state.game.versus.choices[state.playerId] = move;
          if(state.role === "host"){
            await broadcastGame();
          } else {
            await state.channel.send({type:"broadcast",event:"guest_versus_choice",payload:{playerId:state.playerId,move}});
          }
          renderCurrentScene();
        };
      });
    }
    function renderGeneratingScene(){ const lines = GENERATING_LINES[currentLang] || GENERATING_LINES.es; const line = lines[Math.floor(Date.now() / 3200) % lines.length]; ui.generatingLine.textContent = line; }
    function showScene(name){ Object.entries(ui.scenes).forEach(([key,node]) => node.classList.toggle("on", key === name)); }
    function currentScene(){ if(state.role === "guest" && !state.roomCode) return "join"; if(!state.ready) return "profile"; if(state.game.phase === "lobby") return "lobby"; if(state.game.phase === "setup") return state.role === "host" ? "setup" : "lobby"; if(state.game.phase === "generating") return "generating"; if(state.game.phase === "paused") return "paused"; if(state.game.phase === "countdown") return "countdown"; if(state.game.phase === "question" || state.game.phase === "answer") return "question"; if(state.game.phase === "scores") return "scores"; if(state.game.phase === "versus_intro") return "versusIntro"; if(state.game.phase === "versus") return "versus"; return "lobby"; }
    function renderCurrentScene(){ updateIdentity(); renderProfileScene(); renderLobbyScene(); renderSetupScene(); renderGeneratingScene(); renderPausedScene(); renderCountdownScene(); if(state.game.question) renderQuestionScene(); renderScoresScene(); renderVersusIntroScene(); renderVersusScene(); saveSession(); showScene(currentScene()); syncAudio(); syncCastSession(); }
    async function updatePresence(){ if(!state.channel) return; await state.channel.track({playerId:state.playerId,role:state.role,ready:state.ready,name:state.name,waitingLine:state.waitingLine,avatarSrc:state.ready ? (state.avatar.rendered || state.avatar.src) : "",updatedAt:Date.now()}); }
    async function broadcastGame(){ if(state.role !== "host" || !state.channel) return; await state.channel.send({type:"broadcast",event:"game_state",payload:{...state.game,__hostNow:Date.now()}}); }
    function syncPlayers(){ if(!state.channel) return; const raw = []; Object.values(state.channel.presenceState()).forEach(entries => (entries || []).forEach(entry => raw.push(entry))); state.players = dedupePlayers(raw); renderCurrentScene(); }
    async function connectRoom(role, code, options = {}){ if(state.channel){ try{ await sb.removeChannel(state.channel); } catch(_){} } const keepName = state.name; const keepAvatar = {...state.avatar}; const keepReady = !!state.ready; const keepGame = options.keepGame ? state.game : null; state.role = role; state.roomCode = code; state.ready = options.keepReady ? keepReady : false; state.waitingLine = lineFor(state.playerId); state.localAnswer = null; state.name = keepName; state.avatar = keepAvatar; state.game = keepGame || gameDefaults(); if(state.game?.lang === "es" || state.game?.lang === "en") applyCurrentLanguage(state.game.lang, true); if(role === "host") clockOffsetMs = 0; applyAvatar(); const channel = sb.channel(`trivialodon:session:${code}`, {config:{broadcast:{self:true},presence:{key:state.playerId}}}); state.channel = channel; channel.on("presence",{event:"sync"},syncPlayers).on("broadcast",{event:"game_state"},({payload}) => { if(!payload) return; syncClock(payload.__hostNow); const nextGame = {...payload}; delete nextGame.__hostNow; if(!["question","answer"].includes(nextGame.phase)) state.localAnswer = null; if(nextGame.phase === "question" && state.game.question && nextGame.question && nextGame.question.endAt !== state.game.question.endAt) state.localAnswer = null; state.game = {...gameDefaults(), ...nextGame}; if(state.game?.lang === "es" || state.game?.lang === "en") applyCurrentLanguage(state.game.lang, true); renderCurrentScene(); }).on("broadcast",{event:"request_state"},async () => { if(state.role !== "host") return; await broadcastGame(); }).on("broadcast",{event:"guest_answer"},({payload}) => { if(state.role !== "host" || !state.game.question || !payload) return; state.game.question.responses[payload.playerId] = {answerIndex:payload.answerIndex,answeredAt:payload.answeredAt || Date.now()}; broadcastGame(); renderCurrentScene(); }).on("broadcast",{event:"guest_versus_choice"},({payload}) => { if(state.role !== "host" || !state.game.versus || !payload) return; if(!(state.game.versus.pair || []).includes(payload.playerId)) return; state.game.versus.choices[payload.playerId] = payload.move || ""; broadcastGame(); renderCurrentScene(); }); await new Promise(resolve => { channel.subscribe(async status => { if(status === "SUBSCRIBED"){ await updatePresence(); syncPlayers(); if(role !== "host"){ await channel.send({type:"broadcast",event:"request_state",payload:{playerId:state.playerId,requestedAt:Date.now()}}); } if(!options.silentStatus) setStatus("","info"); if(role === "host" && !options.keepGame){ setTimeout(async () => { if(state.players.some(player => player.role === "host" && player.playerId !== state.playerId)) await connectRoom("host", roomCode()); }, 280); } resolve(status); } else if(status === "CHANNEL_ERROR" || status === "TIMED_OUT"){ setStatus("No he podido abrir la sala realtime en Supabase.","danger"); resolve(status); } }); }); }
    function sampleStandardQuestion(){
      const picked = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)] || QUESTION_BANK[0];
      return {...prepareQuestion(picked), responses:{}, revealed:false};
    }
    function sampleSpeedQuestion(){
      const picked = SPEED_QUESTION_BANK[Math.floor(Math.random() * SPEED_QUESTION_BANK.length)] || SPEED_QUESTION_BANK[0];
      return {...prepareQuestion(picked), responses:{}, revealed:false};
    }
    function debugPlayers(){
      return state.players.filter(player => player.ready);
    }
    function debugScores(){
      const scores = {};
      debugPlayers().forEach((player, index) => {
        scores[player.playerId] = Math.max(0, 240 - index * 40);
      });
      return scores;
    }
    function debugResponses(question, speed){
      const players = debugPlayers();
      const responses = {};
      if(!players.length) return responses;
      if(speed){
        players.slice(0, Math.min(players.length, question.choices.length)).forEach((player, index) => {
          responses[player.playerId] = {answerIndex:index, answeredAt:Date.now() - (index * 420)};
        });
        return responses;
      }
      players.slice(0, Math.min(players.length, 3)).forEach((player, index) => {
        const answerIndex = index === 0 ? question.correct : Math.min(question.choices.length - 1, (question.correct + index) % question.choices.length);
        responses[player.playerId] = {answerIndex, answeredAt:Date.now() - (index * 380)};
      });
      return responses;
    }
    function debugRequireHost(){
      if(state.role !== "host" || !state.channel) throw new Error("Abre la consola en el anfitrion, con una sala ya conectada.");
    }
    async function debugPush(gamePatch){
      debugRequireHost();
      state.localAnswer = null;
      state.game = {
        ...state.game,
        ...gamePatch
      };
      await broadcastGame();
      renderCurrentScene();
      return state.game;
    }
    function debugQuestionBase(speed = false){
      const base = speed ? sampleSpeedQuestion() : sampleStandardQuestion();
      const choices = Array.isArray(base.choices) ? base.choices : [];
      return {
        ...base,
        choices:[...choices],
        responses:{},
        revealed:false,
        endAt:0,
        answersVisibleAt:0
      };
    }
    async function debugPhaseLobby(){
      return debugPush({
        phase:"lobby",
        question:null,
        lastRoundScores:{}
      });
    }
    async function debugPhaseSetup(){
      return debugPush({
        phase:"setup",
        selectedMode:"classic",
        selectedDuration:"questions",
        selectedDurationValue:15,
        question:null
      });
    }
    async function debugPhaseGenerating(){
      return debugPush({
        phase:"generating",
        question:null
      });
    }
    async function debugPhasePaused(){
      return debugPush({
        phase:"paused",
        pausedRemainingMs:4000
      });
    }
    async function debugPhaseCountdown(opts = {}){
      const speed = !!opts.speed;
      const seconds = Math.max(1, Number(opts.seconds || 4));
      const question = debugQuestionBase(speed);
      return debugPush({
        phase:"countdown",
        question:null,
        questionSet:[question],
        questionIndex:0,
        countdownEndAt:Date.now() + (seconds * 1000)
      });
    }
    async function debugPhaseQuestionLead(opts = {}){
      const speed = !!opts.speed;
      const leadSeconds = Math.max(1, Number(opts.seconds || state.game.questionLeadSeconds || 6));
      const answerSeconds = Math.max(5, Number(opts.answerSeconds || state.game.answerSeconds || 15));
      const question = debugQuestionBase(speed);
      question.answersVisibleAt = Date.now() + (leadSeconds * 1000);
      question.endAt = question.answersVisibleAt + (answerSeconds * 1000);
      return debugPush({
        phase:"question",
        questionLeadSeconds:leadSeconds,
        answerSeconds,
        question,
        questionSet:[question],
        questionIndex:0
      });
    }
    async function debugPhaseQuestionAnswers(opts = {}){
      const speed = !!opts.speed;
      const answerSeconds = Math.max(5, Number(opts.seconds || state.game.answerSeconds || 15));
      const question = debugQuestionBase(speed);
      question.answersVisibleAt = Date.now() - 500;
      question.endAt = Date.now() + (answerSeconds * 1000);
      question.responses = debugResponses(question, speed && !!opts.withLocks);
      return debugPush({
        phase:"question",
        questionLeadSeconds:Math.max(1, Number(state.game.questionLeadSeconds || 6)),
        answerSeconds,
        question,
        questionSet:[question],
        questionIndex:0
      });
    }
    async function debugPhaseAnswer(opts = {}){
      const speed = !!opts.speed;
      const question = debugQuestionBase(speed);
      question.answersVisibleAt = Date.now() - 6000;
      question.endAt = Date.now() - 1000;
      question.responses = debugResponses(question, speed);
      question.revealed = true;
      return debugPush({
        phase:"answer",
        question,
        questionSet:[question],
        questionIndex:0,
        answerShownAt:Date.now()
      });
    }
    async function debugPhaseScores(opts = {}){
      const finished = !!opts.finished;
      const scores = debugScores();
      const players = debugPlayers();
      const lastRoundScores = {};
      players.forEach((player, index) => {
        lastRoundScores[player.playerId] = Math.max(0, 110 - index * 10);
      });
      return debugPush({
        phase:"scores",
        scores,
        lastRoundScores,
        finished,
        finishedAt:finished ? Date.now() : 0,
        scoresShownAt:Date.now()
      });
    }
    async function debugResetRound(){
      return debugPush({
        phase:"setup",
        finished:false,
        finishedAt:0,
        question:null,
        questionIndex:0,
        lastRoundScores:{},
        selectedMode:"classic",
        selectedDuration:"questions",
        selectedDurationValue:15
      });
    }
    const debugApi = {
      list(){
        const items = [
          {command:"td.lobby()", desc:"Lobby / esperando en sala"},
          {command:"td.setup()", desc:"Setup del anfitrion"},
          {command:"td.generating()", desc:"Pantalla generando preguntas"},
          {command:"td.paused()", desc:"Juego pausado"},
          {command:"td.countdown()", desc:"Cuenta atras normal"},
          {command:"td.countdown({ speed:true })", desc:"Cuenta atras de Modo Velociraptor!"},
          {command:"td.questionLead()", desc:"Pregunta sola antes de mostrar respuestas"},
          {command:"td.questionLead({ speed:true })", desc:"Pregunta sola para speed test"},
          {command:"td.question()", desc:"Pregunta con respuestas visibles"},
          {command:"td.question({ speed:true, withLocks:true })", desc:"Pregunta speed con bloqueos en vivo"},
          {command:"td.answer()", desc:"Respuesta revelada con correcta y fun fact"},
          {command:"td.answer({ speed:true })", desc:"Respuesta revelada de speed test"},
          {command:"td.scores()", desc:"Marcador entre preguntas"},
          {command:"td.finished()", desc:"Podio final / fin de partida"},
          {command:"td.reset()", desc:"Vuelve a setup limpio"},
          {command:"td.state()", desc:"Devuelve el game_state actual"}
        ];
        console.table(items);
        return items;
      },
      help(){
        return this.list();
      },
      state(){
        return structuredClone(state.game);
      },
      lobby:() => debugPhaseLobby(),
      setup:() => debugPhaseSetup(),
      generating:() => debugPhaseGenerating(),
      paused:() => debugPhasePaused(),
      countdown:(opts = {}) => debugPhaseCountdown(opts),
      questionLead:(opts = {}) => debugPhaseQuestionLead(opts),
      question:(opts = {}) => debugPhaseQuestionAnswers(opts),
      answer:(opts = {}) => debugPhaseAnswer(opts),
      scores:() => debugPhaseScores({finished:false}),
      finished:() => debugPhaseScores({finished:true}),
      reset:() => debugResetRound()
    };
    window.trivialodonDebug = debugApi;
    window.td = debugApi;
    function showShell(){ ui.introScene.classList.remove("on"); ui.introScene.classList.add("off"); ui.shell.classList.add("on"); }
    function resetDraft(){ state.name = ""; state.ready = false; state.roomCode = ""; state.localAnswer = null; state.avatarIndex = 0; state.avatar = {kind:"preset",src:AVATAR_OPTIONS[0].src,rendered:AVATAR_OPTIONS[0].src,avatarId:AVATAR_OPTIONS[0].id}; ui.nameInput.value = ""; if(ui.joinCodeOnlyInput) ui.joinCodeOnlyInput.value = ""; ui.joinCodeInput.value = ""; applyAvatar(); setStatus("","info"); if(ui.joinStatus) ui.joinStatus.textContent = t("joinHint"); }
      const closeOverlays = () => {
        ui.soundWrap.classList.remove("open");
        ui.menuWrap.classList.remove("open");
      };
      ui.menuBtn.onclick = ev => {
        ev.stopPropagation();
        const willOpen = !ui.menuWrap.classList.contains("open");
        closeOverlays();
        if(willOpen) ui.menuWrap.classList.add("open");
      };
      ui.soundChip.onclick = ev => {
        ev.stopPropagation();
        const willOpen = !ui.soundWrap.classList.contains("open");
        closeOverlays();
        if(willOpen) ui.soundWrap.classList.add("open");
      };
      if(ui.soundPanel){
        ["click","pointerdown","touchstart"].forEach(eventName => ui.soundPanel.addEventListener(eventName, ev => ev.stopPropagation(), {passive:eventName === "touchstart"}));
      }
      const menuDrop = ui.menuWrap ? ui.menuWrap.querySelector(".menuDrop") : null;
      if(menuDrop){
        ["click","pointerdown","touchstart"].forEach(eventName => menuDrop.addEventListener(eventName, ev => ev.stopPropagation(), {passive:eventName === "touchstart"}));
      }
      ui.identity.onclick = () => { renderScoresScene(); ui.scoreModal.classList.add("on"); };
    ui.btnToggleMute.onclick = ev => {
      ev.stopPropagation();
      if(audioState.muted){
        setMuted(false);
        ensureAudioReady();
      } else {
        setMuted(true);
      }
    };
    ui.soundVolumeInput.oninput = ev => {
      setVolume(Number(ev.target.value || 0) / 100);
      if(!audioState.muted) ensureAudioReady();
    };
    ui.btnCloseScore.onclick = () => ui.scoreModal.classList.remove("on");
    ui.btnCastConnect.onclick = async () => { await connectCast(); };
    ui.btnCastDisconnect.onclick = () => { disconnectCast(); };
    ui.btnCastMute.onclick = async () => {
      const ok = await setCastMuted(!castState.muted);
      if(!ok) setCastStatus(t("castMuteError"), "danger");
    };
    ui.castVolumeInput.oninput = async ev => {
      const ok = await setCastVolume(Math.max(0, Math.min(1, Number(ev.target.value || 0) / 100)));
      if(!ok) setCastStatus(t("castVolumeError"), "danger");
    };
    ui.btnResumeContinue.onclick = () => hideResumeModal();
    ui.btnResumeNew.onclick = () => startFreshFromMenu();
    ui.btnEndGame.onclick = async () => { ui.soundWrap.classList.remove("open"); await terminateGameByHost(); };
    ui.btnExitGame.onclick = () => { ui.soundWrap.classList.remove("open"); startFreshFromMenu(); };
    ui.btnCloseDuration.onclick = () => ui.durationModal.classList.remove("on");
    ui.btnAcceptDuration.onclick = async () => {
      if(state.game.selectedDuration === "timed") state.game.selectedDurationValue = Math.max(5, Number(ui.durationMinutesInput.value || 15));
      if(state.game.selectedDuration === "questions") state.game.selectedDurationValue = Math.max(5, Number(ui.durationQuestionsInput.value || 15));
      ui.durationModal.classList.remove("on");
      await broadcastGame();
      renderCurrentScene();
    };
    ui.btnCloseCustom.onclick = () => ui.customModal.classList.remove("on");
    ui.btnAcceptCustom.onclick = async () => {
      state.game.customConfig.theme = ui.customThemeInput.value.trim();
      state.game.customConfig.customPrompt = ui.customPromptInput.value.trim();
      ui.customModal.classList.remove("on");
      await broadcastGame();
      renderCurrentScene();
    };
    ui.customToneChoices.querySelectorAll("[data-tone]").forEach(btn => btn.onclick = () => { state.game.customConfig.tone = btn.dataset.tone; syncChoiceGroup(ui.customToneChoices, "tone", state.game.customConfig.tone); });
    ui.customDifficultyChoices.querySelectorAll("[data-difficulty]").forEach(btn => btn.onclick = () => { state.game.customConfig.difficulty = btn.dataset.difficulty; syncChoiceGroup(ui.customDifficultyChoices, "difficulty", state.game.customConfig.difficulty); });
      ["click","touchstart"].forEach(eventName => {
        document.addEventListener(eventName, ev => {
          if(!ui.menuWrap.contains(ev.target)) ui.menuWrap.classList.remove("open");
          if(!ui.soundWrap.contains(ev.target)) ui.soundWrap.classList.remove("open");
        }, {passive:eventName === "touchstart"});
      });
    ["click","touchstart","keydown"].forEach(eventName => window.addEventListener(eventName, primeAudio, {once:true, passive:eventName !== "keydown"}));
    ui.langEsIntro.onclick = () => setLanguage("es");
    ui.langEnIntro.onclick = () => setLanguage("en");
    ui.langEs.onclick = () => setLanguage("es");
    ui.langEn.onclick = () => setLanguage("en");
    ui.btnHost.onclick = async () => { resetDraft(); showShell(); state.role = "host"; renderCurrentScene(); ensureAudioReady(); await connectRoom("host", roomCode()); renderCurrentScene(); };
    ui.btnGuest.onclick = async () => { resetDraft(); showShell(); state.role = "guest"; renderCurrentScene(); ensureAudioReady(); renderCurrentScene(); };
    ui.btnContinue.onclick = async () => { ensureAudioReady(); const ok = await restoreSavedSession(readSession()); if(!ok) location.reload(); };
    ui.btnJoinBack.onclick = () => location.reload();
    ui.btnJoinNext.onclick = async () => { const code = normalize(ui.joinCodeOnlyInput.value); if(code.length !== 4){ ui.joinStatus.textContent = t("joinHint"); return; } ui.joinStatus.textContent = t("enteringRoom"); ensureAudioReady(); await connectRoom("guest", code); renderCurrentScene(); };
    ui.joinCodeOnlyInput.addEventListener("keydown", ev => { if(ev.key === "Enter"){ ev.preventDefault(); ui.btnJoinNext.click(); } });
    ui.btnBack.onclick = () => location.reload();
    ui.btnAvatarPrev.onclick = () => { shiftAvatar(-1); setStatus("","info"); };
    ui.btnAvatarNext.onclick = () => { shiftAvatar(1); setStatus("","info"); };
    ui.btnReady.onclick = async () => { ensureAudioReady(); const name = ui.nameInput.value.trim(); if(!name){ setStatus(t("yourName") + " " + t("required"), "danger"); return; } if(!(state.avatar.rendered || state.avatar.src)){ setStatus(t("chooseAvatar"), "danger"); return; } state.name = name; state.ready = true; await updatePresence(); syncPlayers(); setStatus("","info"); renderCurrentScene(); };
    ui.btnToSetup.onclick = async () => { if(!hostCanContinue() || state.role !== "host") return; state.game.phase = "setup"; state.game.selectedMode = ""; state.game.selectedDuration = ""; state.game.selectedDurationValue = 15; state.game.questionIndex = 0; state.game.questionSet = []; state.game.questionLeadSeconds = 6; state.game.answerSeconds = 15; state.game.lastRoundScores = {}; state.game.tieTracker = {streak:0,pair:[]}; state.game.versus = null; state.game.hostNotice = ""; await broadcastGame(); renderCurrentScene(); };
    function renderCountdownScene(){ const now = sharedNow(); const left = state.game.countdownEndAt ? Math.max(1, Math.ceil((state.game.countdownEndAt - now) / 1000)) : 4; const next = activeQuestionSet()[state.game.questionIndex || 0]; const categoryLabel = next?.type === "speed" ? `${t("speedMode")} · ${translateCategory(next?.category || t("surpriseCategory"))}` : translateCategory(next?.category || t("surpriseCategory")); const art = categoryArtFor(next?.category || ""); ui.countdownCategory.textContent = categoryLabel; if(ui.countdownCategoryArt){ ui.countdownCategoryArt.src = art.src; ui.countdownCategoryArt.alt = translateCategory(next?.category || t("surpriseCategory")); ui.countdownCategoryArt.hidden = false; } ui.countdownValue.textContent = String(left); ui.countdownActions.innerHTML = state.role === "host" ? `<button class="btn btnGhost" id="btnPauseGame" type="button">${t("pause")}</button>` : ""; if(state.role === "host" && $("btnPauseGame")) $("btnPauseGame").onclick = async () => { const remaining = Math.max(1000, (state.game.countdownEndAt || Date.now()) - Date.now()); state.game.pausedRemainingMs = remaining; state.game.phase = "paused"; await broadcastGame(); renderCurrentScene(); }; }
    function renderQuestionScene(){
      const now = sharedNow();
      const question = state.game.question || {prompt:"",choices:[],correct:0,endAt:now,revealed:false,responses:{}};
      const choices = Array.isArray(question.choices) ? question.choices : [];
      const answersVisible = !question.answersVisibleAt || now >= question.answersVisibleAt;
      const left = answersVisible ? Math.max(0, Math.ceil((question.endAt - now) / 1000)) : Math.max(0, Math.ceil((question.answersVisibleAt - now) / 1000));
      const total = answersVisible ? Math.max(1, Number(state.game.answerSeconds || 15)) : Math.max(1, Number(state.game.questionLeadSeconds || 6));
      const progress = Math.max(0, Math.min(1, left / total));
      const isSpeed = question.type === "speed";
      const wasCorrect = isSpeed ? question.scores?.[state.localAnswer] > 0 : state.localAnswer === question.correct;
      const art = categoryArtFor(question.category || "");
      const promptText = String(question.prompt || "").trim();
      const promptLength = promptText.length;
      const promptWordCount = promptText ? promptText.split(/\s+/).length : 0;
      const longestChoice = choices.reduce((max, item) => Math.max(max, String(item || "").trim().length), 0);
      const totalChoiceChars = choices.reduce((sum, item) => sum + String(item || "").trim().length, 0);
      const canUseTwoCols = answersVisible
        && choices.length >= 4
        && longestChoice <= 22
        && totalChoiceChars <= 88;

      ui.questionPrompt.textContent = question.prompt;
      ui.questionPrompt.classList.remove("compact", "tight", "ultraTight");
      if(promptLength > 72 || promptWordCount > 12) ui.questionPrompt.classList.add("compact");
      if(promptLength > 112 || promptWordCount > 18) ui.questionPrompt.classList.add("tight");
      if(promptLength > 148 || promptWordCount > 24) ui.questionPrompt.classList.add("ultraTight");

      ui.questionCopy.textContent = question.revealed
        ? (isSpeed ? t("timeUpSpeed") : t("timeUp"))
        : (answersVisible
          ? (isSpeed ? t("speedReadyInfo") : (state.role === "host" ? t("questionProgress", {current:String((state.game.questionIndex || 0) + 1), total:String(activeQuestionSet().length)}) : t("questionLead")))
          : (isSpeed ? t("speedCountdownNotice") : t("questionLead")));
      ui.questionTimer.textContent = String(left);
      ui.questionTimerRing.style.setProperty("--timer", progress);
      ui.questionAnswers.classList.toggle("twoCols", canUseTwoCols);

      if(!answersVisible){
        ui.questionAnswers.innerHTML = `<div class="categoryLead"><img class="categoryArt" src="${art.src}" alt="${esc(translateCategory(question.category || t("surpriseCategory")))}"><article class="answerCard" style="text-align:left"><div class="categoryLeadText"><span class="kicker">${t("category")}</span><span class="answerText">${esc(translateCategory(question.category || t("surpriseCategory")))}</span><span class="answerState" style="justify-self:start">${isSpeed ? t("preparingVelociraptor") : t("preparingAnswers")}</span></div></article></div>`;
        return;
      }

      const taken = {};
      Object.entries(question.responses || {}).forEach(([playerId,response]) => {
        if(Number.isInteger(Number(response?.answerIndex))) taken[Number(response.answerIndex)] = playerId;
      });

      const cards = choices.map((answer, index) => {
        const revealCorrect = !isSpeed && question.revealed && question.correct === index;
        const revealWrong = !isSpeed && question.revealed && state.localAnswer === index && state.localAnswer !== question.correct;
        const sparkle = !isSpeed && question.revealed && wasCorrect && revealCorrect;
        const lockedBy = taken[index] && taken[index] !== state.playerId;
        const mineLocked = taken[index] && taken[index] === state.playerId;
        const speedScore = isSpeed && question.revealed ? Number(question.scores?.[index] || 0) : null;
        const speedRank = isSpeed && question.revealed ? Number(question.ranking?.find(item => item.text === answer)?.rank || 0) : 0;
        return `<button class="answerCard ${state.localAnswer === index ? "active" : ""} ${revealCorrect ? "correct" : ""} ${revealWrong ? "wrong" : ""} ${sparkle ? "sparkle" : ""} ${isSpeed && speedScore > 0 ? "correct" : ""} ${isSpeed && question.revealed && speedScore === 0 ? "wrong" : ""}" data-answer="${index}" ${(question.revealed || left === 0 || (isSpeed && (lockedBy || mineLocked))) ? "disabled" : ""}><span class="answerText"><span class="answerKey">${String.fromCharCode(65 + index)}</span> ${esc(answer)}</span><span class="answerState">${isSpeed ? (question.revealed ? `${speedRank ? `#${speedRank}` : ""} ${speedScore} ${t("pointsShort")}` : (mineLocked ? t("yourAnswer") : (lockedBy ? t("locked") : t("pick")))) : (revealCorrect ? t("correct") : (revealWrong ? t("yourAnswer") : (state.localAnswer === index ? t("selected") : t("chooseAnswer"))))}</span></button>`;
      }).join("");

      const ranking = isSpeed && question.revealed
        ? `<article class="factCard">${wasCorrect ? `<div class="sparkles">✦ ✨ ★ ✨ ✦</div>` : ""}<span class="kicker">${t("correctOrder")}</span><strong>${esc(translateCategory(question.category || t("speedMode")))}</strong><p>${(question.ranking || []).map(item => `${item.rank}. ${item.text} (${item.score} ${t("pointsShort")})`).join(" · ")}</p></article>`
        : (question.revealed ? `<article class="factCard">${wasCorrect ? `<div class="sparkles">✦ ✨ ★ ✨ ✦</div>` : ""}<span class="kicker">${t("funFact")}</span><strong>${esc(choices[question.correct] || "")}</strong><p>${esc(fallbackFact(question)).split(/\s+/).slice(0,42).join(" ")}</p></article>` : "");

      ui.questionAnswers.innerHTML = ranking + cards;
      ui.questionAnswers.querySelectorAll("[data-answer]").forEach(btn => {
        btn.onclick = async () => {
          const answerIndex = Number(btn.dataset.answer);
          const answeredAt = sharedNow();
          if(isSpeed){
            const occupied = Object.values(question.responses || {}).some(response => Number(response?.answerIndex) === answerIndex);
            if(occupied) return;
          }
          state.localAnswer = answerIndex;
          renderQuestionScene();
          if(state.role === "host"){
            if(isSpeed && Object.values(state.game.question.responses || {}).some(response => Number(response?.answerIndex) === answerIndex)) return;
            state.game.question.responses[state.playerId] = {answerIndex,answeredAt};
            await broadcastGame();
          } else {
            await state.channel.send({type:"broadcast",event:"guest_answer",payload:{playerId:state.playerId,answerIndex,answeredAt}});
          }
        };
      });
    }
    setInterval(async () => {
      if(state.game.phase === "generating"){
        renderGeneratingScene();
      }
      if(state.game.phase === "countdown"){
        renderCountdownScene();
        if(state.role === "host" && state.game.countdownEndAt && Date.now() >= state.game.countdownEndAt){
          const bank = activeQuestionSet();
          const q = bank[state.game.questionIndex || 0];
          const prepared = prepareQuestion(q);
          const leadMs = Math.max(0, Number(state.game.questionLeadSeconds || 6)) * 1000;
          const answerMs = Math.max(5, Number(state.game.answerSeconds || 15)) * 1000;
          const answersVisibleAt = Date.now() + leadMs;
          state.game.phase = "question";
          state.game.question = {type:prepared.type || "standard",prompt:prepared.prompt, category:prepared.category, choices:prepared.choices, correct:prepared.correct, scores:prepared.scores || [], ranking:prepared.ranking || [], answersVisibleAt, endAt:answersVisibleAt + answerMs, responses:{}, revealed:false, explanation:prepared.explanation || ""};
          await broadcastGame();
          renderCurrentScene();
        }
      }
      if(state.game.phase === "question" && state.game.question){
        renderQuestionScene();
        if(Date.now() >= state.game.question.endAt && !state.game.question.revealed && state.role === "host"){
          state.game.question.revealed = true;
          const scores = {...(state.game.scores || {})};
          const deltas = {};
          const responses = Object.entries(state.game.question.responses || {}).map(([playerId, response]) => ({playerId,answerIndex:Number(response?.answerIndex),answeredAt:Number(response?.answeredAt || Number.MAX_SAFE_INTEGER)}));
          if(state.game.question.type === "speed"){
            responses.forEach(entry => {
              const gain = Number(state.game.question.scores?.[entry.answerIndex] || 0);
              scores[entry.playerId] = (scores[entry.playerId] || 0) + gain;
              deltas[entry.playerId] = gain;
            });
          } else {
            const correct = responses.filter(entry => entry.answerIndex === state.game.question.correct).sort((a,b) => a.answeredAt - b.answeredAt);
            correct.forEach((entry, idx) => {
              const gain = idx === 0 && correct.length > 1 ? 110 : 100;
              scores[entry.playerId] = (scores[entry.playerId] || 0) + gain;
              deltas[entry.playerId] = gain;
            });
          }
          state.game.scores = scores;
          state.game.lastRoundScores = deltas;
          state.game.phase = "answer";
          state.game.answerShownAt = Date.now();
          await broadcastGame();
          renderCurrentScene();
        }
      }
      if(state.game.phase === "answer" && state.role === "host" && Date.now() - state.game.answerShownAt >= 7000){
        state.game.phase = "scores";
        state.game.scoresShownAt = Date.now();
        await broadcastGame();
        renderCurrentScene();
      }
      if(state.game.phase === "scores"){
        renderScoresScene();
        if(state.role === "host" && !state.game.finished && Date.now() - state.game.scoresShownAt >= 8000){
          state.localAnswer = null;
          if(maybeStartVersus()){
            await broadcastGame();
            renderCurrentScene();
            return;
          }
          if((state.game.questionIndex || 0) + 1 < activeQuestionSet().length){
            state.game.questionIndex = (state.game.questionIndex || 0) + 1;
            state.game.phase = "countdown";
            state.game.question = null;
            state.game.countdownEndAt = Date.now() + 4000;
            state.game.lastRoundScores = {};
            await broadcastGame();
            renderCurrentScene();
            return;
          }
          state.game.finished = true;
          state.game.finishedAt = Date.now();
          await broadcastGame();
          renderCurrentScene();
        }
      }
      if(state.game.phase === "versus_intro"){
        renderVersusIntroScene();
        if(state.role === "host" && state.game.versus && Date.now() >= Number(state.game.versus.introEndsAt || 0)){
          state.game.phase = "versus";
          resetVersusRound(state.game.versus);
          await broadcastGame();
          renderCurrentScene();
          return;
        }
      }
      if(state.game.phase === "versus"){
        renderVersusScene();
        if(state.role === "host" && state.game.versus){
          const versus = state.game.versus;
          const bothChosen = (versus.pair || []).length === 2 && (versus.pair || []).every(playerId => !!versus.choices?.[playerId]);
          const roundAlreadyResolved = !!versus.roundWinnerId || Number(versus.revealUntil || 0) > 0;
          if(!versus.finalWinnerId && !roundAlreadyResolved && (bothChosen || Date.now() >= Number(versus.roundDeadline || 0))){
            concludeVersusRound(versus);
            await broadcastGame();
            renderCurrentScene();
            return;
          }
          if(!versus.finalWinnerId && Number(versus.revealUntil || 0) && Date.now() >= Number(versus.revealUntil || 0)){
            versus.roundNumber = Number(versus.roundNumber || 1) + 1;
            resetVersusRound(versus);
            await broadcastGame();
            renderCurrentScene();
            return;
          }
          if(versus.finalWinnerId && !versus.awarded){
            const winnerId = versus.finalWinnerId;
            state.game.scores = {...(state.game.scores || {}), [winnerId]:Number((state.game.scores || {})[winnerId] || 0) + VERSUS_BONUS_POINTS};
            state.game.lastRoundScores = {[winnerId]:VERSUS_BONUS_POINTS};
            state.game.tieTracker = {streak:0,pair:[]};
            versus.awarded = true;
            await broadcastGame();
            renderCurrentScene();
            return;
          }
          if(versus.finalWinnerId && versus.awarded && (!versus.revealUntil || Date.now() >= Number(versus.revealUntil || 0))){
            if((state.game.questionIndex || 0) + 1 < activeQuestionSet().length){
              state.game.questionIndex = (state.game.questionIndex || 0) + 1;
              state.game.phase = "countdown";
              state.game.question = null;
              state.game.versus = null;
              state.game.countdownEndAt = Date.now() + 4000;
              await broadcastGame();
              renderCurrentScene();
              return;
            }
            state.game.versus = null;
            state.game.finished = true;
            state.game.finishedAt = Date.now();
            state.game.phase = "scores";
            state.game.scoresShownAt = Date.now();
            await broadcastGame();
            renderCurrentScene();
          }
        }
      }
    }, 1000);
    const savedSession = readSession();
    if(savedSession?.role && savedSession?.roomCode){ ui.btnContinue.hidden = false; }
    syncChoiceGroup(ui.customToneChoices, "tone", state.game.customConfig.tone);
    syncChoiceGroup(ui.customDifficultyChoices, "difficulty", state.game.customConfig.difficulty);
    applyTranslations();
    updateLanguageButtons();
    applyAvatar();
    renderCurrentScene();
    if(savedSession?.role && savedSession?.roomCode && !state.role){
      setTimeout(async () => {
        const ok = await restoreSavedSession(savedSession);
        if(ok) showResumeModal();
      }, 120);
    }
  
