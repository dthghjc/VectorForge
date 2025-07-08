export interface RAGRecall {
    id: string;
    snippet: string;
    source: string;
    relevanceToQuestion: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';
    supportToResponse: 'full' | 'partial' | 'none' | '';
    hasError: boolean;
    errorDetails: string;
    isRedundant: boolean;
    improvementSuggestion: string;
  }
  
  export interface LLMResponse {
    id: string;
    content: string;
    relevance: 'strong' | 'relevant' | 'weak' | 'irrelevant' | '';
    fluency: 'very_fluent' | 'fluent' | 'not_fluent' | '';
    hasHallucination: boolean;
    hallucinationDetails: string;
    compliance: 'compliant' | 'risky' | 'violation' | 'unknown' | '';
    violationTypes: string[];
    violationDetails: string;
    improvementSuggestion: string;
    ragRecalls?: RAGRecall[];
  }
  
  export interface DialogueTurn {
    id: string;
    role: 'user' | 'llm';
    content: string;
    llmResponse?: LLMResponse;
  }
  
  export interface AnnotationTask {
    id: string;
    dialoguePreview: string;
    status: 'pending' | 'annotated' | 'reviewing' | 'approved' | 'rejected';
    llmModel: string;
    ragEnabled: boolean;
    annotator: string;
    lastUpdate: string;
    dialogue: DialogueTurn[];
    intentCategory: 'information_query' | 'instruction_following' | 'content_creation' | 'chat' | '';
    completeness: 'complete' | 'incomplete' | '';
    overallSatisfaction: number;
    generalNotes: string;
  }