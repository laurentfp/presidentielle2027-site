(() => {
  const root = document.getElementById("pt-dashboard");
  if (!root) return;

  const $ = selector => root.querySelector(selector);
  const nodes = {
    sourceDates: root.querySelectorAll("#pt-source-updated, #pt-source-date"),
    overviewCount: $("#pt-overview-count"),
    overviewStats: $("#pt-overview-stats"),
    overviewLatest: $("#pt-overview-latest"),
    overviewAgenda: $("#pt-overview-agenda"),
    themeFilter: $("#pt-theme-filter"),
    candidateOptions: $("#pt-candidate-options"),
    candidateSummary: $("#pt-candidate-summary"),
    candidateHelp: $("#pt-candidate-help"),
    candidateReset: $("#pt-candidate-reset"),
    questionCount: $("#pt-question-count"),
    stanceHead: $("#pt-stance-head"),
    stanceRows: $("#pt-stance-rows"),
    detailScore: $("#pt-detail-score"),
    detailNote: $("#pt-detail-note"),
    detailContext: $("#pt-detail-context"),
    detailLink: $("#pt-detail-link"),
    scaleLegend: $("#pt-scale-legend"),
    pollCount: $("#pt-poll-count"),
    pollSelect: $("#pt-poll-select"),
    pollSummary: $("#pt-poll-summary"),
    pollHypotheses: $("#pt-poll-hypotheses"),
    pollResults: $("#pt-poll-results"),
    pollMethod: $("#pt-poll-method"),
    programCount: $("#pt-program-count"),
    programCandidate: $("#pt-program-candidate"),
    programTheme: $("#pt-program-theme"),
    programList: $("#pt-program-list"),
    programMore: $("#pt-program-more"),
    campaignCount: $("#pt-campaign-count"),
    campaignTimeline: $("#pt-campaign-timeline"),
    campaignUpcoming: $("#pt-campaign-upcoming"),
    matrix: $("#pt-matrix"),
    reportArchive: $("#pt-report-archive"),
    reportStatus: $("#pt-report-status"),
    reportUpdated: $("#pt-report-updated"),
    reportCount: $("#pt-report-count")
  };

  const fmtDate = value => {
    if (!value) return "Date non précisée";
    const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date).replace(/\.$/u, "");
  };
  const isoToday = () => {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  const safeURL = value => {
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === "https:" ? url.href : null;
    } catch { return null; }
  };
  const makeLink = (source, prefix = "") => {
    const href = safeURL(source?.url);
    if (!href) return null;
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${prefix}${source.title || source.publisher || "Source"}`;
    link.title = [source.publisher, source.date].filter(Boolean).join(" · ");
    return link;
  };
  const appendSourceLinks = (parent, sourceIds, sources, limit = 3) => {
    const selected = [...new Set(sourceIds || [])].map(id => sources[id]).filter(Boolean).slice(0, limit);
    selected.forEach((source, index) => {
      if (index) parent.append(" · ");
      const link = makeLink(source);
      if (link) parent.appendChild(link);
    });
  };
  const emptyMessage = message => {
    const p = document.createElement("p");
    p.className = "pt-muted";
    p.textContent = message;
    return p;
  };
  const addOptions = (select, items, getValue, getLabel, defaultLabel) => {
    select.replaceChildren();
    if (defaultLabel) {
      const option = document.createElement("option");
      option.value = "all";
      option.textContent = defaultLabel;
      select.appendChild(option);
    }
    items.forEach(item => {
      const option = document.createElement("option");
      option.value = getValue(item);
      option.textContent = getLabel(item);
      select.appendChild(option);
    });
  };

  function renderReports() {
    fetch("./reports/index.json", { cache: "no-cache" })
      .then(response => { if (!response.ok) throw new Error("Archives indisponibles"); return response.json(); })
      .then(data => {
        const entries = Array.isArray(data.reports) ? data.reports : [];
        const latestMatrix = Array.isArray(data.matrix) ? data.matrix : [];
        nodes.matrix.replaceChildren();
        [...new Set(latestMatrix.map(item => item?.theme).filter(theme => typeof theme === "string" && theme.trim()))].forEach(theme => {
          const current = latestMatrix.find(item => item?.theme === theme);
          const card = document.createElement("article");
          card.className = "pt-matrix-item";
          const heading = document.createElement("h3");
          heading.textContent = theme;
          const detail = document.createElement("p");
          detail.textContent = current?.analysis?.trim() || "En attente de la première synthèse hebdomadaire.";
          card.append(heading, detail);
          if (current?.implication?.trim()) {
            const implication = document.createElement("p");
            implication.textContent = `Pour 2040 : ${current.implication}`;
            card.appendChild(implication);
          }
          nodes.matrix.appendChild(card);
        });
        nodes.reportArchive.replaceChildren();
        nodes.reportCount.textContent = `${entries.length} ${entries.length === 1 ? "rapport" : "rapports"}`;
        if (!entries.length) {
          nodes.reportStatus.textContent = "Aucune synthèse hebdomadaire publiée pour l’instant.";
          nodes.reportArchive.appendChild(emptyMessage("La première édition paraîtra après le prochain contrôle du samedi."));
          nodes.reportUpdated.textContent = "Première édition à venir";
          return;
        }
        nodes.reportStatus.textContent = entries[0].summary || "La dernière synthèse hebdomadaire est disponible dans les archives.";
        nodes.reportUpdated.textContent = entries[0].date ? `Dernière édition · ${entries[0].date}` : "Dernière édition publiée";
        entries.forEach(entry => {
          if (typeof entry.title !== "string" || typeof entry.path !== "string") return;
          let url;
          try {
            const parsed = new URL(entry.path, document.baseURI);
            if (parsed.origin !== location.origin || !parsed.pathname.includes("/reports/")) return;
            url = parsed.href;
          } catch { return; }
          const row = document.createElement("div");
          row.className = "pt-list-row";
          const date = document.createElement("span");
          date.className = "pt-date";
          date.textContent = entry.date || "";
          const info = document.createElement("div");
          const link = document.createElement("a");
          link.className = "pt-report-link";
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = entry.title;
          info.appendChild(link);
          if (entry.summary) {
            const summary = document.createElement("div");
            summary.className = "pt-report-meta";
            summary.textContent = entry.summary;
            info.appendChild(summary);
          }
          row.append(date, info);
          nodes.reportArchive.appendChild(row);
        });
      })
      .catch(() => { nodes.reportStatus.textContent = "La liste des synthèses est momentanément indisponible."; });
  }

  function start(data) {
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    const themes = Array.isArray(data.themes) ? data.themes : [];
    const sources = data.sources || {};
    const candidateById = Object.fromEntries(candidates.map(candidate => [candidate.id, candidate]));
    const candidateName = id => {
      const candidate = candidateById[id];
      return candidate ? `${candidate.firstName} ${candidate.lastName}` : id;
    };
    const themeByKey = Object.fromEntries(themes.map(theme => [theme.key, theme]));
    const allMeasures = candidates.flatMap(candidate => candidate.measures.map(measure => ({ ...measure, candidateId: candidate.id })));
    const totalMeasures = allMeasures.length;
    const fmtCount = value => new Intl.NumberFormat("fr-FR").format(value);
    const latestMeasureDate = measure => measure.lastChanged || measure.firstSeen || "";
    const programDate = measure => measure.history?.at(-1)?.date || latestMeasureDate(measure);

    function measureSources(measure) {
      const latestHistory = measure.history?.at(-1);
      return latestHistory?.sourceIds?.length ? latestHistory.sourceIds : measure.sourceIds;
    }
    function renderMeasureRow(measure, compact = false) {
      const row = document.createElement("div");
      row.className = "pt-list-row";
      const date = document.createElement("span");
      date.className = "pt-date";
      date.textContent = fmtDate(programDate(measure));
      const content = document.createElement("div");
      const title = document.createElement("div");
      title.className = "pt-row-title";
      title.textContent = measure.title;
      const meta = document.createElement("div");
      meta.className = "pt-row-meta";
      const theme = themeByKey[measure.themeKey];
      meta.append(`${candidateName(measure.candidateId)} · ${theme?.name || measure.themeKey} · ${measure.kind === "declaration" ? "Déclaration" : measure.kind === "vote" ? "Vote" : "Programme"}`);
      const sourceBox = document.createElement("span");
      sourceBox.className = "pt-row-meta";
      appendSourceLinks(sourceBox, measureSources(measure), sources, compact ? 1 : 3);
      content.append(title, meta);
      if (sourceBox.childNodes.length) content.appendChild(sourceBox);
      row.append(date, content);
      if (!compact) {
        const badge = document.createElement("span");
        badge.className = "pt-pill";
        badge.textContent = measure.status === "abandonnee" ? "Abandonnée" : measure.history?.at(-1)?.type === "ajout" ? "Ajout" : "Mise à jour";
        row.appendChild(badge);
      }
      return row;
    }
    function sortedMeasures() {
      return [...allMeasures].sort((a, b) => programDate(b).localeCompare(programDate(a)) || a.title.localeCompare(b.title, "fr"));
    }

    // Dynamic source timestamp and headline counts.
    const updatedAt = new Date(data.updatedAt);
    const dateLabel = Number.isFinite(updatedAt.getTime())
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(updatedAt)
      : "date indisponible";
    nodes.sourceDates.forEach(node => {
      node.dateTime = Number.isFinite(updatedAt.getTime()) ? updatedAt.toISOString() : "";
      node.textContent = dateLabel;
    });
    const declared = candidates.filter(candidate => candidate.status === "declare").length;
    const proposed = candidates.filter(candidate => candidate.status === "pressenti").length;
    const withdrawn = candidates.filter(candidate => candidate.status === "retire").length;
    const pollCount = Array.isArray(data.polls) ? data.polls.length : 0;
    nodes.overviewCount.textContent = `${fmtCount(candidates.length)} personnes suivies`;
    const stats = [
      ["Candidatures déclarées", fmtCount(declared), `${fmtCount(proposed)} pressenties · ${fmtCount(withdrawn)} retirées`],
      ["Mesures suivies", fmtCount(totalMeasures), "Programmes, déclarations et votes"],
      ["Sources référencées", fmtCount(Object.keys(sources).length), "Liens et documents cités"],
      ["Sondages enregistrés", fmtCount(pollCount), "Enquêtes conservées séparément"]
    ];
    nodes.overviewStats.replaceChildren();
    stats.forEach(([label, value, note]) => {
      const card = document.createElement("div");
      card.className = "pt-stat";
      const title = document.createElement("div");
      title.className = "pt-stat-label";
      title.textContent = label;
      const number = document.createElement("div");
      number.className = "pt-stat-value";
      number.textContent = value;
      const detail = document.createElement("div");
      detail.className = "pt-stat-note";
      detail.textContent = note;
      card.append(title, number, detail);
      nodes.overviewStats.appendChild(card);
    });
    nodes.overviewLatest.replaceChildren();
    sortedMeasures().slice(0, 4).forEach(measure => nodes.overviewLatest.appendChild(renderMeasureRow(measure, true)));

    // Theme and candidate filters are built from the data file, not duplicated in HTML.
    addOptions(nodes.themeFilter, themes, item => item.key, item => item.name, "Tous les thèmes");
    addOptions(nodes.programTheme, themes, item => item.key, item => item.name, "Tous les thèmes");
    addOptions(nodes.programCandidate, [...candidates].sort((a, b) => a.lastName.localeCompare(b.lastName, "fr")), item => item.id, item => `${item.firstName} ${item.lastName}`, "Tous les candidats");

    // Positions questionnaire.
    const declaredWithStances = candidates.filter(candidate => candidate.status === "declare" && data.questionnaire.questions.some(question => question.stances?.[candidate.id]));
    const positionIds = declaredWithStances.map(candidate => candidate.id).sort((a, b) => candidateName(a).localeCompare(candidateName(b), "fr"));
    const selectedCandidateIds = new Set();
    const questions = data.questionnaire.questions.map(question => ({ ...question, themeName: themeByKey[question.themeKey]?.name || question.themeKey }));
    function updateCandidateLabel() {
      const count = selectedCandidateIds.size;
      nodes.candidateSummary.textContent = count ? `${count} candidat${count === 1 ? "" : "s"} sélectionné${count === 1 ? "" : "s"}` : `Tous les candidats avec position (${positionIds.length})`;
      nodes.candidateHelp.textContent = count ? `${count} sur 6 sélectionné${count === 1 ? "" : "s"}. Choisissez jusqu’à 6 candidats.` : "Choisissez jusqu’à 6 candidats pour comparer leurs positions.";
    }
    function renderCandidateOptions() {
      nodes.candidateOptions.replaceChildren();
      declaredWithStances.sort((a, b) => a.lastName.localeCompare(b.lastName, "fr")).forEach(candidate => {
        const label = document.createElement("label");
        label.className = "pt-candidate-option";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = candidate.id;
        input.addEventListener("change", () => {
          if (input.checked && selectedCandidateIds.size >= 6) {
            input.checked = false;
            nodes.candidateHelp.textContent = "La limite est de 6 candidats. Décochez-en un avant d’en choisir un autre.";
            return;
          }
          if (input.checked) selectedCandidateIds.add(candidate.id);
          else selectedCandidateIds.delete(candidate.id);
          updateCandidateLabel();
          renderQuestions();
        });
        const name = document.createElement("span");
        name.textContent = `${candidate.firstName} ${candidate.lastName}`;
        label.append(input, name);
        nodes.candidateOptions.appendChild(label);
      });
      updateCandidateLabel();
    }
    function appendStanceSources(sourceIds, prefix) {
      const found = (sourceIds || []).map(id => sources[id]).filter(Boolean);
      found.forEach(source => {
        const link = makeLink(source, `${prefix || ""}`);
        if (link) nodes.detailLink.appendChild(link);
      });
    }
    function showStance(question, candidateId) {
      const stance = question.stances?.[candidateId];
      nodes.detailLink.replaceChildren();
      nodes.detailContext.textContent = question.context ? `Contexte : ${question.context}` : "";
      nodes.detailScore.textContent = `${candidateName(candidateId)} · ${stance ? (stance.value > 0 ? `+${stance.value}` : stance.value) : "—"}`;
      nodes.detailNote.textContent = stance?.note || "Aucune position sourcée n’est enregistrée pour cette affirmation.";
      appendStanceSources(stance?.sourceIds, "Position : ");
      appendStanceSources(question.contextSourceIds, "Contexte : ");
    }
    function renderQuestions() {
      const themeKey = nodes.themeFilter.value;
      const candidateIds = selectedCandidateIds.size ? [...selectedCandidateIds] : positionIds;
      const displayed = questions.filter(question => themeKey === "all" || question.themeKey === themeKey);
      nodes.questionCount.textContent = `${displayed.length} sur ${questions.length} affirmations · ${candidateIds.length} candidat${candidateIds.length === 1 ? "" : "s"} affiché${candidateIds.length === 1 ? "" : "s"}`;
      nodes.stanceHead.replaceChildren();
      const heading = document.createElement("th");
      heading.scope = "col";
      heading.textContent = "Affirmation";
      nodes.stanceHead.appendChild(heading);
      candidateIds.forEach(id => {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = candidateName(id);
        nodes.stanceHead.appendChild(th);
      });
      nodes.stanceRows.replaceChildren();
      let previousTheme = "";
      displayed.forEach(question => {
        if (question.themeKey !== previousTheme) {
          const group = document.createElement("tr");
          group.className = "pt-theme-row";
          const cell = document.createElement("td");
          cell.colSpan = candidateIds.length + 1;
          cell.textContent = question.themeName;
          group.appendChild(cell);
          nodes.stanceRows.appendChild(group);
          previousTheme = question.themeKey;
        }
        const row = document.createElement("tr");
        const text = document.createElement("td");
        text.className = "pt-question";
        text.textContent = question.statement;
        row.appendChild(text);
        candidateIds.forEach(id => {
          const stance = question.stances?.[id];
          const cell = document.createElement("td");
          cell.className = "pt-score-cell";
          const button = document.createElement("button");
          button.type = "button";
          button.className = "pt-score";
          button.dataset.score = stance ? String(stance.value) : "unknown";
          button.setAttribute("aria-label", stance ? `${candidateName(id)} : position ${stance.value}` : `${candidateName(id)} : aucune position documentée`);
          button.textContent = stance ? (stance.value > 0 ? `+${stance.value}` : String(stance.value)) : "—";
          button.addEventListener("click", () => showStance(question, id));
          cell.appendChild(button);
          row.appendChild(cell);
        });
        nodes.stanceRows.appendChild(row);
      });
    }
    renderCandidateOptions();
    nodes.scaleLegend.replaceChildren();
    const scale = data.questionnaire.scale || [];
    const legendGroups = [
      { name: "Plutôt opposé à l’affirmation", className: "minus", values: scale.filter(item => item.value < 0) },
      { name: "Position nuancée", className: "", values: scale.filter(item => item.value === 0) },
      { name: "Plutôt favorable à l’affirmation", className: "plus", values: scale.filter(item => item.value > 0) }
    ];
    legendGroups.forEach(group => {
      if (!group.values.length) return;
      const entry = document.createElement("span");
      entry.className = "pt-legend-item";
      const dot = document.createElement("i");
      dot.className = `pt-dot ${group.className}`.trim();
      const labels = group.values.map(item => `${item.value > 0 ? `+${item.value}` : item.value} ${item.label}`);
      entry.append(dot, `${group.name} · ${labels.join(" / ")}`);
      nodes.scaleLegend.appendChild(entry);
    });
    const undocumented = document.createElement("span");
    undocumented.className = "pt-legend-item";
    undocumented.textContent = "— Non documenté";
    nodes.scaleLegend.appendChild(undocumented);
    nodes.themeFilter.addEventListener("change", renderQuestions);
    nodes.candidateReset.addEventListener("click", () => {
      selectedCandidateIds.clear();
      nodes.candidateOptions.querySelectorAll("input[type=checkbox]").forEach(input => { input.checked = false; });
      updateCandidateLabel();
      renderQuestions();
    });
    renderQuestions();

    // Poll selector, hypothesis buttons and results all come from polls[] in the data file.
    const polls = [...(data.polls || [])].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "") || b.fieldworkEnd.localeCompare(a.fieldworkEnd));
    nodes.pollCount.textContent = `${fmtCount(polls.length)} enquêtes`;
    addOptions(nodes.pollSelect, polls, poll => poll.id, poll => `${fmtDate(poll.publishedAt)} · ${poll.institute} · ${poll.round === 1 ? "1er tour" : "2nd tour"}`);
    function renderPoll(pollId) {
      const poll = polls.find(item => item.id === pollId) || polls[0];
      if (!poll) {
        nodes.pollSummary.replaceChildren(emptyMessage("Aucun sondage enregistré."));
        return;
      }
      nodes.pollSelect.value = poll.id;
      nodes.pollSummary.replaceChildren();
      const titleBlock = document.createElement("div");
      const title = document.createElement("h2");
      title.textContent = poll.institute;
      const info = document.createElement("p");
      info.className = "pt-subtitle";
      info.textContent = `Publication : ${fmtDate(poll.publishedAt)} · terrain : ${fmtDate(poll.fieldworkStart)} – ${fmtDate(poll.fieldworkEnd)} · échantillon : ${fmtCount(poll.sampleSize)}`;
      titleBlock.append(title, info);
      const round = document.createElement("span");
      round.className = "pt-pill";
      round.textContent = poll.round === 1 ? "1er tour" : "2nd tour";
      nodes.pollSummary.append(titleBlock, round);
      nodes.pollHypotheses.replaceChildren();
      nodes.pollResults.replaceChildren();
      const hypotheses = poll.hypotheses || [];
      hypotheses.forEach((hypothesis, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pt-hypothesis";
        button.dataset.hypothesis = hypothesis.id;
        button.setAttribute("aria-pressed", String(index === 0));
        button.textContent = hypothesis.label;
        button.addEventListener("click", () => {
          nodes.pollHypotheses.querySelectorAll("[data-hypothesis]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
          renderPollResults(poll, hypothesis);
        });
        nodes.pollHypotheses.appendChild(button);
      });
      if (hypotheses[0]) renderPollResults(poll, hypotheses[0]);
      nodes.pollMethod.replaceChildren();
      const methodText = document.createElement("p");
      methodText.textContent = [poll.population, poll.method, poll.margin].filter(Boolean).join(" · ");
      nodes.pollMethod.appendChild(methodText);
      const links = document.createElement("div");
      [poll.noticeUrl && { title: "Notice de la Commission des sondages", url: poll.noticeUrl }, poll.reportUrl && { title: "Rapport complet", url: poll.reportUrl }].filter(Boolean).forEach(source => {
        const link = makeLink(source);
        if (link) links.appendChild(link);
      });
      nodes.pollMethod.appendChild(links);
    }
    function renderPollResults(poll, hypothesis) {
      nodes.pollResults.replaceChildren();
      (hypothesis.results || []).forEach(result => {
        const item = document.createElement("div");
        item.className = "pt-result";
        item.setAttribute("role", "listitem");
        const label = document.createElement("span");
        label.textContent = result.candidateId ? candidateName(result.candidateId) : result.label;
        const bar = document.createElement("progress");
        bar.className = "pt-track";
        bar.max = 100;
        bar.value = result.value;
        bar.setAttribute("aria-label", `${label.textContent} : ${result.value} %`);
        const score = document.createElement("span");
        score.className = "pt-value";
        score.textContent = `${result.value}%`;
        item.append(label, bar, score);
        nodes.pollResults.appendChild(item);
      });
    }
    nodes.pollSelect.addEventListener("change", () => renderPoll(nodes.pollSelect.value));
    renderPoll(polls[0]?.id);

    // Latest measures and filters.
    let visibleLimit = 30;
    function renderPrograms(reset = false) {
      if (reset) visibleLimit = 30;
      const candidateId = nodes.programCandidate.value;
      const themeKey = nodes.programTheme.value;
      const filtered = sortedMeasures().filter(measure => (candidateId === "all" || measure.candidateId === candidateId) && (themeKey === "all" || measure.themeKey === themeKey));
      nodes.programCount.textContent = `${fmtCount(totalMeasures)} mesures · ${fmtCount(Math.min(visibleLimit, filtered.length))} affichées`;
      nodes.programList.replaceChildren();
      filtered.slice(0, visibleLimit).forEach(measure => nodes.programList.appendChild(renderMeasureRow(measure)));
      if (!filtered.length) nodes.programList.appendChild(emptyMessage("Aucune mesure ne correspond à ces filtres."));
      nodes.programMore.hidden = visibleLimit >= filtered.length;
    }
    nodes.programCandidate.addEventListener("change", () => renderPrograms(true));
    nodes.programTheme.addEventListener("change", () => renderPrograms(true));
    nodes.programMore.addEventListener("click", () => { visibleLimit += 30; renderPrograms(); });
    renderPrograms();

    // Campaign chronology merges campaign declarations with the separately maintained agenda.
    const campaignEvents = (data.campaignEvents || []).map(event => ({
      id: event.id, date: event.date, title: candidateName(event.candidateIds?.[0] || "") ,
      text: event.text, type: event.type, sourceIds: event.sourceIds || [], candidateIds: event.candidateIds || []
    }));
    const agendaEvents = (data.agenda || []).map(event => ({
      id: event.id, date: event.date, title: event.title, text: event.description,
      type: event.kind, sourceIds: event.sourceIds || [], candidateIds: []
    }));
    const allEvents = [...campaignEvents, ...agendaEvents].sort((a, b) => b.date.localeCompare(a.date));
    nodes.campaignCount.textContent = `${fmtCount(allEvents.length)} événements et échéances`;
    const today = isoToday();
    const past = allEvents.filter(event => event.date <= today).slice(0, 10);
    const upcoming = agendaEvents.filter(event => event.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
    nodes.campaignTimeline.replaceChildren();
    past.forEach(event => {
      const item = document.createElement("div");
      item.className = "pt-event";
      const date = document.createElement("span");
      date.className = "pt-event-date";
      date.textContent = fmtDate(event.date);
      const marker = document.createElement("i");
      marker.className = "pt-event-marker";
      marker.setAttribute("aria-hidden", "true");
      const body = document.createElement("div");
      body.className = "pt-event-body";
      const title = document.createElement("h3");
      const leadCandidate = event.candidateIds.map(candidateName).join(", ");
      title.textContent = event.type === "debat" ? event.title : event.candidateIds.length ? `${leadCandidate} · ${event.type}` : event.title;
      const text = document.createElement("p");
      text.textContent = event.text;
      body.append(title, text);
      const links = document.createElement("p");
      appendSourceLinks(links, event.sourceIds, sources, 2);
      if (links.childNodes.length) body.appendChild(links);
      item.append(date, marker, body);
      nodes.campaignTimeline.appendChild(item);
    });
    if (!past.length) nodes.campaignTimeline.appendChild(emptyMessage("Aucun événement passé n’est enregistré dans la base de données."));
    nodes.campaignUpcoming.replaceChildren();
    upcoming.forEach(event => {
      const row = document.createElement("div");
      row.className = "pt-list-row";
      const date = document.createElement("span");
      date.className = "pt-date";
      date.textContent = fmtDate(event.date);
      const content = document.createElement("div");
      const title = document.createElement("div");
      title.className = "pt-row-title";
      title.textContent = event.title;
      const detail = document.createElement("div");
      detail.className = "pt-row-meta";
      detail.textContent = event.text;
      content.append(title, detail);
      const badge = document.createElement("span");
      badge.className = "pt-pill";
      badge.textContent = event.type === "scrutin" ? "Scrutin" : "Échéance";
      row.append(date, content, badge);
      nodes.campaignUpcoming.appendChild(row);
    });
    if (!upcoming.length) nodes.campaignUpcoming.appendChild(emptyMessage("Aucune échéance future n’est enregistrée."));

    // Overview agenda uses the exact same source records.
    nodes.overviewAgenda.replaceChildren();
    upcoming.slice(0, 3).forEach(event => {
      const row = document.createElement("div");
      row.className = "pt-list-row";
      const date = document.createElement("span");
      date.className = "pt-date";
      date.textContent = fmtDate(event.date);
      const content = document.createElement("div");
      const title = document.createElement("div");
      title.className = "pt-row-title";
      title.textContent = event.title;
      const detail = document.createElement("div");
      detail.className = "pt-row-meta";
      detail.textContent = event.text;
      content.append(title, detail);
      row.append(date, content);
      nodes.overviewAgenda.appendChild(row);
    });
    if (!upcoming.length) nodes.overviewAgenda.appendChild(emptyMessage("Aucune échéance future n’est enregistrée."));

    renderReports();
  }

  root.querySelectorAll("[data-tab]").forEach(tab => tab.addEventListener("click", () => {
    root.querySelectorAll("[data-tab]").forEach(item => item.setAttribute("aria-selected", String(item === tab)));
    root.querySelectorAll("[role=tabpanel]").forEach(panel => panel.classList.add("pt-hidden"));
    root.querySelector(`#pt-panel-${tab.dataset.tab}`).classList.remove("pt-hidden");
  }));

  fetch("./presidentielle2027.json", { cache: "no-cache" })
    .then(response => { if (!response.ok) throw new Error("Base de données indisponible"); return response.json(); })
    .then(data => start(data))
    .catch(() => {
      nodes.sourceDates.forEach(node => { node.textContent = "indisponible"; });
      nodes.questionCount.textContent = "Base de données indisponible";
      nodes.stanceRows.replaceChildren();
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 2;
      cell.textContent = "Impossible de charger la base de données. Réessayez dans quelques instants.";
      row.appendChild(cell);
      nodes.stanceRows.appendChild(row);
    });
})();
