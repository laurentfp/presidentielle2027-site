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
        {
          "id": "q-eco-smic-hausse",
          "theme": "eco",
          "themeName": "Économie et pouvoir d'achat",
          "text": "Le SMIC doit être augmenté par la loi au-delà de sa revalorisation automatique.",
          "context": "Depuis sa revalorisation au 1er juin 2026, le SMIC s'élève à 12,31 € brut de l'heure, soit 1 867,02 € brut et environ 1 477,93 € net par mois pour 35 heures hebdomadaires. Il est revalorisé automatiquement chaque 1er janvier (inflation des 20 % de ménages aux revenus les plus faibles, plus la moitié du gain de pouvoir d'achat du salaire horaire moyen des ouvriers et employés) et en cours d'année dès que les prix augmentent d'au moins 2 % ; le gouvernement peut décider d'une hausse supplémentaire (« coup de pouce »).",
          "contextSources": [
            {
              "title": "Smic (salaire minimum de croissance)",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-06-01",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F2300"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de porter le SMIC à 1 700 € nets.",
              "sources": [
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                },
                {
                  "title": "L'Avenir en commun, édition 2025 – Augmenter les salaires et réduire les inégalités salariales dans l’entreprise (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829202700/https://melenchon2027.fr/programme2025/livre/chapitre8/s4/"
                }
              ]
            },
            "philippe": {
              "value": -2,
              "note": "Qualifie une hausse du SMIC de « solution illusoire ».",
              "sources": [
                {
                  "title": "Présidentielle 2027 : \"une primaire de la division\", Édouard Philippe écarte la proposition de Gabriel Attal",
                  "publisher": "Orange Actualités (6Médias, avec L'Express)",
                  "date": "2026-11-01",
                  "url": "https://actu.orange.fr/france/presidentielle-2027-une-primaire-de-la-division-edouard-philippe-ecarte-la-proposition-de-gabriel-attal-l-express-via-6medias-CNT000002tuZdH.html"
                }
              ]
            }
          }
        },
        {
          "id": "q-eco-prix-energie-plafond",
          "theme": "eco",
          "themeName": "Économie et pouvoir d'achat",
          "text": "L'État doit plafonner ou bloquer les prix des carburants et de l'énergie.",
          "context": "Les prix des carburants ne sont pas réglementés : à la suite de la hausse liée au conflit au Moyen-Orient depuis février 2026 (gazole à environ 2,41 €/l en moyenne mi-septembre 2026), le gouvernement a écarté un blocage des prix et une baisse des taxes et a opté pour des aides ciblées (grands rouleurs, pêcheurs, transporteurs, agriculteurs). Pour l'électricité, des tarifs réglementés de vente existent : fixés sur proposition de la CRE, ils ont augmenté en moyenne de 2,5 % TTC au 1er août 2026.",
          "contextSources": [
            {
              "title": "Question écrite n° 14840 : Hausse des prix des carburants : une réponse gouvernementale insuffisante (et réponse du ministre)",
              "publisher": "Assemblée nationale",
              "date": null,
              "url": "https://questions.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE14840.pdf"
            },
            {
              "title": "Carburants à 2,41 euros : Sébastien Lecornu réunit d'urgence les acteurs de l'énergie pour faire face à la crise",
              "publisher": "Le Journal de l'Économie",
              "date": "2026-09-21",
              "url": "https://www.journaldeleconomie.fr/?p=49394"
            },
            {
              "title": "Délibération n° 2026-147 de la CRE du 15 juillet 2026 portant proposition des tarifs réglementés de vente d'électricité",
              "publisher": "Commission de régulation de l'énergie",
              "date": "2026-07-15",
              "url": "https://www.cre.fr/fileadmin/Documents/Deliberations/2026/260715_2026-147_TRVE.pdf"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de bloquer les prix des produits de première nécessité, dont l'énergie et le carburant, avec un prix du carburant ramené à 1,70 € le litre.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Créer un état d’urgence sociale (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260730211950/https://melenchon2027.fr/programme2025/livre/chapitre9/s1/"
                },
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                },
                {
                  "title": "L'Avenir en commun, édition 2025 – Organiser le 100 % d’énergies renouvelables en 2050 et la rénovation énergétique (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260821172237/https://melenchon2027.fr/programme2025/livre/chapitre13/s3/"
                }
              ]
            },
            "lepen": {
              "value": 1,
              "note": "Propose d'aligner les prix de l'électricité facturés sur les coûts de production du parc français.",
              "sources": [
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                }
              ]
            }
          }
        },
        {
          "id": "q-ent-duree-travail",
          "theme": "ent",
          "themeName": "Entreprises, travail et emploi",
          "text": "La durée légale du travail doit être portée au-delà de 35 heures par semaine.",
          "context": "La durée légale du travail est de 35 heures par semaine (1 607 heures par an) ; les heures effectuées au-delà sont des heures supplémentaires, majorées par défaut de 25 % de la 36e à la 43e heure et de 50 % au-delà, un accord collectif pouvant fixer un taux d'au moins 10 %. Le contingent annuel d'heures supplémentaires est de 220 heures par salarié, sauf accord fixant un autre volume, dans la limite de 48 heures par semaine.",
          "contextSources": [
            {
              "title": "Durée du travail d'un salarié à temps plein",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2025-09-25",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F1911"
            },
            {
              "title": "Heures supplémentaires d'un salarié du secteur privé",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-06-08",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F2391"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose de rétablir la durée légale de 35 heures et de passer aux 32 heures dans les métiers pénibles ou de nuit.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Réduire le temps de travail et faire naître une société du temps choisi (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829202700/https://melenchon2027.fr/programme2025/livre/chapitre8/s2/"
                }
              ]
            },
            "philippe": {
              "value": 2,
              "note": "Propose de sortir de la durée légale de 35 heures.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus prospère »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-prospere"
                }
              ]
            }
          }
        },
        {
          "id": "q-ent-licenciements-interdits",
          "theme": "ent",
          "themeName": "Entreprises, travail et emploi",
          "text": "Les licenciements économiques doivent être interdits.",
          "context": "Le Code du travail autorise le licenciement pour motif économique, c'est-à-dire pour un motif non lié à la personne du salarié, lorsqu'il résulte de difficultés économiques, de mutations technologiques, d'une réorganisation nécessaire à la sauvegarde de la compétitivité ou de la cessation d'activité de l'entreprise.",
          "contextSources": [
            {
              "title": "Qu'est-ce qu'un licenciement pour motif économique ?",
              "publisher": "Code du travail numérique (ministère du Travail) / Service-Public.fr",
              "date": "2026-05-22",
              "url": "https://code.travail.gouv.fr/fiche-service-public/quest-ce-quun-licenciement-pour-motif-economique"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 1,
              "note": "Propose d'interdire les licenciements boursiers et économiques dans les entreprises qui versent des dividendes ou bénéficient d'aides de l'État.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Définanciariser l’économie réelle (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260905143642/https://melenchon2027.fr/programme2025/livre/chapitre6/s3/"
                },
                {
                  "title": "L'Avenir en commun, édition 2025 – Reconnaître la citoyenneté dans l’entreprise et des droits nouveaux aux salariés (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829200813/https://melenchon2027.fr/programme2025/livre/chapitre3/s1/"
                }
              ]
            }
          }
        },
        {
          "id": "q-fis-isf",
          "theme": "fis",
          "themeName": "Fiscalité",
          "text": "L'impôt de solidarité sur la fortune (ISF) doit être rétabli.",
          "context": "L'impôt de solidarité sur la fortune (ISF) a été abrogé par la loi de finances pour 2018 et remplacé par l'impôt sur la fortune immobilière (IFI), qui ne porte que sur le patrimoine immobilier non professionnel. L'IFI est dû lorsque ce patrimoine net taxable dépasse 1,3 million d'euros au 1er janvier, avec un barème de 0,5 % à 1,5 %.",
          "contextSources": [
            {
              "title": "PAT - ISF - Assiette (BOI-PAT-ISF-30)",
              "publisher": "BOFiP-Impôts (DGFiP)",
              "date": "2018-10-11",
              "url": "https://bofip.impots.gouv.fr/node/9960"
            },
            {
              "title": "Calcul de l'impôt sur la fortune immobilière (IFI)",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-03-06",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F138"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de rétablir et de renforcer l'ISF, avec un volet climatique.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Faire la révolution fiscale (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829203005/https://melenchon2027.fr/programme2025/livre/chapitre6/s5/"
                },
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                }
              ]
            },
            "lepen": {
              "value": 0,
              "note": "Propose de remplacer l'IFI par un impôt sur la fortune financière, qu'elle distingue de l'ISF.",
              "sources": [
                {
                  "title": "Contre-budget 2026 (base PLF 2026), conférence de presse du 23 octobre 2025",
                  "publisher": "Rassemblement national",
                  "date": "2025-10-23",
                  "url": "https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf"
                },
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                }
              ]
            },
            "glucksmann": {
              "value": 1,
              "note": "Propose de taxer davantage les hauts patrimoines, sans mention de l'ISF.",
              "sources": [
                {
                  "title": "Primaire de la gauche : Mélenchon toujours au centre des débats",
                  "publisher": "Sud Radio",
                  "date": "2026-10-04",
                  "url": "https://www.sudradio.fr/societe/un-dernier-debat-pour-departager-les-candidats-de-la-primaire-de-la-gauche"
                }
              ]
            }
          }
        },
        {
          "id": "q-fis-successions-baisse",
          "theme": "fis",
          "themeName": "Fiscalité",
          "text": "Les droits de succession doivent être supprimés ou fortement réduits.",
          "context": "En ligne directe, chaque enfant bénéficie d'un abattement de 100 000 € sur la part reçue de chacun de ses parents, puis d'un barème progressif allant de 5 % à 45 % (taux maximal au-delà d'environ 1,8 million d'euros par part taxable). Le conjoint survivant et le partenaire de Pacs sont exonérés de droits de succession.",
          "contextSources": [
            {
              "title": "Droits de succession : évaluation et calcul",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-02-09",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F14198"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose d'augmenter les droits de succession sur les plus hauts patrimoines et de créer un héritage maximal de 12 M€.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Faire la révolution fiscale (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829203005/https://melenchon2027.fr/programme2025/livre/chapitre6/s5/"
                },
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                }
              ]
            },
            "lepen": {
              "value": 1,
              "note": "Propose de supprimer la fiscalité sur les transmissions de TPE, PME et ETI en contrepartie d'une détention d'au moins dix ans.",
              "sources": [
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                }
              ]
            },
            "glucksmann": {
              "value": -2,
              "note": "Propose de taxer davantage les très grands héritages.",
              "sources": [
                {
                  "title": "Primaire de la gauche : Mélenchon toujours au centre des débats",
                  "publisher": "Sud Radio",
                  "date": "2026-10-04",
                  "url": "https://www.sudradio.fr/societe/un-dernier-debat-pour-departager-les-candidats-de-la-primaire-de-la-gauche"
                }
              ]
            }
          }
        },
        {
          "id": "q-fin-regle-or",
          "theme": "fin",
          "themeName": "Finances publiques et dette",
          "text": "Une règle interdisant le déficit public doit être inscrite dans la Constitution.",
          "context": "Selon l'INSEE, le déficit public de la France a atteint 5,1 % du PIB en 2025 (152,5 milliards d'euros), après 5,8 % en 2024, et la dette publique s'élevait à 115,7 % du PIB fin 2025.",
          "contextSources": [
            {
              "title": "Le compte des administrations publiques en 2025 (Insee Première n° 2106)",
              "publisher": "INSEE",
              "date": "2026-05-29",
              "url": "https://www.insee.fr/fr/statistiques/8997691"
            }
          ],
          "stances": {
            "lepen": {
              "value": 2,
              "note": "Propose d'inscrire une règle d'or dans la Constitution par référendum.",
              "sources": [
                {
                  "title": "140 milliards d’euros d’économies d’ici 2032 : « l’effort radical » proposé par Marine Le Pen pour « redresser » les finances publiques",
                  "publisher": "Public Sénat",
                  "date": "2026-10-06",
                  "url": "https://www.publicsenat.fr/actualites/politique/140-milliards-deuros-deconomies-dici-2032-leffort-radical-propose-par-marine-le-pen-pour-redresser-les-f"
                }
              ]
            },
            "philippe": {
              "value": 2,
              "note": "Propose d'adopter une règle d'or budgétaire par référendum.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus prospère »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-prospere"
                }
              ]
            }
          }
        },
        {
          "id": "q-fin-fonctionnaires-baisse",
          "theme": "fin",
          "themeName": "Finances publiques et dette",
          "text": "Le nombre d'agents de la fonction publique doit être réduit.",
          "context": "Fin 2024, la fonction publique employait environ 5,9 millions d'agents en France (hors Mayotte, contrats aidés inclus) : 2,59 millions dans la fonction publique de l'État, 2,04 millions dans la territoriale et 1,25 million dans l'hospitalière. La hausse de 2024 est portée par les contractuels, le nombre de fonctionnaires étant quasi stable.",
          "contextSources": [
            {
              "title": "L'emploi dans la fonction publique en 2024 (Insee Première n° 2094)",
              "publisher": "INSEE",
              "date": "2026-02-10",
              "url": "https://www.insee.fr/fr/statistiques/8732435"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose des recrutements dans la fonction publique, dont 10 000 postes dans l'Éducation nationale et 10 000 postes de soignants à l'hôpital en 2027.",
              "sources": [
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                },
                {
                  "title": "L'Avenir en commun, édition 2025 – En finir avec la souffrance au travail (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829202703/https://melenchon2027.fr/programme2025/livre/chapitre8/s7/"
                }
              ]
            },
            "lepen": {
              "value": 1,
              "note": "Son programme budgétaire prévoit de réduire d'au moins 200 000 postes les effectifs d'agences et d'organismes publics en cinq ans.",
              "sources": [
                {
                  "title": "Présidentielle : en quête de crédibilité budgétaire, Le Pen promet un « effort radical » de « 140 milliards net »",
                  "publisher": "Sud Radio",
                  "date": "2026-10-06",
                  "url": "https://www.sudradio.fr/societe/presidentielle-en-quete-de-credibilite-budgetaire-le-pen-promet-un-effort-radical-de-140-milliards-net"
                }
              ]
            },
            "philippe": {
              "value": 2,
              "note": "Propose de ne pas remplacer un départ de fonctionnaire sur trois.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus prospère »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-prospere"
                }
              ]
            }
          }
        },
        {
          "id": "q-ret-age-62",
          "theme": "ret",
          "themeName": "Retraites et protection sociale",
          "text": "L'âge légal de départ à la retraite doit revenir à 62 ans ou moins.",
          "context": "La réforme de 2023 relève progressivement l'âge légal de départ à 64 ans, mais la loi de financement de la sécurité sociale pour 2026 a suspendu jusqu'en 2028 la hausse de l'âge et de la durée d'assurance pour les départs à partir du 1er septembre 2026. L'âge légal est ainsi compris entre 62 ans et 9 mois et 63 ans et 9 mois pour les générations 1964 à 1968, et reste fixé à 64 ans à partir de la génération 1969.",
          "contextSources": [
            {
              "title": "Suspension de la réforme des retraites : qui est concerné ?",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-02-27",
              "url": "https://www.service-public.gouv.fr/particuliers/actualites/A18825"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose d'abroger la réforme de 2023, puis de revenir à la retraite à 60 ans avec 40 annuités.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Réduire le temps de travail et faire naître une société du temps choisi (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829202700/https://melenchon2027.fr/programme2025/livre/chapitre8/s2/"
                },
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose un âge de départ à 62 ans, 60 ans pour les carrières commencées avant 20 ans.",
              "sources": [
                {
                  "title": "Retraites, dette de l’Etat : Marine Le Pen présente ses réformes économiques",
                  "publisher": "Sud Radio",
                  "date": "2026-08-28",
                  "url": "https://www.sudradio.fr/societe/marine-le-pen-et-la-delicate-operation-seduction-du-monde-economique"
                }
              ]
            },
            "philippe": {
              "value": -2,
              "note": "Propose de porter l'âge légal à 65 ans.",
              "sources": [
                {
                  "title": "Retraites: Édouard Philippe veut porter l’âge de départ à 65 ans et la durée de cotisation à 45 ans",
                  "publisher": "LCP",
                  "date": "2026-09-30",
                  "url": "https://lcp.fr/actualites/retraites-edouard-philippe-veut-porter-l-age-de-depart-a-65-ans-et-la-duree-de"
                }
              ]
            },
            "glucksmann": {
              "value": 2,
              "note": "Propose de ramener l'âge légal à 62 ans.",
              "sources": [
                {
                  "title": "Glucksmann, Faure, Royal, Maurel, Guedj: quelles différences entre les candidats à la primaire socialiste?",
                  "publisher": "LCP",
                  "date": "2026-10-09",
                  "url": "https://lcp.fr/actualites/glucksmann-faure-royal-maurel-guedj-quelles-differences-entre-les-candidats-a-la"
                }
              ]
            }
          }
        },
        {
          "id": "q-ret-capitalisation",
          "theme": "ret",
          "themeName": "Retraites et protection sociale",
          "text": "Une part de retraite par capitalisation doit compléter le système par répartition.",
          "context": "Les retraites obligatoires de base et complémentaires fonctionnent par répartition ; l'épargne retraite par capitalisation passe par le plan d'épargne retraite (PER), individuel ou d'entreprise. Fin 2025, les PER totalisaient 150,4 milliards d'euros d'encours pour 12,9 millions de titulaires.",
          "contextSources": [
            {
              "title": "Le Plan d'Épargne Retraite (PER) franchit le cap des 150 milliards d'euros d'encours",
              "publisher": "Direction générale du Trésor",
              "date": "2026-06-05",
              "url": "https://www.tresor.economie.gouv.fr/Articles/2026/06/05/le-plan-d-epargne-retraire-per-franchit-le-cap-des-150-milliards-d-euros-d-encours"
            }
          ],
          "stances": {
            "lepen": {
              "value": 1,
              "note": "Propose un « pilier de capitalisation », sans chiffrage publié.",
              "sources": [
                {
                  "title": "140 milliards d’euros d’économies d’ici 2032 : « l’effort radical » proposé par Marine Le Pen pour « redresser » les finances publiques",
                  "publisher": "Public Sénat",
                  "date": "2026-10-06",
                  "url": "https://www.publicsenat.fr/actualites/politique/140-milliards-deuros-deconomies-dici-2032-leffort-radical-propose-par-marine-le-pen-pour-redresser-les-f"
                },
                {
                  "title": "Présidentielle : en quête de crédibilité budgétaire, Le Pen promet un « effort radical » de « 140 milliards net »",
                  "publisher": "Sud Radio",
                  "date": "2026-10-06",
                  "url": "https://www.sudradio.fr/societe/presidentielle-en-quete-de-credibilite-budgetaire-le-pen-promet-un-effort-radical-de-140-milliards-net"
                }
              ]
            },
            "philippe": {
              "value": 2,
              "note": "Propose un étage de capitalisation collective et obligatoire.",
              "sources": [
                {
                  "title": "Retraites: Édouard Philippe veut porter l’âge de départ à 65 ans et la durée de cotisation à 45 ans",
                  "publisher": "LCP",
                  "date": "2026-09-30",
                  "url": "https://lcp.fr/actualites/retraites-edouard-philippe-veut-porter-l-age-de-depart-a-65-ans-et-la-duree-de"
                }
              ]
            }
          }
        },
        {
          "id": "q-edu-examen-sixieme",
          "theme": "edu",
          "themeName": "Éducation et enseignement supérieur",
          "text": "Un examen doit conditionner le passage de l'école primaire au collège.",
          "context": "Aucun examen ne conditionne l'entrée au collège : en fin d'école élémentaire, le conseil des maîtres se prononce sur le passage en classe supérieure, un redoublement restant possible et contestable devant une commission départementale. Au collège, le projet de rendre le brevet obligatoire pour entrer en seconde a été abandonné en 2025 : l'examen doit être passé, mais le passage en seconde est décidé par le conseil de classe.",
          "contextSources": [
            {
              "title": "École maternelle ou élémentaire : passage, redoublement ou saut de classe",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2025-10-20",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F32111"
            },
            {
              "title": "Collège : le brevet ne sera finalement pas obligatoire pour entrer en seconde",
              "publisher": "Brut (dépêche AFP)",
              "date": "2025-11-17",
              "url": "https://www.brut.media/fr/articles/college-le-brevet-ne-sera-finalement-pas-obligatoire-pour-entrer-en-seconde"
            }
          ],
          "stances": {}
        },
        {
          "id": "q-edu-effectifs-classe",
          "theme": "edu",
          "themeName": "Éducation et enseignement supérieur",
          "text": "Le nombre d'élèves par classe doit être réduit, quitte à recruter davantage d'enseignants.",
          "context": "À la rentrée 2025, les classes des écoles publiques comptaient en moyenne 21,3 élèves en maternelle et 20,7 en élémentaire, en baisse pour la neuvième année consécutive. Au collège, la taille moyenne des classes était de 25,7 élèves (23,5 élèves par enseignant en tenant compte des cours en groupes).",
          "contextSources": [
            {
              "title": "À l'école primaire, la taille des classes diminue, le nombre de classes rurales s'érode",
              "publisher": "Banque des Territoires (d'après la note d'information DEPP n° 26.01)",
              "date": "2026-01-13",
              "url": "https://www.banquedesterritoires.fr/lecole-primaire-la-taille-des-classes-diminue-le-nombre-de-classes-rurales-serode"
            },
            {
              "title": "Le nombre d'élèves devant un enseignant dans le second degré à la rentrée 2025 : moins d'élèves dans les structures des formations professionnelles (Note d'information n° 26.38)",
              "publisher": "DEPP, ministère de l'Éducation nationale",
              "date": null,
              "url": "https://www.education.gouv.fr/sites/default/files/document/note-d-information-2638-519994.pdf"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de réduire les effectifs pour faire mieux que la moyenne européenne de 19 élèves par classe, avec 10 000 postes ouverts en 2027.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Reconstruire une école globale pour l’égalité et l’émancipation (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260830154224/https://melenchon2027.fr/programme2025/livre/chapitre5/s3/"
                },
                {
                  "title": "Comment nous allons remettre de l'ordre dans les comptes publics",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-10-14",
                  "url": "https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf"
                }
              ]
            },
            "philippe": {
              "value": 1,
              "note": "Propose de réduire les effectifs par classe en maternelle et en primaire.",
              "sources": [
                {
                  "title": "Pour une France plus attentive à ses enfants",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-attentive-a-ses-enfants"
                }
              ]
            },
            "glucksmann": {
              "value": 2,
              "note": "Propose de baisser le nombre d'élèves par classe en primaire et de mieux payer les enseignants.",
              "sources": [
                {
                  "title": "Fiscalité, école, immigration : ce que propose Raphaël Glucksmann",
                  "publisher": "Public Sénat",
                  "date": "2026-08-24",
                  "url": "https://www.publicsenat.fr/actualites/politique/fiscalite-ecole-immigration-ce-que-propose-raphael-glucksmann"
                }
              ]
            }
          }
        },
        {
          "id": "q-san-ame",
          "theme": "san",
          "themeName": "Santé",
          "text": "L'aide médicale de l'État (AME) doit être limitée aux soins urgents ou supprimée.",
          "context": "L'aide médicale de l'État (AME) prend en charge les soins des étrangers en situation irrégulière résidant en France depuis plus de trois mois, sous condition de ressources (10 421 € par an pour une personne seule en métropole), avec un délai de neuf mois pour certains soins non urgents. Fin 2024, elle comptait 465 208 bénéficiaires pour une dépense de 1,255 milliard d'euros ; deux décrets publiés en février 2026 ont renforcé les justificatifs exigés et les contrôles, sans modifier le panier de soins.",
          "contextSources": [
            {
              "title": "Aide médicale de l'État (AME)",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-04-01",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F3079"
            },
            {
              "title": "Projet de loi de finances pour 2026 – Note de présentation – Mission « Santé »",
              "publisher": "Sénat, commission des finances",
              "date": "2025-11-14",
              "url": "https://www.senat.fr/fileadmin/cru-1762483659/Commissions/Finances/2025-2026/PLF_2026/NP/Sante_PLF_2026_NP.pdf"
            },
            {
              "title": "Réforme de l'AME : contrôles renforcés et règles durcies pour l'aide médicale",
              "publisher": "Économie Matin",
              "date": "2026-02-09",
              "url": "https://www.economiematin.fr/reforme-ame-sante-aide-immigration-demande"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose de garantir l'accès à l'aide médicale de l'État.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Pour une politique migratoire humaniste et réaliste (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260821172156/https://melenchon2027.fr/programme2025/livre/chapitre16/s7/"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose de transformer l'AME en aide médicale d'urgence.",
              "sources": [
                {
                  "title": "Contre-budget 2026 (base PLF 2026), conférence de presse du 23 octobre 2025",
                  "publisher": "Rassemblement national",
                  "date": "2025-10-23",
                  "url": "https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf"
                }
              ]
            }
          }
        },
        {
          "id": "q-san-pole-public-medicament",
          "theme": "san",
          "themeName": "Santé",
          "text": "La France doit créer un pôle public de production de médicaments.",
          "context": "En 2025, l'ANSM a géré 3 887 signalements de ruptures ou de risques de rupture de stock de médicaments (dont 399 ruptures avérées), contre 3 825 en 2024.",
          "contextSources": [
            {
              "title": "Une mobilisation constante pour assurer la disponibilité des produits de santé (Rapport d'activité 2025)",
              "publisher": "ANSM",
              "date": "2026-07-08",
              "url": "https://ansm.sante.fr/qui-sommes-nous/rapport-dactivite-2025/rapport-dactivite-2025/p/une-mobilisation-constante-pour-assurer-la-disponibilite-des-produits-de-sante"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de créer un pôle public du médicament.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – S’organiser pour faire face aux pandémies (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260606164247/https://melenchon2027.fr/programme2025/livre/chapitre15/s1/"
                }
              ]
            }
          }
        },
        {
          "id": "q-def-otan-sortie",
          "theme": "def",
          "themeName": "Défense",
          "text": "La France doit quitter l'OTAN ou son commandement militaire intégré.",
          "context": "La France est l'un des douze membres fondateurs de l'OTAN en 1949 ; elle s'est retirée du commandement militaire intégré en 1966 tout en restant membre de l'Alliance, puis l'a réintégré en 2009 (annonce au sommet de Strasbourg-Kehl).",
          "contextSources": [
            {
              "title": "La France et l'OTAN",
              "publisher": "France Diplomatie (ministère de l'Europe et des Affaires étrangères)",
              "date": "2026-09-07",
              "url": "https://www.diplomatie.gouv.fr/fr/le-ministere-en-action/agir-pour-la-paix-et-le-respect-des-droits-de-l-homme/agir-pour-la-securite-le-desarmement-et-la-non-proliferation/nos-alliances-et-cooperations/la-france-et-l-otan"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de se retirer immédiatement du commandement intégré de l'OTAN puis, par étapes, de l'organisation.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Assumer l’indépendance de la France dans le monde (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260826085650/https://melenchon2027.fr/programme2025/livre/chapitre16/s1/"
                }
              ]
            },
            "lepen": {
              "value": 1,
              "note": "Propose de quitter le commandement intégré, mais pas tant que dure la guerre en Ukraine.",
              "sources": [
                {
                  "title": "Le Pen Rules Out Ukraine Funding as Russia Targets French Election",
                  "publisher": "Kyiv Post",
                  "date": "2026-09-24",
                  "url": "https://kyivpost.com/post/85353"
                }
              ]
            }
          }
        },
        {
          "id": "q-def-budget-hausse",
          "theme": "def",
          "themeName": "Défense",
          "text": "Le budget de la défense doit continuer d'augmenter fortement dans les prochaines années.",
          "context": "La loi du 16 août 2026 actualisant la programmation militaire 2024-2030 ajoute 36 milliards d'euros sur 2026-2030 et porte les crédits de la mission Défense à 57,1 milliards d'euros en 2026 et 75,7 milliards en 2030, avec l'objectif de passer d'un effort de défense de 2 % du PIB en 2025 à au moins 2,5 % en 2030 et 3,5 % à l'horizon 2035. Au sommet de La Haye (juin 2025), les Alliés de l'OTAN se sont engagés à consacrer 5 % du PIB à la défense et à la sécurité d'ici 2035, dont au moins 3,5 % aux besoins de défense essentiels.",
          "contextSources": [
            {
              "title": "Loi n° 2026-791 du 16 août 2026 actualisant la programmation militaire pour les années 2024 à 2030 et portant diverses dispositions intéressant la défense (JORF du 18 août 2026)",
              "publisher": "Journal officiel (copie hébergée par la FHF)",
              "date": "2026-08-18",
              "url": "https://www.fhf.fr/sites/default/files/2026-08/Loi%20n%C2%B02026-791%20-%20programmation%20militaire_3.pdf"
            },
            {
              "title": "The Hague Summit Declaration",
              "publisher": "OTAN",
              "date": "2025-06-25",
              "url": "https://www.nato.int/en/about-us/official-texts-and-resources/official-texts/2025/06/25/the-hague-summit-declaration"
            }
          ],
          "stances": {
            "philippe": {
              "value": 1,
              "note": "Propose une nouvelle loi de programmation militaire « de la massification », au-delà de la loi en cours.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus sûre »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-sure"
                }
              ]
            }
          }
        },
        {
          "id": "q-eur-majorite",
          "theme": "eur",
          "themeName": "Europe",
          "text": "L'Union européenne doit décider davantage à la majorité, en supprimant le droit de veto des États.",
          "context": "Le Conseil de l'Union européenne adopte la plupart des actes législatifs à la majorité qualifiée, qui requiert 55 % des États membres (15 sur 27) représentant au moins 65 % de la population de l'UE. L'unanimité reste exigée notamment pour la politique étrangère et de défense, la fiscalité, l'adhésion de nouveaux États, le cadre financier pluriannuel et les ressources propres, et la révision des traités.",
          "contextSources": [
            {
              "title": "Unanimité ou majorité : comment l'Union européenne adopte-t-elle ses décisions ?",
              "publisher": "Toute l'Europe",
              "date": "2022-05-12",
              "url": "https://www.touteleurope.eu/fonctionnement-de-l-ue/unanimite-majorite-qualifiee-minorite-de-blocage-comment-les-decisions-sont-elles-prises-en-europ/"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -1,
              "note": "Propose d'utiliser le droit de veto de la France, notamment contre tout nouvel accord de libre-échange et tout nouvel élargissement.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Utiliser tous les leviers d’action face aux institutions européennes (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260826110548/https://melenchon2027.fr/programme2025/livre/chapitre17/s1/"
                }
              ]
            },
            "glucksmann": {
              "value": 2,
              "note": "Propose de supprimer le droit de veto des États membres.",
              "sources": [
                {
                  "title": "Présidentielle: Raphaël Glucksmann dévoile les premières lignes de son possible programme",
                  "publisher": "LCP",
                  "date": "2026-05-26",
                  "url": "https://lcp.fr/actualites/presidentielle-raphael-glucksmann-devoile-les-premieres-lignes-de-son-possible-programme"
                }
              ]
            }
          }
        },
        {
          "id": "q-eur-sortie-ue",
          "theme": "eur",
          "themeName": "Europe",
          "text": "La France doit sortir de l'Union européenne.",
          "context": "L'article 50 du traité sur l'Union européenne permet à un État membre de se retirer de l'Union : après notification au Conseil européen, un accord de retrait est négocié ; à défaut d'accord, le retrait intervient deux ans après la notification, délai prolongeable à l'unanimité. Le Royaume-Uni, seul État à avoir utilisé cette procédure, a quitté l'UE le 31 janvier 2020.",
          "contextSources": [
            {
              "title": "Comment un pays peut-il quitter l'Union européenne ?",
              "publisher": "Toute l'Europe",
              "date": null,
              "url": "https://www.touteleurope.eu/fonctionnement-de-l-ue/comment-un-pays-peut-il-quitter-l-union-europeenne/"
            },
            {
              "title": "Le Brexit en 3 minutes",
              "publisher": "Toute l'Europe",
              "date": null,
              "url": "https://www.touteleurope.eu/fonctionnement-de-l-ue/le-brexit-en-3-minutes/"
            }
          ],
          "stances": {
            "lepen": {
              "value": -2,
              "note": "Sa proposition de loi constitutionnelle de 2024 indique que « la sortie de l'Union européenne n'est nullement à l'ordre du jour ».",
              "sources": [
                {
                  "title": "Proposition de loi constitutionnelle Citoyenneté-Identité-Immigration (n° 2120), présentée par Mme Marine Le Pen et les membres du groupe Rassemblement national",
                  "publisher": "Assemblée nationale",
                  "date": "2024-01-25",
                  "url": "https://www.assemblee-nationale.fr/dyn/16/textes/l16b2120_proposition-loi.pdf"
                }
              ]
            },
            "glucksmann": {
              "value": -1,
              "note": "Propose de supprimer le droit de veto des États membres au sein de l'Union européenne.",
              "sources": [
                {
                  "title": "Présidentielle: Raphaël Glucksmann dévoile les premières lignes de son possible programme",
                  "publisher": "LCP",
                  "date": "2026-05-26",
                  "url": "https://lcp.fr/actualites/presidentielle-raphael-glucksmann-devoile-les-premieres-lignes-de-son-possible-programme"
                }
              ]
            }
          }
        },
        {
          "id": "q-etr-ukraine-soutien",
          "theme": "etr",
          "themeName": "Politique étrangère",
          "text": "La France doit continuer à fournir une aide militaire à l'Ukraine.",
          "context": "Selon le ministère des Armées, la France a consacré 8,6 milliards d'euros au soutien à l'Ukraine entre février 2022 et fin 2024, dont 5,9 milliards d'euros de soutien militaire (cessions d'armes, maintien en condition, formation). Un accord bilatéral de sécurité signé le 16 février 2024 pour dix ans prévoyait jusqu'à 3 milliards d'euros d'aide militaire supplémentaire en 2024.",
          "contextSources": [
            {
              "title": "Amendement n° II-DN92 au projet de loi de finances pour 2026 (citant le rapport au Parlement 2025 sur les exportations d'armement)",
              "publisher": "Assemblée nationale",
              "date": "2025-10-25",
              "url": "https://www.assemblee-nationale.fr/dyn/17/amendements/1906C/CION_DEF/DN92.pdf"
            },
            {
              "title": "Visite de Volodymyr Zelensky, Président de l'Ukraine",
              "publisher": "Présidence de la République",
              "date": "2024-02-16",
              "url": "https://www.elysee.fr/emmanuel-macron/2024/02/16/visite-de-volodymyr-zelensky-president-de-lukraine"
            }
          ],
          "stances": {
            "lepen": {
              "value": 1,
              "note": "Propose de continuer à former et équiper les soldats ukrainiens, mais d'arrêter l'aide financière six mois après son élection.",
              "sources": [
                {
                  "title": "France can provide defense aid to Ukraine but should scale back financial support, Le Pen says",
                  "publisher": "The Kyiv Independent",
                  "date": "2026-09-17",
                  "url": "https://kyivindependent.com/france-can-provide-defense-aid-to-ukraine-but-should-scale-back-financial-support-le-pen-says/"
                },
                {
                  "title": "Le Pen Rules Out Ukraine Funding as Russia Targets French Election",
                  "publisher": "Kyiv Post",
                  "date": "2026-09-24",
                  "url": "https://kyivpost.com/post/85353"
                },
                {
                  "title": "Présidentielle française - Si elle arrive à l’Elysée, Marine Le Pen promet de couper l’aide à l’Ukraine : \"Je ne prends personne en traître\"",
                  "publisher": "Paris Match Belgique",
                  "date": "2026-10-14",
                  "url": "https://www.parismatch.be/actualites/monde/2026/10/15/presidentielle-francaise-si-elle-arrive-a-lelysee-marine-le-pen-promet-de-couper-laide-a-lukraine-je-ne-prends-personne-en-traitre-EKOIX7JLGZBBTPVJXNLDVDTVXY/"
                }
              ]
            },
            "philippe": {
              "value": 1,
              "note": "Se prononce pour le soutien à l'Ukraine.",
              "sources": [
                {
                  "title": "Édouard Philippe mise sur le travail",
                  "publisher": "Euronews",
                  "date": "2026-10-09",
                  "url": "https://fr.euronews.com/2026/10/09/presidentielle-2027-edouard-philippe-mise-sur-le-travail-et-la-reduction-des-depenses-publ"
                }
              ]
            },
            "glucksmann": {
              "value": 2,
              "note": "Propose de renforcer l'aide à l'Ukraine, financée par la saisie des avoirs russes.",
              "sources": [
                {
                  "title": "Glucksmann, Faure, Royal, Maurel, Guedj: quelles différences entre les candidats à la primaire socialiste?",
                  "publisher": "LCP",
                  "date": "2026-10-09",
                  "url": "https://lcp.fr/actualites/glucksmann-faure-royal-maurel-guedj-quelles-differences-entre-les-candidats-a-la"
                }
              ]
            }
          }
        },
        {
          "id": "q-etr-accord-algerie-1968",
          "theme": "etr",
          "themeName": "Politique étrangère",
          "text": "L'accord franco-algérien de 1968 sur la circulation et le séjour doit être dénoncé.",
          "context": "L'accord franco-algérien du 27 décembre 1968, modifié par trois avenants (1985, 1994, 2001), soumet le séjour et le travail des ressortissants algériens à un régime spécifique distinct du droit commun des étrangers (certificats de résidence d'un an ou de dix ans). Le 30 octobre 2025, l'Assemblée nationale a adopté par 185 voix contre 184 une résolution, sans valeur contraignante, demandant sa dénonciation ; le gouvernement s'est prononcé pour une renégociation.",
          "contextSources": [
            {
              "title": "Accord franco-algérien du 27 décembre 1968 (exposé des motifs de la proposition de résolution n° 772)",
              "publisher": "Sénat",
              "date": "2023-06-26",
              "url": "https://www.senat.fr/leg/exposes-des-motifs/ppr22-772-expose.html"
            },
            {
              "title": "Accord franco-algérien de 1968 : l'Assemblée nationale adopte pour la première fois un texte du Rassemblement national",
              "publisher": "Le Club des juristes",
              "date": "2025-10-30",
              "url": "https://www.leclubdesjuristes.com/en-bref/accord-franco-algerien-de-1968-lassemblee-nationale-adopte-pour-la-premiere-fois-un-texte-du-rassemblement-national-12698/"
            },
            {
              "title": "Accord franco-algérien de 1968 : Sébastien Lecornu favorable à une renégociation",
              "publisher": "Le Club des juristes",
              "date": "2025-10-31",
              "url": "https://www.leclubdesjuristes.com/en-bref/accord-franco-algerien-de-1968-sebastien-lecornu-favorable-a-une-renegociation-12727/"
            }
          ],
          "stances": {
            "lepen": {
              "value": 2,
              "note": "Propose de mettre fin à l'accord franco-algérien de 1968.",
              "sources": [
                {
                  "title": "Contre-budget 2026 (base PLF 2026), conférence de presse du 23 octobre 2025",
                  "publisher": "Rassemblement national",
                  "date": "2025-10-23",
                  "url": "https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf"
                }
              ]
            },
            "philippe": {
              "value": 2,
              "note": "Propose de dénoncer l'accord de 1968.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus sûre »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-sure"
                }
              ]
            }
          }
        },
        {
          "id": "q-imm-regularisation",
          "theme": "imm",
          "themeName": "Immigration",
          "text": "Les étrangers sans titre de séjour qui travaillent en France doivent être régularisés.",
          "context": "La régularisation des étrangers sans titre de séjour relève de l'admission exceptionnelle au séjour, décidée au cas par cas par les préfets ; une circulaire de janvier 2025 en a durci les conditions et 28 610 personnes ont été régularisées en 2025, soit environ 10 % de moins qu'en 2024. La loi du 26 janvier 2024 a créé, à titre expérimental jusqu'au 31 décembre 2026, une voie de régularisation pour les travailleurs des métiers en tension (trois ans de résidence et douze mois d'activité dans un tel métier sur les 24 derniers mois), qui ne constitue pas un droit opposable.",
          "contextSources": [
            {
              "title": "Immigration : titres de séjour en nette hausse et régularisations en baisse sur l'année 2025",
              "publisher": "Public Sénat",
              "date": "2026-01-27",
              "url": "https://www.publicsenat.fr/actualites/societe/immigration-titres-de-sejour-en-nette-hausse-et-regularisations-en-baisse-sur-lannee-2025"
            },
            {
              "title": "Question écrite n° 6781 : Mise en œuvre de l'article L. 435-4 du CESEDA relatif aux métiers en tension (et réponse du ministère de l'Intérieur)",
              "publisher": "Assemblée nationale",
              "date": null,
              "url": "https://www.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE6781.pdf"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de régulariser les travailleurs, les étudiants et les parents d'enfants scolarisés.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Pour une politique migratoire humaniste et réaliste (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260821172156/https://melenchon2027.fr/programme2025/livre/chapitre16/s7/"
                }
              ]
            },
            "lepen": {
              "value": -2,
              "note": "Propose d'interdire en principe les régularisations, sauf décision individuelle exceptionnelle en Conseil des ministres.",
              "sources": [
                {
                  "title": "Proposition de loi constitutionnelle Citoyenneté-Identité-Immigration (n° 2120), présentée par Mme Marine Le Pen et les membres du groupe Rassemblement national",
                  "publisher": "Assemblée nationale",
                  "date": "2024-01-25",
                  "url": "https://www.assemblee-nationale.fr/dyn/16/textes/l16b2120_proposition-loi.pdf"
                },
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                }
              ]
            },
            "philippe": {
              "value": -1,
              "note": "Propose qu'aucun État européen ne puisse engager seul une régularisation massive sans l'accord de ses partenaires.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus prospère »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-prospere"
                }
              ]
            }
          }
        },
        {
          "id": "q-imm-droit-du-sol",
          "theme": "imm",
          "themeName": "Immigration",
          "text": "Le droit du sol doit être supprimé ou restreint.",
          "context": "Un enfant né en France de parents étrangers devient français à 18 ans s'il réside en France et y a résidé au moins cinq ans depuis l'âge de 11 ans ; il peut le devenir par déclaration dès 13 ans (à la demande de ses parents) ou dès 16 ans. À Mayotte, une loi du 12 mai 2025, dont les textes d'application ont été publiés en mai 2026, exige en outre que les deux parents aient résidé régulièrement en France depuis plus d'un an à la naissance (contre un parent et trois mois auparavant).",
          "contextSources": [
            {
              "title": "Nationalité française d'un enfant né en France de parents étrangers",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2025-08-19",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F295"
            },
            {
              "title": "Durcissement du droit du sol à Mayotte : le dispositif réglementaire est à présent complet",
              "publisher": "Maire-info",
              "date": "2026-05-05",
              "url": "https://www.maire-info.com/mayotte/durcissement-du-droit-du-sol-%C3%A0-mayotte-le-dispositif-reglementaire-est-%C3%A0-present-complet-article-30760"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose de garantir le droit du sol intégral et de le rétablir sur l'ensemble du territoire.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Une République universaliste contre le racisme et les discriminations (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-03-23",
                  "url": "https://web.archive.org/web/20260829203154/https://melenchon2027.fr/programme2025/livre/chapitre10/s2/"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose de supprimer le droit du sol au profit de la seule filiation.",
              "sources": [
                {
                  "title": "Proposition de loi constitutionnelle Citoyenneté-Identité-Immigration (n° 2120), présentée par Mme Marine Le Pen et les membres du groupe Rassemblement national",
                  "publisher": "Assemblée nationale",
                  "date": "2024-01-25",
                  "url": "https://www.assemblee-nationale.fr/dyn/16/textes/l16b2120_proposition-loi.pdf"
                }
              ]
            },
            "philippe": {
              "value": 1,
              "note": "Propose de suspendre le droit du sol à Mayotte.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus sûre »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-sure"
                }
              ]
            }
          }
        },
        {
          "id": "q-sec-peines-planchers",
          "theme": "sec",
          "themeName": "Sécurité et justice",
          "text": "Des peines minimales obligatoires (peines planchers) doivent être rétablies.",
          "context": "Des peines minimales d'emprisonnement pour les récidivistes (« peines planchers ») ont été instaurées par la loi du 10 août 2007, puis abrogées par la loi du 15 août 2014 relative à l'individualisation des peines. Le Code pénal prévoit depuis que toute peine doit être individualisée en fonction des circonstances de l'infraction et de la personnalité de son auteur.",
          "contextSources": [
            {
              "title": "LOI n° 2014-896 du 15 août 2014 relative à l'individualisation des peines et renforçant l'efficacité des sanctions pénales - Projet de loi - Dossiers législatifs",
              "publisher": "Vie-publique.fr (DILA)",
              "date": "2014-08-17",
              "url": "https://www.vie-publique.fr/dossierlegislatif/JORFDOLE000028050843?detailId=1&detailType=CONTENU"
            },
            {
              "title": "Rapport annuel de l'Observatoire de la récidive et de la désistance 2017",
              "publisher": "Vie-publique.fr (Observatoire de la récidive et de la désistance)",
              "date": null,
              "url": "https://www.vie-publique.fr/files/rapport/pdf/174000862.pdf"
            }
          ],
          "stances": {
            "philippe": {
              "value": 2,
              "note": "Propose de rétablir des peines planchers.",
              "sources": [
                {
                  "title": "Édouard Philippe, « Pour une France plus sûre »",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-sure"
                }
              ]
            }
          }
        },
        {
          "id": "q-sec-cannabis",
          "theme": "sec",
          "themeName": "Sécurité et justice",
          "text": "La vente et la consommation de cannabis doivent être légalisées et encadrées par l'État.",
          "context": "L'usage de stupéfiants, dont le cannabis, est un délit puni d'un an d'emprisonnement et de 3 750 € d'amende ; il peut être sanctionné par une amende forfaitaire délictuelle portée de 200 € à 500 € par la loi « RIPOST » du 18 août 2026. Selon l'OFDT, 10,8 % des 18-64 ans ont consommé du cannabis au cours de l'année en 2023, un niveau stable.",
          "contextSources": [
            {
              "title": "Que risque-t-on pour usage de drogues ?",
              "publisher": "Service-Public.fr (DILA)",
              "date": "2026-08-21",
              "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F33341"
            },
            {
              "title": "Que retenir de la loi RIPOST ?",
              "publisher": "Landot & associés (blog juridique)",
              "date": "2026-08-21",
              "url": "https://blog.landot-avocats.net/2026/08/21/que-retenir-de-la-loi-ripost/"
            },
            {
              "title": "Cannabis (résine, herbe, huile, CBD) - Synthèse des connaissances",
              "publisher": "OFDT",
              "date": null,
              "url": "https://www.ofdt.fr/cannabis-resine-herbe-huile-cbd-synthese-des-connaissances-1724"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose de légaliser le cannabis récréatif sous monopole d'État.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Addictions et drogues : il faut changer de stratégie (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260606164304/https://melenchon2027.fr/programme2025/livre/chapitre15/s3/"
                }
              ]
            }
          }
        },
        {
          "id": "q-ecol-nouveaux-reacteurs",
          "theme": "ecol",
          "themeName": "Écologie et énergie",
          "text": "La France doit poursuivre la construction de nouveaux réacteurs nucléaires.",
          "context": "Le parc nucléaire compte 57 réacteurs, dont l'EPR de Flamanville raccordé au réseau en décembre 2024, et le nucléaire a fourni 373 TWh en 2025, soit 68,1 % de la production d'électricité selon RTE. La programmation pluriannuelle de l'énergie publiée par décret en février 2026 prévoit la construction de six réacteurs EPR2, dont le premier est visé pour 2038, et la prolongation des réacteurs existants jusqu'à 60 ans voire au-delà.",
          "contextSources": [
            {
              "title": "Le nucléaire en chiffres",
              "publisher": "EDF",
              "date": null,
              "url": "https://www.edf.fr/groupe-edf/comprendre/production/nucleaire/nucleaire-en-chiffres"
            },
            {
              "title": "La production électrique bas carbone de la France a atteint un « maximum historique » en 2025",
              "publisher": "Connaissance des Énergies (d'après le Bilan électrique 2025 de RTE)",
              "date": "2026-02-26",
              "url": "https://www.connaissancedesenergies.org/la-production-electrique-bas-carbone-de-la-france-atteint-un-maximum-historique-en-2025"
            },
            {
              "title": "La programmation pluriannuelle de l'énergie enfin publiée, le soutien aux énergies renouvelables maintenu",
              "publisher": "Maire-info",
              "date": "2026-02-13",
              "url": "https://www.maire-info.com/anergie/la-programmation-pluriannuelle-de-lenergie-enfin-publiee-le-soutien-aux-energies-renouvelables-maintenu-article-30480"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose de sortir du nucléaire et d'abandonner les projets d'EPR.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Organiser le 100 % d’énergies renouvelables en 2050 et la rénovation énergétique (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260821172237/https://melenchon2027.fr/programme2025/livre/chapitre13/s3/"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose de construire 20 EPR2 d'ici 2045 et une filière de petits réacteurs.",
              "sources": [
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                }
              ]
            },
            "philippe": {
              "value": 2,
              "note": "Propose huit EPR en plus des six prévus.",
              "sources": [
                {
                  "title": "Pour une France plus conquérante",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-conquerante"
                }
              ]
            }
          }
        },
        {
          "id": "q-ecol-eolien-frein",
          "theme": "ecol",
          "themeName": "Écologie et énergie",
          "text": "Le développement de l'éolien doit être freiné ou arrêté.",
          "context": "Fin 2025, la puissance éolienne raccordée atteignait 26,1 GW (24,1 GW terrestres et 2,0 GW en mer) et l'éolien a produit 49,6 TWh, soit 9,1 % de l'électricité en 2025. La PPE publiée en février 2026 privilégie le renouvellement des parcs terrestres existants et fixe un objectif de 15 GW d'éolien en mer en 2035.",
          "contextSources": [
            {
              "title": "Tableau de bord : éolien - Quatrième trimestre 2025",
              "publisher": "SDES, ministère de la Transition écologique",
              "date": "2026-02-27",
              "url": "https://www.statistiques.developpement-durable.gouv.fr/tableau-de-bord-eolien-quatrieme-trimestre-2025"
            },
            {
              "title": "La production électrique bas carbone de la France a atteint un « maximum historique » en 2025",
              "publisher": "Connaissance des Énergies (d'après le Bilan électrique 2025 de RTE)",
              "date": "2026-02-26",
              "url": "https://www.connaissancedesenergies.org/la-production-electrique-bas-carbone-de-la-france-atteint-un-maximum-historique-en-2025"
            },
            {
              "title": "La programmation pluriannuelle de l'énergie enfin publiée, le soutien aux énergies renouvelables maintenu",
              "publisher": "Maire-info",
              "date": "2026-02-13",
              "url": "https://www.maire-info.com/anergie/la-programmation-pluriannuelle-de-lenergie-enfin-publiee-le-soutien-aux-energies-renouvelables-maintenu-article-30480"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose un plan d'urgence pour l'éolien en mer et 100 % d'énergies renouvelables au plus tard en 2060.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Être à la hauteur de la responsabilité maritime française (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260521210628/https://melenchon2027.fr/programme2025/livre/chapitre18/s2/"
                },
                {
                  "title": "L'Avenir en commun, édition 2025 – Organiser le 100 % d’énergies renouvelables en 2050 et la rénovation énergétique (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260821172237/https://melenchon2027.fr/programme2025/livre/chapitre13/s3/"
                },
                {
                  "title": "Présidentielle 2027: ce qui change dans le nouveau programme de Jean-Luc Mélenchon",
                  "publisher": "LCP",
                  "date": "2026-11-06",
                  "url": "https://lcp.fr/actualites/presidentielle-2027-ce-qui-change-dans-le-nouveau-programme-de-jean-luc-melenchon-444841"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose d'abandonner le développement de l'éolien et de démanteler certains parcs.",
              "sources": [
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                },
                {
                  "title": "Contre-budget 2026 (base PLF 2026), conférence de presse du 23 octobre 2025",
                  "publisher": "Rassemblement national",
                  "date": "2025-10-23",
                  "url": "https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf"
                }
              ]
            },
            "glucksmann": {
              "value": -1,
              "note": "Propose de développer les énergies renouvelables.",
              "sources": [
                {
                  "title": "Présidentielle : « Pas candidat » pour le moment, Raphaël Glucksmann « trace » son chemin et défend sa « vision pour le pays »",
                  "publisher": "Public Sénat",
                  "date": "2025-06-23",
                  "url": "https://www.publicsenat.fr/actualites/politique/presidentielle-pas-candidat-pour-le-moment-raphael-glucksmann-trace-son-chemin-et-defend-sa-vision-pour-le-pays"
                }
              ]
            }
          }
        },
        {
          "id": "q-inst-ric",
          "theme": "inst",
          "themeName": "Institutions et démocratie",
          "text": "Les citoyens doivent pouvoir déclencher un référendum par pétition, sans l'accord du Parlement ni du gouvernement.",
          "context": "Le référendum d'initiative partagée (article 11 de la Constitution) suppose une proposition de loi déposée par au moins un cinquième des parlementaires (185), validée par le Conseil constitutionnel, puis soutenue par un dixième des électeurs inscrits en neuf mois ; si le Parlement ne l'examine pas dans les six mois, le président de la République la soumet au référendum. Sept propositions ont été soumises au Conseil constitutionnel, la dernière ayant été déclarée non conforme le 17 juin 2026, et aucune n'a abouti à un référendum.",
          "contextSources": [
            {
              "title": "Référendum d'initiative partagée (RIP) : mode d'emploi",
              "publisher": "Conseil constitutionnel",
              "date": null,
              "url": "https://www.conseil-constitutionnel.fr/referendum-d-initiative-partagee/referendum-d-initiative-partagee-rip-mode-d-emploi"
            },
            {
              "title": "Décision n° 2026-7 RIP du 17 juin 2026 - Communiqué de presse",
              "publisher": "Conseil constitutionnel",
              "date": "2026-06-17",
              "url": "https://www.conseil-constitutionnel.fr/actualites/communique/decision-n-2026-7-rip-du-17-juin-2026-communique-de-presse"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose un référendum d'initiative citoyenne révocatoire, législatif, abrogatoire et constituant.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Une République permettant l’intervention populaire (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260829200513/https://melenchon2027.fr/programme2025/livre/faire-la-revolution-citoyenne/s4/"
                }
              ]
            }
          }
        },
        {
          "id": "q-inst-proportionnelle",
          "theme": "inst",
          "themeName": "Institutions et démocratie",
          "text": "Les députés doivent être élus au scrutin proportionnel.",
          "context": "Les 577 députés sont élus au scrutin uninominal majoritaire à deux tours dans des circonscriptions. Les élections législatives de 1986 se sont tenues au scrutin proportionnel par département, en application d'une loi de 1985, avant le rétablissement du scrutin majoritaire par une loi de juillet 1986.",
          "contextSources": [
            {
              "title": "Fiche n° 3 : L'élection des députés",
              "publisher": "Assemblée nationale",
              "date": null,
              "url": "https://www.assemblee-nationale.fr/dyn/contenu/telechargement/625543/file/Fiche%203%20-%20Election%20des%20d%C3%A9put%C3%A9s.pdf"
            },
            {
              "title": "Rapport n° 4087 (XVe législature) sur une proposition de loi relative au scrutin législatif",
              "publisher": "Assemblée nationale",
              "date": null,
              "url": "https://www.assemblee-nationale.fr/dyn/opendata/RAPPANR5L15B4087.html"
            },
            {
              "title": "Décision n° 86-208 DC du 2 juillet 1986",
              "publisher": "Conseil constitutionnel",
              "date": "1986-07-02",
              "url": "https://www.conseil-constitutionnel.fr/les-decisions/decision-n-86-208-dc-du-2-juillet-1986-saisine-par-60-deputes"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose d'élire l'Assemblée nationale au scrutin proportionnel.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Abolir la monarchie présidentielle (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-03-23",
                  "url": "https://web.archive.org/web/20260829200335/https://melenchon2027.fr/programme2025/livre/chapitre1/s2/"
                }
              ]
            },
            "lepen": {
              "value": 1,
              "note": "Propose un scrutin proportionnel assorti d'une prime majoritaire.",
              "sources": [
                {
                  "title": "Congrès du RN à Orléans : ce qu'il faut retenir du premier discours de campagne de Marine Le Pen",
                  "publisher": "Europe 1 (avec AFP)",
                  "date": "2026-10-25",
                  "url": "https://www.europe1.fr/politique/congres-du-rn-a-orleans-ce-quil-faut-retenir-du-premier-discours-de-campagne-de-marine-le-pen-1181118"
                }
              ]
            }
          }
        },
        {
          "id": "q-num-reseaux-sociaux-15-ans",
          "theme": "num",
          "themeName": "Numérique, IA et souveraineté technologique",
          "text": "L'accès aux réseaux sociaux doit être interdit aux moins de 15 ans.",
          "context": "La loi du 7 juillet 2023 instaurant une « majorité numérique » à 15 ans n'a pas reçu ses décrets d'application, la Commission européenne ayant estimé ce dispositif contraire au droit de l'UE. Le Parlement a adopté en juillet 2026 une loi interdisant l'accès aux réseaux sociaux aux moins de 15 ans, mais le Conseil constitutionnel a censuré cette interdiction (article 1er) le 14 août 2026, jugeant l'atteinte à la liberté d'expression disproportionnée et les garanties pour la vie privée insuffisantes.",
          "contextSources": [
            {
              "title": "Question écrite n° 5149 : Décrets d'application - majorité numérique à 15 ans (et réponse du gouvernement)",
              "publisher": "Assemblée nationale",
              "date": null,
              "url": "https://www.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE5149.pdf"
            },
            {
              "title": "Décision n° 2026-911 DC du 14 août 2026 - Loi visant à protéger les mineurs des risques auxquels les expose l'utilisation des réseaux sociaux",
              "publisher": "Conseil constitutionnel",
              "date": "2026-08-14",
              "url": "https://www.conseil-constitutionnel.fr/decision/2026/2026911DC.htm"
            },
            {
              "title": "Le Conseil constitutionnel censure le contrôle de l'âge des internautes, mineurs ou pas",
              "publisher": "Next",
              "date": "2026-08-14",
              "url": "https://next.ink/251792/le-conseil-constitutionnel-censure-le-controle-de-lage-des-internautes-mineurs-ou-pas/"
            }
          ],
          "stances": {}
        },
        {
          "id": "q-num-regles-ia-assouplir",
          "theme": "num",
          "themeName": "Numérique, IA et souveraineté technologique",
          "text": "Les règles européennes sur l'intelligence artificielle et les données personnelles doivent être assouplies pour favoriser l'innovation.",
          "context": "Le règlement européen sur l'intelligence artificielle, entré en vigueur le 1er août 2024, s'applique progressivement ; un règlement « omnibus » adopté en juin 2026 a reporté les obligations des systèmes à haut risque au 2 décembre 2027 (domaines de l'annexe III) et au 2 août 2028 (produits réglementés). La proposition « omnibus numérique » de novembre 2025 modifiant notamment le RGPD (2018) était toujours en discussion au Parlement européen en août 2026.",
          "contextSources": [
            {
              "title": "AI Act | Shaping Europe's digital future",
              "publisher": "Commission européenne",
              "date": "2026-10-19",
              "url": "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
            },
            {
              "title": "EU braces for data rules battle with 1,840 amendments. Showdown begins after summer",
              "publisher": "EU Perspectives",
              "date": "2026-08-10",
              "url": "https://euperspectives.eu/?p=25582"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose d'aller plus loin que le règlement européen sur la protection des données et d'interdire certains usages de l'intelligence artificielle.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Affirmer le caractère d’intérêt général de la révolution numérique (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260521210628/https://melenchon2027.fr/programme2025/livre/chapitre18/s4/"
                },
                {
                  "title": "L'Avenir en commun, édition 2025 – Garantir la souveraineté numérique de la France (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260521210628/https://melenchon2027.fr/programme2025/livre/chapitre18/s5/"
                }
              ]
            },
            "philippe": {
              "value": 1,
              "note": "Propose de simplifier le cadre juridique européen de l'IA, sans renoncer à une régulation éthique.",
              "sources": [
                {
                  "title": "Pour une France plus conquérante",
                  "publisher": "Site d'Édouard Philippe",
                  "date": null,
                  "url": "https://www.edouardphilippe.fr/priorites/pour-une-france-plus-conquerante"
                }
              ]
            }
          }
        },
        {
          "id": "q-log-encadrement-loyers",
          "theme": "log",
          "themeName": "Logement et territoires",
          "text": "Les loyers doivent être encadrés sur l'ensemble du territoire.",
          "context": "L'encadrement des loyers est une expérimentation issue de la loi ELAN de 2018, prolongée par la loi 3DS jusqu'en novembre 2026, appliquée dans neuf territoires volontaires (environ 70 communes, dont Paris, Lille, Lyon, Villeurbanne, Bordeaux, Montpellier, Plaine Commune et Est Ensemble). Une proposition de loi le prolongeant jusqu'en novembre 2028 à périmètre constant, votée par l'Assemblée nationale en décembre 2025, devait être examinée en séance au Sénat le 21 octobre 2026.",
          "contextSources": [
            {
              "title": "Encadrement des loyers",
              "publisher": "Ministère de la Transition écologique",
              "date": "2025-10-28",
              "url": "https://www.ecologie.gouv.fr/politiques-publiques/encadrement-loyers"
            },
            {
              "title": "Encadrement des loyers : le Sénat veut prolonger le dispositif jusqu'en 2028",
              "publisher": "SeLoger",
              "date": "2026-10-16",
              "url": "https://edito.seloger.com/actualites/france/encadrement-loyers-senat-veut-prolonger-dispositif-jusqu-2028-article"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose d'encadrer les loyers partout sur le territoire, et à la baisse dans les grandes villes.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Garantir le droit au logement (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260504115058/https://melenchon2027.fr/programme2025/livre/chapitre7/s5/"
                }
              ]
            },
            "philippe": {
              "value": -2,
              "note": "S'oppose à l'encadrement des loyers.",
              "sources": [
                {
                  "title": "Logement : les pistes d'Édouard Philippe pour sortir de la crise",
                  "publisher": "Empruntis",
                  "date": "2025-12-10",
                  "url": "https://www.empruntis.com/financement/actualites/2025/logement-pistes-edouard-philippe-sortir-crise-20373/"
                },
                {
                  "title": "Immobilier : les orientations qu'Édouard Philippe souhaite imposer au débat",
                  "publisher": "BoursedesCrédits",
                  "date": "2025-12-11",
                  "url": "https://www.boursedescredits.com/actualite-immobilier-orientations-edouard-philippe-souhaite-imposer-debat-29065.php"
                }
              ]
            }
          }
        },
        {
          "id": "q-log-zan-abandon",
          "theme": "log",
          "themeName": "Logement et territoires",
          "text": "L'objectif de « zéro artificialisation nette » des sols doit être abandonné.",
          "context": "La loi Climat et résilience du 22 août 2021 fixe l'objectif de « zéro artificialisation nette » des sols en 2050, avec une réduction de moitié de la consommation d'espaces naturels, agricoles et forestiers sur 2021-2031 par rapport à 2011-2021 ; la loi du 20 juillet 2023 a garanti à chaque commune une surface minimale d'un hectare. La proposition de loi « TRACE », adoptée par le Sénat le 18 mars 2025, supprime l'objectif intermédiaire national de 2031 tout en maintenant l'objectif de 2050 ; elle est en attente d'examen à l'Assemblée nationale selon le Sénat.",
          "contextSources": [
            {
              "title": "Artificialisation des sols",
              "publisher": "Ministère de la Transition écologique",
              "date": "2025-10-27",
              "url": "https://www.ecologie.gouv.fr/politiques-publiques/artificialisation-sols"
            },
            {
              "title": "Proposition de loi visant à instaurer une trajectoire de réduction de l'artificialisation concertée avec les élus locaux (TRACE)",
              "publisher": "Sénat",
              "date": null,
              "url": "https://www.senat.fr/travaux-parlementaires/textes-legislatifs/la-loi-en-clair/proposition-de-loi-visant-a-instaurer-une-trajectoire-de-reduction-de-lartificialisation-concertee-avec-les-elus-locaux.html"
            }
          ],
          "stances": {
            "melenchon": {
              "value": -2,
              "note": "Propose de mettre en œuvre le « zéro artificialisation nette » des sols dès 2027 dans l'Hexagone.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Souveraineté alimentaire et révolution agricole : pour une agriculture écologique et paysanne (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260606164247/https://melenchon2027.fr/programme2025/livre/chapitre13/s5/"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose de supprimer le dispositif « zéro artificialisation nette ».",
              "sources": [
                {
                  "title": "Programme et communication : que vaut la rentrée de Le Pen ?",
                  "publisher": "Sud Radio",
                  "date": "2026-09-14",
                  "url": "https://www.sudradio.fr/politique/programme-presidentiel-et-communication-que-vaut-la-rentree-politique-de-marine-le-pen"
                }
              ]
            }
          }
        },
        {
          "id": "q-agr-clauses-miroirs",
          "theme": "agr",
          "themeName": "Agriculture et alimentation",
          "text": "Les produits agricoles importés doivent respecter les mêmes normes de production que ceux produits en France.",
          "context": "Les produits importés dans l'UE doivent respecter les normes sanitaires applicables aux denrées (limites maximales de résidus), mais pas l'ensemble des règles de production européennes ; la Commission a lancé fin 2025 une étude sur l'alignement des exigences pour les pesticides interdits dans l'UE, et la France a suspendu par arrêté du 5 janvier 2026 l'importation de denrées contenant des résidus de cinq substances interdites. L'accord commercial intérimaire UE-Mercosur, signé en janvier 2026 malgré le vote contraire de la France au Conseil, s'applique provisoirement depuis le 1er mai 2026.",
          "contextSources": [
            {
              "title": "Pesticides : la réciprocité des normes entre produits agricoles européens et importés va être étudiée par Bruxelles",
              "publisher": "Réussir",
              "date": "2025-11-26",
              "url": "https://www.reussir.fr/pesticides-la-reciprocite-des-normes-entre-produits-agricoles-europeens-et-importes-va-etre-etudiee"
            },
            {
              "title": "5 pesticides interdits dans l'UE, désormais proscrits d'entrée en France via une trentaine de denrées",
              "publisher": "Pleinchamp",
              "date": "2026-01-07",
              "url": "https://www.pleinchamp.com/actualite/5-pesticides-interdits-dans-l-ue-desormais-proscrits-d-entree-en-france-via-une-trentaine-de-denrees"
            },
            {
              "title": "L'accord de libre-échange avec le Mercosur validé par la majorité des Etats européens",
              "publisher": "Hespress (dépêche AFP)",
              "date": "2026-01-09",
              "url": "https://fr.hespress.com/457604-laccord-de-libre-echange-avec-le-mercosur-valide-par-la-majorite-des-etats-europeens.html"
            },
            {
              "title": "Provisional Application of the EU-Mercosur Interim Trade Agreement Begins 1 May 2026",
              "publisher": "Commission européenne (DG TAXUD)",
              "date": "2026-04-24",
              "url": "https://taxation-customs.ec.europa.eu/news/provisional-application-eu-mercosur-interim-trade-agreement-begins-1-may-2026-2026-04-24_en"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 2,
              "note": "Propose d'interdire l'importation de produits mettant en cause une norme sanitaire nationale ou contenant les pesticides les plus dangereux.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – Souveraineté alimentaire et révolution agricole : pour une agriculture écologique et paysanne (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260606164247/https://melenchon2027.fr/programme2025/livre/chapitre13/s5/"
                }
              ]
            },
            "lepen": {
              "value": 2,
              "note": "Propose de contrôler la conformité des importations aux normes imposées aux producteurs français.",
              "sources": [
                {
                  "title": "La France entreprend – Projet de Marine Le Pen",
                  "publisher": "Rassemblement national",
                  "date": null,
                  "url": "https://rassemblementnational.fr/documents/WEB-GRN-LIVRET-ENTREPRISE.pdf"
                }
              ]
            }
          }
        },
        {
          "id": "q-agr-securite-sociale-alimentation",
          "theme": "agr",
          "themeName": "Agriculture et alimentation",
          "text": "Une sécurité sociale de l'alimentation doit être créée, sur le modèle de l'assurance maladie.",
          "context": "Il n'existe pas de sécurité sociale de l'alimentation au niveau national ; près d'une trentaine d'expérimentations locales de caisses alimentaires, financées par des cotisations et des collectivités, existent selon les auteurs d'une proposition de loi déposée à l'Assemblée nationale en octobre 2024. Ce texte prévoit une expérimentation de cinq ans reposant sur l'universalité, des cotisations et le conventionnement de produits décidé par des instances citoyennes.",
          "contextSources": [
            {
              "title": "Que dit la proposition de loi voulant instaurer une sécurité sociale de l'alimentation bientôt discutée à l'Assemblée nationale ?",
              "publisher": "Réussir",
              "date": "2025-02-12",
              "url": "https://www.reussir.fr/que-dit-la-proposition-de-loi-voulant-instaurer-une-securite-sociale-de-lalimentation-bientot"
            }
          ],
          "stances": {
            "melenchon": {
              "value": 1,
              "note": "Propose d'expérimenter une garantie d'accès à des aliments choisis comme premier jalon d'une sécurité sociale de l'alimentation.",
              "sources": [
                {
                  "title": "L'Avenir en commun, édition 2025 – En finir avec la malbouffe (page archivée)",
                  "publisher": "La France insoumise (melenchon2027.fr)",
                  "date": "2026-01-22",
                  "url": "https://web.archive.org/web/20260606164247/https://melenchon2027.fr/programme2025/livre/chapitre15/s4/"
                }
              ]
            }
          }
        }
      ];
      const themeFilter = root.querySelector("#pt-theme-filter");
      const h1 = [
        ["Marine Le Pen",34],["Jean-Luc Mélenchon",19],["Édouard Philippe",12],["Raphaël Glucksmann",11],["David Lisnard",9],["Bruno Retailleau",5],["Éric Zemmour",3],["Marine Tondelier",2],["Dominique de Villepin",2],["Nathalie Arthaud",1],["Fabien Roussel",1],["Nicolas Dupont-Aignan",1]
      ];
      const h2 = [
        ["Marine Le Pen",35],["Jean-Luc Mélenchon",19],["Raphaël Glucksmann",12],["Gabriel Attal",9],["David Lisnard",9],["Bruno Retailleau",6],["Éric Zemmour",3],["Marine Tondelier",2],["Dominique de Villepin",2],["Nathalie Arthaud",1],["Fabien Roussel",1],["Nicolas Dupont-Aignan",1]
      ];
      const scoreLabel = value => value > 0 ? `+${value}` : `${value}`;
      const scoreClass = value => value === null ? "unknown" : String(value);
      const tbody = root.querySelector("#pt-stance-rows");
      const questionCount = root.querySelector("#pt-question-count");
      const detailNote = root.querySelector("#pt-detail-note");
      const detailScore = root.querySelector("#pt-detail-score");
      const detailContext = root.querySelector("#pt-detail-context");
      const detailLink = root.querySelector("#pt-detail-link");
      function appendSources(sources, label) {
        sources.forEach(source => {
          try {
            const url = new URL(source.url);
            if (url.protocol !== "https:") return;
            const link = document.createElement("a");
            link.className = "pt-source";
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noreferrer noopener";
            link.title = `${source.publisher}${source.date ? ` · ${source.date}` : ""}`;
            link.textContent = `${label}${source.title} ↗`;
            detailLink.appendChild(link);
          } catch {}
        });
      }
      function showDetail(question, candidateId) {
        const stance = question.stances[candidateId];
        const candidate = names[candidateId];
        detailLink.replaceChildren();
        detailContext.textContent = question.context ? `Contexte : ${question.context}` : "";
        if (!stance) {
          detailScore.textContent = `${candidate} · —`;
          detailNote.textContent = "Aucune position sourcée n’est enregistrée pour cette affirmation.";
          appendSources(question.contextSources || [], "Contexte : ");
          return;
        }
        detailScore.textContent = `${candidate} · ${scoreLabel(stance.value)}`;
        detailNote.textContent = stance.note;
        appendSources(stance.sources || [], "Position : ");
        appendSources(question.contextSources || [], "Contexte : ");
      }
      function renderQuestions() {
        const theme = themeFilter.value;
        questionCount.textContent = `${questions.length} affirmations au questionnaire`;
        tbody.replaceChildren();
        const visibleQuestions = questions.filter(q => theme === "all" || q.theme === theme);
        if (visibleQuestions.length === 0) {
          const row = document.createElement("tr");
          const message = document.createElement("td");
          message.colSpan = 5;
          message.className = "pt-muted";
          message.textContent = "Aucune affirmation n’est encore documentée dans ce thème.";
          row.appendChild(message);
          tbody.appendChild(row);
          return;
        }
        visibleQuestions.forEach((q, index, list) => {
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
