// CEFR level sentences and test data
export const CEFR_LEVELS = {
    A1: {
        name: "Beginner",
        description: "Basic words and simple phrases",
        sentences: [
            { text: "I am happy today", idealDuration: 3 },
            { text: "The cat is black", idealDuration: 3 },
            { text: "My name is John", idealDuration: 3 },
            { text: "I like pizza very much", idealDuration: 4 },
            { text: "The sun is bright", idealDuration: 3 }
        ]
    },
    A2: {
        name: "Elementary", 
        description: "Simple sentences about familiar topics",
        sentences: [
            { text: "I went to the store yesterday", idealDuration: 4 },
            { text: "She lives in a big house", idealDuration: 4 },
            { text: "We usually have breakfast at eight", idealDuration: 5 },
            { text: "The weather is very nice today", idealDuration: 4 },
            { text: "I can speak English a little", idealDuration: 5 }
        ]
    },
    B1: {
        name: "Intermediate",
        description: "Clear sentences about familiar matters",
        sentences: [
            { text: "I have been working here for three years", idealDuration: 5 },
            { text: "If I had more time, I would travel around the world", idealDuration: 7 },
            { text: "The movie was more interesting than I expected", idealDuration: 6 },
            { text: "She decided to quit her job and start her own business", idealDuration: 8 },
            { text: "Technology has changed the way we communicate", idealDuration: 6 }
        ]
    },
    B2: {
        name: "Upper Intermediate",
        description: "Complex sentences on concrete and abstract topics",
        sentences: [
            { text: "The comprehensive analysis revealed significant discrepancies in the data", idealDuration: 8 },
            { text: "Environmental sustainability requires unprecedented global cooperation", idealDuration: 7 },
            { text: "Despite the challenging circumstances, the team maintained their optimism", idealDuration: 8 },
            { text: "The implementation of artificial intelligence has revolutionized various industries", idealDuration: 9 },
            { text: "Social media platforms have fundamentally altered interpersonal communication", idealDuration: 8 }
        ]
    },
    C1: {
        name: "Advanced",
        description: "Complex texts with implicit meaning",
        sentences: [
            { text: "The paradigmatic shift in contemporary epistemological frameworks necessitates rigorous reassessment", idealDuration: 10 },
            { text: "Multifaceted socioeconomic variables contribute to the perpetuation of systemic inequalities", idealDuration: 9 },
            { text: "The intricate interplay between cognitive biases and decision-making processes merits investigation", idealDuration: 10 },
            { text: "Technological determinism versus social construction represents an ongoing academic discourse", idealDuration: 9 },
            { text: "The phenomenological approach elucidates subjective experiences within objective frameworks", idealDuration: 9 }
        ]
    },
    C2: {
        name: "Proficient",
        description: "Complex academic and professional texts",
        sentences: [
            { text: "The hermeneutical explication of postmodern dialectical tensions necessitates phenomenological deconstruction", idealDuration: 11 },
            { text: "Epistemological relativism challenges foundationalist presuppositions through metacognitive reflexivity", idealDuration: 10 },
            { text: "The ontological implications of quantum indeterminacy transcend classical mechanistic paradigms", idealDuration: 10 },
            { text: "Poststructuralist critiques of logocentrism reveal inherent aporias in Western philosophical traditions", idealDuration: 11 },
            { text: "The intertextual dynamics of meaning-making processes subvert hegemonic discursive formations", idealDuration: 10 }
        ]
    }
};

export const GRADE_THRESHOLDS = {
    C2: 92,
    C1: 85,
    B2: 75,
    B1: 65,
    A2: 55,
    A1: 0
};

export const SCORING_WEIGHTS = {
    pronunciation: 0.4,
    fluency: 0.3,
    completeness: 0.2,
    clarity: 0.1
};