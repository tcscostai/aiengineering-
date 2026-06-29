       IDENTIFICATION DIVISION.
       PROGRAM-ID. PASAUTH.
      ******************************************************************
      * PASAUTH — Prior authorization validation (FHIR PAS migration)   *
      ******************************************************************
       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY CLAIM-REC.
           01  WS-AUTH-API-KEY        PIC X(32) VALUE 'legacy-pas-key-DEMO-ONLY'.
      * TODO: migrate to FHIR PAS $submit-operation
       LINKAGE SECTION.
           01  LK-CLAIM               PIC X(200).
       PROCEDURE DIVISION USING LK-CLAIM.
           MOVE LK-CLAIM TO CLAIM-RECORD.
           IF CLM-PRIOR-AUTH-NUM = SPACES
               SET CLM-DENIED TO TRUE
           END-IF.
           MOVE CLAIM-RECORD TO LK-CLAIM.
           GOBACK.
