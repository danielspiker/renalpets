export type IncidentType =
  | "vomit_with_food"
  | "vomit_without_food"
  | "hairball"
  | "diarrhea"
  | "blood_in_stool"
  | "constipation"
  | "food_refusal"
  | "hematuria"
  | "polyuria"
  | "polydipsia"
  | "litter_box_miss"
  | "lethargy"
  | "tremor_seizure"
  | "dyspnea"
  | "pain_vocalization"
  | "acute_event"
  | "subq_fluids"
  | "medication"
  | "exam_sample"
  | "vet_visit"
  | "other";

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  vomit_with_food: "Vômito com comida",
  vomit_without_food: "Vômito sem comida (bilioso, espuma)",
  hairball: "Hairball (bola de pelo)",
  diarrhea: "Diarreia",
  blood_in_stool: "Sangue nas fezes",
  constipation: "Constipação / fezes presas",
  food_refusal: "Recusa alimentar",
  hematuria: "Sangue na urina (hematúria)",
  polyuria: "Xixi excessivo (poliúria)",
  polydipsia: "Sede excessiva (polidipsia)",
  litter_box_miss: "Xixi fora da caixa",
  lethargy: "Letargia / apatia",
  tremor_seizure: "Tremor / convulsão",
  dyspnea: "Dispneia / respiração ofegante",
  pain_vocalization: "Vocalização de dor",
  acute_event: "Episódio agudo (queda, trauma)",
  subq_fluids: "Fluidoterapia subcutânea aplicada",
  medication: "Medicação administrada",
  exam_sample: "Coleta de exame (sangue/urina)",
  vet_visit: "Visita ao veterinário",
  other: "Outros",
};

export const MANAGEMENT_TYPES = new Set<IncidentType>([
  "subq_fluids",
  "medication",
  "exam_sample",
  "vet_visit",
]);

export function isManagement(t: IncidentType): boolean {
  return MANAGEMENT_TYPES.has(t);
}

export const INCIDENT_GROUPS: {
  label: string;
  items: IncidentType[];
}[] = [
  {
    label: "Gastrointestinal",
    items: [
      "vomit_with_food",
      "vomit_without_food",
      "hairball",
      "diarrhea",
      "blood_in_stool",
      "constipation",
      "food_refusal",
    ],
  },
  {
    label: "Urinário",
    items: ["hematuria", "polyuria", "polydipsia", "litter_box_miss"],
  },
  {
    label: "Sistêmico",
    items: [
      "lethargy",
      "tremor_seizure",
      "dyspnea",
      "pain_vocalization",
      "acute_event",
    ],
  },
  {
    label: "Manejo",
    items: ["subq_fluids", "medication", "exam_sample", "vet_visit"],
  },
  {
    label: "Outros",
    items: ["other"],
  },
];
