export type TopicStatus = 'nao_iniciado' | 'estudando' | 'revisando' | 'dominado'

export interface Topic {
  id: string
  discipline: string
  group: string
  officialItem: string
  title: string
  minutes: number
  part: string
  officialQuestions: number
  legacyId?: string
}

export interface ProgressItem { topicId:string; status:TopicStatus; updatedAt:string|null }
export interface StudySession { id?:string; topicId?:string; topicTitle?:string; discipline?:string; group?:string; type?:string; durationSeconds:number; objective?:string; date:string; createdAt?:string }
export interface QuestionSession { id:string; topicId:string; discipline:string; topicTitle:string; bank?:string; year?:number; total:number; correct:number; wrong:number; accuracy:number; reason?:string; notes?:string; date:string; createdAt?:string }
export interface ErrorRecord { id:string; topicId:string; title?:string; note?:string; reason?:string; date:string; resolved?:boolean; tags?:string[]; questionSessionId?:string }
export interface ReviewRecord { id:string; topicId:string; due:string; interval:number; ease:number; count:number; lastRating?:string|null; lastReviewed?:string|null }
export interface Flashcard { id:string; topicId:string; front:string; back:string; tags?:string[]; due?:string; interval?:number; ease?:number; lapses?:number; lastRating?:string|null; favorite?:boolean }
export interface Simulation { id:string; date:string; total?:number; correct?:number; percent:number; name?:string; durationMinutes?:number }
export interface FormulaItem { id:string; topic:string; title:string; formula:string; note:string; lapses?:number; last?:string|null; favorite?:boolean }
export interface DiagnosticAttempt { id?:string; date?:string; total?:{pct:number}; [key:string]:unknown }
export interface AppSettings { weeklyHoursGoal:number; weeklyQuestionsGoal:number; dailyMinutesGoal:number; firstCycleTarget:string; theme:'light'|'dark'; focusPreset:number; sidebarCollapsed:boolean; displayName?:string }
export interface AppMeta { updatedAt?:string; lastBackupAt?:string; migratedToReactAt?:string; sourceVersion?:string }
export interface AppState {
  version:string
  progress:ProgressItem[]
  sessions:StudySession[]
  questionSessions:QuestionSession[]
  errors:ErrorRecord[]
  reviews:ReviewRecord[]
  flashcards:Flashcard[]
  questionBank:unknown[]
  simulations:Simulation[]
  discursives:unknown[]
  practicals:unknown[]
  formulas:FormulaItem[]
  micro:{answered:number;correct:number}
  dailyDone:Record<string,boolean>
  pinnedTopics:string[]
  achievementsSeen:string[]
  diagnostic:{attempts:DiagnosticAttempt[];draft:unknown;activeResultId:string|null;review:boolean}
  settings:AppSettings
  createdAt:string
  meta?:AppMeta
  [key:string]:unknown
}

export interface TimerState { topicId:string|null; seconds:number; running:boolean; startedAt:number|null; anchorSeconds:number; preset:number; type:string; mode:'countdown'|'countup'; questionTotal:number; questionCorrect:number; questionBank:string; questionYear:number; questionReason:string }
export type PageId = 'home'|'plan'|'study'|'contents'|'questions'|'reviews'|'performance'|'simulations'|'materials'|'history'|'settings'
