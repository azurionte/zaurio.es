from pathlib import Path

path = Path('juegos.zaurio.es/trivialodon/index.html')
text = path.read_text(encoding='utf-8-sig')
original = text

# 35% Velociraptor questions in the local/classic question mix.
text = text.replace(
    'const speedCount = Math.max(1, Math.round(count * 0.2));',
    'const speedCount = Math.max(1, Math.round(count * 0.35));',
    1,
)

# Every Velociraptor answer is valid and earns points. Existing curated banks used 0 for rank 5.
text = text.replace('score:0,rank:5', 'score:60,rank:5')

# Host is authoritative for speed locks: one player, one choice; one choice, one player.
old_guest = '''}).on("broadcast",{event:"guest_answer"},({payload}) => { if(state.role !== "host" || !state.game.question || !payload) return; state.game.question.responses[payload.playerId] = {answerIndex:payload.answerIndex,answeredAt:payload.answeredAt || Date.now()}; broadcastGame(); renderCurrentScene(); })'''
new_guest = '''}).on("broadcast",{event:"guest_answer"},({payload}) => { if(state.role !== "host" || !state.game.question || !payload) return; const answerIndex = Number(payload.answerIndex); if(!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= (state.game.question.choices || []).length) return; if(state.game.question.type === "speed"){ if(state.game.question.responses?.[payload.playerId]){ broadcastGame(); return; } const occupied = Object.entries(state.game.question.responses || {}).some(([playerId,response]) => playerId !== payload.playerId && Number(response?.answerIndex) === answerIndex); if(occupied){ broadcastGame(); return; } } state.game.question.responses[payload.playerId] = {answerIndex,answeredAt:payload.answeredAt || Date.now()}; broadcastGame(); renderCurrentScene(); })'''
if old_guest not in text:
    raise SystemExit('guest_answer handler anchor not found')
text = text.replace(old_guest, new_guest, 1)

# A speed option is never styled as wrong: all ranked choices are correct.
text = text.replace(' ${isSpeed && question.revealed && speedScore === 0 ? "wrong" : ""}', '', 1)

# Scoreboard: show Velociraptor rank/answer, round gain and accumulated total.
old_scores = '''    function renderScoresScene(){ const entries = scoreEntries(); const leader = entries[0]; const finished = !!state.game.finished; const myScore = Number((state.game.scores || {})[state.playerId] || 0); const win = leader && leader.playerId === state.playerId; const rows = entries.map((entry, index) => { const gain = Number((state.game.lastRoundScores || {})[entry.playerId] || 0); return `<article class="scoreRow"><div class="rankAvatar">${entry.avatarSrc ? `<img src="${entry.avatarSrc}" alt="">` : "\\uD83E\\uDD96"}</div><div class="sceneStack" style="gap:4px"><strong>#${index + 1} ${esc(entry.name)}</strong><span class="playerSub">${index === 0 ? t("currentLeader") : t("inRace")}</span></div><div class="scoreValueWrap">${gain > 0 ? `<span class="scoreDelta">+${gain}</span><span class="scoreGlitter">✦</span>` : ""}<strong>${entry.score}</strong></div></article>`; }).join("") || `<p>${t("noScoresYet")}</p>`; if(finished){ ui.scoresTitle.textContent = win ? t("victory") : t("defeat"); ui.scoresLead.textContent = win ? t("championText", {score: myScore}) : t("defeatText"); } else { ui.scoresTitle.textContent = leader ? t("leadsGame", {name: leader.name}) : t("scoreRound"); ui.scoresLead.textContent = leader ? t("accumulatedPoints", {score: leader.score}) : t("noScoresYet"); } ui.scoresRows.innerHTML = rows; ui.scoreModalRows.innerHTML = rows; const showButtons = finished && state.game.finishedAt && Date.now() - state.game.finishedAt >= 2000; ui.finalActions.innerHTML = showButtons ? `<button class="btn btnOk" id="btnContinueGame" type="button">${t("continueSession")}</button><button class="btn btnGhost" id="btnNewGame" type="button">${t("newSession")}</button>` : ""; if(showButtons){ $("btnContinueGame").onclick = async () => { if(state.role !== "host") return; resetGameToSetup(false); await broadcastGame(); renderCurrentScene(); }; $("btnNewGame").onclick = async () => { if(state.role !== "host") return; resetGameToSetup(true); await broadcastGame(); renderCurrentScene(); }; } }'''
new_scores = '''    function renderScoresScene(){
      const entries = scoreEntries();
      const leader = entries[0];
      const finished = !!state.game.finished;
      const myScore = Number((state.game.scores || {})[state.playerId] || 0);
      const win = leader && leader.playerId === state.playerId;
      const question = state.game.question || null;
      const isSpeedRound = question?.type === "speed";
      const speedDetailFor = playerId => {
        if(!isSpeedRound) return "";
        const response = question.responses?.[playerId];
        if(!response || !Number.isInteger(Number(response.answerIndex))) return `<span class="playerSub">${t("speedNoAnswer")}</span>`;
        const answerIndex = Number(response.answerIndex);
        const answer = String(question.choices?.[answerIndex] || "");
        const ranked = (question.ranking || []).find(item => item.text === answer);
        const rank = Number(ranked?.rank || 0);
        return `<span class="playerSub"><strong>${rank ? `#${rank}` : "-"}</strong> · ${esc(answer)}</span>`;
      };
      const rows = entries.map((entry, index) => {
        const gain = Number((state.game.lastRoundScores || {})[entry.playerId] || 0);
        const detail = isSpeedRound ? speedDetailFor(entry.playerId) : `<span class="playerSub">${index === 0 ? t("currentLeader") : t("inRace")}</span>`;
        return `<article class="scoreRow"><div class="rankAvatar">${entry.avatarSrc ? `<img src="${entry.avatarSrc}" alt="">` : "🦖"}</div><div class="sceneStack" style="gap:4px"><strong>#${index + 1} ${esc(entry.name)}</strong>${detail}</div><div class="scoreValueWrap">${gain > 0 ? `<span class="scoreDelta">+${gain}</span><span class="scoreGlitter">✦</span>` : ""}<strong>${entry.score}</strong></div></article>`;
      }).join("") || `<p>${t("noScoresYet")}</p>`;
      if(finished){
        ui.scoresTitle.textContent = win ? t("victory") : t("defeat");
        ui.scoresLead.textContent = win ? t("championText", {score: myScore}) : t("defeatText");
      } else if(isSpeedRound){
        ui.scoresTitle.textContent = t("speedRoundResults");
        ui.scoresLead.textContent = t("speedRoundLead");
      } else {
        ui.scoresTitle.textContent = leader ? t("leadsGame", {name: leader.name}) : t("scoreRound");
        ui.scoresLead.textContent = leader ? t("accumulatedPoints", {score: leader.score}) : t("noScoresYet");
      }
      ui.scoresRows.innerHTML = rows;
      ui.scoreModalRows.innerHTML = rows;
      const showButtons = finished && state.game.finishedAt && Date.now() - state.game.finishedAt >= 2000;
      ui.finalActions.innerHTML = showButtons ? `<button class="btn btnOk" id="btnContinueGame" type="button">${t("continueSession")}</button><button class="btn btnGhost" id="btnNewGame" type="button">${t("newSession")}</button>` : "";
      if(showButtons){
        $("btnContinueGame").onclick = async () => { if(state.role !== "host") return; resetGameToSetup(false); await broadcastGame(); renderCurrentScene(); };
        $("btnNewGame").onclick = async () => { if(state.role !== "host") return; resetGameToSetup(true); await broadcastGame(); renderCurrentScene(); };
      }
    }'''
if old_scores not in text:
    raise SystemExit('renderScoresScene anchor not found')
text = text.replace(old_scores, new_scores, 1)

# UI copy for the special scoreboard.
es_anchor = '        correctOrder:"Orden correcto",\n'
en_anchor = '        correctOrder:"Correct order",\n'
if es_anchor not in text or en_anchor not in text:
    raise SystemExit('i18n anchors not found')
text = text.replace(es_anchor, es_anchor + '        speedRoundResults:"Resultados Velociraptor",\n        speedRoundLead:"Puesto elegido · puntos ganados · total acumulado.",\n        speedNoAnswer:"Sin respuesta",\n', 1)
text = text.replace(en_anchor, en_anchor + '        speedRoundResults:"Velociraptor results",\n        speedRoundLead:"Chosen rank · points earned · accumulated total.",\n        speedNoAnswer:"No answer",\n', 1)

if text == original:
    raise SystemExit('no changes made')
path.write_text(text, encoding='utf-8')

# Keep the TV/live view semantically consistent: every Velociraptor choice is valid,
# and reveal both rank and score instead of marking the lowest choice as wrong.
live_path = Path('juegos.zaurio.es/trivialodon/live/index.html')
live = live_path.read_text(encoding='utf-8-sig')
live_original = live
live = live.replace('        const revealWrong = isSpeed && question.revealed && Number(question.scores?.[index] || 0) === 0;\n', '', 1)
live = live.replace('          ? (question.revealed ? `${Number(question.scores?.[index] || 0)} pts` : (locked ? "Cogida" : "Libre"))', '          ? (question.revealed ? `${Number(question.ranking?.find(item => item.text === choice)?.rank || 0) ? `#${Number(question.ranking?.find(item => item.text === choice)?.rank || 0)} · ` : ""}${Number(question.scores?.[index] || 0)} pts` : (locked ? "Cogida" : "Libre"))', 1)
live = live.replace(' ${revealWrong ? "wrong" : ""}', '', 1)
if live != live_original:
    live_path.write_text(live, encoding='utf-8')

print('Velociraptor patch applied')
