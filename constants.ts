
import { Workspace, Document } from './types';

export const CURRENT_WORKSPACE_ID = 'ws-dkm-global-ops';
export const CURRENT_USER_ID = 'dkm-officer-antwerp-1';

export const SYSTEM_INSTRUCTION = `
You are the "Eburon DKM Customs AI Assistant", an expert system specialized in the logistics and customs services provided by DKM Customs (dkm-customs.com).

PRIMARY FOCUS AREAS:
1. CUSTOMS REPRESENTATION: Handling Import (IMA), Export (EXA), and Transit (T1/T2/T2L) declarations via the PLDA and NCTS systems. Expertise in Antwerp, Zeebrugge, and Liège hubs.
2. FISCAL REPRESENTATION: Managing Limited Fiscal Representation (LFR) for non-Belgian companies, ensuring correct VAT treatment for intra-community supplies (ICS).
3. VETERINARY & PHYTOSANITARY: Coordination with FAVV/AFSCA for food and plant safety. Handling CHED-P, CHED-D, and CHED-PP documents.
4. BREXIT COMPLIANCE: Specialized workflows for UK-EU trade, including EORI verification and origin of goods.
5. LOGISTICS & WAREHOUSING: Managing cross-docking, temperature-controlled storage (2-8°C / 15-25°C), and value-added services like picking/packing.

GOVERNANCE RULES:
- Use the provided Governance Corpus (ingested documents) as the "single source of truth".
- Always cite specific documents by their Title or ID when providing regulatory advice.
- Maintain strict compliance with the Union Customs Code (UCC) and GDPR (RGPD) for sensitive shipping data.
- If a document is under "Legal Hold", prioritize its data in any compliance-related queries.
`;

export const MOCK_WORKSPACE: Workspace = {
  id: CURRENT_WORKSPACE_ID,
  name: 'DKM Customs - European Gateway Hub',
  ownerId: CURRENT_USER_ID,
};

export const MOCK_DOCS: Document[] = [
  {
    id: 'dkm-doc-001',
    workspaceId: CURRENT_WORKSPACE_ID,
    title: 'Import_Declaration_Case_BE24098.pdf',
    sourceType: 'upload',
    status: 'ready',
    ocrStatus: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    mimeType: 'application/pdf',
    bytes: 2450000,
    text: 'DKM Customs Import Summary: Goods: Industrial machinery components. Origin: Shanghai, CN. Destination: Ghent, BE. HS Code: 84798997. Customs value: 45,000 EUR. Duty: 1.7%. Status: Cleared by PLDA.'
  },
  {
    id: 'dkm-doc-002',
    workspaceId: CURRENT_WORKSPACE_ID,
    title: 'Veterinary_CHED_P_Certificate_Poultry.png',
    sourceType: 'upload',
    status: 'ready',
    ocrStatus: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    mimeType: 'image/png',
    bytes: 5600000,
    text: 'OCR Extraction (CHED-P): Veterinary certificate #DKM-VET-2024-911. Product: Deep-frozen chicken fillets. Inspection station: BIP Antwerp. Agency: FAVV/AFSCA. Result: PASSED. Authorized for free circulation.'
  },
  {
    id: 'dkm-doc-003',
    workspaceId: CURRENT_WORKSPACE_ID,
    title: 'Fiscal_Rep_VAT_Ledger_Q1_2024.xlsx',
    sourceType: 'upload',
    status: 'ready',
    ocrStatus: 'not_required',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    bytes: 1200000,
    text: 'DKM Limited Fiscal Representation Ledger. Summarizes VAT deferment for 42 non-Belgian importers. Total Intra-Community Supplies reported to FPS Finance: 1.2M EUR. Compliance Check: 100% accurate.'
  },
  {
    id: 'dkm-doc-004',
    workspaceId: CURRENT_WORKSPACE_ID,
    title: 'Brexit_Transit_T1_Protocol_V3.docx',
    sourceType: 'upload',
    status: 'ready',
    ocrStatus: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: 450000,
    text: 'Internal Protocol: Transit T1 procedures for goods originating from the UK (Post-Brexit). DKM ensures financial guarantee coverage for NCTS transit from Zeebrugge to Germany. Key requirement: Valid EORI and origin statement.'
  },
  {
    id: 'dkm-doc-005',
    workspaceId: CURRENT_WORKSPACE_ID,
    title: 'Warehouse_Temp_Control_Logs_Pharma.csv',
    sourceType: 'upload',
    status: 'ready',
    ocrStatus: 'not_required',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    mimeType: 'text/csv',
    bytes: 32000,
    text: 'Sensor Logs: DKM Cold Storage Zone A. Range: 2-8°C. Period: 2024-05-20 to 2024-05-21. No deviations detected. Validated for Pharmaceutical logistics standards (GDP).'
  },
  {
    id: 'dkm-doc-006',
    workspaceId: CURRENT_WORKSPACE_ID,
    title: 'Export_Declaration_Customs_Release.pdf',
    sourceType: 'upload',
    status: 'processing',
    ocrStatus: 'pending',
    createdAt: new Date().toISOString(),
    mimeType: 'application/pdf',
    bytes: 890000,
    text: 'Awaiting OCR analysis for Export MRN... Target: Chemicals to Singapore.'
  }
];
