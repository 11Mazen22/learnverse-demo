import type { CanonicalLessonStudyPack } from "../pack-types";

export const ENGLISH_PACKS: CanonicalLessonStudyPack[] = [
  // =========================================================================
  // 1. UNIT 1 — EGYPT'S HERITAGE
  // =========================================================================
  {
    id: "pack-eng-1",
    lessonSlug: "eng-heritage",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 1,
    title: "Unit 1 — Egypt's Heritage",
    titleAr: "الوحدة ١ — تراث مصر",
    titleEn: "Unit 1 — Egypt's Heritage",
    hook: "How do historians recount continuous excavation work interrupted by a sudden discovery without tripping over while, when, and during?",
    summary:
      "Builds heritage, archaeology, and cultural preservation vocabulary alongside Past Simple (completed past events, used to) vs. Past Continuous (ongoing background actions), keeping while (+ continuous clause), when (+ interrupting short action), and during (+ noun phrase) distinct.",
    formulaOrRule: "While + was/were + V-ing; When + Past Simple (interruption); During + Noun Phrase",
    keyConcepts: [
      {
        id: "eng-u1-1",
        stage: "foundation",
        title: "Past Simple vs. Past Continuous & Time Connectors",
        body: "Use Past Simple for finished actions at a stated past time (visited, catalogued) and Past Continuous for a longer background activity interrupted by a shorter Past Simple event. Preposition rule: during MUST take a noun phrase ('during the excavation'), never a subject+verb clause.",
        formulaOrRule: "While + Subject + was/were + V-ing; During + Noun Phrase.",
        example: "While the team was restoring the temple wall, an archaeologist discovered a faint inscription.",
        blocks: [
          {
            blockId: "eng-u1-b1",
            type: "explanation",
            content: "Pair Past Continuous (background scene in progress) with Past Simple (single interrupting event): 'While curators were cleaning the relief, they noticed an earlier cartouche.' Two actions happening side by side over time take Past Continuous in both clauses.",
          },
          {
            blockId: "eng-u1-b2",
            type: "callout",
            variant: "pitfall",
            title: "Classic Exam Trap: during vs. while",
            content: "Never write 'During they visited Luxor...' or 'During visiting Cairo...'. Use 'During the summer excavation' (noun phrase) or 'While they were visiting Luxor' (clause).",
          },
        ],
      },
      {
        id: "eng-u1-2",
        stage: "mechanism",
        title: "Past Habits with 'used to' & Stative Verb Limits",
        body: "Use 'used to + base verb' (negated: 'didn't use to') for repeated past routines or states that no longer exist. Avoid progressive -ing forms with stative verbs of mind, possession, or feeling (know, believe, belong, own).",
        blocks: [
          {
            blockId: "eng-u1-b3",
            type: "explanation",
            content: "In question and negative forms, drop the -d: 'Did scribes use to carve on limestone ostraca?' and 'Villages didn't use to have digital archives.'",
          },
          {
            blockId: "eng-u1-b4",
            type: "callout",
            variant: "note",
            title: "Stative Verbs Stay Simple",
            content: "Even inside a 'while' context, stative verbs resist continuous form: write 'While she knew the site well...' rather than 'was knowing'.",
          },
        ],
      },
      {
        id: "eng-u1-3",
        stage: "application",
        title: "Heritage Collocations in Academic Reading",
        body: "High-frequency Sec. 1 collocations distinguish protecting heritage from physical repair: 'preserve cultural heritage', 'restore damaged monuments', 'uncover inscriptions', 'host an exhibition'.",
        blocks: [
          {
            blockId: "eng-u1-b5",
            type: "primary_source",
            quote: "During the autumn conservation season in Luxor, specialists restored sandstone reliefs that craftsmen had carved over three millennia earlier, while students catalogued pottery fragments nearby.",
            attribution: "Curated Archaeological Field Note — Sec. 1 Heritage Reader",
            period: "Authentic contrast of during + noun phrase, Past Simple, and while + Past Continuous",
            reliabilityNote: "Identify why 'During' takes 'the autumn conservation season' rather than a finite verb.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Choosing Connectors & Tenses in Field Reports",
        problem: "Complete cleanly: '_____ our visit to the Egyptian Museum, I sketched a statue while the guide _____ its symbolism.'",
        steps: [
          "1) Look after the first blank: 'our visit to the Egyptian Museum' is a noun phrase with no finite verb, so select the preposition 'During'.",
          "2) Look after 'while': 'the guide' is a subject needing a continuous background action in the past, so select 'was explaining'.",
        ],
        takeaway: "Noun phrase → 'During'; Subject + ongoing action → 'While ... was/were + V-ing'.",
      },
    ],
    commonMistakes: [
      "Writing 'During I was reading' instead of 'While I was reading' or 'During my reading session'.",
      "Adding -ing to stative verbs like know, belong, own, or understand ('was knowing').",
    ],
    questions: [
      {
        id: "pack-q-eng-1a",
        question_type: "multiple-choice",
        prompt: "While the team _____ the ancient monument, heavy rain suddenly started.",
        choices: ["was documenting", "documented", "documents", "is documenting"],
        correct_index: 0,
        explanation: "'While' introduces the ongoing background action ('was documenting') interrupted by the sudden Past Simple event ('started').",
        hint: "Which action was already in progress when the rain started?",
        difficulty: "foundational",
      },
      {
        id: "pack-q-eng-1b",
        question_type: "multiple-choice",
        prompt: "Which sentence uses 'during' grammatically correctly?",
        choices: [
          "Many artifacts were catalogued during the summer excavation.",
          "During they excavated the tomb, students watched.",
          "She worked hard during she studied heritage.",
          "During visiting Cairo, they took photos.",
        ],
        correct_index: 0,
        explanation: "'During' is a preposition and must be followed by a noun phrase ('the summer excavation'), not a clause or bare -ing clause.",
        hint: "Look for During + Noun Phrase.",
        difficulty: "standard",
      },
      {
        id: "pack-q-eng-1c",
        question_type: "multiple-choice",
        prompt: "Years ago, local artisans _____ rely on hand chisels before modern laser restoration tools arrived.",
        choices: ["used to", "were using to", "use to", "did used to"],
        correct_index: 0,
        explanation: "Affirmative past habits no longer practiced use 'used to + base verb' ('used to rely').",
        hint: "Check affirmative vs. negative spelling with 'used to'.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "During vs. While", back: "During + Noun phrase ('during the museum tour'); While + Past Continuous ('while we were touring')." },
      { front: "used to (Affirmative vs. Negative)", back: "Affirmative: 'used to + V'; Negative/Question: 'didn't use to + V' / 'Did ... use to + V?'" },
      { front: "Egypt's Heritage Collocations", back: "preserve cultural heritage, restore a monument, uncover an inscription, document artifacts." },
    ],
  },

  // =========================================================================
  // 2. UNIT 2 — HANDS HELP, HEARTS CARE
  // =========================================================================
  {
    id: "pack-eng-2",
    lessonSlug: "eng-hands-help",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 2,
    title: "Unit 2 — Hands Help, Hearts Care",
    titleAr: "الوحدة ٢ — أيدٍ تساعد وقلوب ترعى",
    titleEn: "Unit 2 — Hands Help, Hearts Care",
    hook: "One tiny suffix reverses everything in English civic rules: confusing 'mustn't' with 'don't have to' turns a strict safety ban into an optional suggestion.",
    summary:
      "Focuses on kindness, volunteering, and community service alongside modals of advice (should/shouldn't), internal duty and prohibition (must/mustn't), external rules (have to/has to), and lack of necessity (don't/doesn't have to).",
    formulaOrRule: "mustn't = PROHIBITED (not allowed); don't have to = NOT NECESSARY (optional)",
    keyConcepts: [
      {
        id: "eng-u2-1",
        stage: "foundation",
        title: "Modals of Obligation vs. Prohibition vs. No Necessity",
        body: "Use 'should' for helpful advice, 'must'/'have to' for strong obligation or rules, 'mustn't' for strict prohibition ('You mustn't share private records'), and 'don't/doesn't have to' when an action is optional ('You don't have to bring supplies').",
        blocks: [
          {
            blockId: "eng-u2-b1",
            type: "explanation",
            content: "Think of obligation on a scale: Advisable ('should'), Required ('must' for personal conviction or urgent rules; 'have to' for external laws/schedules), Forbidden ('mustn't'), Optional ('don't have to' / 'needn't').",
          },
          {
            blockId: "eng-u2-b2",
            type: "callout",
            variant: "note",
            title: "Do NOT Swap 'mustn't' and 'don't have to'",
            content: "'You mustn't pay' means paying is illegal or banned. 'You don't have to pay' means admission is free — choose whichever suits your wallet!",
          },
        ],
      },
      {
        id: "eng-u2-2",
        stage: "mechanism",
        title: "Internal 'must' vs. External 'have to' Across Tenses",
        body: "Because 'must' has no past or future tense form, switch to 'had to' for past necessity and 'will have to' for future rules.",
        blocks: [
          {
            blockId: "eng-u2-b3",
            type: "explanation",
            content: "Past necessity: 'Yesterday the charity team had to pack 200 parcels before noon' (never 'musted'). Lack of past necessity: 'They didn't have to work late.'",
          },
        ],
      },
      {
        id: "eng-u2-3",
        stage: "application",
        title: "Structuring a Descriptive Profile of a Helper",
        body: "Well-structured descriptive paragraphs move from role introduction → concrete voluntary actions → measurable community impact → personal reflection.",
        blocks: [
          {
            blockId: "eng-u2-b4",
            type: "primary_source",
            quote: "A reliable volunteer builds trust through small, consistent actions: arriving on time, listening with patience, and respecting the privacy of every neighbour they serve.",
            attribution: "Civic Service Guide — Unit 2 Writing Model",
            period: "Key vocabulary: reliable, compassion, privacy, volunteer, community",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Selecting Between Prohibition & Optionality",
        problem: "Contrast: (A) 'You _____ enter this restricted hospital ward.' vs (B) 'You _____ pay to volunteer at the shelter.'",
        steps: [
          "1) Sentence (A) protects patient safety and forbids entry → 'mustn't' (not allowed).",
          "2) Sentence (B) states volunteering is free; paying is optional/unneeded → 'don't have to'.",
        ],
        takeaway: "Ask first: 'Is it forbidden (mustn't), or simply optional (don't have to)?'",
      },
    ],
    commonMistakes: [
      "Using 'mustn't' to mean 'you don't need to' — 'mustn't' always forbids.",
      "Writing 'musted' for past obligation instead of 'had to'.",
    ],
    questions: [
      {
        id: "pack-q-eng-2a",
        question_type: "multiple-choice",
        prompt: "Volunteers _____ share any private medical details they hear at the community clinic; it is strictly against the rules.",
        choices: ["mustn't", "don't have to", "should", "need to"],
        correct_index: 0,
        explanation: "'Mustn't' expresses prohibition (not allowed), whereas 'don't have to' merely says it isn't required.",
        hint: "Is sharing private medical data optional or forbidden?",
        difficulty: "foundational",
      },
      {
        id: "pack-q-eng-2b",
        question_type: "multiple-choice",
        prompt: "Joining our clean-up campaign is free—you _____ donate money if you can give your time.",
        choices: ["don't have to", "mustn't", "shouldn't", "can't"],
        correct_index: 0,
        explanation: "'Don't have to' means there is no obligation or necessity to donate money.",
        hint: "Donating money isn't forbidden; it's just not required.",
        difficulty: "standard",
      },
      {
        id: "pack-q-eng-2c",
        question_type: "multiple-choice",
        prompt: "Because the flood warning arrived at midnight, the rescue team _____ reorganize every supply route immediately.",
        choices: ["had to", "musted", "has to", "mustn't"],
        correct_index: 0,
        explanation: "For past obligation ('at midnight' / 'arrived'), 'have to' shifts to 'had to'; 'must' lacks a past form.",
        hint: "Notice the Past Simple time anchor 'arrived'.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "mustn't vs. don't have to", back: "mustn't = prohibited / forbidden; don't have to = optional / unnecessary." },
      { front: "Past of 'must' / 'have to'", back: "Always use 'had to + base verb' (never 'musted') for past obligation." },
      { front: "Volunteering Vocabulary", back: "volunteer, charity, donate, community, compassion, reliable, privacy, responsibility." },
    ],
  },

  // =========================================================================
  // 3. UNIT 3 — TRUTH VS. LIES
  // =========================================================================
  {
    id: "pack-eng-3",
    lessonSlug: "eng-truth-lies",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 3,
    title: "Unit 3 — Truth vs. Lies",
    titleAr: "الوحدة ٣ — الحقيقة مقابل الأكاذيب",
    titleEn: "Unit 3 — Truth vs. Lies",
    hook: "Before hitting repost on a shocking headline, how do digital fact-checking habits map onto Zero, First, and Second Conditionals?",
    summary:
      "Teaches digital media literacy (claim, source, verify, misleading, bias) and the six-step verification habit alongside Zero (facts), First (real future consequences), and Second (hypothetical/imaginary) Conditionals.",
    formulaOrRule: "Zero: If + Present, Present (fact); First: If + Present, will + V (real future); Second: If + Past, would + V (hypothetical; 'If I were')",
    keyConcepts: [
      {
        id: "eng-u3-1",
        stage: "foundation",
        title: "Zero vs. First vs. Second Conditionals",
        body: "Zero pairs two present clauses for general truths ('If water freezes, it expands'). First states realistic future outcomes ('If you verify sources, you will avoid rumours'). Second imagines unreal or advisory scenarios ('If I were the editor, I would check every chart').",
        blocks: [
          {
            blockId: "eng-u3-b1",
            type: "explanation",
            content: "Standard school grammar keeps 'will' and 'would' out of the 'if'-clause: write 'If she checks the date, she will spot the hoax', NOT 'If she will check...'.",
          },
          {
            blockId: "eng-u3-b2",
            type: "callout",
            variant: "tip",
            title: "Why 'If I were...' Stays Formal",
            content: "In Second Conditional advice and hypotheticals, formal written English prefers 'were' for all subjects ('If I were you, I wouldn't share unverified clips').",
          },
        ],
      },
      {
        id: "eng-u3-2",
        stage: "mechanism",
        title: "The Six-Step Digital Fact-Checking Routine",
        body: "Critical readers never judge a story by an emotional headline alone: check publisher → inspect date/context → corroborate across two independent sources → read beyond the headline → inspect quoted statistics → pause before sharing.",
        blocks: [
          {
            blockId: "eng-u3-b3",
            type: "primary_source",
            quote: "A cropped photograph from 2018 recycled under an urgent 2026 headline relies on emotional speed: the claim wins shares before readers verify the original date or publisher.",
            attribution: "Media Literacy Checklist — Sec. 1 Information Skills",
            period: "Key terms: verify, corroborate, misleading, bias, reliable",
          },
        ],
      },
      {
        id: "eng-u3-3",
        stage: "application",
        title: "Real vs. Hypothetical Consequence Framing",
        body: "Choose First Conditional when a student still can act in real life ('If we cite official data, readers will trust our report'), and Second Conditional when imagining impossible or counterfactual conditions ('If news sites had no editors, rumours would spread unchecked').",
        blocks: [
          {
            blockId: "eng-u3-b4",
            type: "callout",
            variant: "pitfall",
            title: "Zero vs. First Check",
            content: "Scientific laws and automatic habits take Zero ('If you press Ctrl+F, the search bar opens'); a specific single future outcome takes First ('If you search this article now, you will find the author's name').",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Diagnosing Second Conditional Hypotheticals",
        problem: "Choose the right forms: 'If I _____ you, I _____ trace the original source before reposting that rumour.'",
        steps: [
          "1) One person literally becoming another person is unreal/hypothetical → Second Conditional.",
          "2) Use formal subjunctive 'were' in the if-clause and 'would + base verb' in the main clause → 'were / would'.",
        ],
        takeaway: "General fact = Zero; Real future plan = First; Imaginary / 'If I were...' = Second.",
      },
    ],
    commonMistakes: [
      "Putting 'will' or 'would' inside the if-clause ('If you will check the source...').",
      "Using 'was' instead of formal 'were' in 'If I were you...' exam items.",
    ],
    questions: [
      {
        id: "pack-q-eng-3a",
        question_type: "multiple-choice",
        prompt: "If I _____ the newspaper editor, I _____ verify every statistic before publishing the headline.",
        choices: ["were / would", "am / will", "would be / verified", "was / will"],
        correct_index: 0,
        explanation: "In formal Second Conditional hypotheticals, 'If I were...' pairs with 'would + base verb'.",
        hint: "The speaker is imagining holding someone else's job (Second Conditional).",
        difficulty: "foundational",
      },
      {
        id: "pack-q-eng-3b",
        question_type: "multiple-choice",
        prompt: "Which action violates the six-step digital fact-checking routine?",
        choices: [
          "Reposting an alarming headline immediately because it made you angry",
          "Checking who originally published the claim and when",
          "Cross-checking facts across two or more independent sources",
          "Distinguishing factual data from opinion wording",
        ],
        correct_index: 0,
        explanation: "Sharing reactive claims driven by anger, fear, or excitement spreads misinformation without verification.",
        hint: "Spot the emotional reaction vs. verification habits.",
        difficulty: "standard",
      },
      {
        id: "pack-q-eng-3c",
        question_type: "multiple-choice",
        prompt: "If our class _____ two independent archives tonight, our report _____ much more persuasive tomorrow.",
        choices: ["checks / will be", "will check / is", "checked / will be", "checks / would be"],
        correct_index: 0,
        explanation: "A realistic future condition pairs Present Simple ('checks') in the if-clause with 'will + base' ('will be') in the result clause.",
        hint: "Notice the realistic future marker 'tonight / tomorrow' (First Conditional).",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "Three Conditionals Matrix", back: "Zero: If + Pres, Pres (facts); 1st: If + Pres, will + V (likely future); 2nd: If + Past, would + V (hypothetical, 'If I were')." },
      { front: "The Golden If-Clause Rule", back: "Never put 'will' or 'would' directly inside the standard conditional if-clause." },
      { front: "Digital Fact-Checking Vocabulary", back: "claim, source, reliable, verify, evidence, rumour, misleading, bias, corroborate." },
    ],
  },

  // =========================================================================
  // 4. UNIT 4 — SAVE AND SHINE
  // =========================================================================
  {
    id: "pack-eng-4",
    lessonSlug: "eng-save-shine",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 4,
    title: "Unit 4 — Save and Shine",
    titleAr: "الوحدة ٤ — احفظ وتألق",
    titleEn: "Unit 4 — Save and Shine",
    hook: "Why does swapping '-ing' for 'to + verb' after 'stop' or 'remember' change whether someone quit a bad habit or paused to start a good one?",
    summary:
      "Covers sustainability and resource conservation (renewable, recycle, emissions, energy-efficient), gerund (V-ing) vs. to-infinitive verb complements—highlighting semantic shifts in stop/remember/try—and writing well-structured formal emails.",
    formulaOrRule: "Gerund: avoid/enjoy/suggest/finish + V-ing; Infinitive: decide/hope/plan/want + to + V; stop doing (quit) != stop to do (pause in order to)",
    keyConcepts: [
      {
        id: "eng-u4-1",
        stage: "foundation",
        title: "Gerund (V-ing) vs. To-Infinitive Verb Lists",
        body: "Verbs such as enjoy, avoid, finish, keep, practice, and suggest require V-ing ('We must avoid wasting freshwater'). Verbs such as decide, hope, plan, promise, refuse, and want take 'to + base verb' ('They planned to install solar panels').",
        blocks: [
          {
            blockId: "eng-u4-b1",
            type: "explanation",
            content: "Prepositions also trigger gerunds! After 'look forward to', 'interested in', or 'responsible for', always use V-ing ('We look forward to reducing school electricity waste').",
          },
          {
            blockId: "eng-u4-b2",
            type: "callout",
            variant: "pitfall",
            title: "Watch Out for 'suggest'",
            content: "Write 'She suggested recycling plastic bottles' (or 'suggested that we recycle'), NEVER 'She suggested to recycle'.",
          },
        ],
      },
      {
        id: "eng-u4-2",
        stage: "mechanism",
        title: "Meaning-Shift Verbs: stop, remember, try",
        body: "With 'stop', 'remember', and 'forget', the choice between V-ing and 'to + V' carries two completely different meanings.",
        blocks: [
          {
            blockId: "eng-u4-b3",
            type: "callout",
            variant: "tip",
            title: "Three High-Value Contrasts",
            content: "• stop V-ing = quit the habit ('stopped using single-use bags'); stop to V = pause another activity in order to do it ('stopped to pick up litter'). • remember V-ing = recall a past memory; remember to V = don't forget a future duty.",
          },
        ],
      },
      {
        id: "eng-u4-3",
        stage: "application",
        title: "Formal Email Structure for School & Sustainability Requests",
        body: "Formal emails require an informative Subject line, polite salutation ('Dear Principal Hassan,'), clear opening statement of purpose, concise supporting details, actionable closing, and appropriate sign-off ('Yours sincerely' if named; 'Yours faithfully' if 'Dear Sir/Madam').",
        blocks: [
          {
            blockId: "eng-u4-b4",
            type: "primary_source",
            quote: "Subject: Proposal for Classroom Paper-Recycling Bins — Dear Ms. Farouk, I am writing on behalf of Grade 10 to suggest placing labelled recycling bins in each corridor to cut weekly paper waste...",
            attribution: "Formal Email Opening — Unit 4 Communication Model",
            period: "Avoid slang or emojis; state purpose in the very first sentence",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Unpacking 'stop + V-ing' vs. 'stop + to V'",
        problem: "Explain the meaning contrast: (A) 'She stopped buying plastic bottles.' vs (B) 'She stopped to buy a reusable bottle.'",
        steps: [
          "1) 'stopped buying' uses the gerund: she ended/quit the habit of purchasing plastic bottles.",
          "2) 'stopped to buy' uses the to-infinitive of purpose: she paused her walk so she could purchase a reusable bottle.",
        ],
        takeaway: "'stop + V-ing' ends the action; 'stop + to V' gives the purpose for pausing.",
      },
    ],
    commonMistakes: [
      "Using 'to + infinitive' after 'avoid', 'enjoy', or 'suggest' (wrong: 'avoid to waste'; right: 'avoid wasting').",
      "Forgetting that 'look forward to' ends in the preposition 'to' and therefore takes V-ing ('look forward to seeing you').",
    ],
    questions: [
      {
        id: "pack-q-eng-4a",
        question_type: "multiple-choice",
        prompt: "Factories must avoid _____ untreated industrial waste into freshwater canals.",
        choices: ["dumping", "to dump", "dump", "dumped"],
        correct_index: 0,
        explanation: "'Avoid' is strictly followed by a gerund (V-ing): 'avoid dumping'.",
        hint: "Remember the gerund group: avoid, enjoy, finish, suggest + V-ing.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-eng-4b",
        question_type: "multiple-choice",
        prompt: "What does 'On her walk home, Nadia stopped to sort the recyclables' mean?",
        choices: [
          "She paused walking in order to sort the recyclables",
          "She permanently gave up sorting recyclables",
          "She never sorted recyclables again",
          "She threw the recyclables into mixed trash",
        ],
        correct_index: 0,
        explanation: "'Stop + to-infinitive' means pausing one action (walking) so you can perform another (sorting).",
        hint: "Did she quit sorting or pause walking for that purpose?",
        difficulty: "standard",
      },
      {
        id: "pack-q-eng-4c",
        question_type: "multiple-choice",
        prompt: "Which closing line matches an email addressed to 'Dear Mr. Kareem,' requesting recycling bins?",
        choices: [
          "Yours sincerely, Grade 10 Eco-Club",
          "See ya later!!",
          "Yours faithfully, (used for named recipients)",
          "Catch you soon, buddy",
        ],
        correct_index: 0,
        explanation: "Formal emails addressed to a named recipient close politely with 'Yours sincerely' or 'Kind regards'.",
        hint: "Check formal register and named-recipient sign-offs.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "stop + V-ing vs. stop + to + V", back: "stop wasting = quit wasting; stop to save = pause another task in order to save." },
      { front: "Gerund-Only Verbs", back: "avoid, enjoy, suggest, finish, keep, practice, look forward to + V-ing." },
      { front: "Formal Email Anatomy", back: "Clear Subject → Dear [Name/Title] → Purpose opening → Supporting details → Next step → Kind regards / Yours sincerely." },
    ],
  },

  // =========================================================================
  // 5. UNIT 5 — USING TECHNOLOGY AT SCHOOLS
  // =========================================================================
  {
    id: "pack-eng-5",
    lessonSlug: "eng-technology-schools",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 5,
    title: "Unit 5 — Using Technology at Schools",
    titleAr: "الوحدة ٥ — استخدام التكنولوجيا في المدارس",
    titleEn: "Unit 5 — Using Technology at Schools",
    hook: "Why does English ban 'two advices' and 'many informations' — and how does a tiny 'a' in 'a little' vs. 'little' change whether you have enough time?",
    summary:
      "Explores EdTech, digital dictionaries, and responsible AI learning tools alongside countable vs. uncountable nouns (advice, information, equipment, knowledge, homework) and quantifiers (some, any, much, many, a few/few, a little/little).",
    formulaOrRule: "Uncountables (no plural -s, no a/an): advice, information, equipment, knowledge, homework; Countable: many, a few/few; Uncountable: much, a little/little",
    keyConcepts: [
      {
        id: "eng-u5-1",
        stage: "foundation",
        title: "Uncountable Traps in Academic English",
        body: "Unlike Arabic, nouns such as advice, information, knowledge, equipment, news, and homework are uncountable in English: they take singular verbs and NEVER add -s or a/an directly.",
        formulaOrRule: "Count uncountables using a partitive noun: 'a piece of advice', 'two items of information'.",
        blocks: [
          {
            blockId: "eng-u5-b1",
            type: "explanation",
            content: "Compare: 'Our school bought modern lab equipment' (singular verb/noun) vs. 'Our school bought twelve modern tablets' (plural countable noun).",
          },
          {
            blockId: "eng-u5-b2",
            type: "callout",
            variant: "pitfall",
            title: "Never Pluralize These Five Words",
            content: "Cross out on sight: advices, informations, equipments, homeworks, knowledges. Always pair them with 'some', 'much', 'a lot of', or 'a piece of'.",
          },
        ],
      },
      {
        id: "eng-u5-2",
        stage: "mechanism",
        title: "Quantifier Nuance: 'a few / a little' vs. 'few / little'",
        body: "'A few' (countable) and 'a little' (uncountable) mean a small but positive/helpful amount. Dropping the article ('few' / 'little') signals scarcity — almost none, not enough.",
        blocks: [
          {
            blockId: "eng-u5-b3",
            type: "explanation",
            content: "Contrast: 'We still have a little time, so let's test one more example' (hopeful sufficiency) vs. 'We have little time left before the bell rings' (urgent shortage).",
          },
        ],
      },
      {
        id: "eng-u5-3",
        stage: "application",
        title: "Evaluating EdTech & AI Tools Critically",
        body: "Balanced classroom technology uses digital dictionaries, spaced-repetition quizzes, and AI explanations as study aids while checking facts, protecting student privacy, and keeping original thinking central.",
        blocks: [
          {
            blockId: "eng-u5-b4",
            type: "primary_source",
            quote: "A smart study platform gives you instant feedback and a few targeted hints, yet only active practice on your own turns hints into lasting knowledge.",
            attribution: "EdTech Balance Reflection — Unit 5 Reader",
            period: "Key contrast: countable 'hints' ('a few') vs. uncountable 'feedback / knowledge'",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Repairing Uncountable Noun & Quantifier Errors",
        problem: "Fix every grammar mistake: 'The AI tutor gave me an useful advice and many informations about pronunciation.'",
        steps: [
          "1) Identify uncountables: 'advice' and 'information' cannot take 'a/an' or plural '-s'.",
          "2) Repair 'an useful advice' → 'some useful advice' or 'a useful piece of advice'.",
          "3) Repair 'many informations' → 'much information' or 'a lot of useful information'.",
        ],
        takeaway: "Always run the plural check first: if a noun is uncountable in English, swap 'many/a few' for 'much/a little' or add 'a piece of'.",
      },
    ],
    commonMistakes: [
      "Pluralizing uncountable nouns ('advices', 'informations', 'homeworks', 'equipments') or placing 'a/an' directly before them.",
      "Confusing 'a little' (some helpful amount) with 'little' (almost none).",
    ],
    questions: [
      {
        id: "pack-q-eng-5a",
        question_type: "multiple-choice",
        prompt: "Our school lab still lacks _____ modern equipment, and we only have _____ minutes to test the app.",
        choices: ["much / a few", "many / a little", "many / little", "some / much"],
        correct_index: 0,
        explanation: "'Equipment' is uncountable (takes 'much' rather than 'many'), and 'minutes' is plural countable (takes 'a few').",
        hint: "Check whether 'equipment' and 'minutes' can take plural -s.",
        difficulty: "standard",
      },
      {
        id: "pack-q-eng-5b",
        question_type: "multiple-choice",
        prompt: "Which phrase is grammatically correct in Standard English?",
        choices: [
          "two helpful pieces of advice",
          "two helpful advices",
          "an useful information",
          "many new homeworks",
        ],
        correct_index: 0,
        explanation: "'Advice', 'information', and 'homework' are uncountable and require 'pieces of' rather than plural -s or 'a/an'.",
        hint: "Find the option that uses a partitive expression ('pieces of').",
        difficulty: "foundational",
      },
      {
        id: "pack-q-eng-5c",
        question_type: "multiple-choice",
        prompt: "The teacher smiled because _____ students had already verified every citation using the digital dictionary.",
        choices: ["a few", "little", "much", "a little"],
        correct_index: 0,
        explanation: "'Students' is plural countable; 'a few' gives a positive small number fitting 'smiled', whereas 'little/much/a little' require uncountable nouns.",
        hint: "Countable plural noun + positive tone.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "Key Uncountable Nouns in Sec. 1", back: "advice, information, knowledge, equipment, homework, news (use singular verb & 'a piece of', never plural -s)." },
      { front: "a few / a little vs. few / little", back: "'a few / a little' = a small positive amount; 'few / little' = hardly any (negative sufficiency nuance)." },
      { front: "Responsible EdTech Collocations", back: "digital dictionary, instant feedback, verify citations, data privacy, balanced study routine." },
    ],
  },
];
