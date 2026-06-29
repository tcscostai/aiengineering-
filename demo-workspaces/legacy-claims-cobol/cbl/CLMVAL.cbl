       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMVAL.
      ******************************************************************
      * CLMVAL — Claim validation service                               *
      ******************************************************************
       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY CLAIM-REC.
       LINKAGE SECTION.
           01  LK-CLAIM               PIC X(200).
       PROCEDURE DIVISION USING LK-CLAIM.
           MOVE LK-CLAIM TO CLAIM-RECORD.
           IF CLM-MEMBER-ID = SPACES OR CLM-PROC-CODE = SPACES
               SET CLM-DENIED TO TRUE
           END-IF.
           MOVE CLAIM-RECORD TO LK-CLAIM.
           GOBACK.
