import type {CoachContext} from "./contextual-coach.ts";
function context(heading:string,intro:string,actions:readonly (readonly [string,string,string,string])[]):CoachContext{
 return {heading,intro,actions:actions.map(([id,label,description,prompt])=>({id,label,description,prompt}))};
}
export const EN_COACH_CONTEXTS:Record<string,CoachContext>={
 "/":context("Find your next step","Learning suggestions based on what you choose to share",[
  ["today","Plan my study day","A realistic, editable plan","Help me plan a balanced study day. First ask about my subjects, available time and deadlines. Do not assume my schedule or personal information."],
  ["discover","Choose a starting topic","Find a useful first step","Help me choose a topic to study. Ask about my grade, subjects and goals. Do not assume access to my lessons or recorded progress."],
  ["quiz","Create a short practice quiz","Informal practice","Help me create an interactive practice quiz on a topic I choose. Wait for my answers before marking them and explain mistakes. This is informal practice, not an official assessment or a source of XP."]
 ]),
 "/learn":context("Your learning companion","Understand your options and choose a path",[
  ["roadmap","Build a learning map","Organize topics and priorities","Ask about my subject, level and goal, then build a gradual learning map. Do not assume access to Noata courses or that lessons exist unless I describe them."],
  ["concept","Explain a concept","An example, then practice","Ask which concept I want to learn, then explain it step by step with an example and a suitable practice question."],
  ["plan","Plan a unit","Break the work into sessions","Help me divide a unit I choose into realistic understanding, practice and review sessions. Ask about my available time and the unit content before suggesting a plan."]
 ]),
 "/missions":context("Mission coach","Practice and explanations without revealing active assessment answers",[
  ["prepare","Prepare for a mission","Practice before assessment","Help me prepare for a three-stage learning mission. Ask about the topic, then offer an independent practice example without claiming to know official Noata questions."],
  ["mistake","Understand my mistake","Learn after an attempt","I will describe a question I attempted and my answer. Help me understand the confusion after the attempt without supplying answers to an active assessment or changing its result."],
  ["practice","Create similar practice","Additional informal practice","Create three progressively harder practice questions on a topic I choose. Do not claim they are official Noata mission questions or that they award points."]
 ]),
 "/review":context("Review companion","Strengthen understanding using examples you provide",[
  ["memory","Plan spaced review","Timing that works for you","Ask about my topic, confidence and exam date, then suggest realistic spaced review sessions without claiming access to my records."],
  ["recall","Test my recall","Active recall questions","Start an active recall session on a topic I choose. Ask one question at a time and wait for my answer before explaining and correcting it."],
  ["explain","Explain a difficult idea","Examples and simplification","Ask which idea I find difficult, then teach it using two progressive examples and an independent check question."]
 ]),
 "/boss":context("Unit challenge coach","Prepare or review your attempt with assessment integrity",[
  ["prepare","Practice before the challenge","Understand difficult concepts","Prepare me for a unit challenge I choose with a concept review and informal practice questions. Do not reveal or predict answers to an active assessment."],
  ["after","Review my mistakes","Learn from your attempt","I will describe mistakes after completing a challenge. Help me find their causes and build a short improvement plan without assuming my score or writing grades to the platform."],
  ["next","Plan my next attempt","Focus on learning","Help me prepare for my next challenge attempt. Ask about the unit and the ideas I found difficult."]
 ]),
 "/progress":context("Understand your progress","Mastery needs evidence as well as numbers",[
  ["meaning","Understand mastery indicators","What do the levels mean?","Explain average mastery, reviews due and independent answer evidence without assuming access to my account data."],
  ["reflect","Plan improvements","Maintain what you have learned","Help me write a weekly learning reflection. Ask for actual examples before identifying strengths or weaknesses."],
  ["schedule","Plan around my goals","Use the time you provide","Ask about my subjects, goals and actual available time, then draft an editable weekly schedule. Do not save it to my account automatically."]
 ]),
 "/rewards":context("Your rewards guide","Understand earned rewards and confirmed balances",[
  ["rules","How do I earn XP?","Understand eligibility","Explain XP, Coins, Gems and achievements. Actual balances come from confirmed Noata server transactions; a chat cannot create balances."],
  ["goals","Set a learning goal","Focus on understanding","Help me set a goal measured by skills learned, rather than pressure to collect Coins, then suggest suitable practice activities."],
  ["receipts","Understand a reward record","Confirmed and pending rewards","Help me understand a reward record I describe: expected, granted, pending and duplicate rewards. Do not claim access to or change my balance."]
 ]),
 "/assignments":context("Assignment companion","Organize your work and ask questions before submitting yourself",[
  ["divide","Break down an assignment","Small steps and review","I will provide an assignment title, deadline and available time. Help me divide it into small tasks and reviews without assuming you can read or submit it."],
  ["understand","Understand the instructions","Clarify what is required","I will share the assignment instructions. Help me understand them and explain how to complete the work myself. Do not provide a finished answer to present as my own work."],
  ["deadline","Plan before the deadline","A realistic schedule","Ask about my deadline and other work, then suggest an order for completing and reviewing the assignment. Do not create reminders or change deadlines automatically."]
 ]),
 "/quran":context("Careful Quran study support","Quran text is verified; explanations need reliable sources",[
  ["reference","Understand a verse","Use verified explanations","First ask for the surah and verse. Do not invent Quran text or attribute commentary without a verified source. Distinguish the Quran text from your explanation."],
  ["vocabulary","Explore word meanings","Language support","Ask which verse and word I want to understand. Explain its linguistic meaning and the limits of your verification of tafsir sources."],
  ["memorize","Plan memorization and review","A calm, suitable routine","Ask which surahs I want to memorize and my available time. Suggest a comfortable memorization and review plan without turning worship into a points competition."]
 ]),
 "/notifications":context("Organize what is ahead","The assistant sees only the information you share",[
  ["prioritize","Organize my priorities","Plan using events you provide","I will describe deadlines and notifications. Help me prioritize them without claiming to read my Noata inbox or create reminders."],
  ["understand","Understand a notification","Choose a next step","I will share an educational notification without sensitive information. Help me understand it and choose the next action."],
  ["routine","Build a follow-up routine","Practical checks","Suggest a short routine for checking assignments, notes and notifications without claiming you enabled automatic alerts."]
 ]),
 "/teacher":context("Teacher companion","Reviewable drafts with decisions left to the teacher",[
  ["rubric","Draft an assessment rubric","Clear, reviewable criteria","Help me draft a clear assessment rubric for an activity I choose, with fair performance levels. Do not assign grades or access student information without permission."],
  ["question","Draft a review question","Content awaiting approval","Suggest practice questions, answers and explanations for a skill I choose, for my review. Do not claim to publish them or approve them for the curriculum."],
  ["feedback","Draft learning feedback","Encouraging, precise language","Help me draft general learning feedback on a topic I choose without sharing student names or records. I remain responsible for approving any official assessment."]
 ]),
 "/admin":context("Platform operations companion","Guidance with no automatic administrative changes",[
  ["checklist","Prepare an audit checklist","Permissions and services","Create an educational platform checklist covering content, security, accessibility and privacy. Do not claim to inspect or modify my actual database."],
  ["content","Review lesson quality","Improve educational content","Help me build review criteria for Arabic and English lesson content before publication. Do not publish content automatically."],
  ["incident","Investigate a problem","A safe diagnostic plan","I will describe a platform problem without secrets. Prepare safe diagnosis, verification, repair and rollback steps without claiming access to private logs."]
 ]),
 "/settings":context("Personalize your experience","Understand preferences before changing them yourself",[
  ["theme","Choose a visual theme","Comfortable reading","Help me compare Noata themes for visual comfort and accessibility. I will change the theme myself in Settings."],
  ["privacy","Understand privacy options","Clear guidance","Explain privacy considerations when using an AI assistant with study files and what I should avoid sharing. Do not claim to change my preferences."],
  ["accessibility","Choose accessible settings","Make reading comfortable","Ask about my reading, motion and text-size preferences, then suggest settings I can apply myself."]
 ]),
 "/help":context("Help at every step","Solve problems while keeping your account secure",[
  ["login","Troubleshoot sign-in","Safe diagnostics","Help me diagnose a Noata sign-in problem from symptoms I describe. Never ask for passwords, verification codes or API keys."],
  ["audio","Troubleshoot audio","Playback checks","Help me diagnose recitation or browser audio problems. Ask for non-sensitive device, surah and reciter details. Do not claim to test a link yourself."],
  ["device","Noata on my device","Practical steps","Help me diagnose a Noata interface problem using my browser and screen size, with safe, simple steps."]
 ]),
 "/lesson":context("Lesson companion","Learn concepts without changing your official assessment",[
  ["explain","Understand this lesson","A step-by-step explanation","I will provide a Noata lesson title. Explain its concepts gradually and ask a check question before continuing. Do not claim to read the lesson unless I share it."],
  ["example","Explore a worked example","Steps and reasons","Ask about the lesson topic, then offer a worked example explaining each step and an independent practice question at the end."],
  ["recap","Create a summary","Key ideas and recall","I will describe the lesson I studied. Help me summarize my understanding and create review cards without claiming to complete the lesson in my account."]
 ])
};
