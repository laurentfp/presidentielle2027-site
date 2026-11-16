(() => {
      const root = document.getElementById("pt-dashboard");
      if (!root) return;
      const sourceDateNodes = root.querySelectorAll("#pt-source-updated, #pt-source-date");
      fetch("https://raw.githubusercontent.com/fcroiseaux/presitracker2027-data/main/presitracker-data.json", {
        headers: { Range: "bytes=0-255" },
        cache: "no-cache"
      }).then(response => {
        if (!response.ok) throw new Error("Source indisponible");
        return response.text();
      }).then(prefix => {
        const match = prefix.match(/\"updatedAt\"\s*:\s*\"([^\"]+)\"/);
        if (!match) throw new Error("Date de mise à jour absente");
        const updatedAt = new Date(match[1]);
        if (!Number.isFinite(updatedAt.getTime())) throw new Error("Date de mise à jour invalide");
        const label = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(updatedAt);
        sourceDateNodes.forEach(node => {
          node.dateTime = updatedAt.toISOString();
          node.textContent = label;
        });
      }).catch(() => {
        sourceDateNodes.forEach(node => {
          node.textContent = "date indisponible";
        });
      });
      const matrixThemes = ["Démographie", "IA et emploi", "Productivité", "Industrie", "Finances publiques", "Éducation", "Énergie", "Eau", "Alimentation", "Adaptation climatique", "Politique de santé", "Défense", "Souveraineté européenne", "Contrat intergénérationnel"];
      const matrix = root.querySelector("#pt-matrix");
      const archive = root.querySelector("#pt-report-archive");
      const reportStatus = root.querySelector("#pt-report-status");
      const reportUpdated = root.querySelector("#pt-report-updated");
      const reportCount = root.querySelector("#pt-report-count");
      function renderReports(data) {
        const entries = Array.isArray(data.reports) ? data.reports : [];
        const latestMatrix = Array.isArray(data.matrix) ? data.matrix : [];
        matrix.replaceChildren();
        matrixThemes.forEach(theme => {
          const current = latestMatrix.find(item => item && item.theme === theme);
          const card = document.createElement("article");
          card.className = "pt-matrix-item";
          const heading = document.createElement("h3");
          heading.textContent = theme;
          const detail = document.createElement("p");
          detail.textContent = typeof current?.analysis === "string" && current.analysis.trim() ? current.analysis : "En attente de la première synthèse hebdomadaire.";
          card.append(heading, detail);
          if (typeof current?.implication === "string" && current.implication.trim()) {
            const implication = document.createElement("p");
            implication.textContent = `Pour 2040 : ${current.implication}`;
            card.appendChild(implication);
          }
          matrix.appendChild(card);
        });
        archive.replaceChildren();
        reportCount.textContent = `${entries.length} ${entries.length === 1 ? "rapport" : "rapports"}`;
        if (entries.length === 0) {
          reportStatus.textContent = "Aucune synthèse hebdomadaire publiée pour l’instant.";
          const empty = document.createElement("p");
          empty.className = "pt-muted";
          empty.textContent = "La première édition paraîtra après le prochain contrôle du samedi.";
          archive.appendChild(empty);
          reportUpdated.textContent = "Première édition à venir";
          return;
        }
        const latest = entries[0];
        reportStatus.textContent = typeof latest.summary === "string" ? latest.summary : "La dernière synthèse hebdomadaire est disponible dans les archives.";
        reportUpdated.textContent = latest.date ? `Dernière édition · ${latest.date}` : "Dernière édition publiée";
        entries.forEach(entry => {
          if (!entry || typeof entry.title !== "string" || typeof entry.path !== "string") return;
          let href;
          try {
            const parsed = new URL(entry.path, document.baseURI);
            if (parsed.origin !== location.origin || !parsed.pathname.includes("/reports/")) return;
            href = parsed.href;
          } catch { return; }
          const row = document.createElement("div");
          row.className = "pt-list-row";
          const date = document.createElement("span");
          date.className = "pt-date";
          date.textContent = typeof entry.date === "string" ? entry.date : "";
          const info = document.createElement("div");
          const link = document.createElement("a");
          link.className = "pt-report-link";
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = entry.title;
          info.appendChild(link);
          if (typeof entry.summary === "string" && entry.summary.trim()) {
            const summary = document.createElement("div");
            summary.className = "pt-report-meta";
            summary.textContent = entry.summary;
            info.appendChild(summary);
          }
          row.append(date, info);
          archive.appendChild(row);
        });
      }
      fetch("./reports/index.json", { cache: "no-cache" }).then(response => {
        if (!response.ok) throw new Error("Archives indisponibles");
        return response.json();
      }).then(renderReports).catch(() => {
        reportStatus.textContent = "La liste des synthèses est momentanément indisponible.";
      });
      const names = {
        melenchon: "Jean-Luc Mélenchon",
        lepen: "Marine Le Pen",
        philippe: "Édouard Philippe",
        glucksmann: "Raphaël Glucksmann"
      };
      const sources = {
        melenchonBudget: { title: "Comment nous allons remettre de l'ordre dans les comptes publics", url: "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf" },
        orange: { title: "Présidentielle 2027 : Édouard Philippe écarte la proposition de Gabriel Attal", url: "https://actu.orange.fr/france/presidentielle-2027-une-primaire-de-la-division-edouard-philippe-ecarte-la-proposition-de-gabriel-attal-l-express-via-6medias-CNT000002tuZdH.html" },
        priceEnergy: { title: "L’Avenir en commun – Créer un état d’urgence sociale", url: "https://web.archive.org/web/20260730211950/https://melenchon2027.fr/programme2025/livre/chapitre9/s1/" },
        rnProject: { title: "La France entreprend – Projet de Marine Le Pen", url: "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf" },
        taxPolicy: { title: "L’Avenir en commun – Faire la révolution fiscale", url: "https://web.archive.org/web/20260829203005/https://melenchon2027.fr/programme2025/livre/chapitre6/s5/" },
        rnBudget: { title: "Contre-budget 2026, conférence de presse du 23 octobre 2025", url: "https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf" },
        sudRadio: { title: "Primaire de la gauche : Mélenchon toujours au centre des débats", url: "https://www.sudradio.fr/societe/un-dernier-debat-pour-departager-les-candidats-de-la-primaire-de-la-gauche" }
      };
      const questions = [
        { id:"q-eco-smic-hausse", theme:"eco", themeName:"Économie et pouvoir d’achat", text:"Le SMIC doit être augmenté par la loi au-delà de sa revalorisation automatique.", stances:{melenchon:{value:2,note:"Propose de porter le SMIC à 1 700 € nets.",source:sources.melenchonBudget},philippe:{value:-2,note:"Qualifie une hausse du SMIC de « solution illusoire ».",source:sources.orange}} },
        { id:"q-eco-prix-energie-plafond", theme:"eco", themeName:"Économie et pouvoir d’achat", text:"L’État doit plafonner ou bloquer les prix des carburants et de l’énergie.", stances:{melenchon:{value:2,note:"Propose de bloquer les prix des produits de première nécessité, dont l’énergie et le carburant, avec un prix du carburant ramené à 1,70 € le litre.",source:sources.priceEnergy},lepen:{value:1,note:"Propose d’aligner les prix de l’électricité facturés sur les coûts de production du parc français.",source:sources.rnProject}} },
        { id:"q-fis-isf", theme:"fis", themeName:"Fiscalité", text:"L’impôt de solidarité sur la fortune (ISF) doit être rétabli.", stances:{melenchon:{value:2,note:"Propose de rétablir et de renforcer l’ISF, avec un volet climatique.",source:sources.taxPolicy},lepen:{value:0,note:"Propose de remplacer l’IFI par un impôt sur la fortune financière, qu’elle distingue de l’ISF.",source:sources.rnBudget},glucksmann:{value:1,note:"Propose de taxer davantage les hauts patrimoines, sans mention de l’ISF.",source:sources.sudRadio}} },
        { id:"q-fis-successions-baisse", theme:"fis", themeName:"Fiscalité", text:"Les droits de succession doivent être supprimés ou fortement réduits.", stances:{melenchon:{value:-2,note:"Propose d’augmenter les droits de succession sur les plus hauts patrimoines et de créer un héritage maximal de 12 M€.",source:sources.taxPolicy},lepen:{value:1,note:"Propose de supprimer la fiscalité sur les transmissions de TPE, PME et ETI sous condition de détention.",source:sources.rnProject},glucksmann:{value:-2,note:"Propose de taxer davantage les très grands héritages.",source:sources.sudRadio}} }
      ];
      const h1 = [
        ["Marine Le Pen",34],["Jean-Luc Mélenchon",19],["Édouard Philippe",12],["Raphaël Glucksmann",11],["David Lisnard",9],["Bruno Retailleau",5],["Éric Zemmour",3],["Marine Tondelier",2],["Dominique de Villepin",2],["Nathalie Arthaud",1],["Fabien Roussel",1],["Nicolas Dupont-Aignan",1]
      ];
      const h2 = [
        ["Marine Le Pen",35],["Jean-Luc Mélenchon",19],["Raphaël Glucksmann",12],["Gabriel Attal",9],["David Lisnard",9],["Bruno Retailleau",6],["Éric Zemmour",3],["Marine Tondelier",2],["Dominique de Villepin",2],["Nathalie Arthaud",1],["Fabien Roussel",1],["Nicolas Dupont-Aignan",1]
      ];
      const scoreLabel = value => value > 0 ? `+${value}` : `${value}`;
      const scoreClass = value => value === null ? "unknown" : String(value);
      const tbody = root.querySelector("#pt-stance-rows");
      const detailNote = root.querySelector("#pt-detail-note");
      const detailScore = root.querySelector("#pt-detail-score");
      const detailLink = root.querySelector("#pt-detail-link");
      function showDetail(question, candidateId) {
        const stance = question.stances[candidateId];
        const candidate = names[candidateId];
        if (!stance) {
          detailScore.textContent = `${candidate} · —`;
          detailNote.textContent = "Aucune position sourcée n’est enregistrée pour cette affirmation.";
          detailLink.replaceChildren();
          return;
        }
        detailScore.textContent = `${candidate} · ${scoreLabel(stance.value)}`;
        detailNote.textContent = stance.note;
        detailLink.replaceChildren();
        try {
          const url = new URL(stance.source.url);
          if (url.protocol !== "https:") return;
          const link = document.createElement("a");
          link.className = "pt-source";
          link.href = url.href;
          link.target = "_blank";
          link.rel = "noreferrer noopener";
          link.textContent = `${stance.source.title} ↗`;
          detailLink.appendChild(link);
        } catch {
          detailLink.textContent = "Lien de source indisponible.";
        }
      }
      function renderQuestions() {
        const theme = root.querySelector("#pt-theme-filter").value;
        tbody.replaceChildren();
        questions.filter(q => theme === "all" || q.theme === theme).forEach((q, index, list) => {
          if (index === 0 || list[index - 1].theme !== q.theme) {
            const group = document.createElement("tr");
            group.className = "pt-theme-row";
            const heading = document.createElement("td");
            heading.colSpan = 5;
            heading.textContent = q.themeName;
            group.appendChild(heading);
            tbody.appendChild(group);
          }
          const row = document.createElement("tr");
          const questionCell = document.createElement("td");
          questionCell.className = "pt-question";
          questionCell.textContent = q.text;
          row.appendChild(questionCell);
          const candidateIds = ["melenchon","lepen","philippe","glucksmann"];
          candidateIds.forEach(id => {
            const stance = q.stances[id];
            const value = stance ? stance.value : null;
            const label = stance ? `${names[id]} : position ${scoreLabel(value)}` : `${names[id]} : aucune position documentée`;
            const cell = document.createElement("td");
            cell.className = "pt-score-cell";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "pt-score";
            button.dataset.score = scoreClass(value);
            button.dataset.question = q.id;
            button.dataset.candidate = id;
            button.setAttribute("aria-label", label);
            button.textContent = stance ? scoreLabel(value) : "—";
            cell.appendChild(button);
            row.appendChild(cell);
          });
          tbody.appendChild(row);
        });
        tbody.querySelectorAll(".pt-score").forEach(button => button.addEventListener("click", () => {
          const question = questions.find(q => q.id === button.dataset.question);
          showDetail(question, button.dataset.candidate);
        }));
      }
      function renderPoll(hypothesis) {
        const values = hypothesis === "h1" ? h1 : h2;
        const container = root.querySelector("#pt-poll-results");
        container.replaceChildren();
        values.forEach(([name, value]) => {
          const item = document.createElement("div");
          item.className = "pt-result";
          item.setAttribute("role", "listitem");
          const label = document.createElement("span");
          label.textContent = name;
          const bar = document.createElement("progress");
          bar.className = "pt-track";
          bar.max = 50;
          bar.value = value;
          bar.setAttribute("aria-label", `${name} : ${value} %`);
          const score = document.createElement("span");
          score.className = "pt-value";
          score.textContent = `${value}%`;
          item.append(label, bar, score);
          container.appendChild(item);
        });
      }
      root.querySelectorAll("[data-tab]").forEach(tab => tab.addEventListener("click", () => {
        root.querySelectorAll("[data-tab]").forEach(item => item.setAttribute("aria-selected", String(item === tab)));
        root.querySelectorAll("[role=tabpanel]").forEach(panel => panel.classList.add("pt-hidden"));
        root.querySelector(`#pt-panel-${tab.dataset.tab}`).classList.remove("pt-hidden");
      }));
      root.querySelector("#pt-theme-filter").addEventListener("change", renderQuestions);
      root.querySelectorAll("[data-hypothesis]").forEach(button => button.addEventListener("click", () => {
        root.querySelectorAll("[data-hypothesis]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        renderPoll(button.dataset.hypothesis);
      }));
      renderQuestions();
      renderPoll("h1");
    })();
